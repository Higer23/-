import { CONFIG } from "../config";

const API = "https://api.github.com";

// Zaman aşımı, hız sınırı ve hatalı yanıt için açık hata mesajları.
async function getJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal: controller.signal });
    if (res.status === 403 || res.status === 429) throw new Error("GitHub istek sınırına takıldı, biraz sonra dene");
    if (res.status === 404) throw new Error("Profil bulunamadı");
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("GitHub yanıt vermedi (zaman aşımı)");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Katkı verisi üçüncü taraf bir servis; hata olursa sayfa yine çalışır.
async function getContributions(user: string) {
  try {
    const data = await getJson(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
    return Array.isArray(data.contributions) ? data : null;
  } catch {
    return null;
  }
}

export async function fetchGithub(user: string) {
  const profile = await getJson(`${API}/users/${user}`);
  if (!profile || !profile.login) throw new Error("Profil verisi geçersiz");

  // GitHub paginates repository lists at 100 items. Continue until the final
  // page so the displayed star total covers every public repository.
  const repos: any[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await getJson(
      `${API}/users/${user}/repos?per_page=100&sort=pushed&page=${page}`,
    );
    if (!Array.isArray(batch)) throw new Error("Depo verisi geçersiz");
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const contrib = await getContributions(user);
  return { profile, repos, contrib };
}
