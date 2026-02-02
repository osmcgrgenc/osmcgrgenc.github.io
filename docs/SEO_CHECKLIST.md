# SEO Checklist

Use this checklist for new pages or changes.

## Required

- [ ] `<meta charset>` and `<meta name="viewport">` present
- [ ] `Seo.apply` configured with:
  - title
  - description
  - canonicalPath
  - imagePath
  - schema
- [ ] Single H1 per page
- [ ] `<html lang>` set
- [ ] Canonical URL is correct
- [ ] OG/Twitter tags appear (via seo.js)

## Sitemap & robots

- [ ] Route added to `SiteConfig.routes.public` or `.labs`
- [ ] Labs routes are excluded from sitemap and have `noindex: true`
- [ ] `sitemap.xml` regenerated

## Accessibility

- [ ] Keyboard navigation works for primary nav
- [ ] Canvas elements have `aria-label`
- [ ] Provide short text description outside canvas

## Performance hygiene

- [ ] Avoid large font stacks per page
- [ ] Use `display=swap` for external fonts
- [ ] Avoid lazy-loading above-the-fold media
