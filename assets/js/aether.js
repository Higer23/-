/* Lightweight enhancement layer: responsive mobile CSS, scroll progress and accessible reveals. */
const mobileLayout = window.matchMedia('(max-width: 700px)');
function syncDeviceLayout() {
  let link = document.getElementById('aether-mobile-css');
  if (mobileLayout.matches && !link) {
    link = document.createElement('link');
    link.id = 'aether-mobile-css';
    link.rel = 'stylesheet';
    link.href = 'assets/css/aether-mobile.css?v=3';
    document.head.appendChild(link);
  } else if (!mobileLayout.matches && link) {
    link.remove();
  } else if (mobileLayout.matches && link && !link.href.includes('v=3')) {
    link.href = 'assets/css/aether-mobile.css?v=3';
  }
}
syncDeviceLayout();
if (mobileLayout.addEventListener) mobileLayout.addEventListener('change', syncDeviceLayout);
else mobileLayout.addListener(syncDeviceLayout);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const progress = document.getElementById('progress');
let scheduled = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (progress) progress.style.width = (ratio * 100).toFixed(2) + '%';
  scheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateProgress); }
}, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();
const reveals = document.querySelectorAll('.reveal');
if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
  reveals.forEach((item) => observer.observe(item));
} else {
  reveals.forEach((item) => item.classList.add('is-visible'));
}
