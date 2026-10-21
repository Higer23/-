import { useEffect, useRef } from "react";

// Sayfa ilerleme çubuğu: tek bir rAF döngüsüyle güncellenir.
export default function Progress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let ticking = false;
    const frame = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    };
    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return <div ref={ref} className="progress" aria-hidden="true" />;
}
