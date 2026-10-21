import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CONFIG } from "../config";
import Panel from "./Panel";
import Loader from "./Loader";

type Entry = { name: string; message: string; created_at: string };

// Yalnızca Worker URL'si tanımlıysa görünür. Metinler React ile kaçışlanır (XSS yok).
export default function Guestbook() {
  const base = CONFIG.workerUrl;
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ text: string; err: boolean }>({ text: "", err: false });
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    setEntries(null);
    setLoadError(false);
    try {
      const res = await fetch(`${base}/api/entries`);
      if (!res.ok) throw new Error(String(res.status));
      setEntries(await res.json());
    } catch {
      setLoadError(true);
    }
  }, [base]);

  useEffect(() => {
    if (base) void refresh();
  }, [base, refresh]);

  if (!base) return null;

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const n = name.trim();
    const m = message.trim();
    if (!n || !m) return setStatus({ text: "Adını ve mesajını yazmalısın.", err: true });
    setSending(true);
    setStatus({ text: "Gönderiliyor…", err: false });
    try {
      const res = await fetch(`${base}/api/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, message: m }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setName("");
      setMessage("");
      setStatus({ text: "Mesajın kaydedildi. Teşekkürler!", err: false });
      void refresh();
    } catch {
      setStatus({ text: "Gönderilemedi, yazdıkların duruyor. Tekrar dene.", err: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel id="defter" kicker="07 / Topluluk" title="Bir not bırak.">
      <p className="muted">Kayıtlar Cloudflare D1 veritabanında tutulur.</p>
      <form onSubmit={submit} noValidate>
        <label htmlFor="gbName">Adın</label>
        <input id="gbName" name="name" maxLength={40} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="gbMsg">Mesajın</label>
        <textarea id="gbMsg" name="message" rows={3} maxLength={500} required value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="submit" type="submit" disabled={sending}>
          Gönder
        </button>
        <p className={`status${status.err ? " err" : ""}`} role="status">
          {status.text}
        </p>
      </form>
      <div id="gbList">
        {entries === null && !loadError && <Loader />}
        {loadError && <p className="muted">Defter yüklenemedi.</p>}
        {entries?.map((it, i) => (
          <div className="entry" key={i}>
            <b>{it.name}</b>
            <div>{it.message}</div>
            <small>{it.created_at}</small>
          </div>
        ))}
      </div>
    </Panel>
  );
}
