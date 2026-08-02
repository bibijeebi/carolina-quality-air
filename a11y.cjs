const { createServer } = require("http");
const { readFileSync, existsSync } = require("fs");
const { join, extname } = require("path");

const mime = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".avif": "image/avif",
};

const srv = createServer((req, res) => {
  let p = req.url.split("?")[0];
  if (p.endsWith("/")) p += "index.html";
  let f = join("dist", p);
  if (!existsSync(f)) f = join("dist", p, "index.html");
  let data;
  try { data = readFileSync(f); } catch { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": mime[extname(f)] || "text/html" });
  res.end(data);
}).listen(4444, async () => {
  const { chromium } = require("playwright");
  const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
  const routes = ["/", "/about/", "/services/", "/faq/", "/contact/", "/testimonials/", "/nadca/", "/proof/", "/service-areas/greenville/", "/services/residential/"];
  const b = await chromium.launch({ args: ["--no-sandbox"], executablePath: process.env.CHROME_PATH });
  let total = 0;
  for (const r of routes) {
    const p = await b.newPage();
    await p.goto("http://localhost:4444" + r, { waitUntil: "load", timeout: 15000 });
    await p.addScriptTag({ content: axe });
    const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] })).violations);
    if (v.length) {
      total += v.length;
      console.log(r, JSON.stringify(v.map(x => ({ id: x.id, n: x.nodes.length, t: x.nodes.slice(0, 3).map(y => y.target[0]) }))));
    } else console.log(r, "clean");
    await p.close();
  }
  console.log("TOTAL VIOLATIONS:", total);
  await b.close();
  srv.close();
  process.exit(0);
});
