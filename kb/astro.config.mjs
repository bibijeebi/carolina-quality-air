import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// The Shop Book: CQA's internal knowledge base. Separate Astro project so the
// marketing site's Astro 5 build stays untouched. Builds into ../dist/kb after
// the main site build (see root package.json "build").
export default defineConfig({
  site: "https://carolinaqualityair.xyz",
  base: "/kb",
  outDir: "../dist/kb",
  trailingSlash: "ignore",
  integrations: [
    starlight({
      title: "CQA Shop Book",
      description: "How Carolina Quality Air's machines, chemicals, and jobs work.",
      logo: { src: "./src/assets/logo-cqa.png", alt: "Carolina Quality Air", replacesTitle: false },
      favicon: "/favicon.svg",
      disable404Route: true,
      customCss: ["./src/styles/cqa.css"],
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/Empty.astro",
      },
      lastUpdated: false,
      pagination: true,
      head: [
        { tag: "meta", attrs: { name: "robots", content: "noindex, nofollow" } },
        { tag: "meta", attrs: { name: "theme-color", content: "#0072bb" } },
      ],
      sidebar: [
        { label: "Start here", items: [{ slug: "index" }, { slug: "how-this-works" }] },
        { label: "Decision ladders", items: [{ autogenerate: { directory: "ladders" } }] },
        {
          label: "Gear",
          items: [
            { label: "Air", items: [{ autogenerate: { directory: "gear/air" } }] },
            { label: "Vacuum & collection", items: [{ autogenerate: { directory: "gear/vacuum" } }] },
            { label: "Wash", items: [{ autogenerate: { directory: "gear/wash" } }] },
            { label: "Air treatment", items: [{ autogenerate: { directory: "gear/air-treatment" } }] },
            { label: "Hand tools & materials", items: [{ autogenerate: { directory: "gear/tools" } }] },
          ],
        },
        { label: "Chemicals", items: [{ autogenerate: { directory: "chemicals" } }] },
        {
          label: "How a job runs",
          items: [
            { slug: "jobs/the-job" },
            { label: "Procedures", collapsed: true, items: [{ autogenerate: { directory: "jobs/procedures" } }] },
            { label: "Systems", collapsed: true, items: [{ autogenerate: { directory: "jobs/systems" } }] },
            { label: "Rules", collapsed: true, items: [{ autogenerate: { directory: "jobs/rules" } }] },
          ],
        },
        { label: "Job write-ups", collapsed: true, items: [{ autogenerate: { directory: "jobs/write-ups" } }] },
        { label: "Reference", items: [{ autogenerate: { directory: "reference" } }] },
      ],
    }),
  ],
});
