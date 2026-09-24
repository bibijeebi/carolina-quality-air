// One-shot importer: Job Book (TiddlyWiki-style) tiddlers -> Starlight pages.
import fs from "node:fs";
import path from "node:path";

const T = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = path.resolve("src/content/docs");

const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SKIP = new Set(["Contents", "Site log", "Ref: how CQA pay actually works", "Ref: the Meredith hours text", "Jeff", "Marcus", "HowTo: add a job"]);
// Equipment tiddlers folded into hand-written gear pages.
const MERGED = {
  "Equip: electric portable vacuum": "gear/vacuum/hypervac",
  "Equip: gas negative air machine": "gear/vacuum/meyer-gas-vac",
  "Equip: truck-mounted compressor": "gear/air/compressors",
  "Equip: air whip and forward nozzle": "gear/air/air-tools",
  "Equip: coil cleaner and pump sprayer": "gear/wash/coil-cleaning",
};
const route = (t) => {
  if (MERGED[t.t]) return MERGED[t.t];
  if (t.t === "The job, generically") return "jobs/the-job";
  if (t.t === "Ref: glossary") return "reference/glossary";
  if (t.t === "Ref: crew and roles") return "reference/crew-and-roles";
  const strip = (p) => slug(t.t.replace(/^[A-Za-z]+: /, ""));
  switch (t.k) {
    case "job": return "jobs/write-ups/" + slug(t.t);
    case "proc": return "jobs/procedures/" + strip();
    case "sys": return "jobs/systems/" + strip();
    case "rule": return "jobs/rules/" + strip();
    case "equip": return "gear/tools/" + strip();
  }
  return null;
};
const BY = new Map(T.map((t) => [t.t, t]));
const href = (title) => {
  const t = BY.get(title);
  if (!t || SKIP.has(title)) return null;
  return "/kb/" + route(t) + "/";
};
const pageTitle = (t) => t.t.replace(/^(Proc|Sys|Rule|Equip|Ref): /, "").replace(/^./, (c) => c.toUpperCase());

function inline(s, mdx) {
  if (mdx) s = s.replace(/[{}<>]/g, (c) => "\\" + c);
  return s
    .replace(/''(.+?)''/g, "**$1**")
    .replace(/~~(.+?)~~/g, "_($1)_")
    .replace(/@@(.+?)@@/g, "`$1`")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, label, target) => {
      if (/^https?:/.test(target)) return `[${label}](${target})`;
      const h = href(target.trim());
      return h ? `[${label}](${h})` : label;
    })
    .replace(/\[\[([^\]]+)\]\]/g, (_, target) => {
      const h = href(target.trim());
      return h ? `[${pageTitle(BY.get(target.trim()))}](${h})` : target.replace(/^(Proc|Sys|Rule|Equip|Ref): /, "");
    });
}

function convert(t, file) {
  const lines = t.x.split("\n");
  const imports = [];
  const out = [];
  const mdx = /\{\{[^}]+\}\}/.test(t.x);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const tr = line.match(/^\{\{([^}]+)\}\}$/);
    if (tr) {
      const target = BY.get(tr[1].trim());
      if (!target || SKIP.has(target.t)) continue;
      const r = route(target);
      const targetFile = files.get(target.t);
      if (!targetFile) { out.push("", `See [${pageTitle(target)}](/kb/${r}/).`, ""); continue; }
      const name = "T" + imports.length;
      const rel = path.relative(path.dirname(file), targetFile);
      imports.push(`import { Content as ${name} } from "${rel.startsWith(".") ? rel : "./" + rel}";`);
      out.push(`<${name} />`, "", `<p class="from">From <a href="/kb/${r}/">${pageTitle(target)}</a></p>`, "");
      continue;
    }
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line.slice(1, -1).split("|");
      const head = cells.every((c) => c.startsWith("!"));
      out.push("| " + cells.map((c) => inline(c.replace(/^!/, ""), mdx)).join(" | ") + " |");
      if (head) out.push("|" + cells.map(() => "---").join("|") + "|");
      continue;
    }
    if (line.startsWith("!!! ")) { out.push("", "### " + inline(line.slice(4), mdx), ""); continue; }
    if (line.startsWith("!! ")) { out.push("", "## " + inline(line.slice(3), mdx), ""); continue; }
    if (line.startsWith("# ")) { out.push("1. " + inline(line.slice(2), mdx)); continue; }
    if (line.startsWith("* ")) { out.push("- " + inline(line.slice(2), mdx)); continue; }
    out.push(line === "---" ? "\n---\n" : inline(line, mdx));
  }
  const first = t.x.split("\n").find((l) => l.trim() && !/^[!|*#{]/.test(l.trim())) || "";
  const desc = inline(first, false).replace(/[*_`[\]]/g, "").replace(/\(\/kb[^)]*\)/g, "").split(/(?<=\.)\s/)[0].slice(0, 180);
  const num = t.t.match(/^JOB-(\d+)/);
  const fm = ["---", `title: ${JSON.stringify(pageTitle(t))}`, `description: ${JSON.stringify(desc)}`];
  if (num) fm.push("sidebar:", `  order: ${+num[1]}`);
  if (t.tags?.includes("stub")) fm.push("  badge: { text: Stub, variant: caution }".replace(/^/, num ? "" : "sidebar:\n"));
  fm.push("---", "");
  return fm.join("\n") + (imports.length ? imports.join("\n") + "\n\n" : "") + out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

const files = new Map();
for (const t of T) {
  if (SKIP.has(t.t) || MERGED[t.t]) continue;
  const r = route(t);
  if (!r) continue;
  const ext = /\{\{[^}]+\}\}/.test(t.x) ? ".mdx" : ".md";
  files.set(t.t, path.join(OUT, r + ext));
}
for (const [title, file] of files) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, convert(BY.get(title), file));
  console.log(path.relative(OUT, file));
}
// Dump merged equipment notes for hand-merging.
fs.writeFileSync("scripts/merged-equip-notes.md", Object.keys(MERGED).map((k) => `# ${k}\n\n${BY.get(k).x}\n`).join("\n"));
