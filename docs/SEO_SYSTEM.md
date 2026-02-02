# SEO System

This site uses a shared, static SEO layer that works on GitHub Pages with no build step.

## Files

- `assets/js/site.config.js` - site-wide configuration (URLs, defaults, routes).
- `assets/js/seo.js` - lightweight SEO helper that applies meta tags and JSON-LD.
 - `assets/og/default.png` - default OG image (replace with 1200x630 when ready).

## How to use on a page

Add the scripts in `<head>`:

```html
<script src="/assets/js/site.config.js"></script>
<script src="/assets/js/seo.js"></script>
```

Then call `Seo.apply` with page-specific values:

```html
<script>
  window.Seo.apply({
    title: "Page Title | Osman Cagri Genc",
    description: "Short description of the page.",
    canonicalPath: "/page/",
    imagePath: "/assets/og/default.png",
    type: "website",
    noindex: false,
    schema: {
      "@type": "WebPage",
      name: "Page Title",
      url: "https://osmcgrgenc.github.io/page/"
    }
  });
</script>
```

## Schema patterns

- Home: `Person` + `WebSite` + `WebPage`
- Projects index: `CollectionPage`
- Project detail: `SoftwareApplication` (or `CreativeWork`)
- Playground index: `CollectionPage`
- Games/demos: `SoftwareApplication`
- Labs pages: `WebPage` + `noindex: true`

## Sitemap automation

`tools/generate-sitemap.mjs` scans HTML files, filters by routes in `site.config.js`,
excludes Labs routes, and writes `sitemap.xml` plus a debug `sitemap-pages.json`.

Workflow: `.github/workflows/generate-sitemap.yml`

## Indexed routes

Public routes are listed in `SiteConfig.routes.public`.
Labs routes are listed in `SiteConfig.routes.labs` and excluded from sitemap + robots.

## Adding a new page

1. Create the HTML file.
2. Add a route to `SiteConfig.routes.public` or `.labs`.
3. Add `Seo.apply` in the page head.
4. Run `node tools/generate-sitemap.mjs` or wait for CI.
