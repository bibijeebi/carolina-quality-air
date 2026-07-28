import committed from "./testimonials.json";
import { site } from "./site";

export interface Testimonial {
  id: number;
  name: string;
  location_type: string;
  rating: number;
  text: string;
}

/**
 * Testimonials are resolved at BUILD time, not in the browser.
 *
 * The cqa-admin Worker stays the place Jeff adds reviews, but the visitor
 * never pays for that: the data is baked into the HTML, so there is no
 * fetch, no spinner and no layout shift.
 *
 * The committed copies in testimonials.json are the fuller versions
 * published on carolinaqualityair.com; the admin database currently holds
 * shortened edits of some of the same reviews. So the two sources are
 * merged by name and the longer text wins — that way anything Jeff adds in
 * the admin panel shows up, without a later edit silently truncating a
 * review we already have in full.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  const merged = new Map<string, Testimonial>();
  for (const t of committed as Testimonial[]) {
    merged.set(t.name.trim().toLowerCase(), t);
  }

  try {
    const res = await fetch(site.api.testimonials, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const live = (await res.json()) as Testimonial[];
    if (!Array.isArray(live)) throw new Error("unexpected payload shape");

    let added = 0;
    for (const t of live) {
      if (!t?.name || !t?.text) continue;
      const key = t.name.trim().toLowerCase();
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, t);
        added++;
      } else if (t.text.length > existing.text.length) {
        merged.set(key, t);
      }
    }
    console.log(
      `[testimonials] admin API returned ${live.length}; ${added} new after merge`,
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `[testimonials] admin API unavailable (${reason}) — using the ${merged.size} committed in src/data/testimonials.json`,
    );
  }

  return [...merged.values()];
}
