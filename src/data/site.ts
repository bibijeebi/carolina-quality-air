/**
 * Single source of truth for business facts.
 *
 * Every phone number, address and claim on the site reads from here, so a
 * correction happens in exactly one place.
 *
 * Facts were recovered from the January 2026 build, the live cqa-admin
 * content API, and verified in July 2026 against NADCA's "Find a
 * Professional" directory, the company's own site, Angi and BBB listings.
 *
 * VERIFY-WITH-JEFF list (deliberately NOT published anywhere on the site
 * until he confirms — see docs/CONTENT-NOTES.md):
 *   - Business hours. Third-party listings contradict each other.
 *   - Whether Jeff sits on NADCA's Certification committee or the
 *     Education & Safety committee. Their current site says the latter;
 *     NADCA's published rosters suggest the former.
 *   - The 10% senior discount that Angi lists (Angi contradicts itself).
 */

const FOUNDED = 1999;

export const site = {
  name: "Carolina Quality Air",
  tagline: "Cleaning up your indoor air pollution",
  founded: FOUNDED,

  /**
   * NADCA's directory lists the Winterville entity as a member since
   * 11/14/2001 and the Cary entity since 07/09/2020. The old site claimed
   * "certified since 2000", which NADCA's own records do not support, so
   * the site says 2001 or simply "for over twenty years".
   */
  nadcaMemberSince: 2001,

  /** Derived, never hardcoded — the old site sat on "22 years" for half a decade. */
  get yearsInBusiness() {
    return new Date().getFullYear() - FOUNDED;
  },

  email: "carolinaqualityair@yahoo.com",

  /** Primary number — the Winterville shop. */
  phone: {
    display: "252-321-7447",
    href: "tel:+12523217447",
  },

  offices: [
    {
      slug: "greenville",
      name: "Greenville / Winterville",
      shortName: "Greenville",
      street: "111 Essex Dr",
      city: "Winterville, NC 28590",
      phone: "252-321-7447",
      phoneHref: "tel:+12523217447",
      mapUrl: "https://goo.gl/maps/arg4sqCekj4WjdP77",
      role: "Headquarters",
    },
    {
      slug: "raleigh-triangle",
      name: "Raleigh / Cary",
      shortName: "Raleigh",
      street: "140 Towerview Ct",
      city: "Cary, NC 27513",
      phone: "919-907-9742",
      phoneHref: "tel:+19199079742",
      mapUrl: "https://goo.gl/maps/uxLTf7gKZSTJfqiK8",
      role: "Triangle office",
    },
    {
      /* No published street address exists for Wilmington. Do not invent one. */
      slug: "wilmington",
      name: "Wilmington",
      shortName: "Wilmington",
      street: "Serving the greater Wilmington area",
      city: "Wilmington, NC",
      phone: "910-679-4471",
      phoneHref: "tel:+19106794471",
      mapUrl: null,
      role: "Coastal service area",
    },
  ],

  /**
   * The company's own published figures. Presented on the site as their
   * claims, not as independently audited numbers.
   */
  stats: {
    systemsCleaned: "20,000+",
    teamMembers: "37",
  },

  team: [
    {
      name: "Perry Bagley",
      role: "President & founder",
      /* NADCA's directory lists him as "Perry Bagley, ASCS". Their old site
         also claimed VSMR; NADCA does not list it, so it is off the site
         until Jeff confirms. */
      credentials: [
        "ASCS — Air Systems Cleaning Specialist",
        "NADCA Regional Coordinator, U.S. Southeast",
        "Serves on NADCA national committees",
        "Teaches NADCA training classes around the country",
      ],
      bio: "Perry started the company in 1999 and still sets how the work gets done. He is one of NADCA's regional coordinators for the Southeast, which means he helps run the training other duct cleaners get certified through.",
    },
    {
      name: "Jeff Bagley",
      role: "Co-owner & project manager",
      /* NADCA's directory lists him as "Jeff Bagley, ASCS, CVI". The CVI is
         new — their old site never mentioned it. VSMR withheld as above. */
      credentials: [
        "ASCS — Air Systems Cleaning Specialist",
        "CVI — Certified Ventilation Inspector",
        "Serves on a NADCA national committee",
        "On site for the work himself",
      ],
      bio: "Perry's son. Jeff has been with the company since 2005 and is the one who shows up at your house — he runs the crews and is on site for the work himself.",
    },
  ],

  /** Self-reported to Angi; safe, verifiable-by-asking claims. */
  assurances: [
    "Free written estimates",
    "Bonded and insured",
    "Visa, MasterCard, Discover, American Express and check accepted",
  ],

  // Lead capture goes through the quote form + phone. Self-serve
  // scheduling is deliberately not offered: crew routing and job
  // duration vary too much for an open calendar. (Cal.com links
  // from the demo phase are preserved in git history.)
  booking: {
    freeInspection: "/contact",
    dryerVent: "/contact",
    commercial: "/contact",
  },

  api: {
    testimonials: "https://cqa-public-api.bennyforeman1.workers.dev/testimonials",
    formHandler: "https://cqa-form-handler.bennyforeman1.workers.dev",
  },
} as const;

export type Office = (typeof site.offices)[number];
