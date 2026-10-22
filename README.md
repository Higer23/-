# -

Kişisel GitHub profil puanlama sitesi. React + TypeScript + Tailwind CSS, Vite ile derlenir ve GitHub Pages üzerinde statik çalışır.

## Yapı

```
app/index.html                 Kaynak sayfa (Vite girişi)
app/src/main.tsx, App.tsx      Uygulama girişi ve sayfa
app/src/components/            SilkWaves, ShaderCanvas (WebGL), butonlar, arama, yükleniyor, panel, defter
app/src/lib/                   GitHub verisi, useGithub, useReveal
app/src/config.ts              Kullanıcı adı, Worker URL
app/src/index.css              Tailwind + tasarım stilleri
assets/js/score.js             Saf puan mantığı (React ve testler ortak kullanır)
assets/js/utils.js             score.js için yardımcılar
assets/img/                    Avatar yedeği
index.html, assets/index-*     Derlenmiş çıktı (GitHub Pages bunu sunar)
tests/score.test.mjs           Puan birim testleri
worker/                        Cloudflare Worker + D1 şeması
robots.txt, sitemap.xml        SEO
```

## Çalıştırma

- Geliştirme: `npm install` ve `npm run dev`
- Tip kontrolü: `npm run typecheck`
- Test: `npm test` (Node 18+)
- Yayın: `npm run build` kök dizindeki `index.html` ve `assets/index-*` dosyalarını yeniden üretir. Eski `assets/index-*` dosyalarını silip yenilerini commit et.

## Ayarlar

`app/src/config.ts` içindeki `workerUrl` alanına Cloudflare Worker adresini yaz. Boşsa ziyaretçi defteri gizli kalır.

## Bağış

Open Collective: https://opencollective.com/higer023
GitHub Sponsors: https://github.com/sponsors/Higer023 (hesapta etkin olmalı)
