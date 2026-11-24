"""
Database manager and persistence service for CircuitLens.
Automatic migration on startup, PostgreSQL/Supabase and local SQLite support.
Password hashing using bcrypt.
Teacher-only system settings and AI provider configuration storage.
"""

import os
import json
import sqlite3
import uuid
import datetime
import urllib.request
import urllib.error
import bcrypt

class DatabaseManager:
    def __init__(self, env_config):
        self.config = env_config
        self.supabase_url = env_config.get('SUPABASE_URL', '').rstrip('/')
        self.supabase_key = env_config.get('SUPABASE_SERVICE_ROLE_KEY') or env_config.get('SUPABASE_ANON_KEY', '')
        self.db_url = env_config.get('DATABASE_URL', '')
        self.local_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'circuitlens.db')
        self.is_supabase_connected = False
        
        # Initialize schema & migrations
        self._init_schema()
        self._check_supabase_connection()
        self._bootstrap_accounts()

    def _init_schema(self):
        os.makedirs(os.path.dirname(self.local_db_path), exist_ok=True)
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                name TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
                avatar TEXT DEFAULT '🎓',
                created_by TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS system_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_by TEXT,
                updated_at TEXT
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS breadboards (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                circuit_index INTEGER DEFAULT 0,
                placed_steps INTEGER DEFAULT 0,
                has_error INTEGER DEFAULT 0,
                error_type TEXT,
                components TEXT,
                connections TEXT,
                workspace_state TEXT,
                is_public INTEGER DEFAULT 0,
                room_code TEXT DEFAULT 'SALA-ELECTRO-1',
                created_at TEXT,
                updated_at TEXT
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS workspace_messages (
                id TEXT PRIMARY KEY,
                breadboard_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                sender_name TEXT,
                sender_role TEXT,
                message_type TEXT NOT NULL,
                content TEXT,
                payload TEXT,
                created_at TEXT
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS ai_conversations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                breadboard_id TEXT,
                circuit_index INTEGER,
                provider TEXT,
                model TEXT,
                created_at TEXT
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS ai_messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                circuit_context TEXT,
                latency_ms INTEGER,
                created_at TEXT
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS lab_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                circuit_id INTEGER NOT NULL,
                level INTEGER NOT NULL,
                lab_number INTEGER NOT NULL,
                status TEXT NOT NULL,
                score REAL DEFAULT 0.0,
                time_spent_seconds INTEGER DEFAULT 0,
                mistakes_count INTEGER DEFAULT 0,
                mistakes_detail TEXT,
                evaluation_feedback TEXT,
                completed_at TEXT,
                created_at TEXT,
                updated_at TEXT,
                UNIQUE(user_id, circuit_id)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_interviews (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                user_type TEXT NOT NULL,
                interviewer_name TEXT,
                task_id TEXT,
                rating_accessibility INTEGER,
                rating_voice_only INTEGER,
                rating_haptics INTEGER,
                rating_learning INTEGER,
                task_completion_status TEXT,
                time_to_complete_seconds INTEGER,
                qualitative_feedback TEXT,
                accessibility_barriers_noted TEXT,
                suggestions TEXT,
                interview_date TEXT,
                created_at TEXT
            )
        """)

        conn.commit()
        conn.close()

    def _check_supabase_connection(self):
        if not self.supabase_url or not self.supabase_key:
            self.is_supabase_connected = False
            return
        
        try:
            req = urllib.request.Request(
                f"{self.supabase_url}/rest/v1/profiles?select=count",
                headers={
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                if resp.status in (200, 206):
                    self.is_supabase_connected = True
                    print("[DatabaseManager] Conectado exitosamente a Supabase PostgreSQL.")
        except Exception:
            self.is_supabase_connected = False

    def _bootstrap_accounts(self):
        """
        Inicializa las cuentas oficiales de Profesores y Estudiantes con contraseñas encriptadas bcrypt.
        Requiere usuario y contraseña obligatorios sin bypass automático.
        """
        accounts = [
            # PROFESORES
            {
                "email": "edwin.requena@circuitlens.edu.pe",
                "name": "Prof. Edwin Requena",
                "role": "teacher",
                "avatar": "👨‍🏫",
                "password": "ProfEdwin2026*"
            },
            {
                "email": "docente@circuitlens.edu.pe",
                "name": "Prof. Edwin Requena",
                "role": "teacher",
                "avatar": "👨‍🏫",
                "password": "CircuitLens2026!"
            },
            {
                "email": "carmen.valdivia@circuitlens.edu.pe",
                "name": "Dra. Carmen Valdivia",
                "role": "teacher",
                "avatar": "👩‍🏫",
                "password": "DocValdivia2026!"
            },
            {
                "email": "roberto.alarcon@circuitlens.edu.pe",
                "name": "Ing. Roberto Alarcón",
                "role": "teacher",
                "avatar": "👨‍🏫",
                "password": "AlarconLab2026#"
            },
            # ESTUDIANTES
            {
                "email": "piero.castillo@uni.edu.pe",
                "name": "Piero Castillo",
                "role": "student",
                "avatar": "🎓",
                "password": "PieroAlumno2026!"
            },
            {
                "email": "estudiante@circuitlens.edu.pe",
                "name": "Piero Castillo",
                "role": "student",
                "avatar": "🎓",
                "password": "student123"
            },
            {
                "email": "ana.torres@uni.edu.pe",
                "name": "Ana Torres",
                "role": "student",
                "avatar": "🎓",
                "password": "AnaTorres2026!"
            },
            {
                "email": "lucia.ramos@uni.edu.pe",
                "name": "Lucía Ramos",
                "role": "student",
                "avatar": "🎓",
                "password": "LuciaRamos2026!"
            },
            {
                "email": "carlos.mendoza@uni.edu.pe",
                "name": "Carlos Mendoza",
                "role": "student",
                "avatar": "🎓",
                "password": "CarlosMendoza2026!"
            }
        ]

        for acc in accounts:
            existing = self.get_user_by_email(acc["email"])
            pw_hash = self.hash_password(acc["password"])
            if not existing:
                self.create_user(acc["email"], pw_hash, acc["name"], role=acc["role"], avatar=acc["avatar"])
            else:
                conn = sqlite3.connect(self.local_db_path)
                cur = conn.cursor()
                cur.execute("UPDATE profiles SET password_hash = ?, role = ?, name = ?, avatar = ? WHERE lower(email) = ?",
                            (pw_hash, acc["role"], acc["name"], acc["avatar"], acc["email"].lower()))
                conn.commit()
                conn.close()

    # ================= PASSWORD SECURITY =================
    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        if not hashed_password:
            return False
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

    # ================= USER OPERATIONS =================
    def get_user_by_email(self, email: str):
        if not email:
            return None
        email_clean = email.strip().lower()
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("SELECT id, email, password_hash, name, role, avatar, created_by, created_at, updated_at FROM profiles WHERE lower(email) = ?", (email_clean,))
        row = cur.fetchone()
        conn.close()
        if row:
            return {
                'id': row[0],
                'email': row[1],
                'password_hash': row[2],
                'name': row[3],
                'role': row[4],
                'avatar': row[5],
                'created_by': row[6],
                'created_at': row[7],
                'updated_at': row[8]
            }
        return None

    def get_user_by_id(self, user_id: str):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("SELECT id, email, password_hash, name, role, avatar, created_by, created_at, updated_at FROM profiles WHERE id = ?", (user_id,))
        row = cur.fetchone()
        conn.close()
        if row:
            return {
                'id': row[0],
                'email': row[1],
                'password_hash': row[2],
                'name': row[3],
                'role': row[4],
                'avatar': row[5],
                'created_by': row[6],
                'created_at': row[7],
                'updated_at': row[8]
            }
        return None

    def create_user(self, email: str, password_hash: str, name: str, role: str = 'student', avatar: str = None, created_by: str = None):
        user_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if not avatar:
            avatar = '👨‍🏫' if role == 'teacher' else '🎓'
        
        user_dict = {
            'id': user_id,
            'email': email.strip().lower(),
            'password_hash': password_hash,
            'name': name.strip(),
            'role': role,
            'avatar': avatar,
            'created_by': created_by,
            'created_at': now,
            'updated_at': now
        }
        
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO profiles (id, email, password_hash, name, role, avatar, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, user_dict['email'], password_hash, user_dict['name'], role, avatar, created_by, now, now))
        conn.commit()
        conn.close()
        return user_dict

    def list_students(self):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("SELECT id, email, name, role, avatar, created_by, created_at FROM profiles WHERE role = 'student' ORDER BY created_at DESC")
        rows = cur.fetchall()
        conn.close()
        return [{
            'id': r[0],
            'email': r[1],
            'name': r[2],
            'role': r[3],
            'avatar': r[4],
            'created_by': r[5],
            'created_at': r[6]
        } for r in rows]

    # ================= TEACHER-ONLY SYSTEM CONFIGURATION =================
    def get_system_config(self, key: str, default=None):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("SELECT value FROM system_config WHERE key = ?", (key,))
        row = cur.fetchone()
        conn.close()
        if row:
            try:
                return json.loads(row[0])
            except Exception:
                return row[0]
        return default

    def set_system_config(self, key: str, value, updated_by: str = None):
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        val_str = json.dumps(value) if not isinstance(value, str) else value
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT OR REPLACE INTO system_config (key, value, updated_by, updated_at)
            VALUES (?, ?, ?, ?)
        """, (key, val_str, updated_by, now))
        conn.commit()
        conn.close()

    def get_teacher_ai_config(self):
        config = self.get_system_config('ai_tutor_config')
        if not config or not isinstance(config, dict):
            config = {
                'provider': self.config.get('DEFAULT_LLM_PROVIDER', 'sim'),
                'api_key': self.config.get('GEMINI_API_KEY') or self.config.get('OPENAI_API_KEY', ''),
                'model': self.config.get('GEMINI_MODEL', 'gemini-1.5-flash'),
                'openai_base_url': self.config.get('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
                'ollama_host': self.config.get('OLLAMA_HOST', 'http://localhost:11434'),
                'ollama_model': self.config.get('OLLAMA_MODEL', 'llama3.2'),
                'speech_rate': 1.0,
                'tts_enabled': True,
                'status': 'configured'
            }
        return config

    # ================= BREADBOARD WORKSPACES =================
    def list_breadboards(self, user_id: str, is_teacher: bool = False):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        if is_teacher:
            cur.execute("""
                SELECT b.id, b.user_id, b.name, b.description, b.circuit_index, b.placed_steps, 
                       b.has_error, b.error_type, b.components, b.connections, b.workspace_state, 
                       b.is_public, b.room_code, b.created_at, b.updated_at, p.name as owner_name, p.role as owner_role
                FROM breadboards b
                LEFT JOIN profiles p ON b.user_id = p.id
                ORDER BY b.updated_at DESC
            """)
        else:
            cur.execute("""
                SELECT b.id, b.user_id, b.name, b.description, b.circuit_index, b.placed_steps, 
                       b.has_error, b.error_type, b.components, b.connections, b.workspace_state, 
                       b.is_public, b.room_code, b.created_at, b.updated_at, p.name as owner_name, p.role as owner_role
                FROM breadboards b
                LEFT JOIN profiles p ON b.user_id = p.id
                WHERE b.user_id = ? OR b.is_public = 1
                ORDER BY b.updated_at DESC
            """, (user_id,))
        
        rows = cur.fetchall()
        conn.close()
        return [{
            'id': r[0],
            'userId': r[1],
            'name': r[2],
            'description': r[3],
            'circuitIndex': r[4],
            'placedSteps': r[5],
            'hasError': bool(r[6]),
            'errorType': r[7],
            'components': json.loads(r[8]) if r[8] else [],
            'connections': json.loads(r[9]) if r[9] else [],
            'workspaceState': json.loads(r[10]) if r[10] else {},
            'isPublic': bool(r[11]),
            'roomCode': r[12],
            'createdAt': r[13],
            'updatedAt': r[14],
            'ownerName': r[15] or 'Estudiante',
            'ownerRole': r[16] or 'student'
        } for r in rows]

    def get_breadboard(self, board_id: str):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT b.id, b.user_id, b.name, b.description, b.circuit_index, b.placed_steps, 
                   b.has_error, b.error_type, b.components, b.connections, b.workspace_state, 
                   b.is_public, b.room_code, b.created_at, b.updated_at, p.name, p.role
            FROM breadboards b
            LEFT JOIN profiles p ON b.user_id = p.id
            WHERE b.id = ?
        """, (board_id,))
        r = cur.fetchone()
        conn.close()
        if not r:
            return None
        return {
            'id': r[0],
            'userId': r[1],
            'name': r[2],
            'description': r[3],
            'circuitIndex': r[4],
            'placedSteps': r[5],
            'hasError': bool(r[6]),
            'errorType': r[7],
            'components': json.loads(r[8]) if r[8] else [],
            'connections': json.loads(r[9]) if r[9] else [],
            'workspaceState': json.loads(r[10]) if r[10] else {},
            'isPublic': bool(r[11]),
            'roomCode': r[12],
            'createdAt': r[13],
            'updatedAt': r[14],
            'ownerName': r[15] or 'Estudiante',
            'ownerRole': r[16] or 'student'
        }

    def save_breadboard(self, user_id: str, board_data: dict, is_teacher: bool = False):
        board_id = board_data.get('id') or str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        name = board_data.get('name', 'Protoboard Virtual')
        desc = board_data.get('description', '')
        ci = board_data.get('circuitIndex', 0)
        ps = board_data.get('placedSteps', 0)
        has_err = 1 if board_data.get('hasError') else 0
        err_type = board_data.get('errorType', '')
        comps = json.dumps(board_data.get('components', []))
        conns = json.dumps(board_data.get('connections', []))
        wstate = json.dumps(board_data.get('workspaceState', {}))
        is_pub = 1 if board_data.get('isPublic') else 0
        room = board_data.get('roomCode', 'SALA-ELECTRO-1')

        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        
        cur.execute("SELECT user_id, created_at FROM breadboards WHERE id = ?", (board_id,))
        existing = cur.fetchone()
        
        if existing:
            owner_id = existing[0]
            # Verify permission: either owner or teacher
            if not is_teacher and owner_id != user_id:
                conn.close()
                raise PermissionError("No autorizado para modificar este protoboard")
            cur.execute("""
                UPDATE breadboards 
                SET name = ?, description = ?, circuit_index = ?, placed_steps = ?,
                    has_error = ?, error_type = ?, components = ?, connections = ?,
                    workspace_state = ?, is_public = ?, room_code = ?, updated_at = ?
                WHERE id = ?
            """, (name, desc, ci, ps, has_err, err_type, comps, conns, wstate, is_pub, room, now, board_id))
        else:
            owner_id = user_id
            cur.execute("""
                INSERT INTO breadboards (
                    id, user_id, name, description, circuit_index, placed_steps,
                    has_error, error_type, components, connections,
                    workspace_state, is_public, room_code, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (board_id, owner_id, name, desc, ci, ps, has_err, err_type, comps, conns, wstate, is_pub, room, now, now))

        conn.commit()
        conn.close()
        return self.get_breadboard(board_id)

    def delete_breadboard(self, board_id: str, user_id: str, is_teacher: bool = False):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        if is_teacher:
            cur.execute("DELETE FROM breadboards WHERE id = ?", (board_id,))
        else:
            cur.execute("DELETE FROM breadboards WHERE id = ? AND user_id = ?", (board_id, user_id))
        deleted = cur.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    # ================= WORKSPACE MESSAGING =================
    def add_workspace_message(self, board_id: str, sender_id: str, sender_name: str, sender_role: str, msg_type: str, content: str, payload=None):
        msg_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        payload_str = json.dumps(payload or {})

        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO workspace_messages (id, breadboard_id, sender_id, sender_name, sender_role, message_type, content, payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (msg_id, board_id, sender_id, sender_name, sender_role, msg_type, content, payload_str, now))
        conn.commit()
        conn.close()

        return {
            'id': msg_id,
            'breadboardId': board_id,
            'senderId': sender_id,
            'senderName': sender_name,
            'senderRole': sender_role,
            'type': msg_type,
            'content': content,
            'payload': payload or {},
            'createdAt': now
        }

    def list_workspace_messages(self, board_id: str, limit: int = 50):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, breadboard_id, sender_id, sender_name, sender_role, message_type, content, payload, created_at
            FROM workspace_messages
            WHERE breadboard_id = ?
            ORDER BY created_at ASC
            LIMIT ?
        """, (board_id, limit))
        rows = cur.fetchall()
        conn.close()
        return [{
            'id': r[0],
            'breadboardId': r[1],
            'senderId': r[2],
            'senderName': r[3],
            'senderRole': r[4],
            'type': r[5],
            'content': r[6],
            'payload': json.loads(r[7]) if r[7] else {},
            'createdAt': r[8]
        } for r in rows]

    # ================= AI CONVERSATIONS =================
    def get_or_create_conversation(self, user_id: str, board_id: str = None, circuit_index: int = 0, provider: str = 'sim', model: str = None):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT id FROM ai_conversations 
            WHERE user_id = ? AND (breadboard_id = ? OR (breadboard_id IS NULL AND ? IS NULL))
            ORDER BY created_at DESC LIMIT 1
        """, (user_id, board_id, board_id))
        row = cur.fetchone()
        
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if row:
            conv_id = row[0]
        else:
            conv_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO ai_conversations (id, user_id, breadboard_id, circuit_index, provider, model, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (conv_id, user_id, board_id, circuit_index, provider, model, now))
            conn.commit()

        conn.close()
        return conv_id

    def add_ai_message(self, conversation_id: str, role: str, content: str, circuit_context=None, latency_ms: int = 0):
        msg_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        ctx_str = json.dumps(circuit_context or {})

        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO ai_messages (id, conversation_id, role, content, circuit_context, latency_ms, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (msg_id, conversation_id, role, content, ctx_str, latency_ms, now))
        conn.commit()
        conn.close()

    def get_ai_history(self, conversation_id: str, limit: int = 15):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, role, content, circuit_context, latency_ms, created_at
            FROM ai_messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
            LIMIT ?
        """, (conversation_id, limit))
        rows = cur.fetchall()
        conn.close()
        return [{
            'id': r[0],
            'role': r[1],
            'content': r[2],
            'circuitContext': json.loads(r[3]) if r[3] else {},
            'latencyMs': r[4],
            'createdAt': r[5]
        } for r in rows]

    # ================= PROGRESS & INTERVIEWS =================
    def save_lab_progress(self, user_id: str, circuit_id: int, level: int, lab_num: int, status: str, score: float = 0.0, time_spent: int = 0, mistakes: int = 0, mistakes_detail=None, feedback: str = ""):
        p_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        completed_at = now if status == 'completed' else None
        m_json = json.dumps(mistakes_detail or {})

        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO lab_progress (
                id, user_id, circuit_id, level, lab_number, status, score,
                time_spent_seconds, mistakes_count, mistakes_detail, evaluation_feedback,
                completed_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, circuit_id) DO UPDATE SET
                status = excluded.status,
                score = excluded.score,
                time_spent_seconds = lab_progress.time_spent_seconds + excluded.time_spent_seconds,
                mistakes_count = excluded.mistakes_count,
                mistakes_detail = excluded.mistakes_detail,
                evaluation_feedback = excluded.evaluation_feedback,
                completed_at = COALESCE(excluded.completed_at, lab_progress.completed_at),
                updated_at = excluded.updated_at
        """, (p_id, user_id, circuit_id, level, lab_num, status, score, time_spent, mistakes, m_json, feedback, completed_at, now, now))
        conn.commit()
        conn.close()

    def get_user_progress(self, user_id: str):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT circuit_id, level, lab_number, status, score, time_spent_seconds, mistakes_count, mistakes_detail, evaluation_feedback, completed_at
            FROM lab_progress
            WHERE user_id = ?
        """, (user_id,))
        rows = cur.fetchall()
        conn.close()
        return {r[0]: {
            'circuitId': r[0],
            'level': r[1],
            'labNumber': r[2],
            'status': r[3],
            'score': r[4],
            'timeSpent': r[5],
            'mistakesCount': r[6],
            'mistakesDetail': json.loads(r[7]) if r[7] else {},
            'feedback': r[8],
            'completedAt': r[9]
        } for r in rows}

    def save_interview(self, interview_data: dict):
        i_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO user_interviews (
                id, user_id, user_type, interviewer_name, task_id,
                rating_accessibility, rating_voice_only, rating_haptics, rating_learning,
                task_completion_status, time_to_complete_seconds,
                qualitative_feedback, accessibility_barriers_noted, suggestions,
                interview_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            i_id,
            interview_data.get('userId'),
            interview_data.get('userType', 'student'),
            interview_data.get('interviewerName', ''),
            interview_data.get('taskId', 'task_1_voice_navigation'),
            interview_data.get('ratingAccessibility', 5),
            interview_data.get('ratingVoiceOnly', 5),
            interview_data.get('ratingHaptics', 5),
            interview_data.get('ratingLearning', 5),
            interview_data.get('taskCompletionStatus', 'success'),
            interview_data.get('timeToCompleteSeconds', 60),
            interview_data.get('qualitativeFeedback', ''),
            interview_data.get('accessibilityBarriersNoted', ''),
            interview_data.get('suggestions', ''),
            interview_data.get('interviewDate', now),
            now
        ))
        conn.commit()
        conn.close()

        record = dict(interview_data)
        record['id'] = i_id
        record['createdAt'] = now
        return record

    def list_interviews(self):
        conn = sqlite3.connect(self.local_db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, user_type, interviewer_name, task_id,
                   rating_accessibility, rating_voice_only, rating_haptics, rating_learning,
                   task_completion_status, time_to_complete_seconds,
                   qualitative_feedback, accessibility_barriers_noted, suggestions, interview_date, created_at
            FROM user_interviews
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        return [{
            'id': r[0],
            'userId': r[1],
            'userType': r[2],
            'interviewerName': r[3],
            'taskId': r[4],
            'ratingAccessibility': r[5],
            'ratingVoiceOnly': r[6],
            'ratingHaptics': r[7],
            'ratingLearning': r[8],
            'taskCompletionStatus': r[9],
            'timeToCompleteSeconds': r[10],
            'qualitativeFeedback': r[11],
            'accessibilityBarriersNoted': r[12],
            'suggestions': r[13],
            'interviewDate': r[14],
            'createdAt': r[15]
        } for r in rows]
