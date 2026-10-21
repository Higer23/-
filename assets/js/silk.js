// Silk Waves shader'ı: tüm sayfanın sabit arka planı. Saf WebGL, bağımlılık yok.
// Mobilde düşük çözünürlük + 30 fps, "hareketi azalt" ayarında tek kare.
const VERT = 'attribute vec2 a;varying vec2 v_uv;void main(){v_uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform vec4 u_color, u_tint;
uniform float u_time, u_speed, u_scale, u_contrast, u_glow, u_amplitude, u_density, u_grain, u_sharpness;

#define t (u_time * u_speed)

vec2 hash22(vec2 p) {
  vec3 p3 = fract(p.xyx * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float noise(vec2 p) {
  const float kF = 1024.0;
  vec2 i = floor(p);
  vec2 f = fract(p);
  f *= f * (3.0 - 2.0 * f);
  return mix(
    mix(sin(kF * dot(p, hash22(i + vec2(0.0, 0.0)))), sin(kF * dot(p, hash22(i + vec2(1.0, 0.0)))), f.x),
    mix(sin(kF * dot(p, hash22(i + vec2(0.0, 1.0)))), sin(kF * dot(p, hash22(i + vec2(1.0, 1.0)))), f.x),
    f.y
  );
}

float fabric(vec2 p) {
  const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  float f = 0.0;
  f += 0.4 * noise(p); p = m * p;
  f += 0.3 * noise(p); p = m * p;
  f += 0.2 * noise(p); p = m * p;
  f += 0.1 * noise(p);
  return f;
}

float silk(vec2 uv, float tt) {
  float A = 12.0 * u_density;
  float B = 2.0 * u_density;
  float C = 5.0 * u_density;
  float D = 5.0 * u_density;
  float s = sin(D * (uv.x + uv.y + cos(B * uv.x + C * uv.y)) + sin(A * (uv.x + uv.y)) - tt);
  s = 0.7 + 0.3 * (s * s * 0.5 + s);
  return s * 0.9 + 0.1;
}

float grain(vec2 uv) {
  return fabric(uv * min(u_resolution.x, u_resolution.y) * 0.0006 * u_scale);
}

float silkd(vec2 uv, float tt) {
  float A = 12.0 * u_density;
  float B = 2.0 * u_density;
  float C = 5.0 * u_density;
  float D = 5.0 * u_density;
  float xy = uv.x + uv.y;
  float d = (D * (1.0 - B * sin(B * uv.x + C * uv.y)) + A * cos(A * xy))
    * cos(D * (cos(B * uv.x + C * uv.y) + xy) + sin(A * xy) - tt);
  return 0.005 * u_sharpness * d * (sign(d) + 3.0);
}

void main() {
  vec2 uv = (v_uv * u_resolution) / min(u_resolution.x, u_resolution.y);
  float tt = t;
  uv.y += u_amplitude * sin(8.0 * uv.x - tt);
  float s = sqrt(silk(uv, tt));
  s = clamp((s - 0.7714) / 0.2940, 0.0, 1.0);
  float g = grain(uv);
  float d = silkd(uv, tt);
  vec3 c = s * u_color.rgb;
  c += u_glow * u_tint.rgb * d;
  c *= 1.0 - max(0.0, 0.8 * d);
  c *= 1.0 + min(g, 0.0) * u_grain * 0.6;
  c = mix(vec3(0.5), c, u_contrast);
  float sheen = max(g, 0.0) * u_grain * 0.35;
  c = 1.0 - (1.0 - c) * (1.0 - sheen);
  gl_FragColor = vec4(c, 1.0);
}
`;

const PARAMS = {
  speed: 0.55, scale: 1, contrast: 1.05, glow: 0.8, amplitude: 0.03, density: 1, grain: 1, sharpness: 1,
  color: [0.34, 0.27, 0.82, 1], tint: [0.81, 0.19, 0.67, 1],
};

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
  return sh;
}

export function initSilk(canvas) {
  if (!canvas) return;
  const fail = () => document.documentElement.classList.add('no-webgl');
  let gl;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return fail();
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const u = {
      res: U('u_resolution'), time: U('u_time'),
      color: U('u_color'), tint: U('u_tint'),
    };
    for (const k of ['speed', 'scale', 'contrast', 'glow', 'amplitude', 'density', 'grain', 'sharpness']) {
      gl.uniform1f(U('u_' + k), PARAMS[k]);
    }
    gl.uniform4fv(u.color, PARAMS.color);
    gl.uniform4fv(u.tint, PARAMS.tint);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 800px), (pointer: coarse)');
    let w = 0, h = 0, last = 0, raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const f = mobile.matches ? 0.45 : 0.7;
      const nw = Math.max(240, Math.round(window.innerWidth * dpr * f));
      const nh = Math.max(240, Math.round(window.innerHeight * dpr * f));
      // Mobil adres çubuğu yüzünden oluşan küçük yükseklik oynamalarını yoksay.
      if (nw === w && Math.abs(nh - h) < 120 * dpr * f) return;
      w = canvas.width = nw; h = canvas.height = nh;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
      if (reduced) draw(2.0);
    }

    function draw(t) {
      gl.uniform1f(u.time, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (mobile.matches && now - last < 33) return;
      last = now;
      draw(now / 1000);
    }

    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); cancelAnimationFrame(raf); fail(); });
    window.addEventListener('resize', resize, { passive: true });
    resize();
    if (reduced) draw(2.0); else raf = requestAnimationFrame(loop);
  } catch (err) {
    console.warn('Silk arka plan açılamadı:', err);
    fail();
  }
}
