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
  setAvatar(u.avatar_url ? `${u.avatar_url}${u.avatar_url.includes('?') ? '&' : '?'}s=224` : '', u.login);

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

/* ---- relay (aurora, hero kartı, menü) ---- */
/* Aurora: fixed full-page light ribbons (lime -> teal -> blue), additive blending. */
function aurora() {
  const cv = $('aurora');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 700px)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5);
  const RIB = small ? 10 : 22;
  const ribbons = Array.from({ length: RIB }, (_, i) => ({
    y: 0.08 + (i / RIB) * 0.95,
    amp: 40 + Math.random() * 110,
    f: 0.0016 + Math.random() * 0.0022,
    sp: 0.15 + Math.random() * 0.35,
    ph: Math.random() * 6.28,
    hue: 72 + (i / RIB) * 130,
    spread: 2 + Math.random() * 7,
  }));
  let w = 0, h = 0, t = 0, sy = 0, raf = 0;

  function size() {
    w = window.innerWidth; h = window.innerHeight;
    cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const hero = Math.max(0, 1 - sy / (h * 0.9));
    // hero glow where the fan converges
    const px = w * 0.34, py = h * 0.6 - sy * 0.3;
    const g = ctx.createRadialGradient(px, py, 0, px, py, Math.max(w, h) * 0.5);
    g.addColorStop(0, `rgba(195,255,58,${0.2 * hero})`);
    g.addColorStop(1, 'rgba(195,255,58,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // converging fan (hero swoosh)
    if (hero > 0.02) {
      for (let i = 0; i < (small ? 14 : 34); i++) {
        const k = i / 34, a = (k - 0.5) * 2;
        const ex = w * (1.05 + a * 0.05), ey = h * (0.5 + a * 0.55) - sy * 0.3;
        const wob = Math.sin(t * 0.5 + i) * 30;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.bezierCurveTo(px + w * 0.12, py - h * 0.22 + wob, w * 0.62, ey - h * 0.35 * (1 - Math.abs(a)) - wob, ex, ey);
        ctx.strokeStyle = `hsla(${80 + k * 120},100%,60%,${0.1 * hero})`;
        ctx.lineWidth = 1; ctx.stroke();
      }
    }
    // flowing ribbons
    for (const r of ribbons) {
      const base = r.y * h * 1.15 - sy * 0.22 * (0.6 + r.y);
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 26) {
          const y = base + Math.sin(x * r.f + t * r.sp + r.ph) * r.amp + Math.sin(x * r.f * 2.1 - t * 0.5 + r.ph) * r.amp * 0.4 + k * r.spread * (1 + x / w);
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${(r.hue + sy * 0.03) % 360},100%,58%,${0.075})`;
        ctx.lineWidth = 1; ctx.stroke();
      }
    }
  }

  function loop() { t += 0.016; draw(); raf = requestAnimationFrame(loop); }
  size(); draw();
  window.addEventListener('resize', () => { size(); draw(); });
  window.addEventListener('scroll', () => { sy = window.scrollY; if (reduce) draw(); }, { passive: true });
  if (!reduce) {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    });
  }
}

/* Hero card mirrors the live score + first stats; meter animates on update. */
function bindHero() {
  const score = $('score'), meter = $('meter'), stats = $('stats'), runs = $('runs');
  if (score && meter) {
    const sync = () => { const n = parseInt(score.textContent, 10); if (!Number.isNaN(n)) meter.style.width = `${Math.min(100, n)}%`; };
    new MutationObserver(sync).observe(score, { childList: true, characterData: true, subtree: true });
  }
  if (stats && runs) {
    new MutationObserver(() => {
      runs.textContent = '';
      [...stats.querySelectorAll('.stat')].slice(0, 3).forEach((s) => {
        const row = el('div');
        row.append(el('span', s.querySelector('span')?.textContent || ''), el('b', s.querySelector('b')?.textContent || ''));
        runs.append(row);
      });
    }).observe(stats, { childList: true });
  }
}

/* Highlight the nav link of the section in view. */
function navSpy() {
  const links = [...document.querySelectorAll('.top nav a')];
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.classList.remove('on'));
      map.get(e.target.id)?.classList.add('on');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

function initRelay() { aurora(); bindHero(); navSpy(); }

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
initRelay();
initScroll();
initReveal();
initGuestbook(CONFIG.workerUrl);
load();
