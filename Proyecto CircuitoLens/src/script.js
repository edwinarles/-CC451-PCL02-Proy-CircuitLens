/* ====================================================================
   🔬 CircuitLens Platform v4.5 - Core Client Controller
   Features:
   - Full FastAPI REST Authentication & Persistent Sessions
   - Breadboard CAD Engine: Smooth Zoom Slider (50%-250%), Pan & Fit-to-Center
   - Reliable Component Snapping, Drag-and-Drop & Active States
   - Teacher-Only AI & TTS Configuration (Backend Key Vault)
   - Resilient Audio TTS Queue, Pausing, Resuming, Stopping & Step Replay
   - 50 Advanced University Engineering Laboratories with Equations & Datasheets
   ==================================================================== */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ========================================================
   1. Accesibilidad Universal: Canales de Interacción Independientes
   ======================================================== */
const Channels = {
  voice: true,
  text: true,
  haptic: true,
  voiceOnly: false,

  init() {
    this.setupUI();
    this.applySettings();
  },

  setupUI() {
    const btnV = $('#chan-voice');
    const btnT = $('#chan-text');
    const btnH = $('#chan-haptic');
    const btnVO = $('#chan-voice-only');

    if (btnV) btnV.onclick = () => { this.voice = !this.voice; this.applySettings(); };
    if (btnT) btnT.onclick = () => { this.text = !this.text; this.applySettings(); };
    if (btnH) btnH.onclick = () => { this.haptic = !this.haptic; this.applySettings(); };
    if (btnVO) {
      btnVO.onclick = () => {
        this.voiceOnly = !this.voiceOnly;
        if (this.voiceOnly) {
          this.voice = true;
          this.haptic = true;
          listen(true);
          say('Modo Solo Voz activado. Ahora puedes interactuar completamente sin usar la vista ni el teclado.');
        } else {
          say('Modo Solo Voz desactivado.');
        }
        this.applySettings();
      };
    }
  },

  applySettings() {
    const btnV = $('#chan-voice');
    const btnT = $('#chan-text');
    const btnH = $('#chan-haptic');
    const btnVO = $('#chan-voice-only');

    if (btnV) {
      btnV.classList.toggle('active', this.voice);
      btnV.classList.toggle('disabled-chan', !this.voice);
      btnV.textContent = `🎙️ Voz: ${this.voice ? 'ACTIVO' : 'INACTIVO'}`;
    }
    if (btnT) {
      btnT.classList.toggle('active', this.text);
      btnT.classList.toggle('disabled-chan', !this.text);
      btnT.textContent = `💬 Texto: ${this.text ? 'ACTIVO' : 'INACTIVO'}`;
      const cap = $('#cap');
      if (cap) cap.style.display = this.text ? 'block' : 'none';
    }
    if (btnH) {
      btnH.classList.toggle('active', this.haptic);
      btnH.classList.toggle('disabled-chan', !this.haptic);
      btnH.textContent = `📳 Háptica: ${this.haptic ? 'ACTIVO' : 'INACTIVO'}`;
    }
    if (btnVO) btnVO.classList.toggle('active', this.voiceOnly);

    const chkV = $('#o-voice-toggle');
    const chkT = $('#o-text-toggle');
    const chkH = $('#o-m');
    if (chkV) chkV.checked = this.voice;
    if (chkT) chkT.checked = this.text;
    if (chkH) chkH.checked = this.haptic;
  }
};

/* ========================================================
   2. Motor de Audio TTS Robusto con Cola, Pausa, Reanudación y Repetición
   ======================================================== */
const AudioManager = {
  queue: [],
  isSpeaking: false,
  isPaused: false,
  lastSpokenText: '',
  currentUtterance: null,

  init() {
    const btnPause = $('#audio-pause');
    const btnResume = $('#audio-resume');
    const btnStop = $('#audio-stop');
    const btnReplay = $('#audio-replay');

    if (btnPause) btnPause.onclick = () => this.pause();
    if (btnResume) btnResume.onclick = () => this.resume();
    if (btnStop) btnStop.onclick = () => this.stop();
    if (btnReplay) btnReplay.onclick = () => this.replay();
  },

  speak(text, alertType = 0) {
    this.lastSpokenText = text;
    this.syncVisuals(text);

    if (!Channels.voice || !O('o-t') || !window.speechSynthesis) {
      return;
    }

    this.stop(); // Prevenir overlapping speech

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-PE';
    u.rate = UserProfile.data.preferencias.velocidadVoz || 1.0;

    const wave = $('#v-wave');
    u.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      if (wave) wave.classList.add('active');
    };

    u.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      if (wave) wave.classList.remove('active');
      const spokenBox = $('#spoken-instruction-box');
      if (spokenBox) spokenBox.style.display = 'none';
    };

    u.onerror = () => {
      this.isSpeaking = false;
      if (wave) wave.classList.remove('active');
    };

    this.currentUtterance = u;
    speechSynthesis.speak(u);
  },

  pause() {
    if (window.speechSynthesis && this.isSpeaking && !this.isPaused) {
      speechSynthesis.pause();
      this.isPaused = true;
      const wave = $('#v-wave');
      if (wave) wave.classList.remove('active');
    }
  },

  resume() {
    if (window.speechSynthesis && this.isPaused) {
      speechSynthesis.resume();
      this.isPaused = false;
      const wave = $('#v-wave');
      if (wave) wave.classList.add('active');
    }
  },

  stop() {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      const wave = $('#v-wave');
      if (wave) wave.classList.remove('active');
      const spokenBox = $('#spoken-instruction-box');
      if (spokenBox) spokenBox.style.display = 'none';
    }
  },

  replay() {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText);
    }
  },

  syncVisuals(text) {
    const spokenBox = $('#spoken-instruction-box');
    const spokenCurrent = $('#spoken-text-current');
    if (spokenBox && spokenCurrent && Channels.text) {
      spokenBox.style.display = 'block';
      spokenCurrent.textContent = text;
    }
  }
};

/* ========================================================
   3. Motor Háptico Universal
   ======================================================== */
const HapticEngine = {
  isSupported: 'vibrate' in navigator,

  trigger(patternType) {
    if (!Channels.haptic || !O('o-m')) return;
    const patterns = {
      click: [35],
      success: [50, 40, 90],
      error: [120, 60, 120, 60, 180],
      nudge: [80, 50, 80],
      help: [150, 100, 150]
    };
    const pat = patterns[patternType] || [50];
    if (this.isSupported) {
      try { navigator.vibrate(pat); } catch (e) {}
    } else {
      const bd = $('#bd');
      if (bd) {
        bd.style.transition = 'filter 0.15s ease';
        bd.style.filter = patternType === 'error' ? 'drop-shadow(0 0 12px red)' : 'drop-shadow(0 0 12px #38bdf8)';
        setTimeout(() => { bd.style.filter = 'none'; }, 250);
      }
    }
  }
};

/* ========================================================
   4. Autenticación RBAC y Conexión Backend FastAPI
   ======================================================== */
const Auth = {
  user: null,
  token: null,

  async init() {
    try {
      const savedUser = localStorage.getItem('cl.auth_user');
      const savedToken = localStorage.getItem('cl.auth_token');
      if (savedUser && savedToken) {
        this.user = JSON.parse(savedUser);
        this.token = savedToken;
      }
    } catch (e) {}

    // Verify token with FastAPI backend
    if (this.token) {
      try {
        const resp = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (resp.ok) {
          const d = await resp.json();
          if (d.ok && d.user) this.user = d.user;
        } else {
          this.token = null;
          this.user = null;
          localStorage.removeItem('cl.auth_token');
          localStorage.removeItem('cl.auth_user');
        }
      } catch (e) {}
    }

    // Default guest student session if none
    if (!this.user) {
      this.user = {
        id: 'ALU-' + Math.floor(100 + Math.random() * 900),
        name: 'Estudiante Invitado',
        email: 'invitado@circuitlens.edu.pe',
        role: 'student',
        avatar: '🎓'
      };
    }

    this.applyRolePermissions();
    this.setupUI();
  },

  async toggleRole() {
    if (this.user && this.user.role === 'teacher') {
      await this.login('estudiante@circuitlens.edu.pe', 'student123', 'student', 'Piero Castillo');
      const tabEst = document.querySelector('nav button[data-t="est"]');
      if (tabEst) tabEst.click();
    } else {
      await this.login('docente@circuitlens.edu.pe', 'CircuitLens2026!', 'teacher', 'Prof. Edwin Requena');
      const tabIns = document.querySelector('nav button[data-t="ins"]');
      if (tabIns) tabIns.click();
    }
  },

  async login(email, password, role, name) {
    let success = false;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          this.user = data.user;
          this.token = data.token;
          success = true;
        }
      }
    } catch (e) {
      // Backend offline / modo local
    }

    // Fallback local robusto (garantiza que el cambio de cuenta NUNCA se bloquee)
    if (!success) {
      const isDoc = (role === 'teacher' || (email && (email.includes('docente') || email.includes('prof'))));
      this.user = {
        id: isDoc ? 'DOC-001' : 'ALU-' + Math.floor(100 + Math.random() * 900),
        name: name || (isDoc ? 'Prof. Edwin Requena' : (email ? email.split('@')[0] : 'Piero Castillo')),
        email: email || (isDoc ? 'docente@circuitlens.edu.pe' : 'estudiante@circuitlens.edu.pe'),
        role: isDoc ? 'teacher' : 'student',
        avatar: isDoc ? '👨‍🏫' : '🎓'
      };
      this.token = 'local_token_' + Date.now();
    }

    localStorage.setItem('cl.auth_token', this.token);
    localStorage.setItem('cl.auth_user', JSON.stringify(this.user));
    if (typeof UserProfile !== 'undefined' && UserProfile.data) {
      UserProfile.data.id = this.user.id;
      UserProfile.data.alias = this.user.name;
      UserProfile.save();
    }

    this.applyRolePermissions();
    say(`Bienvenido ${this.user.name}. Modo ${this.user.role === 'teacher' ? 'Docente' : 'Estudiante'} activado.`);
    return { ok: true };
  },

  applyRolePermissions() {
    const isDoc = (this.user.role === 'teacher');
    document.documentElement.classList.toggle('role-teacher', isDoc);
    document.documentElement.classList.toggle('role-student', !isDoc);
    document.body.classList.toggle('role-teacher', isDoc);
    document.body.classList.toggle('role-student', !isDoc);
    const badge = $('#user-badge');
    if (badge) {
      badge.innerHTML = `${this.user.avatar || '🎓'} ${this.user.name} <small style="opacity:0.85; font-size:11px; font-weight:700;">(${isDoc ? 'Docente' : 'Estudiante'})</small>`;
      badge.style.borderColor = isDoc ? 'var(--ac2)' : 'var(--ac)';
    }

    const btnToggle = $('#btn-quick-toggle-role');
    if (btnToggle) {
      if (isDoc) {
        btnToggle.innerHTML = '↔ Modo Estudiante 🎓';
        btnToggle.style.background = 'var(--good)';
        btnToggle.title = 'Sesión actual: DOCENTE. Clic para cambiar a Estudiante.';
      } else {
        btnToggle.innerHTML = '↔ Modo Docente 👨‍🏫';
        btnToggle.style.background = 'var(--ac)';
        btnToggle.title = 'Sesión actual: ESTUDIANTE. Clic para cambiar a Docente.';
      }
    }

    $$('nav button').forEach((btn) => {
      const tabId = btn.dataset.t;
      if (isDoc) {
        // En modo docente, ocultar pestañas de construcción de laboratorios del estudiante
        if (tabId === 'est' || tabId === 'workspaces' || tabId === 'prf') {
          btn.style.display = 'none';
        } else {
          btn.style.display = 'inline-flex';
        }
      } else {
        // En modo estudiante, ocultar pestañas exclusivas del docente
        if (tabId === 'ins' || tabId === 'teacher-settings' || tabId === 'interviews') {
          btn.style.display = 'none';
        } else {
          btn.style.display = 'inline-flex';
        }
      }
    });

    // Activar automáticamente la vista correspondiente según el rol
    const targetTabId = isDoc ? 'ins' : 'est';
    $$('nav button').forEach((b) => b.setAttribute('aria-selected', b.dataset.t === targetTabId));
    $$('.tab').forEach((t) => t.classList.toggle('on', t.id === targetTabId));

    const btnSave = $('#btn-save-workspace');
    const btnNew = $('#btn-new-workspace');
    if (isDoc) {
      if (btnSave) btnSave.style.display = 'none';
      if (btnNew) btnNew.style.display = 'none';
      TeacherSettings.loadConfig();
      if (typeof updateCohortMetricsUI === 'function') updateCohortMetricsUI();
      if (typeof TeacherSupervisor !== 'undefined') {
        TeacherSupervisor.init();
        TeacherSupervisor.renderRoster();
        TeacherSupervisor.drawSelectedStudentBoard();
      }
    } else {
      if (btnSave) btnSave.style.display = 'inline-flex';
      if (btnNew) btnNew.style.display = 'inline-flex';
      render();
    }
  },

  setupUI() {
    const btnSwitch = $('#btn-switch-account');
    const modal = $('#modal-auth');
    const btnClose = $('#btn-close-auth-modal');
    const btnSubmit = $('#btn-login-submit');
    const btnQuickToggle = $('#btn-quick-toggle-role');
    const cardStudent = $('#card-login-student');
    const cardTeacher = $('#card-login-teacher');
    const btnFillDemo = $('#btn-fill-teacher-demo');

    if (btnQuickToggle) {
      btnQuickToggle.onclick = () => {
        this.toggleRole();
      };
    }

    if (btnSwitch && modal) btnSwitch.onclick = () => { modal.style.display = 'flex'; };
    if (btnClose && modal) btnClose.onclick = () => { modal.style.display = 'none'; };

    if (cardStudent) {
      cardStudent.onclick = async () => {
        await this.login('estudiante@circuitlens.edu.pe', 'student123', 'student', 'Piero Castillo');
        if (modal) modal.style.display = 'none';
        WorkspaceManager.loadUserWorkspaces();
        const tabEst = document.querySelector('nav button[data-t="est"]');
        if (tabEst) tabEst.click();
      };
    }

    if (cardTeacher) {
      cardTeacher.onclick = async () => {
        await this.login('docente@circuitlens.edu.pe', 'CircuitLens2026!', 'teacher', 'Prof. Edwin Requena');
        if (modal) modal.style.display = 'none';
        WorkspaceManager.loadUserWorkspaces();
        const tabIns = document.querySelector('nav button[data-t="ins"]');
        if (tabIns) tabIns.click();
      };
    }

    if (btnFillDemo) {
      btnFillDemo.onclick = () => {
        if ($('#login-email')) $('#login-email').value = 'docente@circuitlens.edu.pe';
        if ($('#login-password')) $('#login-password').value = 'CircuitLens2026!';
        if ($('#login-role')) $('#login-role').value = 'teacher';
      };
    }

    if (btnSubmit) {
      btnSubmit.onclick = async () => {
        const email = $('#login-email').value.trim();
        const pass = $('#login-password').value;
        const role = $('#login-role').value;
        const errEl = $('#login-error-msg');
        errEl.textContent = 'Autenticando...';

        const res = await this.login(email, pass, role);
        if (res.ok) {
          errEl.textContent = '';
          modal.style.display = 'none';
          WorkspaceManager.loadUserWorkspaces();
          if (role === 'teacher') {
            const tabIns = document.querySelector('nav button[data-t="ins"]');
            if (tabIns) tabIns.click();
          }
        } else {
          errEl.textContent = res.error;
        }
      };
    }
  }
};

/* ========================================================
   5. Configuración Exclusiva del Docente (AI Key Vault)
   ======================================================== */
const TeacherSettings = {
  async loadConfig() {
    if (!Auth.token || Auth.user.role !== 'teacher') return;
    try {
      const resp = await fetch('/api/teacher/settings', {
        headers: { 'Authorization': `Bearer ${Auth.token}` }
      });
      if (resp.ok) {
        const d = await resp.json();
        const s = d.settings || {};
        if ($('#teacher-ai-provider')) $('#teacher-ai-provider').value = s.provider || 'gemini';
        if ($('#teacher-ai-model')) $('#teacher-ai-model').value = s.model || 'gemini-1.5-flash';
        if ($('#teacher-ai-base-url')) $('#teacher-ai-base-url').value = s.openai_base_url || 'https://api.openai.com/v1';
        if ($('#teacher-ollama-host')) $('#teacher-ollama-host').value = s.ollama_host || 'http://localhost:11434';
        this.updateVisibility();
      }
    } catch (e) {}
  },

  updateVisibility() {
    const prov = $('#teacher-ai-provider') ? $('#teacher-ai-provider').value : 'gemini';
    const isOA = (prov === 'openai');
    const isOll = (prov === 'ollama');
    if ($('#teacher-openai-base-container')) $('#teacher-openai-base-container').style.display = isOA ? 'block' : 'none';
    if ($('#teacher-ollama-container')) $('#teacher-ollama-container').style.display = isOll ? 'block' : 'none';
  },

  async saveConfig() {
    const prov = $('#teacher-ai-provider').value;
    const key = $('#teacher-ai-key').value.trim();
    const model = $('#teacher-ai-model').value.trim();
    const bUrl = $('#teacher-ai-base-url') ? $('#teacher-ai-base-url').value.trim() : null;
    const oHost = $('#teacher-ollama-host') ? $('#teacher-ollama-host').value.trim() : null;
    const statusEl = $('#teacher-ai-status');

    statusEl.textContent = 'Guardando configuración...';
    statusEl.style.color = 'var(--fg)';

    try {
      const resp = await fetch('/api/teacher/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.token}`
        },
        body: JSON.stringify({
          provider: prov,
          api_key: key || undefined,
          model: model,
          openai_base_url: bUrl,
          ollama_host: oHost
        })
      });
      if (resp.ok) {
        statusEl.textContent = '✅ Configuración IA guardada en el servidor.';
        statusEl.style.color = 'var(--good)';
        say('Configuración de inteligencia artificial actualizada en el servidor.');
      } else {
        statusEl.textContent = '❌ Error al guardar en backend.';
        statusEl.style.color = 'var(--bad)';
      }
    } catch (e) {
      statusEl.textContent = '❌ Error de conexión.';
      statusEl.style.color = 'var(--bad)';
    }
  },

  async testConnection() {
    const prov = $('#teacher-ai-provider').value;
    const key = $('#teacher-ai-key').value.trim();
    const model = $('#teacher-ai-model').value.trim();
    const bUrl = $('#teacher-ai-base-url') ? $('#teacher-ai-base-url').value.trim() : null;
    const statusEl = $('#teacher-ai-status');

    statusEl.textContent = 'Probando conectividad con el proveedor...';
    statusEl.style.color = 'var(--bd-focus)';

    try {
      const resp = await fetch('/api/teacher/test-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.token}`
        },
        body: JSON.stringify({ provider: prov, api_key: key || undefined, model: model, base_url: bUrl })
      });
      const d = await resp.json();
      if (d.ok) {
        statusEl.textContent = `✅ ${d.message} (${d.latency_ms} ms)`;
        statusEl.style.color = 'var(--good)';
      } else {
        statusEl.textContent = `❌ ${d.error || 'Fallo de conexión'}`;
        statusEl.style.color = 'var(--bad)';
      }
    } catch (e) {
      statusEl.textContent = '❌ Error al comunicar con backend.';
      statusEl.style.color = 'var(--bad)';
    }
  }
};

/* ========================================================
   6. CAD Breadboard Engine: Smooth Zoom Slider, Pan & Snapping
   ======================================================== */
const BreadboardCAD = {
  zoom: 1.0,        // 0.5 to 2.5
  panX: 0,
  panY: 0,
  isPanning: false,
  startX: 0,
  startY: 0,

  init() {
    const slider = $('#breadboard-zoom-slider');
    const btnIn = $('#btn-zoom-in');
    const btnOut = $('#btn-zoom-out');
    const btnReset = $('#btn-zoom-reset');
    const viewport = $('#bw-viewport');

    if (slider) {
      slider.oninput = (e) => {
        this.setZoom(parseInt(e.target.value, 10) / 100);
      };
    }

    if (btnIn) btnIn.onclick = () => this.setZoom(this.zoom + 0.15);
    if (btnOut) btnOut.onclick = () => this.setZoom(this.zoom - 0.15);
    if (btnReset) btnReset.onclick = () => this.resetView();

    // Mouse Pan on Viewport
    if (viewport) {
      viewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('circle.ring') || e.target.closest('button')) return;
        this.isPanning = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isPanning) return;
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.applyTransform();
      });

      window.addEventListener('mouseup', () => {
        this.isPanning = false;
      });

      // Wheel Zoom around cursor
      viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        this.setZoom(this.zoom + delta);
      }, { passive: false });
    }

    this.resetView();
  },

  setZoom(val) {
    this.zoom = Math.max(0.5, Math.min(2.5, Math.round(val * 100) / 100));
    const slider = $('#breadboard-zoom-slider');
    const label = $('#zoom-val-label');
    if (slider) slider.value = Math.round(this.zoom * 100);
    if (label) label.textContent = `${Math.round(this.zoom * 100)}%`;
    this.applyTransform();
  },

  resetView() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    const slider = $('#breadboard-zoom-slider');
    const label = $('#zoom-val-label');
    if (slider) slider.value = 100;
    if (label) label.textContent = '100%';
    this.applyTransform();
  },

  applyTransform() {
    const target = $('#bw-pan-target');
    if (target) {
      target.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }
  }
};

/* ========================================================
   7. Resistencia y Códigos de Colores
   ======================================================== */
const BAND = {
  100: ['Marrón', 'Negro', 'Marrón', ['#852', '#111', '#852']],
  120: ['Marrón', 'Rojo', 'Marrón', ['#852', '#d22', '#852']],
  220: ['Rojo', 'Rojo', 'Marrón', ['#d22', '#d22', '#852']],
  330: ['Naranja', 'Naranja', 'Marrón', ['#f80', '#f80', '#852']],
  470: ['Amarillo', 'Violeta', 'Marrón', ['#ea0', '#852', '#852']],
  1000: ['Marrón', 'Negro', 'Rojo', ['#852', '#111', '#d22']],
  2200: ['Rojo', 'Rojo', 'Rojo', ['#d22', '#d22', '#d22']],
  4700: ['Amarillo', 'Violeta', 'Rojo', ['#ea0', '#852', '#d22']],
  10000: ['Marrón', 'Negro', 'Naranja', ['#852', '#111', '#f80']],
  100000: ['Marrón', 'Negro', 'Amarillo', ['#852', '#111', '#ea0']]
};

const val = (v) => (v >= 1000 ? v / 1000 + ' kΩ' : v + ' Ω');
const pn = (p) =>
  /^p/.test(p)
    ? 'riel + ' + p.slice(1)
    : /^m/.test(p)
    ? 'riel − ' + p.slice(1)
    : 'pin ' + p;

const W = (c, a, b, l) => ({ k: 'wire', c, a, b, l: l || `Cable: ${pn(a)} → ${pn(b)}` });
const Rz = (v, a, b, l) => ({ k: 'res', v, a, b, l: l || `Resistencia ${val(v)}: ${pn(a)} → ${pn(b)}` });
const L = (c, a, b, l) => ({ k: 'led', c, a, b, l: l || `Diodo / LED: ${pn(a)} → ${pn(b)}` });
const B = (a, b, l) => ({ k: 'btn', a, b, l: l || `Pulsador: ${pn(a)} → ${pn(b)}` });
const Cap = (v, a, b, l) => ({ k: 'cap', v: v || '10 µF', a, b, l: l || `Condensador ${v || '10 µF'}: ${pn(a)} (+) → ${pn(b)} (−)` });
const Dio = (t, a, b, l) => ({ k: 'diode', t: t || '1N4007', a, b, l: l || `Diodo ${t || '1N4007'}: ${pn(a)} → ${pn(b)}` });
const IC = (n, a, b, l) => ({ k: 'ic', n: n || 'IC', a, b, l: l || `Circuito Integrado ${n || 'IC'}: ${pn(a)} a ${pn(b)}` });
const Tr = (t, a, b, l) => ({ k: 'trans', t: t || '2N2222', a, b, l: l || `Transistor ${t || '2N2222'}: colector ${pn(a)} → emisor ${pn(b)}` });

let ALL_LABS = [
  {
    "id": 0,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 1,
    "complejidad": "basico",
    "complejidadTexto": "🟢 Sencillo",
    "nombre": "L1.1 — Ley de Ohm y Divisor Resistivo Elemental",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Comprobar la Ley de Ohm (V=I*R) y el cálculo de voltajes nodales en resistores serie.",
    "ecuaciones": "I = V / (R1 + R2), V_nodo = Vcc * R2 / (R1 + R2)",
    "descripcion": "Divisor de tensión elemental para comprobar caída de potencial y ley de Ohm.",
    "medicionesEsperadas": "V_nodo = 3.76 V con Vcc=5V, R1=330 Ω, R2=1 kΩ.",
    "diagnosticoResolucion": "Verificar continuidad en nodo intermedio 10b-10c.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p2",
        "a": "5a",
        "etiqueta": "Línea de alimentación Vcc (+5V) al protoboard"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "5b",
        "a": "9b",
        "etiqueta": "R1 (330 Ω): Resistor superior limitador"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "9c",
        "a": "13c",
        "etiqueta": "R2 (1 kΩ): Resistor inferior a nodo de medición"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "13e",
        "a": "m13",
        "etiqueta": "Retorno de referencia a GND (-)"
      }
    ]
  },
  {
    "id": 1,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 2,
    "complejidad": "basico",
    "complejidadTexto": "🟢 Sencillo",
    "nombre": "L1.2 — Circuito LED con Pulsador y Resistor de Polarización",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Implementar control manual on/off de un diodo emisor de luz con protección resistiva.",
    "ecuaciones": "R_lim = (Vcc - V_led) / I_led = (5V - 2V) / 10mA = 300 Ω ~ 330 Ω",
    "descripcion": "Pulsador táctil normalmente abierto que activa un LED rojo con resistor de 330 Ω.",
    "medicionesEsperadas": "V_led = 1.95 V encendido, I_led = 9.2 mA.",
    "diagnosticoResolucion": "Si el LED no enciende, comprobar la polaridad: cátodo (pata corta) a tierra.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "6a",
        "etiqueta": "Vcc 5V hacia terminal de entrada del pulsador"
      },
      {
        "type": "btn",
        "de": "6b",
        "a": "10b",
        "etiqueta": "Pulsador táctil normalmente abierto (NO)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "10c",
        "a": "14c",
        "etiqueta": "Resistor limitador R (330 Ω)"
      },
      {
        "type": "led",
        "color": "#e33",
        "de": "14d",
        "a": "m14",
        "etiqueta": "Diodo LED rojo: Ánodo en 14d, Cátodo a GND (m14)"
      }
    ]
  },
  {
    "id": 2,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 3,
    "complejidad": "basico",
    "complejidadTexto": "🟢 Sencillo",
    "nombre": "L1.3 — Red Serie-Paralelo y Leyes de Kirchhoff (KVL/KCL)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Verificar la división de corriente en ramas paralelas y la conservación de la energía.",
    "ecuaciones": "sum(I_in) = sum(I_out), R_eq = R1 + (R2 || R3)",
    "descripcion": "Circuito mixto con un resistor en serie y dos ramas resistivas paralelas idénticas.",
    "medicionesEsperadas": "R_eq = 720 Ω. Corriente dividida exactamente a la mitad en cada rama (R2 y R3).",
    "diagnosticoResolucion": "Verificar que ambas resistencias paralelas compartan los mismos nodos 9 y 13.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p2",
        "a": "5a",
        "etiqueta": "Alimentación Vcc 5V a nodo de entrada"
      },
      {
        "type": "res",
        "valor": 220,
        "de": "5b",
        "a": "9b",
        "etiqueta": "R_serie (220 Ω) en rama principal"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "9c",
        "a": "13c",
        "etiqueta": "R_rama1 (1 kΩ) en paralelo"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "9d",
        "a": "13d",
        "etiqueta": "R_rama2 (1 kΩ) en paralelo"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "13e",
        "a": "m13",
        "etiqueta": "Retorno de corriente común a GND"
      }
    ]
  },
  {
    "id": 3,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 4,
    "complejidad": "basico",
    "complejidadTexto": "🟢 Sencillo",
    "nombre": "L1.4 — Teorema de Thévenin y Circuito Equivalente",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Obtener el voltaje de circuito abierto Vth y la resistencia equivalente Rth.",
    "ecuaciones": "Vth = Vcc * R2 / (R1 + R2), Rth = R1 || R2",
    "descripcion": "Determinación experimental de los parámetros Thévenin y efecto de carga con R_load.",
    "medicionesEsperadas": "Vth = 2.50 V, Rth = 500 Ω, V_load = 2.03 V con R_load=2.2 kΩ.",
    "diagnosticoResolucion": "Asegurar que la carga R_load conecte entre el nodo Thévenin y tierra.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "7a",
        "etiqueta": "Vcc 5V a red generadora Thévenin"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "7b",
        "a": "11b",
        "etiqueta": "R1 Thévenin (1 kΩ)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "11c",
        "a": "m11",
        "etiqueta": "R2 Thévenin (1 kΩ) a GND"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "11d",
        "a": "15d",
        "etiqueta": "R_load (2.2 kΩ): Resistor de carga de prueba"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "15e",
        "a": "m15",
        "etiqueta": "Cierre de malla de carga a GND"
      }
    ]
  },
  {
    "id": 4,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 5,
    "complejidad": "basico",
    "complejidadTexto": "🟢 Sencillo",
    "nombre": "L1.5 — Teorema de Norton y Transformación de Fuentes",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Evaluar la corriente de cortocircuito I_N y su equivalencia dual con el modelo Thévenin.",
    "ecuaciones": "I_N = Vth / Rth, R_N = Rth",
    "descripcion": "Verificación del modelo dual de Norton con resistencia en paralelo y rama de carga.",
    "medicionesEsperadas": "I_N = 15.1 mA, V_carga concordante con la transformación dual.",
    "diagnosticoResolucion": "Comprobar que Rn derive a tierra en paralelo al nodo de salida.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "6a",
        "etiqueta": "Línea de alimentación V_in 5V"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "6b",
        "a": "m6",
        "etiqueta": "R_norton (330 Ω) derivación en paralelo a GND"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "6c",
        "a": "10c",
        "etiqueta": "R_acoplo (1 kΩ) hacia carga"
      },
      {
        "type": "res",
        "valor": 470,
        "de": "10d",
        "a": "m10",
        "etiqueta": "R_carga (470 Ω) a tierra"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "10b",
        "a": "14b",
        "etiqueta": "Terminal de prueba para amperímetro (I_sc)"
      }
    ]
  },
  {
    "id": 5,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 6,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L1.6 — Máxima Transferencia de Potencia y Puente de Wheatstone",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Demostrar que P_L es máxima cuando R_L = Rth y equilibrar una red en puente de 4 ramas.",
    "ecuaciones": "P_max = Vth^2 / (4 * Rth), V_AB = 0 cuando R1/R2 = R3/Rx",
    "descripcion": "Puente de Wheatstone con 4 ramas resistivas y medición diferencial de balance.",
    "medicionesEsperadas": "V_diferencial V_AB = 0.00 V en equilibrio con resistores iguales.",
    "diagnosticoResolucion": "Si V_AB != 0, verificar tolerancia de las resistencias del puente.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p2",
        "a": "6a",
        "etiqueta": "Excitación Vcc (+5V) al vértice superior del puente"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "6b",
        "a": "10b",
        "etiqueta": "R1 (1 kΩ) en rama izquierda superior"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "6c",
        "a": "14b",
        "etiqueta": "R3 (1 kΩ) en rama derecha superior"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "10c",
        "a": "m10",
        "etiqueta": "R2 (1 kΩ) en rama izquierda inferior a GND"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "14c",
        "a": "m14",
        "etiqueta": "Rx (1 kΩ) en rama derecha inferior a GND"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "10d",
        "a": "14d",
        "etiqueta": "Línea diferencial galvanométrica de balance (Nodo A -> Nodo B)"
      }
    ]
  },
  {
    "id": 6,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 7,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L1.7 — Respuesta Transitoria de Circuitos RC de Primer Orden",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Medir la constante de tiempo tau = R*C y la curva de carga y descarga exponencial.",
    "ecuaciones": "tau = R * C = 1000 * 10e-6 = 10 ms, Vc(t) = V0 * (1 - e^(-t/tau))",
    "descripcion": "Circuito RC con condensador electrolítico, resistencia de carga y pulsador de descarga.",
    "medicionesEsperadas": "Vc a 1 tau = 3.16 V (63.2% de 5V), descarga completa en ~5 tau (50 ms).",
    "diagnosticoResolucion": "Verificar polaridad del condensador: pata con franja (-) al riel GND m16.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "8a",
        "etiqueta": "Vcc 5V línea de carga"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "8b",
        "a": "12b",
        "etiqueta": "R_carga (1 kΩ): fija constante de tiempo tau"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "12c",
        "a": "16c",
        "etiqueta": "Condensador electrolítico C (10 µF): Ánodo en 12c"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "16e",
        "a": "m16",
        "etiqueta": "GND negativo de retorno del condensador"
      },
      {
        "type": "btn",
        "de": "12d",
        "a": "16d",
        "etiqueta": "Pulsador de descarga rápida en paralelo con C"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "12e",
        "a": "19e",
        "etiqueta": "Sonda de monitoreo del nodo de tensión Vc(t)"
      }
    ]
  },
  {
    "id": 7,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 8,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L1.8 — Respuesta Transitoria de Circuitos RL y Fem Autoinducida",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Analizar la constante de tiempo inductiva tau = L / R y la protección por diodo volante.",
    "ecuaciones": "tau = L / R, V_ind = -L * (di / dt)",
    "descripcion": "Bobina inductiva con resistencia amortiguadora y diodo volante flyback.",
    "medicionesEsperadas": "Supresión efectiva del pico inductivo inverso mediante el diodo flyback.",
    "diagnosticoResolucion": "El diodo volante debe estar polarizado en inversa respecto a Vcc.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Línea DC de alimentación controlada"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "7b",
        "a": "11b",
        "etiqueta": "R_amortiguación (330 Ω) limitadora"
      },
      {
        "type": "diode",
        "t": "1N4007",
        "de": "11c",
        "a": "7c",
        "etiqueta": "Diodo volante flyback 1N4007 (supresor de transitorios)"
      },
      {
        "type": "res",
        "valor": 220,
        "de": "11d",
        "a": "15d",
        "etiqueta": "R_bobina (220 Ω) que modela el devanado inductivo L"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "15e",
        "a": "m15",
        "etiqueta": "Retorno de corriente a GND"
      }
    ]
  },
  {
    "id": 8,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 9,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L1.9 — Impedancia Compleja y Red Desfasadora RC en Régimen AC",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Comprobar relaciones fasoriales de tensión y corriente en impedancias Z = R - jXc.",
    "ecuaciones": "Z = sqrt(R^2 + Xc^2), theta = -arctan(1 / (2*pi*f*R*C))",
    "descripcion": "Red desfasadora RC con monitoreo en doble canal de entrada y salida.",
    "medicionesEsperadas": "Desfase angular medido en osciloscopio: V_salida atrasada ~45° a f=f_corte.",
    "diagnosticoResolucion": "Verificar acoplamiento en modo AC en la sonda del osciloscopio.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "8a",
        "etiqueta": "Señal AC sinusoidal del generador de funciones"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "8b",
        "a": "12b",
        "etiqueta": "R_referencia (1 kΩ)"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "12c",
        "a": "16c",
        "etiqueta": "Condensador desfasador C (10 µF)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "16d",
        "a": "m16",
        "etiqueta": "Resistor de carga en derivación a GND (2.2 kΩ)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "12e",
        "a": "19e",
        "etiqueta": "Sonda Canal 2 (V_out desfasada)"
      }
    ]
  },
  {
    "id": 9,
    "nivel": 1,
    "nivelNombre": "Nivel 1 — Análisis Avanzado de Circuitos",
    "laboratorioNumero": 10,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L1.10 — Resonancia Serie RLC y Factor de Calidad (Q)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Identificar la frecuencia de resonancia f_0 = 1 / (2*pi*sqrt(L*C)) y el ancho de banda BW.",
    "ecuaciones": "f_0 = 1 / (2*pi*sqrt(L*C)), Q = (1/R) * sqrt(L/C)",
    "descripcion": "Circuito RLC serie con respuesta de pico de corriente e indicador de resonancia.",
    "medicionesEsperadas": "Impedancia mínima puramente resistiva (Z = R) y corriente pico en f = f_0.",
    "diagnosticoResolucion": "Asegurar que el condensador y resistor compartan nodo serie 11 y 15.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Entrada de señal de frecuencia variable (barrido)"
      },
      {
        "type": "res",
        "valor": 100,
        "de": "7b",
        "a": "11b",
        "etiqueta": "R_Q (100 Ω): Resistor amortiguador que fija el factor Q"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "11c",
        "a": "15c",
        "etiqueta": "Condensador de sintonía C (10 µF)"
      },
      {
        "type": "res",
        "valor": 220,
        "de": "15d",
        "a": "19d",
        "etiqueta": "Inductor serie equivalente L (devanado 220 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "19e",
        "a": "m19",
        "etiqueta": "LED indicador de resonancia y máxima corriente"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "19f",
        "a": "m20",
        "etiqueta": "GND de retorno del lazo RLC"
      }
    ]
  },
  {
    "id": 10,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 1,
    "complejidad": "basico",
    "complejidadTexto": "🟢 Sencillo",
    "nombre": "L2.1 — Curva Característica I-V del Diodo Semiconductor",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Determinar la tensión de umbral V_gamma (0.7V en Si) y la resistencia dinámica r_d.",
    "ecuaciones": "I_D = I_S * (e^(V_D / (n*V_T)) - 1), r_d = 26 mV / I_D",
    "descripcion": "Polarización directa de diodo 1N4007 con resistencia limitadora de corriente.",
    "medicionesEsperadas": "V_diodo = 0.68 V a 15 mA. Conducción exponencial clara sobre 0.6 V.",
    "diagnosticoResolucion": "Verificar franja plateada (cátodo) hacia el terminal de menor potencial 10b.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "6a",
        "etiqueta": "Fuente de voltaje variable V_in"
      },
      {
        "type": "diode",
        "t": "1N4007",
        "de": "6b",
        "a": "10b",
        "etiqueta": "Diodo rectificador 1N4007: Ánodo en 6b, Cátodo en 10b"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "10c",
        "a": "14c",
        "etiqueta": "Resistor limitador R (330 Ω)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "14e",
        "a": "m14",
        "etiqueta": "Retorno a tierra GND"
      }
    ]
  },
  {
    "id": 11,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 2,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L2.2 — Rectificador de Onda Completa con Filtro Capacitivo",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Transformar corriente alterna en continua mediante puente rectificador y condensador de filtrado.",
    "ecuaciones": "V_dc = V_peak - 2*V_diode, V_rizado = I_dc / (2 * f * C)",
    "descripcion": "Puente de diodos con condensador electrolítico de filtro y carga resistiva.",
    "medicionesEsperadas": "Tensión DC suave con rizado inferior al 5% con C=100 µF.",
    "diagnosticoResolucion": "Comprobar que el condensador electrolítico tenga su terminal negativo al riel GND.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p2",
        "a": "6a",
        "etiqueta": "Fase AC de entrada secundaria 1"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p4",
        "a": "8a",
        "etiqueta": "Fase AC de entrada secundaria 2"
      },
      {
        "type": "diode",
        "t": "1N4007",
        "de": "6b",
        "a": "11b",
        "etiqueta": "Diodo rectificador D1 hacia nodo positivo (+)"
      },
      {
        "type": "diode",
        "t": "1N4007",
        "de": "8b",
        "a": "11c",
        "etiqueta": "Diodo rectificador D2 hacia nodo positivo (+)"
      },
      {
        "type": "cap",
        "valor": "100 µF",
        "de": "11d",
        "a": "m11",
        "etiqueta": "Condensador electrolítico de filtrado (100 µF): Ánodo en 11d"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "11e",
        "a": "15e",
        "etiqueta": "Resistor de carga RL (1 kΩ)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "15f",
        "a": "m15",
        "etiqueta": "Retorno de referencia a GND"
      }
    ]
  },
  {
    "id": 12,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 3,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L2.3 — Regulador de Tensión con Diodo Zener",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Estabilizar el voltaje de salida frente a variaciones de entrada mediante ruptura Zener inversa.",
    "ecuaciones": "V_out = V_Z (5.1 V), I_S = (V_in - V_Z) / R_S, I_Z = I_S - I_L",
    "descripcion": "Regulador en derivación con Zener 5.1V, resistencia serie limitadora y carga RL.",
    "medicionesEsperadas": "V_out regulado a 5.08 V aun cuando V_in suba de 8V a 12V.",
    "diagnosticoResolucion": "El Zener DEBE conectarse en polarización inversa: cátodo a nodo 11c y ánodo a tierra.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Tensión de entrada no regulada V_in (9V - 12V)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "7b",
        "a": "11b",
        "etiqueta": "Resistor de balasto serie Rs (330 Ω)"
      },
      {
        "type": "diode",
        "t": "Zener 5.1V",
        "de": "11c",
        "a": "m11",
        "etiqueta": "Diodo Zener 5.1V en polarización inversa (Cátodo en 11c)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "11d",
        "a": "15d",
        "etiqueta": "Resistor de carga RL (1 kΩ) en paralelo con Zener"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "15e",
        "a": "m15",
        "etiqueta": "GND de referencia de retorno"
      }
    ]
  },
  {
    "id": 13,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 4,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L2.4 — Polarización de Transistor BJT por Divisor de Tensión",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Fijar un punto de trabajo Q (V_ce, I_c) estable e inmune a las dispersiones del parámetro beta.",
    "ecuaciones": "V_B = Vcc * R2 / (R1 + R2), I_E ~ (V_B - 0.7V) / R_E, V_CE = Vcc - I_C*(R_C + R_E)",
    "descripcion": "Etapa de polarización universal BJT con divisor resistivo de base y estabilidad térmica.",
    "medicionesEsperadas": "V_B = 1.8 V, V_E = 1.1 V, V_CE = 6.2 V (centrado en la recta de carga).",
    "diagnosticoResolucion": "Comprobar el patillaje del BJT 2N2222: Colector (14c), Base (12d), Emisor (14e).",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "8a",
        "etiqueta": "Línea de alimentación Vcc (+12V)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "8b",
        "a": "12b",
        "etiqueta": "R1 divisor de base superior (10 kΩ)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "12c",
        "a": "m12",
        "etiqueta": "R2 divisor de base inferior (2.2 kΩ) a GND"
      },
      {
        "type": "trans",
        "t": "2N2222",
        "de": "12d",
        "a": "14d",
        "etiqueta": "Transistor BJT NPN 2N2222: Base conectada a nodo 12d"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "8c",
        "a": "14c",
        "etiqueta": "Resistor de colector Rc (1 kΩ)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "14e",
        "a": "m14",
        "etiqueta": "Resistor de emisor Re (330 Ω) de estabilidad térmica"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "m14",
        "a": "m16",
        "etiqueta": "GND común"
      }
    ]
  },
  {
    "id": 14,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 5,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L2.5 — Amplificador BJT en Emisor Común (Pequeña Señal)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Medir la ganancia de tensión A_v, impedancia de entrada y verificar el desfase de 180°.",
    "ecuaciones": "A_v = -g_m * (Rc || R_L), g_m = I_cq / V_T = 40 * I_cq",
    "descripcion": "Amplificador analógico con desacoplo de emisor y condensadores de acoplamiento AC.",
    "medicionesEsperadas": "Ganancia de tensión A_v ~ -45 (inversión de 180° comprobada en osciloscopio).",
    "diagnosticoResolucion": "Si la salida satura en el semiciclo positivo, aumentar la resistencia de emisor.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Entrada de señal de audio/AC pequeña señal"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "7b",
        "a": "11b",
        "etiqueta": "Condensador de acoplamiento de entrada C_in (10 µF)"
      },
      {
        "type": "trans",
        "t": "2N2222",
        "de": "11c",
        "a": "13c",
        "etiqueta": "Transistor amplificador 2N2222"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "p5",
        "a": "11d",
        "etiqueta": "Resistor de polarización de base R_base (10 kΩ)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "p5",
        "a": "13b",
        "etiqueta": "Resistor de colector Rc (2.2 kΩ)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "13d",
        "a": "17d",
        "etiqueta": "Resistor de emisor Re (330 Ω)"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "17e",
        "a": "m17",
        "etiqueta": "Condensador de desacoplo de emisor Ce (10 µF)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "m17",
        "a": "m20",
        "etiqueta": "GND común"
      }
    ]
  },
  {
    "id": 15,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 6,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L2.6 — Seguidor de Emisor BJT (Colector Común y Buffer)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Adaptación de impedancias: alta impedancia de entrada, muy baja de salida y ganancia unitaria.",
    "ecuaciones": "A_v ~ 1.0, Z_in = R_B || (beta * R_E), Z_out ~ r_e",
    "descripcion": "Buffer analógico para acoplar fuentes de alta impedancia sin caída de tensión.",
    "medicionesEsperadas": "A_v = 0.98, sin inversión de fase, excelente entrega de corriente a la carga.",
    "diagnosticoResolucion": "El colector debe conectarse directamente a Vcc sin resistencia intermedia.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "8a",
        "etiqueta": "Señal analógica de entrada a la base"
      },
      {
        "type": "trans",
        "t": "2N2222",
        "de": "8b",
        "a": "12b",
        "etiqueta": "Transistor 2N2222 en configuración Colector Común"
      },
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "12c",
        "etiqueta": "Línea de alimentación directa a Colector (+Vcc)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "12d",
        "a": "16d",
        "etiqueta": "Resistor de carga de emisor Re (1 kΩ)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "16e",
        "a": "m16",
        "etiqueta": "Retorno a GND"
      }
    ]
  },
  {
    "id": 16,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 7,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L2.7 — Conmutación de Carga con MOSFET de Potencia Canal N",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Controlar cargas inductivas o de alta potencia mediante tensión de Gate con corriente nula.",
    "ecuaciones": "I_D = K * (V_GS - V_th)^2 en saturación, P_loss = I_D^2 * R_DS(on)",
    "descripcion": "Interruptor de estado sólido con MOSFET Canal N y resistor pull-down en compuerta.",
    "medicionesEsperadas": "V_DS ~ 0.05 V en conducción activa (baja disipación térmica).",
    "diagnosticoResolucion": "Asegurar que el resistor pull-down descargue el Gate al desactivar el control.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Línea Vcc de potencia para la carga"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "7b",
        "a": "11b",
        "etiqueta": "Carga de potencia simulada (LED verde de alto brillo)"
      },
      {
        "type": "res",
        "valor": 220,
        "de": "11c",
        "a": "14c",
        "etiqueta": "Resistor limitador de carga (220 Ω)"
      },
      {
        "type": "trans",
        "t": "MOSFET N-CH",
        "de": "14d",
        "a": "16d",
        "etiqueta": "Transistor MOSFET Canal N (Drain en 14d, Gate en 16d)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "16e",
        "a": "m16",
        "etiqueta": "Resistor pull-down de Gate (10 kΩ) para apagado seguro"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "14e",
        "a": "m14",
        "etiqueta": "Source del MOSFET a GND de referencia"
      }
    ]
  },
  {
    "id": 17,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 8,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L2.8 — Amplificador Operacional LM741: Configuraciones Inversora y No Inversora",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Implementar amplificación lineal con circuito integrado Op-Amp y calcular ganancia con realimentación negativa.",
    "ecuaciones": "A_v(inversora) = -Rf / Rin, A_v(no inversora) = 1 + (Rf / Rin)",
    "descripcion": "Montaje de chip DIP-8 LM741 con lazo de realimentación negativa y control de ganancia estable.",
    "medicionesEsperadas": "A_v = -10.0 (con Rin=1 kΩ y Rf=10 kΩ). Salida invertida y lineal.",
    "diagnosticoResolucion": "Verificar alimentación simétrica (+Vcc pin 7 en 11a, -Vee / GND pin 4 en 15e).",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p5",
        "a": "11a",
        "etiqueta": "Alimentación positiva Vcc+ (+12V) a pin 7 del Op-Amp"
      },
      {
        "type": "ic",
        "n": "LM741",
        "de": "11b",
        "a": "15b",
        "etiqueta": "Circuito Integrado Op-Amp LM741 (DIP-8 sobre ranura central)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p3",
        "a": "8a",
        "etiqueta": "Entrada de señal analógica Vin"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "8b",
        "a": "11c",
        "etiqueta": "Resistor de entrada Rin (1 kΩ) hacia pin inversor (-)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "11d",
        "a": "15c",
        "etiqueta": "Resistor de realimentación Rf (10 kΩ) entre salida y pin (-)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "11e",
        "a": "m11",
        "etiqueta": "Pin no inversor (+) referenciado a GND común (tierra virtual)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "15e",
        "a": "m15",
        "etiqueta": "Alimentación negativa Vee / GND a pin 4 del LM741"
      }
    ]
  },
  {
    "id": 18,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 9,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L2.9 — Sumador Ponderado y Restador Diferencial con Op-Amp",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Realizar operaciones matemáticas analógicas en tiempo real (suma y resta de voltajes).",
    "ecuaciones": "V_out = -(Rf/R1 * V1 + Rf/R2 * V2), CMRR = 20 * log(Ad / Ac)",
    "descripcion": "Sumador analógico de dos canales con amplificador operacional LM358 de doble canal.",
    "medicionesEsperadas": "V_out = -(V1 + 2*V2) validado con fuentes independientes.",
    "diagnosticoResolucion": "Asegurar que ambas entradas analógicas compartan el nodo inversor de suma.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p6",
        "a": "12a",
        "etiqueta": "Alimentación Vcc (+12V) al chip analógico"
      },
      {
        "type": "ic",
        "n": "LM358",
        "de": "12b",
        "a": "16b",
        "etiqueta": "Circuito Integrado Op-Amp Dual LM358"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "p3",
        "a": "12c",
        "etiqueta": "Entrada V1 canal 1 mediante R1 (1 kΩ)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "p4",
        "a": "12d",
        "etiqueta": "Entrada V2 canal 2 ponderada mediante R2 (2.2 kΩ)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "12e",
        "a": "16c",
        "etiqueta": "Resistor de realimentación Rf (10 kΩ) al pin de salida"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "12f",
        "a": "m12",
        "etiqueta": "Resistor de compensación en entrada no inversora a GND"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "16e",
        "a": "m16",
        "etiqueta": "GND de retorno del circuito integrado"
      }
    ]
  },
  {
    "id": 19,
    "nivel": 2,
    "nivelNombre": "Nivel 2 — Electrónica Analógica y Semiconductores",
    "laboratorioNumero": 10,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L2.10 — Filtro Activo Pasa-Bajos Sallen-Key de Segundo Orden",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Atenuación de -40 dB/década por encima de la frecuencia de corte f_c y factor de calidad Butterworth.",
    "ecuaciones": "f_c = 1 / (2*pi*sqrt(R1*R2*C1*C2)), Q = 0.707 (Butterworth plano)",
    "descripcion": "Filtro activo de segundo orden con topología Sallen-Key y Op-Amp JFET TL081.",
    "medicionesEsperadas": "Atenuación de -3 dB en f = f_c y pendiente de caída de -40 dB/década.",
    "diagnosticoResolucion": "Verificar que el condensador C1 cierre la realimentación hacia la salida del Op-Amp.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "10a",
        "etiqueta": "Alimentación Vcc+ (+12V) al integrado"
      },
      {
        "type": "ic",
        "n": "TL081",
        "de": "10b",
        "a": "14b",
        "etiqueta": "Amplificador Operacional de bajo ruido JFET TL081"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "7a",
        "etiqueta": "Entrada de señal analógica multifrecuencia"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "7b",
        "a": "10c",
        "etiqueta": "Resistor de filtrado R1 (1 kΩ)"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "7c",
        "a": "14c",
        "etiqueta": "Condensador C1 de realimentación activa a salida"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "10d",
        "a": "m10",
        "etiqueta": "Condensador C2 a tierra para segundo polo"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "14d",
        "a": "18d",
        "etiqueta": "Resistor de carga de salida (2.2 kΩ)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "18e",
        "a": "m18",
        "etiqueta": "GND de referencia del filtro"
      }
    ]
  },
  {
    "id": 20,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 1,
    "complejidad": "basico",
    "complejidadTexto": "🟢 Sencillo",
    "nombre": "L3.1 — Compuertas Lógicas Fundamentales y Teoremas de De Morgan",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Implementar compuertas AND/NAND mediante chips TTL y comprobar tablas de verdad.",
    "ecuaciones": "Y = A * B, (A * B)' = A' + B'",
    "descripcion": "Circuito integrado 74LS08 con entradas digitales y LED indicador de salida lógica.",
    "medicionesEsperadas": "Salida Y = HIGH (5V) únicamente cuando A=1 y B=1.",
    "diagnosticoResolucion": "Verificar alimentación pin 14 a Vcc (+5V) y pin 7 a GND del chip TTL.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "8a",
        "etiqueta": "Vcc +5V a pin 14 del integrado digital 74LS08"
      },
      {
        "type": "ic",
        "n": "74LS08",
        "de": "8b",
        "a": "14b",
        "etiqueta": "IC 74LS08 Quad 2-Input AND Gate (DIP-14)"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p3",
        "a": "8c",
        "etiqueta": "Entrada lógica A conectada a nivel lógico HIGH"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p4",
        "a": "8d",
        "etiqueta": "Entrada lógica B conectada a nivel lógico HIGH"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "8e",
        "a": "m8",
        "etiqueta": "Resistor pull-down de protección (1 kΩ)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "14c",
        "a": "18c",
        "etiqueta": "Resistor limitador de salida lógica (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "18d",
        "a": "m18",
        "etiqueta": "LED verde indicador del estado de salida (Y = 1)"
      }
    ]
  },
  {
    "id": 21,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 2,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L3.2 — Decodificador BCD a 7 Segmentos y Multiplexado Temporal",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Traducir código binario de 4 bits (0000 a 1001) a patrones visuales de display numérico.",
    "ecuaciones": "Display a-g = f(A, B, C, D)",
    "descripcion": "Decodificador BCD a 7 segmentos 74LS47 con bus de resistencias limitadoras.",
    "medicionesEsperadas": "Decodificación correcta de dígitos 0-9 en salidas a-g en nivel activo bajo.",
    "diagnosticoResolucion": "Si algún segmento no enciende, verificar la resistencia correspondiente.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p6",
        "a": "12a",
        "etiqueta": "Alimentación Vcc +5V al decodificador"
      },
      {
        "type": "ic",
        "n": "74LS47",
        "de": "12b",
        "a": "16b",
        "etiqueta": "Circuito Integrado Decodificador BCD 74LS47 (DIP-16)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "12c",
        "etiqueta": "Entrada BCD Bit 0 (LSB A)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p3",
        "a": "12d",
        "etiqueta": "Entrada BCD Bit 1 (B)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "16c",
        "a": "20c",
        "etiqueta": "Resistor limitador segmento a (330 Ω)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "16d",
        "a": "20d",
        "etiqueta": "Resistor limitador segmento b (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "20e",
        "a": "m20",
        "etiqueta": "LED indicador de segmento activo"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "12e",
        "a": "m12",
        "etiqueta": "GND común del integrado"
      }
    ]
  },
  {
    "id": 22,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 3,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L3.3 — Multiplexores y Demultiplexores (Rutas de Datos Digitales)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Seleccionar 1 de 4 canales de datos binarios mediante líneas de direccionamiento de control.",
    "ecuaciones": "Y = S1' * S0' * I0 + S1' * S0 * I1 + S1 * S0' * I2 + S1 * S0 * I3",
    "descripcion": "Multiplexor digital 74LS153 de cuatro canales de entrada a una salida conmutada.",
    "medicionesEsperadas": "La salida refleja la señal del canal seleccionado por S1 y S0.",
    "diagnosticoResolucion": "Verificar nivel lógico definido en las líneas de selección mediante pull-up.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "10a",
        "etiqueta": "Vcc 5V a pin de alimentación del multiplexor"
      },
      {
        "type": "ic",
        "n": "74LS153",
        "de": "10b",
        "a": "15b",
        "etiqueta": "IC Multiplexor Digital 4:1 74LS153"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p2",
        "a": "10c",
        "etiqueta": "Línea de selección de canal S0"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p3",
        "a": "10d",
        "etiqueta": "Línea de selección de canal S1"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "10e",
        "a": "p10",
        "etiqueta": "Resistor pull-up de polarización (1 kΩ)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "15c",
        "a": "19c",
        "etiqueta": "Resistor limitador de salida Y (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "19d",
        "a": "m19",
        "etiqueta": "LED indicador de dato transmitido"
      }
    ]
  },
  {
    "id": 23,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 4,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L3.4 — Comparador de Magnitud Digital y Unidad Aritmética",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Comparar dos palabras binarias A y B determinando las condiciones A > B, A = B y A < B.",
    "ecuaciones": "A=B si A3=B3 y A2=B2 y A1=B1 y A0=B0",
    "descripcion": "Comparador de magnitud 74LS85 con visualización de estado en LEDs tricolores.",
    "medicionesEsperadas": "Activación exacta de la bandera de igualdad o desigualdad según las entradas.",
    "diagnosticoResolucion": "Las entradas de cascada A=B_in deben conectarse a nivel alto si no hay etapas previas.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p5",
        "a": "11a",
        "etiqueta": "Vcc 5V al comparador de magnitud"
      },
      {
        "type": "ic",
        "n": "74LS85",
        "de": "11b",
        "a": "16b",
        "etiqueta": "IC Comparador de Magnitud 4-Bits 74LS85"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "11c",
        "etiqueta": "Entrada de dato binario A0 (HIGH)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "m2",
        "a": "11d",
        "etiqueta": "Entrada de dato binario B0 (LOW)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "16c",
        "a": "20c",
        "etiqueta": "Resistor limitador salida A > B (330 Ω)"
      },
      {
        "type": "led",
        "color": "#e33",
        "de": "20d",
        "a": "m20",
        "etiqueta": "LED indicador de condición A > B"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "11e",
        "a": "m11",
        "etiqueta": "GND de referencia"
      }
    ]
  },
  {
    "id": 24,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 5,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L3.5 — Biestables (Flip-Flops D, JK y T) y Tiempos de Setup/Hold",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Comprobar el almacenamiento de 1 bit síncrono disparado por flanco de subida del reloj CLK.",
    "ecuaciones": "Q(t+1) = D, Q(t+1) = J*Q' + K'*Q",
    "descripcion": "Flip-Flop dual tipo D 74LS74 con pulsador de reloj antirrebote y estado Q/Q_neg.",
    "medicionesEsperadas": "El dato D se transfiere a Q únicamente en el flanco positivo del pulso CLK.",
    "diagnosticoResolucion": "Verificar que las entradas PRE y CLR asíncronas estén amarradas a Vcc.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "10a",
        "etiqueta": "Alimentación Vcc +5V al chip secuencial"
      },
      {
        "type": "ic",
        "n": "74LS74",
        "de": "10b",
        "a": "15b",
        "etiqueta": "IC Flip-Flop D Dual disparado por flanco 74LS74"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p2",
        "a": "10c",
        "etiqueta": "Línea de Reloj síncrono CLK"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p3",
        "a": "10d",
        "etiqueta": "Entrada síncrona de datos D"
      },
      {
        "type": "btn",
        "de": "10e",
        "a": "m10",
        "etiqueta": "Pulsador manual para disparo de reloj CLK"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "15c",
        "a": "19c",
        "etiqueta": "Resistor limitador salida Q (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "19d",
        "a": "m19",
        "etiqueta": "LED indicador del estado almacenado Q"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "15e",
        "a": "m15",
        "etiqueta": "GND de referencia"
      }
    ]
  },
  {
    "id": 25,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 6,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L3.6 — Contadores Asíncronos (Ripple) y Síncronos Binarios",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Construir un contador binario módulo 16 con visualización de bits de conteo Q0-Q3.",
    "ecuaciones": "f_Qn = f_in / 2^(n+1)",
    "descripcion": "Contador binario de 4 bits 74LS93 con división sucesiva de frecuencia.",
    "medicionesEsperadas": "Conteo secuencial 0000 a 1111 reflejado en la barra de LEDs.",
    "diagnosticoResolucion": "Conectar la salida Q0 a la entrada CP1 para habilitar el conteo de 4 bits completo.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "9a",
        "etiqueta": "Vcc 5V al contador binario"
      },
      {
        "type": "ic",
        "n": "74LS93",
        "de": "9b",
        "a": "15b",
        "etiqueta": "IC Contador Binario de 4 Bits 74LS93 (DIP-14)"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p2",
        "a": "9c",
        "etiqueta": "Señal de pulsos de reloj CLK"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "9d",
        "a": "m9",
        "etiqueta": "Líneas de reset MR1 y MR2 puestas a tierra"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "15c",
        "a": "18c",
        "etiqueta": "Resistor limitador Bit 0 (330 Ω)"
      },
      {
        "type": "led",
        "color": "#e33",
        "de": "18d",
        "a": "m18",
        "etiqueta": "LED Bit 0 (LSB)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "15d",
        "a": "21d",
        "etiqueta": "Resistor limitador Bit 1 (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "21e",
        "a": "m21",
        "etiqueta": "LED Bit 1"
      }
    ]
  },
  {
    "id": 26,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 7,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L3.7 — Registros de Desplazamiento Universal (SISO, SIPO, PISO)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Conversión serie-paralelo de palabras digitales y almacenamiento temporal en cascada.",
    "ecuaciones": "Q_A(t+1) = S_in, Q_B(t+1) = Q_A(t)",
    "descripcion": "Registro universal de 4 bits 74LS194 con control de modo y carga paralela.",
    "medicionesEsperadas": "Desplazamiento sincronizado de bits a cada pulso de reloj.",
    "diagnosticoResolucion": "Verificar que el modo S0/S1 esté configurado para shift-right (S0=1, S1=0).",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "10a",
        "etiqueta": "Vcc 5V al registro de desplazamiento"
      },
      {
        "type": "ic",
        "n": "74LS194",
        "de": "10b",
        "a": "16b",
        "etiqueta": "IC Registro de Desplazamiento Bidireccional 74LS194"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "10c",
        "etiqueta": "Entrada serie de datos DIN"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p3",
        "a": "10d",
        "etiqueta": "Línea de pulso de Reloj CLK"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "16c",
        "a": "20c",
        "etiqueta": "Resistor de salida QA (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "20d",
        "a": "m20",
        "etiqueta": "LED indicador de bit desplazado QA"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "10e",
        "a": "m10",
        "etiqueta": "GND de referencia"
      }
    ]
  },
  {
    "id": 27,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 8,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L3.8 — Máquinas de Estado Finito (FSM) Tipo Moore y Mealy",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Diseñar e implementar un secuenciador de control con memoria de estados y lógica combinacional.",
    "ecuaciones": "Estado_siguiente = f(Estado_actual, Entradas), Salida = g(Estado_actual)",
    "descripcion": "Controlador secuencial de semáforo simple implementado con lógica digital y flip-flops.",
    "medicionesEsperadas": "Transición ordenada de estados (Verde -> Amarillo -> Rojo) sincronizada.",
    "diagnosticoResolucion": "Verificar las condiciones iniciales en el pin de RESET asíncrono.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p5",
        "a": "11a",
        "etiqueta": "Alimentación Vcc +5V del controlador FSM"
      },
      {
        "type": "ic",
        "n": "FSM-SEQ",
        "de": "11b",
        "a": "16b",
        "etiqueta": "Módulo Lógico Secuencial FSM"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "11c",
        "etiqueta": "Entrada de sensor detector de evento X"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p3",
        "a": "11d",
        "etiqueta": "Reloj de transición del sistema"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "16c",
        "a": "20c",
        "etiqueta": "Resistor limitador de estado activo (330 Ω)"
      },
      {
        "type": "led",
        "color": "#e33",
        "de": "20d",
        "a": "m20",
        "etiqueta": "LED indicador de estado actual del sistema"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "16e",
        "a": "m16",
        "etiqueta": "GND común"
      }
    ]
  },
  {
    "id": 28,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 9,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L3.9 — Convertidor Digital a Analógico (DAC Tipo Escalera R-2R)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Convertir valores digitales binarios en niveles de tensión analógica proporcional con red R-2R.",
    "ecuaciones": "V_out = V_ref * sum(b_i * 2^(-(4-i))), R=1 kΩ, 2R=2.2 kΩ",
    "descripcion": "Escalera resistiva R-2R de 4 bits que genera 16 niveles de tensión analógica.",
    "medicionesEsperadas": "Escalera de tensión monótona con pasos discretos de Vcc/16 = 0.31 V.",
    "diagnosticoResolucion": "Utilizar resistores de precisión (1%) para evitar no-monotonía en los saltos.",
    "pasos": [
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "6a",
        "etiqueta": "Entrada digital Bit 0 (LSB)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "6b",
        "a": "9b",
        "etiqueta": "Resistor 2R (2.2 kΩ) de la rama Bit 0"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p3",
        "a": "9c",
        "etiqueta": "Entrada digital Bit 1"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "9d",
        "a": "12d",
        "etiqueta": "Resistor 2R (2.2 kΩ) de la rama Bit 1"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "9e",
        "a": "12e",
        "etiqueta": "Resistor R de escalera (1 kΩ) entre nodos"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "12f",
        "a": "m12",
        "etiqueta": "Resistor de terminación R a tierra (1 kΩ)"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "12c",
        "a": "17c",
        "etiqueta": "Sonda de salida analógica Vout"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "17d",
        "a": "m17",
        "etiqueta": "GND de referencia analógica"
      }
    ]
  },
  {
    "id": 29,
    "nivel": 3,
    "nivelNombre": "Nivel 3 — Electrónica Digital y Sistemas Secuenciales",
    "laboratorioNumero": 10,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L3.10 — Convertidor Analógico a Digital (ADC por Comparadores Flash)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Digitalización a máxima velocidad mediante red de comparadores de tensión y divisor resistivo.",
    "ecuaciones": "Resolución = V_ref / 2^n, Tiempo de conversión ~ retardo de compuerta",
    "descripcion": "ADC Flash de 2 bits con 3 comparadores en paralelo y umbrales equidistantes.",
    "medicionesEsperadas": "Código de termómetro instantáneo ante variaciones de la tensión de entrada.",
    "diagnosticoResolucion": "Verificar los voltajes de referencia en la escalera resistiva de precisión.",
    "pasos": [
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Tensión analógica de entrada a digitalizar"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "7b",
        "a": "11b",
        "etiqueta": "R1 escalera de referencia de umbral (1 kΩ)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "11c",
        "a": "15c",
        "etiqueta": "R2 escalera de referencia de umbral (1 kΩ)"
      },
      {
        "type": "ic",
        "n": "LM339",
        "de": "11d",
        "a": "16d",
        "etiqueta": "IC Banco de Comparadores Cuádruple LM339"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "16c",
        "a": "20c",
        "etiqueta": "Resistor limitador salida digital (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "20d",
        "a": "m20",
        "etiqueta": "LED indicador de bit digitalizado"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "15e",
        "a": "m15",
        "etiqueta": "GND de referencia de la escalera"
      }
    ]
  },
  {
    "id": 30,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 1,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L4.1 — Acondicionamiento de Señal: Filtros y Diodos de Clamping",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Proteger entradas analógicas contra sobretensiones y limitar excursiones con diodos Schottky.",
    "ecuaciones": "V_clamp = Vcc + 0.3V, V_clamp_low = GND - 0.3V",
    "descripcion": "Etapa de entrada analógica industrial con recorte de diodo y filtro pasabajos pasivo.",
    "medicionesEsperadas": "Señal recortada rígidamente dentro de la ventana segura de 0V a 5V.",
    "diagnosticoResolucion": "Los diodos de clamping deben tener bajo tiempo de recuperación inversa trr.",
    "pasos": [
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "6a",
        "etiqueta": "Entrada de señal de sensor con ruido industrial"
      },
      {
        "type": "trans",
        "t": "2N2222",
        "de": "6b",
        "a": "9b",
        "etiqueta": "Transistor preamplificador de señal"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "p2",
        "a": "9c",
        "etiqueta": "Resistor de colector (1 kΩ)"
      },
      {
        "type": "diode",
        "t": "1N4148",
        "de": "9d",
        "a": "6d",
        "etiqueta": "Diodo clamping de protección contra sobrevoltaje"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "9e",
        "a": "13e",
        "etiqueta": "Condensador de desacoplo de ruido (10 µF)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "13f",
        "a": "m13",
        "etiqueta": "Resistor de carga de salida a tierra (10 kΩ)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "13c",
        "a": "m13",
        "etiqueta": "GND de referencia"
      }
    ]
  },
  {
    "id": 31,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 2,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L4.2 — Disparo y Control de Ángulo de Fase con Tiristor SCR y TRIAC",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Controlar la potencia entregada a una carga AC variando el ángulo de disparo alfa.",
    "ecuaciones": "V_rms = V_peak * sqrt((pi - alfa + sin(2*alfa)/2) / (2*pi))",
    "descripcion": "Control de fase con tiristor SCR, pulso de compuerta y lámpara/carga resistiva.",
    "medicionesEsperadas": "Variación continua de tensión eficaz de salida entre 0V y V_max.",
    "diagnosticoResolucion": "Verificar que la corriente de mantenimiento Ih se supere para sostener la conducción.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Línea de potencia de entrada"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "7b",
        "a": "11b",
        "etiqueta": "Resistor de polarización de compuerta Rg (1 kΩ)"
      },
      {
        "type": "diode",
        "t": "1N4007",
        "de": "11c",
        "a": "14c",
        "etiqueta": "Diodo rectificador de disparo de Gate"
      },
      {
        "type": "trans",
        "t": "SCR",
        "de": "14d",
        "a": "16d",
        "etiqueta": "Tiristor de potencia SCR (Ánodo en 14d, Gate en 16d)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "16b",
        "a": "p5",
        "etiqueta": "Carga de potencia conectada en serie"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "16e",
        "a": "m16",
        "etiqueta": "Cátodo del SCR a GND común"
      }
    ]
  },
  {
    "id": 32,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 3,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L4.3 — Generador PWM con Temporizador NE555 en Modo Astable",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Generar tren de pulsos con ciclo de trabajo ajustable (Duty Cycle D = Ton / T) para control de velocidad/brillo.",
    "ecuaciones": "f = 1.44 / ((R1 + 2*R2)*C), D = (R1 + R2) / (R1 + 2*R2)",
    "descripcion": "Oscilador astable con circuito integrado NE555 y diodos de dirección para variar el ciclo de trabajo.",
    "medicionesEsperadas": "Frecuencia de oscilación f ~ 1.2 kHz, modulación PWM de salida comprobada.",
    "diagnosticoResolucion": "Unir físicamente los pines 2 (TRIGGER) y 6 (THRESHOLD) en la columna 12.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "10a",
        "etiqueta": "Alimentación Vcc +5V a pin 8 y pin 4 (RESET) del NE555"
      },
      {
        "type": "ic",
        "n": "NE555",
        "de": "10b",
        "a": "14b",
        "etiqueta": "Circuito Integrado Temporizador Universal NE555 (DIP-8)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "p4",
        "a": "10c",
        "etiqueta": "Resistor temporizador R1 (1 kΩ) a pin 7 (DISCHARGE)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "10d",
        "a": "12d",
        "etiqueta": "Resistor temporizador R2 (10 kΩ) entre pin 7 y pin 6"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "12e",
        "a": "m12",
        "etiqueta": "Condensador electrolítico temporizador C1 (10 µF) a tierra"
      },
      {
        "type": "diode",
        "t": "1N4148",
        "de": "10e",
        "a": "12f",
        "etiqueta": "Diodo rápido de bypass para permitir Duty Cycles < 50%"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "14c",
        "a": "18c",
        "etiqueta": "Resistor limitador de salida pin 3 (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "18d",
        "a": "m18",
        "etiqueta": "LED indicador de pulsos PWM"
      }
    ]
  },
  {
    "id": 33,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 4,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L4.4 — Convertidor DC-DC Reductor Conmutado (Buck Converter)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Reducir voltaje DC con alta eficiencia energética (>85%) mediante conmutación PWM e inductor.",
    "ecuaciones": "V_out = D * V_in, L_min = (1 - D) * R / (2 * f)",
    "descripcion": "Fuente conmutada Buck con MOSFET conmutador, diodo Schottky de libre circulación y filtro LC.",
    "medicionesEsperadas": "V_out = 5.0 V estable a partir de V_in = 12.0 V con rizado < 30 mV.",
    "diagnosticoResolucion": "Asegurar que el diodo Schottky soporte la corriente pico de recuperación.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Entrada Vin 12V de la fuente primaria"
      },
      {
        "type": "trans",
        "t": "MOSFET N-CH",
        "de": "7b",
        "a": "11b",
        "etiqueta": "MOSFET de conmutación de alta frecuencia"
      },
      {
        "type": "diode",
        "t": "1N5819",
        "de": "11c",
        "a": "m11",
        "etiqueta": "Diodo Schottky de libre circulación (Ánodo a GND)"
      },
      {
        "type": "res",
        "valor": 100,
        "de": "11d",
        "a": "15d",
        "etiqueta": "Inductor de almacenamiento L (bobina 100 µH modelada)"
      },
      {
        "type": "cap",
        "valor": "100 µF",
        "de": "15c",
        "a": "m15",
        "etiqueta": "Condensador electrolítico de salida de bajo ESR (100 µF)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "15e",
        "a": "19e",
        "etiqueta": "Resistor R1 divisor de realimentación (10 kΩ)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "19f",
        "a": "m19",
        "etiqueta": "Resistor R2 divisor de realimentación (1 kΩ) a GND"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "m11",
        "a": "m20",
        "etiqueta": "GND plano común de potencia"
      }
    ]
  },
  {
    "id": 34,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 5,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L4.5 — Convertidor DC-DC Elevador (Boost Converter)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Elevar la tensión continua de entrada (de 5V a 12V) aprovechando la energía inductiva.",
    "ecuaciones": "V_out = V_in / (1 - D)",
    "descripcion": "Topología conmutada Boost con acumulador inductivo, diodo rectificador rápido y filtro.",
    "medicionesEsperadas": "Tensión de salida superior a la entrada: V_out = 10.5 V con D = 0.52.",
    "diagnosticoResolucion": "No operar el circuito Boost sin carga: la tensión puede elevarse peligrosamente.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p2",
        "a": "6a",
        "etiqueta": "Tensión de entrada baja Vin (5V)"
      },
      {
        "type": "res",
        "valor": 220,
        "de": "6b",
        "a": "10b",
        "etiqueta": "Inductor de choque L de acumulación de energía"
      },
      {
        "type": "trans",
        "t": "MOSFET N-CH",
        "de": "10c",
        "a": "m10",
        "etiqueta": "Interruptor MOSFET a tierra para cargar el inductor"
      },
      {
        "type": "diode",
        "t": "1N5819",
        "de": "10d",
        "a": "14d",
        "etiqueta": "Diodo Schottky rectificador de salida"
      },
      {
        "type": "cap",
        "valor": "100 µF",
        "de": "14c",
        "a": "m14",
        "etiqueta": "Condensador de almacenamiento de alta tensión (100 µF)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "14e",
        "a": "18e",
        "etiqueta": "Resistor de carga RL (2.2 kΩ)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "18f",
        "a": "m18",
        "etiqueta": "GND de retorno"
      }
    ]
  },
  {
    "id": 35,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 6,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L4.6 — Driver en Puente H (H-Bridge) para Control Bidireccional de Motores",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Controlar el sentido de giro y frenado regenerativo de un motor DC mediante 4 interruptores activos.",
    "ecuaciones": "V_motor = Vcc * (D_A - D_B), I_arranque = Vcc / R_armadura",
    "descripcion": "Puente H con transistores de potencia complementarios y diodos flyback de protección.",
    "medicionesEsperadas": "Inversión de polaridad en bornes del motor (+12V en avance, -12V en retroceso).",
    "diagnosticoResolucion": "Prevenir disparo simultáneo (shoot-through) de la misma rama vertical.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Alimentación Vcc (+12V) de potencia del motor"
      },
      {
        "type": "trans",
        "t": "BJT PNP",
        "de": "7b",
        "a": "11b",
        "etiqueta": "Transistor Q1 Rama Alta Izquierda"
      },
      {
        "type": "trans",
        "t": "2N2222",
        "de": "11c",
        "a": "m11",
        "etiqueta": "Transistor Q2 Rama Baja Izquierda"
      },
      {
        "type": "trans",
        "t": "BJT PNP",
        "de": "7c",
        "a": "15b",
        "etiqueta": "Transistor Q3 Rama Alta Derecha"
      },
      {
        "type": "trans",
        "t": "2N2222",
        "de": "15c",
        "a": "m15",
        "etiqueta": "Transistor Q4 Rama Baja Derecha"
      },
      {
        "type": "diode",
        "t": "1N4007",
        "de": "11d",
        "a": "7d",
        "etiqueta": "Diodo flyback antiparalelo de protección inductiva"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "11e",
        "a": "13e",
        "etiqueta": "Borne Motor DC Terminal A"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "15e",
        "a": "13f",
        "etiqueta": "Borne Motor DC Terminal B"
      }
    ]
  },
  {
    "id": 36,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 7,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L4.7 — Aislamiento Galvánico con Optoacoplador y Fototransistor",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Transmitir señales de control entre circuitos de diferente potencial sin conexión eléctrica directa.",
    "ecuaciones": "CTR = (I_C / I_F) * 100%, Aislamiento típico > 2500 V_rms",
    "descripcion": "Optoacoplador 4N35 con LED emisor infrarrojo y receptor fototransistor con tierras separadas.",
    "medicionesEsperadas": "Inmunidad total a bucles de tierra y ruidos transitorios del lado de potencia.",
    "diagnosticoResolucion": "Mantener las masas GND primaria y secundaria físicamente desacopladas.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p2",
        "a": "6a",
        "etiqueta": "Vcc lógica de baja tensión primaria (5V)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "6b",
        "a": "10b",
        "etiqueta": "Resistor limitador del LED infrarrojo (330 Ω)"
      },
      {
        "type": "ic",
        "n": "4N35",
        "de": "10c",
        "a": "14c",
        "etiqueta": "Optoacoplador industrial 4N35 (DIP-6)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "10d",
        "a": "m10",
        "etiqueta": "GND primario de control"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p5",
        "a": "14d",
        "etiqueta": "Vcc secundario de potencia (+12V o +24V)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "14e",
        "a": "18e",
        "etiqueta": "Resistor pull-up de colector receptor (1 kΩ)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "18f",
        "a": "m18",
        "etiqueta": "GND secundario aislado de potencia"
      }
    ]
  },
  {
    "id": 37,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 8,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L4.8 — Control Proporcional-Integral (PI) Analógico en Lazo Cerrado",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Eliminar el error en estado estacionario (e_ss = 0) mediante acción integral activa.",
    "ecuaciones": "u(t) = K_p * e(t) + K_i * int(e(tau) dtau)",
    "descripcion": "Controlador analógico PI con amplificador operacional y red RC de realimentación.",
    "medicionesEsperadas": "Respuesta rápida sin oscilaciones críticas y seguimiento fiel de la referencia.",
    "diagnosticoResolucion": "Evitar saturación del condensador de integración durante arranques bruscos.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "8a",
        "etiqueta": "Alimentación Vcc (+12V) al controlador PI"
      },
      {
        "type": "ic",
        "n": "LM358",
        "de": "8b",
        "a": "12b",
        "etiqueta": "Circuito Integrado Controlador Analógico LM358"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "p2",
        "a": "8c",
        "etiqueta": "Resistor de ganancia proporcional R_P (10 kΩ)"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "8d",
        "a": "12c",
        "etiqueta": "Condensador integral C_I (10 µF) en lazo de realimentación"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "12d",
        "a": "15d",
        "etiqueta": "Resistor de acoplo de salida R_I (2.2 kΩ)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "15c",
        "a": "m15",
        "etiqueta": "Resistor de carga del actuador (1 kΩ)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "15e",
        "a": "8e",
        "etiqueta": "Lazo de realimentación negativa del error e(t)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "m15",
        "a": "m18",
        "etiqueta": "GND de referencia de control"
      }
    ]
  },
  {
    "id": 38,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 9,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L4.9 — Osciladores Senoidales: Puente de Wien y Criterio de Barkhausen",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Generar ondas senoidales puras de baja distorsión armónica con ganancia de lazo A*beta = 1.",
    "ecuaciones": "f_0 = 1 / (2 * pi * R * C), A_v = 1 + (Rf / R1) >= 3",
    "descripcion": "Oscilador Puente de Wien con red RC en adelanto-atraso y control de amplitud.",
    "medicionesEsperadas": "Onda senoidal estable a f = 1 kHz sin saturación en los extremos de la onda.",
    "diagnosticoResolucion": "Ajustar la ganancia Rf/R1 ligeramente por encima de 3 para arrancar la oscilación.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "9a",
        "etiqueta": "Alimentación Vcc+ al chip analógico"
      },
      {
        "type": "ic",
        "n": "TL081",
        "de": "9b",
        "a": "13b",
        "etiqueta": "Op-Amp de alta velocidad JFET TL081"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "p3",
        "a": "9c",
        "etiqueta": "Resistor serie de la red de Wien R1 (1 kΩ)"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "9d",
        "a": "13c",
        "etiqueta": "Condensador serie C1 (10 µF)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "9e",
        "a": "m9",
        "etiqueta": "Resistor paralelo R2 a tierra (1 kΩ)"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "13d",
        "a": "m13",
        "etiqueta": "Condensador paralelo C2 a tierra (10 µF)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "13e",
        "a": "17e",
        "etiqueta": "Resistor de carga de salida (2.2 kΩ)"
      }
    ]
  },
  {
    "id": 39,
    "nivel": 4,
    "nivelNombre": "Nivel 4 — Señales, Control y Electrónica de Potencia",
    "laboratorioNumero": 10,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L4.10 — Comparador con Histéresis (Trigger de Schmitt Inversor)",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Inmunizar comparaciones analógicas contra ruido mediante umbrales superior (V_UTP) e inferior (V_LTP).",
    "ecuaciones": "V_UTP = V_sat+ * R1/(R1+R2), V_LTP = V_sat- * R1/(R1+R2), V_H = V_UTP - V_LTP",
    "descripcion": "Trigger de Schmitt con realimentación positiva para regeneración de señales cuadradas limpias.",
    "medicionesEsperadas": "Conmutación limpia y sin rebotes ante señales con rizado o ruido térmico.",
    "diagnosticoResolucion": "La realimentación DEBE ser positiva: del terminal de salida hacia el pin (+) no inversor.",
    "pasos": [
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Señal analógica de entrada con ruido superpuesto"
      },
      {
        "type": "ic",
        "n": "LM358",
        "de": "7b",
        "a": "11b",
        "etiqueta": "Comparador Operacional LM358"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "7c",
        "a": "11c",
        "etiqueta": "Resistor de entrada Rin (10 kΩ)"
      },
      {
        "type": "res",
        "valor": 100000,
        "de": "11d",
        "a": "15d",
        "etiqueta": "Resistor de realimentación positiva Rf (100 kΩ) que fija histéresis"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "15c",
        "a": "19c",
        "etiqueta": "Resistor limitador de salida digital (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "19d",
        "a": "m19",
        "etiqueta": "LED indicador de umbral superado"
      }
    ]
  },
  {
    "id": 40,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 1,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L5.1 — Amplificador de Instrumentación de Tres Op-Amps",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Amplificar señales bioeléctricas o de sensores en puente con altísimo CMRR (>100 dB) e impedancia GΩ.",
    "ecuaciones": "A_diff = (1 + 2*R1/Rg) * (R3/R2)",
    "descripcion": "Topología clásica de 3 amplificadores con ajuste de ganancia diferencial por resistor único Rg.",
    "medicionesEsperadas": "Rechazo de modo común excepcional: la señal de 60 Hz desaparece de la salida.",
    "diagnosticoResolucion": "Rg controla toda la ganancia sin desbalancear el puente interno.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "10a",
        "etiqueta": "Alimentación Vcc+ (+12V) al arreglo de instrumentación"
      },
      {
        "type": "ic",
        "n": "INA-OP3",
        "de": "10b",
        "a": "14b",
        "etiqueta": "Arreglo de Amplificadores Operacionales de Instrumentación"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "10c",
        "etiqueta": "Entrada diferencial no inversora V_in(+)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p3",
        "a": "10d",
        "etiqueta": "Entrada diferencial inversora V_in(-)"
      },
      {
        "type": "res",
        "valor": 220,
        "de": "10e",
        "a": "14c",
        "etiqueta": "Resistor de ganancia Rg (220 Ω) que fija A_diff ~ 100"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "14d",
        "a": "18d",
        "etiqueta": "Resistor de sustracción diferencial R1 (10 kΩ)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "18e",
        "a": "m18",
        "etiqueta": "Resistor de referencia a tierra (10 kΩ)"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "14e",
        "a": "m14",
        "etiqueta": "GND de referencia de bajo ruido"
      }
    ]
  },
  {
    "id": 41,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 2,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L5.2 — Acondicionamiento para Celda de Carga y Puente de Galgas Extensiométricas",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Medir microdeformaciones mecánicas (microstrain) mediante puente completo de 350 Ω con compensación térmica.",
    "ecuaciones": "V_out = V_ex * GF * epsilon / 4",
    "descripcion": "Puente de Wheatstone industrial de galgas con ajuste de balance fino y compensación.",
    "medicionesEsperadas": "Sensibilidad de 2 mV/V a plena escala de carga.",
    "diagnosticoResolucion": "Blindar las líneas de señal para evitar acoplamiento de campos electromagnéticos.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p2",
        "a": "6a",
        "etiqueta": "Tensión de excitación regulada V_ex (5.00V)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "6b",
        "a": "10b",
        "etiqueta": "Galga extensiométrica activa R1 (350 Ω)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "6c",
        "a": "14b",
        "etiqueta": "Galga pasiva de compensación térmica R2 (350 Ω)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "10c",
        "a": "m10",
        "etiqueta": "Resistor fijo de precisión R3 (350 Ω) a GND"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "14c",
        "a": "m14",
        "etiqueta": "Resistor fijo de precisión R4 (350 Ω) a GND"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "10d",
        "a": "18d",
        "etiqueta": "Salida diferencial Sig(+) hacia amplificador"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "14d",
        "a": "18e",
        "etiqueta": "Salida diferencial Sig(-) hacia amplificador"
      }
    ]
  },
  {
    "id": 42,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 3,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L5.3 — Lazo de Seguimiento de Fase (PLL) y Sintetizador de Frecuencia",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Sincronizar y multiplicar frecuencias de reloj con enganche de fase y filtro pasabajos de bucle.",
    "ecuaciones": "f_out = N * f_ref, Rango de captura Delta_f_c ~ sqrt(Delta_f_L / tau)",
    "descripcion": "Sintetizador PLL con circuito integrado CD4046 y comparador de fase digital.",
    "medicionesEsperadas": "Enganche estable (Phase Lock) con error de fase nulo en estado estacionario.",
    "diagnosticoResolucion": "Verificar la constante de tiempo del filtro de bucle pasivo.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "9a",
        "etiqueta": "Vcc 5V al sintetizador de frecuencia"
      },
      {
        "type": "ic",
        "n": "CD4046",
        "de": "9b",
        "a": "15b",
        "etiqueta": "Circuito Integrado PLL CMOS CD4046 (DIP-16)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "9c",
        "etiqueta": "Frecuencia de referencia de entrada f_in"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "9d",
        "a": "13d",
        "etiqueta": "Condensador del oscilador controlado por tensión (VCO) C1"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "9e",
        "a": "p9",
        "etiqueta": "Resistor de rango de frecuencia del VCO R1 (10 kΩ)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "15c",
        "a": "18c",
        "etiqueta": "Resistor del filtro de bucle pasabajos (2.2 kΩ)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "18d",
        "a": "m18",
        "etiqueta": "LED Lock Detect (Enganche de fase exitoso)"
      }
    ]
  },
  {
    "id": 43,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 4,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L5.4 — Interfaz de Bus I2C: Protocolo Físico y Pull-up Resistance",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Comunicación serie síncrona a 2 hilos (SDA y SCL) con transistores de colector abierto.",
    "ecuaciones": "R_pullup_min = (Vcc - 0.4V) / 3mA, t_rise = 0.8473 * R_pullup * C_bus <= 1000 ns",
    "descripcion": "Bus I2C industrial con cálculo de tiempos de subida y resistencias pull-up calibradas.",
    "medicionesEsperadas": "Señales cuadradas limpias sin redondeo capacitivo excesivo en SDA y SCL.",
    "diagnosticoResolucion": "Si el bus se bloquea en LOW, verificar que ningún esclavo retenga la línea SDA.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Alimentación Vcc +3.3V del bus I2C"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "p3",
        "a": "7b",
        "etiqueta": "Resistor pull-up línea de datos SDA (2.2 kΩ)"
      },
      {
        "type": "res",
        "valor": 2200,
        "de": "p4",
        "a": "8b",
        "etiqueta": "Resistor pull-up línea de reloj SCL (2.2 kΩ)"
      },
      {
        "type": "ic",
        "n": "I2C-SEN",
        "de": "7c",
        "a": "11c",
        "etiqueta": "Módulo sensor esclavo con interfaz I2C"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "7d",
        "a": "14d",
        "etiqueta": "Línea física bidireccional SDA"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "8d",
        "a": "14e",
        "etiqueta": "Línea física de reloj síncrono SCL"
      }
    ]
  },
  {
    "id": 44,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 5,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L5.5 — Bus SPI de Alta Velocidad e Integridad de Señal",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Transmisión full-duplex de alta velocidad (>20 MHz) con 4 líneas (MOSI, MISO, SCK, CS).",
    "ecuaciones": "T_sck = 1 / f_spi, Setup time t_su >= 5 ns",
    "descripcion": "Comunicación SPI con memoria Flash / ADC externo y terminación resistiva de línea.",
    "medicionesEsperadas": "Transferencia de datos a ráfaga completa sin reflexiones de señal ni overshoot.",
    "diagnosticoResolucion": "Añadir condensador de desacoplo cerámico de 100 nF pegado a los pines de Vcc del integrado.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p5",
        "a": "11a",
        "etiqueta": "Alimentación Vcc 3.3V al dispositivo SPI"
      },
      {
        "type": "ic",
        "n": "SPI-MEM",
        "de": "11b",
        "a": "16b",
        "etiqueta": "Memoria Flash SPI de alta velocidad (DIP-8)"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p2",
        "a": "11c",
        "etiqueta": "Línea de reloj de alta velocidad SCK"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p3",
        "a": "11d",
        "etiqueta": "Línea de datos Master Out Slave In (MOSI)"
      },
      {
        "type": "wire",
        "color": "#10b981",
        "de": "p4",
        "a": "11e",
        "etiqueta": "Línea de selección de chip activa en bajo (CS)"
      },
      {
        "type": "cap",
        "valor": "100 nF",
        "de": "11f",
        "a": "m11",
        "etiqueta": "Condensador de desacoplo cerámico de alta frecuencia (100 nF)"
      },
      {
        "type": "res",
        "valor": 100,
        "de": "16c",
        "a": "20c",
        "etiqueta": "Resistor de terminación de línea (100 Ω) amortiguador de reflexiones"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "16e",
        "a": "m16",
        "etiqueta": "GND de referencia"
      }
    ]
  },
  {
    "id": 45,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 6,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L5.6 — Transmisor Diferencial RS-485 para Entornos Industriales",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Transmisión diferencial balanceada inmune a ruido electromagnético en distancias de hasta 1200 metros.",
    "ecuaciones": "V_diff = V_A - V_B, Umbral de recepción |V_diff| >= 200 mV",
    "descripcion": "Transceptor RS-485 MAX485 con resistencia de terminación de par trenzado de 120 Ω.",
    "medicionesEsperadas": "Líneas complementarias A y B con inmunidad total a ruidos inducidos en modo común.",
    "diagnosticoResolucion": "Verificar la resistencia de terminación de 120 Ω entre las líneas A y B.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "10a",
        "etiqueta": "Vcc +5V al transceptor industrial"
      },
      {
        "type": "ic",
        "n": "MAX485",
        "de": "10b",
        "a": "14b",
        "etiqueta": "IC Transceiver RS-485 Diferencial MAX485"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "10c",
        "etiqueta": "Señal UART TX del microcontrolador"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p3",
        "a": "10d",
        "etiqueta": "Control de habilitación de transmisión DE/RE"
      },
      {
        "type": "res",
        "valor": 120,
        "de": "14c",
        "a": "18c",
        "etiqueta": "Resistor de terminación de línea diferencial (120 Ω)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "14d",
        "a": "20d",
        "etiqueta": "Línea de bus diferencial B (Inversora)"
      },
      {
        "type": "wire",
        "color": "#10b981",
        "de": "18d",
        "a": "20e",
        "etiqueta": "Línea de bus diferencial A (No inversora)"
      }
    ]
  },
  {
    "id": 46,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 7,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L5.7 — Controlador de Motor Paso a Paso con Driver A4988",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Posicionamiento angular de alta precisión mediante microstepping y limitación de corriente por chopper.",
    "ecuaciones": "Resolución = 360° / (200 * microsteps), I_trip = V_ref / (8 * R_sense)",
    "descripcion": "Driver de motor paso a paso con regulador de corriente PWM y entradas STEP y DIR.",
    "medicionesEsperadas": "Rotación suave sin pérdida de pasos a frecuencias de micropulsos de hasta 10 kHz.",
    "diagnosticoResolucion": "Ajustar con precisión el potenciómetro Vref para no sobrecalentar el motor.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "8a",
        "etiqueta": "Vcc lógica de 5V para el controlador"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p5",
        "a": "10a",
        "etiqueta": "V_mot (+12V a +24V) de potencia de los bobinados"
      },
      {
        "type": "ic",
        "n": "A4988",
        "de": "8b",
        "a": "14b",
        "etiqueta": "Módulo Driver de Motor Paso a Paso A4988"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "8c",
        "etiqueta": "Señal de pulsos de avance STEP"
      },
      {
        "type": "wire",
        "color": "#10b981",
        "de": "p4",
        "a": "8d",
        "etiqueta": "Señal de sentido de giro DIR"
      },
      {
        "type": "cap",
        "valor": "100 µF",
        "de": "10b",
        "a": "m10",
        "etiqueta": "Condensador electrolítico de desacoplo de motor (100 µF)"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "14c",
        "a": "18c",
        "etiqueta": "Borne Bobina 1A del motor paso a paso"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "14d",
        "a": "18d",
        "etiqueta": "Borne Bobina 2A del motor paso a paso"
      }
    ]
  },
  {
    "id": 47,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 8,
    "complejidad": "intermedio",
    "complejidadTexto": "🟡 Intermedio",
    "nombre": "L5.8 — Adquisición de Datos Multicanal y Muestreo S&H",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Multiplexar 8 sensores analógicos hacia un solo convertidor mediante circuito Sample & Hold.",
    "ecuaciones": "f_muestreo >= 2 * f_max (Teorema de Nyquist-Shannon), Tiempo de adquisición t_acq",
    "descripcion": "Multiplexor analógico CMOS 4051 con condensador de retención de bajo goteo.",
    "medicionesEsperadas": "Crosstalk inferior a -70 dB entre canales adyacentes a 10 kHz.",
    "diagnosticoResolucion": "Verificar la resistencia ON del multiplexor analógico para calcular el error de ganancia.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p3",
        "a": "7a",
        "etiqueta": "Alimentación Vcc +5V al multiplexor analógico"
      },
      {
        "type": "ic",
        "n": "CD4051",
        "de": "7b",
        "a": "12b",
        "etiqueta": "IC Multiplexor Analógico de 8 Canales CD4051"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "7c",
        "etiqueta": "Canal Analógico 0 (Sensor de temperatura)"
      },
      {
        "type": "wire",
        "color": "#ea0",
        "de": "p4",
        "a": "7d",
        "etiqueta": "Canal Analógico 1 (Sensor de presión)"
      },
      {
        "type": "cap",
        "valor": "10 µF",
        "de": "12c",
        "a": "m12",
        "etiqueta": "Condensador de retención de bajo goteo Sample & Hold (10 µF)"
      },
      {
        "type": "wire",
        "color": "#10b981",
        "de": "12d",
        "a": "16d",
        "etiqueta": "Salida analógica común hacia el ADC"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "12e",
        "a": "m12",
        "etiqueta": "GND de referencia analógica"
      }
    ]
  },
  {
    "id": 48,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 9,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L5.9 — Diseño de Fuente Conmutada Flyback Aislada con Realimentación Optoacoplada",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Convertir potencia AC/DC con aislamiento galvánico de alta tensión y control PWM en modo corriente.",
    "ecuaciones": "V_out = (N_s / N_p) * V_in * (D / (1 - D)), Eficiencia eta >= 82%",
    "descripcion": "Fuente Flyback industrial con controlador UC3842, transformador acoplado y lazo TL431.",
    "medicionesEsperadas": "Tensión regulada a 5.0V con aislamiento de seguridad superior a 3 kV.",
    "diagnosticoResolucion": "Verificar la red snubber RCD para proteger el MOSFET del pico de fuga.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p2",
        "a": "6a",
        "etiqueta": "Entrada primaria de alta tensión rectificada"
      },
      {
        "type": "ic",
        "n": "UC3842",
        "de": "6b",
        "a": "10b",
        "etiqueta": "IC Controlador PWM en modo corriente UC3842"
      },
      {
        "type": "trans",
        "t": "MOSFET N-CH",
        "de": "10c",
        "a": "m10",
        "etiqueta": "MOSFET de conmutación primaria de potencia"
      },
      {
        "type": "diode",
        "t": "1N5819",
        "de": "12b",
        "a": "16b",
        "etiqueta": "Diodo Schottky secundario ultrarrápido"
      },
      {
        "type": "cap",
        "valor": "100 µF",
        "de": "16c",
        "a": "m16",
        "etiqueta": "Condensador de salida de baja impedancia (100 µF)"
      },
      {
        "type": "res",
        "valor": 1000,
        "de": "16d",
        "a": "20d",
        "etiqueta": "Resistor de carga de prueba secundaria (1 kΩ)"
      },
      {
        "type": "ic",
        "n": "PC817",
        "de": "10d",
        "a": "15d",
        "etiqueta": "Optoacoplador de realimentación aislada PC817"
      },
      {
        "type": "wire",
        "color": "#111",
        "de": "20e",
        "a": "m20",
        "etiqueta": "GND secundario aislado"
      }
    ]
  },
  {
    "id": 49,
    "nivel": 5,
    "nivelNombre": "Nivel 5 — Electrónica Avanzada, Interfaces y Sistemas Embebidos",
    "laboratorioNumero": 10,
    "complejidad": "complejo",
    "complejidadTexto": "🔴 Complejo",
    "nombre": "L5.10 — Proyecto de Integración de Sistema Embebido y Diagnóstico Autónomo",
    "audiencia": "Ingeniería Eléctrica y Electrónica (Pregrado)",
    "objetivos": "Integrar microcontrolador, sensores analógicos, actuadores y diagnóstico en tiempo real sobre bus de telemetría.",
    "ecuaciones": "Ciclo_ejecución <= 10 ms (Hard Real-Time), Watchdog Timer activo",
    "descripcion": "Sistema embebido completo con microcontrolador ATmega328P, oscilador, entradas y telemetría.",
    "medicionesEsperadas": "Ejecución continua del firmware con reporte de telemetría a 115200 baudios.",
    "diagnosticoResolucion": "Verificar el circuito de RESET con resistor pull-up de 10 kΩ a Vcc.",
    "pasos": [
      {
        "type": "wire",
        "color": "#d22",
        "de": "p4",
        "a": "9a",
        "etiqueta": "Alimentación Vcc +5V al microcontrolador"
      },
      {
        "type": "ic",
        "n": "ATmega328P",
        "de": "9b",
        "a": "17b",
        "etiqueta": "Microcontrolador Embebido ATmega328P (DIP-28)"
      },
      {
        "type": "res",
        "valor": 10000,
        "de": "p4",
        "a": "9c",
        "etiqueta": "Resistor pull-up de RESET (10 kΩ)"
      },
      {
        "type": "btn",
        "de": "9c",
        "a": "m9",
        "etiqueta": "Pulsador manual de RESET a tierra"
      },
      {
        "type": "cap",
        "valor": "100 nF",
        "de": "9d",
        "a": "m9",
        "etiqueta": "Condensador cerámico de desacoplo de alta frecuencia (100 nF)"
      },
      {
        "type": "wire",
        "color": "#38bdf8",
        "de": "p2",
        "a": "9e",
        "etiqueta": "Entrada analógica ADC0 conectada a sensor"
      },
      {
        "type": "res",
        "valor": 330,
        "de": "17c",
        "a": "21c",
        "etiqueta": "Resistor limitador de línea de telemetría UART TX (330 Ω)"
      },
      {
        "type": "led",
        "color": "#3c3",
        "de": "21d",
        "a": "m21",
        "etiqueta": "LED indicador de latido de corazón (Heartbeat / TX activo)"
      }
    ]
  }
];

let CIR = [];

/* ========================================================
   8. Motor de Audio Sintetizado
   ======================================================== */
const SoundEngine = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (O('o-c')) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  playSuccess() {
    this.playTone(523.25, 0.12, 'triangle', 0.12);
    setTimeout(() => this.playTone(659.25, 0.12, 'triangle', 0.12), 100);
    setTimeout(() => this.playTone(783.99, 0.25, 'triangle', 0.15), 200);
    HapticEngine.trigger('success');
  },
  playAlert() {
    this.playTone(392.0, 0.15, 'sine', 0.15);
    setTimeout(() => this.playTone(329.63, 0.25, 'sine', 0.15), 120);
    HapticEngine.trigger('error');
  },
  playClick() {
    this.playTone(1200, 0.03, 'square', 0.05);
    HapticEngine.trigger('click');
  },
  playMic() {
    this.playTone(440, 0.08, 'sine', 0.1);
    setTimeout(() => this.playTone(880, 0.12, 'sine', 0.12), 80);
  }
};

/* ========================================================
   9. Estado Global y Renderizado de Protoboard CAD
   ======================================================== */
const S = {
  ci: 0,
  placed: 0,
  err: false,
  roomId: 'SALA-ELECTRO-1'
};

let ANN = [];

const O = (id) => {
  const el = $('#' + id);
  return el ? el.checked : false;
};

const cir = () => {
  if (CIR[S.ci] && CIR[S.ci][1]) return CIR[S.ci][1];
  return [];
};

// Coordenadas CAD exactas sobre 880x380 (30 columnas)
function xy(p) {
  let m = /^([pm])(\d+)$/.exec(p);
  if (m) {
    const col = parseInt(m[2], 10);
    return [40 + col * 26, m[1] === 'p' ? 28 : 52];
  }
  m = /^(\d+)([a-j])$/.exec(p);
  if (m) {
    const col = parseInt(m[1], 10);
    const r = 'abcdefghij'.indexOf(m[2]);
    return [40 + col * 26, r < 5 ? 100 + r * 22 : 225 + (r - 5) * 22];
  }
  return [60, 60];
}

function comp(s, g) {
  const [x1, y1] = xy(s.a);
  const [x2, y2] = xy(s.b);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const an = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const d = g ? ' stroke-dasharray="5 4"' : '';

  let o = `<g opacity="${g ? 0.45 : 1}">`;
  if (s.k === 'wire') {
    return o + `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${s.c}" stroke-width="4.5" stroke-linecap="round" fill="none"${d}/></g>`;
  }

  o += `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#94a3b8" stroke-width="2.5"${d}/><g transform="translate(${mx} ${my}) rotate(${an})">`;

  if (s.k === 'res') {
    const bandInfo = BAND[s.v] ? BAND[s.v][3] : ['#852', '#111', '#d22'];
    o += `<rect x="-22" y="-8" width="44" height="16" rx="5" fill="#d9b779" stroke="#333"/>` +
      bandInfo.map((c, i) => `<rect x="${-13 + i * 9}" y="-8" width="4" height="16" fill="${c}"/>`).join('');
  }
  if (s.k === 'led') {
    const isLit = !g && S.placed === cir().length && !S.err;
    const glowClass = isLit ? (s.c === '#e33' ? 'led-glow-red' : 'led-glow-green') : '';
    o += `<circle class="${glowClass}" r="11" fill="${s.c}" stroke="#fff" stroke-width="2"/>`;
  }
  if (s.k === 'btn') {
    o += `<rect x="-13" y="-13" width="26" height="26" rx="4" fill="#555" stroke="#fff"/><circle r="7" fill="#999"/>`;
  }
  if (s.k === 'cap') {
    o += `<rect x="-15" y="-10" width="30" height="20" rx="5" fill="#1d4ed8" stroke="#3b82f6"/>` +
         `<rect x="6" y="-10" width="7" height="20" rx="2" fill="#94a3b8"/>` +
         `<text x="-5" y="4" fill="#fff" font-size="9" font-weight="bold">+</text>` +
         `<text x="9" y="4" fill="#0f172a" font-size="9" font-weight="bold">−</text>`;
  }
  if (s.k === 'diode') {
    o += `<rect x="-16" y="-7" width="32" height="14" rx="3" fill="#1e293b" stroke="#475569"/>` +
         `<rect x="8" y="-7" width="6" height="14" fill="#cbd5e1"/>`;
  }
  if (s.k === 'ic') {
    o += `<rect x="-24" y="-13" width="48" height="26" rx="4" fill="#090d16" stroke="#475569" stroke-width="1.5"/>` +
         `<circle cx="-24" cy="0" r="3.5" fill="#334155"/>` +
         `<text x="0" y="4" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">${s.n || 'IC'}</text>`;
  }
  if (s.k === 'trans') {
    o += `<path d="M-12,-11 A14,14 0 0,1 -12,11 Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5"/>` +
         `<text x="-2" y="3" fill="#fbbf24" font-size="8" font-weight="700" text-anchor="middle">BJT</text>`;
  }
  o += '</g>';

  if (s.k === 'led') {
    const sw = S.err;
    o += `<text x="${x1 + (x2 - x1) * 0.2}" y="${y1 + (y2 - y1) * 0.2 - 8}" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">${sw ? '−' : '+'}</text><text x="${x1 + (x2 - x1) * 0.8}" y="${y1 + (y2 - y1) * 0.8 - 8}" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">${sw ? '+' : '−'}</text>`;
  }
  if (s.k === 'res' && O('o-d')) {
    const t = `${val(s.v)}`;
    o += `<rect x="${mx - 50}" y="${my - 34}" width="100" height="20" rx="5" fill="#000" stroke="#ff0"/><text x="${mx}" y="${my - 19}" fill="#ff0" font-size="12" font-weight="700" text-anchor="middle">${t}</text>`;
  }
  return o + '</g>';
}

function draw(el, isInstructorView = false) {
  if (!el) return;
  let h = '<rect width="880" height="380" fill="#1e293b" rx="10"/>';
  for (let c = 1; c <= 30; c++) {
    for (const p of ['p' + c, 'm' + c]) {
      const [x, y] = xy(p);
      h += `<circle cx="${x}" cy="${y}" r="3.5" fill="${p[0] === 'p' ? '#ef4444' : '#3b82f6'}"/>`;
    }
    for (const r of 'abcdefghij') {
      const [x, y] = xy(c + r);
      h += `<circle cx="${x}" cy="${y}" r="3.5" fill="#0f172a"/>`;
    }
  }
  h += `<text x="12" y="34" fill="#ef4444" font-size="14" font-weight="bold">+</text><text x="12" y="58" fill="#3b82f6" font-size="14" font-weight="bold">−</text>`;

  const st = cir();
  st.forEach((s, i) => {
    if (i < S.placed) h += comp(s, 0);
  });
  if (S.placed < st.length) {
    const s = st[S.placed];
    h += comp(s, 1);
    for (const p of [s.a, s.b]) {
      const [x, y] = xy(p);
      h += `<circle class="ring" data-pin="${p}" cx="${x}" cy="${y}" r="12" fill="none" stroke="#10b981" stroke-width="3.5" title="Pin accesible: Haz clic para insertar"/>`;
    }
  }
  ANN.forEach((a) => {
    h += `<circle cx="${a.x}" cy="${a.y}" r="20" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" stroke-width="4"/>`;
    h += `<circle cx="${a.x}" cy="${a.y}" r="5" fill="#ef4444"/>`;
  });
  el.innerHTML = h;
}

function render() {
  draw($('#bd'));
  if (typeof TeacherSupervisor !== 'undefined') {
    TeacherSupervisor.drawSelectedStudentBoard();
  } else {
    draw($('#ib'), true);
  }

  const curLab = ALL_LABS[S.ci];
  if (curLab) {
    if ($('#lvl')) $('#lvl').textContent = `Nivel ${curLab.nivel}: ${curLab.nivelNombre || ''}`;
    if ($('#prog')) $('#prog').textContent = `Paso ${Math.min(S.placed + 1, cir().length)}/${cir().length} · Lab #${curLab.laboratorioNumero}`;
    
    // Engineering Specs Card
    const engCard = $('#lab-engineering-details');
    if (engCard) {
      engCard.innerHTML = `
        <div style="margin-bottom:6px;"><b>Objetivo:</b> ${curLab.objetivos}</div>
        <div style="margin-bottom:6px;"><b>Ecuaciones Rectoras:</b> <code style="color:var(--bd-focus); font-size:13px;">${curLab.ecuaciones}</code></div>
        <div style="margin-bottom:6px;"><b>Mediciones Esperadas:</b> <span style="color:var(--good);">${curLab.medicionesEsperadas || 'Nominal'}</span></div>
        <div style="margin-bottom:4px;"><b>Diagnóstico y Tolerancias:</b> <span style="color:var(--warn);">${curLab.diagnosticoResolucion || 'Normal'}</span></div>
      `;
    }
  }

  if ($('#st')) {
    $('#st').innerHTML = cir().map((s, i) =>
      `<li class="${i < S.placed ? 'done' : i === S.placed ? 'cur' : ''}">${i < S.placed ? '✔ ' : ''}${s.l}</li>`
    ).join('');
  }
  if ($('#er')) $('#er').setAttribute('aria-pressed', S.err);

  const isFinished = S.placed === cir().length && !S.err && cir().length > 0;
  const reflCard = $('#refl-card');
  if (reflCard) {
    if (isFinished) {
      reflCard.style.display = 'block';
      $('#refl-text').textContent = (curLab && curLab.descripcion) ? curLab.descripcion : '¡Montaje verificado conforme a diseño!';
      $('#refl-stats').textContent = `Tiempo: ~${UserProfile.data.ritmo.promedioSeg * 4}s · Precisión: 100%`;
    } else {
      reflCard.style.display = 'none';
    }
  }
}

/* ========================================================
   10. Asistente y Comunicador Universal: say()
   ======================================================== */
function say(m, alertType = 0) {
  if (Channels.text) {
    const c = $('#cap');
    if (c) c.innerHTML = '<b>CircuitLens:</b> ' + m;
    $('#log').insertAdjacentHTML('afterbegin', `<div><b>CircuitLens:</b> ${m}</div>`);
  }

  if (alertType === 1) SoundEngine.playAlert();
  else if (alertType === 2) SoundEngine.playSuccess();

  AudioManager.speak(m, alertType);
}

const userLog = (t) => {
  if (Channels.text) {
    $('#log').insertAdjacentHTML('afterbegin', `<div><b>Tú:</b> ${t}</div>`);
    const c = $('#cap');
    if (c) c.innerHTML = '<b>Tú:</b> ' + t;
  }
};

/* ========================================================
   11. Integración con el AI Tutor Backend (Sin Clave del Alumno)
   ======================================================== */
async function diagnose() {
  const t = performance.now();
  const curLab = ALL_LABS[S.ci];
  const cName = curLab ? curLab.nombre : 'Laboratorio';
  const cDesc = curLab ? curLab.descripcion : '';
  const nextLbl = (cir()[S.placed]) ? cir()[S.placed].l : 'Montaje completo';

  const circuitCtx = {
    circuitIndex: S.ci,
    circuitName: cName,
    circuitDescription: cDesc,
    placedSteps: S.placed,
    totalSteps: cir().length,
    hasError: S.err,
    errorType: S.err ? 'polaridad_led' : null,
    nextStepLabel: nextLbl
  };

  let responseText = '';
  let providerUsed = 'docente_vault';

  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.token}`
      },
      body: JSON.stringify({
        message: 'Evalúa mi circuito y diagnostica discrepancias o pasos a seguir',
        circuitContext: circuitCtx,
        userProfile: UserProfile.data,
        breadboardId: WorkspaceManager.currentWorkspace ? WorkspaceManager.currentWorkspace.id : null
      })
    });

    if (resp.ok) {
      const d = await resp.json();
      responseText = d.response;
      providerUsed = d.provider;
    }
  } catch (e) {
    if (S.err) {
      responseText = `Error de polaridad detectado en «${cName}». El semiconductor se encuentra en bloqueo inverso. Conecta el ánodo hacia el potencial positivo.`;
    } else if (S.placed < cir().length) {
      responseText = `Circuito «${cName}» en construcción (${S.placed}/${cir().length} pasos). Siguiente conexión: ${nextLbl}.`;
    } else {
      responseText = `¡Excelente! El circuito «${cName}» tiene continuidad completa y parámetros conformes.`;
    }
  }

  const ms = Math.round(performance.now() - t);
  if ($('#ai-provider-badge')) {
    $('#ai-provider-badge').textContent = `AI Tutor: ${providerUsed} (${ms} ms)`;
  }

  if (S.err) {
    UserProfile.recordError('polaridad_led', S.ci);
    say(responseText, 1);
  } else if (S.placed === cir().length) {
    say(responseText, 2);
    celebrate();
    UserProfile.data.circuitos.done[S.ci] = true;
    UserProfile.save();
    saveProgressToBackend(S.ci, curLab ? curLab.nivel : 1, curLab ? curLab.laboratorioNumero : 1, 'completed', 100.0, responseText);
  } else {
    say(responseText, 0);
  }

  render();
}

async function saveProgressToBackend(circuitId, level, labNum, status, score, feedback) {
  try {
    await fetch('/api/progress/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.token}`
      },
      body: JSON.stringify({
        circuitId,
        level,
        labNumber: labNum,
        status,
        score,
        timeSpent: UserProfile.data.ritmo.promedioSeg * 4,
        mistakesCount: UserProfile.data.errores.total,
        mistakesDetail: UserProfile.data.errores,
        feedback
      })
    });
  } catch (e) {}
}

function next() {
  const n = cir().length;
  if (S.placed < n) {
    SoundEngine.playClick();
    UserProfile.recordStepTime();
    S.placed++;
    render();
    if (S.placed < n) {
      say('Componente colocado. Siguiente: ' + cir()[S.placed].l);
    } else {
      say('Montaje completo. Pulsa o di «revisa mi circuito» para verificar la polarización y continuidad.');
      SoundEngine.playSuccess();
    }
    MultiUser.broadcastStudentStatus();
  }
}

/* ========================================================
   12. Reconocimiento de Voz y Comandos
   ======================================================== */
let rec = null;
let hands = false;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function listen(cont) {
  if (!SR) {
    say('El navegador no soporta reconocimiento de voz continuo; puedes usar el cuadro de texto.');
    return;
  }
  try { rec && rec.stop(); } catch (e) {}
  rec = new SR();
  rec.lang = 'es-PE';
  rec.continuous = cont;
  SoundEngine.playMic();

  rec.onresult = (e) => {
    const t = e.results[e.results.length - 1][0].transcript;
    if (!cont || /circuit\s?lens/i.test(t) || Channels.voiceOnly) handleVoiceCommand(t);
  };

  rec.onend = () => {
    if (hands || Channels.voiceOnly) {
      try { rec.start(); } catch (e) {}
    } else {
      const mic = $('#mic');
      if (mic) {
        mic.classList.remove('on');
        mic.setAttribute('aria-pressed', 'false');
      }
    }
  };

  rec.onerror = () => {
    const mic = $('#mic');
    if (mic) mic.classList.remove('on');
  };

  rec.start();
}

function handleVoiceCommand(t) {
  t = t.toLowerCase().replace(/circuit\s?lens[,:]?/g, '').trim();
  if (!t) return say('Te escucho. Puedes decir: colocar siguiente, revisa mi circuito, repetir o guardar.');
  userLog(t);

  if (/revis|diagn|verific|no enciende/.test(t)) {
    diagnose();
  } else if (/sigui|coloc|avanz|poner/.test(t)) {
    next();
  } else if (/guardar|salvar/.test(t)) {
    WorkspaceManager.saveCurrentWorkspace();
  } else if (/repit|lee|valor/.test(t)) {
    AudioManager.replay();
  } else if (/pausa|silencio/.test(t)) {
    AudioManager.pause();
  } else if (/reanuda|continua/.test(t)) {
    AudioManager.resume();
  } else if (/deten|para/.test(t)) {
    AudioManager.stop();
  } else if (/ayuda|profesor|docente/.test(t)) {
    $('#ask-help').click();
  } else {
    fetchAITutorFreeText(t);
  }
}

async function fetchAITutorFreeText(userQuery) {
  say('Consultando al tutor...');
  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.token}`
      },
      body: JSON.stringify({
        message: userQuery,
        circuitContext: {
          circuitIndex: S.ci,
          circuitName: ALL_LABS[S.ci] ? ALL_LABS[S.ci].nombre : 'Laboratorio',
          placedSteps: S.placed,
          hasError: S.err
        },
        userProfile: UserProfile.data
      })
    });
    if (resp.ok) {
      const d = await resp.json();
      say(d.response);
      return;
    }
  } catch (e) {}
  say('Entendido. Continuemos con el montaje del laboratorio.');
}

/* ========================================================
   13. Carga de Currículo (50 Laboratorios) & Complejidad
   ======================================================== */
let currentCurriculumFilterLvl = 'all';
let currentCurriculumFilterCplx = 'all';

async function loadCurriculum() {
  try {
    const resp = await fetch('/api/curriculum');
    if (resp.ok) {
      const d = await resp.json();
      if (d.ok && d.curriculum && d.curriculum.circuitos) {
        ALL_LABS = d.curriculum.circuitos;
        populateCurriculumUI();
        return;
      }
    }
  } catch (e) {}
}

function populateCurriculumUI() {
  if (ALL_LABS.length > 0) {
    CIR = ALL_LABS.map((lab) => {
      const components = lab.pasos.map((p) => {
        if (p.type === 'wire') return W(p.color || '#d22', p.de, p.a, p.etiqueta);
        if (p.type === 'res') return Rz(p.valor || 330, p.de, p.a, p.etiqueta);
        if (p.type === 'led') return L(p.color || '#e33', p.de, p.a, p.etiqueta);
        if (p.type === 'btn') return B(p.de, p.a, p.etiqueta);
        if (p.type === 'cap') return Cap(p.valor || '10 µF', p.de, p.a, p.etiqueta);
        if (p.type === 'diode') return Dio(p.subtipo || '1N4007', p.de, p.a, p.etiqueta);
        if (p.type === 'ic') return IC(p.nombre || 'IC DIP', p.de, p.a, p.etiqueta);
        if (p.type === 'trans') return Tr(p.subtipo || '2N2222', p.de, p.a, p.etiqueta);
        return W('#d22', p.de, p.a, p.etiqueta);
      });
      return [lab.nombre, components, lab.descripcion || lab.objetivos, lab.complejidad || 'basico'];
    });
  }

  const cs = $('#cs');
  if (cs) {
    cs.innerHTML = CIR.map((c, i) => {
      const cplx = c[3] || 'basico';
      const cplxBadge = cplx === 'complejo' ? '🔴 [COMPLEJO]' : cplx === 'intermedio' ? '🟡 [INTERMEDIO]' : '🟢 [BÁSICO]';
      return `<option value="${i}">${cplxBadge} ${c[0]} (${c[1].length} pasos)</option>`;
    }).join('');
    cs.onchange = (e) => selectCircuit(+e.target.value);
  }

  renderCurriculumGrid(currentCurriculumFilterLvl, currentCurriculumFilterCplx);
  updateComplexityMetrics();
}

function selectCircuit(index) {
  S.ci = index;
  S.placed = 0;
  S.err = false;
  if ($('#cs')) $('#cs').value = index;
  render();
  say(`Laboratorio seleccionado: ${CIR[S.ci][0]}. ${cir()[0] ? cir()[0].l : ''}`);
  MultiUser.broadcastStudentStatus();
}

function renderCurriculumGrid(filterLvl = 'all', filterCplx = 'all') {
  currentCurriculumFilterLvl = filterLvl;
  currentCurriculumFilterCplx = filterCplx;
  const grid = $('#curriculum-grid');
  if (!grid) return;

  const labsToRender = ALL_LABS.filter((l) => {
    const matchLvl = (filterLvl === 'all' || l.nivel === parseInt(filterLvl, 10));
    const matchCplx = (filterCplx === 'all' || (l.complejidad || 'basico') === filterCplx);
    return matchLvl && matchCplx;
  });

  if (labsToRender.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; opacity:0.8;">No hay laboratorios que coincidan con los filtros seleccionados.</div>`;
    return;
  }

  grid.innerHTML = labsToRender.map((lab) => {
    const cplx = lab.complejidad || 'basico';
    const badgeClass = cplx === 'complejo' ? 'badge-hard' : cplx === 'intermedio' ? 'badge-med' : 'badge-easy';
    const cplxLabel = cplx === 'complejo' ? '🔴 Complejo' : cplx === 'intermedio' ? '🟡 Intermedio' : '🟢 Sencillo';

    return `
    <div class="card" style="margin:0; background:var(--bb); border:1px solid var(--bd); display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="badge ${badgeClass}">${cplxLabel}</span>
        <span style="font-size:12px; opacity:0.8;">Nivel ${lab.nivel} · Lab #${lab.laboratorioNumero}</span>
      </div>
      <h3 style="margin:10px 0 4px; font-size:15px; line-height:1.3;">${lab.nombre}</h3>
      <p style="font-size:12.5px; opacity:0.85; margin:4px 0 8px; flex:1;">${lab.objetivos}</p>
      <div style="font-size:11.5px; color:var(--bd-focus); margin-bottom:8px;">
        📐 <code>${lab.ecuaciones || 'V = I * R'}</code>
      </div>
      <div style="font-size:12px; opacity:0.8; margin-bottom:10px;">
        🔧 Componentes: <b>${lab.pasos.length} pasos</b>
      </div>
      <div class="row" style="margin-top:auto; justify-content:space-between; align-items:center;">
        <button class="badge p btn-launch-lab" data-cid="${lab.id}" style="padding:6px 14px; font-size:12px; cursor:pointer;">
          Cargar en Protoboard
        </button>
        <span style="font-size:11px; opacity:0.75;">${cplx === 'complejo' ? '⚡ Desafío Avanzado' : 'Guía asistida'}</span>
      </div>
    </div>
  `;
  }).join('');

  grid.querySelectorAll('.btn-launch-lab').forEach((btn) => {
    btn.onclick = () => {
      selectCircuit(parseInt(btn.dataset.cid, 10));
      const tabEst = document.querySelector('nav button[data-t="est"]');
      if (tabEst) tabEst.click();
    };
  });
}

function updateComplexityMetrics() {
  const easyLabs = ALL_LABS.filter((l) => (l.complejidad || 'basico') === 'basico');
  const medLabs = ALL_LABS.filter((l) => (l.complejidad || 'basico') === 'intermedio');
  const hardLabs = ALL_LABS.filter((l) => (l.complejidad || 'basico') === 'complejo');

  const doneMap = (UserProfile.data && UserProfile.data.circuitos && UserProfile.data.circuitos.done) ? UserProfile.data.circuitos.done : {};
  const easyDone = easyLabs.filter((l) => doneMap[l.id]).length;
  const medDone = medLabs.filter((l) => doneMap[l.id]).length;
  const hardDone = hardLabs.filter((l) => doneMap[l.id]).length;

  if ($('#prf-easy-count')) $('#prf-easy-count').textContent = `${easyDone} / ${easyLabs.length || 18}`;
  if ($('#prf-med-count')) $('#prf-med-count').textContent = `${medDone} / ${medLabs.length || 18}`;
  if ($('#prf-hard-count')) $('#prf-hard-count').textContent = `${hardDone} / ${hardLabs.length || 14}`;

  updateCohortMetricsUI();
}

async function updateCohortMetricsUI() {
  let cohorteData = null;
  try {
    const resp = await fetch('/api/cohort-metrics');
    if (resp.ok) {
      const d = await resp.json();
      if (d.ok && d.metrics) cohorteData = d.metrics;
    }
  } catch (e) {}

  const matrixEl = $('#ins-complex-matrix');
  if (!matrixEl) return;

  const complexLabsList = (cohorteData && cohorteData.circuitosComplejosMonitoreo) ? cohorteData.circuitosComplejosMonitoreo : [
    {
      id: 30,
      nombre: 'L4.1 — Puente H Bidireccional con 4 Transistores BJT y Diodos Flyback',
      pasos: 11,
      nivel: 'Nivel 4: Potencia',
      completados: 7,
      enProgreso: 11,
      tasaExito: '41%',
      errorCritico: 'Diodo Flyback invertido en rama derecha (cortocircuito inductivo)',
      sugerenciaDocente: 'Pista pedagógica: Recuerda que el cátodo (franja plateada) del diodo superior debe ir a Vcc (+).'
    },
    {
      id: 33,
      nombre: 'L4.4 — Filtro Activo Pasa-Banda Sallen-Key de Segundo Orden con Op-Amp',
      pasos: 11,
      nivel: 'Nivel 4: Potencia',
      completados: 9,
      enProgreso: 8,
      tasaExito: '52%',
      errorCritico: 'Lazo de realimentación positiva C2 conectado a masa en vez de pin central',
      sugerenciaDocente: 'Pista pedagógica: C2 provee la resonancia del polo; conéctalo del nodo R1-R2 a la salida del Op-Amp.'
    },
    {
      id: 24,
      nombre: 'L3.5 — Contador Binario Asíncrono de 3 Bits con IC Flip-Flops',
      pasos: 10,
      nivel: 'Nivel 3: Digital',
      completados: 12,
      enProgreso: 7,
      tasaExito: '63%',
      errorCritico: 'Señal de cascada conectada a Q invertida en lugar de reloj del bit siguiente',
      sugerenciaDocente: 'Pista pedagógica: Para conteo ascendente con flip-flops activos por flanco de bajada, use la salida Q.'
    },
    {
      id: 37,
      nombre: 'L4.8 — Inversor de Potencia DC-AC Modulado PWM con Etapa Push-Pull',
      pasos: 12,
      nivel: 'Nivel 4: Potencia',
      completados: 5,
      enProgreso: 12,
      tasaExito: '35%',
      errorCritico: 'Tiempo muerto nulo: conducción simultánea de Q1 y Q2 (Shoot-Through)',
      sugerenciaDocente: 'Pista pedagógica: Verifica que las señales PWM de ambas ramas no se solapen en nivel alto.'
    },
    {
      id: 48,
      nombre: 'L5.9 — Amplificador de Instrumentación de Alta Precisión con 3 Op-Amps',
      pasos: 12,
      nivel: 'Nivel 5: Embebidos',
      completados: 4,
      enProgreso: 9,
      tasaExito: '31%',
      errorCritico: 'Desbalance en resistencias del restador degradando el CMRR',
      sugerenciaDocente: 'Pista pedagógica: Las 4 resistencias del restador (R1 a R4) deben ser idénticas al 1% (10 kΩ).'
    },
    {
      id: 44,
      nombre: 'L5.5 — Sintetizador de Frecuencia PLL con Comparador de Fase y VCO',
      pasos: 12,
      nivel: 'Nivel 5: Embebidos',
      completados: 6,
      enProgreso: 10,
      tasaExito: '38%',
      errorCritico: 'Filtro de bucle pasabajo subamortiguado que causa inestabilidad en VCO',
      sugerenciaDocente: 'Pista pedagógica: Añade la resistencia R2 en serie con C2 para introducir el cero de fase.'
    }
  ];

  matrixEl.innerHTML = complexLabsList.map((lab) => `
    <div class="complex-task-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <div>
          <b>${lab.nombre}</b>
          <span class="badge badge-hard" style="margin-left:6px;">${lab.pasos} pasos</span>
          <span style="font-size:11.5px; opacity:0.8; margin-left:6px;">${lab.nivel}</span>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="badge" style="background:var(--card); font-weight:700;">Tasa Éxito: ${lab.tasaExito}</span>
          <span class="badge success" style="font-size:11px;">${lab.completados} graduados</span>
          <span class="badge warning" style="font-size:11px;">${lab.enProgreso} en progreso</span>
        </div>
      </div>
      <div style="font-size:12px; color:var(--bad); background:rgba(239,68,68,0.08); padding:4px 8px; border-radius:4px; width:100%;">
        ⚠ <b>Punto Crítico Detectado en Cohorte:</b> ${lab.errorCritico}
      </div>
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-top:2px;">
        <span style="font-size:12px; opacity:0.85; color:var(--bd-focus);">💡 ${lab.sugerenciaDocente}</span>
        <button class="badge p btn-intervene-lab" data-labid="${lab.id}" style="cursor:pointer; font-size:11.5px;">
          🔬 Cargar en Protoboard
        </button>
      </div>
    </div>
  `).join('');

  matrixEl.querySelectorAll('.btn-intervene-lab').forEach((b) => {
    b.onclick = () => {
      const cid = parseInt(b.dataset.labid, 10);
      selectCircuit(cid);
      const tabEst = document.querySelector('nav button[data-t="est"]');
      if (tabEst) tabEst.click();
    };
  });
}

/* ========================================================
   14. Workspaces & Multiusuario
   ======================================================== */
const WorkspaceManager = {
  currentWorkspace: null,
  workspaces: [],

  async loadUserWorkspaces() {
    try {
      const resp = await fetch('/api/breadboards', {
        headers: Auth.token ? { 'Authorization': `Bearer ${Auth.token}` } : {}
      });
      if (resp.ok) {
        const data = await resp.json();
        this.workspaces = data.breadboards || [];
        this.renderWorkspacesList();
        return;
      }
    } catch (e) {}
  },

  renderWorkspacesList() {
    const listEl = $('#workspaces-list');
    if (!listEl) return;

    if (this.workspaces.length === 0) {
      listEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 20px; text-align: center; opacity: 0.8;">
          No tienes protoboards guardados aún. ¡Crea uno nuevo para comenzar a experimentar!
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.workspaces.map((w) => {
      const isCur = this.currentWorkspace && this.currentWorkspace.id === w.id;
      return `
        <div class="workspace-card ${isCur ? 'active' : ''}" data-wid="${w.id}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b>🔌 ${w.name}</b>
            <span class="badge ${w.hasError ? 'error' : 'success'}">${w.hasError ? 'Con error' : 'Operativo'}</span>
          </div>
          <div style="font-size:12.5px; opacity:0.8; margin:6px 0;">
            Circuito: ${w.circuitIndex + 1} · Pasos: ${w.placedSteps} colocados
          </div>
          <div style="font-size:11.5px; opacity:0.65;">
            Propietario: ${w.ownerName || 'Estudiante'} · Actualizado: ${new Date(w.updatedAt).toLocaleTimeString()}
          </div>
          <div class="row" style="margin-top:8px;">
            <button class="badge p btn-open-ws" data-wid="${w.id}">Abrir en Protoboard</button>
            <button class="badge btn-delete-ws" data-wid="${w.id}" style="color:var(--bad);">Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-open-ws').forEach((btn) => {
      btn.onclick = () => this.openWorkspace(btn.dataset.wid);
    });

    listEl.querySelectorAll('.btn-delete-ws').forEach((btn) => {
      btn.onclick = () => this.deleteWorkspace(btn.dataset.wid);
    });
  },

  openWorkspace(wid) {
    const ws = this.workspaces.find((w) => w.id === wid);
    if (!ws) return;
    this.currentWorkspace = ws;
    S.ci = ws.circuitIndex || 0;
    S.placed = ws.placedSteps || 0;
    S.err = Boolean(ws.hasError);
    if ($('#cs')) $('#cs').value = S.ci;
    render();
    say(`Espacio de trabajo abierto: ${ws.name}`);
    const tabEst = document.querySelector('nav button[data-t="est"]');
    if (tabEst) tabEst.click();
    this.renderWorkspacesList();
  },

  async saveCurrentWorkspace() {
    const curLab = ALL_LABS[S.ci];
    const wsData = {
      id: this.currentWorkspace ? this.currentWorkspace.id : null,
      name: this.currentWorkspace ? this.currentWorkspace.name : (curLab ? curLab.nombre : `Protoboard Lab ${S.ci + 1}`),
      circuitIndex: S.ci,
      placedSteps: S.placed,
      hasError: S.err,
      errorType: S.err ? 'polaridad_led' : null,
      components: cir().slice(0, S.placed),
      roomCode: S.roomId
    };

    try {
      const resp = await fetch('/api/breadboards/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.token}`
        },
        body: JSON.stringify(wsData)
      });
      if (resp.ok) {
        const d = await resp.json();
        this.currentWorkspace = d.breadboard;
        say('Protoboard guardado exitosamente en la nube.', 2);
        this.loadUserWorkspaces();
        return;
      }
    } catch (e) {}
  },

  async deleteWorkspace(wid) {
    if (!confirm('¿Deseas eliminar este protoboard independiente?')) return;
    try {
      await fetch('/api/breadboards/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.token}`
        },
        body: JSON.stringify({ id: wid })
      });
    } catch (e) {}
    this.workspaces = this.workspaces.filter((w) => w.id !== wid);
    this.renderWorkspacesList();
    say('Protoboard eliminado.');
  }
};

/* ========================================================
   15. Perfil de Usuario Persistente
   ======================================================== */
const UserProfile = {
  data: {
    id: 'ALU-101',
    alias: 'Estudiante',
    preferencias: { tono: 'empatico', nivel: 'auto', velocidadVoz: 1.0 },
    ritmo: { tiemposPorPaso: [], promedioSeg: 20, clasificacion: 'Constante', ultimoTimestampPaso: Date.now() },
    errores: { polaridad_led: 0, total: 0, porCircuito: {} },
    emociones: { declarada: 'motivado' },
    circuitos: { done: {} }
  },

  load() {
    try {
      const saved = localStorage.getItem('cl.profile_v45');
      if (saved) this.data = Object.assign(this.data, JSON.parse(saved));
    } catch (e) {}
    this.updateUI();
  },

  save() {
    try { localStorage.setItem('cl.profile_v45', JSON.stringify(this.data)); } catch (e) {}
    this.updateUI();
  },

  recordStepTime() {
    const now = Date.now();
    const diff = Math.max(2, Math.round((now - this.data.ritmo.ultimoTimestampPaso) / 1000));
    this.data.ritmo.tiemposPorPaso.push(diff);
    this.data.ritmo.ultimoTimestampPaso = now;
    const arr = this.data.ritmo.tiemposPorPaso;
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    this.data.ritmo.promedioSeg = avg;
    this.data.ritmo.clasificacion = avg < 14 ? 'Ágil' : (avg <= 28 ? 'Constante' : 'Pausado');
    this.save();
  },

  recordError(tipo, ci) {
    this.data.errores.total++;
    this.data.errores[tipo] = (this.data.errores[tipo] || 0) + 1;
    this.data.errores.porCircuito[ci] = (this.data.errores.porCircuito[ci] || 0) + 1;
    this.save();
  },

  setDeclaredEmotion(emo) {
    this.data.emociones.declarada = emo;
    this.save();
    MultiUser.broadcastStudentStatus();
  },

  updateUI() {
    $$('#emo-picker .emotion-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.emo === this.data.emociones.declarada);
    });
    if ($('#prf-pace')) $('#prf-pace').textContent = this.data.ritmo.clasificacion;
    if ($('#prf-done')) $('#prf-done').textContent = `${Object.keys(this.data.circuitos.done).length} / 50`;
    if ($('#prf-err-count')) $('#prf-err-count').textContent = `${this.data.errores.total} errores registrados`;
  }
};

/* ========================================================
   16. Centro de Supervisión y Revisión Docente en Vivo
   ======================================================== */
const TeacherSupervisor = {
  selectedStudentId: 'alu-02', // Ana Torres seleccionada inicialmente por tener error
  filter: 'all',
  markedPins: [],
  logs: [
    '09:00:00 [Sala] Sala SALA-ELECTRO-1 inicializada.',
    '09:01:15 [Piero Castillo] Completó Lab 1 (Ley de Ohm).',
    '09:03:40 [Ana Torres] Inició Lab 3 (Red Serie-Paralelo).',
    '09:05:10 [Alerta] Ana Torres cometió un error de polaridad/nodo en R2.',
    '09:06:25 [Lucía Ramos] Solicitó asistencia en Lab 2 (LED con pulsador).'
  ],

  students: [
    {
      id: 'alu-01',
      name: 'Piero Castillo',
      email: 'piero.castillo@uni.edu.pe',
      labIndex: 0,
      labName: 'L1.1 — Ley de Ohm y Análisis Nodal Básico',
      placed: 4,
      totalSteps: 4,
      err: false,
      helpRequested: false,
      emotion: 'confiado',
      pace: 'Constante',
      status: 'completado',
      lastActive: 'Hace 1 min',
      diagnostic: 'Circuito serie completado y validado con precisión del 100%.'
    },
    {
      id: 'alu-02',
      name: 'Ana Torres',
      email: 'ana.torres@uni.edu.pe',
      labIndex: 2,
      labName: 'L1.3 — Red Serie-Paralelo y Leyes de Kirchhoff',
      placed: 2,
      totalSteps: 5,
      err: true,
      helpRequested: false,
      emotion: 'frustrado',
      pace: 'Lento',
      status: 'error',
      lastActive: 'Hace 30s',
      diagnostic: 'Dificultad detectada: Polaridad invertida o nodo no común en el componente R2 (pin 9d).'
    },
    {
      id: 'alu-03',
      name: 'Lucía Ramos',
      email: 'lucia.ramos@uni.edu.pe',
      labIndex: 1,
      labName: 'L1.2 — Circuito LED con Pulsador y Resistencia',
      placed: 3,
      totalSteps: 4,
      err: false,
      helpRequested: true,
      emotion: 'concentrado',
      pace: 'Normal',
      status: 'ayuda',
      lastActive: 'Ahora mismo',
      diagnostic: 'Solicitud de asistencia: Duda sobre conexión del cátodo al riel común m16.'
    },
    {
      id: 'alu-04',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@uni.edu.pe',
      labIndex: 3,
      labName: 'L1.7 — Respuesta Transitoria RC',
      placed: 2,
      totalSteps: 6,
      err: false,
      helpRequested: false,
      emotion: 'motivado',
      pace: 'Rápido',
      status: 'en_progreso',
      lastActive: 'Hace 2 min',
      diagnostic: 'Montando condensador electrolítico en pines 12c-16c.'
    }
  ],

  init() {
    this.renderRoster();
    this.selectStudent(this.selectedStudentId);
    this.setupListeners();
  },

  setupListeners() {
    const fAll = $('#filter-stu-all');
    const fErr = $('#filter-stu-err');
    const fHelp = $('#filter-stu-help');
    if (fAll) fAll.onclick = () => { this.filter = 'all'; this.updateFilterButtons(); this.renderRoster(); };
    if (fErr) fErr.onclick = () => { this.filter = 'err'; this.updateFilterButtons(); this.renderRoster(); };
    if (fHelp) fHelp.onclick = () => { this.filter = 'help'; this.updateFilterButtons(); this.renderRoster(); };

    const btnRefresh = $('#btn-refresh-students');
    if (btnRefresh) btnRefresh.onclick = () => {
      this.renderRoster();
      this.addLog('[Docente] Lista de estudiantes sincronizada.');
    };

    $$('.btn-quick-hint').forEach((btn) => {
      btn.onclick = () => {
        this.sendQuickHint(btn.dataset.hintType);
      };
    });

    const btnSendCustom = $('#btn-send-custom-hint');
    const btnSendVoice = $('#btn-send-voice-nudge');
    const customInp = $('#ins-custom-hint-input');

    if (btnSendCustom && customInp) {
      btnSendCustom.onclick = () => {
        const txt = customInp.value.trim();
        if (txt) {
          this.sendCustomHint(txt);
          customInp.value = '';
        }
      };
      customInp.onkeydown = (e) => {
        if (e.key === 'Enter') btnSendCustom.click();
      };
    }

    if (btnSendVoice && customInp) {
      btnSendVoice.onclick = () => {
        const txt = customInp.value.trim() || 'Atención a tu protoboard: revisa la conexión del componente que estás montando.';
        this.sendVoiceNudge(txt);
        if (customInp.value.trim()) customInp.value = '';
      };
    }

    const btnApprove = $('#btn-approve-lab');
    const btnCorrection = $('#btn-request-correction');
    if (btnApprove) btnApprove.onclick = () => this.approveLab();
    if (btnCorrection) btnCorrection.onclick = () => this.requestCorrection();

    const ib = $('#ib');
    if (ib) {
      ib.onclick = (e) => {
        const r = ib.getBoundingClientRect();
        const x = ((e.clientX - r.left) * 880) / r.width;
        const y = ((e.clientY - r.top) * 380) / r.height;
        this.markCoordinate(x, y);
      };
    }

    const btnClear = $('#clr');
    if (btnClear) {
      btnClear.onclick = () => this.clearMarks();
    }
  },

  updateFilterButtons() {
    const fAll = $('#filter-stu-all');
    const fErr = $('#filter-stu-err');
    const fHelp = $('#filter-stu-help');
    if (fAll) fAll.classList.toggle('p', this.filter === 'all');
    if (fErr) fErr.classList.toggle('p', this.filter === 'err');
    if (fHelp) fHelp.classList.toggle('p', this.filter === 'help');
  },

  getSelectedStudent() {
    return this.students.find((s) => s.id === this.selectedStudentId) || this.students[0];
  },

  selectStudent(id) {
    this.selectedStudentId = id;
    const stu = this.getSelectedStudent();
    if (!stu) return;

    const nameEl = $('#ins-inspect-student-name');
    const labEl = $('#ins-inspect-lab-info');
    const emoEl = $('#ins-inspect-emotion');
    const paceEl = $('#ins-inspect-pace');
    const stateEl = $('#ins-inspect-state-badge');
    const diagBanner = $('#ins-diagnostic-banner');

    if (nameEl) nameEl.textContent = stu.name;
    if (labEl) labEl.textContent = `Laboratorio: ${stu.labName} · Paso ${stu.placed} de ${stu.totalSteps}`;
    if (emoEl) emoEl.textContent = `Ánimo: ${stu.emotion || 'Normal'}`;
    if (paceEl) paceEl.textContent = `Ritmo: ${stu.pace || 'Constante'}`;

    if (stateEl) {
      if (stu.status === 'error' || stu.err) {
        stateEl.style.background = 'rgba(239,68,68,0.2)';
        stateEl.style.color = '#ef4444';
        stateEl.style.borderColor = '#ef4444';
        stateEl.textContent = '⚠ Error Detectado';
      } else if (stu.status === 'ayuda' || stu.helpRequested) {
        stateEl.style.background = 'rgba(245,158,11,0.2)';
        stateEl.style.color = '#f59e0b';
        stateEl.style.borderColor = '#f59e0b';
        stateEl.textContent = '🙋 Pide Ayuda';
      } else if (stu.status === 'completado') {
        stateEl.style.background = 'rgba(16,185,129,0.2)';
        stateEl.style.color = '#10b981';
        stateEl.style.borderColor = '#10b981';
        stateEl.textContent = '✔ Completado';
      } else {
        stateEl.style.background = 'rgba(59,130,246,0.2)';
        stateEl.style.color = '#3b82f6';
        stateEl.style.borderColor = '#3b82f6';
        stateEl.textContent = '⚡ En Progreso';
      }
    }

    if (diagBanner) {
      if (stu.diagnostic) {
        diagBanner.style.display = 'block';
        diagBanner.innerHTML = (stu.err ? '⚠ ' : (stu.helpRequested ? '🙋 ' : 'ℹ ')) + `<b>Diagnóstico:</b> ${stu.diagnostic}`;
        if (stu.err) {
          diagBanner.style.background = 'rgba(239,68,68,0.1)';
          diagBanner.style.color = '#f87171';
          diagBanner.style.borderColor = 'rgba(239,68,68,0.3)';
        } else if (stu.helpRequested) {
          diagBanner.style.background = 'rgba(245,158,11,0.1)';
          diagBanner.style.color = '#fbbf24';
          diagBanner.style.borderColor = 'rgba(245,158,11,0.3)';
        } else {
          diagBanner.style.background = 'rgba(16,185,129,0.1)';
          diagBanner.style.color = '#34d399';
          diagBanner.style.borderColor = 'rgba(16,185,129,0.3)';
        }
      } else {
        diagBanner.style.display = 'none';
      }
    }

    this.renderRoster();
    this.drawSelectedStudentBoard();
  },

  renderRoster() {
    const rosterEl = $('#ins-student-roster');
    if (!rosterEl) return;

    let filtered = this.students;
    if (this.filter === 'err') filtered = this.students.filter((s) => s.err || s.status === 'error');
    else if (this.filter === 'help') filtered = this.students.filter((s) => s.helpRequested || s.status === 'ayuda');

    const countEl = $('#ins-students-count');
    if (countEl) countEl.textContent = `Alumnos: ${this.students.length}`;

    rosterEl.innerHTML = filtered.map((st) => {
      const isSelected = st.id === this.selectedStudentId;
      let badgeHtml = '<span class="badge" style="font-size:11px;">En progreso</span>';
      let borderCol = 'var(--bd)';

      if (st.err || st.status === 'error') {
        badgeHtml = '<span class="badge" style="background:#ef4444; color:#fff; font-size:11px;">⚠ Error</span>';
        borderCol = '#ef4444';
      } else if (st.helpRequested || st.status === 'ayuda') {
        badgeHtml = '<span class="badge" style="background:#f59e0b; color:#111; font-size:11px;">🙋 Pide Ayuda</span>';
        borderCol = '#f59e0b';
      } else if (st.status === 'completado') {
        badgeHtml = '<span class="badge success" style="font-size:11px;">✔ Listo</span>';
        borderCol = '#10b981';
      }

      return `
        <div class="student-item-card ${isSelected ? 'selected' : ''}" data-student-id="${st.id}"
             style="background:var(--bb); border:1.5px solid ${isSelected ? 'var(--bd-focus)' : borderCol}; padding:10px; border-radius:8px; cursor:pointer; transition:all 0.2s;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:700; font-size:13.5px; color:${isSelected ? 'var(--bd-focus)' : 'var(--fg)'};">${st.name}</div>
            ${badgeHtml}
          </div>
          <div style="font-size:12px; opacity:0.8; margin-top:3px;">
            ${(st.labName || 'Lab').split('—')[0].trim()} · Paso ${st.placed}/${st.totalSteps}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:11.5px; opacity:0.75;">
            <span>Ánimo: ${st.emotion || 'Normal'}</span>
            <span>${st.lastActive || 'Activo'}</span>
          </div>
        </div>
      `;
    }).join('');

    $$('#ins-student-roster .student-item-card').forEach((card) => {
      card.onclick = () => {
        this.selectStudent(card.dataset.studentId);
      };
    });
  },

  drawSelectedStudentBoard(targetEl) {
    const el = targetEl || $('#ib');
    if (!el) return;

    const stu = this.getSelectedStudent();
    if (!stu) return;

    const lab = ALL_LABS[stu.labIndex] || ALL_LABS[0];
    const steps = lab.pasos ? lab.pasos.map((p) => {
      if (p.type === 'wire') return W(p.color, p.de, p.a, p.etiqueta);
      if (p.type === 'res') return Rz(p.valor, p.de, p.a, p.etiqueta);
      if (p.type === 'led') return L(p.color, p.de, p.a, p.etiqueta);
      if (p.type === 'btn') return B(p.de, p.a, p.etiqueta);
      if (p.type === 'cap') return Cap(p.valor, p.de, p.a, p.etiqueta);
      if (p.type === 'diode') return Dio(p.t, p.de, p.a, p.etiqueta);
      if (p.type === 'ic') return IC(p.n, p.de, p.a, p.etiqueta);
      if (p.type === 'trans') return Tr(p.t, p.de, p.a, p.etiqueta);
      return W('#888', p.de || '1a', p.a || '2a', p.etiqueta);
    }) : [];

    let h = '<rect width="880" height="380" fill="#1e293b" rx="10"/>';
    for (let c = 1; c <= 30; c++) {
      for (const p of ['p' + c, 'm' + c]) {
        const [x, y] = xy(p);
        h += `<circle cx="${x}" cy="${y}" r="3.5" fill="${p[0] === 'p' ? '#ef4444' : '#3b82f6'}"/>`;
      }
      for (const r of 'abcdefghij') {
        const [x, y] = xy(c + r);
        h += `<circle cx="${x}" cy="${y}" r="3.5" fill="#0f172a"/>`;
      }
    }
    h += `<text x="12" y="34" fill="#ef4444" font-size="14" font-weight="bold">+</text><text x="12" y="58" fill="#3b82f6" font-size="14" font-weight="bold">−</text>`;

    steps.forEach((s, i) => {
      if (i < stu.placed) {
        const isErrorStep = (stu.err && i === stu.placed - 1);
        if (isErrorStep) {
          const [ax, ay] = xy(s.a);
          const [bx, by] = xy(s.b);
          h += comp(s, 0);
          h += `<circle cx="${ax}" cy="${ay}" r="16" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" stroke-width="3" stroke-dasharray="4,2"/>`;
          h += `<circle cx="${bx}" cy="${by}" r="16" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" stroke-width="3" stroke-dasharray="4,2"/>`;
          h += `<text x="${(ax + bx) / 2}" y="${(ay + by) / 2 - 12}" fill="#ef4444" font-size="12" font-weight="bold" text-anchor="middle">⚠ Error Aquí</text>`;
        } else {
          h += comp(s, 0);
        }
      }
    });

    if (stu.placed < steps.length && !stu.err) {
      const s = steps[stu.placed];
      h += comp(s, 1);
      for (const p of [s.a, s.b]) {
        const [x, y] = xy(p);
        h += `<circle class="ring" cx="${x}" cy="${y}" r="12" fill="none" stroke="#10b981" stroke-width="3.5" stroke-dasharray="3,3"/>`;
      }
    }

    this.markedPins.forEach((a) => {
      h += `<circle cx="${a.x}" cy="${a.y}" r="18" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" stroke-width="3.5"/>`;
      h += `<circle cx="${a.x}" cy="${a.y}" r="5" fill="#ef4444"/>`;
      if (a.label) {
        h += `<text x="${a.x}" y="${a.y - 12}" fill="#ef4444" font-size="11" font-weight="bold" text-anchor="middle">${a.label}</text>`;
      }
    });

    el.innerHTML = h;
  },

  sendQuickHint(type) {
    const stu = this.getSelectedStudent();
    if (!stu) return;

    let hintTitle = 'Pista Pedagógica';
    let hintText = '';

    if (type === 'polarity') {
      hintTitle = '⚡ Pista de Polaridad';
      hintText = 'Revisa la polaridad del componente: el terminal negativo (cátodo o pata corta) debe ir hacia la línea de menor potencial (tierra/m).';
    } else if (type === 'pin') {
      hintTitle = '📌 Pista de Pines y Contacto';
      hintText = 'Recuerda que los 5 orificios de la misma fila (letras a-e o f-j) están interconectados internamente. Comprueba que no estén en filas distintas.';
    } else if (type === 'resistance') {
      hintTitle = '🔢 Pista de Valor de Resistencia';
      hintText = 'Verifica el código de colores de tu resistencia: Rojo-Rojo-Marrón es 220 Ω, Naranja-Naranja-Marrón es 330 Ω y Marrón-Negro-Rojo es 1 kΩ.';
    } else if (type === 'step') {
      hintTitle = '➔ Pista de Siguiente Paso';
      hintText = 'Para completar el lazo eléctrico de Kirchhoff, asegúrate de conectar el terminal de retorno hacia el riel azul negativo (GND).';
    }

    this.dispatchMessageToStudent(stu, {
      t: 'teacher_hint',
      title: hintTitle,
      text: hintText,
      teacherName: Auth.user ? Auth.user.name : 'Docente'
    });

    this.addLog(`[Pista a ${stu.name}] ${hintTitle}: «${hintText.substring(0, 45)}...»`);
    this.showActionFeedback(`✅ Pista enviada a ${stu.name}`);
    say(`Pista enviada a ${stu.name}`);
  },

  sendCustomHint(text) {
    const stu = this.getSelectedStudent();
    if (!stu) return;

    this.dispatchMessageToStudent(stu, {
      t: 'teacher_hint',
      title: `Mensaje de ${Auth.user ? Auth.user.name : 'Docente'}`,
      text: text,
      teacherName: Auth.user ? Auth.user.name : 'Docente'
    });

    this.addLog(`[Mensaje a ${stu.name}] «${text}»`);
    this.showActionFeedback(`✅ Mensaje enviado a ${stu.name}`);
    say(`Mensaje enviado a ${stu.name}`);
  },

  sendVoiceNudge(text) {
    const stu = this.getSelectedStudent();
    if (!stu) return;

    this.dispatchMessageToStudent(stu, {
      t: 'teacher_voice',
      text: text,
      teacherName: Auth.user ? Auth.user.name : 'Docente'
    });

    this.addLog(`[Voz a ${stu.name}] 📢 «${text}»`);
    this.showActionFeedback(`📢 Alerta de voz emitida a ${stu.name}`);
    say(`Alerta de voz emitida a ${stu.name}`);
  },

  approveLab() {
    const stu = this.getSelectedStudent();
    if (!stu) return;

    stu.status = 'completado';
    stu.err = false;
    stu.helpRequested = false;
    stu.diagnostic = 'Laboratorio aprobado y calificado con nota sobresaliente por el docente.';

    this.dispatchMessageToStudent(stu, {
      t: 'teacher_eval',
      status: 'aprobado',
      message: '¡Excelente trabajo! El docente ha revisado y aprobado satisfactoriamente tu montaje.',
      teacherName: Auth.user ? Auth.user.name : 'Docente'
    });

    this.addLog(`[Evaluación] ✅ ${stu.name} aprobado por ${Auth.user ? Auth.user.name : 'Docente'}.`);
    this.showActionFeedback(`✅ Laboratorio aprobado para ${stu.name}`);
    say(`Laboratorio de ${stu.name} aprobado.`);
    this.selectStudent(stu.id);
  },

  requestCorrection() {
    const stu = this.getSelectedStudent();
    if (!stu) return;

    stu.status = 'error';
    stu.err = true;
    stu.diagnostic = 'El docente solicitó revisar la polaridad y conexiones de pines del circuito.';

    this.dispatchMessageToStudent(stu, {
      t: 'teacher_eval',
      status: 'correccion',
      message: 'El docente ha revisado tu protoboard y solicita corregir el montaje antes de energizar.',
      teacherName: Auth.user ? Auth.user.name : 'Docente'
    });

    this.addLog(`[Evaluación] 🔄 Corrección solicitada a ${stu.name}.`);
    this.showActionFeedback(`🔄 Solicitud de corrección enviada a ${stu.name}`);
    say(`Corrección solicitada a ${stu.name}.`);
    this.selectStudent(stu.id);
  },

  markCoordinate(x, y) {
    const stu = this.getSelectedStudent();
    this.markedPins.push({ x, y, label: `P${this.markedPins.length + 1}` });
    this.drawSelectedStudentBoard();

    if (stu) {
      this.dispatchMessageToStudent(stu, {
        t: 'teacher_pin_mark',
        x,
        y,
        label: `Docente: Pin P${this.markedPins.length}`
      });
      this.addLog(`[Marca] Pin marcado en (${Math.round(x)}, ${Math.round(y)}) para ${stu.name}.`);
      this.showActionFeedback(`📌 Pin marcado en protoboard de ${stu.name}`);
    }
  },

  clearMarks() {
    this.markedPins = [];
    this.drawSelectedStudentBoard();
    const stu = this.getSelectedStudent();
    if (stu) {
      this.dispatchMessageToStudent(stu, { t: 'clear' });
      this.addLog(`[Marca] Se borraron las anotaciones para ${stu.name}.`);
      this.showActionFeedback(`🧹 Marcas eliminadas`);
    }
  },

  dispatchMessageToStudent(stu, payload) {
    payload.targetStudentId = stu.id;
    if (MultiUser.channel) {
      try { MultiUser.channel.postMessage(payload); } catch (e) {}
    }
    if (payload.t === 'teacher_hint' || payload.t === 'teacher_eval') {
      const banner = $('#teacher-notification-banner');
      const bTitle = $('#teacher-banner-title');
      const bText = $('#teacher-banner-text');
      if (banner && bTitle && bText) {
        bTitle.textContent = payload.title || 'Mensaje del Docente';
        bText.textContent = payload.text || payload.message || '';
        banner.style.display = 'flex';
      }
    }
  },

  addLog(entry) {
    const time = new Date().toLocaleTimeString();
    this.logs.unshift(`${time} ${entry}`);
    if (this.logs.length > 30) this.logs.pop();
    const logEl = $('#ins-interaction-log');
    if (logEl) {
      logEl.innerHTML = this.logs.map((l) => `<div>${l}</div>`).join('');
    }
  },

  showActionFeedback(msg) {
    const fb = $('#ins-action-feedback');
    if (fb) {
      fb.textContent = msg;
      setTimeout(() => { if (fb.textContent === msg) fb.textContent = ''; }, 3500);
    }
  }
};

/* ========================================================
   16.1. Colaboración y Sincronización en Tiempo Real
   ======================================================== */
const MultiUser = {
  channel: null,
  activeStudents: new Map(),

  init() {
    this.joinRoom(S.roomId);
  },

  joinRoom(roomId) {
    S.roomId = roomId;
    if ($('#room-pill')) $('#room-pill').textContent = 'Sala: ' + roomId;
    if ($('#ins-room-indicator')) $('#ins-room-indicator').textContent = '🔴 Sala: ' + roomId;
    try {
      this.channel = new BroadcastChannel('circuitlens_' + roomId);
      this.channel.onmessage = (event) => this.handleMessage(event.data);
    } catch (e) {}
    this.broadcastStudentStatus();
  },

  handleMessage(msg) {
    if (!msg || !msg.t) return;
    if (msg.t === 'student_update') {
      this.activeStudents.set(msg.studentId, msg);
      if (typeof TeacherSupervisor !== 'undefined') {
        const existing = TeacherSupervisor.students.find((s) => s.id === msg.studentId);
        if (existing) {
          existing.labIndex = msg.ci;
          existing.placed = msg.placed;
          existing.err = msg.err;
          existing.emotion = msg.emotion;
          existing.pace = msg.pace;
          existing.lastActive = 'Ahora mismo';
          if (msg.err) existing.status = 'error';
          else if (existing.status === 'error') existing.status = 'en_progreso';
        } else {
          TeacherSupervisor.students.push({
            id: msg.studentId,
            name: msg.studentName,
            labIndex: msg.ci,
            labName: (ALL_LABS[msg.ci] ? ALL_LABS[msg.ci].nombre : `Lab ${msg.ci + 1}`),
            placed: msg.placed,
            totalSteps: (ALL_LABS[msg.ci] && ALL_LABS[msg.ci].pasos) ? ALL_LABS[msg.ci].pasos.length : 4,
            err: msg.err,
            emotion: msg.emotion,
            pace: msg.pace,
            status: msg.err ? 'error' : 'en_progreso',
            lastActive: 'Ahora mismo',
            diagnostic: msg.err ? 'Error de polaridad simulado detectado.' : 'Montaje en curso.'
          });
        }
        TeacherSupervisor.renderRoster();
        if (TeacherSupervisor.selectedStudentId === msg.studentId) {
          TeacherSupervisor.selectStudent(msg.studentId);
        }
      }
    } else if (msg.t === 'help_request') {
      if (typeof TeacherSupervisor !== 'undefined') {
        const existing = TeacherSupervisor.students.find((s) => s.id === msg.studentId);
        if (existing) {
          existing.helpRequested = true;
          existing.status = 'ayuda';
          existing.diagnostic = `Solicitó asistencia en vivo en paso ${msg.ci + 1}.`;
        }
        TeacherSupervisor.renderRoster();
        TeacherSupervisor.addLog(`[ALERTA] ${msg.studentName} ha solicitado asistencia urgente.`);
      }
      say(`El alumno ${msg.studentName} ha solicitado asistencia.`, 1);
    } else if (msg.t === 'teacher_hint') {
      const banner = $('#teacher-notification-banner');
      const bTitle = $('#teacher-banner-title');
      const bText = $('#teacher-banner-text');
      if (banner && bTitle && bText) {
        bTitle.textContent = msg.title || 'Pista del Docente';
        bText.textContent = msg.text || '';
        banner.style.display = 'flex';
      }
      say(`Pista del docente: ${msg.text}`);
      HapticEngine.trigger('success');
    } else if (msg.t === 'teacher_voice') {
      const banner = $('#teacher-notification-banner');
      const bTitle = $('#teacher-banner-title');
      const bText = $('#teacher-banner-text');
      if (banner && bTitle && bText) {
        bTitle.textContent = `📢 Alerta de Voz de ${msg.teacherName || 'Docente'}`;
        bText.textContent = msg.text;
        banner.style.display = 'flex';
      }
      say(`Atención de tu docente: ${msg.text}`);
      HapticEngine.trigger('warning');
    } else if (msg.t === 'teacher_pin_mark') {
      ANN.push({ x: msg.x, y: msg.y });
      render();
      say('El docente ha señalado un pin en tu protoboard.', 1);
    } else if (msg.t === 'teacher_eval') {
      const banner = $('#teacher-notification-banner');
      const bTitle = $('#teacher-banner-title');
      const bText = $('#teacher-banner-text');
      if (banner && bTitle && bText) {
        bTitle.textContent = msg.status === 'aprobado' ? '✅ ¡Laboratorio Aprobado!' : '🔄 Corrección Requerida por Docente';
        bText.textContent = msg.message;
        banner.style.display = 'flex';
      }
      if (msg.status === 'aprobado') {
        celebrate();
        say('¡Felicitaciones! Tu docente ha aprobado tu montaje.', 2);
      } else {
        say('Tu docente solicita que revises y corrijas el montaje.', 1);
      }
    } else if (msg.t === 'draw') {
      ANN.push({ x: msg.x, y: msg.y });
      render();
    } else if (msg.t === 'clear') {
      ANN = [];
      render();
    }
  },

  broadcastStudentStatus() {
    if (Auth.user && Auth.user.role === 'teacher') return;
    const payload = {
      t: 'student_update',
      studentId: Auth.user ? Auth.user.id : 'ALU-101',
      studentName: Auth.user ? Auth.user.name : 'Estudiante',
      ci: S.ci,
      placed: S.placed,
      err: S.err,
      emotion: UserProfile.data.emociones.declarada,
      pace: UserProfile.data.ritmo.clasificacion,
      timestamp: Date.now()
    };
    if (this.channel) {
      try { this.channel.postMessage(payload); } catch (e) {}
    }
    this.activeStudents.set(payload.studentId, payload);
  }
};

/* ========================================================
   17. Confeti
   ======================================================== */
function celebrate() {
  const c = $('#conf');
  if (!c || O('o-c') || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const g = c.getContext('2d');
  c.width = window.innerWidth;
  c.height = window.innerHeight;

  const ps = Array.from({ length: 120 }, () => ({
    x: Math.random() * c.width,
    y: -20,
    vy: 2 + Math.random() * 4,
    vx: Math.random() * 4 - 2,
    c: `hsl(${Math.random() * 360},90%,60%)`
  }));

  let f = 0;
  (function t() {
    g.clearRect(0, 0, c.width, c.height);
    ps.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      g.fillStyle = p.c;
      g.fillRect(p.x, p.y, 8, 12);
    });
    if (++f < 120) requestAnimationFrame(t);
    else g.clearRect(0, 0, c.width, c.height);
  })();
}

/* ========================================================
   18. Inicialización del DOM
   ======================================================== */
window.addEventListener('DOMContentLoaded', async () => {
  populateCurriculumUI();
  render();
  Channels.init();
  AudioManager.init();
  BreadboardCAD.init();
  await Auth.init();
  UserProfile.load();
  await loadCurriculum();
  MultiUser.init();
  TeacherSupervisor.init();
  WorkspaceManager.loadUserWorkspaces();

  // Banner de notificación del docente
  const btnDismissTeacherBanner = $('#teacher-banner-dismiss');
  if (btnDismissTeacherBanner) {
    btnDismissTeacherBanner.onclick = () => {
      const banner = $('#teacher-notification-banner');
      if (banner) banner.style.display = 'none';
    };
  }

  // Teclado & Switch Access
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!e.target.closest('button')) { e.preventDefault(); next(); }
      } else if (e.key === 'r' || e.key === 'R') {
        diagnose();
      } else if (e.key === 'v' || e.key === 'V') {
        $('#mic').click();
      }
    }
  });

  // Action Buttons
  $('#nx').onclick = next;
  $('#rv').onclick = () => { userLog('Revisa mi circuito'); diagnose(); };

  $('#er').onclick = () => {
    S.err = !S.err;
    render();
    if (S.err) {
      UserProfile.recordError('polaridad_led', S.ci);
      say('Simulando polaridad invertida en el componente. Consulta al AI Tutor.', 1);
    } else {
      say('Polaridad normal restablecida.');
    }
    MultiUser.broadcastStudentStatus();
  };

  $('#btn-save-workspace').onclick = () => WorkspaceManager.saveCurrentWorkspace();
  $('#btn-new-workspace').onclick = () => {
    WorkspaceManager.currentWorkspace = null;
    S.placed = 0;
    S.err = false;
    render();
    say('Nuevo protoboard listo para montar.');
  };
  $('#btn-create-workspace-tab').onclick = () => {
    $('#btn-new-workspace').click();
    document.querySelector('nav button[data-t="est"]').click();
  };
  $('#btn-refresh-workspaces').onclick = () => WorkspaceManager.loadUserWorkspaces();

  $('#ask-help').onclick = () => {
    if (MultiUser.channel) {
      MultiUser.channel.postMessage({
        t: 'help_request',
        studentId: Auth.user.id,
        studentName: Auth.user.name,
        ci: S.ci,
        timestamp: Date.now()
      });
    }
    say('Notificación de ayuda enviada al docente.', 0);
    HapticEngine.trigger('help');
  };

  const reflBtn = $('#refl-btn-next');
  if (reflBtn) {
    reflBtn.onclick = () => {
      if (S.ci < CIR.length - 1) selectCircuit(S.ci + 1);
      else say('¡Completaste todos los laboratorios universitarios!', 2);
    };
  }

  // Cámara AR
  $('#cam').onclick = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = $('#vid');
      v.srcObject = s;
      v.hidden = false;
      v.play();
      $('#bd').style.opacity = 0.9;
      say('Cámara AR conectada.');
    } catch (e) {
      say('No se detectó cámara física; se mantiene el protoboard CAD.');
    }
  };

  // Clic directo en pines del protoboard CAD
  $('#bd').onclick = (e) => {
    if (e.target.classList && e.target.classList.contains('ring')) {
      next();
    }
  };

  // Reconocimiento de Voz
  $('#mic').onclick = () => {
    const mic = $('#mic');
    mic.classList.add('on');
    mic.setAttribute('aria-pressed', 'true');
    listen(false);
  };

  // Enviar texto
  $('#sd').onclick = () => {
    const valText = $('#tx').value.trim();
    if (valText) { handleVoiceCommand(valText); $('#tx').value = ''; }
  };
  $('#tx').onkeydown = (e) => { if (e.key === 'Enter') $('#sd').click(); };

  // Emociones
  $$('#emo-picker .emotion-btn').forEach((btn) => {
    btn.onclick = () => {
      UserProfile.setDeclaredEmotion(btn.dataset.emo);
      say(`Estado anímico: ${btn.textContent.trim()}`);
    };
  });

  // Filtros de currículo por nivel
  $$('#curriculum-level-filters button').forEach((btn) => {
    btn.onclick = () => {
      $$('#curriculum-level-filters button').forEach((b) => b.classList.remove('p'));
      btn.classList.add('p');
      renderCurriculumGrid(btn.dataset.filterLvl, currentCurriculumFilterCplx);
    };
  });

  // Filtros de currículo por complejidad
  $$('#curriculum-complexity-filters button').forEach((btn) => {
    btn.onclick = () => {
      $$('#curriculum-complexity-filters button').forEach((b) => b.classList.remove('p'));
      btn.classList.add('p');
      renderCurriculumGrid(currentCurriculumFilterLvl, btn.dataset.filterCplx);
    };
  });

  // Navegación de pestañas
  $$('nav button').forEach((b) => {
    b.onclick = () => {
      $$('nav button').forEach((x) => x.setAttribute('aria-selected', x === b));
      $$('.tab').forEach((t) => t.classList.toggle('on', t.id === b.dataset.t));
      if (b.dataset.t === 'workspaces') WorkspaceManager.loadUserWorkspaces();
      if (b.dataset.t === 'teacher-settings') TeacherSettings.loadConfig();
      if (b.dataset.t === 'ins' && typeof TeacherSupervisor !== 'undefined') {
        TeacherSupervisor.renderRoster();
        TeacherSupervisor.drawSelectedStudentBoard();
      }
      if (b.dataset.t === 'est') setTimeout(() => BreadboardCAD.resetView(), 50);
    };
  });

  // Teacher AI settings UI
  if ($('#teacher-ai-provider')) {
    $('#teacher-ai-provider').onchange = () => TeacherSettings.updateVisibility();
  }
  if ($('#btn-save-teacher-ai')) {
    $('#btn-save-teacher-ai').onclick = () => TeacherSettings.saveConfig();
  }
  if ($('#btn-test-teacher-ai')) {
    $('#btn-test-teacher-ai').onclick = () => TeacherSettings.testConnection();
  }

  // Los eventos de supervisión docente (pizarra, pistas y evaluación) se gestionan en TeacherSupervisor.setupListeners()

  // Accesibilidad
  $('#o-h').onchange = (e) => document.body.classList.toggle('hc', e.target.checked);
  $('#o-c').onchange = (e) => document.body.classList.toggle('calm', e.target.checked);
  $('#o-d').onchange = () => {
    render();
    say(O('o-d') ? 'Modo daltonismo activo.' : 'Modo daltonismo desactivado.');
  };
  $('#o-f').onchange = (e) => {
    hands = e.target.checked;
    if (hands) { say('Modo manos libres continuo activo.'); listen(true); }
    else { try { rec.stop(); } catch (x) {} }
  };

  // Demo Guiada
  $('#demo').onclick = async () => {
    say('Iniciando simulación guiada para evaluación.');
    selectCircuit(0);
    await sleep(1000);
    next();
    await sleep(900);
    next();
    await sleep(900);
    S.err = true;
    render();
    say('Simulando polaridad invertida en el diodo.');
    await sleep(1000);
    await diagnose();
    await sleep(2000);
    S.err = false;
    render();
    say('Corrigiendo polaridad.');
    next();
    await sleep(900);
    await diagnose();
  };

  render();
});
