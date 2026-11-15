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

  async login(email, password, role) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        this.user = data.user;
        this.token = data.token;
        localStorage.setItem('cl.auth_token', this.token);
        localStorage.setItem('cl.auth_user', JSON.stringify(this.user));
        this.applyRolePermissions();
        say(`Bienvenido ${this.user.name}. Sesión iniciada.`);
        return { ok: true };
      } else {
        return { ok: false, error: data.detail || 'Error de autenticación' };
      }
    } catch (e) {
      return { ok: false, error: 'No se pudo conectar con el servidor backend' };
    }
  },

  applyRolePermissions() {
    const isDoc = (this.user.role === 'teacher');
    const badge = $('#user-badge');
    if (badge) {
      badge.innerHTML = `${this.user.avatar || '🎓'} ${this.user.name} <small style="opacity:0.75; font-size:11px;">(${isDoc ? 'Docente' : 'Estudiante'})</small>`;
      badge.style.borderColor = isDoc ? 'var(--ac2)' : 'var(--ac)';
    }

    $$('nav button').forEach((btn) => {
      const tabId = btn.dataset.t;
      if (isDoc) {
        btn.style.display = 'inline-flex';
      } else {
        if (tabId === 'ins' || tabId === 'teacher-settings' || tabId === 'interviews') {
          btn.style.display = 'none';
        } else {
          btn.style.display = 'inline-flex';
        }
      }
    });

    if (isDoc) {
      TeacherSettings.loadConfig();
    }
  },

  setupUI() {
    const btnSwitch = $('#btn-switch-account');
    const modal = $('#modal-auth');
    const btnClose = $('#btn-close-auth-modal');
    const btnSubmit = $('#btn-login-submit');

    if (btnSwitch && modal) btnSwitch.onclick = () => { modal.style.display = 'flex'; };
    if (btnClose && modal) btnClose.onclick = () => { modal.style.display = 'none'; };

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
  220: ['Rojo', 'Rojo', 'Marrón', ['#d22', '#d22', '#852']],
  330: ['Naranja', 'Naranja', 'Marrón', ['#f80', '#f80', '#852']],
  1000: ['Marrón', 'Negro', 'Rojo', ['#852', '#111', '#d22']],
  2200: ['Rojo', 'Rojo', 'Rojo', ['#d22', '#d22', '#d22']]
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

let CIR = [
  [
    'L1.1 — Ley de Ohm y Análisis Nodal Básico',
    [
      W('#d22', 'p3', '6a', 'Vcc 5V -> nodo 1'),
      Rz(330, '6b', '10b', 'R1 (330 Ω) limitadora'),
      Rz(1000, '10c', '14c', 'R2 (1 kΩ) a nodo 2'),
      W('#111', '14e', 'm14', 'GND de referencia')
    ],
    'Comprobar la Ley de Ohm y el método de voltajes nodales en redes resistivas.'
  ]
];
let ALL_LABS = [
  {
    id: 0,
    nivel: 1,
    nivelNombre: 'Nivel 1 — Análisis Avanzado de Circuitos',
    laboratorioNumero: 1,
    nombre: 'L1.1 — Ley de Ohm y Análisis Nodal Básico',
    objetivos: 'Comprobar la Ley de Ohm y el método de voltajes nodales en redes resistivas.',
    ecuaciones: 'I = V/R, sum(I_k) = 0',
    descripcion: 'Comprobar la Ley de Ohm y el método de voltajes nodales en redes resistivas.',
    medicionesEsperadas: 'V_nodo2 = 3.76 V, I_total = 3.76 mA',
    diagnosticoResolucion: 'Si el voltaje en nodo 2 es 0V, verifique falso contacto en pin 10c.',
    pasos: [
      { type: 'wire', color: '#d22', de: 'p3', a: '6a', etiqueta: 'Vcc 5V -> nodo 1' },
      { type: 'res', valor: 330, de: '6b', a: '10b', etiqueta: 'R1 (330 Ω)' },
      { type: 'res', valor: 1000, de: '10c', a: '14c', etiqueta: 'R2 (1 kΩ) a nodo 2' },
      { type: 'wire', color: '#111', de: '14e', a: 'm14', etiqueta: 'GND de referencia' }
    ]
  }
];

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
  draw($('#ib'), true);

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
   13. Carga de Currículo (50 Laboratorios)
   ======================================================== */
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
        if (p.type === 'wire') return W(p.color, p.de, p.a, p.etiqueta);
        if (p.type === 'res') return Rz(p.valor, p.de, p.a, p.etiqueta);
        if (p.type === 'led') return L(p.color, p.de, p.a, p.etiqueta);
        if (p.type === 'btn') return B(p.de, p.a, p.etiqueta);
        return W('#d22', p.de, p.a, p.etiqueta);
      });
      return [lab.nombre, components, lab.descripcion];
    });
  }

  const cs = $('#cs');
  if (cs) {
    cs.innerHTML = CIR.map((c, i) => `<option value="${i}">${c[0]}</option>`).join('');
    cs.onchange = (e) => selectCircuit(+e.target.value);
  }

  renderCurriculumGrid('all');
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

function renderCurriculumGrid(filterLvl) {
  const grid = $('#curriculum-grid');
  if (!grid) return;

  const labsToRender = ALL_LABS.filter((l) => filterLvl === 'all' || l.nivel === parseInt(filterLvl, 10));

  grid.innerHTML = labsToRender.map((lab) => `
    <div class="card" style="margin:0; background:var(--bb);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="badge success">Nivel ${lab.nivel}</span>
        <span style="font-size:12px; opacity:0.8;">Lab #${lab.laboratorioNumero}</span>
      </div>
      <h3 style="margin:8px 0 4px; font-size:15px;">${lab.nombre}</h3>
      <p style="font-size:12.5px; opacity:0.85; margin:4px 0 8px;">${lab.objetivos}</p>
      <div style="font-size:11.5px; color:var(--bd-focus); margin-bottom:8px;">
        📐 <code>${lab.ecuaciones}</code>
      </div>
      <div class="row" style="margin-top:auto;">
        <button class="badge p btn-launch-lab" data-cid="${lab.id}">Cargar en Protoboard</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.btn-launch-lab').forEach((btn) => {
    btn.onclick = () => {
      selectCircuit(parseInt(btn.dataset.cid, 10));
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
   16. Colaboración Docente-Alumno en Tiempo Real
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
      this.renderStudents();
    } else if (msg.t === 'draw') {
      ANN.push({ x: msg.x, y: msg.y });
      render();
      say('El docente marcó una anotación en tu protoboard.', 1);
    } else if (msg.t === 'clear') {
      ANN = [];
      render();
    } else if (msg.t === 'teacher_nudge') {
      say(`Mensaje de tu instructor: «${msg.text}»`, 0);
    } else if (msg.t === 'help_request') {
      say(`El alumno ${msg.studentName} ha solicitado asistencia.`, 1);
    }
  },

  broadcastStudentStatus() {
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
    this.renderStudents();
  },

  renderStudents() {
    const grid = $('#student-grid');
    if (!grid) return;
    const countBadge = $('#ins-students-count');
    if (countBadge) countBadge.textContent = `Alumnos: ${this.activeStudents.size}`;

    grid.innerHTML = Array.from(this.activeStudents.values()).map((st) => `
      <div class="card" style="margin:0; background:var(--bb); border-color:${st.err ? 'var(--bad)' : 'var(--bd)'};">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b>${st.studentName}</b>
          <span>${st.emotion || '😊'}</span>
        </div>
        <div style="font-size:12px; opacity:0.8; margin-top:4px;">
          Lab: ${st.ci + 1} · Paso ${st.placed + 1}
        </div>
        <div style="font-size:11.5px; color:${st.err ? 'var(--bad)' : 'var(--good)'}; margin-top:2px;">
          ${st.err ? 'Error polaridad ⚠' : 'En progreso ✔'} (${st.pace || 'Normal'})
        </div>
      </div>
    `).join('');
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
  WorkspaceManager.loadUserWorkspaces();

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

  // Filtros de currículo
  $$('#curriculum-level-filters button').forEach((btn) => {
    btn.onclick = () => {
      $$('#curriculum-level-filters button').forEach((b) => b.classList.remove('p'));
      btn.classList.add('p');
      renderCurriculumGrid(btn.dataset.filterLvl);
    };
  });

  // Navegación de pestañas
  $$('nav button').forEach((b) => {
    b.onclick = () => {
      $$('nav button').forEach((x) => x.setAttribute('aria-selected', x === b));
      $$('.tab').forEach((t) => t.classList.toggle('on', t.id === b.dataset.t));
      if (b.dataset.t === 'workspaces') WorkspaceManager.loadUserWorkspaces();
      if (b.dataset.t === 'teacher-settings') TeacherSettings.loadConfig();
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

  // Teacher Pizarra
  $('#ib').onclick = (e) => {
    const r = $('#ib').getBoundingClientRect();
    const x = ((e.clientX - r.left) * 880) / r.width;
    const y = ((e.clientY - r.top) * 380) / r.height;
    if (MultiUser.channel) MultiUser.channel.postMessage({ t: 'draw', x, y });
    ANN.push({ x, y });
    render();
  };

  $('#clr').onclick = () => {
    ANN = [];
    if (MultiUser.channel) MultiUser.channel.postMessage({ t: 'clear' });
    render();
  };

  $('#btn-send-ins-msg').onclick = () => {
    const inp = $('#ins-msg-input');
    if (inp.value.trim()) {
      const txt = inp.value.trim();
      if (MultiUser.channel) MultiUser.channel.postMessage({ t: 'teacher_nudge', text: txt });
      say(`Pista enviada: «${txt}»`);
      inp.value = '';
    }
  };

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
