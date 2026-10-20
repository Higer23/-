import { CONFIG } from './config.js';
import { $ } from './utils.js';
import { fetchGithub } from './github.js';
import { computeScore } from './score.js';
import { renderResults, setStatus } from './render.js';
import { initScroll, initReveal } from './scroll.js';
import { initGuestbook } from './guestbook.js';
import { initRelay } from './relay.js';

document.documentElement.classList.add('js');

async function load() {
  setStatus('loading');
  try {
    const data = await fetchGithub(CONFIG.user);
    renderResults(data, computeScore(data));
    setStatus('ok');
  } catch (err) {
    setStatus('error', err.message);
  }
}

$('retry').addEventListener('click', load);
initRelay();
initScroll();
initReveal();
initGuestbook(CONFIG.workerUrl);
load();
