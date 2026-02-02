/**
 * Simple Client-side i18n
 * Handles translation toggling and text replacement.
 */

const translations = {
    tr: {
        nav_home: "Anasayfa",
        nav_projects: "Projeler",
        nav_playground: "Oyun Alani",
        nav_labs: "Labs",
        hero_badge: "Frontend + Urun Liderligi",
        hero_title: "Kullanici odakli urunler, etkileşimli deneyimler.",
        hero_desc: "8+ yillik deneyimle, urun stratejisini frontend mimarisiyle birlestiriyorum. SaaS, e-ticaret ve oyun projelerinde takimlari ve urunleri uca tasiyorum.",
        sect_featured: "Featured Product",
        sect_projects: "Projeler",
        sect_playground: "Playground",
        sect_labs: "Labs",
        sect_contact: "Iletisim",
        btn_projects: "Projeler",
        btn_playground: "Playground",
        btn_labs: "Labs",
        btn_cv: "CV (PDF)",
        stats_exp: "Yil deneyim",
        stats_prod: "Urun ve proje",
        stats_tech: "Teknoloji",
        // Hub Headers
        projects_title: "Urun ve Platform Calismalari",
        projects_desc: "Problem, cozum ve teknoloji secimlerine odaklanan projeler. Canli urunler ve altyapi deneyimleri burada.",
        playground_title: "Oyunlar ve Prototipler",
        playground_desc: "Saf HTML/CSS/JS ile gelistirdigim oyunlar, deneyler ve etkileşimli demolar.",
        labs_title: "Deneysel Calismalar",
        labs_desc: "Framework denemeleri, arayuz testleri ve teknik prototipler. Urun degil; deneme alani.",

        // Buttons
        btn_view_more: "Daha fazla",
        btn_play: "Oyna",
        btn_details: "Detaylar",
        btn_visit: "Uygulamaya Git"
    },
    en: {
        nav_home: "Home",
        nav_projects: "Projects",
        nav_playground: "Playground",
        nav_labs: "Labs",
        hero_badge: "Frontend + Product Leadership",
        hero_title: "User-focused products, interactive experiences.",
        hero_desc: "With 8+ years of experience, I combine product strategy with frontend architecture. I lead teams and ship products in SaaS, e-commerce, and gaming.",
        sect_featured: "Featured Product",
        sect_projects: "Projects",
        sect_playground: "Playground",
        sect_labs: "Labs",
        sect_contact: "Contact",
        btn_projects: "Projects",
        btn_playground: "Playground",
        btn_labs: "Labs",
        btn_cv: "CV (PDF)",
        stats_exp: "Years exp",
        stats_prod: "Products",
        stats_tech: "Technologies",

        // Hub Headers
        projects_title: "Product & Platform Work",
        projects_desc: "Projects focusing on problems, solutions, and technology choices. Live products and infrastructure experiments.",
        playground_title: "Games & Prototypes",
        playground_desc: "Games, experiments, and interactive demos built with pure HTML/CSS/JS.",
        labs_title: "Experimental Works",
        labs_desc: "Framework experiments, UI tests, and technical prototypes. Not products; just a sandbox.",

        // Buttons
        btn_view_more: "View More",
        btn_play: "Play",
        btn_details: "Details",
        btn_visit: "Visit App"
    }
};

const I18n = {
    locale: 'tr',

    init() {
        const savedLang = localStorage.getItem('lang');
        const systemLang = navigator.language.startsWith('tr') ? 'tr' : 'en';
        this.locale = savedLang || systemLang;

        // Ensure valid locale
        if (!translations[this.locale]) this.locale = 'tr';

        this.apply();
        this.initToggle();
    },

    toggle() {
        this.locale = this.locale === 'tr' ? 'en' : 'tr';
        localStorage.setItem('lang', this.locale);
        this.apply();
        this.updateToggleBtn();
    },

    apply() {
        document.documentElement.lang = this.locale;

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[this.locale][key]) {
                el.innerText = translations[this.locale][key];
            }
        });

        this.updateToggleBtn();
    },

    initToggle() {
        // Look for existing toggle or create one
        // We assume the toggle might be added via HTML updates or dynamically here.
        // For now, let's assume we bind to a .lang-toggle button if it exists.
        const btn = document.querySelector('.lang-toggle');
        if (btn) {
            this.updateToggleBtn();
            btn.addEventListener('click', () => this.toggle());
        }
    },

    updateToggleBtn() {
        const btn = document.querySelector('.lang-toggle');
        if (btn) {
            btn.innerText = this.locale === 'tr' ? 'EN' : 'TR';
            btn.setAttribute('aria-label', `Switch to ${this.locale === 'tr' ? 'English' : 'Turkish'}`);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
});
