# -

Kişisel GitHub profil puanlama sitesi. Statik, çerçevesiz, GitHub Pages üzerinde.

## Yapı

```
index.html                 Ana sayfa
assets/css/silk.css        Tüm tasarım (tokenlar, arka plan, butonlar, arama, yükleniyor)
assets/img/avatar-fallback.svg  Avatar yüklenemezse yedek
assets/js/main.js          Giriş noktası
assets/js/config.js        Kullanıcı adı, Worker URL, sürümler
assets/js/silk.js          Silk Waves WebGL arka planı (mobilde düşük çözünürlük, 30 fps)
assets/js/search.js        Proje / dil / istatistik arama
assets/js/github.js        GitHub ve katkı verisi (zaman aşımı, hata)
assets/js/score.js         Saf puan mantığı (DOM ve ağ yok)
assets/js/render.js        Sayfaya yazma (textContent)
assets/js/scroll.js        İlerleme çubuğu, bölüm girişleri
assets/js/guestbook.js     Ziyaretçi defteri (Worker bağlıysa)
assets/js/utils.js         Yardımcılar ve yükleniyor animasyonu
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
