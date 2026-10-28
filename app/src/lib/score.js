import { DAY } from './utils.js';

// Her kriterin üst sınırı. Toplam 100.
export const CAPS = { contrib: 25, curStreak: 5, longStreak: 10, repos: 15, stars: 15, followers: 10, profile: 10, langs: 10 };

export function grade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

// days: [{date, count}] tarih sırasına göre. Bugün 0 ise güncel seri dünden sayılır.
export function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  let i = days.length - 1;
  let current = 0;
  if (i >= 0 && days[i].count === 0) i -= 1;
  while (i >= 0 && days[i].count > 0) {
    current += 1;
    i -= 1;
  }
  return { current, longest };
}

// Saf fonksiyon: ağ ve DOM yok, test edilebilir.
export function computeScore({ profile: u, repos, contrib, now = Date.now() }) {
  const days = contrib && Array.isArray(contrib.contributions) ? contrib.contributions : [];
  const hasContrib = !!contrib;
  const total = days.reduce((a, d) => a + (d.count || 0), 0);
  const { current, longest } = streaks(days);

  const owned = repos.filter((r) => !r.fork);
  const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const langCount = {};
  for (const r of owned) {
    if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  }
  const langs = Object.entries(langCount).sort((a, b) => b[1] - a[1]);
  const langSum = langs.reduce((a, l) => a + l[1], 0) || 1;
  const active30 = repos.filter((r) => now - new Date(r.pushed_at).getTime() < 30 * DAY).length;
  const noDesc = owned.filter((r) => !r.description).length;
  const ageYears = Math.max(0, Math.round(((now - new Date(u.created_at).getTime()) / (365 * DAY)) * 10) / 10);

  const parts = [
    { label: 'Katkı (son 1 yıl)', val: hasContrib ? Math.min(total / 500, 1) * CAPS.contrib : 0, cap: CAPS.contrib, txt: hasContrib ? `${total} katkı` : 'veri alınamadı' },
    { label: 'Güncel seri', val: Math.min(current / 7, 1) * CAPS.curStreak, cap: CAPS.curStreak, txt: `${current} gün` },
    { label: 'En uzun seri', val: Math.min(longest / 30, 1) * CAPS.longStreak, cap: CAPS.longStreak, txt: `${longest} gün` },
    { label: 'Public depo', val: Math.min((u.public_repos || 0) / 20, 1) * CAPS.repos, cap: CAPS.repos, txt: `${u.public_repos} depo` },
    { label: 'Yıldız', val: Math.min(stars / 100, 1) * CAPS.stars, cap: CAPS.stars, txt: `${stars} yıldız` },
    { label: 'Takipçi', val: Math.min((u.followers || 0) / 50, 1) * CAPS.followers, cap: CAPS.followers, txt: `${u.followers} takipçi` },
    { label: 'Profil tamlığı', val: (u.bio ? 4 : 0) + (u.blog ? 3 : 0) + (u.location || u.company ? 3 : 0), cap: CAPS.profile, txt: `${u.bio ? 'bio var' : 'bio yok'}, ${u.blog ? 'site var' : 'site yok'}` },
    { label: 'Dil çeşitliliği', val: Math.min(langs.length / 4, 1) * CAPS.langs, cap: CAPS.langs, txt: `${langs.length} dil` },
  ];
  const score = Math.round(parts.reduce((a, p) => a + p.val, 0));

  const notes = [];
  const codes = [];
  if (!hasContrib) { notes.push('Katkı verisi alınamadığı için bu bölüm 0 sayıldı. Sayfayı daha sonra yenile.'); codes.push({ code: 'note.noContrib' }); }
  if (!u.bio) { notes.push('Profil açıklaması (bio) boş. Ne yaptığını ve neye ilgi duyduğunu anlatan tek bir cümle, ilk izlenimi değiştirir.'); codes.push({ code: 'note.noBio' }); }
  if (owned.length && noDesc / owned.length >= 0.3) {
    notes.push(`Depolarının yaklaşık %${Math.round((noDesc / owned.length) * 100)}'i açıklamasız. Her depoya kısa bir açıklama, ziyaretçiye ne olduğunu hemen anlatır.`); codes.push({ code: 'note.noDesc', vars: { pct: Math.round((noDesc / owned.length) * 100) } });
  }
  if (langs.length && langs[0][1] / langSum > 0.8) {
    notes.push(`Dil dağılımı tek tarafa yatık (${langs[0][0]} baskın). Öne çıkan depolarda farklı dillerdeki projeleri göstermek çeşitliliği görünür kılar.`); codes.push({ code: 'note.langSkew', vars: { lang: langs[0][0] } });
  }
  if (hasContrib && longest > current * 3 && longest >= 5) {
    notes.push(`Katkı serisi kopuk: en uzun seri ${longest} gün, güncel seri ${current} gün. Haftada birkaç küçük commit, arada büyük bir patlamadan daha sürdürülebilir.`); codes.push({ code: 'note.streak', vars: { longest, current } });
  }
  if (stars < 10) { notes.push('Yıldız sayısı düşük. README içine ekran görüntüsü, kurulum adımı ve kısa bir demo eklemek yıldız almayı kolaylaştırır.'); codes.push({ code: 'note.stars' }); }
  if ((u.followers || 0) < 10) { notes.push("Takipçi sayısı az. Bir profil README'si ve düzenli güncellemeler görünürlüğü artırır."); codes.push({ code: 'note.followers' }); }
  if (active30 === 0) { notes.push('Son 30 günde hiç push yok. Küçük bir iyileştirme bile profili canlı tutar.'); codes.push({ code: 'note.inactive' }); }
  notes.push(`Güçlü yan: ${ageYears} yıllık hesap, ${u.public_repos} public depo ve düzenli geliştirme sinyali.`); codes.push({ code: 'note.strength', vars: { years: ageYears, repos: u.public_repos } });

  return {
    score,
    grade: grade(score),
    parts,
    notes,
    noteCodes: codes,
    langs,
    langSum,
    stats: { total, current, longest, stars, active30, hasContrib },
  };
}
