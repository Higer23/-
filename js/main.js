// main.js
import { collectAllData } from './dataCollector.js';
import * as UI from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- SETTINGS ---
    const EMAILJS_SERVICE_ID = 'service_5uyhust';
    const EMAILJS_TEMPLATE_ID = 'template_5p9annp';
    const EMAILJS_PUBLIC_KEY = 'F5cGGWMEHBUJTYWe_';

    // --- DOM ELEMENTS ---
    const dom = {
        languageSwitcher: document.getElementById('language-switcher'),
        modalBackdrop: document.getElementById('modal-backdrop'),
        acceptBtn: document.getElementById('accept-btn'),
        rejectBtn: document.getElementById('reject-btn'),
        visitorNameInput: document.getElementById('visitor-name-input'),
        linkButtonsContainer: document.getElementById('link-buttons'),
        htmlElement: document.documentElement
    };

    let translations = {};
    const startTime = new Date();

    // --- FUNCTIONS ---

    // Manages language settings
    const getInitialLanguage = () => {
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang) return savedLang;
        const browserLang = navigator.language.split('-')[0];
        return ['tr', 'en', 'de', 'ru', 'ar'].includes(browserLang) ? browserLang : 'tr';
    };

    let currentLanguage = getInitialLanguage();

    // Applies translations and sets direction for RTL languages
    const applyTranslations = (lang) => {
        // Set language direction
        if (lang === 'ar') {
            dom.htmlElement.setAttribute('dir', 'rtl');
            dom.htmlElement.setAttribute('lang', 'ar');
        } else {
            dom.htmlElement.setAttribute('dir', 'ltr');
            dom.htmlElement.setAttribute('lang', lang);
        }

        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (translations[key]) {
                if (el.tagName === 'TITLE') el.textContent = translations[key];
                else if (el.hasAttribute('placeholder')) el.placeholder = translations[key];
                else el.innerHTML = translations[key];
            }
        });
    };

    // Loads links and translations
    const loadContent = async (lang) => {
        UI.toggleSpinner(true);
        try {
            const [transResponse, linksResponse] = await Promise.all([
                fetch(`translations/${lang}.json`),
                fetch(`data/links.json`)
            ]);
            if (!transResponse.ok || !linksResponse.ok) throw new Error('Data files could not be loaded.');
            
            translations = await transResponse.json();
            const links = await linksResponse.json();
            
            applyTranslations(lang);
            renderLinks(links);

        } catch (error) {
            console.error("Content loading error:", error);
            UI.showStatusMessage('İçerik yüklenemedi. ❌', false);
        } finally {
            UI.toggleSpinner(false);
        }
    };
    
    // Renders the link buttons
    const renderLinks = (links) => {
        if (!dom.linkButtonsContainer) return;
        dom.linkButtonsContainer.innerHTML = '';
        const scrollableDiv = document.createElement('div');
        scrollableDiv.className = 'max-h-[40vh] overflow-y-auto custom-scrollbar pr-2';
        links.slice().reverse().forEach(link => {
            const button = document.createElement('a');
            button.href = link.url;
            button.target = '_blank';
            button.rel = 'noopener noreferrer';
            button.className = "w-full flex flex-col items-center justify-center p-4 bg-indigo-600/80 hover:bg-indigo-700/90 text-white rounded-xl shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-400 mb-4";
            button.innerHTML = `<span class="text-lg font-semibold">${link.title}</span><span class="text-xs text-gray-300 mt-1">${link.date}</span>`;
            scrollableDiv.appendChild(button);
        });
        dom.linkButtonsContainer.appendChild(scrollableDiv);
    };

    // Sends data via EmailJS
    const sendData = async (params) => {
        UI.toggleSpinner(true);
        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
            UI.showStatusMessage(translations.successMessage || '✅', true);
        } catch (error) {
            console.error("EmailJS Error:", error);
            UI.showStatusMessage(translations.errorMessage || '❌', false);
        } finally {
            UI.toggleSpinner(false);
        }
    };

    // --- EVENT LISTENERS ---
    dom.languageSwitcher.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        localStorage.setItem('preferredLanguage', currentLanguage);
        loadContent(currentLanguage);
    });

    dom.rejectBtn.addEventListener('click', () => {
        UI.playSound([{note: "C3", duration: "8n"}]);
        UI.shakeModal(translations.rejectError || "Devam etmek için kabul etmelisiniz.");
    });
    
    dom.modalBackdrop.addEventListener('click', (event) => {
        if (event.target === dom.modalBackdrop) {
            UI.playSound([{note: "C3", duration: "8n"}]);
            UI.shakeModal(translations.choiceError || "Lütfen bir seçim yapın.");
        }
    });

    dom.acceptBtn.addEventListener('click', async () => {
        const visitorName = dom.visitorNameInput.value.trim();
        if (!visitorName) {
            UI.playSound([{note: "C3", duration: "8n"}]);
            UI.shakeModal(translations.nameError || "Lütfen adınızı giriniz.");
            return;
        }

        UI.playSound([{note: "C4", duration: "8n"}, {note: "E4", duration: "8n"}, {note: "G4", duration: "8n"}]);
        UI.toggleModal(false);
        
        try {
            const data = await collectAllData(startTime);
            data.visitor_name = visitorName;
            console.log("COLLECTED DATA FOR VERIFICATION:", data);
            await sendData(data);
        } catch (error) {
            console.error("Critical error during data collection/sending:", error);
            UI.showStatusMessage(translations.criticalError || 'Veri toplanamadı. ❌', false);
        }
    });

    // --- INITIALIZATION ---
    const initialize = () => {
        dom.languageSwitcher.value = currentLanguage;
        try {
            emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        } catch (e) {
            console.error("EmailJS could not be initialized. Is the public key correct?", e);
            UI.showStatusMessage("Gönderim servisi başlatılamadı!", false);
        }
        loadContent(currentLanguage);
    };

    initialize();
});
