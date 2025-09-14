​<!-- README.md -->
​Gelişmiş, Çok Dilli Bağlantı Portalı
​Bu proje, bir giriş ekranı üzerinden kullanıcı adı alan, çeşitli tarayıcı ve sistem verilerini toplayan, bu verileri EmailJS aracılığıyla gönderen ve ardından data/links.json dosyasındaki bağlantıları listeleyen gelişmiş bir statik web sitesidir.
​Özellikler
​Çoklu Dil Desteği: Türkçe, İngilizce, Almanca, Rusça ve Arapça (RTL desteği ile).
​Giriş Modalı: Kullanıcıdan isim ve onay isteyen bir başlangıç ekranı.
​Gelişmiş Veri Toplama: Parmak izi (canvas, audio), coğrafi konum, sistem bilgileri, tarayıcı özellikleri ve daha fazlasını toplar.
​EmailJS Entegrasyonu: Toplanan verileri belirttiğiniz EmailJS hesabına gönderir.
​Dinamik Bağlantılar: data/links.json dosyasını düzenleyerek kolayca bağlantı ekleyip çıkarabilirsiniz.
​Modern Arayüz: TailwindCSS ile oluşturulmuş şık ve duyarlı tasarım.
​Modüler JavaScript: Kod, okunabilirlik ve bakım kolaylığı için main.js, ui.js, ve dataCollector.js olarak üç ana dosyaya ayrılmıştır.
​Kurulum ve Kullanım
​EmailJS Ayarları:
​js/main.js dosyasını açın.
​EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, ve EMAILJS_PUBLIC_KEY sabitlerini kendi EmailJS bilgilerinizle güncelleyin.
​EmailJS şablonunuzda, js/dataCollector.js dosyasındaki templateKeys dizisinde bulunan tüm değişkenleri ({{{visitor_name}}}, {{{ip}}} vb.) eklediğinizden emin olun.
​Bağlantıları Yönetme:
​Yeni bağlantı eklemek veya mevcutları düzenlemek için data/links.json dosyasını açın ve JSON formatına uygun şekilde düzenleyin.
​Metinleri Değiştirme:
​Arayüzdeki metinleri değiştirmek için translations klasöründeki ilgili dil dosyalarını (tr.json, en.json vb.) düzenleyin.
