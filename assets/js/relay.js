import { $, el } from './utils.js';

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

export function initRelay() { aurora(); bindHero(); navSpy(); }
