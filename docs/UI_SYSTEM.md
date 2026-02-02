# Design System Documentation

This repository uses a shared design system built with vanilla CSS variables and utility classes. The goal is to provide a consistent, modern, and performant UI with a "technical minimalism" aesthetic.

## 1. File Structure

All shared assets are located in the `/assets/` directory:

- `assets/css/reset.css`: Minimal CSS reset + global defaults (box-sizing, margins).
- `assets/css/tokens.css`: Design tokens (CSS variables) for colors, typography, spacing, etc.
- `assets/css/base.css`: Global styles for HTML elements (typography, links, containers) and layout utilities.
- `assets/css/components.css`: Reusable component classes (`.btn`, `.card`, `.badge`, `.navbar`).
- `assets/js/ui.js`: Minimal JS for UI interactions (mobile nav toggle, active state).

## 2. Design Tokens (`tokens.css`)

### Colors - Dark Mode (Default)

- **Backgrounds**: `--bg-body` (#050505), `--bg-card` (#0a0a0a)
- **Text**: `--text-primary` (#ededed), `--text-secondary` (#a1a1a1)
- **Accents**: `--accent-primary` (#32d74b - Neon Green), `--accent-glow` (Green glow)
- **Borders**: `--border-subtle` (#222), `--border-focus` (#32d74b)

### Typography

- **Font Stack**: Inter (UI), JetBrains Mono (Code/Technical)
- **Sizes**: standard 16px base, fluid headings.

## 3. Core Components (`components.css`)

### Buttons (`.btn`)

- `.btn`: Base class
- `.btn-primary`: Action button (filled accent)
- `.btn-secondary`: Secondary action (outline/subtle)
- `.btn-sm`: Small variant

### Cards (`.card`)

- Used for projects, games, and items.
- Features subtle glass effect border and hover lift.
- Structure:

  ```html
  <article class="card">
    <h3>Title</h3>
    <p>Description...</p>
    <a class="btn">Action</a>
  </article>
  ```

### Badges (`.badge`)

- Small status indicators or tags.
- `.badge-accent`: Highlight variant.

### Navigation (`.navbar`)

- Sticky, glass-morphism header.
- Responsive mobile menu with hamburger toggle.

## 4. Usage

To use the design system in a new page:

1. **Include CSS files** in the `<head>` in this specific order:

    ```html
    <link rel="stylesheet" href="/assets/css/reset.css" />
    <link rel="stylesheet" href="/assets/css/tokens.css" />
    <link rel="stylesheet" href="/assets/css/base.css" />
    <link rel="stylesheet" href="/assets/css/components.css" />
    ```

2. **Include Scripts**:

    ```html
    <script src="/assets/js/site.config.js"></script>
    <script src="/assets/js/seo.js"></script>
    <script src="/assets/js/ui.js" defer></script>
    ```

3. **Use the Layout Structure**:

    ```html
    <body>
        <header class="navbar">...</header>
        <main id="main">
            <section class="hero-section">...</section>
            <section class="section">...</section>
        </main>
        <footer>...</footer>
    </body>
    ```
