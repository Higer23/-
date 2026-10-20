import { CONFIG } from './config.js';

const API = 'https://api.github.com';

// Zaman aşımı, hız sınırı ve hatalı yanıt için açık hata mesajları.
async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (res.status === 403 || res.status === 429) throw new Error('GitHub istek sınırına takıldı, biraz sonra dene');
    if (res.status === 404) throw new Error('Profil bulunamadı');
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('GitHub yanıt vermedi (zaman aşımı)');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Katkı verisi üçüncü taraf bir servis; hata olursa sayfa yine çalışır.
async function getContributions(user) {
  try {
    const data = await getJson(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
    return Array.isArray(data.contributions) ? data : null;
  } catch {
    return null;
  }
}

export async function fetchGithub(user) {
  const [profile, repos] = await Promise.all([
    getJson(`${API}/users/${user}`),
    getJson(`${API}/users/${user}/repos?per_page=100&sort=pushed`),
  ]);
  if (!profile || !profile.login) throw new Error('Profil verisi geçersiz');
  if (!Array.isArray(repos)) throw new Error('Depo verisi geçersiz');
  const contrib = await getContributions(user);
  return { profile, repos, contrib };
}
