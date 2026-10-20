import { $ } from './utils.js';

// Tek bir rAF döngüsü: ilerleme çubuğu ve abonelerin (3D sahne) hepsi burada güncellenir.
const subscribers = [];
let ticking = false;

export function onScrollFrame(fn) {
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

export function initScroll() {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  schedule();
}

// Bölümler görünüme girince hafifçe belirir. JS yoksa içerik zaten görünür.
export function initReveal() {
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
