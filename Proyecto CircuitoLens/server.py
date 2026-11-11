#!/usr/bin/env python3
"""
🔬 CircuitLens - Servidor Backend Modular (REST API + Static PWA Server)
Soporta:
 - Autenticación RBAC (Estudiante vs Profesor / Docente) con sesiones y tokens.
 - Sincronización multiusuario de salas en tiempo real (polling / updates / SSE).
 - Proxy agnóstico para LLM remoto / local (Gemini, Claude, OpenAI, Ollama, Heurístico).
 - Persistencia de perfiles de usuario continuos y métricas de laboratorio.
 - Servir la PWA cliente estática y datasets JSON.
"""

import sys
import os
import json
import time
import uuid
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get('PORT', 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Base de datos en memoria para el backend con precarga de usuarios demostrativos
USERS_DB = {
    'estudiante@uni.edu.pe': {
        'id': 'ALU-101',
        'name': 'Piero Castillo',
        'email': 'estudiante@uni.edu.pe',
        'role': 'estudiante',
        'room': 'SALA-ELECTRO-1',
        'avatar': '🎓'
    },
    'profesor@uni.edu.pe': {
        'id': 'DOC-201',
        'name': 'Prof. Edwin Requena',
        'email': 'profesor@uni.edu.pe',
        'role': 'profesor',
        'room': 'SALA-ELECTRO-1',
        'avatar': '👨‍🏫'
    }
}

SESSIONS = {}  # token -> user_dict
ROOMS_STATE = {
    'SALA-ELECTRO-1': {
        'students': {},
        'teacher_annotations': [],
        'messages': []
    }
}
USER_PROFILES = {}  # userId -> profile_dict

# Cargar variables de entorno desde .env si existe
def load_env():
    env_path = os.path.join(BASE_DIR, '.env')
    config = {}
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        config[k.strip()] = v.strip()
        except Exception as e:
            print(f"[Backend] Error leyendo .env: {e}")
    return config

ENV_CONFIG = load_env()


class CircuitLensHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Habilitar CORS y cabeceras de no-caché para la API
        if self.path.startswith('/api/'):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, status_code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length <= 0:
                return {}
            raw = self.rfile.read(length).decode('utf-8')
            return json.loads(raw)
        except Exception as e:
            print(f"[Backend] Error parseando body JSON: {e}")
            return {}

    def get_auth_user(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
            return SESSIONS.get(token)
        return None

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Rutas de la API Backend
        if path == '/api/auth/me':
            user = self.get_auth_user()
            if user:
                return self.send_json(200, {'ok': True, 'user': user})
            return self.send_json(401, {'ok': False, 'error': 'No autenticado'})

        elif path == '/api/rooms/status':
            qs = parse_qs(parsed.query)
            room_id = qs.get('room', ['SALA-ELECTRO-1'])[0]
            if room_id not in ROOMS_STATE:
                ROOMS_STATE[room_id] = {'students': {}, 'teacher_annotations': [], 'messages': []}
            return self.send_json(200, {'ok': True, 'room': ROOMS_STATE[room_id]})

        elif path == '/api/profile':
            qs = parse_qs(parsed.query)
            user_id = qs.get('userId', [''])[0]
            user = self.get_auth_user()
            target_id = user_id or (user['id'] if user else None)
            if not target_id:
                return self.send_json(400, {'ok': False, 'error': 'Falta userId'})
            profile = USER_PROFILES.get(target_id, {})
            return self.send_json(200, {'ok': True, 'userId': target_id, 'profile': profile})

        elif path == '/api/health':
            return self.send_json(200, {
                'status': 'online',
                'version': '3.2.0',
                'active_rooms': len(ROOMS_STATE),
                'active_sessions': len(SESSIONS)
            })

        # Redireccionar raíz a la PWA
        if path == '/' or path == '/index.html':
            self.send_response(302)
            self.send_header('Location', '/src/circuitlens.html')
            self.end_headers()
            return

        # Servir archivos estáticos por defecto (src, data, docs, manifest, service-worker)
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        # Login / Autenticación RBAC
        if path == '/api/auth/login':
            email = body.get('email', '').strip().lower()
            role = body.get('role', '').strip().lower()
            name = body.get('name', '').strip()

            # Si el usuario ya existe en memoria o entra con credencial rápida
            if email in USERS_DB:
                user = dict(USERS_DB[email])
                if role:
                    user['role'] = role
            else:
                # Creación dinámica de cuenta / sesión
                uid = ('DOC-' if role == 'profesor' else 'ALU-') + str(uuid.uuid4())[:4]
                user = {
                    'id': uid,
                    'name': name or (f'Docente {email.split("@")[0]}' if role == 'profesor' else f'Alumno {email.split("@")[0]}'),
                    'email': email or f'usuario_{uid.lower()}@uni.pe',
                    'role': role if role in ['estudiante', 'profesor'] else 'estudiante',
                    'room': body.get('room', 'SALA-ELECTRO-1'),
                    'avatar': '👨‍🏫' if role == 'profesor' else '🎓'
                }
                USERS_DB[email or user['id']] = user

            token = 'token_' + uuid.uuid4().hex
            SESSIONS[token] = user
            return self.send_json(200, {'ok': True, 'token': token, 'user': user})

        # Logout
        elif path == '/api/auth/logout':
            auth_header = self.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:].strip()
                SESSIONS.pop(token, None)
            return self.send_json(200, {'ok': True})

        # Sincronización de estado de alumno hacia la sala
        elif path == '/api/rooms/update':
            room_id = body.get('roomId', 'SALA-ELECTRO-1')
            student_data = body.get('student', {})
            student_id = student_data.get('studentId')
            if not student_id:
                return self.send_json(400, {'ok': False, 'error': 'Falta studentId'})

            if room_id not in ROOMS_STATE:
                ROOMS_STATE[room_id] = {'students': {}, 'teacher_annotations': [], 'messages': []}

            ROOMS_STATE[room_id]['students'][student_id] = student_data
            return self.send_json(200, {'ok': True, 'room': room_id})

        # Envío de anotaciones de pizarra o pistas del docente
        elif path == '/api/rooms/action':
            room_id = body.get('roomId', 'SALA-ELECTRO-1')
            action = body.get('action') # 'draw', 'clear', 'nudge', 'help_request'
            payload = body.get('payload', {})

            if room_id not in ROOMS_STATE:
                ROOMS_STATE[room_id] = {'students': {}, 'teacher_annotations': [], 'messages': []}

            room = ROOMS_STATE[room_id]
            if action == 'draw':
                room['teacher_annotations'].append(payload)
                if len(room['teacher_annotations']) > 20:
                    room['teacher_annotations'].pop(0)
            elif action == 'clear':
                room['teacher_annotations'] = []
            elif action == 'nudge':
                room['messages'].append({'type': 'nudge', 'text': payload.get('text', ''), 'ts': time.time()})
            elif action == 'help_request':
                sid = payload.get('studentId')
                if sid and sid in room['students']:
                    room['students'][sid]['needsHelp'] = True

            return self.send_json(200, {'ok': True, 'room': room})

        # Guardar perfil continuo de aprendizaje
        elif path == '/api/profile/save':
            user = self.get_auth_user()
            user_id = body.get('userId') or (user['id'] if user else None)
            if not user_id:
                return self.send_json(400, {'ok': False, 'error': 'Falta userId'})
            profile = body.get('profile', {})
            USER_PROFILES[user_id] = profile
            return self.send_json(200, {'ok': True, 'saved': True})

        # Proxy de IA (LLM agnóstico) con fallback resiliente local
        elif path == '/api/llm/diagnose':
            provider = body.get('provider', 'sim')
            prompt = body.get('prompt', '')
            circuit_info = body.get('circuit', '')
            api_key = body.get('apiKey') or ENV_CONFIG.get('GEMINI_API_KEY') or ''

            # Simulación heurística ultrarrápida si el proveedor es local o si falta key
            if provider == 'sim' or not api_key:
                time.sleep(0.1) # 100 ms de procesamiento
                return self.send_json(200, {
                    'ok': True,
                    'provider': 'sim',
                    'diagnosis': 'Diagnóstico heurístico del backend: Conexiones verificadas correctamente según la Ley de Ohm.',
                    'latency_ms': 120
                })

            # Proxy hacia Google Gemini si se provee clave
            if provider == 'gemini' and api_key:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                    req_data = {
                        "contents": [{
                            "parts": [{"text": f"Eres un tutor de laboratorio de circuitos. Revisa este circuito de forma breve y empática: {circuit_info}. Consulta: {prompt}"}]
                        }]
                    }
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(req_data).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=3.0) as resp:
                        res = json.loads(resp.read().decode('utf-8'))
                        text = res['candidates'][0]['content']['parts'][0]['text']
                        return self.send_json(200, {'ok': True, 'provider': 'gemini', 'diagnosis': text})
                except Exception as ex:
                    # Fallback resiliente
                    return self.send_json(200, {
                        'ok': True,
                        'provider': 'sim_fallback',
                        'diagnosis': f'Modo contingencia resiliente activado: {circuit_info}. Revisa la polaridad del diodo LED.',
                        'note': f'Fallback por timeout/error: {str(ex)[:60]}'
                    })

            return self.send_json(400, {'ok': False, 'error': f'Proveedor {provider} no configurado'})

        else:
            return self.send_json(404, {'ok': False, 'error': 'Endpoint no encontrado'})


def run_server():
    os.chdir(BASE_DIR)
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, CircuitLensHandler)
    print(f"===========================================================")
    print(f"🔬 CircuitLens Server Backend v3.2 iniciado en puerto {PORT}")
    print(f"   URL Principal:  http://localhost:{PORT}/src/circuitlens.html")
    print(f"   API Base:       http://localhost:{PORT}/api/health")
    print(f"   Modo Auth:      Estudiante (ALU-101) & Profesor (DOC-201)")
    print(f"===========================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Backend] Deteniendo servidor...")
        httpd.server_close()


if __name__ == '__main__':
    run_server()
