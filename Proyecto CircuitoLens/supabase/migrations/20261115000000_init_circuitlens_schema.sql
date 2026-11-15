-- ====================================================================
-- CircuitLens Supabase Schema & Migration
-- Version: 4.0.0
-- Comprehensive Schema for Users, RBAC, Workspaces/Breadboards,
-- Collaborative Sessions, Contextual AI Chat, Progress, and Usability Tests.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS & PROFILES (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    avatar TEXT DEFAULT '🎓',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for authentication lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. USER PREFERENCES & ACCESSIBILITY SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    voice_enabled BOOLEAN DEFAULT TRUE,
    tts_enabled BOOLEAN DEFAULT TRUE,
    stt_enabled BOOLEAN DEFAULT TRUE,
    haptic_enabled BOOLEAN DEFAULT TRUE,
    high_contrast BOOLEAN DEFAULT FALSE,
    colorblind_mode BOOLEAN DEFAULT FALSE,
    calm_mode BOOLEAN DEFAULT FALSE,
    speech_rate NUMERIC(3,2) DEFAULT 1.0,
    pedagogical_tone TEXT DEFAULT 'empatico' CHECK (pedagogical_tone IN ('empatico', 'socratico', 'tecnico')),
    explanation_level TEXT DEFAULT 'auto' CHECK (explanation_level IN ('auto', 'basica', 'detallada')),
    haptic_intensity TEXT DEFAULT 'medium' CHECK (haptic_intensity IN ('light', 'medium', 'strong')),
    hands_free BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEPENDENT BREADBOARDS / WORKSPACES
CREATE TABLE IF NOT EXISTS public.breadboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Mi Protoboard',
    description TEXT,
    circuit_index INTEGER DEFAULT 0,
    placed_steps INTEGER DEFAULT 0,
    has_error BOOLEAN DEFAULT FALSE,
    error_type TEXT,
    components JSONB DEFAULT '[]'::jsonb,
    connections JSONB DEFAULT '[]'::jsonb,
    workspace_state JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT FALSE,
    room_code TEXT DEFAULT 'SALA-ELECTRO-1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breadboards_user_id ON public.breadboards(user_id);
CREATE INDEX IF NOT EXISTS idx_breadboards_room_code ON public.breadboards(room_code);

-- 5. WORKSPACE COLLABORATION & SHARED SESSIONS
-- Allows teachers to join student workspaces or manage collaborative rooms
CREATE TABLE IF NOT EXISTS public.workspace_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    breadboard_id UUID NOT NULL REFERENCES public.breadboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    access_level TEXT DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'collaborator', 'teacher')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(breadboard_id, user_id)
);

-- 6. WORKSPACE REALTIME MESSAGING & ANNOTATIONS (Teacher-Student communication)
CREATE TABLE IF NOT EXISTS public.workspace_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    breadboard_id UUID NOT NULL REFERENCES public.breadboards(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'annotation', 'nudge', 'help_request', 'system')),
    content TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_messages_board ON public.workspace_messages(breadboard_id);

-- 7. CONTEXTUAL AI TUTOR CONVERSATION HISTORY
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    breadboard_id UUID REFERENCES public.breadboards(id) ON DELETE SET NULL,
    circuit_index INTEGER,
    provider TEXT DEFAULT 'sim',
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    circuit_context JSONB DEFAULT '{}'::jsonb,
    latency_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id);

-- 8. LAB PROGRESS, CURRICULUM & EVALUATION
CREATE TABLE IF NOT EXISTS public.lab_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    circuit_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    lab_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
    score NUMERIC(5,2) DEFAULT 0.00,
    time_spent_seconds INTEGER DEFAULT 0,
    mistakes_count INTEGER DEFAULT 0,
    mistakes_detail JSONB DEFAULT '{}'::jsonb,
    evaluation_feedback TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, circuit_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_progress_user ON public.lab_progress(user_id);

-- 9. USER INTERVIEWS & USABILITY TESTING WORKFLOW
CREATE TABLE IF NOT EXISTS public.user_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('student', 'professor', 'motor_disabled', 'general')),
    interviewer_name TEXT,
    task_id TEXT,
    rating_accessibility INTEGER CHECK (rating_accessibility BETWEEN 1 AND 5),
    rating_voice_only INTEGER CHECK (rating_voice_only BETWEEN 1 AND 5),
    rating_haptics INTEGER CHECK (rating_haptics BETWEEN 1 AND 5),
    rating_learning INTEGER CHECK (rating_learning BETWEEN 1 AND 5),
    task_completion_status TEXT CHECK (task_completion_status IN ('success', 'partial', 'blocked')),
    time_to_complete_seconds INTEGER,
    qualitative_feedback TEXT,
    accessibility_barriers_noted TEXT,
    suggestions TEXT,
    interview_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breadboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interviews ENABLE ROW LEVEL SECURITY;

-- Note: In Supabase, authenticated users can access rows based on auth.uid() or role.
-- For standard service_role or API gateway with bearer tokens, backend enforces RBAC.
