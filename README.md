# -

Kisisel GitHub profil puanlama sitesi.

- Canli GitHub verisi (REST API) ile profil, depo, yildiz, katki ve seri istatistikleri
- Veriye dayali 100 uzerinden puan ve harf notu
- Kisa hayat hikayesi, yapici elestiri bolumu, bagis baglantilari
- Opsiyonel ziyaretci defteri: Cloudflare Worker + D1

## Yayinlama

Site GitHub Pages uzerinde calisir (main, /). Dosya: index.html

## Ziyaretci defteri (Cloudflare D1)

1. cd worker
2. npx wrangler d1 create higer-guestbook  (cikan database_id'yi wrangler.toml'a yaz)
3. npx wrangler d1 execute higer-guestbook --file=schema.sql --remote
4. npx wrangler deploy
5. Cikan Worker URL'sini index.html icindeki CONFIG.workerUrl alanina yaz.

## Ozellestirme

index.html icindeki CONFIG ve STORY degiskenlerini duzenle.
