# Test raporu

## Otomatik doğrulama
Projenin CI iş akışı (`.github/workflows/ci.yml`) Node.js 20 üzerinde aşağıdaki komutları çalıştırır:

1. `npm ci` — kilit dosyasına göre bağımlılık kurulumu.
2. `npm test` — `node --test tests/*.test.mjs` ile tüm `.test.mjs` birim ve Worker testleri.
3. `npm run typecheck` — `tsc --noEmit` ile TypeScript kontrolü.
4. `npm run build` — Vite üretim derlemesi.

Bu dosya CI'ın otomatik olarak çalıştırdığı kontrolleri tanımlar; her commit için sonuçlar ilgili GitHub Actions çalıştırmasından doğrulanmalıdır. Test sayısı sabit yazılmamıştır; yeni testler eklendikçe otomatik değişir.

## Mevcut test kapsamı
- Puan hesaplama ve sınır değerleri.
- GitHub API yanıtlarının doğrulanması, sayfalama, önbellek ve istek birleştirme.
- Rate limit, ağ hataları, yeniden deneme ve istek ölçümleri.
- Katkı verisinin eksik veya hatalı olması.
- Cloudflare Worker Turnstile doğrulaması, CORS, hostname ve rate limit davranışı.

## Manuel / gerçek tarayıcı testleri
Aşağıdakiler otomatik CI tarafından doğrulanmaz ve gerçek cihazlarda ayrıca test edilmelidir:
- iPhone Safari ve masaüstü Safari üzerinde giriş kapısı ve Turnstile akışı.
- 390 px ve daha dar ekranlarda yatay taşma.
- WebGL olmayan cihazlarda ve hareket azaltma ayarında arka plan.
- Gerçek GitHub API ve Turnstile ile uçtan uca canlı test.
- Lighthouse / Core Web Vitals.

## Güvenli test ilkesi
Canlı Cloudflare secret değerleri test çıktısına yazdırılmamalı; üretim Worker'ı yalnızca doğrulanmış bir değişiklikten sonra dağıtılmalıdır.
