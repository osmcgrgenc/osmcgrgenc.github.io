# Post QA Report

Date: 2026-02-02

## Route inventory

Public routes (SEO + discovery):
- `/`
- `/projects/`
- `/projects/codifya/`
- `/projects/berberbul/`
- `/nobetci-eczaneler/`
- `/playground/`
- `/games/` (legacy hub)
- `/tower/`
- `/candy-crush/`
- `/cyber-rush/`
- `/sudoku/`
- `/mayin-tarlasi/`
- `/pokemon/`
- `/pokemon-battle/`
- `/Pathbreak/`
- `/counter-strike/`
- `/neon-tech/`
- `/ar-game/`
- `/mahjong/`
- `/horce-race/`

Labs routes (accessible, excluded from sitemap):
- `/labs/`
- `/v-framework/`
- `/runner.html`
- `/inputTest.html`
- `/dateTimeTest.html`
- `/has/`

Assets:
- `/assets/css/theme.css`
- `/assets/css/base.css`
- `/assets/css/home.css`
- `/assets/css/hub.css`
- `/assets/js/site.config.js`
- `/assets/js/seo.js`
- `/assets/og/default.png`
- `/osmcgrgenc.pdf`

## Fixed issues

- Added shared SEO system and schema injection across pages.
- Added sitemap generator script + workflow.
- Updated robots.txt to disallow `/labs/`.
- Removed broken asset reference to `/vite.svg` in `horce-race/index.html`.
- Normalized single H1 per page:
  - `dateTimeTest.html` (converted second H1 to H2)
  - `tower/index.html` (converted in-game H1 to H2)
  - `cyber-rush/index.html` (converted GAME OVER H1 to H2)
- Verified canvas pages include a11y labels and short descriptions:
  - `candy-crush/index.html`, `Pathbreak/index.html`, `counter-strike/index.html`, `neon-tech/index.html`
- Updated `sitemap.xml` to exclude Labs routes while keeping public routes.

## Link & asset audit notes

- Absolute path links (`/playground/`, `/projects/`, `/nobetci-eczaneler/`) resolve correctly for a user GitHub Pages site.
- Legacy `/games/` preserved and points to `/playground/`.
- Internal asset references verified against repo files; no remaining missing assets found.

## SEO validation notes

- All public routes now have: title, meta description, canonical, OG, Twitter, and lang.
- Sitemap includes public routes only; labs are excluded per requirement.

## Accessibility validation notes

- Navigation uses button toggles with aria-expanded and keyboard focus support.
- Canvas games have aria-labels and text descriptions outside canvas.
- Single H1 per page achieved on updated pages.

## Known issues / nice-to-haves

- Default OG image is a 1x1 placeholder (replace with a real 1200x630 image).
- Some public pages are mixed TR/EN (consider a language strategy or per-page lang refinement).
- Some game pages could use control descriptions near the canvas for non-visual users.
