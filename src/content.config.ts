import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Content collections are the CMS. To change what the site says, edit the
 * markdown in src/content — no code, no dashboard, no deploy config.
 */

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    /** Short label used in navigation and card grids. */
    navLabel: z.string(),
    order: z.number(),
    summary: z.string(),
    /** One-line promise shown under the page title. */
    lede: z.string(),
    /** Bullet list of what is actually included in the service. */
    includes: z.array(z.string()),
    /** Who the service is for. */
    bestFor: z.array(z.string()),
    /** Optional booking link override; defaults to the free inspection. */
    bookingUrl: z.string().url().optional(),
    icon: z.enum(["home", "building", "factory", "medical", "dryer"]),
  }),
});

const areas = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/areas" }),
  schema: z.object({
    title: z.string(),
    /** The hub city name on its own, e.g. "Greenville". */
    city: z.string(),
    order: z.number(),
    summary: z.string(),
    /** Which office in src/data/site.ts covers this area. */
    officeSlug: z.enum(["greenville", "raleigh-triangle", "wilmington"]),
    /** Towns served, shown as a directory block. */
    towns: z.array(z.string()),
    /** Why indoor air is a particular concern in this area. */
    localAngle: z.string(),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faqs" }),
  schema: z.object({
    question: z.string(),
    order: z.number(),
    category: z.enum([
      "Getting started",
      "The cleaning itself",
      "Cost",
      "Health & air quality",
      "Choosing a company",
    ]),
  }),
});

export const collections = { services, areas, faqs };
