// The Jeff-facing folders under public/ (proposals, leads, estimates, operations, reports): their pages are found at
// build time, so a new page shows up on its board by itself. Same reading as Staff HQ (src/pages/hq/index.astro).
import fs from "node:fs";
import path from "node:path";

export type Doc = { href: string; slug: string; title: string; desc: string; date: string; img: string };
const pub = path.resolve("public");
const meta = (html: string, name: string) =>
  (new RegExp(`<meta[^>]+(?:property|name)="${name}"[^>]+content="([^"]*)"`, "i").exec(html) || [])[1] || "";
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&rsquo;/g, "’").replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”").replace(/&mdash;/g, ", ").replace(/&ndash;/g, "–").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

export function scan(dir: string, keep: (f: string) => boolean = () => true): Doc[] {
  const abs = path.join(pub, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs)
    .filter((f) => f.endsWith(".html") && f !== "index.html" && keep(f))
    .map((f) => {
      const html = fs.readFileSync(path.join(abs, f), "utf8");
      if (/http-equiv="refresh"/i.test(html)) return null;
      const slug = f.replace(/\.html$/, "");
      const title = decode((/<title>([^<]*)/i.exec(html) || [])[1] || slug).replace(/\s*·\s*Carolina Quality Air\s*$/, "");
      const og = meta(html, "og:image").replace(/^https:\/\/carolinaqualityair\.xyz/, ""); // same origin, so it loads where the page is
      const date = (/^\d{4}-\d{2}-\d{2}/.exec(slug) || [""])[0];
      return { href: `/${dir}/${slug}`, slug, title, desc: decode(meta(html, "og:description") || meta(html, "description")), date, img: og && fs.existsSync(path.join(pub, og)) ? og : "" };
    })
    .filter(Boolean) as Doc[];
}
export const byDateDesc = (a: Doc, b: Doc) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
export const fmtDate = (d: string) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "");
