// Google sign-in gate for the internal side of carolinaqualityair.xyz. Runs only on the paths in public/_routes.json;
// the public marketing site never touches a Function. Sign-in itself happens on the DuctStudy worker, which already holds
// CQA's Google client: it verifies the Google account and POSTs back a 30-day Ed25519-signed pass (ductstudy repo, /auth/desk).
// This file checks that pass against the worker's public key and the ALLOW list below. To let someone in, add their
// Google email to ALLOW and push.
const ALLOW = new Set(["bennyforeman1@gmail.com", "carolinaqualityairinc@gmail.com"]);
const DESK_KEY = { kty: "OKP", crv: "Ed25519", x: "K4P9C52zOw73g16LGpGlRRm0yE9gGYUzd7xTWJzup1U" }; // https://ductstudy.bennyforeman1.workers.dev/desk/key
const AUTH = "https://ductstudy.bennyforeman1.workers.dev/auth/desk";
const HOME = "https://carolinaqualityair.xyz";
const COOKIE = "cqa_desk";
const PREVIEW_BOT = /facebookexternalhit|Facebot|Twitterbot|Slackbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|redditbot|Applebot|SkypeUriPreview|Google-PageRenderer/i;

// Every signed-in page gets a small way back to Staff HQ, without editing each page.
const HQ_PILL = `<a href="/hq/" aria-label="Staff HQ" style="position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;background:#0f2233;color:#fff;font:700 13px/1 system-ui,-apple-system,sans-serif;letter-spacing:.04em;padding:9px 13px;border-radius:999px;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.28);border:1px solid #2c4358">HQ</a>`;

let keyP;
const key = () => keyP ||= crypto.subtle.importKey("jwk", DESK_KEY, { name: "Ed25519" }, false, ["verify"]);
const bytes = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function check(pass) {
  const [p, sig] = String(pass || "").split(".");
  if (!p || !sig) return null;
  try {
    if (!(await crypto.subtle.verify("Ed25519", await key(), bytes(sig), new TextEncoder().encode(p)))) return null;
    const b = JSON.parse(new TextDecoder().decode(bytes(p)));
    return b.aud === "cqa-desk" && b.exp > Date.now() && b.e ? b : null;
  } catch (e) { return null; }
}
const cookieOf = req => (/(?:^|;\s*)cqa_desk=([^;]+)/.exec(req.headers.get("cookie") || "") || [])[1];
const safeNext = n => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/hq/");
const signIn = next => AUTH + "?next=" + encodeURIComponent(HOME + safeNext(next));

const page = (title, body, status = 200, headers = {}) => new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)} · Carolina Quality Air</title><link rel="icon" href="/favicon.svg"><style>
:root{--ink:#14212e;--dim:#5a6878;--bg:#f3f5f7;--card:#fff;--line:#d9e0e7;--blue:#0072bb;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--ink:#e3eaf1;--dim:#93a3b4;--bg:#0c141c;--card:#131e29;--line:#243241;--blue:#4aa8e8}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,sans-serif;padding:24px 16px;box-sizing:border-box}
main{max-width:420px;width:100%;background:var(--card);border:1px solid var(--line);border-top:4px solid #0072bb;border-radius:8px;padding:28px 24px}
h1{font-size:21px;margin:0 0 8px}p{margin:0 0 14px;color:var(--dim)}
a.btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:46px;border-radius:6px;background:#0072bb;color:#fff;text-decoration:none;font-weight:600}
a.btn:focus-visible{outline:3px solid var(--blue);outline-offset:2px}a{color:var(--blue)}small{color:var(--dim);display:block;margin-top:14px}
</style><main>${body}</main></html>`, { status, headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", ...headers } });

const G = `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#fff" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></svg>`;
const ERR = { expired: "The sign-in took too long. Try again.", cancelled: "Sign-in was cancelled.", failed: "Google sign-in didn't go through. Try again.", unverified: "That Google account's email isn't verified." };

async function ogStub(ctx, url) {
  const r = await ctx.next();
  if (!(r.headers.get("content-type") || "").includes("text/html")) return new Response(null, { status: 404 });
  const h = await r.text(), meta = n => (new RegExp(`<meta[^>]+(?:property|name)="${n}"[^>]+content="([^"]*)"`, "i").exec(h) || [])[1];
  const t = meta("og:title") || (/<title>([^<]*)/i.exec(h) || [])[1] || "Carolina Quality Air", img = meta("og:image");
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>${t}</title><meta property="og:title" content="${t}"><meta property="og:url" content="${esc(url.href)}"><meta property="og:site_name" content="Carolina Quality Air">${img ? `<meta property="og:image" content="${img}"><meta name="twitter:image" content="${img}"><meta name="twitter:card" content="summary_large_image">` : ""}`, { headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}

export async function onRequest(ctx) {
  const req = ctx.request, url = new URL(req.url);
  if (url.hostname !== "carolinaqualityair.xyz" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return Response.redirect(HOME + url.pathname + url.search, 301);
  const p = url.pathname;

  if (p === "/_desk/cb" && req.method === "POST") {
    const f = await req.formData().catch(() => null), pass = f && f.get("pass"), who = await check(pass);
    if (!who) return page("Sign-in failed", `<h1>Sign-in didn't go through</h1><p>The pass from Google sign-in wasn't valid.</p><a class="btn" href="${esc(signIn(f && f.get("next")))}">${G}Try again</a>`, 400);
    if (!ALLOW.has(who.e)) return page("Not on the list", `<h1>Staff only</h1><p>You're signed in as <b>${esc(who.e)}</b>, which isn't on this site's staff list.</p><p>If you work with Carolina Quality Air, ask Ben to add this address.</p><a href="${HOME}/">Go to the Carolina Quality Air website</a>`, 403);
    return new Response(null, { status: 303, headers: { location: safeNext(f.get("next")), "set-cookie": `${COOKIE}=${pass}; Path=/; Max-Age=${30 * 86400}; HttpOnly; Secure; SameSite=Lax`, "cache-control": "no-store" } });
  }
  if (p === "/_desk/out") return page("Signed out", `<h1>Signed out</h1><p>You're signed out of the Carolina Quality Air staff pages on this browser.</p><a class="btn" href="${esc(signIn("/hq/"))}">${G}Sign in with Google</a><small><a href="${HOME}/">Carolina Quality Air website</a></small>`, 200, { "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  if (p === "/_desk" || p === "/_desk/") {
    const next = safeNext(url.searchParams.get("next")), err = ERR[url.searchParams.get("err")] || "";
    return page("Staff sign-in", `<h1>Staff sign-in</h1><p>${esc(err || "This part of the site is for Carolina Quality Air staff. Sign in with your Google account.")}</p><a class="btn" href="${esc(signIn(next))}">${G}Sign in with Google</a><small><a href="${HOME}/">Carolina Quality Air website</a></small>`);
  }

  const who = await check(cookieOf(req));
  if (who && ALLOW.has(who.e)) {
    const r = await ctx.next(), out = new Response(r.body, r);
    out.headers.set("x-robots-tag", "noindex, nofollow");
    out.headers.set("cache-control", "private, no-cache");
    if (p.startsWith("/hq") || !(out.headers.get("content-type") || "").includes("text/html")) return out;
    return new HTMLRewriter().on("body", { element: e => e.append(HQ_PILL, { html: true }) }).transform(out);
  }
  if ((req.method === "GET" || req.method === "HEAD") && PREVIEW_BOT.test(req.headers.get("user-agent") || "") && !/\.[a-z0-9]{2,5}$/i.test(p.replace(/\.html$/, ""))) return ogStub(ctx, url);
  if (/\/og\/[^/]+\.(jpe?g|png|webp)$/i.test(p)) return ctx.next(); // link-preview images only, never page content
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Sign in required", { status: 401 });
  return new Response(null, { status: 302, headers: { location: signIn(p + url.search), "cache-control": "no-store" } });
}
