import { useCallback, useState } from "react";
import SilkWaves from "./SilkWaves";

// Siyah-beyaz ipek (varsayılan) ve eski sıcak tonlu sürüm (?bg=classic)
const PRESETS = {
  mono: {
    speed: 0.55,
    scale: 1.1,
    contrast: 1.35,
    glow: 0.3,
    color: "#ffffff",
    tint: "#ffffff",
    amplitude: 0.06,
    density: 0.7,
    grain: 1.8,
    sharpness: 1.25,
  },
  classic: {
    speed: 1,
    scale: 1,
    contrast: 1,
    glow: 0.7,
    color: "#ffffff",
    tint: "#ffd49a",
    amplitude: 0.03,
    density: 1,
    grain: 1,
    sharpness: 1,
  },
} as const;

function pickPreset(): keyof typeof PRESETS {
  try {
    const v = new URLSearchParams(window.location.search).get("bg");
    if (v === "classic") return "classic";
  } catch {
    /* URL okunamazsa varsayılan */
  }
  return "mono";
}

export default function Background() {
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const preset = PRESETS[pickPreset()];
  return (
    <div className="fixed inset-0 -z-20 bg-black" aria-hidden="true">
      {!failed && <SilkWaves onFail={onFail} {...preset} />}
    </div>
  );
}
