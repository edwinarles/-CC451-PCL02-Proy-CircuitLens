"""
AI Tutor Service using TEACHER-CONFIGURED credentials exclusively.
Students NEVER supply API keys; all queries route securely through
the teacher's configured provider and model on the backend.
"""

import time
import json
import urllib.request
import urllib.error

class AITutorService:
    def __init__(self, db_manager):
        self.db = db_manager

    def get_system_prompt(self, user_profile, circuit_context):
        tone = user_profile.get('preferencias', {}).get('tono', 'empatico')
        level = user_profile.get('preferencias', {}).get('nivel', 'auto')
        emotion = user_profile.get('emociones', {}).get('declarada', 'concentrado')

        tone_instructions = {
            'empatico': "Sé cálido, alentador y didáctico. Valora el esfuerzo y explica el porqué físico de los errores.",
            'socratico': "Guía al estudiante mediante preguntas reflexivas que lo lleven a deducir las leyes de circuitos (Ohm, Kirchhoff, Thévenin, semiconductores).",
            'tecnico': "Sé riguroso, formal y preciso con la terminología de ingeniería eléctrica y parámetros de hojas de datos (datasheets)."
        }.get(tone, "Sé empático y riguroso.")

        return (
            "Eres CircuitLens AI Tutor, asistente pedagógico universitario de Ingeniería Eléctrica y Electrónica.\n"
            f"Perfil del estudiante: Estado '{emotion}'. Estilo: {tone_instructions} Nivel: {level}.\n"
            "REGLAS OBLIGATORIAS:\n"
            "1. Analiza el estado REAL del circuito: componentes montados, polaridades, nodos y paso actual.\n"
            "2. NUNCA des respuestas genéricas o repetitivas; varía tu explicación e incluye cálculos o deducciones exactas.\n"
            "3. Responde de forma clara y accesible para lectura de voz (máximo 2 a 3 oraciones concisas).\n"
            f"Contexto del circuito: {json.dumps(circuit_context, ensure_ascii=False)}"
        )

    def test_provider_connectivity(self, provider: str, api_key: str, model: str = None, base_url: str = None):
        """
        Teacher-only utility to test credentials and connection before saving.
        """
        t0 = time.time()
        try:
            if provider == 'gemini':
                if not api_key:
                    return {'ok': False, 'error': 'Falta la API Key de Gemini'}
                model_name = model or 'gemini-1.5-flash'
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                req = urllib.request.Request(
                    url,
                    data=json.dumps({"contents": [{"parts": [{"text": "Ping de prueba CircuitLens. Responde: OK"}]}]}).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=4.0) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    latency = int((time.time() - t0) * 1000)
                    return {'ok': True, 'latency_ms': latency, 'message': 'Conexión exitosa con Google Gemini API'}

            elif provider in ('openai', 'openai-compatible'):
                if not api_key:
                    return {'ok': False, 'error': 'Falta la API Key de OpenAI / Compatible'}
                b_url = (base_url or 'https://api.openai.com/v1').rstrip('/')
                model_name = model or 'gpt-4o-mini'
                req = urllib.request.Request(
                    f"{b_url}/chat/completions",
                    data=json.dumps({"model": model_name, "messages": [{"role": "user", "content": "Ping"}], "max_tokens": 5}).encode('utf-8'),
                    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=4.0) as resp:
                    latency = int((time.time() - t0) * 1000)
                    return {'ok': True, 'latency_ms': latency, 'message': f'Conexión exitosa con {model_name}'}

            elif provider == 'ollama':
                host = (base_url or 'http://localhost:11434').rstrip('/')
                req = urllib.request.Request(f"{host}/api/tags", method='GET')
                with urllib.request.urlopen(req, timeout=3.0) as resp:
                    latency = int((time.time() - t0) * 1000)
                    return {'ok': True, 'latency_ms': latency, 'message': 'Servidor Ollama local detectado y operativo'}

            elif provider == 'sim':
                return {'ok': True, 'latency_ms': 15, 'message': 'Motor heurístico y físico local activo (< 250 ms)'}

            return {'ok': False, 'error': f'Proveedor {provider} desconocido'}
        except Exception as e:
            return {'ok': False, 'error': f'Error de conexión: {str(e)[:120]}'}

    def generate_response(self, user_message: str, circuit_context: dict, user_profile: dict, conversation_history=None):
        t0 = time.time()
        
        # Load teacher-configured AI settings from database
        cfg = self.db.get_teacher_ai_config()
        provider = cfg.get('provider', 'sim')
        api_key = cfg.get('api_key', '')
        model = cfg.get('model', 'gemini-1.5-flash')
        openai_base_url = cfg.get('openai_base_url', 'https://api.openai.com/v1')
        ollama_host = cfg.get('ollama_host', 'http://localhost:11434')
        ollama_model = cfg.get('ollama_model', 'llama3.2')

        system_instruction = self.get_system_prompt(user_profile, circuit_context)

        # 1. Google Gemini (Teacher configured)
        if provider == 'gemini' and api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                contents = []
                if conversation_history:
                    for h in conversation_history[-4:]:
                        role = "user" if h.get('role') == 'user' else "model"
                        contents.append({"role": role, "parts": [{"text": h.get('content', '')}]})
                contents.append({"role": "user", "parts": [{"text": f"[Instrucción del Sistema]: {system_instruction}\n\n[Consulta Alumno]: {user_message}"}]})

                req = urllib.request.Request(
                    url,
                    data=json.dumps({"contents": contents}).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=4.5) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    return {'ok': True, 'provider': 'gemini', 'response': text.strip(), 'latency_ms': int((time.time() - t0) * 1000)}
            except Exception as e:
                print(f"[AITutor] Fallback de Gemini: {e}")

        # 2. OpenAI / Compatible (Teacher configured)
        elif provider in ('openai', 'openai-compatible') and api_key:
            try:
                messages = [{"role": "system", "content": system_instruction}]
                if conversation_history:
                    for h in conversation_history[-4:]:
                        messages.append({"role": h.get('role', 'user'), "content": h.get('content', '')})
                messages.append({"role": "user", "content": user_message})

                req = urllib.request.Request(
                    f"{openai_base_url}/chat/completions",
                    data=json.dumps({"model": model or 'gpt-4o-mini', "messages": messages, "temperature": 0.35, "max_tokens": 180}).encode('utf-8'),
                    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=4.5) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    text = data['choices'][0]['message']['content']
                    return {'ok': True, 'provider': 'openai', 'response': text.strip(), 'latency_ms': int((time.time() - t0) * 1000)}
            except Exception as e:
                print(f"[AITutor] Fallback de OpenAI: {e}")

        # 3. Ollama (Teacher configured)
        elif provider == 'ollama':
            try:
                full_prompt = f"System: {system_instruction}\nUser: {user_message}\nAssistant:"
                req = urllib.request.Request(
                    f"{ollama_host}/api/generate",
                    data=json.dumps({"model": ollama_model, "prompt": full_prompt, "stream": False}).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=4.5) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    return {'ok': True, 'provider': 'ollama', 'response': data.get('response', '').strip(), 'latency_ms': int((time.time() - t0) * 1000)}
            except Exception as e:
                print(f"[AITutor] Fallback de Ollama: {e}")

        # 4. Contextual Physics Engine Fallback
        res = self._dynamic_physics_response(user_message, circuit_context, user_profile)
        return {'ok': True, 'provider': 'physics_engine', 'response': res, 'latency_ms': int((time.time() - t0) * 1000)}

    def _dynamic_physics_response(self, user_msg: str, ctx: dict, profile: dict):
        c_name = ctx.get('circuitName', 'Laboratorio de Circuitos')
        placed = ctx.get('placedSteps', 0)
        total = ctx.get('totalSteps', 4)
        has_err = ctx.get('hasError', False)
        next_lbl = ctx.get('nextStepLabel', 'siguiente componente')
        tone = profile.get('preferencias', {}).get('tono', 'empatico')

        u = user_msg.lower()

        if has_err:
            if tone == 'socratico':
                return f"En «{c_name}», el semiconductor no conduce. ¿Hacia qué nodo orientaste el terminal ánodo (+) respecto a la fuente?"
            elif tone == 'tecnico':
                return f"Discrepancia detectada en «{c_name}»: Unión semiconductora polarizada inversamente ($V_D < 0$). Invierte los terminales."
            else:
                return f"¡Atención en «{c_name}»! El diodo tiene polaridad invertida. Conecta la pata larga al positivo para permitir el paso de corriente."

        if any(w in u for w in ['resistencia', 'ohm', 'valor', 'código', 'banda']):
            return f"En «{c_name}», la resistencia limita la corriente $I = (V_{{cc}} - V_D) / R$ para mantener el componente dentro del rango seguro de disipación térmica."

        if any(w in u for w in ['voltaje', 'corriente', 'malla', 'kirchhoff']):
            return f"Aplicando KVL a la malla de «{c_name}»: la suma algebraica de caídas de potencial equivale a la fuerza electromotriz de alimentación."

        if placed < total:
            return f"Llevas {placed} de {total} pasos en «{c_name}». El siguiente paso consiste en montar: {next_lbl}."

        return f"¡Comprobación exitosa en «{c_name}»! Continuidad validada y polarización conforme a diseño experimental."
