const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  l: `Cable ${{ '#d22': 'rojo', '#111': 'negro', '#ea0': 'amarillo' }[c]}: ${pn(a)} → ${pn(b)}`
});

const Rz = (v, a, b) => ({
  k: 'res',
  v,
  a,
  b,
  l: `Resistencia ${val(v)}: ${pn(a)} → ${pn(b)}`
});

const L = (c, a, b) => ({
  k: 'led',
  c,
  a,
  b,
  l: `LED ${c == '#e33' ? 'rojo' : 'verde'}: ánodo(+) en ${pn(a)}, cátodo(−) en ${pn(b)}`
});

const B = (a, b) => ({
  k: 'btn',
  a,
  b,
  l: `Pulsador: ${pn(a)} → ${pn(b)}`
});

const CIR = [
  [
    'Encender un LED',
    [
      W('#d22', 'p3', '6a'),
      Rz(330, '6b', '10b'),
      L('#e33', '10c', '14c'),
      W('#111', '14e', 'm14')
    ]
  ],
  [
    'Dos LEDs en serie',
    [
      W('#d22', 'p3', '6a'),
      Rz(220, '6b', '10b'),
      L('#e33', '10c', '14c'),
      L('#3c3', '14d', '18d'),
      W('#111', '18e', 'm18')
    ]
  ],
  [
    'Pulsador + LED',
    [
      W('#d22', 'p3', '6a'),
      B('6b', '10b'),
      Rz(330, '10c', '14c'),
      L('#e33', '14d', '18d'),
      W('#111', '18e', 'm18')
    ]
  ],
  [
    'Divisor de tensión',
    [
      W('#d22', 'p3', '6a'),
      Rz(1000, '6b', '10b'),
      Rz(2200, '10c', '14c'),
      W('#111', '14d', 'm14'),
      W('#ea0', '10d', '16d')
    ]
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
    ]
  ]
];

let P = { err: {}, done: {}, ms: [] };
try {
  P = JSON.parse(localStorage.getItem('cl.p')) || P;
} catch (e) { }

const save = () => {
  try {
    localStorage.setItem('cl.p', JSON.stringify(P));
  } catch (e) { }
};

const S = { ci: 0, placed: 0, err: false, focus: 80, key: '' };
let ANN = [];

const O = (id) => $('#' + id).checked;
const cir = () => CIR[S.ci][1];
const lvl = () => ((P.err[S.ci] || 0) >= 2 ? 'detallada' : 'básica');

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

  let o = `<g opacity="${g ? 0.5 : 1}">`;
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
    o += `<circle r="10" fill="${s.c}" stroke="#fff" stroke-width="2"/>`;
  }
  if (s.k == 'btn') {
    o += `<rect x="-12" y="-12" width="24" height="24" rx="4" fill="#555" stroke="#fff"/><circle r="6" fill="#999"/>`;
  }
  o += '</g>';

  if (s.k == 'led') {
    const sw = S.err;
    o += `<text x="${x1 + (x2 - x1) * 0.2}" y="${y1 + (y2 - y1) * 0.2 - 6}" fill="#fff" font-size="14" text-anchor="middle">${sw ? '−' : '+'}</text><text x="${x1 + (x2 - x1) * 0.8}" y="${y1 + (y2 - y1) * 0.8 - 6}" fill="#fff" font-size="14" text-anchor="middle">${sw ? '+' : '−'}</text>`;
  }
  if (s.k == 'res' && O('o-d')) {
    const t = `${val(s.v)} (${BAND[s.v].slice(0, 3).join('-')})`;
    o += `<rect x="${mx - 80}" y="${my - 34}" width="160" height="20" rx="5" fill="#000" stroke="#ff0"/><text x="${mx}" y="${my - 19}" fill="#ff0" font-size="13" font-weight="700" text-anchor="middle">${t}</text>`;
  }
  return o + '</g>';
}

function draw(el, ia) {
  let h = '<rect width="600" height="280" fill="#2a3b4d"/>';
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
  h += `<text x="8" y="30" fill="#e55" font-size="12">+</text><text x="8" y="48" fill="#58f" font-size="12">−</text>`;
  const st = cir();
  st.forEach((s, i) => {
    if (i < S.placed) h += comp(s, 0);
  });
  if (S.placed < st.length) {
    const s = st[S.placed];
    h += comp(s, 1);
    for (const p of [s.a, s.b]) {
      const [x, y] = xy(p);
      h += `<circle class="ring" cx="${x}" cy="${y}" r="9" fill="none" stroke="#3f6" stroke-width="3"/>`;
    }
  }
  ANN.forEach((a) => {
    h += `<circle cx="${a.x}" cy="${a.y}" r="18" fill="none" stroke="#f33" stroke-width="4"/>`;
  });
  el.innerHTML = h;
  el.style.filter = S.focus < 30 ? 'blur(6px)' : 'none';
}

function render() {
  draw($('#bd'));
  draw($('#ib'));
  $('#lvl').textContent = 'Explicación: ' + lvl();
  $('#prog').textContent = `Paso ${Math.min(S.placed + 1, cir().length)}/${cir().length} · completados ${Object.keys(P.done).length}/5`;
  $('#st').innerHTML = cir()
    .map(
      (s, i) =>
        `<li class="${i < S.placed ? 'done' : i == S.placed ? 'cur' : ''}">${i < S.placed ? '✔ ' : ''}${s.l}</li>`
    )
    .join('');
  $('#er').setAttribute('aria-pressed', S.err);
}

function say(m, alert) {
  const c = $('#cap');
  c.innerHTML = '<b>CircuitLens:</b> ' + m;
  $('#log').insertAdjacentHTML('afterbegin', `<div><b>CircuitLens:</b> ${m}</div>`);
  if (O('o-t') && window.speechSynthesis) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(m);
      u.lang = 'es-PE';
      speechSynthesis.speak(u);
    } catch (e) { }
  }
  if (alert && O('o-m') && navigator.vibrate) navigator.vibrate([120, 60, 120]);
}

const user = (t) => {
  $('#log').insertAdjacentHTML('afterbegin', `<div>Tú: ${t}</div>`);
  $('#cap').innerHTML = '<b>Tú:</b> ' + t;
};

const LLM = {
  async sim(f) {
    await sleep(350);
    const n = CIR[f.ci][1].length;
    const b = lvl();
    if (f.focus < 30) return { k: 'blur', m: 'No puedo ver bien el protoboard, ¿puedes enfocar mejor?' };
    if (f.err)
      return {
        k: 'err',
        m:
          b == 'básica'
            ? 'El LED está al revés.'
            : 'El LED está al revés: su pata larga (ánodo, +) debe ir hacia el lado del cable rojo y la corta (cátodo, −) hacia tierra. Con polaridad invertida no pasa corriente.'
      };
    if (f.placed < n) return { k: 'miss', m: `Aún falta: ${CIR[f.ci][1][f.placed].l}.` };
    return { k: 'ok', m: '¡Excelente trabajo! Has dominado este circuito.' };
  },
  async claude(f) {
    if (!S.key) throw 0;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': S.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: 'Diagnostica en español: ' + JSON.stringify(f) }]
      })
    });
    const d = await r.json();
    return { k: 'llm', m: d.content[0].text };
  },
  async ollama(f) {
    const r = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3.2-vision',
        prompt: 'Diagnostica en español: ' + JSON.stringify(f),
        stream: false
      })
    });
    return { k: 'llm', m: (await r.json()).response };
  },
  async run(f) {
    if (S.prov && S.prov != 'sim') {
      try {
        return await Promise.race([
          this[S.prov](f),
          sleep(2500).then(() => {
            throw 0;
          })
        ]);
      } catch (e) {
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

  if (r.k == 'ok') {
    say(r.m);
    celebrate();
    P.done[S.ci] = 1;
  } else if (r.k == 'err') {
    P.err[S.ci] = (P.err[S.ci] || 0) + 1;
    say(r.m, 1);
  } else {
    say(r.m, 1);
  }

  if (f.fb) $('#log').insertAdjacentHTML('afterbegin', '<div><i>Proveedor remoto no disponible: se usó el simulado.</i></div>');
  $('#log').insertAdjacentHTML('afterbegin', `<div><i>Diagnóstico en ${ms} ms (meta &lt; 3 s)</i></div>`);
  P.ms.push(ms);
  save();
  render();
}

function next() {
  const n = cir().length;
  if (S.placed < n) {
    S.placed++;
    render();
    say(S.placed < n ? 'Listo. Siguiente: ' + cir()[S.placed].l : 'Montaje completo. Di «revisa mi circuito».');
  }
}

function handle(t) {
  t = t.toLowerCase().replace(/circuit\s?lens[,:]?/g, '').trim();
  if (!t) return say('Te escucho.');
  user(t);

  if (/revis|no enciende|por qué|diagn/.test(t)) diagnose();
  else if (/sigui|coloc|listo/.test(t)) next();
  else if (/repit|lee|resist|valor/.test(t)) say(cir()[Math.min(S.placed, cir().length - 1)].l);
  else if (/daltoni/.test(t)) {
    $('#o-d').click();
  } else {
    say('Puedes decir: revisa mi circuito, siguiente, repite o modo daltonismo.');
  }
}

let rec = null;
let hands = false;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function listen(cont) {
  if (!SR) {
    say('Tu navegador no soporta voz. Usa el cuadro de texto: cuenta igual.');
    return;
  }
  try {
    rec && rec.stop();
  } catch (e) { }
  rec = new SR();
  rec.lang = 'es-PE';
  rec.continuous = cont;
  rec.onresult = (e) => {
    const t = e.results[e.results.length - 1][0].transcript;
    if (!cont || /circuit\s?lens/i.test(t)) handle(t);
  };
  rec.onend = () => {
    if (hands)
      try {
        rec.start();
      } catch (e) { }
    else {
      $('#mic').classList.remove('on');
      $('#mic').setAttribute('aria-pressed', false);
    }
  };
  rec.onerror = () => { };
  rec.start();
}

$('#mic').onclick = () => {
  $('#mic').classList.add('on');
  $('#mic').setAttribute('aria-pressed', true);
  listen(false);
};

$('#o-f').onchange = (e) => {
  hands = e.target.checked;
  if (hands) {
    say('Modo manos libres activo. Di: CircuitLens, revisa mi circuito.');
    listen(true);
  } else {
    try {
      rec.stop();
    } catch (x) { }
  }
};

$('#sd').onclick = () => {
  handle($('#tx').value);
  $('#tx').value = '';
};

$('#tx').onkeydown = (e) => {
  if (e.key == 'Enter') $('#sd').click();
};

$('#cs').innerHTML = CIR.map((c, i) => `<option value="${i}">${i + 1}. ${c[0]}</option>`).join('');

$('#cs').onchange = (e) => {
  S.ci = +e.target.value;
  S.placed = 0;
  S.err = false;
  render();
  say('Circuito: ' + CIR[S.ci][0] + '. ' + cir()[0].l);
};

$('#nx').onclick = next;
$('#rv').onclick = () => {
  user('Revisa mi circuito');
  diagnose();
};

$('#er').onclick = () => {
  S.err = !S.err;
  render();
};

$('#fo').oninput = (e) => {
  S.focus = +e.target.value;
  render();
};

$('#cam').onclick = async () => {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const v = $('#vid');
    v.srcObject = s;
    v.hidden = false;
    v.play();
    $('#bd').style.opacity = 0.9;
  } catch (e) {
    say('No pude abrir la cámara; sigo con la vista simulada.');
  }
};

document.querySelectorAll('nav button').forEach(
  (b) =>
  (b.onclick = () => {
    document.querySelectorAll('nav button').forEach((x) => x.setAttribute('aria-selected', x == b));
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.id == b.dataset.t));
    if (b.dataset.t == 'org') metrics();
  })
);

$('#o-h').onchange = (e) => document.body.classList.toggle('hc', e.target.checked);
$('#o-c').onchange = (e) => document.body.classList.toggle('calm', e.target.checked);
$('#o-d').onchange = () => {
  render();
  say(O('o-d') ? 'Modo daltonismo activado. Las resistencias muestran su valor en texto.' : 'Modo daltonismo desactivado.');
};

$('#ky').oninput = (e) => (S.key = e.target.value);

$('#rs').onclick = () => {
  P = { err: {}, done: {}, ms: [] };
  save();
  render();
  say('Tus datos locales fueron borrados.');
};

$('#bd').onclick = (e) => {
  const el = e.target;
  if (el.classList && el.classList.contains('ring')) next();
};

/* Multiusuario */
let tx, rx;
try {
  tx = new BroadcastChannel('circuitlens');
  rx = new BroadcastChannel('circuitlens');
  rx.onmessage = (m) => {
    if (m.data.t == 'draw') ann(m.data.x, m.data.y, 1);
  };
} catch (e) { }

$('#room').textContent = 'CL-' + (1000 + Math.floor(Math.random() * 9000));

function ann(x, y, fromI) {
  ANN.push({ x, y });
  render();
  if (fromI) say('Tu instructor marcó un punto en tu protoboard.', 1);
  setTimeout(() => {
    ANN.shift();
    render();
  }, 10000);
}

$('#ib').onclick = (e) => {
  const r = $('#ib').getBoundingClientRect();
  const x = ((e.clientX - r.left) * 600) / r.width;
  const y = ((e.clientY - r.top) * 280) / r.height;
  if (tx) tx.postMessage({ t: 'draw', x, y });
  ann(x, y, 0);
};

$('#clr').onclick = () => {
  ANN = [];
  render();
};

/* Diseño emocional */
function celebrate() {
  const c = $('#conf');
  const g = c.getContext('2d');
  c.width = innerWidth;
  c.height = innerHeight;
  if (O('o-c') || matchMedia('(prefers-reduced-motion:reduce)').matches) {
    $('#cap').innerHTML += ' 🎉';
    return;
  }
  const ps = Array.from({ length: 140 }, () => ({
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
    if (++f < 150) requestAnimationFrame(t);
    else g.clearRect(0, 0, c.width, c.height);
  })();
}

function metrics() {
  const d = [
    ['Circuito 1', 22],
    ['Circuito 2', 17],
    ['Circuito 3', 13],
    ['Circuito 4', 9],
    ['Circuito 5', 6]
  ];
  d[0][1] += P.done[0] ? 1 : 0;
  const avg = P.ms.length ? Math.round(P.ms.reduce((a, b) => a + b) / P.ms.length) + ' ms' : '—';
  $('#mt').innerHTML =
    d.map(([n, v]) => `<div class="cmp"><span>${n}</span><div class="bar" style="width:${(v / 24) * 100}%"></div><b>${v}</b></div>`).join('') +
    `<p>Errores frecuentes: polaridad del LED (41 %), resistencia omitida (27 %). Tu sesión: ${Object.keys(P.done).length}/5 circuitos, latencia media ${avg}.</p>`;
}

$('#demo').onclick = async () => {
  $('#cs').value = 0;
  $('#cs').onchange({ target: { value: 0 } });
  await sleep(1500);
  next();
  await sleep(1200);
  next();
  await sleep(1200);
  S.err = false;
  next();
  S.err = true;
  render();
  await sleep(1200);
  user('CircuitLens, revisa mi circuito');
  await diagnose();
  await sleep(3000);
  S.err = false;
  render();
  next();
  await sleep(1200);
  user('Revisa mi circuito');
  await diagnose();
};

render();
