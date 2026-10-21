// Yükleniyor animasyonu (Uiverse · dexter-st). Harfler ekran okuyuculardan gizlenir.
export default function Loader({ small = true }: { small?: boolean }) {
  return (
    <div className={`loader-wrapper${small ? " sm" : ""}`} role="status" aria-label="Yükleniyor">
      {Array.from("Yükleniyor").map((ch, i) => (
        <span key={i} className="loader-letter" aria-hidden="true">
          {ch}
        </span>
      ))}
      <div className="loader" />
    </div>
  );
}
