import type { ReactNode } from "react";
import { useReveal } from "../lib/useReveal";

export default function Panel({ id, title, kicker, children, className = "" }: { id?: string; title: ReactNode; kicker: string; children: ReactNode; className?: string }) {
  const ref = useReveal<HTMLElement>();
  const hid = id ? `${id}-h` : undefined;
  return (
    <section ref={ref} id={id} className={`panel reveal ${className}`} aria-labelledby={hid}>
      <p className="kicker">{kicker}</p>
      <h2 id={hid}>{title}</h2>
      {children}
    </section>
  );
}
