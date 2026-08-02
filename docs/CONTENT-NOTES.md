# Content notes — read before editing marketing copy

Two things live here:

1. **Verify with Jeff** — claims the old site makes that we could not confirm,
   or actively contradicted. Some are on the new site with corrected wording;
   some were deliberately left off entirely.
2. **Honesty guardrails** — the claims a duct cleaning site must not make. This
   copy was written against this list. If you add copy, check it against this
   list first.

Sources: NADCA's "Find a Professional" directory and published committee
rosters, the company's own site, their Angi and BBB listings, EPA publication
402-K-97-002 ("Should You Have the Air Ducts in Your Home Cleaned?"), NFPA
dryer-fire statistics, and ACR — The NADCA Standard. Verified July 2026.

---

## 1. Verify with Jeff

### Corrected on the new site

| Old claim | Problem | What the site says now |
|---|---|---|
| "NADCA certified since 2000" | NADCA's directory lists the Winterville entity as a member since **11/14/2001**. The Cary entity dates from 07/09/2020. | "NADCA member since 2001" |
| "22 years of experience" (frozen since ~2021) | Stale. | Computed from the 1999 founding date in `site.ts` — it can never go stale again |
| "Eastern North Carolina's first National Association of Air Duct Cleaning Experts" | Garbles NADCA's name. There is no organisation by that name. NADCA = National Air Duct Cleaners **Association**. | Dropped. The defensible superlative — being the only company in the area that issues a NADCA certificate — is used instead |
| "NADCA is the ONLY association recognized by the FDA and EPA" | The EPA does not recognise, certify or endorse duct cleaning companies **or** associations. Repeating this is actively harmful — the EPA specifically warns consumers about companies that claim EPA credentials. | Replaced with an explicit explanation on `/nadca` that NADCA is a trade credential, not a licence |
| "Perry is Regional Coordinator for the Southern region" | NADCA's own roster lists him under **U.S. Southeast**. | "NADCA Regional Coordinator, U.S. Southeast" |
| "Indoor air can be up to 70 times more polluted than outdoor air" | Not an EPA figure. The EPA commonly cites **2–5×**. | The homepage cites two-to-five times, attributed to the EPA |
| "EPA approved sanitizer" | The EPA **registers** antimicrobial products, it does not approve them. Critically, **no product is currently EPA-registered for use on fibreglass duct board or fibreglass-lined ducts.** | Sanitiser fogging is not advertised as a standard step anywhere on the new site. `/faq` explains the registration issue honestly |

### Left off the site pending confirmation

- **Business hours.** The old site publishes none, and third-party listings
  contradict each other (Yahoo Local vs. Google-derived aggregators vs. Angi).
  Mon–Fri 8–6 is the most plausible set. **Ask Jeff, then add to `site.ts`.**
- **"37 Professional Team Members."** Nothing independently supports it, and
  data-broker listings estimate the company at a handful of people. It is a
  checkable claim, so it is not on the site. `site.stats.teamMembers` still
  holds it if Jeff confirms.
- **Jeff's NADCA committee.** Their site says Education & Safety. NADCA's
  published rosters (DucTales, 2023 and 2024) appear to list him on
  **Certification**. Confidence is moderate — the PDF extraction was imperfect.
  The site currently says "serves on a NADCA national committee", which is true
  either way. Get the exact one from Jeff.
- **10% senior discount.** Angi lists it, and Angi's own FAQ block on the same
  page contradicts it.
- **Mold remediation, water & smoke damage, HVAC service.** Angi lists these as
  services; the website never has. If they still do this work it is unadvertised
  revenue. Worth asking — but see the mold guardrail below before writing copy.
- **Any Wilmington street address.** None exists in any source. Do not invent
  one. The site says "serving the greater Wilmington area".

### Confirmed and safe to use

- Family owned and operated since 1999 (BBB records a start date of 4/22/1999)
- NADCA member, two listed locations: 111 Essex Dr, Winterville and 140
  Towerview Ct, Cary
- Perry Bagley — president/founder, ASCS/VSMR, NADCA Regional Coordinator for
  the U.S. Southeast, NADCA Mentor, teaches training classes nationally
- Jeff Bagley — son, co-owner and project manager, ASCS **and CVI** (Certified
  Ventilation Inspector — a credential the old site never mentioned)
- A NADCA-certified specialist is on site for every job
- They are the only company in the area issuing customers a NADCA certificate
- Work at hospitals, universities, nursing homes, schools and industrial plants
- Bonded and insured; free estimates; Visa/MC/Discover/Amex/check
- Phone numbers and email as listed in `src/data/site.ts`

### About the photography

The 12 before/after photographs and the two van photographs are **genuinely
theirs** — iPhone EXIF confirms the before/after set was shot by their crew in
January 2021. That is why `/proof` can say "our jobs, our camera" truthfully.

`src/assets/stock/` contains eight stock images inherited from v1, including one
whose EXIF description is "Sick patient on gurney in operating room." **None of
them are used on the site.** Do not introduce them into pages that make claims
about the company's own work. Delete the folder once nobody misses it.

---

## 2. Honesty guardrails

These are not stylistic preferences. Several are federal-law issues, and every
one of them is something the EPA or NADCA explicitly warns consumers about —
meaning making the claim marks the company as the kind of operator buyers were
told to avoid.

**Never claim EPA certification, approval or endorsement.** The EPA "neither
establishes duct cleaning standards nor certifies, endorses, or approves duct
cleaning companies." Citing EPA guidance is good. Implying an EPA credential is
disqualifying.

**Never make health claims.** No cures, treats, relieves, reduces or prevents —
for allergies, asthma, respiratory illness, headaches or sinus problems. The EPA
states duct cleaning "has never been shown to actually prevent health problems"
and advises against hiring anyone making sweeping health claims. Describe what
cleaning *removes*. Never what it *cures*.

**Never publish an energy-savings percentage.** The "20–30%" figure comes from
DOE guidance about overall HVAC maintenance and is routinely misapplied to duct
cleaning — including in some NADCA-published marketing, which makes it an easy
trap. The most that is defensible: cleaning coils, blowers and heat exchangers
may improve efficiency and system life. No number.

**Do not present improved indoor air quality as an established outcome.** Studies
do not conclusively show particle levels fall after cleaning. Write about
removing specific contamination from a specific system.

**Never assert a substance is mold without qualification.** Say "suspected
microbial growth" and recommend a tape-lift sample to a lab (~$50). Never use
petri-dish demonstrations — the EPA calls that practice inappropriate.

**Do not advertise mold remediation loosely.** Cleaning a contaminated HVAC
system and remediating mold in a building are different services under different
standards. **North Carolina has no state mold remediation licence**, so no NC
company can honestly advertise one.

**No "kills 99.9%" claims.** Antimicrobial claims are pesticide claims regulated
under federal law. The product must be EPA-registered for that specific use and
the claim must match the registered label. No products are registered for
fibreglass duct board or fibreglass-lined ducts.

**No ozone generators, no "ozone shock treatment."** The EPA describes ozone as
a lung irritant and identifies occupant reactions as a known risk.

**Do not promote duct sealants or encapsulants as a routine add-on.** EPA,
NADCA, NAIMA and SMACNA all decline to recommend routine use. Keep this distinct
from sealing duct *leaks*, which is legitimate and separate.

**Do not sell UV lights on borrowed authority.** In-duct UVGI aimed at moving
air does not achieve favourable kill rates — dwell time is too short. Coil
irradiation has a better rationale. Never attribute pathogen-kill percentages to
a residential install.

**Do not recommend cleaning as routine annual maintenance.** The EPA tells
consumers not to hire duct cleaners who do. NADCA's 3–5 year guidance is a
starting point subject to inspection, not a schedule every household owes.
(Dryer vents are different — annual is standard there, and the fire-safety case
is well documented.)

**Do not overstate what certification is.** NADCA is a trade association
credential, not a government licence. ASCS is not a "licence." Never display the
NADCA logo without current active membership.

**Never use photography deceptively.** Every before/after must be from a job
this company actually performed. Stock "filthy duct" imagery presented as
typical findings is among the most common consumer complaints in this trade.

**No fear-based urgency.** NADCA names scare tactics as a defining hallmark of
fraudulent operators. No countdown timers, no "your family is breathing this
right now."

**Avoid absolute guarantees.** Do not promise the elimination of household dust,
permanent odour removal, or that contamination will not return. Guarantee
workmanship and scope. Not results outside your control.

---

## 3. Design decision worth knowing

The typeface pairing is **Fraunces** (display) + **Public Sans** (body),
self-hosted as variable woff2 with Fraunces's optical-size axis wired to the
rendered size.

One reviewer's view during the rebuild was that Fraunces has itself become a
recognisable marker of tasteful-indie builds, and suggested Archivo Expanded +
Literata instead. That is a legitimate alternative and it is documented here on
purpose. The call to keep Fraunces was made because it reads distinctly in this
particular system — warm paper ground, clay action colour, hairline rules — and
because the pairing is carrying the pages well. If a future pass wants to
re-approach the type, Archivo Expanded + Literata is the considered alternative,
not a random swap.
