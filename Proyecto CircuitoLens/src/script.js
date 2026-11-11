/* ========================================================
   🔬 CircuitLens · Laboratorio de Electrónica Móvil
   Interfase No Convencional: AR + Voz + LLM Agnóstico + PWA
   Personalización Continua + Multiusuario + Diseño Emocional
   ======================================================== */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ========================================================
   1. Datos de Circuitos y Resistencias
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

const CIR = [
  [
    'Encender un LED',
    [
      W('#d22', 'p3', '6a'),
      Rz(330, '6b', '10b'),
      L('#e33', '10c', '14c'),
      W('#111', '14e', 'm14')
    ],
    'Un circuito cerrado elemental donde una resistencia de 330 Ω limita la corriente para no quemar el diodo LED rojo (caída típica de 1.8 V).'
  ],
  [
    'Dos LEDs en serie',
    [
      W('#d22', 'p3', '6a'),
      Rz(220, '6b', '10b'),
      L('#e33', '10c', '14c'),
      L('#3c3', '14d', '18d'),
      W('#111', '18e', 'm18')
    ],
    'Ambos LEDs comparten la misma corriente (malla única). Las tensiones directas se suman (1.8 V + 2.1 V = 3.9 V).'
  ],
  [
    'Pulsador + LED',
    [
      W('#d22', 'p3', '6a'),
      B('6b', '10b'),
      Rz(330, '10c', '14c'),
      L('#e33', '14d', '18d'),
      W('#111', '18e', 'm18')
    ],
    'El interruptor normalmente abierto interrumpe mecánicamente la trayectoria de corriente hacia el ánodo hasta ser presionado.'
  ],
  [
    'Divisor de tensión',
    [
      W('#d22', 'p3', '6a'),
      Rz(1000, '6b', '10b'),
      Rz(2200, '10c', '14c'),
      W('#111', '14d', 'm14'),
      W('#ea0', '10d', '16d')
    ],
    'Demostración de la Ley de Ohm: la tensión intermedia en el pin 10 es proporcional a R2 / (R1 + R2), ideal para alimentar sensores.'
  ],
  [
    'Dos ramas LED en paralelo',
    [
      W('#d22', 'p3', '6a'),
      Rz(330, '6b', '9b'),
      L('#e33', '9c', '13c'),
      Rz(220, '6d', '10d'),
      L('#3c3', '10e', '13e'),
      W('#111', '13a', 'm13')
    ],
    'Ramas independientes que comparten el mismo voltaje. Si un LED se desconecta, el otro permanece iluminado.'
  ]
];

/* ========================================================
   2. Motor de Audio Sintetizado (Earcons - Web Audio API)
   Diseño Visceral y Conductual de Don Norman
   ======================================================== */
const SoundEngine = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (!O('o-snd') || O('o-c')) return;
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
    if (!O('o-snd') || O('o-c')) return;
    // Arpegio Do-Mi-Sol mayor ascendente
    this.playTone(523.25, 0.12, 'triangle', 0.12);
    setTimeout(() => this.playTone(659.25, 0.12, 'triangle', 0.12), 100);
    setTimeout(() => this.playTone(783.99, 0.25, 'triangle', 0.15), 200);
  },
  playAlert() {
    if (!O('o-snd') || O('o-c')) return;
    // Tono de precaución suave no punitivo
    this.playTone(392.0, 0.15, 'sine', 0.15);
    setTimeout(() => this.playTone(329.63, 0.25, 'sine', 0.15), 120);
  },
  playClick() {
    // Clic mecánico al colocar un componente en el pin
    this.playTone(1200, 0.03, 'square', 0.05);
  },
  playMic() {
    // Tono de escucha activa
    this.playTone(440, 0.08, 'sine', 0.1);
    setTimeout(() => this.playTone(880, 0.12, 'sine', 0.12), 80);
  }
};

/* ========================================================
   2.5. Sistema de Autenticación RBAC y Conmutación de Cuentas
   Separa la experiencia entre Estudiante y Docente/Instructor
   ======================================================== */
const Auth = {
  user: {
    id: 'ALU-101',
    name: 'Piero Castillo',
    email: 'estudiante@uni.edu.pe',
    role: 'estudiante', // 'estudiante' | 'profesor'
    avatar: '🎓'
  },
  token: null,

  init() {
    try {
      const saved = localStorage.getItem('cl.auth_user');
      if (saved) {
        this.user = JSON.parse(saved);
      }
      this.token = localStorage.getItem('cl.auth_token') || null;
    } catch(e) {}
    this.applyRolePermissions();
    this.setupUI();
  },

  async login(email, role, name) {
    // Intentar login contra el backend si está activo
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
    } catch(e) {
      // Fallback local en frontend si no corre el backend Python
      this.user = {
        id: (role === 'profesor' ? 'DOC-' : 'ALU-') + Math.floor(100 + Math.random() * 900),
        name: name || (role === 'profesor' ? 'Prof. ' + email.split('@')[0] : email.split('@')[0]),
        email: email || 'usuario@uni.edu.pe',
        role: role || 'estudiante',
        avatar: role === 'profesor' ? '👨‍🏫' : '🎓'
      };
    }

    localStorage.setItem('cl.auth_user', JSON.stringify(this.user));
    UserProfile.data.id = this.user.id;
    UserProfile.data.alias = this.user.name;
    UserProfile.save();

    this.applyRolePermissions();
    if (this.user.role === 'profesor') {
      say('Bienvenido ' + this.user.name + '. Has ingresado al Panel Docente de Salas y Cohorte.');
      const insBtn = document.querySelector('nav button[data-t="ins"]');
      if (insBtn) insBtn.click();
    } else {
      say('Bienvenido ' + this.user.name + '. Has ingresado al Laboratorio AR de Estudiante.');
      const estBtn = document.querySelector('nav button[data-t="est"]');
      if (estBtn) estBtn.click();
    }
    MultiUser.broadcastStudentStatus();
  },

  applyRolePermissions() {
    const isDoc = this.user.role === 'profesor';
    
    // Actualizar badge de usuario en la cabecera
    const badge = $('#user-badge');
    if (badge) {
      badge.innerHTML = `${this.user.avatar} ${this.user.name} <small style="opacity:0.75; font-size:11px;">(${isDoc ? 'Docente' : 'Estudiante'})</small>`;
      badge.style.borderColor = isDoc ? 'var(--ac2)' : 'var(--ac)';
    }

    // Filtrar visibilidad de pestañas según rol (Diferenciación de apartados)
    $$('nav button').forEach(btn => {
      const tabId = btn.dataset.t;
      if (isDoc) {
        // El docente ve: Panel Docente (ins), Institución (org) y Ajustes (aju)
        if (tabId === 'est' || tabId === 'prf') {
          btn.style.display = 'none';
        } else {
          btn.style.display = 'inline-block';
        }
      } else {
        // El estudiante ve: Laboratorio AR (est), Mi Perfil (prf) y Ajustes (aju)
        if (tabId === 'ins' || tabId === 'org') {
          btn.style.display = 'none';
        } else {
          btn.style.display = 'inline-block';
        }
      }
    });

    // Asegurar que la vista activa corresponda al rol
    const activeTab = document.querySelector('.tab.on');
    if (isDoc && (activeTab && (activeTab.id === 'est' || activeTab.id === 'prf'))) {
      const insBtn = document.querySelector('nav button[data-t="ins"]');
      if (insBtn) insBtn.click();
    } else if (!isDoc && (activeTab && (activeTab.id === 'ins' || activeTab.id === 'org'))) {
      const estBtn = document.querySelector('nav button[data-t="est"]');
      if (estBtn) estBtn.click();
    }
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

    // Clic en tarjetas de cuentas rápidas
    $$('.account-card').forEach(card => {
      card.onclick = async () => {
        const role = card.dataset.role;
        const email = card.dataset.email;
        const name = card.dataset.name;
        await this.login(email, role, name);
        if (modal) modal.style.display = 'none';
      };
    });

    // Login personalizado
    const btnCustom = $('#btn-custom-login');
    if (btnCustom) {
      btnCustom.onclick = async () => {
        const name = $('#custom-name').value.trim() || 'Usuario';
        const role = $('#custom-role').value;
        const email = name.toLowerCase().replace(/\s+/g, '.') + '@uni.edu.pe';
        await this.login(email, role, name);
        if (modal) modal.style.display = 'none';
      };
    }
  }
};

/* ========================================================
   3. Perfil de Usuario Persistente y Personalización Continua
   Requisito PC3: Preferencias, Ritmo, Errores y Emociones
   ======================================================== */
const UserProfile = {
  data: {
    id: 'ALU-' + Math.floor(1000 + Math.random() * 9000),
    alias: 'Estudiante',
    preferencias: {
      tono: 'empatico', // empatico | socratico | tecnico
      nivel: 'auto',    // auto | basica | detallada
      velocidadVoz: 1.0,
      audioFeedback: true
    },
    ritmo: {
      tiemposPorPaso: [], // en segundos
      promedioSeg: 20,
      clasificacion: 'Constante', // Pausado | Constante | Ágil
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
      declarada: 'motivado', // motivado | concentrado | frustrado | confiado | cansado
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
      const saved = localStorage.getItem('cl.profile_v3');
      if (saved) {
        this.data = Object.assign(this.data, JSON.parse(saved));
      }
    } catch (e) {}
    this.updateUI();
  },

  save() {
    try {
      localStorage.setItem('cl.profile_v3', JSON.stringify(this.data));
    } catch (e) {}
    this.updateUI();
  },

  reset() {
    localStorage.removeItem('cl.profile_v3');
    localStorage.removeItem('cl.p');
    this.data.errores = { polaridad_led: 0, resistencia_omitida: 0, pin_desalineado: 0, total: 0, porCircuito: {} };
    this.data.circuitos = { done: {}, latencias: [] };
    this.data.ritmo.tiemposPorPaso = [];
    this.data.emociones.declarada = 'motivado';
    this.data.emociones.inferida = 'Enfocado';
    this.save();
  },

  recordStepTime() {
    const now = Date.now();
    const diff = Math.max(2, Math.round((now - this.data.ritmo.ultimoTimestampPaso) / 1000));
    this.data.ritmo.tiemposPorPaso.push(diff);
    this.data.ritmo.ultimoTimestampPaso = now;

    // Calcular promedio móvil y ritmo
    const arr = this.data.ritmo.tiemposPorPaso;
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    this.data.ritmo.promedioSeg = avg;

    if (avg < 12) this.data.ritmo.clasificacion = 'Ágil (Rápido)';
    else if (avg <= 28) this.data.ritmo.clasificacion = 'Constante';
    else this.data.ritmo.clasificacion = 'Pausado y reflexivo';

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
    this.data.emociones.historial.push({ t: Date.now(), emo, source: 'declarada' });
    this.save();
    MultiUser.broadcastStudentStatus();
  },

  inferEmotion() {
    const errsInCur = this.data.errores.porCircuito[S.ci] || 0;
    const avgTime = this.data.ritmo.promedioSeg;

    if (errsInCur >= 2) {
      this.data.emociones.inferida = 'Frustrado / Bloqueado';
    } else if (errsInCur === 1) {
      this.data.emociones.inferida = 'Confundido / Cauteloso';
    } else if (avgTime < 14) {
      this.data.emociones.inferida = 'Confiado / Fluido';
    } else {
      this.data.emociones.inferida = 'Concentrado';
    }
  },

  getExplanationLevel() {
    if (this.data.preferencias.nivel === 'basica') return 'básica';
    if (this.data.preferencias.nivel === 'detallada') return 'detallada';
    // Auto: si tiene 2 o más errores en este circuito, requiere explicación detallada
    const errs = this.data.errores.porCircuito[S.ci] || 0;
    return errs >= 2 ? 'detallada' : 'básica';
  },

  getAffectiveTone() {
    return this.data.preferencias.tono || 'empatico';
  },

  updateUI() {
    // Actualizar badges en vista estudiante
    if ($('#pace-badge')) {
      $('#pace-badge').textContent = `Ritmo: ${this.data.ritmo.clasificacion} (~${this.data.ritmo.promedioSeg}s)`;
    }
    // Actualizar botones de emoción activa
    $$('#emo-picker .emotion-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.emo === this.data.emociones.declarada);
    });
    // Actualizar pestaña Perfil
    if ($('#prf-pace')) $('#prf-pace').textContent = this.data.ritmo.clasificacion;
    if ($('#prf-pace-detail')) $('#prf-pace-detail').textContent = `~${this.data.ritmo.promedioSeg}s por componente`;
    const doneCount = Object.keys(this.data.circuitos.done).length;
    if ($('#prf-done')) $('#prf-done').textContent = `${doneCount} / 5`;
    const totalSteps = Math.max(1, this.data.ritmo.tiemposPorPaso.length);
    const acc = Math.max(0, Math.min(100, Math.round((1 - this.data.errores.total / (totalSteps + this.data.errores.total)) * 100)));
    if ($('#prf-acc')) $('#prf-acc').textContent = acc + '%';
    if ($('#prf-err-count')) $('#prf-err-count').textContent = `${this.data.errores.total} errores registrados`;
    if ($('#prf-emo')) {
      const emojiMap = { motivado: '😊 Motivado', concentrado: '🤔 Concentrado', frustrado: '😓 Frustrado', confiado: '⚡ Confiado', cansado: '😴 Cansado' };
      $('#prf-emo').textContent = emojiMap[this.data.emociones.declarada] || '😊 Motivado';
    }
    if ($('#prf-emo-inferred')) $('#prf-emo-inferred').textContent = `Inferido: ${this.data.emociones.inferida}`;

    // Mapa de errores
    if ($('#prf-errors-list')) {
      const errList = [];
      if (this.data.errores.polaridad_led > 0) {
        errList.push(`<li><b>Polaridad LED invertida (${this.data.errores.polaridad_led} veces):</b> Recuerda que la patita más larga del LED es el ánodo (+) y siempre se orienta hacia el potencial positivo.</li>`);
      }
      if (this.data.errores.resistencia_omitida > 0) {
        errList.push(`<li><b>Resistencia limitadora omitida (${this.data.errores.resistencia_omitida} veces):</b> Un LED sin resistencia limitadora en serie corre el riesgo de quemarse por sobrecorriente.</li>`);
      }
      if (errList.length === 0) {
        $('#prf-errors-list').innerHTML = '<p style="font-size:14px; color:var(--ac);">¡Excelente precisión! No se han detectado errores críticos en tus montajes.</p>';
      } else {
        $('#prf-errors-list').innerHTML = `<ul style="font-size:14px; padding-left:20px;">${errList.join('')}</ul>`;
      }
    }
  }
};

/* ========================================================
   4. Carga Dinámica de Configuración de Entorno (.env)
   Capa agnóstica para API Keys sin romper la app local
   ======================================================== */
const ENV_CONFIG = {
  DEFAULT_LLM_PROVIDER: 'sim',
  GEMINI_API_KEY: '',
  ANTHROPIC_API_KEY: '',
  OPENAI_API_KEY: '',
  OLLAMA_HOST: 'http://localhost:11434',
  OLLAMA_MODEL: 'llama3.2-vision',
  DEFAULT_ROOM_ID: 'SALA-ELECTRO-1'
};

async function loadEnvConfig() {
  const envPaths = ['../.env', '/.env', '.env'];
  let loaded = false;

  for (const path of envPaths) {
    try {
      const resp = await fetch(path);
      if (resp.ok) {
        const text = await resp.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
          if (match && !match[1].startsWith('#')) {
            const key = match[1];
            const val = match[2].replace(/^["']|["']$/g, '');
            ENV_CONFIG[key] = val;
          }
        }
        loaded = true;
        break;
      }
    } catch (e) {}
  }

  // Si hay claves guardadas en localStorage, prevalecen o se sincronizan
  const savedKey = localStorage.getItem('cl.key');
  if (savedKey) ENV_CONFIG.CUSTOM_KEY = savedKey;

  const statusEl = $('#env-status');
  if (statusEl) {
    if (loaded) {
      statusEl.innerHTML = `✅ <b>Variables de entorno cargadas desde .env</b> (Proveedor por defecto: <code>${ENV_CONFIG.DEFAULT_LLM_PROVIDER}</code>)`;
    } else {
      statusEl.innerHTML = `ℹ️ <b>Archivo .env detectado o en modo cliente puro.</b> Puedes ingresar tus claves manualmente en el campo inferior o configurar el archivo .env.`;
    }
  }

  // Pre-cargar valores en la UI
  if (ENV_CONFIG.DEFAULT_LLM_PROVIDER && $('#pv')) {
    $('#pv').value = ENV_CONFIG.DEFAULT_LLM_PROVIDER;
    S.prov = ENV_CONFIG.DEFAULT_LLM_PROVIDER;
  }
  if (ENV_CONFIG.CUSTOM_KEY && $('#ky')) {
    $('#ky').value = ENV_CONFIG.CUSTOM_KEY;
    S.key = ENV_CONFIG.CUSTOM_KEY;
  } else if (ENV_CONFIG.GEMINI_API_KEY && $('#ky')) {
    $('#ky').value = ENV_CONFIG.GEMINI_API_KEY;
    S.key = ENV_CONFIG.GEMINI_API_KEY;
  }
}

/* ========================================================
   5. Estado Global de la Simulación y Renderizado AR
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

let ANN = []; // Anotaciones del instructor en tiempo real

const O = (id) => {
  const el = $('#' + id);
  return el ? el.checked : false;
};

const cir = () => CIR[S.ci][1];
const lvl = () => UserProfile.getExplanationLevel();

function xy(p) {
  let m = /^([pm])(\d+)$/.exec(p);
  if (m) return [40 + m[2] * 26, m[1] == 'p' ? 26 : 44];
  m = /^(\d+)([a-j])$/.exec(p);
  const r = 'abcdefghij'.indexOf(m[2]);
  return [40 + m[1] * 26, r < 5 ? 80 + r * 20 : 176 + (r - 5) * 20];
}

function comp(s, g) {
  const [x1, y1] = xy(s.a);
  const [x2, y2] = xy(s.b);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const an = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const d = g ? ' stroke-dasharray="5 4"' : '';

  let o = `<g opacity="${g ? 0.45 : 1}">`;
  if (s.k == 'wire') {
    return o + `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${s.c}" stroke-width="4" stroke-linecap="round" fill="none"${d}/></g>`;
  }

  o += `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#bbb" stroke-width="2"${d}/><g transform="translate(${mx} ${my}) rotate(${an})">`;

  if (s.k == 'res') {
    o +=
      `<rect x="-20" y="-7" width="40" height="14" rx="5" fill="#d9b779" stroke="#333"/>` +
      BAND[s.v][3]
        .map((c, i) => `<rect x="${-12 + i * 9}" y="-7" width="4" height="14" fill="${c}"/>`)
        .join('');
  }
  if (s.k == 'led') {
    // Si el circuito está completo y sin error, encender el LED con resplandor (Norman Visceral)
    const isLit = !g && S.placed === cir().length && !S.err;
    const glowClass = isLit ? (s.c === '#e33' ? 'led-glow-red' : 'led-glow-green') : '';
    o += `<circle class="${glowClass}" r="10" fill="${s.c}" stroke="#fff" stroke-width="2"/>`;
  }
  if (s.k == 'btn') {
    o += `<rect x="-12" y="-12" width="24" height="24" rx="4" fill="#555" stroke="#fff"/><circle r="6" fill="#999"/>`;
  }
  o += '</g>';

  if (s.k == 'led') {
    const sw = S.err;
    o += `<text x="${x1 + (x2 - x1) * 0.2}" y="${y1 + (y2 - y1) * 0.2 - 6}" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">${sw ? '−' : '+'}</text><text x="${x1 + (x2 - x1) * 0.8}" y="${y1 + (y2 - y1) * 0.8 - 6}" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">${sw ? '+' : '−'}</text>`;
  }
  if (s.k == 'res' && O('o-d')) {
    const t = `${val(s.v)} (${BAND[s.v].slice(0, 3).join('-')})`;
    o += `<rect x="${mx - 80}" y="${my - 34}" width="160" height="20" rx="5" fill="#000" stroke="#ff0"/><text x="${mx}" y="${my - 19}" fill="#ff0" font-size="13" font-weight="700" text-anchor="middle">${t}</text>`;
  }
  return o + '</g>';
}

function draw(el, isInstructorView = false) {
  let h = '<rect width="600" height="280" fill="#2a3b4d" rx="8"/>';
  for (let c = 1; c <= 20; c++) {
    for (const p of ['p' + c, 'm' + c]) {
      const [x, y] = xy(p);
      h += `<circle cx="${x}" cy="${y}" r="3" fill="${p[0] == 'p' ? '#e55' : '#58f'}"/>`;
    }
    for (const r of 'abcdefghij') {
      const [x, y] = xy(c + r);
      h += `<circle cx="${x}" cy="${y}" r="3" fill="#0a121b"/>`;
    }
  }
  h += `<text x="8" y="30" fill="#e55" font-size="12" font-weight="bold">+</text><text x="8" y="48" fill="#58f" font-size="12" font-weight="bold">−</text>`;
  const st = cir();
  st.forEach((s, i) => {
    if (i < S.placed) h += comp(s, 0);
  });
  if (S.placed < st.length) {
    const s = st[S.placed];
    h += comp(s, 1);
    for (const p of [s.a, s.b]) {
      const [x, y] = xy(p);
      h += `<circle class="ring" data-pin="${p}" cx="${x}" cy="${y}" r="10" fill="none" stroke="#3f6" stroke-width="3" title="Toca para insertar componente"/>`;
    }
  }
  ANN.forEach((a) => {
    h += `<circle cx="${a.x}" cy="${a.y}" r="18" fill="rgba(255, 50, 50, 0.25)" stroke="#f33" stroke-width="4"/>`;
    h += `<circle cx="${a.x}" cy="${a.y}" r="4" fill="#f33"/>`;
  });
  el.innerHTML = h;
  el.style.filter = S.focus < 30 ? 'blur(6px)' : 'none';
}

function render() {
  draw($('#bd'));
  draw($('#ib'), true);
  $('#lvl').textContent = 'Explicación: ' + lvl();
  const doneCount = Object.keys(UserProfile.data.circuitos.done).length;
  $('#prog').textContent = `Paso ${Math.min(S.placed + 1, cir().length)}/${cir().length} · completados ${doneCount}/5`;
  $('#st').innerHTML = cir()
    .map(
      (s, i) =>
        `<li class="${i < S.placed ? 'done' : i == S.placed ? 'cur' : ''}">${i < S.placed ? '✔ ' : ''}${s.l}</li>`
    )
    .join('');
  $('#er').setAttribute('aria-pressed', S.err);

  // Mostrar u ocultar tarjeta reflexiva si completó el circuito
  const isFinished = S.placed === cir().length && !S.err;
  const reflCard = $('#refl-card');
  if (reflCard) {
    if (isFinished) {
      reflCard.style.display = 'block';
      $('#refl-text').textContent = CIR[S.ci][2];
      const avgPace = UserProfile.data.ritmo.promedioSeg;
      $('#refl-stats').textContent = `Ritmo: ~${avgPace}s/paso · Estado: ${UserProfile.data.emociones.declarada}`;
    } else {
      reflCard.style.display = 'none';
    }
  }
}

/* ========================================================
   6. Asistencia por Voz y Subtítulos Accesibles
   Web Speech API + Visualizador de Onda Dinámico
   ======================================================== */
function say(m, alertType = 0) {
  const c = $('#cap');
  c.innerHTML = '<b>CircuitLens:</b> ' + m;
  $('#log').insertAdjacentHTML('afterbegin', `<div><b>CircuitLens:</b> ${m}</div>`);

  // Activar visualizador de onda
  const wave = $('#v-wave');
  if (wave) wave.classList.add('active');

  if (alertType === 1) {
    SoundEngine.playAlert();
  } else if (alertType === 2) {
    SoundEngine.playSuccess();
  }

  if (O('o-t') && window.speechSynthesis) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(m);
      u.lang = 'es-PE';
      u.rate = UserProfile.data.preferencias.velocidadVoz || 1.0;
      u.onend = () => {
        if (wave) wave.classList.remove('active');
      };
      speechSynthesis.speak(u);
    } catch (e) {
      if (wave) wave.classList.remove('active');
    }
  } else {
    setTimeout(() => {
      if (wave) wave.classList.remove('active');
    }, 2000);
  }

  if (alertType === 1 && O('o-m') && navigator.vibrate) {
    navigator.vibrate([120, 60, 120]);
  }
}

const userLog = (t) => {
  $('#log').insertAdjacentHTML('afterbegin', `<div><b>Tú:</b> ${t}</div>`);
  $('#cap').innerHTML = '<b>Tú:</b> ' + t;
};

/* ========================================================
   7. Capa de Abstracción LLM Agnóstica y Resiliente
   Soporte: Simulado Local, Google Gemini, Claude, OpenAI, Ollama
   Fallback automático a Simulado en caso de timeout (>2.5s)
   ======================================================== */
const LLM = {
  // 1. Motor Heurístico Simulado Local (< 350 ms, 100% offline)
  async sim(f) {
    await sleep(280);
    const n = CIR[f.ci][1].length;
    const b = lvl();
    const tone = UserProfile.getAffectiveTone();
    const emo = UserProfile.data.emociones.declarada;

    if (f.focus < 30) {
      return { k: 'blur', m: 'La cámara parece estar desenfocada. Ajusta el enfoque para poder inspeccionar los pines del protoboard.' };
    }

    if (f.err) {
      UserProfile.recordError('polaridad_led', f.ci);
      let expl = '';
      if (tone === 'empatico') {
        expl = 'No te preocupes, la polaridad invertida en diodos es el tropiezo más común. El LED está al revés: conecta el ánodo (pata larga) hacia el potencial positivo (+) y el cátodo hacia tierra (−). ¡Vamos de nuevo!';
      } else if (tone === 'socratico') {
        expl = 'Observa las patitas del LED: ¿hacia qué riel está orientada la pata más larga? Recuerda que el diodo solo permite flujo de corriente en sentido ánodo a cátodo.';
      } else {
        expl = 'Error de polaridad invertida: el diodo LED se encuentra en polarización inversa. Conmuta los terminales en los pines 10c y 14c para cerrar la malla.';
      }
      return { k: 'err', m: expl };
    }

    if (f.placed < n) {
      const nextStep = CIR[f.ci][1][f.placed];
      return { k: 'miss', m: `Vas muy bien. El siguiente componente a montar es: ${nextStep.l}.` };
    }

    // Circuito completo
    return {
      k: 'ok',
      m: tone === 'empatico'
        ? `¡Brillante trabajo! Has montado el circuito «${CIR[f.ci][0]}» a la perfección. La corriente fluye correctamente.`
        : `Montaje validado exitosamente. Parámetros de continuidad y polaridad conformes a diseño.`
    };
  },

  // 2. Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
  async gemini(f) {
    const apiKey = S.key || ENV_CONFIG.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Falta API Key de Gemini');
    const prompt = `Eres CircuitLens, asistente pedagógico en electrónica. Diagnostica en español el circuito "${CIR[f.ci][0]}". Estado: ${f.placed}/${CIR[f.ci][1].length} pasos colocados, polaridad invertida LED: ${f.err}, enfoque: ${f.focus}%. Tono: ${UserProfile.getAffectiveTone()}, emoción del estudiante: ${UserProfile.data.emociones.declarada}. Responde en 2 frases pedagógicas afectivas.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!resp.ok) throw new Error('Error en Gemini: ' + resp.status);
    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respuesta vacía de Gemini');
    return { k: f.err ? 'err' : (f.placed < CIR[f.ci][1].length ? 'miss' : 'ok'), m: text.trim() };
  },

  // 3. Anthropic Claude API
  async claude(f) {
    const apiKey = S.key || ENV_CONFIG.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Falta API Key de Claude');
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 180,
        messages: [{
          role: 'user',
          content: `Eres CircuitLens, asistente pedagógico para protoboards. Diagnostica en español conciso el circuito "${CIR[f.ci][0]}": colocados ${f.placed}/${CIR[f.ci][1].length}, error polaridad: ${f.err}, enfoque: ${f.focus}%. Responde con empatía y pedagogía.`
        }]
      })
    });
    if (!resp.ok) throw new Error('Error en Claude: ' + resp.status);
    const d = await resp.json();
    return { k: f.err ? 'err' : (f.placed < CIR[f.ci][1].length ? 'miss' : 'ok'), m: d.content[0].text };
  },

  // 4. OpenAI API (gpt-4o-mini)
  async openai(f) {
    const apiKey = S.key || ENV_CONFIG.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Falta API Key de OpenAI');
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 160,
        messages: [
          { role: 'system', content: `Eres CircuitLens, tutor de electrónica. Diagnostica en español conciso y afectivo el montaje en protoboard.` },
          { role: 'user', content: `Circuito: ${CIR[f.ci][0]}. Componentes montados: ${f.placed}/${CIR[f.ci][1].length}. Error polaridad: ${f.err}. Enfoque: ${f.focus}%.` }
        ]
      })
    });
    if (!resp.ok) throw new Error('Error en OpenAI: ' + resp.status);
    const d = await resp.json();
    return { k: f.err ? 'err' : (f.placed < CIR[f.ci][1].length ? 'miss' : 'ok'), m: d.choices[0].message.content };
  },

  // 5. Ollama Local Multimodal
  async ollama(f) {
    const endpoint = $('#ollama-url')?.value || ENV_CONFIG.OLLAMA_HOST || 'http://localhost:11434';
    const resp = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: ENV_CONFIG.OLLAMA_MODEL || 'llama3.2-vision',
        prompt: `Diagnostica en español conciso el protoboard: ${JSON.stringify(f)}`,
        stream: false
      })
    });
    if (!resp.ok) throw new Error('Error en Ollama: ' + resp.status);
    const data = await resp.json();
    return { k: f.err ? 'err' : (f.placed < CIR[f.ci][1].length ? 'miss' : 'ok'), m: data.response };
  },

  // Enrutador desacoplado con Fallback Resiliente (< 2.5s)
  async run(f) {
    if (S.prov && S.prov !== 'sim') {
      try {
        return await Promise.race([
          this[S.prov](f),
          sleep(2500).then(() => {
            throw new Error('Timeout proveedor LLM (> 2.5s)');
          })
        ]);
      } catch (e) {
        console.warn('[CircuitLens LLM] Fallback activado:', e.message);
        f.fb = 1;
      }
    }
    return this.sim(f);
  }
};

async function diagnose() {
  const t = performance.now();
  const f = { ci: S.ci, placed: S.placed, err: S.err, focus: S.focus };
  S.prov = $('#pv').value;

  const r = await LLM.run(f);
  const ms = Math.round(performance.now() - t);

  if (r.k === 'ok') {
    say(r.m, 2);
    celebrate();
    UserProfile.data.circuitos.done[S.ci] = true;
    UserProfile.save();
  } else if (r.k === 'err') {
    UserProfile.recordError('polaridad_led', S.ci);
    say(r.m, 1);
  } else {
    say(r.m, 0);
  }

  if (f.fb) {
    $('#log').insertAdjacentHTML('afterbegin', '<div><small style="color:var(--warn)">⚡ Proveedor remoto no disponible o timeout: se activó el motor simulado local.</small></div>');
  }
  $('#log').insertAdjacentHTML('afterbegin', `<div><small>Diagnóstico completado en ${ms} ms (meta SLA &lt; 3 s)</small></div>`);

  UserProfile.data.circuitos.latencias.push(ms);
  UserProfile.save();
  MultiUser.broadcastStudentStatus();
  render();
}

function next() {
  const n = cir().length;
  if (S.placed < n) {
    SoundEngine.playClick();
    UserProfile.recordStepTime();
    S.placed++;
    render();
    if (S.placed < n) {
      say('Colocado. Siguiente: ' + cir()[S.placed].l);
    } else {
      say('Montaje físico completo. Di o pulsa «revisa mi circuito» para verificar la polaridad y continuidad.');
      SoundEngine.playSuccess();
    }
    MultiUser.broadcastStudentStatus();
  }
}

function handle(t) {
  t = t.toLowerCase().replace(/circuit\s?lens[,:]?/g, '').trim();
  if (!t) return say('Te escucho. Puedes decir: revisa mi circuito, siguiente, repite o cambiar de circuito.');
  userLog(t);

  if (/revis|no enciende|por qué|diagn|verific/.test(t)) {
    diagnose();
  } else if (/sigui|coloc|listo|avanz/.test(t)) {
    next();
  } else if (/repit|lee|resist|valor/.test(t)) {
    say(cir()[Math.min(S.placed, cir().length - 1)].l);
  } else if (/daltoni/.test(t)) {
    $('#o-d').click();
  } else if (/frustra|molest|no me sale/.test(t)) {
    UserProfile.setDeclaredEmotion('frustrado');
    say('Comprendo la frustración; la electrónica experimental requiere paciencia. ¿Quieres que revisemos juntos el circuito o pedir ayuda al profesor?', 1);
  } else if (/motiva|content|feliz/.test(t)) {
    UserProfile.setDeclaredEmotion('motivado');
    say('¡Esa es la actitud de un gran ingeniero! Sigamos con el montaje.', 2);
  } else if (/ayuda|docente|profesor/.test(t)) {
    $('#ask-help').click();
  } else if (/circuito\s*(1|uno)/.test(t)) {
    selectCircuit(0);
  } else if (/circuito\s*(2|dos)/.test(t)) {
    selectCircuit(1);
  } else if (/circuito\s*(3|tres)/.test(t)) {
    selectCircuit(2);
  } else if (/circuito\s*(4|cuatro)/.test(t)) {
    selectCircuit(3);
  } else if (/circuito\s*(5|cinco)/.test(t)) {
    selectCircuit(4);
  } else {
    say('Comandos disponibles: revisa mi circuito, siguiente paso, repite paso, o modo daltonismo.');
  }
}

function selectCircuit(index) {
  S.ci = index;
  S.placed = 0;
  S.err = false;
  $('#cs').value = index;
  render();
  say('Circuito seleccionado: ' + CIR[S.ci][0] + '. ' + cir()[0].l);
  MultiUser.broadcastStudentStatus();
}

/* ========================================================
   8. Reconocimiento de Voz Continuo y Push-to-Talk
   ======================================================== */
let rec = null;
let hands = false;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function listen(cont) {
  if (!SR) {
    say('Tu navegador no soporta reconocimiento de voz continuo. Puedes usar el cuadro de texto.');
    return;
  }
  try {
    rec && rec.stop();
  } catch (e) {}
  rec = new SR();
  rec.lang = 'es-PE';
  rec.continuous = cont;
  SoundEngine.playMic();

  rec.onresult = (e) => {
    const t = e.results[e.results.length - 1][0].transcript;
    if (!cont || /circuit\s?lens/i.test(t)) handle(t);
  };

  rec.onend = () => {
    if (hands) {
      try {
        rec.start();
      } catch (e) {}
    } else {
      $('#mic').classList.remove('on');
      $('#mic').setAttribute('aria-pressed', 'false');
    }
  };

  rec.onerror = () => {
    $('#mic').classList.remove('on');
  };

  rec.start();
}

/* ========================================================
   9. Multiusuario Colaborativo con Salas en Tiempo Real
   BroadcastChannel + LocalStorage Fallback (Cross-Tab / Cross-Window)
   ======================================================== */
const MultiUser = {
  channel: null,
  activeStudents: new Map(),

  init() {
    this.joinRoom(S.roomId);
    this.addSimulatedStudents();
    this.setupStorageSync();
  },

  joinRoom(roomId) {
    S.roomId = roomId;
    if ($('#room-pill')) $('#room-pill').textContent = 'Sala: ' + roomId;
    if ($('#ins-room-input')) $('#ins-room-input').value = roomId;

    if (this.channel) {
      try { this.channel.close(); } catch (e) {}
    }

    try {
      this.channel = new BroadcastChannel('circuitlens_' + roomId);
      this.channel.onmessage = (event) => this.handleMessage(event.data);
    } catch (e) {}

    this.broadcastStudentStatus();
    this.renderStudents();
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
      say(`El alumno ${msg.studentName || msg.studentId} ha solicitado ayuda en la sala.`, 1);
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
    try {
      localStorage.setItem('cl.sync_' + S.roomId, JSON.stringify(payload));
    } catch (e) {}
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

  addSimulatedStudents() {
    this.activeStudents.set('ALU-01', {
      studentId: 'ALU-01',
      studentName: 'Ana Ruiz',
      ci: 0,
      placed: 3,
      err: false,
      emotion: 'concentrado',
      pace: 'Constante',
      timestamp: Date.now()
    });
    this.activeStudents.set('ALU-02', {
      studentId: 'ALU-02',
      studentName: 'Carlos M.',
      ci: 1,
      placed: 2,
      err: true,
      emotion: 'frustrado',
      pace: 'Pausado',
      timestamp: Date.now()
    });
  },

  renderStudents() {
    const grid = $('#student-grid');
    if (!grid) return;
    const countBadge = $('#ins-students-count');
    if (countBadge) countBadge.textContent = `Alumnos activos: ${this.activeStudents.size}`;

    let html = '';
    this.activeStudents.forEach((st) => {
      const isCurrent = st.studentId === UserProfile.data.id;
      const statusClass = st.needsHelp ? 'help' : (st.err ? 'error' : 'normal');
      const statusText = st.needsHelp ? 'Pide ayuda 🙋' : (st.err ? 'LED invertido ⚠' : 'En progreso ✔');
      const emoIcons = { motivado: '😊', concentrado: '🤔', frustrado: '😓', confiado: '⚡', cansado: '😴' };
      const icon = emoIcons[st.emotion] || '😊';

      html += `
        <div class="student-card ${isCurrent ? 'active' : ''}" data-sid="${st.studentId}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b><span class="status-dot ${statusClass}"></span>${st.studentName} ${isCurrent ? '(Tú)' : ''}</b>
            <span style="font-size:12px;">${icon}</span>
          </div>
          <div style="font-size:13px; margin-top:4px; opacity:0.85;">
            Circuito: ${st.ci + 1} · Paso ${st.placed + 1}/4
          </div>
          <div style="font-size:12px; margin-top:2px; color:${st.err ? 'var(--bad)' : 'var(--ac)'};">
            ${statusText} (${st.pace || 'Normal'})
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  }
};

function ann(x, y, fromInstructor) {
  ANN.push({ x, y });
  render();
  if (fromInstructor) {
    say('Tu instructor marcó una anotación visual en tu protoboard.', 1);
    SoundEngine.playAlert();
  }
  setTimeout(() => {
    ANN.shift();
    render();
  }, 9000);
}

/* ========================================================
   10. Diseño Emocional: Celebración (Norman Visceral)
   ======================================================== */
function celebrate() {
  const c = $('#conf');
  if (!c) return;
  const g = c.getContext('2d');
  c.width = window.innerWidth;
  c.height = window.innerHeight;

  if (O('o-c') || window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    $('#cap').innerHTML += ' 🎉 ¡Completado!';
    return;
  }

  const ps = Array.from({ length: 130 }, () => ({
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
    if (++f < 140) requestAnimationFrame(t);
    else g.clearRect(0, 0, c.width, c.height);
  })();
}

/* ========================================================
   11. Analítica Institucional (Métricas de Cohorte)
   ======================================================== */
function metrics() {
  const d = [
    ['Circuito 1: LED básico', 22],
    ['Circuito 2: LEDs en serie', 17],
    ['Circuito 3: Pulsador + LED', 13],
    ['Circuito 4: Divisor de tensión', 9],
    ['Circuito 5: LEDs en paralelo', 6]
  ];
  if (UserProfile.data.circuitos.done[0]) d[0][1] = Math.min(24, d[0][1] + 1);

  const lats = UserProfile.data.circuitos.latencias;
  const avg = lats.length ? Math.round(lats.reduce((a, b) => a + b) / lats.length) + ' ms' : '348 ms';

  $('#mt').innerHTML =
    d.map(([n, v]) => `<div class="cmp"><span>${n}</span><div class="bar" style="width:${(v / 24) * 100}%"></div><b>${v}/24</b></div>`).join('') +
    `<p style="font-size:14px; margin-top:10px;">Tu progreso en esta sesión: <b>${Object.keys(UserProfile.data.circuitos.done).length} de 5</b> circuitos dominados. Latencia promedio de diagnóstico con IA: <b>${avg}</b> (meta SLA: &lt; 3 s).</p>`;
}

/* ========================================================
   12. Inicialización de Eventos y Manejadores del DOM
   ======================================================== */
window.addEventListener('DOMContentLoaded', async () => {
  Auth.init();
  UserProfile.load();
  await loadEnvConfig();
  MultiUser.init();

  // Registro de Service Worker para PWA Offline
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch((err) => {
      console.warn('Registro SW local:', err);
    });
  }

  // Detección de conectividad (Online / Offline)
  const updateOnlineStatus = () => {
    const netBadge = $('#net-badge');
    if (!netBadge) return;
    if (navigator.onLine) {
      netBadge.textContent = '📡 En línea';
      netBadge.className = 'badge success';
    } else {
      netBadge.textContent = '⚡ Modo Offline (PWA)';
      netBadge.className = 'badge offline';
      say('Estás desconectado. El motor de diagnóstico simulado local está activo y 100% operativo.', 0);
    }
  };
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // PWA Install Prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btnInstall = $('#pwa-install');
    if (btnInstall) {
      btnInstall.style.display = 'inline-flex';
      btnInstall.onclick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          btnInstall.style.display = 'none';
        }
        deferredPrompt = null;
      };
    }
  });

  // Selector de circuitos
  $('#cs').innerHTML = CIR.map((c, i) => `<option value="${i}">${i + 1}. ${c[0]}</option>`).join('');
  $('#cs').onchange = (e) => selectCircuit(+e.target.value);

  // Botones de acción del estudiante
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
      say('Se ha simulado el LED con polaridad invertida. Pulsa «Revisar circuito» para ver el diagnóstico.', 1);
    } else {
      say('Polaridad normal restaurada.');
    }
    MultiUser.broadcastStudentStatus();
  };

  $('#fo').oninput = (e) => {
    S.focus = +e.target.value;
    render();
  };

  // Ayuda del docente
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
    say('Has solicitado asistencia a tu instructor en la sala. Se le ha enviado una notificación visual.', 0);
    SoundEngine.playAlert();
  };

  // Botón siguiente desde tarjeta reflexiva
  const reflBtn = $('#refl-btn-next');
  if (reflBtn) {
    reflBtn.onclick = () => {
      if (S.ci < CIR.length - 1) {
        selectCircuit(S.ci + 1);
      } else {
        say('¡Has completado los 5 circuitos del laboratorio! Felicitaciones por tu maestría experimental.', 2);
      }
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
      say('Cámara conectada en vivo. Superponiendo guías de realidad aumentada sobre tu protoboard.');
    } catch (e) {
      say('No se pudo acceder a la cámara física; se mantiene el protoboard simulado.');
    }
  };

  // Interacción táctil con pines del protoboard (Colocar tocando los anillos verdes)
  $('#bd').onclick = (e) => {
    const el = e.target;
    if (el.classList && el.classList.contains('ring')) {
      next();
    }
  };

  // Micrófono y reconocimiento de voz
  $('#mic').onclick = () => {
    $('#mic').classList.add('on');
    $('#mic').setAttribute('aria-pressed', 'true');
    listen(false);
  };

  $('#o-f').onchange = (e) => {
    hands = e.target.checked;
    if (hands) {
      say('Modo manos libres activado. Di «CircuitLens, revisa mi circuito» o «CircuitLens, siguiente paso».');
      listen(true);
    } else {
      try { rec.stop(); } catch (x) {}
    }
  };

  // Entrada por texto
  $('#sd').onclick = () => {
    handle($('#tx').value);
    $('#tx').value = '';
  };
  $('#tx').onkeydown = (e) => {
    if (e.key === 'Enter') $('#sd').click();
  };

  // Selectores de emoción declarada (Diseño Emocional de Norman)
  $$('#emo-picker .emotion-btn').forEach((btn) => {
    btn.onclick = () => {
      const emo = btn.dataset.emo;
      UserProfile.setDeclaredEmotion(emo);
      const ackMap = {
        motivado: '¡Excelente entusiasmo! Vamos con todo en este montaje.',
        concentrado: 'Modo de máxima concentración activo. Continúa con precisión.',
        frustrado: 'Es completamente normal tener dudas con los circuitos. Estoy aquí para guiarte paso a paso.',
        confiado: '¡Gran seguridad! Probemos tus habilidades con este circuito.',
        cansado: 'Tómate tu tiempo y respira; la electrónica requiere pausas y calma.'
      };
      say(ackMap[emo] || 'Estado anímico actualizado.');
    };
  });

  // Navegación entre pestañas
  $$('nav button').forEach((b) => {
    b.onclick = () => {
      $$('nav button').forEach((x) => x.setAttribute('aria-selected', x === b));
      $$('.tab').forEach((t) => t.classList.toggle('on', t.id === b.dataset.t));
      if (b.dataset.t === 'org') metrics();
      if (b.dataset.t === 'prf') UserProfile.updateUI();
    };
  });

  // Opciones de accesibilidad
  $('#o-h').onchange = (e) => document.body.classList.toggle('hc', e.target.checked);
  $('#o-c').onchange = (e) => document.body.classList.toggle('calm', e.target.checked);
  $('#o-d').onchange = () => {
    render();
    say(O('o-d') ? 'Modo daltonismo activo. Las resistencias indican su valor en texto numérico.' : 'Modo daltonismo desactivado.');
  };

  // Configuración de Proveedores LLM
  $('#pv').onchange = (e) => {
    S.prov = e.target.value;
    const isOllama = S.prov === 'ollama';
    const isSim = S.prov === 'sim';
    if ($('#lbl-ollama-url')) $('#lbl-ollama-url').style.display = isOllama ? 'flex' : 'none';
    if ($('#lbl-api-key')) $('#lbl-api-key').style.display = isSim || isOllama ? 'none' : 'flex';
  };
  $('#pv').dispatchEvent(new Event('change'));

  $('#ky').oninput = (e) => {
    S.key = e.target.value.trim();
    localStorage.setItem('cl.key', S.key);
  };

  // Preferencias de perfil pedagógico
  if ($('#prf-tone-sel')) {
    $('#prf-tone-sel').value = UserProfile.data.preferencias.tono;
    $('#prf-tone-sel').onchange = (e) => {
      UserProfile.data.preferencias.tono = e.target.value;
      UserProfile.save();
      say('Tono del asistente actualizado a: ' + e.target.options[e.target.selectedIndex].text);
    };
  }

  if ($('#prf-lvl-sel')) {
    $('#prf-lvl-sel').value = UserProfile.data.preferencias.nivel;
    $('#prf-lvl-sel').onchange = (e) => {
      UserProfile.data.preferencias.nivel = e.target.value;
      UserProfile.save();
      render();
    };
  }

  // Borrar datos locales
  $('#rs').onclick = () => {
    if (confirm('¿Deseas reiniciar tu perfil continuo de aprendizaje y borrar los datos locales?')) {
      UserProfile.reset();
      S.placed = 0;
      S.err = false;
      render();
      say('Perfil de usuario y métricas locales reiniciados.');
    }
  };

  // Controles del Instructor
  $('#ib').onclick = (e) => {
    const r = $('#ib').getBoundingClientRect();
    const x = ((e.clientX - r.left) * 600) / r.width;
    const y = ((e.clientY - r.top) * 280) / r.height;
    if (MultiUser.channel) {
      MultiUser.channel.postMessage({ t: 'draw', x, y });
    }
    ann(x, y, 0);
  };

  $('#clr').onclick = () => {
    ANN = [];
    if (MultiUser.channel) {
      MultiUser.channel.postMessage({ t: 'clear' });
    }
    render();
  };

  // Enviar pistas afectivas del docente
  const sendTeacherNudge = (text) => {
    if (MultiUser.channel) {
      MultiUser.channel.postMessage({ t: 'teacher_nudge', text });
    }
    say(`Pista enviada a la sala: «${text}»`);
  };

  $('#btn-nudge-led').onclick = () => sendTeacherNudge('Revisa la pata larga del LED (ánodo hacia el positivo)');
  $('#btn-nudge-res').onclick = () => sendTeacherNudge('Verifica el valor de la resistencia y sus bandas de color');
  $('#btn-nudge-praise').onclick = () => sendTeacherNudge('¡Excelente ritmo de trabajo! Tu circuito se ve limpio.');

  $('#btn-send-ins-msg').onclick = () => {
    const input = $('#ins-msg-input');
    if (input.value.trim()) {
      sendTeacherNudge(input.value.trim());
      input.value = '';
    }
  };

  // Cambio de Sala Multiusuario
  $('#btn-change-room').onclick = () => {
    const input = $('#ins-room-input');
    const newRoom = input.value.trim().toUpperCase() || 'SALA-ELECTRO-1';
    MultiUser.joinRoom(newRoom);
    say(`Te has unido a la sala: ${newRoom}`);
  };

  $('#btn-copy-room').onclick = () => {
    const url = window.location.origin + window.location.pathname + '?sala=' + S.roomId;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        say('Enlace de la sala copiado al portapapeles.');
      });
    } else {
      prompt('Copia este enlace de sala:', url);
    }
  };

  // Simulación guiada para presentación rápida (Demo automatizado)
  $('#demo').onclick = async () => {
    say('Iniciando simulación guiada para presentación.');
    selectCircuit(0);
    await sleep(1400);
    next();
    await sleep(1200);
    next();
    await sleep(1200);
    S.err = false;
    next();
    await sleep(1000);
    S.err = true;
    render();
    await sleep(1000);
    userLog('CircuitLens, revisa mi circuito');
    await diagnose();
    await sleep(3500);
    S.err = false;
    render();
    next();
    await sleep(1200);
    userLog('CircuitLens, revisa mi circuito');
    await diagnose();
  };

  render();
});
