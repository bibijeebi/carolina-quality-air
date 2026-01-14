# Carolina Quality Air Website

Marketing website for Carolina Quality Air, a family-owned NADCA-certified air duct cleaning company in Eastern North Carolina.

## Tech Stack

- **Framework**: Astro 5.x (static site generation)
- **Styling**: Tailwind CSS (via CDN in layout)
- **Hosting**: Cloudflare Pages (auto-deploy from `main` branch)
- **Backend**: Cloudflare Workers + D1 (separate `cqa-admin` Worker)

## URLs

| Environment     | URL                                                                 |
|-----------------|---------------------------------------------------------------------|
| Production      | https://carolina-quality-air.pages.dev                              |
| Admin Panel     | https://cqa-admin.bennyforeman1.workers.dev                         |
| Testimonials API| https://cqa-admin.bennyforeman1.workers.dev/api/public/testimonials |

## Development

```bash
npm install
npm run dev      # Local dev server at localhost:4321
npm run build    # Build to dist/
npm run preview  # Preview build locally
```

## Architecture

### Frontend (this repo)
- Static Astro site
- Testimonials fetched client-side from Workers API
- Contact form submits to `cqa-form-handler` Worker

### Backend (separate)
- `cqa-admin` Worker: Admin panel with Cloudflare Access (Google OAuth)
- `cqa-form-handler` Worker: Handles contact form submissions
- D1 database `cqa-contacts`: submissions, testimonials, settings tables

## Pages

- `/` - Homepage with hero, services, benefits, testimonials preview
- `/about` - About the company, team, certifications
- `/services` - Service offerings (residential, commercial, industrial, medical)
- `/benefits` - Why clean ducts matters
- `/testimonials` - Full testimonials page (fetches from API)
- `/contact` - Contact form (submits to Workers backend)
- `/nadca` - NADCA certification info

## Key Files

- `src/pages/*.astro` - Page components
- `src/components/*.astro` - Shared components (Header, Footer)
- `src/layouts/Layout.astro` - Base layout with Tailwind CDN
- `public/images/` - Static images (logos, before-after, general)

## Deployment

Pushes to `main` trigger automatic deployment via Cloudflare Pages GitHub integration.

## Related Repos

- Admin Worker code: Deployed directly via Wrangler (not in Git yet)
