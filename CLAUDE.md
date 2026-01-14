# Carolina Quality Air Website

## Project Overview
Marketing website for Carolina Quality Air, a family-owned NADCA-certified air duct cleaning company in Eastern North Carolina. Site built with Astro, hosted on Cloudflare Pages.

## Tech Stack
- **Framework**: Astro 5.x (static site generation)
- **Styling**: Tailwind CSS (via CDN in layout)
- **Hosting**: Cloudflare Pages (auto-deploy from main branch)
- **Backend**: Cloudflare Workers + D1 (separate repo/deployment)

## URLs
| Environment | URL |
|-------------|-----|
| Production | https://carolina-quality-air.pages.dev |
| Admin Panel | https://cqa-admin.bennyforeman1.workers.dev |
| Testimonials API | https://cqa-admin.bennyforeman1.workers.dev/api/public/testimonials |

## Project Structure
```
src/
├── components/
│   ├── Header.astro    # Nav with mobile menu
│   └── Footer.astro    # Footer with contact info
├── layouts/
│   └── Layout.astro    # Base HTML layout, meta tags, Tailwind
├── pages/
│   ├── index.astro     # Homepage (dynamic testimonials)
│   ├── about.astro     # Company history, team
│   ├── services.astro  # Service offerings
│   ├── benefits.astro  # Why clean ducts
│   ├── contact.astro   # Contact form
│   ├── testimonials.astro  # Full testimonials page
│   └── nadca.astro     # NADCA certification info
└── styles/
    └── global.css      # Custom styles, animations
public/
└── images/             # Static images (before/after, logos, etc.)
```

## Key Integrations

### Dynamic Testimonials
Homepage fetches testimonials from the admin API at build time isn't needed - it's client-side JS:
```javascript
fetch('https://cqa-admin.bennyforeman1.workers.dev/api/public/testimonials')
```
API returns JSON array with `name`, `location_type`, `rating`, `text` fields. 5-minute cache.

### Contact Form
Submits to `https://cqa-admin.bennyforeman1.workers.dev/api/submissions` (not yet wired up in this codebase - form currently just has mailto fallback).

## Development
```bash
npm install
npm run dev      # Local dev server at localhost:4321
npm run build    # Build to dist/
```

## Deployment
Automatic on push to `main` branch via Cloudflare Pages GitHub integration.

Manual deploy (if needed):
```bash
npm run build
npx wrangler pages deploy dist --project-name=carolina-quality-air
```

## Brand Colors
- Primary blue: `brand-600` (#2563eb equivalent, defined in Tailwind config)
- Backgrounds: slate-50, slate-900
- Accents: emerald for badges, amber for stars

## TODO
- [ ] Wire contact form to Workers API instead of mailto
- [ ] Make /testimonials page fetch dynamically (currently hardcoded)
- [ ] Add Cal.com booking embed for free inspections
- [ ] Service area map
- [ ] Blog/content section

## Related Repos/Resources
- Admin panel Worker: deployed separately via wrangler (cqa-admin)
- D1 Database: `cqa-contacts` (73a15800-6f3a-4dca-9dca-8083389f7ecc)
