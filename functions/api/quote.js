// The quote form posts here, on the site's own address, and this passes the post on to the form worker
// (cqa-form-handler: saves the lead and emails the office). The public page source never carries the worker's address.
const WORKER = "https://cqa-form-handler.bennyforeman1.workers.dev";
const PASS = ["content-type", "accept", "accept-language", "user-agent", "origin", "referer"];
const CALL = "252-321-7447";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function onRequestPost({ request }) {
  const headers = new Headers();
  for (const h of PASS) { const v = request.headers.get(h); if (v) headers.set(h, v); }
  // The worker sees this Function as the caller, so the visitor's own address goes along in the standard header.
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("x-forwarded-for", ip);

  let res;
  try { res = await fetch(WORKER, { method: "POST", headers, body: request.body, redirect: "manual" }); }
  catch (e) { res = Response.json({ error: `Could not reach the server. Please call ${CALL} and we will take care of it.` }, { status: 502 }); }

  // The page's script posts with fetch and reads the worker's JSON, so that answer goes back as it is. A browser
  // with no script posts the form itself and would be left looking at raw JSON: it gets the same answer as a page.
  const wantsPage = (request.headers.get("accept") || "").includes("text/html");
  if (!wantsPage || !(res.headers.get("content-type") || "").includes("json")) return res;
  const d = await res.json().catch(() => ({}));
  const head = res.ok ? "Message sent." : "That did not go through.";
  const msg = res.ok ? d.message ?? "Got it. We will be in touch within a business day." : d.error ?? `Please call ${CALL}.`;
  const next = res.ok ? `<a href="/">Back to the home page</a>` : `<a href="/contact/#quote-form">Back to the form</a>, or call <a href="tel:+12523217447">${CALL}</a>.`;
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${head.slice(0, -1)} | Carolina Quality Air</title><link rel="icon" href="/favicon.svg"><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f2f6f9;color:#0c1722;font:17px/1.6 system-ui,-apple-system,sans-serif;padding:24px 16px;box-sizing:border-box"><main style="max-width:30rem;background:#fff;border:1px solid #dde5ec;border-top:4px solid #0072bb;border-radius:7px;padding:28px 24px"><h1 style="font-size:1.5rem;line-height:1.2;margin:0 0 .5rem">${head}</h1><p style="margin:0 0 1rem">${esc(msg)}</p><p style="margin:0">${next}</p></main></body></html>`, { status: res.status, headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store" } });
}
