/* ====================================================================
   🔬 CircuitLens Platform v4.0 - Core Script
   Features:
   - Full RBAC Authentication & Session Sync
   - Independent Virtual Breadboards & Cloud/Local Workspace Persistence
   - Multi-Channel Accessibility (Voice, Text, Haptic) & "Voice-Only" Mode
   - Audio TTS Queue Management, Audio Cancellation & Visual Synchronization
   - Contextual AI Tutor with Backend Integration (Gemini, OpenAI, Ollama, Physics)
   - 50 Progressive University-Level Laboratories (Levels 1 to 5)
   - Usability Testing & User Interviews Workflow
   ==================================================================== */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ========================================================
   1. Accesibilidad Universal: Canales de Interacción Independientes
   Canal 1: Voz | Canal 2: Texto | Canal 3: Háptico
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

    if (btnV) {
      btnV.onclick = () => {
        this.voice = !this.voice;
        this.applySettings();
      };
    }
    if (btnT) {
      btnT.onclick = () => {
        this.text = !this.text;
        this.applySettings();
      };
    }
    if (btnH) {
      btnH.onclick = () => {
        this.haptic = !this.haptic;
        this.applySettings();
      };
    }
    if (btnVO) {
      btnVO.onclick = () => {
        this.voiceOnly = !this.voiceOnly;
        if (this.voiceOnly) {
          this.voice = true;
          this.haptic = true;
          // Iniciar escucha continua
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
    if (btnVO) {
      btnVO.classList.toggle('active', this.voiceOnly);
    }

    // Sync checkboxes in settings tab
    const chkV = $('#o-voice-toggle');
    const chkT = $('#o-text-toggle');
    const chkH = $('#o-m');
    if (chkV) chkV.checked = this.voice;
    if (chkT) chkT.checked = this.text;
    if (chkH) chkH.checked = this.haptic;
  }
};

/* ========================================================
   2. Motor de Audio TTS Robusto con Cola, Pausa, Reanudación
   y Sincronización Visual de Lectura
   ======================================================== */
const AudioManager = {
  queue: [],
  isSpeaking: false,
  isPaused: false,
  currentUtterance: null,

  init() {
    const btnPause = $('#audio-pause');
    const btnResume = $('#audio-resume');
    const btnStop = $('#audio-stop');

    if (btnPause) {
      btnPause.onclick = () => this.pause();
    }
    if (btnResume) {
      btnResume.onclick = () => this.resume();
    }
    if (btnStop) {
      btnStop.onclick = () => this.stop();
    }
  },

  speak(text, alertType = 0) {
    // Si no está habilitado TTS
    if (!Channels.voice || !O('o-t') || !window.speechSynthesis) {
      this.syncVisuals(text);
      return;
    }

    // Limpiar si es un mensaje de alta prioridad o encolar ordenadamente
    this.stop(); // Prevenir overlapping speech
    this.syncVisuals(text);

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
   3. Motor Háptico Universal (Web Vibration API y Abstracción)
   ======================================================== */
const HapticEngine = {
  isSupported: 'vibrate' in navigator,

  trigger(patternType) {
    if (!Channels.haptic || !O('o-m')) return;

    // Patrones hápticos específicos para cada evento
    const patterns = {
      click: [35],                          // Colocar componente
      success: [50, 40, 90],                 // Circuito completado / éxito
      error: [120, 60, 120, 60, 180],        // Error de conexión o polaridad
      nudge: [80, 50, 80],                   // Notificación del profesor
      help: [150, 100, 150]                  // Solicitud de ayuda
    };

    const pat = patterns[patternType] || [50];

    if (this.isSupported) {
      try {
        navigator.vibrate(pat);
      } catch (e) {}
    } else {
      // Degradar grácilmente hacia feedback visual
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
   4. Códigos de Colores y Datos de Circuitos
   ======================================================== */
const BAND = {
  330: ['Naranja', 'Naranja', 'Marrón', ['#f80', '#f80', '#852']],
  220: ['Rojo', 'Rojo', 'Marrón', ['#d22', '#d22', '#852']],
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

const W = (c, a, b) => ({
  k: 'wire',
  c,
  a,
  b,
  l: `Cable ${{ '#d22': 'rojo (+)', '#111': 'negro (−)', '#ea0': 'amarillo (señal)' }[c] || 'de conexión'}: ${pn(a)} → ${pn(b)}`
});

const Rz = (v, a, b) => ({
  k: 'res',
  v,
  a,
  b,
  l: `Resistencia limitadora ${val(v)}: ${pn(a)} → ${pn(b)}`
});

const L = (c, a, b) => ({
  k: 'led',
  c,
  a,
  b,
  l: `Diodo LED ${c == '#e33' ? 'rojo' : 'verde'}: ánodo (+) en ${pn(a)}, cátodo (−) en ${pn(b)}`
});

const B = (a, b) => ({
  k: 'btn',
  a,
  b,
  l: `Pulsador táctil (Push Button): ${pn(a)} → ${pn(b)}`
});

// Colección básica inicial con fallback a 50 laboratorios completos
let CIR = [
  [
    'Encender un LED',
    [
      W('#d22', 'p3', '6a'),
      Rz(330, '6b', '10b'),
      L('#e33', '10c', '14c'),
      W('#111', '14e', 'm14')
    ],
    'Un circuito cerrado elemental donde una resistencia de 330 Ω limita la corriente para no quemar el diodo LED rojo (caída típica de 1.8 V).'
  ]
];

let ALL_LABS = []; // 50 laboratorios cargados desde backend

/* ========================================================
   5. Sistema de Sonido Sintetizado (Earcons - Web Audio API)
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
   6. Autenticación RBAC y Conexión Backend
   ======================================================== */
const Auth = {
  user: {
    id: 'ALU-101',
    name: 'Piero Castillo',
    email: 'estudiante@uni.edu.pe',
    role: 'student',
    avatar: '🎓'
  },
  token: null,

  async init() {
    try {
      const saved = localStorage.getItem('cl.auth_user');
      if (saved) {
        this.user = JSON.parse(saved);
      }
      this.token = localStorage.getItem('cl.auth_token') || null;
    } catch (e) {}

    // Intentar verificar token en backend
    if (this.token) {
      try {
        const resp = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (resp.ok) {
          const d = await resp.json();
          if (d.ok && d.user) this.user = d.user;
        }
      } catch (e) {}
    }

    this.applyRolePermissions();
    this.setupUI();
  },

  async login(email, role, name) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, name, room: S.roomId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          this.user = data.user;
          this.token = data.token;
          localStorage.setItem('cl.auth_token', this.token);
        }
      }
    } catch (e) {
      // Local fallback
      this.user = {
        id: (role === 'teacher' ? 'DOC-' : 'ALU-') + Math.floor(100 + Math.random() * 900),
        name: name || (role === 'teacher' ? 'Prof. ' + email.split('@')[0] : email.split('@')[0]),
        email: email || 'usuario@uni.edu.pe',
        role: role || 'student',
        avatar: role === 'teacher' ? '👨‍🏫' : '🎓'
      };
    }

    localStorage.setItem('cl.auth_user', JSON.stringify(this.user));
    UserProfile.data.id = this.user.id;
    UserProfile.data.alias = this.user.name;
    UserProfile.save();

    this.applyRolePermissions();
    WorkspaceManager.loadUserWorkspaces();

    if (this.user.role === 'teacher') {
      say(`Bienvenido ${this.user.name}. Modo Docente activado.`);
      const insBtn = document.querySelector('nav button[data-t="ins"]');
      if (insBtn) insBtn.click();
    } else {
      say(`Bienvenido ${this.user.name}. Modo Estudiante activado.`);
      const estBtn = document.querySelector('nav button[data-t="est"]');
      if (estBtn) estBtn.click();
    }
  },

  applyRolePermissions() {
    const isDoc = (this.user.role === 'teacher' || this.user.role === 'profesor');
    const badge = $('#user-badge');
    if (badge) {
      badge.innerHTML = `${this.user.avatar || '🎓'} ${this.user.name} <small style="opacity:0.75; font-size:11px;">(${isDoc ? 'Docente' : 'Estudiante'})</small>`;
      badge.style.borderColor = isDoc ? 'var(--ac2)' : 'var(--ac)';
    }

    $$('nav button').forEach((btn) => {
      const tabId = btn.dataset.t;
      if (isDoc) {
        if (tabId === 'est' || tabId === 'workspaces') {
          btn.style.display = 'inline-block';
        } else {
          btn.style.display = 'inline-block';
        }
      } else {
        if (tabId === 'ins' || tabId === 'interviews') {
          btn.style.display = 'none';
        } else {
          btn.style.display = 'inline-block';
        }
      }
    });
  },

  setupUI() {
    const btnSwitch = $('#btn-switch-account');
    const modal = $('#modal-auth');
    const btnClose = $('#btn-close-auth-modal');

    if (btnSwitch && modal) {
      btnSwitch.onclick = () => { modal.style.display = 'flex'; };
    }
    if (btnClose && modal) {
      btnClose.onclick = () => { modal.style.display = 'none'; };
    }

    $$('.account-card').forEach((card) => {
      card.onclick = async () => {
        const role = card.dataset.role;
        const email = card.dataset.email;
        const name = card.dataset.name;
        await this.login(email, role, name);
        if (modal) modal.style.display = 'none';
      };
    });

    const btnCustom = $('#btn-custom-login');
    if (btnCustom) {
      btnCustom.onclick = async () => {
        const name = $('#custom-name').value.trim() || 'Estudiante';
        const email = $('#custom-email').value.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@uni.edu.pe`;
        const role = $('#custom-role').value;
        await this.login(email, role, name);
        if (modal) modal.style.display = 'none';
      };
    }
  }
};

/* ========================================================
   7. Gestión de Protoboards Virtuales Independientes (Workspaces)
   ======================================================== */
const WorkspaceManager = {
  currentWorkspace: null,
  workspaces: [],

  async loadUserWorkspaces() {
    const listEl = $('#workspaces-list');
    try {
      const token = Auth.token;
      const resp = await fetch('/api/breadboards', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (resp.ok) {
        const data = await resp.json();
        this.workspaces = data.breadboards || [];
        this.renderWorkspacesList();
        return;
      }
    } catch (e) {}

    // Fallback LocalStorage
    try {
      const local = localStorage.getItem('cl.workspaces_' + Auth.user.id);
      this.workspaces = local ? JSON.parse(local) : [];
      this.renderWorkspacesList();
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

    // Event handlers
    listEl.querySelectorAll('.btn-open-ws').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.openWorkspace(btn.dataset.wid);
      };
    });

    listEl.querySelectorAll('.btn-delete-ws').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.deleteWorkspace(btn.dataset.wid);
      };
    });
  },

  async openWorkspace(wid) {
    const ws = this.workspaces.find((w) => w.id === wid);
    if (!ws) return;
    this.currentWorkspace = ws;

    S.ci = ws.circuitIndex || 0;
    S.placed = ws.placedSteps || 0;
    S.err = Boolean(ws.hasError);
    if ($('#cs')) $('#cs').value = S.ci;

    render();
    say(`Espacio de trabajo abierto: ${ws.name}`);
    SoundEngine.playClick();

    // Cambiar a la pestaña del protoboard
    const tabEst = document.querySelector('nav button[data-t="est"]');
    if (tabEst) tabEst.click();

    this.renderWorkspacesList();
    this.loadWorkspaceMessages(wid);
  },

  async saveCurrentWorkspace() {
    const wsData = {
      id: this.currentWorkspace ? this.currentWorkspace.id : null,
      name: this.currentWorkspace ? this.currentWorkspace.name : `Protoboard Lab ${S.ci + 1}`,
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

    // Fallback Local
    if (!wsData.id) wsData.id = 'ws_' + Date.now();
    wsData.updatedAt = new Date().toISOString();
    wsData.ownerName = Auth.user.name;
    const idx = this.workspaces.findIndex((w) => w.id === wsData.id);
    if (idx >= 0) this.workspaces[idx] = wsData;
    else this.workspaces.unshift(wsData);

    localStorage.setItem('cl.workspaces_' + Auth.user.id, JSON.stringify(this.workspaces));
    this.currentWorkspace = wsData;
    say('Protoboard guardado localmente.', 2);
    this.renderWorkspacesList();
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
    localStorage.setItem('cl.workspaces_' + Auth.user.id, JSON.stringify(this.workspaces));
    if (this.currentWorkspace && this.currentWorkspace.id === wid) {
      this.currentWorkspace = null;
    }
    this.renderWorkspacesList();
    say('Espacio de trabajo eliminado.');
  },

  async loadWorkspaceMessages(wid) {
    const chatBox = $('#workspace-chat-box');
    if (!chatBox) return;
    try {
      const resp = await fetch('/api/workspace-messages/' + wid);
      if (resp.ok) {
        const d = await resp.json();
        const msgs = d.messages || [];
        chatBox.innerHTML = msgs.map((m) => `
          <div style="margin-bottom:6px; font-size:12.5px;">
            <b>${m.senderName} (${m.senderRole === 'teacher' ? 'Docente' : 'Estudiante'}):</b> ${m.content}
          </div>
        `).join('');
      }
    } catch (e) {}
  }
};

/* ========================================================
   8. Perfil Continuo, Ritmo y Estado Emocional
   ======================================================== */
const UserProfile = {
  data: {
    id: 'ALU-101',
    alias: 'Piero Castillo',
    preferencias: {
      tono: 'empatico',
      nivel: 'auto',
      velocidadVoz: 1.0,
      audioFeedback: true
    },
    ritmo: {
      tiemposPorPaso: [],
      promedioSeg: 20,
      clasificacion: 'Constante',
      ultimoTimestampPaso: Date.now()
    },
    errores: {
      polaridad_led: 0,
      resistencia_omitida: 0,
      pin_desalineado: 0,
      total: 0,
      porCircuito: {}
    },
    emociones: {
      declarada: 'motivado',
      inferida: 'Enfocado',
      historial: []
    },
    circuitos: {
      done: {},
      latencias: []
    }
  },

  load() {
    try {
      const saved = localStorage.getItem('cl.profile_v4');
      if (saved) {
        this.data = Object.assign(this.data, JSON.parse(saved));
      }
    } catch (e) {}
    this.updateUI();
  },

  save() {
    try {
      localStorage.setItem('cl.profile_v4', JSON.stringify(this.data));
    } catch (e) {}
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

    if (avg < 12) this.data.ritmo.clasificacion = 'Ágil';
    else if (avg <= 28) this.data.ritmo.clasificacion = 'Constante';
    else this.data.ritmo.clasificacion = 'Pausado';

    this.inferEmotion();
    this.save();
  },

  recordError(tipo = 'polaridad_led', ci = S.ci) {
    this.data.errores.total++;
    this.data.errores[tipo] = (this.data.errores[tipo] || 0) + 1;
    this.data.errores.porCircuito[ci] = (this.data.errores.porCircuito[ci] || 0) + 1;
    this.inferEmotion();
    this.save();
  },

  setDeclaredEmotion(emo) {
    this.data.emociones.declarada = emo;
    this.data.emociones.historial.push({ t: Date.now(), emo });
    this.save();
    MultiUser.broadcastStudentStatus();
  },

  inferEmotion() {
    const errsInCur = this.data.errores.porCircuito[S.ci] || 0;
    if (errsInCur >= 2) this.data.emociones.inferida = 'Bloqueado';
    else if (errsInCur === 1) this.data.emociones.inferida = 'Confuso';
    else this.data.emociones.inferida = 'Enfocado';
  },

  getExplanationLevel() {
    if (this.data.preferencias.nivel === 'basica') return 'básica';
    if (this.data.preferencias.nivel === 'detallada') return 'detallada';
    return (this.data.errores.porCircuito[S.ci] || 0) >= 2 ? 'detallada' : 'básica';
  },

  getAffectiveTone() {
    return this.data.preferencias.tono || 'empatico';
  },

  updateUI() {
    $$('#emo-picker .emotion-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.emo === this.data.emociones.declarada);
    });
    if ($('#prf-pace')) $('#prf-pace').textContent = this.data.ritmo.clasificacion;
    if ($('#prf-pace-detail')) $('#prf-pace-detail').textContent = `~${this.data.ritmo.promedioSeg}s por componente`;
    const doneCount = Object.keys(this.data.circuitos.done).length;
    if ($('#prf-done')) $('#prf-done').textContent = `${doneCount} / 50`;
    const totalSteps = Math.max(1, this.data.ritmo.tiemposPorPaso.length);
    const acc = Math.max(0, Math.min(100, Math.round((1 - this.data.errores.total / (totalSteps + this.data.errores.total)) * 100)));
    if ($('#prf-acc')) $('#prf-acc').textContent = acc + '%';
    if ($('#prf-err-count')) $('#prf-err-count').textContent = `${this.data.errores.total} errores registrados`;
    if ($('#prf-emo')) {
      const emojiMap = { motivado: '😊 Motivado', concentrado: '🤔 Concentrado', frustrado: '😓 Frustrado', confiado: '⚡ Confiado', cansado: '😴 Cansado' };
      $('#prf-emo').textContent = emojiMap[this.data.emociones.declarada] || '😊 Motivado';
    }
  }
};

/* ========================================================
   9. Estado Global y Renderizado de Protoboard Ampliado
   ======================================================== */
const S = {
  ci: 0,
  placed: 0,
  err: false,
  focus: 80,
  key: '',
  prov: 'sim',
  roomId: 'SALA-ELECTRO-1'
};

let ANN = []; // Anotaciones en tiempo real del docente

const O = (id) => {
  const el = $('#' + id);
  return el ? el.checked : false;
};

const cir = () => {
  if (CIR[S.ci] && CIR[S.ci][1]) return CIR[S.ci][1];
  return [];
};
const lvl = () => UserProfile.getExplanationLevel();

// Coordenadas para protoboard ampliado (760x340, 26 columnas)
function xy(p) {
  let m = /^([pm])(\d+)$/.exec(p);
  if (m) {
    const col = parseInt(m[2], 10);
    return [40 + col * 26, m[1] === 'p' ? 26 : 48];
  }
  m = /^(\d+)([a-j])$/.exec(p);
  if (m) {
    const col = parseInt(m[1], 10);
    const r = 'abcdefghij'.indexOf(m[2]);
    return [40 + col * 26, r < 5 ? 90 + r * 22 : 205 + (r - 5) * 22];
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
  let h = '<rect width="760" height="340" fill="#1e293b" rx="10"/>';
  for (let c = 1; c <= 26; c++) {
    for (const p of ['p' + c, 'm' + c]) {
      const [x, y] = xy(p);
      h += `<circle cx="${x}" cy="${y}" r="3.5" fill="${p[0] === 'p' ? '#ef4444' : '#3b82f6'}"/>`;
    }
    for (const r of 'abcdefghij') {
      const [x, y] = xy(c + r);
      h += `<circle cx="${x}" cy="${y}" r="3.5" fill="#0f172a"/>`;
    }
  }
  h += `<text x="10" y="32" fill="#ef4444" font-size="14" font-weight="bold">+</text><text x="10" y="54" fill="#3b82f6" font-size="14" font-weight="bold">−</text>`;

  const st = cir();
  st.forEach((s, i) => {
    if (i < S.placed) h += comp(s, 0);
  });
  if (S.placed < st.length) {
    const s = st[S.placed];
    h += comp(s, 1);
    for (const p of [s.a, s.b]) {
      const [x, y] = xy(p);
      h += `<circle class="ring" data-pin="${p}" cx="${x}" cy="${y}" r="12" fill="none" stroke="#10b981" stroke-width="3.5" title="Pin accesible: Toca o presiona espacio para insertar"/>`;
    }
  }
  ANN.forEach((a) => {
    h += `<circle cx="${a.x}" cy="${a.y}" r="20" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" stroke-width="4"/>`;
    h += `<circle cx="${a.x}" cy="${a.y}" r="5" fill="#ef4444"/>`;
  });
  el.innerHTML = h;
  el.style.filter = S.focus < 30 ? 'blur(6px)' : 'none';
}

function render() {
  draw($('#bd'));
  draw($('#ib'), true);
  const curName = (CIR[S.ci] && CIR[S.ci][0]) ? CIR[S.ci][0] : 'Circuito';
  if ($('#lvl')) $('#lvl').textContent = 'Nivel: ' + lvl();
  const doneCount = Object.keys(UserProfile.data.circuitos.done).length;
  if ($('#prog')) $('#prog').textContent = `Paso ${Math.min(S.placed + 1, cir().length)}/${cir().length} · completados ${doneCount}/50`;
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
      $('#refl-text').textContent = CIR[S.ci][2] || '¡Montaje verificado conforme a los principios de ingeniería!';
      const avgPace = UserProfile.data.ritmo.promedioSeg;
      $('#refl-stats').textContent = `Ritmo: ~${avgPace}s/paso · Estado: ${UserProfile.data.emociones.declarada}`;
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

  if (alertType === 1) {
    SoundEngine.playAlert();
  } else if (alertType === 2) {
    SoundEngine.playSuccess();
  }

  // Reproducir mediante AudioManager si el canal de voz está habilitado
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
   11. Integración con el AI Tutor Backend
   ======================================================== */
async function diagnose() {
  const t = performance.now();
  const cName = (CIR[S.ci] && CIR[S.ci][0]) ? CIR[S.ci][0] : 'Circuito';
  const cDesc = (CIR[S.ci] && CIR[S.ci][2]) ? CIR[S.ci][2] : '';
  const nextLbl = (cir()[S.placed]) ? cir()[S.placed].l : 'Circuito finalizado';

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

  S.prov = $('#pv') ? $('#pv').value : 'sim';
  let responseText = '';
  let providerUsed = S.prov;

  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.token}`
      },
      body: JSON.stringify({
        message: 'Revisa mi circuito y evalúa las conexiones actuales',
        circuitContext: circuitCtx,
        userProfile: UserProfile.data,
        breadboardId: WorkspaceManager.currentWorkspace ? WorkspaceManager.currentWorkspace.id : null,
        provider: S.prov,
        model: S.key ? 'gemini-1.5-flash' : null
      })
    });

    if (resp.ok) {
      const d = await resp.json();
      responseText = d.response;
      providerUsed = d.provider;
    }
  } catch (e) {
    // Resilient local rule fallback
    if (S.err) {
      responseText = `Error de polaridad detectado en «${cName}». El diodo está polarizado en inversa; invierte sus terminales.`;
    } else if (S.placed < cir().length) {
      responseText = `El circuito «${cName}» está en construcción (${S.placed}/${cir().length}). Siguiente elemento: ${nextLbl}.`;
    } else {
      responseText = `¡Excelente! El circuito «${cName}» está correctamente polarizado y con continuidad total.`;
    }
  }

  const ms = Math.round(performance.now() - t);
  if ($('#ai-provider-badge')) {
    $('#ai-provider-badge').textContent = `Proveedor: ${providerUsed} (${ms} ms)`;
  }

  if (S.err) {
    UserProfile.recordError('polaridad_led', S.ci);
    say(responseText, 1);
  } else if (S.placed === cir().length) {
    say(responseText, 2);
    celebrate();
    UserProfile.data.circuitos.done[S.ci] = true;
    UserProfile.save();
    // Persist progress to backend
    saveProgressToBackend(S.ci, 1, 1, 'completed', 100.0, responseText);
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
   12. Reconocimiento de Voz y Comandos Accesibles
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
  if (!t) return say('Te escucho. Puedes decir: colocar siguiente, revisa mi circuito, o guardar.');
  userLog(t);

  if (/revis|diagn|verific|no enciende/.test(t)) {
    diagnose();
  } else if (/sigui|coloc|avanz|poner/.test(t)) {
    next();
  } else if (/guardar|salvar/.test(t)) {
    WorkspaceManager.saveCurrentWorkspace();
  } else if (/repit|lee|valor/.test(t)) {
    say(cir()[Math.min(S.placed, cir().length - 1)].l);
  } else if (/pausa|silencio/.test(t)) {
    AudioManager.pause();
  } else if (/reanuda|continua/.test(t)) {
    AudioManager.resume();
  } else if (/deten|para/.test(t)) {
    AudioManager.stop();
  } else if (/ayuda|profesor|docente/.test(t)) {
    $('#ask-help').click();
  } else {
    // Enviar consulta libre al AI Tutor
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
          circuitName: CIR[S.ci] ? CIR[S.ci][0] : 'Circuito',
          placedSteps: S.placed,
          hasError: S.err
        },
        userProfile: UserProfile.data,
        provider: $('#pv') ? $('#pv').value : 'sim'
      })
    });
    if (resp.ok) {
      const d = await resp.json();
      say(d.response);
      return;
    }
  } catch (e) {}
  say('Comprendido. Sigamos avanzando con el laboratorio.');
}

/* ========================================================
   13. Carga del Currículo Ampliado (50 Laboratorios)
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

  // Fallback si no está el archivo
  populateCurriculumUI();
}

function populateCurriculumUI() {
  if (ALL_LABS.length > 0) {
    // Adaptar CIR con los 50 laboratorios
    CIR = ALL_LABS.map((lab) => {
      const components = lab.pasos.map((p) => {
        if (p.type === 'wire') return W(p.color, p.de, p.a);
        if (p.type === 'res') return Rz(p.valor, p.de, p.a);
        if (p.type === 'led') return L(p.color, p.de, p.a);
        if (p.type === 'btn') return B(p.de, p.a);
        return W('#d22', p.de, p.a);
      });
      return [lab.nombre, components, lab.descripcion];
    });
  }

  // Llenar selector de circuitos del protoboard
  const cs = $('#cs');
  if (cs) {
    cs.innerHTML = CIR.map((c, i) => `<option value="${i}">${i + 1}. ${c[0]}</option>`).join('');
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
        📐 Ecuación: <code>${lab.ecuaciones}</code>
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
   14. Flujo de Entrevistas y Pruebas de Usabilidad
   ======================================================== */
const UsabilityInterviews = {
  activeRatings: {
    ratingAccessibility: 5,
    ratingVoiceOnly: 5,
    ratingHaptics: 5,
    ratingLearning: 5
  },

  init() {
    this.setupRatingButtons();
    const btnSubmit = $('#btn-submit-interview');
    if (btnSubmit) {
      btnSubmit.onclick = () => this.submitInterview();
    }
    this.loadInterviews();
  },

  setupRatingButtons() {
    $$('.interview-rating-group').forEach((grp) => {
      const field = grp.dataset.ratingField;
      grp.querySelectorAll('.rating-btn').forEach((btn) => {
        btn.onclick = () => {
          grp.querySelectorAll('.rating-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeRatings[field] = parseInt(btn.dataset.val, 10);
        };
      });
    });
  },

  async submitInterview() {
    const userType = $('#int-user-type').value;
    const interviewer = $('#int-interviewer').value.trim() || 'Evaluador Principal';
    const taskId = $('#int-task').value;
    const barriers = $('#int-barriers').value.trim();
    const comments = $('#int-comments').value.trim();
    const statusEl = $('#interview-submit-status');

    const payload = {
      userType,
      interviewerName: interviewer,
      taskId,
      ratingAccessibility: this.activeRatings.ratingAccessibility,
      ratingVoiceOnly: this.activeRatings.ratingVoiceOnly,
      ratingHaptics: this.activeRatings.ratingHaptics,
      ratingLearning: this.activeRatings.ratingLearning,
      accessibilityBarriersNoted: barriers,
      qualitativeFeedback: comments,
      taskCompletionStatus: 'success',
      timeToCompleteSeconds: UserProfile.data.ritmo.promedioSeg * 3
    };

    try {
      const resp = await fetch('/api/interviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.token}`
        },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        if (statusEl) {
          statusEl.textContent = '✅ Entrevista registrada con éxito.';
          statusEl.style.color = 'var(--good)';
        }
        say('Sesión de prueba y entrevista guardada correctamente.');
        this.loadInterviews();
        return;
      }
    } catch (e) {}

    // Fallback local
    const saved = JSON.parse(localStorage.getItem('cl.interviews') || '[]');
    payload.id = 'int_' + Date.now();
    payload.createdAt = new Date().toISOString();
    saved.unshift(payload);
    localStorage.setItem('cl.interviews', JSON.stringify(saved));
    if (statusEl) {
      statusEl.textContent = '✅ Guardada localmente.';
      statusEl.style.color = 'var(--good)';
    }
    this.renderInterviewsList(saved);
  },

  async loadInterviews() {
    try {
      const resp = await fetch('/api/interviews', {
        headers: { 'Authorization': `Bearer ${Auth.token}` }
      });
      if (resp.ok) {
        const d = await resp.json();
        this.renderInterviewsList(d.interviews || []);
        return;
      }
    } catch (e) {}

    const saved = JSON.parse(localStorage.getItem('cl.interviews') || '[]');
    this.renderInterviewsList(saved);
  },

  renderInterviewsList(interviews) {
    const listEl = $('#interviews-list');
    if (!listEl) return;
    if (interviews.length === 0) {
      listEl.innerHTML = '<p style="opacity:0.75; font-size:13px;">No hay registros de pruebas aún.</p>';
      return;
    }

    listEl.innerHTML = interviews.map((it) => `
      <div class="card" style="margin:0; background:var(--bb);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b>${it.userType === 'motor_disabled' ? '♿ Usuario con Discapacidad Motriz' : it.userType === 'professor' ? '👨‍🏫 Profesor de Circuitos' : '🎓 Estudiante'}</b>
          <span style="font-size:11px; opacity:0.7;">${new Date(it.createdAt).toLocaleDateString()}</span>
        </div>
        <div style="font-size:12.5px; margin:4px 0;">
          Tarea: <code>${it.taskId}</code> · Evaluador: ${it.interviewerName}
        </div>
        <div class="row" style="gap:6px; margin:4px 0;">
          <span class="badge">Accesibilidad: ${it.ratingAccessibility}/5</span>
          <span class="badge">Solo Voz: ${it.ratingVoiceOnly}/5</span>
          <span class="badge">Háptica: ${it.ratingHaptics}/5</span>
          <span class="badge">Aprendizaje: ${it.ratingLearning}/5</span>
        </div>
        ${it.qualitativeFeedback ? `<p style="font-size:12px; margin:4px 0; opacity:0.9;"><b>Feedback:</b> ${it.qualitativeFeedback}</p>` : ''}
        ${it.accessibilityBarriersNoted ? `<p style="font-size:12px; margin:4px 0; color:var(--warn);"><b>Barreras:</b> ${it.accessibilityBarriersNoted}</p>` : ''}
      </div>
    `).join('');
  }
};

/* ========================================================
   15. Colaboración en Tiempo Real y Mensajería Multiusuario
   ======================================================== */
const MultiUser = {
  channel: null,
  activeStudents: new Map(),

  init() {
    this.joinRoom(S.roomId);
    this.setupStorageSync();
  },

  joinRoom(roomId) {
    S.roomId = roomId;
    if ($('#room-pill')) $('#room-pill').textContent = 'Sala: ' + roomId;

    if (this.channel) {
      try { this.channel.close(); } catch (e) {}
    }

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
      ann(msg.x, msg.y, 1);
    } else if (msg.t === 'clear') {
      ANN = [];
      render();
    } else if (msg.t === 'teacher_nudge') {
      say(`Mensaje de tu instructor: «${msg.text}»`, 0);
      SoundEngine.playAlert();
    } else if (msg.t === 'help_request') {
      this.activeStudents.set(msg.studentId, Object.assign(this.activeStudents.get(msg.studentId) || {}, { needsHelp: true }));
      this.renderStudents();
      say(`El estudiante ${msg.studentName || msg.studentId} ha solicitado asistencia.`, 1);
    }
  },

  broadcastStudentStatus() {
    const payload = {
      t: 'student_update',
      studentId: UserProfile.data.id,
      studentName: UserProfile.data.alias,
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
    this.activeStudents.set(UserProfile.data.id, payload);
    this.renderStudents();
  },

  setupStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'cl.sync_' + S.roomId && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.studentId !== UserProfile.data.id) {
            this.handleMessage(payload);
          }
        } catch (err) {}
      }
    });
  },

  renderStudents() {
    const grid = $('#student-grid');
    if (!grid) return;
    const countBadge = $('#ins-students-count');
    if (countBadge) countBadge.textContent = `Alumnos: ${this.activeStudents.size}`;

    grid.innerHTML = Array.from(this.activeStudents.values()).map((st) => {
      const isCur = st.studentId === UserProfile.data.id;
      const statusText = st.needsHelp ? 'Pide ayuda 🙋' : (st.err ? 'Error polaridad ⚠' : 'En progreso ✔');
      const emoMap = { motivado: '😊', concentrado: '🤔', frustrado: '😓', confiado: '⚡', cansado: '😴' };
      return `
        <div class="card" style="margin:0; background:var(--bb); border-color:${st.err ? 'var(--bad)' : 'var(--bd)'};">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b>${st.studentName} ${isCur ? '(Tú)' : ''}</b>
            <span>${emoMap[st.emotion] || '😊'}</span>
          </div>
          <div style="font-size:12px; opacity:0.8; margin-top:4px;">
            Lab: ${st.ci + 1} · Paso ${st.placed + 1}
          </div>
          <div style="font-size:11.5px; color:${st.err ? 'var(--bad)' : 'var(--good)'}; margin-top:2px;">
            ${statusText} (${st.pace || 'Normal'})
          </div>
        </div>
      `;
    }).join('');
  }
};

function ann(x, y, fromInstructor) {
  ANN.push({ x, y });
  render();
  if (fromInstructor) {
    say('El docente realizó una anotación en tu protoboard.', 1);
  }
  setTimeout(() => {
    ANN.shift();
    render();
  }, 8000);
}

/* ========================================================
   16. Confeti Celebratorio Accesible
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
    if (++f < 130) requestAnimationFrame(t);
    else g.clearRect(0, 0, c.width, c.height);
  })();
}

/* ========================================================
   17. Inicialización Principal del DOM y Switch-Access
   ======================================================== */
window.addEventListener('DOMContentLoaded', async () => {
  Channels.init();
  AudioManager.init();
  await Auth.init();
  UserProfile.load();
  await loadCurriculum();
  MultiUser.init();
  WorkspaceManager.loadUserWorkspaces();
  UsabilityInterviews.init();

  // Teclado y Switch Access para usuarios con discapacidad motriz
  window.addEventListener('keydown', (e) => {
    // Tecla Espacio o Enter sobre protoboard o anillo para colocar componente
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!e.target.closest('button')) {
          e.preventDefault();
          next();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        diagnose();
      } else if (e.key === 'v' || e.key === 'V') {
        $('#mic').click();
      }
    }
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }

  // Botones de acción principales
  $('#nx').onclick = next;
  $('#rv').onclick = () => {
    userLog('Revisa mi circuito');
    diagnose();
  };

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

  $('#fo').oninput = (e) => {
    S.focus = +e.target.value;
    render();
  };

  $('#btn-save-workspace').onclick = () => {
    WorkspaceManager.saveCurrentWorkspace();
  };

  $('#btn-new-workspace').onclick = () => {
    WorkspaceManager.currentWorkspace = null;
    S.placed = 0;
    S.err = false;
    render();
    say('Nuevo protoboard creado. Listo para montar.');
  };

  $('#btn-create-workspace-tab').onclick = () => {
    $('#btn-new-workspace').click();
    const tabEst = document.querySelector('nav button[data-t="est"]');
    if (tabEst) tabEst.click();
  };

  $('#btn-refresh-workspaces').onclick = () => {
    WorkspaceManager.loadUserWorkspaces();
  };

  $('#ask-help').onclick = () => {
    if (MultiUser.channel) {
      MultiUser.channel.postMessage({
        t: 'help_request',
        studentId: UserProfile.data.id,
        studentName: UserProfile.data.alias,
        ci: S.ci,
        timestamp: Date.now()
      });
    }
    say('Notificación de ayuda enviada a tu docente.', 0);
    HapticEngine.trigger('help');
  };

  // Botón siguiente en tarjeta reflexiva
  const reflBtn = $('#refl-btn-next');
  if (reflBtn) {
    reflBtn.onclick = () => {
      if (S.ci < CIR.length - 1) selectCircuit(S.ci + 1);
      else say('¡Completaste todos los laboratorios del currículo!', 2);
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
      say('No se detectó cámara física; se mantiene el protoboard simulado.');
    }
  };

  // Clic directo sobre protoboard
  $('#bd').onclick = (e) => {
    if (e.target.classList && e.target.classList.contains('ring')) {
      next();
    }
  };

  // Micrófono
  $('#mic').onclick = () => {
    const mic = $('#mic');
    mic.classList.add('on');
    mic.setAttribute('aria-pressed', 'true');
    listen(false);
  };

  // Enviar texto
  $('#sd').onclick = () => {
    const valText = $('#tx').value.trim();
    if (valText) {
      handleVoiceCommand(valText);
      $('#tx').value = '';
    }
  };
  $('#tx').onkeydown = (e) => {
    if (e.key === 'Enter') $('#sd').click();
  };

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
      if (b.dataset.t === 'interviews') UsabilityInterviews.loadInterviews();
      if (b.dataset.t === 'prf') UserProfile.updateUI();
    };
  });

  // Opciones de accesibilidad
  $('#o-h').onchange = (e) => document.body.classList.toggle('hc', e.target.checked);
  $('#o-c').onchange = (e) => document.body.classList.toggle('calm', e.target.checked);
  $('#o-d').onchange = () => {
    render();
    say(O('o-d') ? 'Modo daltonismo activo.' : 'Modo daltonismo desactivado.');
  };
  $('#o-f').onchange = (e) => {
    hands = e.target.checked;
    if (hands) {
      say('Modo manos libres continuo activo.');
      listen(true);
    } else {
      try { rec.stop(); } catch (x) {}
    }
  };

  // Acciones del Docente en la Pizarra
  $('#ib').onclick = (e) => {
    const r = $('#ib').getBoundingClientRect();
    const x = ((e.clientX - r.left) * 760) / r.width;
    const y = ((e.clientY - r.top) * 340) / r.height;
    if (MultiUser.channel) {
      MultiUser.channel.postMessage({ t: 'draw', x, y });
    }
    ann(x, y, 0);
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

  // Docente crea nuevo estudiante
  const btnInsAdd = $('#btn-ins-add-student');
  if (btnInsAdd) {
    btnInsAdd.onclick = async () => {
      const name = $('#ins-new-student-name').value.trim();
      const email = $('#ins-new-student-email').value.trim();
      if (!name || !email) {
        alert('Ingresa el nombre y correo del nuevo estudiante');
        return;
      }
      try {
        const resp = await fetch('/api/auth/register-student', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.token}`
          },
          body: JSON.stringify({ name, email, avatar: '🎓' })
        });
        if (resp.ok) {
          alert(`Estudiante ${name} registrado con éxito.`);
          $('#ins-new-student-name').value = '';
          $('#ins-new-student-email').value = '';
        }
      } catch (e) {
        alert('Error al registrar estudiante.');
      }
    };
  }

  // Demo Guiada
  $('#demo').onclick = async () => {
    say('Iniciando simulación guiada para evaluación.');
    selectCircuit(0);
    await sleep(1200);
    next();
    await sleep(1000);
    next();
    await sleep(1000);
    S.err = true;
    render();
    say('Simulando polaridad invertida en el LED.');
    await sleep(1000);
    await diagnose();
    await sleep(2500);
    S.err = false;
    render();
    say('Corrigiendo polaridad.');
    next();
    await sleep(1000);
    await diagnose();
  };

  render();
});
