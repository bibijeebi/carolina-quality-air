// node tests/gate.test.mjs
// The gate must decide on the path the asset server serves. Every spelling here reached an internal page, or could.
import assert from "node:assert/strict";
import { onRequest } from "../functions/_middleware.js";

const hit = async (path, host = "carolinaqualityair.xyz") => {
  let passed = false;
  const r = await onRequest({ request: new Request("https://" + host + path), next: async () => { passed = true; return new Response("asset", { headers: { "content-type": "text/html" } }); } });
  return { status: r.status, passed, robots: r.headers.get("x-robots-tag") };
};

const gated = ["/hq/", "/hq", "/%68q/", "/hq%2F", "/%6bb/", "/%4Bb/", "/KB/", "/%6Frders/", "/%77ork-load", "/work-load.html", "/work-loa%64.html",
  "/learning/%65stimator", "/learning/estimator.html", "/learning/pricing-doctrin%65", "/learning/perry-si%6d", "/learning/walk-the-jo%62",
  "//hq/", "/%2568q/", "/%252568q/", "/_desk/invite", "/%5Fdesk/invite"];
for (const p of gated) { const r = await hit(p); assert.ok(!r.passed && [302, 400].includes(r.status), `${p} must not be served signed out (got ${r.status}, passed ${r.passed})`); }

for (const p of ["/proposals/", "/%70roposals/", "/leads/2026-08-21", "/reports/"]) { const r = await hit(p); assert.ok(r.passed && /noindex/.test(r.robots || ""), `${p} is open by link and must carry noindex`); }

for (const p of ["/", "/about/", "/services/air-duct-cleaning/", "/_astro/x.css", "/learning/", "/learning/field-guide.html", "/hqx/", "/robots.txt"]) { const r = await hit(p); assert.ok(r.passed && r.status === 200, `${p} is public and must pass straight through`); }

for (const p of ["/%E0%A4%A", "/%252e%252e/hq/", "/a/%2e%2e%2fhq/"]) { const r = await hit(p); assert.ok(!r.passed || r.status === 200, `${p} handled`); }
assert.equal((await hit("/%E0%A4%A")).status, 400);

assert.equal((await hit("/hq/", "www.carolinaqualityair.xyz")).status, 301);
assert.equal((await hit("/%68q/", "carolina-quality-air.pages.dev")).status, 301);
assert.ok((await hit("/about/", "www.carolinaqualityair.xyz")).passed);
assert.ok(!(await hit("/hq/og/x.jpg%2F..%2Findex.html")).passed);
assert.ok((await hit("/proposals/og/study-tool.jpg")).passed);
console.log("gate: ok");
