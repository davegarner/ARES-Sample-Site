# ARES GRID Static Site (IIS Root)
David Garner 2026
## What is included

- Shared header and footer partials loaded into every page from `/partials/`
- Full-screen, no-main-scroll layout optimized for desktop and mobile
- Home page with typed intro and quick-link cards
- News and Projects indexes backed by JSON + Markdown, with search/filter and modal readers
- About page loaded from Markdown into a bounded modal
- Tools subsite:
  - Password Generator (CSV export)
  - Downloads
  - Gallery
  - Contact & Keys
- Multiple accent themes persisted in local storage

## IIS deployment

1. Copy the site contents to your IIS website root.
2. Ensure **Static Content** is enabled in IIS.
3. Set `index.html` as a default document if needed.
4. Browse to the site root.

## Editing content

- Header: `/partials/header.html`
- Footer: `/partials/footer.html`
- News index: `/content/news/index.json`
- News stories: `/content/news/*.md`
- Projects index: `/content/projects/index.json`
- Projects docs: `/content/projects/*.md`
- About: `/content/about.md`
- Downloads metadata: `/content/downloads/downloads.json`
- Gallery metadata: `/content/gallery/gallery.json`
- Contact & Keys: `/content/contact.md`

## Notes

- The home page tries to fetch the public IP via `https://api.ipify.org`. If blocked, it falls back to `Unavailable`.
- All navigation links are **root-relative** so they continue to work inside `/tools/`.
- Deep links use URL fragments, e.g. `/news.html#grid-stability-patch`.