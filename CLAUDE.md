# Carolina Quality Air — Website

Marketing site for Carolina Quality Air, a family-owned NADCA-certified air duct
cleaning company in Eastern North Carolina. This is **v2**, a full design and
content rebuild of the January 2026 site.

---

## The brief (v2 rebuild)

**BLUF:** This is attempt two. A full v1 already exists from January 2026.
Recover it as raw material, don't rebuild the plumbing from scratch, spend the
new model's horsepower on design and content instead.

### What already existed (January 2026)

- Astro + Tailwind static site, deployed to Cloudflare Pages at
  `carolina-quality-air.pages.dev` — **confirmed still live**
- `cqa-admin` Cloudflare Worker: testimonials CRUD, contact form capture, Google
  OAuth, D1 database — **confirmed still live**
- Public testimonials API the site pulls from — **confirmed live, data recovered**
- Full content extraction from their real site, optimized image set
  (before/after gallery, van photos, NADCA logo)
- A RevealJS pitch deck for Jeff

### Their current site (the thing to embarrass)

`carolinaqualityair.com`, Webflow, built by Red Shark Digital, ~$30/mo.

Confirmed problems, verified July 2026:

- **Lorem ipsum live in production** — the entire Industries 4-card grid, on
  both the homepage and /about
- Dead blog containing exactly one post, "COVID-19 AND HVAC SYSTEMS"
- A viewport-eating popup (it is a real anti-impersonation notice — preserved on
  the new site as a footnote on /about rather than a modal)
- Four dead "Learn More" links: `/commercial`, `/residential`, `/industrial`,
  `/medical` all 404
- Stat block frozen at "22 years of experience" since roughly 2021
- Tagline garbles NADCA's name: "National Association of Air Duct Cleaning
  Experts" is not a real organisation

### Target

- Domain: `carolinaqualityair.xyz` or similar, ~$2 first year. Worth it over a
  `pages.dev` URL for the demo. **`.xyz` returned NXDOMAIN in July 2026, so it
  looked available — verify at the registrar before promising it.**
- Best possible state: this is a showpiece, not an MVP. Design quality is the
  whole point.
- **`noindex` the entire site until handoff.** A polished clone competing with
  their `.com` in Google helps nobody and muddies their local SEO.

### Build priorities, in order

1. **Design.** v1 was clean but generic Tailwind. This pass should look like a
   real agency did it. Local service business, trust-heavy: NADCA certs front
   and centre, before/after photos as the hero proof, real testimonials, faces
   and vans.
2. **Speed.** Static, sub-1s, perfect Lighthouse. That was v1's win — keep it.
3. **Reuse the Worker/D1 backend if recoverable**, otherwise stub. It was
   recoverable; see "Backend" below.
4. **Content upgrades v1 didn't have:** service-area pages (Greenville,
   Raleigh/Triangle, eastern NC), a real services breakdown (residential,
   commercial, dryer vent, mold-adjacent), FAQ with actual duct cleaning
   answers, click-to-call everywhere on mobile.
5. **One wow feature max.** Instant quote estimator or before/after slider. Not
   five. → the before/after slider was chosen.

### Stack rules

- Astro (latest), used as a **templating layer ONLY**: zero client-side
  framework, no React/Vue islands, no hydration. Every page ships as plain HTML
  + CSS.
- **Dependency budget: single digits.** Currently **3** runtime dependencies.
- Tailwind allowed but pinned, with a real design-token layer (colours, type
  scale, spacing) and custom fonts defined up front so the site doesn't look
  like default-Tailwind AI slop. The January build's weakness was generic
  styling, not the stack.
- JS only where a feature demands it, vanilla, no framework.
- Content in markdown content collections so edits are "Claude Code as CMS":
  describe the change, agent edits repo, builds, deploys.
- Cloudflare Pages deploy. No Docker.

### Pitch context (do not lose this)

- Demo it on a phone at a job site: "look how fast this loads." Show, don't
  pitch.
- **Retainer beats lump sum.** $150–200/mo "I handle everything" was the January
  conclusion. $10k lump is DOA for a family shop that shipped lorem ipsum.
- **Pitch Jeff, not Perry.**
- Keep this pitch in a separate conversation from the raise ask. Two asks in one
  meeting halves both.

---

## Tech stack

- **Framework:** Astro 5 (static output, zero hydration)
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite`, driven by a token layer
  in `src/styles/global.css`
- **Fonts:** Fraunces + Public Sans, self-hosted variable woff2 in
  `public/fonts` (no third-party font request)
- **Images:** `astro:assets` (sharp ships with Astro — no extra dependency)
- **Hosting:** Cloudflare Pages, auto-deploy from `main`
- **Backend:** Cloudflare Workers + D1 (separate `cqa-admin` Worker)

Total JS delivered to the browser: **one inlined ~190-byte module** for the
before/after slider. No `.js` network requests.

## Development

```bash
npm install
npm run dev      # localhost:4321
npm run build    # → dist/
npm run preview
```

## Architecture

### Content is the CMS

Everything editable lives in markdown or one TypeScript file:

| What | Where |
|---|---|
| Business facts, phones, addresses, team, credentials | `src/data/site.ts` |
| Services (5) | `src/content/services/*.md` |
| Service areas (3) | `src/content/areas/*.md` |
| FAQs (16) | `src/content/faqs/*.md` |
| Testimonials fallback | `src/data/testimonials.json` |
| Schemas | `src/content.config.ts` |

To change what the site says, edit the markdown. No dashboard, no deploy config.

### Backend

Both Workers survived and are live:

- `GET /testimonials` on `cqa-public-api` — **fetched at build time**, not in
  the browser, so testimonials are baked into the HTML (no spinner, no layout
  shift). Merged with `src/data/testimonials.json` by name, longer text wins.
  See `src/data/getTestimonials.ts`.
- `cqa-form-handler` — the contact form posts to it. The form is a real
  `<form method="POST">` that works with JavaScript disabled; a small script
  upgrades it to stay on the page.

If a build cannot reach the Worker, it logs a warning and uses the committed
testimonials. Builds never fail on it.

## URLs

| Environment | URL |
|---|---|
| Production | https://carolina-quality-air.pages.dev |
| Admin panel | https://cqa-admin.bennyforeman1.workers.dev |
| Testimonials API | https://cqa-public-api.bennyforeman1.workers.dev/testimonials |

## Cal.com booking links

| Event | URL |
|---|---|
| Free inspection | https://cal.com/benjamin-foreman-nmetle/free-inspection |
| Dryer vent | https://cal.com/benjamin-foreman-nmetle/dryer-vent |
| Commercial consultation | https://cal.com/benjamin-foreman-nmetle/commercial-consultation |

## Pages

| Route | Purpose |
|---|---|
| `/` | Hero, proof slider, services, why-it-matters, process, testimonial, areas |
| `/services` + `/services/[slug]` | 5 services |
| `/service-areas` + `/service-areas/[slug]` | Greenville, Raleigh/Triangle, Wilmington |
| `/proof` | Full before/after gallery, 6 pairs |
| `/nadca` | What certification means, ACR standard, verify-anyone |
| `/about` | The Bagleys, the certificate, impersonation notice |
| `/testimonials` | Real reviews only |
| `/faq` | 16 questions, sourced answers |
| `/contact` | Form + three offices |

## Before shipping to the client

See **`docs/CONTENT-NOTES.md`** — it lists every claim that still needs Jeff to
confirm it, and the honesty guardrails this copy is written against. Read it
before changing marketing copy.

**Removing the noindex at handoff** requires two edits:
1. Delete the `robots` meta block in `src/layouts/Layout.astro`
2. Delete `public/robots.txt`

## Deployment

Pushes to `main` trigger GitHub Actions → Cloudflare Pages.

Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
(`561fd0701605e15d264ed1ca0e27752a`).
