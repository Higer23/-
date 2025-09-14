<div align="center">
Higer Store - Gelişmiş Karşılama Sayfası
Kullanıcı odaklı tasarım, güçlü veri toplama ve çoklu dil desteğini bir araya getiren modern bir web projesi.
</div>
<p align="center">
<img alt="Proje Durumu" src="https://www.google.com/search?q=https://img.shields.io/badge/durum-aktif%2520%26%2520bak%25C4%25B1mda-brightgreen%3Fstyle%3Dfor-the-badge">
<img alt="Sürüm" src="https://www.google.com/search?q=https://img.shields.io/badge/s%25C3%25BCr%25C3%25BCm-1.2.0-blue%3Fstyle%3Dfor-the-badge">
<img alt="Lisans" src="https://www.google.com/search?q=https://img.shields.io/badge/lisans-MIT-purple%3Fstyle%3Dfor-the-badge">
</p>
<p align="center">
<a href="#-proje-felsefesi">Felsefe</a> •
<a href="#-temel-özellikler">Özellikler</a> •
<a href="#-teknoloji-yığını">Teknolojiler</a> •
<a href="#-yapılandırma">Yapılandırma</a> •
<a href="#-kurulum">Kurulum</a>
</p>
<details open>
<summary><strong>🇹🇷 Türkçe (Turkish)</strong></summary>
💡 Proje Felsefesi
Bu proje, standart bir karşılama sayfasının ötesine geçerek, estetik ve fonksiyonelliği birleştirmeyi hedefler. Kullanıcıya ilk andan itibaren pürüzsüz, anlaşılır ve interaktif bir deneyim sunarken, arka planda gelişmiş ve anonim istatistiksel verileri toplayarak analiz imkanı sağlar. Tek dosya mimarisi sayesinde kolayca dağıtılabilir ve yönetilebilir olması, projenin temel prensiplerindendir.
🚀 Temel Özellikler
| İkon | Özellik | Açıklama |
|---|---|---|
| 🌐 | Çoklu Dil Desteği | 6 dil (TR, EN, DE, FR, ES, AR) ve Arapça için tam RTL desteği ile küresel bir kitleye hitap eder. |
| 🧠 | Akıllı Dil Yönetimi | Tarayıcı dilini otomatik algılar ve kullanıcının seçimini sonraki ziyaretler için localStorage üzerinde hatırlar. |
| ✨ | Modern Arayüz (UI/UX) | Akıcı animasyonlar, "Glassmorphism" efekti ve hareketli gradyan arka plan ile göz alıcı bir tasarım sunar. |
| 📊 | Kapsamlı Veri Toplama | Onay ile coğrafi konum, cihaz parmak izi, sistem özellikleri gibi zengin ve anonim istatistiksel verileri toplar. |
| ✉️ | EmailJS Entegrasyonu | Toplanan tüm verileri, güvenli ve anlık olarak önceden yapılandırılmış bir e-posta adresine iletir. |
| 🔊 | İnteraktif Ses Efektleri | Tone.js kütüphanesi ile kullanıcı etkileşimlerine (tıklama, hata vb.) anında sesli geri bildirim sağlar. |
| 📦 | Tek Dosya Mimarisi | Tüm HTML, CSS ve JavaScript kodları tek bir index.html dosyasında bulunur. Kurulum ve dağıtım için maksimum kolaylık sunar. |
| 📱 | Tam Duyarlı Tasarım | Mobil, tablet ve masaüstü cihazların tamamında kusursuz bir kullanıcı deneyimi sağlar. |
🛠️ Teknoloji Yığını
| Teknoloji | Amaç |
|---|---|
| HTML5 | Sayfanın anlamsal ve yapısal temelini oluşturur. |
| Tailwind CSS | Hızlı, modern ve tamamen duyarlı bir arayüzü, yardımcı sınıflar (utility classes) aracılığıyla oluşturmak için kullanılır. |
| Vanilla JavaScript (ES6+) | Projenin tüm dinamik işlevselliğini, dil yönetimini, veri toplama mantığını ve DOM manipülasyonunu yönetir. |
| EmailJS | Herhangi bir sunucu tarafı koduna ihtiyaç duymadan, doğrudan tarayıcı üzerinden e-posta gönderimini sağlar. |
| Tone.js | Web Audio API üzerinde gelişmiş bir katman sunarak, interaktif ses efektleri oluşturmayı kolaylaştırır. |
| Font Awesome | Arayüzdeki tüm ikonları (dil bayrakları, buton ikonları vb.) sağlamak için kullanılır. |
🔧 Yapılandırma
Projenin temel ayarlarını JavaScript kod bloğunun en üstündeki SETTINGS bölümünden kolayca değiştirebilirsiniz.
1. EmailJS Ayarları
Verilerin gönderileceği EmailJS hesabınızı yapılandırmak için aşağıdaki sabitleri kendi bilgilerinizle güncelleyin:
const EMAILJS_SERVICE_ID = 'service_xxxxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxxx';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

2. Proje Linkleri
Ana sayfada gösterilen proje linklerini düzenlemek için links dizisini güncelleyin. Her bir link objesi key (çeviri anahtarı), url, date ve icon alanlarını içermelidir:
const links = [
    { key: "link_chess", url: "https://...", date: "10.09.2025", icon: "fa-solid fa-chess-knight" },
    // Yeni bir link ekleyin
    { key: "link_new_project", url: "https://...", date: "DD.MM.YYYY", icon: "fa-solid fa-rocket" }
];

⚙️ Kurulum ve Kullanım
Bu proje herhangi bir derleme (build) veya kurulum adımı gerektirmez.
 * Projedeki index.html dosyasını indirin.
 * Dosyayı doğrudan herhangi bir modern web tarayıcısında açın.
 * Öneri: En iyi geliştirme deneyimi için dosyayı bir yerel sunucu (örneğin, VS Code'daki "Live Server" eklentisi) aracılığıyla çalıştırabilirsiniz.
</details>
<details>
<summary><strong>🇬🇧 English (İngilizce)</strong></summary>
💡 Project Philosophy
This project aims to go beyond a standard landing page by merging aesthetics with functionality. It provides the user with a smooth, understandable, and interactive experience from the very first moment, while collecting advanced, anonymous statistical data in the background for analysis. Its single-file architecture, allowing for easy deployment and management, is a core principle of the project.
🚀 Key Features
| Icon | Feature | Description |
|---|---|---|
| 🌐 | Multi-Language Support | Addresses a global audience with 6 languages (TR, EN, DE, FR, ES, AR) and full RTL support for Arabic. |
| 🧠 | Smart Language Management | Automatically detects the browser's language and remembers the user's choice for future visits using localStorage. |
| ✨ | Modern UI/UX | Offers a stunning design with smooth animations, a "Glassmorphism" effect, and an animated gradient background. |
| 📊 | Comprehensive Data Collection | Upon consent, it gathers rich, anonymous statistical data such as geolocation, device fingerprint, and system properties. |
| ✉️ | EmailJS Integration | Securely and instantly forwards all collected data to a pre-configured email address. |
| 🔊 | Interactive Audio Feedback | Provides instant audio feedback for user interactions (clicks, errors, etc.) using the Tone.js library. |
| 📦 | Single-File Architecture | All HTML, CSS, and JavaScript code is contained within a single index.html file, offering maximum convenience for setup and deployment. |
| 📱 | Fully Responsive Design | Ensures a flawless user experience across all devices, including mobile, tablet, and desktop. |
🛠️ Technology Stack
| Technology | Purpose |
|---|---|
| HTML5 | Forms the semantic and structural foundation of the page. |
| Tailwind CSS | Used to build a fast, modern, and fully responsive interface through utility classes. |
| Vanilla JavaScript (ES6+) | Manages all dynamic functionality, language management, data collection logic, and DOM manipulation. |
| EmailJS | Enables sending emails directly from the client-side without needing any server-side code. |
| Tone.js | Provides an advanced layer on top of the Web Audio API, simplifying the creation of interactive sound effects. |
| Font Awesome | Used to provide all icons in the interface (language flags, button icons, etc.). |
🔧 Configuration
You can easily change the project's core settings in the SETTINGS section at the top of the JavaScript code block.
1. EmailJS Settings
To configure your EmailJS account where data will be sent, update the following constants with your own information:
const EMAILJS_SERVICE_ID = 'service_xxxxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxxx';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

2. Project Links
To edit the project links displayed on the main page, update the links array. Each link object should contain a key (for translation), url, date, and icon:
const links = [
    { key: "link_chess", url: "https://...", date: "10.09.2025", icon: "fa-solid fa-chess-knight" },
    // Add a new link
    { key: "link_new_project", url: "https://...", date: "DD.MM.YYYY", icon: "fa-solid fa-rocket" }
];

⚙️ Installation and Usage
This project does not require any build or installation steps.
 * Download the index.html file from the project.
 * Open the file directly in any modern web browser.
 * Recommendation: For the best development experience, you can run the file through a local server (e.g., the "Live Server" extension in VS Code).
</details>
<details>
<summary><strong>🇩🇪 Deutsch (Almanca)</strong></summary>
💡 Projektphilosophie
Dieses Projekt geht über eine Standard-Landing-Page hinaus und zielt darauf ab, Ästhetik mit Funktionalität zu verbinden. Es bietet dem Benutzer vom ersten Moment an ein reibungsloses, verständliches und interaktives Erlebnis, während im Hintergrund fortschrittliche, anonyme statistische Daten zur Analyse gesammelt werden. Die Ein-Datei-Architektur, die eine einfache Bereitstellung und Verwaltung ermöglicht, ist ein Grundprinzip des Projekts.
🚀 Hauptmerkmale
| Icon | Merkmal | Beschreibung |
|---|---|---|
| 🌐 | Mehrsprachige Unterstützung | Spricht ein globales Publikum mit 6 Sprachen (TR, EN, DE, FR, ES, AR) und voller RTL-Unterstützung für Arabisch an. |
| 🧠 | Intelligente Sprachverwaltung | Erkennt automatisch die Browsersprache und merkt sich die Wahl des Benutzers für zukünftige Besuche im localStorage. |
| ✨ | Moderne Benutzeroberfläche (UI/UX) | Bietet ein beeindruckendes Design mit flüssigen Animationen, einem "Glassmorphismus"-Effekt und einem animierten Farbverlauf-Hintergrund. |
| 📊 | Umfassende Datenerfassung | Sammelt nach Zustimmung reichhaltige, anonyme statistische Daten wie Geolokalisierung, Geräte-Fingerabdruck und Systemeigenschaften. |
| ✉️ | EmailJS-Integration | Leitet alle gesammelten Daten sicher und sofort an eine vorkonfigurierte E-Mail-Adresse weiter. |
| 🔊 | Interaktives Audio-Feedback | Bietet sofortiges Audio-Feedback für Benutzerinteraktionen (Klicks, Fehler usw.) mithilfe der Tone.js-Bibliothek. |
| 📦 | Ein-Datei-Architektur | Der gesamte HTML-, CSS- und JavaScript-Code befindet sich in einer einzigen index.html-Datei, was maximale Bequemlichkeit bei der Einrichtung und Bereitstellung bietet. |
| 📱 | Vollständig responsives Design | Gewährleistet ein einwandfreies Benutzererlebnis auf allen Geräten, einschließlich Mobilgeräten, Tablets und Desktops. |
🛠️ Technologie-Stack
| Technologie | Zweck |
|---|---|
| HTML5 | Bildet die semantische und strukturelle Grundlage der Seite. |
| Tailwind CSS | Wird verwendet, um eine schnelle, moderne und vollständig responsive Benutzeroberfläche mithilfe von Hilfsklassen zu erstellen. |
| Vanilla JavaScript (ES6+) | Verwaltet die gesamte dynamische Funktionalität, die Sprachverwaltung, die Datenerfassungslogik und die DOM-Manipulation. |
| EmailJS | Ermöglicht das Senden von E-Mails direkt von der Client-Seite, ohne dass serverseitiger Code erforderlich ist. |
| Tone.js | Bietet eine fortschrittliche Schicht über der Web Audio API und vereinfacht die Erstellung interaktiver Soundeffekte. |
| Font Awesome | Wird verwendet, um alle Symbole in der Benutzeroberfläche bereitzustellen (Sprachflaggen, Schaltflächensymbole usw.). |
🔧 Konfiguration
Sie können die Kerneinstellungen des Projekts einfach im SETTINGS-Abschnitt am Anfang des JavaScript-Codeblocks ändern.
1. EmailJS-Einstellungen
Um Ihr EmailJS-Konto zu konfigurieren, an das die Daten gesendet werden, aktualisieren Sie die folgenden Konstanten mit Ihren eigenen Informationen:
const EMAILJS_SERVICE_ID = 'service_xxxxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxxx';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

2. Projektlinks
Um die auf der Hauptseite angezeigten Projektlinks zu bearbeiten, aktualisieren Sie das links-Array. Jedes Linkobjekt sollte einen key (für die Übersetzung), url, date und icon enthalten:
const links = [
    { key: "link_chess", url: "https://...", date: "10.09.2025", icon: "fa-solid fa-chess-knight" },
    // Fügen Sie einen neuen Link hinzu
    { key: "link_new_project", url: "https://...", date: "DD.MM.YYYY", icon: "fa-solid fa-rocket" }
];

⚙️ Installation und Verwendung
Dieses Projekt erfordert keine Build- oder Installationsschritte.
 * Laden Sie die index.html-Datei aus dem Projekt herunter.
 * Öffnen Sie die Datei direkt in einem modernen Webbrowser.
 * Empfehlung: Für die beste Entwicklungserfahrung können Sie die Datei über einen lokalen Server ausführen (z. B. die "Live Server"-Erweiterung in VS Code).
</details>
<details>
<summary><strong>🇫🇷 Français (Fransızca)</strong></summary>
💡 Philosophie du Projet
Ce projet vise à aller au-delà d'une simple page d'accueil en fusionnant l'esthétique et la fonctionnalité. Il offre à l'utilisateur une expérience fluide, compréhensible et interactive dès le premier instant, tout en collectant en arrière-plan des données statistiques avancées et anonymes pour analyse. Son architecture en fichier unique, permettant un déploiement et une gestion faciles, est un principe fondamental du projet.
🚀 Fonctionnalités Clés
| Icône | Fonctionnalité | Description |
|---|---|---|
| 🌐 | Support Multilingue | S'adresse à un public mondial avec 6 langues (TR, EN, DE, FR, ES, AR) et un support RTL complet pour l'arabe. |
| 🧠 | Gestion Intelligente de la Langue | Détecte automatiquement la langue du navigateur et mémorise le choix de l'utilisateur pour les visites futures en utilisant localStorage. |
| ✨ | Interface Utilisateur Moderne (UI/UX) | Offre un design époustouflant avec des animations fluides, un effet "Glassmorphism" et un arrière-plan en dégradé animé. |
| 📊 | Collecte de Données Complète | Après consentement, recueille des données statistiques riches et anonymes telles que la géolocalisation, l'empreinte de l'appareil et les propriétés du système. |
| ✉️ | Intégration EmailJS | Transfère de manière sécurisée et instantanée toutes les données collectées à une adresse e-mail préconfigurée. |
| 🔊 | Retour Audio Interactif | Fournit un retour audio instantané pour les interactions de l'utilisateur (clics, erreurs, etc.) en utilisant la bibliothèque Tone.js. |
| 📦 | Architecture en Fichier Unique | Tout le code HTML, CSS et JavaScript est contenu dans un seul fichier index.html, offrant une commodité maximale pour la configuration et le déploiement. |
| 📱 | Design Entièrement Adaptatif | Assure une expérience utilisateur parfaite sur tous les appareils, y compris les mobiles, les tablettes et les ordinateurs de bureau. |
🛠️ Pile Technologique
| Technologie | Objectif |
|---|---|
| HTML5 | Constitue la base sémantique et structurelle de la page. |
| Tailwind CSS | Utilisé pour construire une interface rapide, moderne et entièrement adaptative grâce à des classes utilitaires. |
| Vanilla JavaScript (ES6+) | Gère toutes les fonctionnalités dynamiques, la gestion de la langue, la logique de collecte de données et la manipulation du DOM. |
| EmailJS | Permet d'envoyer des e-mails directement depuis le côté client sans nécessiter de code côté serveur. |
| Tone.js | Fournit une couche avancée au-dessus de l'API Web Audio, simplifiant la création d'effets sonores interactifs. |
| Font Awesome | Utilisé pour fournir toutes les icônes de l'interface (drapeaux de langue, icônes de bouton, etc.). |
🔧 Configuration
Vous pouvez facilement modifier les paramètres principaux du projet dans la section SETTINGS en haut du bloc de code JavaScript.
1. Paramètres EmailJS
Pour configurer votre compte EmailJS où les données seront envoyées, mettez à jour les constantes suivantes avec vos propres informations :
const EMAILJS_SERVICE_ID = 'service_xxxxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxxx';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

2. Liens du Projet
Pour modifier les liens de projet affichés sur la page principale, mettez à jour le tableau links. Chaque objet de lien doit contenir une key (pour la traduction), url, date et icon :
const links = [
    { key: "link_chess", url: "https://...", date: "10.09.2025", icon: "fa-solid fa-chess-knight" },
    // Ajoutez un nouveau lien
    { key: "link_new_project", url: "https://...", date: "JJ.MM.AAAA", icon: "fa-solid fa-rocket" }
];

⚙️ Installation et Utilisation
Ce projet ne nécessite aucune étape de construction ou d'installation.
 * Téléchargez le fichier index.html du projet.
 * Ouvrez le fichier directement dans n'importe quel navigateur web moderne.
 * Recommandation : Pour la meilleure expérience de développement, vous pouvez exécuter le fichier via un serveur local (par exemple, l'extension "Live Server" dans VS Code).
</details>
<details>
<summary><strong>🇪🇸 Español (İspanyolca)</strong></summary>
💡 Filosofía del Proyecto
Este proyecto busca ir más allá de una página de inicio estándar al fusionar la estética con la funcionalidad. Proporciona al usuario una experiencia fluida, comprensible e interactiva desde el primer momento, mientras recopila datos estadísticos avanzados y anónimos en segundo plano para su análisis. Su arquitectura de archivo único, que permite una fácil implementación y gestión, es un principio fundamental del proyecto.
🚀 Características Clave
| Icono | Característica | Descripción |
|---|---|---|
| 🌐 | Soporte Multilingüe | Se dirige a una audiencia global con 6 idiomas (TR, EN, DE, FR, ES, AR) y soporte completo de RTL para árabe. |
| 🧠 | Gestión Inteligente de Idiomas | Detecta automáticamente el idioma del navegador y recuerda la elección del usuario para futuras visitas utilizando localStorage. |
| ✨ | Interfaz de Usuario Moderna (UI/UX) | Ofrece un diseño impresionante con animaciones fluidas, un efecto "Glassmorphism" y un fondo de gradiente animado. |
| 📊 | Recopilación de Datos Exhaustiva | Previo consentimiento, recopila datos estadísticos ricos y anónimos como la geolocalización, la huella digital del dispositivo y las propiedades del sistema. |
| ✉️ | Integración con EmailJS | Reenvía de forma segura e instantánea todos los datos recopilados a una dirección de correo electrónico preconfigurada. |
| 🔊 | Retroalimentación de Audio Interactiva | Proporciona retroalimentación de audio instantánea para las interacciones del usuario (clics, errores, etc.) utilizando la biblioteca Tone.js. |
| 📦 | Arquitectura de Archivo Único | Todo el código HTML, CSS y JavaScript está contenido en un único archivo index.html, lo que ofrece la máxima comodidad para la configuración y el despliegue. |
| 📱 | Diseño Totalmente Adaptable | Garantiza una experiencia de usuario impecable en todos los dispositivos, incluidos móviles, tabletas y ordenadores de escritorio. |
🛠️ Stack Tecnológico
| Tecnología | Propósito |
|---|---|
| HTML5 | Forma la base semántica y estructural de la página. |
| Tailwind CSS | Se utiliza para construir una interfaz rápida, moderna y totalmente adaptable a través de clases de utilidad. |
| Vanilla JavaScript (ES6+) | Gestiona toda la funcionalidad dinámica, la gestión de idiomas, la lógica de recopilación de datos y la manipulación del DOM. |
| EmailJS | Permite enviar correos electrónicos directamente desde el lado del cliente sin necesidad de código del lado del servidor. |
| Tone.js | Proporciona una capa avanzada sobre la API de Web Audio, simplificando la creación de efectos de sonido interactivos. |
| Font Awesome | Se utiliza para proporcionar todos los iconos de la interfaz (banderas de idiomas, iconos de botones, etc.). |
🔧 Configuración
Puede cambiar fácilmente la configuración principal del proyecto en la sección SETTINGS en la parte superior del bloque de código JavaScript.
1. Configuración de EmailJS
Para configurar su cuenta de EmailJS a la que se enviarán los datos, actualice las siguientes constantes con su propia información:
const EMAILJS_SERVICE_ID = 'service_xxxxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxxx';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

2. Enlaces del Proyecto
Para editar los enlaces del proyecto que se muestran en la página principal, actualice el array links. Cada objeto de enlace debe contener una key (para la traducción), url, date e icon:
const links = [
    { key: "link_chess", url: "https://...", date: "10.09.2025", icon: "fa-solid fa-chess-knight" },
    // Añadir un nuevo enlace
    { key: "link_new_project", url: "https://...", date: "DD.MM.AAAA", icon: "fa-solid fa-rocket" }
];

⚙️ Instalación y Uso
Este proyecto no requiere ningún paso de compilación o instalación.
 * Descargue el archivo index.html del proyecto.
 * Abra el archivo directamente en cualquier navegador web moderno.
 * Recomendación: Para la mejor experiencia de desarrollo, puede ejecutar el archivo a través de un servidor local (por ejemplo, la extensión "Live Server" en VS Code).
</details>
<details>
<summary><strong>🇦🇪 العربية (Arapça)</strong></summary>
<div dir="rtl">
💡 فلسفة المشروع
يهدف هذا المشروع إلى تجاوز صفحة الهبوط القياسية من خلال دمج الجماليات مع الوظائف. يوفر للمستخدم تجربة سلسة ومفهومة وتفاعلية منذ اللحظة الأولى، بينما يجمع في الخلفية بيانات إحصائية متقدمة ومجهولة المصدر للتحليل. تعد بنيته المكونة من ملف واحد، والتي تسمح بسهولة النشر والإدارة، مبدأ أساسيًا للمشروع.
🚀 الميزات الرئيسية
| أيقونة | الميزة | الوصف |
|---|---|---|
| 🌐 | دعم متعدد اللغات | يخاطب جمهورًا عالميًا بـ 6 لغات (التركية، الإنجليزية، الألمانية، الفرنسية، الإسبانية، العربية) مع دعم كامل لليمين إلى اليسار (RTL) للغة العربية. |
| 🧠 | إدارة ذكية للغة | يكتشف تلقائيًا لغة المتصفح ويتذكر اختيار المستخدم للزيارات المستقبلية باستخدام localStorage. |
| ✨ | واجهة مستخدم عصرية (UI/UX) | يقدم تصميمًا مذهلاً مع رسوم متحركة سلسة وتأثير "Glassmorphism" وخلفية متدرجة متحركة. |
| 📊 | جمع بيانات شامل | بعد الحصول على الموافقة، يجمع بيانات إحصائية غنية ومجهولة المصدر مثل الموقع الجغرافي وبصمة الجهاز وخصائص النظام. |
| ✉️ | تكامل EmailJS | يقوم بإعادة توجيه جميع البيانات المجمعة بشكل آمن وفوري إلى عنوان بريد إلكتروني تم تكوينه مسبقًا. |
| 🔊 | ردود فعل صوتية تفاعلية | يوفر ردود فعل صوتية فورية لتفاعلات المستخدم (النقرات، الأخطاء، إلخ) باستخدام مكتبة Tone.js. |
| 📦 | هيكلية الملف الواحد | يوجد كل كود HTML و CSS و JavaScript في ملف index.html واحد، مما يوفر أقصى درجات الراحة في الإعداد والنشر. |
| 📱 | تصميم متجاوب بالكامل | يضمن تجربة مستخدم خالية من العيوب على جميع الأجهزة، بما في ذلك الهواتف المحمولة والأجهزة اللوحية وأجهزة الكمبيوتر المكتبية. |
🛠️ حزمة التقنيات
| التقنية | الغرض |
|---|---|
| HTML5 | يشكل الأساس الدلالي والهيكلي للصفحة. |
| Tailwind CSS | يستخدم لبناء واجهة سريعة وحديثة ومتجاوبة بالكامل من خلال فئات الأدوات المساعدة. |
| Vanilla JavaScript (ES6+) | يدير جميع الوظائف الديناميكية وإدارة اللغة ومنطق جمع البيانات والتلاعب بـ DOM. |
| EmailJS | يتيح إرسال رسائل البريد الإلكتروني مباشرة من جانب العميل دون الحاجة إلى أي كود من جانب الخادم. |
| Tone.js | يوفر طبقة متقدمة فوق واجهة برمجة تطبيقات صوت الويب، مما يبسط إنشاء المؤثرات الصوتية التفاعلية. |
| Font Awesome | يستخدم لتوفير جميع الأيقونات في الواجهة (أعلام اللغات، أيقونات الأزرار، إلخ). |
🔧 الإعدادات
يمكنك بسهولة تغيير الإعدادات الأساسية للمشروع في قسم SETTINGS في الجزء العلوي من كتلة كود JavaScript.
1. إعدادات EmailJS
لتكوين حساب EmailJS الخاص بك حيث سيتم إرسال البيانات، قم بتحديث الثوابت التالية بمعلوماتك الخاصة:
const EMAILJS_SERVICE_ID = 'service_xxxxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxxx';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

2. روابط المشروع
لتحرير روابط المشروع المعروضة على الصفحة الرئيسية، قم بتحديث مصفوفة links. يجب أن يحتوي كل كائن ارتباط على key (للترجمة) و url و date و icon:
const links = [
    { key: "link_chess", url: "https://...", date: "10.09.2025", icon: "fa-solid fa-chess-knight" },
    // أضف رابطًا جديدًا
    { key: "link_new_project", url: "https://...", date: "YYYY.MM.DD", icon: "fa-solid fa-rocket" }
];

