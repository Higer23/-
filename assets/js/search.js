import { $ } from './utils.js';

// Projeler, istatistik kutuları, eleştiri maddeleri ve dil/puan satırları arasında süzer.
const BLOCKS = '.proj, .stat, #critique li:not(.loader-li)';
const ROWS = '#langs .row, #breakdown .row';
const norm = (s) => s.toLocaleLowerCase('tr');

export function refreshSearch() {
  const q = norm($('q').value.trim());
  let shown = 0;
  for (const n of document.querySelectorAll(BLOCKS)) {
    const ok = !q || norm(n.textContent).includes(q);
    n.hidden = !ok;
    if (ok && q) shown++;
  }
  for (const row of document.querySelectorAll(ROWS)) {
    const ok = !q || norm(row.textContent).includes(q);
    row.hidden = !ok;
    const bar = row.nextElementSibling;
    if (bar && bar.classList.contains('bar')) bar.hidden = !ok;
    if (ok && q) shown++;
  }
  $('searchInfo').textContent = q ? (shown ? `${shown} sonuç` : 'Sonuç bulunamadı') : '';
}

export function initSearch() {
  const input = $('q');
  input.addEventListener('input', refreshSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.value = ''; refreshSearch(); }
  });
  $('sxClear').addEventListener('click', () => { input.value = ''; refreshSearch(); input.focus(); });
}
