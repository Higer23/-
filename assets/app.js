import { computeScore } from './score.js';

/* ---- config ---- */
const CONFIG = {
  user: 'Higer23',
  // Cloudflare Worker URL'si. Boşsa ziyaretçi defteri gizlenir.
  workerUrl: '',
  requestTimeoutMs: 8000,
};

/* ---- yardımcılar ---- */
const $ = (id) => document.getElementById(id);
function el(tag, text, cls) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

/* ---- github ---- */
const API = 'https://api.github.com';

// Zaman aşımı, hız sınırı ve hatalı yanıt için açık hata mesajları.
async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (res.status === 403 || res.status === 429) throw new Error('GitHub istek sınırına takıldı, biraz sonra dene');
    if (res.status === 404) throw new Error('Profil bulunamadı');
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('GitHub yanıt vermedi (zaman aşımı)');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Katkı verisi üçüncü taraf bir servis; hata olursa sayfa yine çalışır.
async function getContributions(user) {
  try {
    const data = await getJson(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
    return Array.isArray(data.contributions) ? data : null;
  } catch {
    return null;
  }
}

async function fetchGithub(user) {
  const [profile, repos] = await Promise.all([
    getJson(`${API}/users/${user}`),
    getJson(`${API}/users/${user}/repos?per_page=100&sort=pushed`),
  ]);
  if (!profile || !profile.login) throw new Error('Profil verisi geçersiz');
  if (!Array.isArray(repos)) throw new Error('Depo verisi geçersiz');
  const contrib = await getContributions(user);
  return { profile, repos, contrib };
}

/* ---- render ---- */
const FALLBACK_AVATAR = 'assets/img/avatar-fallback.svg';

function setStatus(state, message = '') {
  const status = $('status');
  status.classList.toggle('err', state === 'error');
  if (state === 'loading') status.textContent = 'GitHub verileri yükleniyor…';
  else if (state === 'error') status.textContent = `Veri çekilemedi: ${message}`;
  else status.textContent = 'Veriler GitHub’dan az önce çekildi.';
  $('retry').hidden = state !== 'error';
}

// Avatar yüklenemezse yerel yedek görsele düşer; sonsuz döngü olmaz.
function setAvatar(url, login) {
  const img = $('avatar');
  img.alt = `${login} profil fotoğrafı`;
  img.onerror = () => {
    img.onerror = null;
    img.src = FALLBACK_AVATAR;
  };
  if (url) img.src = url;
}

function clear(...ids) {
  ids.forEach((id) => { $(id).textContent = ''; });
}

function renderResults({ profile: u }, result) {
  clear('stats', 'breakdown', 'langs', 'critique');

  $('name').textContent = u.name || u.login;
  $('bio').textContent = u.bio || '';
  $('score').textContent = String(result.score);
  $('grade').textContent = result.grade;
  $('grade').setAttribute('aria-label', `GitHub puan notu ${result.grade}, toplam ${result.score} üzerinden 100`);
  document.title = `Higer23 · GitHub Puanı ${result.score}/100`;
  setAvatar(u.avatar_url ? `${u.avatar_url}${u.avatar_url.includes('?') ? '&' : '?'}s=800` : '', u.login);

  const s = result.stats;
  const statList = [
    ['Takipçi', u.followers],
    ['Public depo', u.public_repos],
    ['Toplam yıldız', s.stars],
    ['Katkı (1 yıl)', s.hasContrib ? s.total : '–'],
    ['Güncel seri', `${s.current} gün`],
    ['En uzun seri', `${s.longest} gün`],
    ['Son 30 gün aktif depo', s.active30],
  ];
  for (const [label, value] of statList) {
    const box = el('div', null, 'stat');
    box.append(el('b', String(value)), el('span', label));
    $('stats').append(box);
  }

  for (const p of result.parts) {
    const row = el('div', null, 'row');
    row.append(el('span', p.label), el('span', `${p.txt} (${p.val.toFixed(1)}/${p.cap})`, 'muted'));
    const bar = el('div', null, 'bar');
    const fill = el('i');
    fill.style.width = `${Math.min(100, (p.val / p.cap) * 100)}%`;
    bar.append(fill);
    $('breakdown').append(row, bar);
  }

  if (!result.langs.length) $('langs').append(el('p', 'Dil verisi yok.', 'muted'));
  for (const [name, n] of result.langs.slice(0, 8)) {
    const pct = (n / result.langSum) * 100;
    const row = el('div', null, 'row');
    row.append(el('span', name), el('span', `${Math.round(pct)}%`, 'muted'));
    const bar = el('div', null, 'bar');
    const fill = el('i');
    fill.style.width = `${pct}%`;
    bar.append(fill);
    $('langs').append(row, bar);
  }

  for (const note of result.notes) $('critique').append(el('li', note));
}

/* ---- scroll ---- */
// Tek bir rAF döngüsü: ilerleme çubuğu ve abonelerin (3D sahne) hepsi burada güncellenir.
const subscribers = [];
let ticking = false;

function onScrollFrame(fn) {
  subscribers.push(fn);
}

function frame() {
  ticking = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  $('progress').style.transform = `scaleX(${ratio})`;
  for (const fn of subscribers) fn();
}

function schedule() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(frame);
}

function initScroll() {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  schedule();
}

// Bölümler görünüme girince hafifçe belirir. JS yoksa içerik zaten görünür.
function initReveal() {
  const nodes = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    nodes.forEach((n) => n.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });
  nodes.forEach((n) => io.observe(n));
}

/* ---- guestbook ---- */
// Yalnızca Worker URL'si tanımlıysa açılır. Kullanıcı metni textContent ile yazılır (XSS yok).
function initGuestbook(workerUrl) {
  if (!workerUrl) return;
  $('defter').hidden = false;
  const list = $('gbList');

  async function refresh() {
    list.textContent = '';
    try {
      const res = await fetch(`${workerUrl}/api/entries`);
      if (!res.ok) throw new Error(String(res.status));
      const items = await res.json();
      for (const it of items) {
        const row = el('div', null, 'entry');
        row.append(el('b', it.name), el('div', it.message), el('small', it.created_at));
        list.append(row);
      }
    } catch {
      list.append(el('p', 'Defter yüklenemedi.', 'muted'));
    }
  }

  $('gbForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = $('gbName').value.trim();
    const message = $('gbMsg').value.trim();
    const status = $('gbStatus');
    if (!name || !message) {
      status.classList.add('err');
      status.textContent = 'Adını ve mesajını yazmalısın.';
      return;
    }
    const btn = $('gbForm').querySelector('button');
    btn.disabled = true;
    status.classList.remove('err');
    status.textContent = 'Gönderiliyor…';
    try {
      const res = await fetch(`${workerUrl}/api/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) throw new Error(String(res.status));
      $('gbForm').reset();
      status.textContent = 'Mesajın kaydedildi. Teşekkürler!';
      refresh();
    } catch {
      status.classList.add('err');
      status.textContent = 'Gönderilemedi, yazdıkların duruyor. Tekrar dene.';
    } finally {
      btn.disabled = false;
    }
  });

  refresh();
}

/* ---- görsel katman: WebGL hero, paralaks kolaj, harf dönüşü, footer, barkod ---- */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function heroGL() {
  const cv = $('heroGl'), img = $('heroImg'), hero = $('top');
  if (!cv || !img || REDUCED) return;
  const gl = cv.getContext('webgl', { antialias: false });
  if (!gl) return;
  const vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const fs = `precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec2 r,ir,m;uniform float vel,time;
  void main(){
    float sc=max(r.x/ir.x,r.y/ir.y);
    vec2 uv=(v-.5)*r/(ir*sc)+.5;
    vec2 d=v-m;d.x*=r.x/r.y;
    float dist=length(d);
    float f=exp(-dist*6.)*vel;
    vec2 off=normalize(d+vec2(1e-4))*sin(dist*36.-time*7.)*f*.05;
    vec3 c=vec3(texture2D(t,uv+off*1.4).r,texture2D(t,uv+off).g,texture2D(t,uv+off*.6).b);
    float g=dot(c,vec3(.3,.59,.11));
    gl_FragColor=vec4(mix(vec3(g),c,.18)*.88,1.);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(pr, n);
  const uR = U('r'), uIR = U('ir'), uM = U('m'), uV = U('vel'), uT = U('time');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, vel = 0, visible = true, ready = false, t0 = performance.now();

  function size() {
    cv.width = Math.floor(hero.clientWidth * dpr); cv.height = Math.floor(hero.clientHeight * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
  }
  hero.addEventListener('pointermove', (e) => {
    const b = hero.getBoundingClientRect();
    tx = (e.clientX - b.left) / b.width; ty = 1 - (e.clientY - b.top) / b.height;
  }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  window.addEventListener('resize', size);

  function frame() {
    requestAnimationFrame(frame);
    if (!ready || !visible) return;
    const dx = tx - mx, dy = ty - my;
    mx += dx * 0.12; my += dy * 0.12;
    vel = Math.min(1, Math.max(vel * 0.94, Math.hypot(dx, dy) * 9));
    gl.uniform2f(uR, cv.width, cv.height); gl.uniform2f(uM, mx, my);
    gl.uniform1f(uV, vel); gl.uniform1f(uT, (performance.now() - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.onload = () => {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform2f(uIR, im.naturalWidth, im.naturalHeight);
    size(); ready = true; cv.style.opacity = 1; requestAnimationFrame(frame);
  };
  im.src = img.currentSrc || img.src;
}

function parallax() {
  const sec = $('gal');
  if (!sec) return;
  const cfg = [{ a: 3, rev: true }, { a: 1, rev: false, flip: true }, { a: 3, rev: true }];
  const cols = [...sec.querySelectorAll('.col')];
  const H = [];
  cols.forEach((c, i) => {
    const tr = c.querySelector('.track');
    if (cfg[i].flip) [...tr.children].reverse().forEach((n) => tr.appendChild(n));
    c._set = [...tr.children];
  });
  function build() {
    cols.forEach((c, i) => {
      const tr = c.querySelector('.track');
      [...tr.children].slice(c._set.length).forEach((n) => n.remove());
      H[i] = c.clientWidth * 0.8 * c._set.length;
      const need = Math.ceil(sec.clientHeight / H[i]) + 2;
      for (let k = 0; k < need; k++) c._set.forEach((n) => tr.appendChild(n.cloneNode(true)));
    });
  }
  function update() {
    const y = window.scrollY - sec.offsetTop;
    cols.forEach((c, i) => {
      let off = (y * cfg[i].a * 0.35 * (cfg[i].rev ? -1 : 1)) % H[i];
      if (off > 0) off -= H[i];
      c.querySelector('.track').style.transform = `translate3d(0,${off - H[i]}px,0)`;
    });
  }
  build(); update();
  window.addEventListener('resize', () => { build(); update(); });
  if (!REDUCED) onScrollFrame(update);
}

function roll() {
  const n = $('roll');
  if (!n) return;
  const txt = n.dataset.t, ab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  n.textContent = '';
  const cols = [];
  [...txt].forEach((ch, i) => {
    const c = el('span', null, 'c'), col = el('i');
    const turns = ch === ' ' || ch === '/' ? 0 : 8;
    for (let k = 0; k < turns; k++) col.append(el('b', ab[Math.floor(Math.random() * ab.length)]));
    col.append(el('b', ch === ' ' ? '\u00a0' : ch));
    col._n = turns; col.style.transitionDelay = `${i * 45}ms`;
    c.append(col); n.append(c); cols.push(col);
    col.style.transform = `translateY(0)`;
  });
  const go = () => cols.forEach((c) => { c.style.transform = `translateY(${-c._n * 1.1}em)`; });
  if (REDUCED || !('IntersectionObserver' in window)) { cols.forEach((c) => { c.style.transition = 'none'; }); go(); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { go(); io.disconnect(); } }, { threshold: 0.7 });
  io.observe(n);
}

function footerReveal() {
  const f = $('foot');
  if (!f) return;
  const inner = f.firstElementChild;
  const upd = () => {
    const r = f.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / r.height));
    inner.style.transform = `translate3d(0,${-50 * (1 - p)}%,0)`;
  };
  upd();
  if (!REDUCED) onScrollFrame(upd);
  window.addEventListener('resize', upd);
}

function barcode() {
  const b = $('barcode');
  if (!b) return;
  let seed = 7, x = 0, bars = '';
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (x < 190) {
    const w = 1 + Math.floor(rnd() * 4);
    if (rnd() > 0.4) bars += `<rect x="${x}" y="0" width="${w}" height="60"/>`;
    x += w + 1 + Math.floor(rnd() * 2);
  }
  b.innerHTML = `<svg viewBox="0 0 190 60" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}

function clock() {
  const c = $('clock');
  if (!c) return;
  const tick = () => { c.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 30000);
}

function initVisuals() { heroGL(); parallax(); roll(); footerReveal(); barcode(); clock(); }

/* ---- başlangıç ---- */
document.documentElement.classList.add('js');

async function load() {
  setStatus('loading');
  try {
    const data = await fetchGithub(CONFIG.user);
    renderResults(data, computeScore(data));
    setStatus('ok');
  } catch (err) {
    setStatus('error', err.message);
  }
}

$('retry').addEventListener('click', load);
initScroll();
initReveal();
initGuestbook(CONFIG.workerUrl);
initVisuals();
load();
