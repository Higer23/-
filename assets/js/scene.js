import { $, clamp, hasWebGL } from './utils.js';
import { onScrollFrame } from './scroll.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Script yüklenemedi: ${src}`));
    document.head.append(script);
  });
}
const whenIdle = () => new Promise((resolve) => {
  if (window.requestIdleCallback) window.requestIdleCallback(() => resolve(), { timeout: 1200 });
  else setTimeout(resolve, 250);
});

function createScene(canvas) {
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 5.7);

  const coreGeometry = new THREE.IcosahedronGeometry(1.12, 2);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x171b2a, metalness: 0.72, roughness: 0.27, flatShading: true
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  const wireGeometry = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.13, 1));
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0xb8c7ff, transparent: true, opacity: 0.25 });
  const wire = new THREE.LineSegments(wireGeometry, wireMaterial);
  const object = new THREE.Group();
  object.add(core, wire);
  scene.add(object);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xa7eee5, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.006, 8, 160), ringMaterial);
  ring.rotation.set(1.02, 0.2, -0.34);
  scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.003, 6, 160), new THREE.MeshBasicMaterial({ color: 0xe4c5ff, transparent: true, opacity: 0.24 }));
  ring2.rotation.set(0.65, -0.7, 0.4);
  scene.add(ring2);

  const particlesCount = window.innerWidth < 700 ? 70 : 130;
  const positions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount; i++) {
    const radius = 2.1 + Math.random() * 1.7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({ color: 0xc9d4ff, size: 0.014, transparent: true, opacity: 0.7, sizeAttenuation: true });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  scene.add(new THREE.AmbientLight(0xc8d5ff, 0.48));
  const key = new THREE.DirectionalLight(0xf0f3ff, 2.0);
  key.position.set(3, 4, 5);
  scene.add(key);
  const coolRim = new THREE.PointLight(0x8eaaff, 3.2, 18);
  coolRim.position.set(-3, 1, -3);
  scene.add(coolRim);
  const mintRim = new THREE.PointLight(0x8bf2e5, 1.8, 12);
  mintRim.position.set(2, -3, 3);
  scene.add(mintRim);

  let progress = 0, lastW = 0, lastH = 0, disposed = false;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.x = w < 600 ? 0 : 0.08;
    camera.updateProjectionMatrix();
  }
  function draw() {
    if (disposed) return;
    resize();
    object.rotation.y = progress * Math.PI * 1.25 - 0.3;
    object.rotation.x = progress * 0.7 + 0.18;
    ring.rotation.z = -0.34 + progress * 0.65;
    ring2.rotation.y = -0.7 + progress * 0.4;
    particles.rotation.y = progress * 0.15;
    renderer.render(scene, camera);
  }
  const contextLost = (event) => event.preventDefault();
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', draw);
  return {
    setProgress(value) { progress = value; },
    draw,
    dispose() {
      disposed = true;
      coreGeometry.dispose(); coreMaterial.dispose(); wireGeometry.dispose(); wireMaterial.dispose();
      ring.geometry.dispose(); ringMaterial.dispose();
      ring2.geometry.dispose(); ring2.material.dispose();
      particleGeometry.dispose(); particleMaterial.dispose();
      renderer.dispose();
      canvas.removeEventListener('webglcontextlost', contextLost);
    }
  };
}

export async function setupScene(threeUrl) {
  const box = $('sceneBox');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !hasWebGL()) { box.classList.add('no-gl'); return; }
  await whenIdle();
  let api;
  try {
    await loadScript(threeUrl);
    api = createScene($('scene'));
  } catch (error) {
    console.warn('3D sahne devre dışı:', error.message);
    box.classList.add('no-gl');
    return;
  }
  let visible = true;
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) api.draw(); });
    observer.observe(box);
  }
  onScrollFrame(() => {
    if (!visible) return;
    const rect = box.getBoundingClientRect();
    api.setProgress(clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1));
    api.draw();
  });
  window.addEventListener('pagehide', () => { observer?.disconnect(); api.dispose(); }, { once: true });
}
