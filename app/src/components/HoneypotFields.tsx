const HONEYPOT_FIELDS = [
  { name: "website", label: "Web sitesi" },
  { name: "phone", label: "Telefon" },
] as const;

type Props = {
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
};

// Gizli alanlar: insan görmez ve doldurmaz, bot doldurursa form reddedilir.
export default function HoneypotFields({ values, onChange }: Props) {
  return (
    <div className="gate-honeypot" aria-hidden="true">
      {HONEYPOT_FIELDS.map((f) => (
        <label key={f.name}>
          {f.label}
          <input
            type="text"
            name={f.name}
            tabIndex={-1}
            autoComplete="off"
            value={values[f.name] ?? ""}
            onChange={(e) => onChange(f.name, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}

export function honeypotFilled(values: Record<string, string>): boolean {
  return HONEYPOT_FIELDS.some((f) => (values[f.name] ?? "").trim() !== "");
}
