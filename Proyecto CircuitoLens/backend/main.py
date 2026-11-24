"""
FastAPI Server for CircuitLens Enterprise Platform.
Clean REST API endpoints for:
 - Authentication (Login, Register Student, Logout, Me) with bcrypt hashing
 - Teacher-only System & AI Configuration
 - Workspaces & Virtual Breadboards
 - 50 Advanced University Engineering Laboratories
 - Contextual AI Tutor (Using teacher-configured key)
 - Usability Testing & Interviews
 - Static Frontend Serving
"""

import os
import sys
import json
import uuid
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel, EmailStr

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from backend.db import DatabaseManager
from backend.ai_tutor import AITutorService

# Environment Configuration
def load_env():
    env_path = os.path.join(BASE_DIR, '.env')
    config = {
        'PORT': '8000',
        'DEFAULT_LLM_PROVIDER': 'sim',
        'BOOTSTRAP_TEACHER_EMAIL': 'docente@circuitlens.edu.pe',
        'BOOTSTRAP_TEACHER_NAME': 'Prof. Edwin Requena',
        'BOOTSTRAP_TEACHER_PASSWORD': 'CircuitLens2026!'
    }
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        config[k.strip()] = v.strip()
        except Exception:
            pass
    for k in ['PORT', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL',
              'GEMINI_API_KEY', 'OPENAI_API_KEY', 'DEFAULT_LLM_PROVIDER',
              'BOOTSTRAP_TEACHER_EMAIL', 'BOOTSTRAP_TEACHER_PASSWORD']:
        if k in os.environ:
            config[k] = os.environ[k]
    return config

ENV_CONFIG = load_env()
DB = DatabaseManager(ENV_CONFIG)
AI_TUTOR = AITutorService(DB)

# In-memory sessions token -> user_dict
SESSIONS: Dict[str, dict] = {}

# Load 50 labs curriculum
CURRICULUM_DATA = {}
curriculum_path = os.path.join(BASE_DIR, 'data', 'curriculo_50_labs.json')
if os.path.exists(curriculum_path):
    try:
        with open(curriculum_path, 'r', encoding='utf-8') as f:
            CURRICULUM_DATA = json.load(f)
    except Exception:
        pass

# FastAPI App
app = FastAPI(
    title="CircuitLens Platform API",
    version="4.5.0",
    description="Backend API for AI-guided Electronics Lab with Virtual Breadboards & Accessibility"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= AUTH DEPENDENCY =================
def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ")[1].strip()
    return SESSIONS.get(token)

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token no suministrado")
    token = authorization.split("Bearer ")[1].strip()
    user = SESSIONS.get(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida o expirada")
    return user

def require_teacher(user: dict = Depends(get_current_user)):
    if user.get("role") != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso restringido exclusivamente a Docentes")
    return user

# ================= PYDANTIC MODELS =================
class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = "student"
    name: Optional[str] = None

class RegisterStudentRequest(BaseModel):
    email: str
    name: str
    password: Optional[str] = None
    avatar: Optional[str] = "🎓"

class TeacherConfigUpdate(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: Optional[str] = None
    openai_base_url: Optional[str] = None
    ollama_host: Optional[str] = None
    ollama_model: Optional[str] = None
    speech_rate: Optional[float] = 1.0
    tts_enabled: Optional[bool] = True

class TestProviderRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None

class AIChatRequest(BaseModel):
    message: str
    circuitContext: Optional[Dict[str, Any]] = None
    userProfile: Optional[Dict[str, Any]] = None
    breadboardId: Optional[str] = None

class BreadboardSaveRequest(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    circuitIndex: int = 0
    placedSteps: int = 0
    hasError: bool = False
    errorType: Optional[str] = None
    components: Optional[List[Any]] = []
    connections: Optional[List[Any]] = []
    workspaceState: Optional[Dict[str, Any]] = {}
    isPublic: Optional[bool] = False
    roomCode: Optional[str] = "SALA-ELECTRO-1"

class WorkspaceMessageRequest(BaseModel):
    breadboardId: str
    type: str = "chat"
    content: str
    payload: Optional[Dict[str, Any]] = None

class ProgressSaveRequest(BaseModel):
    circuitId: int
    level: int = 1
    labNumber: int = 1
    status: str = "in_progress"
    score: float = 0.0
    timeSpent: int = 0
    mistakesCount: int = 0
    mistakesDetail: Optional[Dict[str, Any]] = None
    feedback: Optional[str] = ""

class InterviewSubmitRequest(BaseModel):
    userType: str
    interviewerName: Optional[str] = ""
    taskId: Optional[str] = "task_1_voice_navigation"
    ratingAccessibility: int = 5
    ratingVoiceOnly: int = 5
    ratingHaptics: int = 5
    ratingLearning: int = 5
    taskCompletionStatus: Optional[str] = "success"
    timeToCompleteSeconds: Optional[int] = 60
    qualitativeFeedback: Optional[str] = ""
    accessibilityBarriersNoted: Optional[str] = ""
    suggestions: Optional[str] = ""

# ================= API ROUTES =================

@app.get("/api/health")
def health_check():
    cfg = DB.get_teacher_ai_config()
    return {
        "status": "online",
        "version": "4.5.0",
        "database": "Supabase" if DB.is_supabase_connected else "Local SQLite (Resiliente)",
        "active_sessions": len(SESSIONS),
        "curriculum_labs": len(CURRICULUM_DATA.get("circuitos", [])),
        "ai_provider_configured": cfg.get("provider", "sim")
    }

# --- AUTH ---
@app.post("/api/auth/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()
    password = (req.password or "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Por favor ingresa tu correo institucional o usuario.")
    if not password:
        raise HTTPException(status_code=400, detail="Por favor ingresa tu contraseña.")

    user = DB.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario o correo institucional no registrado.")

    if not DB.verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta. Inténtalo de nuevo.")

    token = "token_" + uuid.uuid4().hex
    clean_user = {k: v for k, v in user.items() if k != "password_hash"}
    SESSIONS[token] = clean_user
    return {"ok": True, "token": token, "user": clean_user}

@app.get("/api/auth/me")
def get_me(user: Optional[dict] = Depends(get_optional_user)):
    if not user:
        return {"ok": False, "user": None}
    return {"ok": True, "user": user}

@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
        SESSIONS.pop(token, None)
    return {"ok": True}

# --- TEACHER: USER MANAGEMENT ---
@app.post("/api/auth/register-student")
def register_student(req: RegisterStudentRequest, teacher: dict = Depends(require_teacher)):
    existing = DB.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un usuario con este correo")
    
    pw_hash = DB.hash_password(req.password or "student123")
    student = DB.create_user(
        req.email, pw_hash, req.name, role="student", avatar=req.avatar or "🎓", created_by=teacher["id"]
    )
    clean = {k: v for k, v in student.items() if k != "password_hash"}
    return {"ok": True, "student": clean}

@app.get("/api/students")
def list_students(teacher: dict = Depends(require_teacher)):
    students = DB.list_students()
    return {"ok": True, "students": students}

# --- TEACHER-ONLY: AI & SYSTEM SETTINGS ---
@app.get("/api/teacher/settings")
def get_teacher_settings(teacher: dict = Depends(require_teacher)):
    config = DB.get_teacher_ai_config()
    # Mask API key for security
    masked = dict(config)
    if masked.get("api_key"):
        masked["api_key_masked"] = masked["api_key"][:4] + "..." + masked["api_key"][-4:] if len(masked["api_key"]) > 8 else "****"
    return {"ok": True, "settings": masked}

@app.post("/api/teacher/settings")
def update_teacher_settings(req: TeacherConfigUpdate, teacher: dict = Depends(require_teacher)):
    current = DB.get_teacher_ai_config()
    current.update({
        "provider": req.provider,
        "model": req.model or current.get("model"),
        "openai_base_url": req.openai_base_url or current.get("openai_base_url"),
        "ollama_host": req.ollama_host or current.get("ollama_host"),
        "ollama_model": req.ollama_model or current.get("ollama_model"),
        "speech_rate": req.speech_rate if req.speech_rate is not None else current.get("speech_rate", 1.0),
        "tts_enabled": req.tts_enabled if req.tts_enabled is not None else current.get("tts_enabled", True)
    })
    # Update api_key only if new one provided
    if req.api_key and req.api_key.strip():
        current["api_key"] = req.api_key.strip()

    DB.set_system_config("ai_tutor_config", current, updated_by=teacher["id"])
    return {"ok": True, "message": "Configuración de docente guardada exitosamente"}

@app.post("/api/teacher/test-provider")
def test_provider(req: TestProviderRequest, teacher: dict = Depends(require_teacher)):
    cfg = DB.get_teacher_ai_config()
    api_key = req.api_key or cfg.get("api_key")
    res = AI_TUTOR.test_provider_connectivity(req.provider, api_key, model=req.model, base_url=req.base_url)
    return res

# --- AI TUTOR (STUDENT USES TEACHER-CONFIGURED KEY) ---
@app.post("/api/ai/chat")
def ai_chat(req: AIChatRequest, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    conv_id = DB.get_or_create_conversation(
        user_id, board_id=req.breadboardId, circuit_index=(req.circuitContext or {}).get("circuitIndex", 0)
    )
    history = DB.get_ai_history(conv_id, limit=8)

    # Record student question
    DB.add_ai_message(conv_id, "user", req.message, circuit_context=req.circuitContext)

    # Generate response using teacher credentials
    ai_result = AI_TUTOR.generate_response(
        req.message, req.circuitContext or {}, req.userProfile or {}, conversation_history=history
    )

    # Record AI answer
    DB.add_ai_message(
        conv_id, "assistant", ai_result["response"], circuit_context=req.circuitContext, latency_ms=ai_result.get("latency_ms", 0)
    )

    return {
        "ok": True,
        "conversationId": conv_id,
        "provider": ai_result.get("provider"),
        "response": ai_result.get("response"),
        "latency_ms": ai_result.get("latency_ms")
    }

# --- BREADBOARD WORKSPACES ---
@app.get("/api/breadboards")
def list_breadboards(user: Optional[dict] = Depends(get_optional_user)):
    if not user:
        return {"ok": True, "breadboards": []}
    is_teacher = (user.get("role") == "teacher")
    boards = DB.list_breadboards(user["id"], is_teacher=is_teacher)
    return {"ok": True, "breadboards": boards}

@app.get("/api/breadboards/{board_id}")
def get_breadboard(board_id: str, user: dict = Depends(get_current_user)):
    board = DB.get_breadboard(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Protoboard no encontrado")
    # Authorization: Owner or Teacher
    if user.get("role") != "teacher" and board["userId"] != user["id"] and not board.get("isPublic"):
        raise HTTPException(status_code=403, detail="No autorizado para ver este protoboard")
    return {"ok": True, "breadboard": board}

@app.post("/api/breadboards/save")
def save_breadboard(req: BreadboardSaveRequest, user: dict = Depends(get_current_user)):
    is_teacher = (user.get("role") == "teacher")
    saved = DB.save_breadboard(user["id"], req.model_dump(), is_teacher=is_teacher)
    return {"ok": True, "breadboard": saved}

@app.post("/api/breadboards/delete")
def delete_breadboard(payload: dict, user: dict = Depends(get_current_user)):
    board_id = payload.get("id")
    if not board_id:
        raise HTTPException(status_code=400, detail="Falta el ID del protoboard")
    is_teacher = (user.get("role") == "teacher")
    deleted = DB.delete_breadboard(board_id, user["id"], is_teacher=is_teacher)
    return {"ok": deleted}

# --- WORKSPACE MESSAGES (TEACHER-STUDENT INTERACTION) ---
@app.get("/api/workspace-messages/{board_id}")
def list_workspace_messages(board_id: str, user: dict = Depends(get_current_user)):
    msgs = DB.list_workspace_messages(board_id)
    return {"ok": True, "messages": msgs}

@app.post("/api/workspace-messages/send")
def send_workspace_message(req: WorkspaceMessageRequest, user: dict = Depends(get_current_user)):
    msg = DB.add_workspace_message(
        req.breadboardId, user["id"], user["name"], user["role"], req.type, req.content, req.payload
    )
    return {"ok": True, "message": msg}

# --- CURRICULUM & PROGRESS ---
@app.get("/api/curriculum")
def get_curriculum():
    # Recargar si está disponible para asegurar cambios en vivo
    curriculum_path = os.path.join(BASE_DIR, 'data', 'curriculo_50_labs.json')
    if os.path.exists(curriculum_path):
        try:
            with open(curriculum_path, 'r', encoding='utf-8') as f:
                return {"ok": True, "curriculum": json.load(f)}
        except Exception:
            pass
    return {"ok": True, "curriculum": CURRICULUM_DATA}

@app.get("/api/cohort-metrics")
def get_cohort_metrics():
    cohorte_path = os.path.join(BASE_DIR, 'data', 'cohorte.json')
    if os.path.exists(cohorte_path):
        try:
            with open(cohorte_path, 'r', encoding='utf-8') as f:
                return {"ok": True, "metrics": json.load(f)}
        except Exception:
            pass
    return {"ok": True, "metrics": {}}

@app.get("/api/progress")
def get_progress(userId: Optional[str] = None, user: Optional[dict] = Depends(get_optional_user)):
    if not user:
        return {"ok": True, "userId": None, "progress": []}
    target_id = user["id"]
    if userId and user.get("role") == "teacher":
        target_id = userId
    prog = DB.get_user_progress(target_id)
    return {"ok": True, "userId": target_id, "progress": prog}

@app.post("/api/progress/save")
def save_progress(req: ProgressSaveRequest, user: dict = Depends(get_current_user)):
    DB.save_lab_progress(
        user["id"], req.circuitId, req.level, req.labNumber, req.status,
        req.score, req.timeSpent, req.mistakesCount, req.mistakesDetail, req.feedback
    )
    return {"ok": True, "saved": True}

# --- USABILITY TESTING ---
@app.post("/api/interviews/submit")
def submit_interview(req: InterviewSubmitRequest, user: dict = Depends(get_current_user)):
    data = req.model_dump()
    data["userId"] = user["id"]
    rec = DB.save_interview(data)
    return {"ok": True, "interview": rec}

@app.get("/api/interviews")
def list_interviews(teacher: dict = Depends(require_teacher)):
    interviews = DB.list_interviews()
    return {"ok": True, "interviews": interviews}

# ================= STATIC FRONTEND SERVING =================
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
if not os.path.exists(FRONTEND_DIR):
    FRONTEND_DIR = os.path.join(BASE_DIR, "src")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/robots.txt", response_class=PlainTextResponse)
def get_robots_txt():
    robots_path = os.path.join(FRONTEND_DIR, "robots.txt")
    if os.path.exists(robots_path):
        with open(robots_path, 'r', encoding='utf-8') as f:
            return PlainTextResponse(f.read(), media_type="text/plain")
    return PlainTextResponse("User-agent: *\nAllow: /\nDisallow: /api/\n", media_type="text/plain")

@app.get("/sitemap.xml")
def get_sitemap():
    sitemap_path = os.path.join(FRONTEND_DIR, "sitemap.xml")
    if os.path.exists(sitemap_path):
        return FileResponse(sitemap_path, media_type="application/xml")
    return Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://circuitlens-app.onrender.com/</loc></url></urlset>', media_type="application/xml")

@app.get("/")
def serve_index():
    index_file = os.path.join(FRONTEND_DIR, "circuitlens.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "CircuitLens API operativa"}

@app.get("/{file_name:path}")
def serve_static_root(file_name: str):
    target = os.path.join(FRONTEND_DIR, file_name)
    if os.path.exists(target) and os.path.isfile(target):
        return FileResponse(target)
    # Default fallback to main app
    index_file = os.path.join(FRONTEND_DIR, "circuitlens.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Archivo no encontrado")
