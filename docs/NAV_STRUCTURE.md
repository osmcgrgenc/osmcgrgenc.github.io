# Navigation & Site Structure

This document outlines the site structure and navigation logic for the personal portfolio.

## 1. Hub Pages (Canonical)

The site is organized into "Hubs", which act as landing pages for different types of content:

- **Home (`/`)**: Main landing page. Bio, Featured Work, Contact.
- **Projects (`/projects/`)**: Professional work, products, SaaS, and major open source libraries.
- **Playground (`/playground/`)**: Games, interactive demos, and fun "toy" projects.
  - *Note*: Replaces the old `/games/` directory (redirected).
- **Labs (`/labs/`)**: Experimental code, raw prototypes, framework tests.
  - *Note*: Things that aren't quite "products" or "games".

## 2. Directory Mappings

| URL Path | Physical Path | Description |
|----------|---------------|-------------|
| `/` | `/index.html` | Homepage |
| `/projects/` | `/projects/index.html` | Projects Hub |
| `/playground/` | `/playground/index.html` | Games Hub |
| `/labs/` | `/labs/index.html` | Experiments Hub |
| `/games/` | `/games/index.html` | **REDIRECT** -> `/playground/` |

## 3. Game Wrappers

Individual games (e.g., `/tower/`, `/sudoku/`) are standalone single-page applications (SPAs) or static pages.
To maintain a cohesive experience without breaking their custom engines/canvases, we inject a minimal "Back Link":

- **UI**: Fixed position overlay (top-left).
- **Style**: Semi-transparent capsule button.
- **Target**: `<a href="/playground/">← Playground</a>`

## 4. Mobile Navigation

The global navigation uses a JavaScript-driven toggle for mobile devices.

- **Library**: `/assets/js/ui.js`
- **Logic**: Toggles `data-open="true/false"` on the nav list.
- **Accessibility**: Updates `aria-expanded` and uses semantic `<button>` controls.
