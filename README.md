# -

Kişisel GitHub profil puanlama sitesi. Statik, çerçevesiz, GitHub Pages üzerinde. PC ve mobil tek tasarım (responsive).

## Yapı

```
index.html              Ana sayfa
assets/style.css        Tüm tasarım (PC + mobil)
assets/app.js           Tüm site kodu (veri, çizim, aurora, kaydırma, defter)
assets/score.js         Saf puan mantığı (testlenir)
assets/img/avatar-fallback.svg  Avatar yüklenemezse yedek
tests/score.test.mjs    Puan birim testleri
worker/                 Cloudflare Worker + D1 şeması (ziyaretçi defteri)
robots.txt, sitemap.xml SEO
```

## Çalıştırma

- Yerelde: `python3 -m http.server 8000` ve `http://localhost:8000` (ES modülleri için sunucu gerekir).
- Test: `npm test` (Node 18+).

## Ayarlar

`assets/app.js` başındaki `CONFIG.workerUrl` alanına Cloudflare Worker adresini yaz. Boşsa ziyaretçi defteri gizli kalır.

## Bağış

Open Collective: https://opencollective.com/kontakt-notizbuch
GitHub Sponsors: https://github.com/sponsors/Higer23 (hesapta etkin olmalı)
