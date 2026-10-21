import { CONFIG } from './config.js';
import { $, el, loaderNode } from './utils.js';
import { fetchGithub } from './github.js';
import { computeScore } from './score.js';
import { renderResults, setStatus } from './render.js';
import { initSilk } from './silk.js';
import { initSearch, refreshSearch } from './search.js';
import { initScroll, initReveal } from './scroll.js';
import { initGuestbook } from './guestbook.js';

document.documentElement.classList.add('js');

// Veri gelene kadar bölümlerin içinde "Yükleniyor" göster; render.js bu alanları temizler.
function showLoaders() {
  for (const id of ['breakdown', 'langs']) $(id).replaceChildren(loaderNode());
  const li = el('li', null, 'loader-li');
  li.append(loaderNode());
  $('critique').replaceChildren(li);
}

function clearLoaders() {
  for (const id of ['breakdown', 'langs', 'critique']) $(id).replaceChildren();
}

async function load() {
  setStatus('loading');
  showLoaders();
  try {
    const data = await fetchGithub(CONFIG.user);
    renderResults(data, computeScore(data));
    const repo = data.repos.find((r) => r.name === '-');
    $('starCount').textContent = String(repo ? repo.stargazers_count : 0);
    setStatus('ok');
    refreshSearch();
  } catch (err) {
    clearLoaders();
    setStatus('error', err.message);
  }
}

$('retry').addEventListener('click', load);
initSilk($('silk'));
initSearch();
initScroll();
initReveal();
initGuestbook(CONFIG.workerUrl);
load();
