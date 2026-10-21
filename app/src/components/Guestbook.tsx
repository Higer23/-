import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CONFIG } from "../config";
import Panel from "./Panel";
import Loader from "./Loader";

type Entry = { id: number; name: string; message: string; created_at: string };

export default function Guestbook() {
  const base = CONFIG.workerUrl.replace(/\/$/, "");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ text: string; err: boolean }>({ text: "", err: false });
  const [sending, setSending] = useState(false);
  const [moderating, setModerating] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setEntries(null);
    setLoadError(false);
    try {
      const res = await fetch(`${base}/api/entries`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      setEntries(await res.json());
    } catch {
      setLoadError(true);
    }
  }, [base]);

  useEffect(() => { if (base) void refresh(); }, [base, refresh]);

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
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: n, message: m }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `İstek başarısız (${res.status})`);
      setName("");
      setMessage("");
      setStatus({ text: "Mesajın yayımlandı. Teşekkürler!", err: false });
      await refresh();
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : "Mesaj gönderilemedi.", err: true });
    } finally {
      setSending(false);
    }
  };

  const moderate = async (entry: Entry, action: "delete" | "ban") => {
    const password = window.prompt(action === "delete" ? "Mesajı silmek için yönetici parolası:" : "Bu mesajın geldiği IP adresini engellemek için yönetici parolası:");
    if (password === null) return;
    if (!password) {
      setStatus({ text: "Parola girilmedi.", err: true });
      return;
    }
    const ok = window.confirm(action === "delete" ? "Bu mesaj kalıcı olarak silinsin mi?" : "Bu mesajın geldiği bağlantı adresi forumdan engellensin mi?");
    if (!ok) return;
    setModerating(entry.id);
    try {
      const endpoint = action === "ban" ? `${base}/api/entries/${entry.id}/ban` : `${base}/api/entries/${entry.id}`;
      const res = await fetch(endpoint, {
        method: action === "ban" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `İşlem başarısız (${res.status})`);
      setStatus({ text: action === "delete" ? "Mesaj silindi." : "Bağlantı adresi engellendi.", err: false });
      await refresh();
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : "İşlem tamamlanamadı.", err: true });
    } finally {
      setModerating(null);
    }
  };

  return (
    <Panel id="defter" kicker="07 / Topluluk" title="Mini forum. Bir not bırak.">
      <p className="muted">Kısa, saygılı ve konuya uygun mesajlar paylaş. En fazla 50 son mesaj görüntülenir.</p>
      <form onSubmit={submit} noValidate>
        <label htmlFor="gbName">Adın</label>
        <input id="gbName" name="name" maxLength={40} autoComplete="nickname" required value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="gbMsg">Mesajın</label>
        <textarea id="gbMsg" name="message" rows={3} maxLength={500} required value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="submit" type="submit" disabled={sending}>{sending ? "Gönderiliyor…" : "Gönder"}</button>
        <p className={`status${status.err ? " err" : ""}`} role="status" aria-live="polite">{status.text}</p>
      </form>
      <div id="gbList">
        {entries === null && !loadError && <Loader />}
        {loadError && <p className="muted">Forum şu anda yüklenemedi. Biraz sonra tekrar dene.</p>}
        {entries?.length === 0 && <p className="muted">Henüz mesaj yok. İlk mesajı sen bırak.</p>}
        {entries?.map((entry) => (
          <article className="entry" key={entry.id}>
            <div className="entry-content">
              <b>{entry.name}</b>
              <p>{entry.message}</p>
              <small>{entry.created_at}</small>
            </div>
            <div className="entry-actions" aria-label="Mesaj moderasyonu">
              <button type="button" className="moderate-delete" disabled={moderating === entry.id} onClick={() => void moderate(entry, "delete")}>Sil</button>
              <button type="button" className="moderate-ban" disabled={moderating === entry.id} onClick={() => void moderate(entry, "ban")}>Engelle</button>
            </div>
          </article>
        ))}
      </div>
      <div className="forum-safety">
        <b>Güvenlik ve gizlilik</b>
        <ul>
          <li>Yönetici işlemleri sunucuda doğrulanır; parola sayfa kodunda saklanmaz.</li>
          <li>IP adresleri açık metin olarak kaydedilmez; engelleme için SHA-256 özeti kullanılır.</li>
          <li>Mesaj başına 500 karakter sınırı ve IP başına dakikada 5 mesaj sınırı uygulanır.</li>
          <li>Kişisel bilgi, adres, telefon, parola veya başkasına ait özel verileri paylaşma.</li>
          <li>IP engellemesi aynı ağdaki diğer kişileri de etkileyebilir; yalnızca kötüye kullanımda kullan.</li>
        </ul>
      </div>
    </Panel>
  );
}
