# Test raporu

## Çalıştırılan
- JavaScript sözdizimi: tüm `assets/js/*.js` ve `tests/*.mjs` dosyaları `node --check` ile geçti.
- Birim testleri (`npm test`): 5/5 geçti. Kapsam: puan sınırları, seriler, puan toplamı, katkı verisi yokluğu, fork ve bio durumları.
- Statik kontrol: JavaScript'in çağırdığı tüm DOM kimlikleri `index.html` içinde mevcut.

## Düzeltilen hatalar
1. Profil fotoğrafı yoktu: avatar `<img>` yeniden tasarımda silinmişti. Geri eklendi; GitHub `avatar_url` kullanılır, yüklenemezse yerel yedek SVG'ye düşer, döngü korumalı.
2. `[hidden]` özniteliği `.btn` sınıfının `display:inline-flex` kuralıyla çakışıyordu; "Tekrar dene" düğmesi her zaman görünüyordu. `[hidden] { display:none !important }` eklendi.
3. JavaScript metinlerinde kesme işareti sözdizimi hatası (önceki sürüm): betiğin tamamını durduruyordu. Düzeltildi.
4. `npm test` dizin argümanı (`tests/`) Node 22'de hata veriyordu; betik dosya yoluna çevrildi.
5. Üçüncü taraf katkı servisi çökerse sayfa çalışmaya devam eder; puan bu bölümü 0 sayar ve bunu not olarak belirtir.
6. GitHub API hız sınırı (403/429) ve zaman aşımı (8 sn) için açık Türkçe hata mesajları ve "Tekrar dene" düğmesi.
7. 3D sahne yüklenemezse, WebGL yoksa ya da hareket azaltma açıksa CSS halkası gösterilir.
8. WebGL bağlam kaybı için yeniden çizim işleyicisi; sayfa kapanınca GPU kaynakları serbest bırakılır.
9. Ziyaretçi defteri kullanıcı metnini `textContent` ile yazar (XSS'e karşı).

## Yapılmayan / doğrulanmayan
- Gerçek tarayıcıda görsel ve etkileşim testi yapılmadı (bu ortamda tarayıcı ve ağ erişimi yok).
- Canlı GitHub verisiyle uçtan uca test yapılmadı.
- Lighthouse / Core Web Vitals ölçülmedi.
- Sponsors bağlantısının hesapta etkin olup olmadığı doğrulanmadı.

## Manuel QA listesi
- [ ] 390 px telefonda yatay kaydırma yok
- [ ] Avatar görünüyor (ağ kapalıyken yedek SVG)
- [ ] Hata durumunda "Tekrar dene" görünüyor, normalde gizli
- [ ] Klavye ile tüm bağlantılar erişilebilir
- [ ] Hareket azaltma açıkken 3D yok, içerik görünür
