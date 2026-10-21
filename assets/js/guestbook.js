import { $, el, loaderNode } from './utils.js';

// Yalnızca Worker URL'si tanımlıysa açılır. Kullanıcı metni textContent ile yazılır (XSS yok).
export function initGuestbook(workerUrl) {
  if (!workerUrl) return;
  $('defter').hidden = false;
  const list = $('gbList');

  async function refresh() {
    list.textContent = '';
    list.append(loaderNode());
    try {
      const res = await fetch(`${workerUrl}/api/entries`);
      if (!res.ok) throw new Error(String(res.status));
      const items = await res.json();
      list.textContent = '';
      for (const it of items) {
        const row = el('div', null, 'entry');
        row.append(el('b', it.name), el('div', it.message), el('small', it.created_at));
        list.append(row);
      }
    } catch {
      list.textContent = '';
      list.append(el('p', 'Defter yüklenemedi.', 'muted'));
    }
  }

  $('gbForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = $('gbName').value.trim();
    const message = $('gbMsg').value.trim();
    const status = $('gbStatus');
    if (!name || !message) {
      status.classList.add('err');
      status.textContent = 'Adını ve mesajını yazmalısın.';
      return;
    }
    const btn = $('gbForm').querySelector('button');
    btn.disabled = true;
    status.classList.remove('err');
    status.textContent = 'Gönderiliyor…';
    try {
      const res = await fetch(`${workerUrl}/api/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) throw new Error(String(res.status));
      $('gbForm').reset();
      status.textContent = 'Mesajın kaydedildi. Teşekkürler!';
      refresh();
    } catch {
      status.classList.add('err');
      status.textContent = 'Gönderilemedi, yazdıkların duruyor. Tekrar dene.';
    } finally {
      btn.disabled = false;
    }
  });

  refresh();
}
