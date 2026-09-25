# carolinaqualityair.xyz

One Cloudflare Pages project (`carolina-quality-air`), five things on one domain. Owner: Benny Foreman
(bennyforeman1@gmail.com), a tech at Carolina Quality Air (CQA). Tone everywhere: flat, direct, no hype,
no em-dashes in copy.

**The one rule:** typing carolinaqualityair.xyz must show a better parallel of CQA's real site
(carolinaqualityair.com, Webflow, run by Red Shark Digital). That is Benny's pitch to take over their
website (Proposal 005). Nothing on the public site links to, or hints at, anything else on the domain.
The Jeff-facing report folders are open to anyone with the link; everything else internal sits behind Google
sign-in.

## Map

| Part | Paths | Source | Access |
|---|---|---|---|
| Public site | `/`, `/services/*`, `/service-areas/*`, `/proof`, `/nadca`, `/about`, `/testimonials`, `/faq`, `/contact`, `/404` | `src/` (Astro 5 + Tailwind 4) | Public, noindexed until handoff |
| Staff HQ | `/hq/` | `src/pages/hq/index.astro` + `src/data/hq.json` | Google sign-in |
| Jeff reports | `/proposals/`, `/leads/`, `/estimates/`, `/repairs/`, `/operations/`, `/reports/` | static HTML in `public/` | Anyone with the link, noindexed |
| Jeff desk | `/orders/`, `/work-load.html` | static HTML in `public/` | Google sign-in |
| Shop Book | `/kb/` | `kb/` (separate Astro + Starlight project, builds into `dist/kb`) | Google sign-in |
| Pricing trainers | `/learning/{estimator,walk-the-job,perry-sim,pricing-doctrine}.html` | `public/learning/` | Google sign-in |
| DuctStudy | https://ductstudy.com (hand-over page at `/learning/`) | bibijeebi/ductstudy `public/lab/` | Public; its own optional Google sign-in syncs progress |

Workers (not in this repo): `ductstudy` (DuctStudy API + D1 + the Google client; repo bibijeebi/ductstudy),
`cqa-form-handler` (contact form to D1 + Resend), `cqa-public-api` (testimonials JSON, read at build),
`cqa-admin` (testimonial admin behind Cloudflare Access), `lead-hub` + collectors (`evp-bid-watch`,
`sam-lead-watch`, ...), `acr-cheat` (old ACR hub at ascs.carolinaqualityair.xyz).

## Sign-in (functions/_middleware.js)

- Runs only on the paths in `public/_routes.json`. The public site never invokes a Function.
- The `OPEN` check comes first: `/proposals`, `/leads`, `/estimates`, `/repairs`, `/operations` and `/reports`
  are served to anyone with the link, no sign-in, with an `x-robots-tag: noindex, nofollow` header. To open or
  close a folder, edit `OPEN` in `functions/_middleware.js`. Keep it out of `public/_routes.json` only if it
  should also skip the Function (then it gets no noindex header).
- Everything else on those routes needs sign-in. No valid `cqa_desk` cookie: redirect to `https://ductstudy.bennyforeman1.workers.dev/auth/desk?next=...`.
  That worker does Google OAuth and POSTs a 30-day Ed25519-signed pass to `/_desk/cb`, which checks it
  against the embedded public key and the `ALLOW` set and sets the cookie.
- **To let someone in:** add their Google email to `ALLOW` in `functions/_middleware.js` and push.
- **Someone without Google (Jeff is AOL):** put their email in `ALLOW`, then Benny opens `/_desk/invite`
  while signed in, makes a link (default 180 days) and texts it. `/_desk/join?pass=` sets the cookie.
  Removing the email from `ALLOW` revokes it.
- `/_desk/` is the sign-in page (and error landing), `/_desk/out` signs out.
- Link-preview bots (iMessage, Slack, etc.) get only the page title and OG image, so texted links still
  preview. `/*/og/*.jpg` images are public for the same reason. Page content never is.
- Any `*.pages.dev` or `www` request to a routed path redirects to the apex, where the cookie lives.
- Signed-in HTML gets a small "HQ" pill (HTMLRewriter) linking back to `/hq/`, on open pages too. Signed-out
  visitors on an open page get no pill and no hint that the rest of the domain exists.
- If the ductstudy worker's `MASTER` secret rotates, the key changes: copy the new `x` from
  `/desk/key` into `DESK_KEY` the same day.

## Adding internal pages

- New proposal: `public/proposals/YYYY-MM-DD-slug.html` with a `№ NNN · Name` title and an og:description.
  It shows up on `/hq/` by itself (status defaults to "Waiting on Jeff"); set status in `src/data/hq.json`.
  Also add its card to `public/proposals/index.html`. One page per spend decision, updated in place.
- Lead reports, estimates, repairs, operations: same pattern, auto-listed on `/hq/`.
- A new top-level internal folder must be added to `public/_routes.json` or it is public with no noindex
  header. Add it to `OPEN` as well only if it is meant to be readable without sign-in.
- Every internal page carries `<meta name="robots" content="noindex, nofollow">`.
- OG images: commit same-origin under `public/<section>/og/`. R2 uploads break iMessage previews.
- Jeff-facing pages: plain English (no "BLUF"), facts about the job first, Benny's pricing last and
  labeled as his first pass; never describe Jeff's design thumbs-up as "approved".

## Public site

- Business facts: `src/data/site.ts` (single source). Services, areas, FAQs: `src/content/`.
  Testimonials: build-time merge of `cqa-public-api` and `src/data/testimonials.json`.
- Read `docs/CONTENT-NOTES.md` before changing copy. Its honesty guardrails are binding (no health
  claims, no EPA endorsement, no energy percentages, no "free video inspection", no invented numbers).
- `listed: false` on an office keeps it out of header/footer/contact lists (Wilmington: coastal jobs
  book through the main line; the old 910 number belongs to another business).
- Zero client framework. JS only for the before/after slider and the form upgrade.
- At handoff: remove the robots meta in `src/layouts/Layout.astro` and delete `public/robots.txt`.
- Old .com paths 301 to their equivalents (`public/_redirects`).

## Build and deploy

```
npm ci && npm ci --prefix kb
npm run build            # astro build, then the kb build into dist/kb
npx wrangler pages dev dist   # serves dist + functions locally on :8788
```

Push to `main` deploys through GitHub Actions (`.github/workflows/deploy.yml`, `wrangler pages deploy
dist/`, secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`). One deploy at a time, newest wins.
Other sessions push to this repo too: `git fetch && git rebase origin/main` before every push. Verify a
deploy by page title or content, and for gated paths by the 302 to `/auth/desk`.

## Pitch context

Retainer ($150–200/mo all-in) beats a lump sum. Pitch Jeff, not Perry. Keep the website pitch separate
from any raise conversation. Demo it on a phone.

## DuctStudy lives at ductstudy.com

Since Sept 25, 2026 the DuctStudy app is served by the `ductstudy` worker (repo bibijeebi/ductstudy, files in
`public/lab/`) at https://ductstudy.com. Edit it there, not here. `public/learning/index.html` here is a hand-over
page that carries a tech's saved progress and sign-in to ductstudy.com; `/learning/field/*` and `/learning/data/*`
301 there. What stays here under `/learning/`: the crew field guide (QR labels point at it), the EPA 608/609 and
forklift drills, ascs-cram, and the staff-only pricing trainers.
