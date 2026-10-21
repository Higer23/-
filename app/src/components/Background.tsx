import { useCallback, useState } from "react";
import SilkWaves from "./SilkWaves";

// Tüm sayfanın sabit, hareketli arka planı. WebGL yoksa koyu gradient kalır.
export default function Background() {
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  return (
    <>
      <div
        className="fixed inset-0 -z-20"
        style={{ background: "radial-gradient(120% 90% at 20% 0%, #1d1550, #050610 60%)" }}
        aria-hidden="true"
      >
        {!failed && <SilkWaves color="#5745d1" tint="#cf30aa" speed={1} glow={0.85} contrast={1.05} onFail={onFail} />}
      </div>
      <div className="silk-scrim" aria-hidden="true" />
    </>
  );
}
