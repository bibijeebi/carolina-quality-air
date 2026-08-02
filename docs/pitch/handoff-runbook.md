# Handoff runbook — the day Jeff says yes

Total active work: under an hour. Order matters.

## 1. Email notifications become real
1. Resend dashboard → Domains → add `carolinaqualityair.xyz` → add the three
   DNS records it gives you (zone is already on Cloudflare, 2 min).
2. Wait for verified status.
3. Update the `cqa-form-handler` worker bindings:
   - `NOTIFY_EMAILS` → whatever Jeff answered in question 10 (can be
     comma-separated).
   - In the worker source, `from:` → `quotes@carolinaqualityair.xyz`.
4. Submit a test through the live form; confirm it lands in THEIR inbox.

## 2. Point the .com at the new site
1. Find out where carolinaqualityair.com's DNS lives (registrar unknown —
   ask Jeff; likely wherever Red Shark set it up).
2. Preferred: move the .com zone into the same Cloudflare account
   (add domain → change nameservers, same dance as the .xyz).
3. Pages project → Custom domains → add `carolinaqualityair.com` and `www`.
4. Update `site` in `astro.config.mjs` to `https://carolinaqualityair.com`,
   push. Canonicals flip on deploy.
5. The .xyz stays and 301s automatically once both are on the project —
   verify with `curl -I`.

## 3. Turn indexing on (ONLY after the .com is serving)
1. `src/layouts/Layout.astro` → remove the two `noindex` meta lines.
2. `public/robots.txt` → allow all, add sitemap line.
3. Push, verify meta gone from live HTML.
4. Google Search Console → add property, submit sitemap.

## 4. Kill the old bill
1. Webflow subscription (~$30/mo) — Jeff cancels it. That line item alone
   pays for two months of the retainer.
2. Do NOT delete the Webflow site until the .com has been serving the new
   site for a week.

## 5. Loose ends
- GBP: update website field to the .com, confirm hours from question 1.
- Cal.com event types: delete or make private (dead links protection).
- Test form + phone links again on the .com specifically.
