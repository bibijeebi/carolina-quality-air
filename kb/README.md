# CQA Shop Book

Internal knowledge base at carolinaqualityair.xyz/kb/. Separate Astro 7 + Starlight
project so the marketing site's Astro 5 build stays untouched. The root
`npm run build` builds the site, then this project into `dist/kb/`.

- Pages: `src/content/docs/` (markdown). Links use absolute `/kb/...` paths.
- Templates and page rules: `src/content/docs/how-this-works.md`.
- `.mdx` pages that `import { Content }` from other pages are transclusions: edit the
  source page once and every page embedding it updates.
- `scripts/import-job-book.mjs` was the one-shot importer from the old Job Book.
- Every page is `noindex`.

```
npm run dev:kb   # from repo root
```
