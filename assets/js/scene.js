import { $, clamp, hasWebGL } from './utils.js';
import { onScrollFrame } from './scroll.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Script yüklenemedi: ${src}`));
    document.head.append(s);
  });
}

const whenIdle = () => new Promise((resolve) => {
  if (window.requestIdleCallback) window.requestIdleCallback(() => resolve(), { timeout: 1500 });
  else setTimeout(resolve, 300);
});

function createScene(canvas) {
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 5.2;

  const geo = new THREE.TorusKnotGeometry(1.05, 0.32, 180, 24);
  const mat = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.7, roughness: 0.3 });
  const wireGeo = new THREE.WireframeGeometry(geo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.5 });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geo, mat), new THREE.LineSegments(wireGeo, wireMat));
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xff7a1a, 1.4, 20);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  let progress = 0;
  let lastW = 0;
  let lastH = 0;
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w;
    lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function draw() {
    resize();
    group.rotation.y = progress * Math.PI * 2;
    group.rotation.x = progress * 0.8;
    renderer.render(scene, camera);
  }

  // Bağlam kaybında tarayıcının geri yüklemesine izin ver, sonra yeniden çiz.
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', draw);

  return {
    setProgress(p) { progress = p; },
    draw,
    dispose() {
      geo.dispose();
      mat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      renderer.dispose();
    },
  };
}

// 3D yalnızca: WebGL var, hareket azaltma kapalı, Three.js yüklendi. Aksi halde CSS yedeği.
export async function setupScene(threeUrl) {
  const box = $('sceneBox');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !hasWebGL()) {
    box.classList.add('no-gl');
    return;
  }

  await whenIdle();
  let api;
  try {
    await loadScript(threeUrl);
    api = createScene($('scene'));
  } catch (err) {
    console.warn('3D sahne devre dışı:', err.message);
    box.classList.add('no-gl');
    return;
  }

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(box);
  }

  onScrollFrame(() => {
    if (!visible) return;
    const r = box.getBoundingClientRect();
    api.setProgress(clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1));
    api.draw();
  });
  window.addEventListener('pagehide', () => api.dispose());
}
