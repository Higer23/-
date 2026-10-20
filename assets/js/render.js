import { $, el } from './utils.js';

const FALLBACK_AVATAR = 'assets/img/avatar-fallback.svg';

export function setStatus(state, message = '') {
  const status = $('status');
  status.classList.toggle('err', state === 'error');
  if (state === 'loading') status.textContent = 'GitHub verileri yükleniyor…';
  else if (state === 'error') status.textContent = `Veri çekilemedi: ${message}`;
  else status.textContent = 'Veriler GitHub’dan az önce çekildi.';
  $('retry').hidden = state !== 'error';
}

// Avatar yüklenemezse yerel yedek görsele düşer; sonsuz döngü olmaz.
export function setAvatar(url, login) {
  const img = $('avatar');
  img.alt = `${login} profil fotoğrafı`;
  img.onerror = () => {
    img.onerror = null;
    img.src = FALLBACK_AVATAR;
  };
  if (url) img.src = url;
}

function clear(...ids) {
  ids.forEach((id) => { $(id).textContent = ''; });
}

export function renderResults({ profile: u }, result) {
  clear('stats', 'breakdown', 'langs', 'critique');

  $('name').textContent = u.name || u.login;
  $('bio').textContent = u.bio || '';
  $('score').textContent = String(result.score);
  $('grade').textContent = result.grade;
  $('grade').setAttribute('aria-label', `GitHub puan notu ${result.grade}, toplam ${result.score} üzerinden 100`);
  document.title = `Higer23 · GitHub Puanı ${result.score}/100`;
  setAvatar(u.avatar_url ? `${u.avatar_url}${u.avatar_url.includes('?') ? '&' : '?'}s=224` : '', u.login);

  const s = result.stats;
  const statList = [
    ['Takipçi', u.followers],
    ['Public depo', u.public_repos],
    ['Toplam yıldız', s.stars],
    ['Katkı (1 yıl)', s.hasContrib ? s.total : '–'],
    ['Güncel seri', `${s.current} gün`],
    ['En uzun seri', `${s.longest} gün`],
    ['Son 30 gün aktif depo', s.active30],
  ];
  for (const [label, value] of statList) {
    const box = el('div', null, 'stat');
    box.append(el('b', String(value)), el('span', label));
    $('stats').append(box);
  }

  for (const p of result.parts) {
    const row = el('div', null, 'row');
    row.append(el('span', p.label), el('span', `${p.txt} (${p.val.toFixed(1)}/${p.cap})`, 'muted'));
    const bar = el('div', null, 'bar');
    const fill = el('i');
    fill.style.width = `${Math.min(100, (p.val / p.cap) * 100)}%`;
    bar.append(fill);
    $('breakdown').append(row, bar);
  }

  if (!result.langs.length) $('langs').append(el('p', 'Dil verisi yok.', 'muted'));
  for (const [name, n] of result.langs.slice(0, 8)) {
    const pct = (n / result.langSum) * 100;
    const row = el('div', null, 'row');
    row.append(el('span', name), el('span', `${Math.round(pct)}%`, 'muted'));
    const bar = el('div', null, 'bar');
    const fill = el('i');
    fill.style.width = `${pct}%`;
    bar.append(fill);
    $('langs').append(row, bar);
  }

  for (const note of result.notes) $('critique').append(el('li', note));
}
