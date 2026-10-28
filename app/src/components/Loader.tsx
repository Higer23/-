// Loading animation (Uiverse · dexter-st). Letters are hidden from screen readers.
import { useI18n } from "../lib/i18n";

export default function Loader({ small = true }: { small?: boolean }) {
  const { t } = useI18n();
  const label = t("ui.loading");
  return (
    <div className={`loader-wrapper${small ? " sm" : ""}`} role="status" aria-label={label}>
      {Array.from(label).map((ch, i) => (
        <span key={i} className="loader-letter" aria-hidden="true">
          {ch}
        </span>
      ))}
      <div className="loader" />
    </div>
  );
}
