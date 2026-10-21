import { useMemo } from "react";
import { ShaderCanvas } from "./ShaderCanvas";

// Meshh · Silk Waves — shader kaynağı orijinaliyle aynıdır. ShaderCanvas (WebGL) bu projede yerel yazıldı.
export const fragmentShader = `
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

export default function SilkWaves({
  speed = 1,
  scale = 1,
  contrast = 1,
  glow = 0.7,
  color = "#ffffff",
  tint = "#ffd49a",
  amplitude = 0.03,
  density = 1,
  grain = 1,
  sharpness = 1,
  onFail,
}: {
  speed?: number;
  scale?: number;
  contrast?: number;
  glow?: number;
  color?: string;
  tint?: string;
  amplitude?: number;
  density?: number;
  grain?: number;
  sharpness?: number;
  onFail?: () => void;
}) {
  const uniforms = useMemo(
    () => ({ speed, scale, contrast, glow, color, tint, amplitude, density, grain, sharpness }),
    [amplitude, color, contrast, density, glow, grain, scale, sharpness, speed, tint],
  );

  return (
    <div className="relative h-full min-h-full w-full overflow-hidden bg-black">
      <ShaderCanvas fragmentShader={fragmentShader} uniforms={uniforms} onFail={onFail} />
    </div>
  );
}
