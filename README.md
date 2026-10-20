# -

Kişisel GitHub profil puanlama sitesi. Statik, çerçevesiz, GitHub Pages üzerinde.

## Yapı

```
index.html                 Ana sayfa
assets/css/base.css        Tokenlar, tipografi, erişilebilirlik
assets/css/layout.css      Üst çubuk, hero, bölüm düzeni
assets/css/components.css  Düğme, kart, form, çubuk bileşenleri
assets/img/avatar-fallback.svg  Avatar yüklenemezse yedek
assets/js/main.js          Giriş noktası
assets/js/config.js        Kullanıcı adı, Worker URL, sürümler
assets/js/github.js        GitHub ve katkı verisi (zaman aşımı, hata)
assets/js/score.js         Saf puan mantığı (DOM ve ağ yok)
assets/js/render.js        Sayfaya yazma (textContent)
assets/js/scroll.js        Tek rAF döngüsü, bölüm girişleri
assets/js/scene.js         Three.js 3D sahne (koşullu)
assets/js/guestbook.js     Ziyaretçi defteri (Worker bağlıysa)
assets/js/utils.js         Küçük yardımcılar
tests/score.test.mjs       Puan birim testleri
docs/TEST-RAPORU.md        Test ve düzeltme raporu
worker/                    Cloudflare Worker + D1 şeması
robots.txt, sitemap.xml    SEO
```

## Çalıştırma

- Yerelde: `python3 -m http.server 8000` ve `http://localhost:8000` (ES modülleri için sunucu gerekir).
- Test: `npm test` (Node 18+).

## Ayarlar

`assets/js/config.js` içindeki `workerUrl` alanına Cloudflare Worker adresini yaz. Boşsa ziyaretçi defteri gizli kalır.

## Bağış

Open Collective: https://opencollective.com/kontakt-notizbuch
GitHub Sponsors: https://github.com/sponsors/Higer23 (hesapta etkin olmalı)
