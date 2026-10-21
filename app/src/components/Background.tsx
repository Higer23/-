import { useCallback, useState } from "react";
import SilkWaves from "./SilkWaves";

// Tüm sayfanın sabit, hareketli arka planı: SilkWaves, varsayılan ayarlarıyla (renk, parlama, hız).
export default function Background() {
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  return (
    <div className="fixed inset-0 -z-20 bg-black" aria-hidden="true">
      {!failed && <SilkWaves onFail={onFail} />}
    </div>
  );
}
