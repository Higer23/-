import { useEffect, useRef } from "react";

type UniformValue = number | string | number[];

type Props = {
  fragmentShader: string;
  uniforms?: Record<string, UniformValue>;
  /** Çözünürlük çarpanı (1 = tam). Masaüstü / dokunmatik cihaz için ayrı. */
  quality?: number;
  mobileQuality?: number;
  /** Dokunmatik cihazlarda kare sınırı. */
  mobileFps?: number;
  onFail?: () => void;
  className?: string;
};

const VERT2 = "#version 300 es\nin vec2 a;out vec2 v_uv;void main(){v_uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}";
const VERT1 = "attribute vec2 a;varying vec2 v_uv;void main(){v_uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}";
const DECL = `uniform vec2 u_resolution;
uniform vec4 u_color, u_tint;
uniform float u_time, u_speed, u_scale, u_contrast, u_glow, u_amplitude, u_density, u_grain, u_sharpness;
`;

function fragSource(body: string, gl2: boolean) {
  return gl2
    ? `#version 300 es\nprecision highp float;\nin vec2 v_uv;\nout vec4 fragColor;\n${DECL}${body}`
    : `#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nvarying vec2 v_uv;\n#define fragColor gl_FragColor\n${DECL}${body}`;
}

function hexToRgba(hex: string): [number, number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

function compile(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || "shader derlenemedi");
  }
  return sh;
}

export function ShaderCanvas({
  fragmentShader,
  uniforms = {},
  quality = 1,
  mobileQuality = 0.5,
  mobileFps = 30,
  onFail,
  className = "block h-full w-full",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef(uniforms);
  uniformsRef.current = uniforms;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { antialias: false, alpha: false, powerPreference: "low-power" as const };
    const gl2 = canvas.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? canvas.getContext("webgl", opts)) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) {
      onFail?.();
      return;
    }

    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let raf = 0;
    let disposed = false;
    const shaders: WebGLShader[] = [];

    try {
      const vs = compile(gl, gl.VERTEX_SHADER, gl2 ? VERT2 : VERT1);
      const fs = compile(gl, gl.FRAGMENT_SHADER, fragSource(fragmentShader, !!gl2));
      shaders.push(vs, fs);
      program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "program bağlanamadı");
    } catch (err) {
      console.warn("ShaderCanvas:", err);
      onFail?.();
      return;
    }

    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const locs = new Map<string, WebGLUniformLocation | null>();
    const U = (name: string) => {
      if (!locs.has(name)) locs.set(name, gl.getUniformLocation(program!, name));
      return locs.get(name)!;
    };

    const mobileMq = window.matchMedia("(max-width: 800px), (pointer: coarse)");
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const q = mobileMq.matches ? mobileQuality : quality;
      const box = canvas.getBoundingClientRect();
      const nw = Math.max(240, Math.round(box.width * dpr * q));
      const nh = Math.max(240, Math.round(box.height * dpr * q));
      // Mobil adres çubuğundan doğan küçük yükseklik oynamalarını yoksay.
      if (nw === w && Math.abs(nh - h) < 120 * dpr * q) return;
      w = canvas.width = nw;
      h = canvas.height = nh;
      gl.viewport(0, 0, w, h);
    };

    const applyUniforms = (t: number) => {
      gl.uniform2f(U("u_resolution"), w, h);
      gl.uniform1f(U("u_time"), t);
      for (const [key, v] of Object.entries(uniformsRef.current)) {
        const l = U("u_" + key);
        if (l === null) continue;
        if (typeof v === "number") gl.uniform1f(l, v);
        else if (typeof v === "string") gl.uniform4fv(l, hexToRgba(v));
        else if (v.length === 2) gl.uniform2fv(l, v);
        else if (v.length === 3) gl.uniform3fv(l, v);
        else if (v.length === 4) gl.uniform4fv(l, v);
      }
    };

    let time = 0;
    let last = 0;
    const frame = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (mobileMq.matches && now - last < 1000 / mobileFps) return;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      // "Hareketi azalt" açıksa durdurmak yerine yavaşlat.
      time += dt * (reducedMq.matches ? 0.25 : 1);
      applyUniforms(time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      onFail?.();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("webglcontextlost", onLost);
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      if (buffer) gl.deleteBuffer(buffer);
      for (const s of shaders) gl.deleteShader(s);
      if (program) gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [fragmentShader, quality, mobileQuality, mobileFps, onFail]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
