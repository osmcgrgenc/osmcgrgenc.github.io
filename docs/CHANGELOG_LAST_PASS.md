# QA Hardening Pass - Change Log

## Summary of changes
- Added shared SEO system: `assets/js/seo.js` + `assets/js/site.config.js`.
- Wired Seo.apply across public and labs pages; added schema per page type.
- Added sitemap generator `tools/generate-sitemap.mjs` + workflow.
- Added default OG image placeholder at `assets/og/default.png`.
- Updated `robots.txt` to disallow `/labs/`.
- Added hub backlinks on game/project pages.
- Fixed broken asset reference in `horce-race/index.html`.
- Enforced single H1 per page in `dateTimeTest.html`, `tower/index.html`, `cyber-rush/index.html`.

## Manual test instructions
1. Open `/` and use the top navigation to visit `/projects/`, `/playground/`, `/labs/`.
2. From `/playground/`, open each game link and confirm it loads.
3. From `/projects/`, open Codifya and BerberBul detail pages.
4. Confirm `/games/` shows the legacy notice and links to `/playground/`.
5. Open `/labs/` and confirm it links to the experimental pages.
6. Open `/nobetci-eczaneler/` and confirm it still loads correctly.
7. View page source and confirm SEO tags are injected by `seo.js`.
