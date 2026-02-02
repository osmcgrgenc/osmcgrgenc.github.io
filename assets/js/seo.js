(function () {
    function getConfig() {
        return window.SiteConfig || {
            siteUrl: "",
            defaultTitle: document.title || "",
            defaultDescription: "",
            defaultOgImage: "",
            siteName: "",
            locales: { default: "tr" },
        };
    }

    function absoluteUrl(path) {
        if (!path) return "";
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        const config = getConfig();
        const base = config.siteUrl ? config.siteUrl.replace(/\/$/, "") : "";
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `${base}${cleanPath}`;
    }

    function upsertMeta(selector, attrs) {
        let element = document.head.querySelector(selector);
        if (!element) {
            element = document.createElement("meta");
            document.head.appendChild(element);
        }
        Object.keys(attrs).forEach((key) => {
            element.setAttribute(key, attrs[key]);
        });
        return element;
    }

    function upsertLink(rel, href) {
        if (!href) return;
        let link = document.head.querySelector(`link[rel="${rel}"]`);
        if (!link) {
            link = document.createElement("link");
            link.setAttribute("rel", rel);
            document.head.appendChild(link);
        }
        link.setAttribute("href", href);
        return link;
    }

    function setSchema(schema) {
        if (!schema) return;
        const scriptId = "seo-schema";
        let script = document.getElementById(scriptId);
        if (!script) {
            script = document.createElement("script");
            script.type = "application/ld+json";
            script.id = scriptId;
            document.head.appendChild(script);
        }
        const payload = Array.isArray(schema)
            ? { "@context": "https://schema.org", "@graph": schema }
            : schema;
        script.textContent = JSON.stringify(payload);
    }

    function apply(options) {
        const config = getConfig();
        const settings = options || {};
        const title = settings.title || config.defaultTitle;
        const description = settings.description || config.defaultDescription;
        const canonical = absoluteUrl(settings.canonicalPath || window.location.pathname);
        const image = absoluteUrl(settings.imagePath || config.defaultOgImage);
        const type = settings.type || "website";
        const lang = settings.lang || (config.locales && config.locales.default) || "tr";
        const localeMap = { tr: "tr_TR", en: "en_US" };
        const ogLocale = settings.ogLocale || localeMap[lang] || "tr_TR";

        document.documentElement.lang = lang;
        if (title) {
            document.title = title;
        }
        if (description) {
            upsertMeta('meta[name="description"]', {
                name: "description",
                content: description,
            });
        }

        upsertLink("canonical", canonical);

        upsertMeta('meta[property="og:type"]', {
            property: "og:type",
            content: type,
        });
        upsertMeta('meta[property="og:url"]', {
            property: "og:url",
            content: canonical,
        });
        upsertMeta('meta[property="og:title"]', {
            property: "og:title",
            content: title,
        });
        upsertMeta('meta[property="og:description"]', {
            property: "og:description",
            content: description,
        });
        upsertMeta('meta[property="og:locale"]', {
            property: "og:locale",
            content: ogLocale,
        });
        if (image) {
            upsertMeta('meta[property="og:image"]', {
                property: "og:image",
                content: image,
            });
        }
        if (config.siteName) {
            upsertMeta('meta[property="og:site_name"]', {
                property: "og:site_name",
                content: config.siteName,
            });
        }

        upsertMeta('meta[name="twitter:card"]', {
            name: "twitter:card",
            content: settings.twitterCard || "summary_large_image",
        });
        upsertMeta('meta[name="twitter:title"]', {
            name: "twitter:title",
            content: title,
        });
        upsertMeta('meta[name="twitter:description"]', {
            name: "twitter:description",
            content: description,
        });
        if (image) {
            upsertMeta('meta[name="twitter:image"]', {
                name: "twitter:image",
                content: image,
            });
        }

        if (settings.noindex) {
            upsertMeta('meta[name="robots"]', {
                name: "robots",
                content: "noindex, nofollow",
            });
        }

        setSchema(settings.schema);
    }

    window.Seo = { apply };
})();
