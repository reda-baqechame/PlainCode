// Curated design knowledge that grounds Polish's generation so it produces
// *specific*, characterful design — not the averaged "AI slop" an LLM defaults
// to. Injected into the analyze (directions), compile (system), and render
// (screens) prompts, and used as the rubric for the anti-slop validation pass.

/** The tells that make a UI instantly read as "AI-generated". Things to AVOID. */
export const AI_SLOP_MARKERS = `THE "AI SLOP" TELLS TO AVOID AT ALL COSTS:
- The default shadcn look: violet/indigo (#6366f1-ish) primary on a white/zinc card, used by a million AI apps.
- Generic font stack: Inter / system-ui for everything, with no display face and no personality.
- Uniform rounded-lg (~8px) on every element; no intentional radius rhythm.
- Centered everything: centered hero, three equal feature cards, centered CTA — the "template" layout.
- Emoji used as icons; gradient text on every heading; purple gradient blobs in the background.
- Flat, low-contrast grays with no real hierarchy; body and headings nearly the same weight.
- Even, timid spacing (everything 16px apart); no dense areas vs. breathing room.
- Stock copy ("Empower your workflow", "Seamlessly integrate", "Unlock the power of...").
- Glassmorphism / neumorphism applied everywhere with no reason.
- No focus states, no real empty/loading/error states, no considered motion.`;

/** What actually-good product design does. Principles to FOLLOW. */
export const DESIGN_PRINCIPLES = `PRINCIPLES OF GENUINELY GREAT UI (FOLLOW THESE):
- Decision hierarchy: decide what is primary, secondary, and hidden. One clear focal point per screen.
- A real type scale with rhythm (e.g. 1.2–1.333 ratio), distinct weights, tight tracking on large display text.
- An intentional, non-default color system: a characterful primary, true neutrals (warm or cool, never pure
  gray), and accessible contrast (WCAG AA: 4.5:1 body, 3:1 large/UI). Color used sparingly, with purpose.
- A spacing system on a 4/8px grid, used to create density where information lives and air where it breathes.
- Considered radii (often a small set, e.g. 6px controls / 12–16px cards), real elevation, purposeful motion
  (fast, eased, subtle — 120–240ms).
- Concrete, human copy — never lorem, never marketing mush.
- Light AND dark designed deliberately (dark is not just inverted; surfaces are elevated, not pure black).`;

/** Real, named reference aesthetics with concrete, copy-able token guidance. */
export const REFERENCE_AESTHETICS = `REFERENCE AESTHETICS (pick/blend to fit the product — each is a real, distinct look):
- "Technical / Linear": near-monochrome, cool graphite neutrals, a single electric accent (violet/blue used
  SPARINGLY as a highlight, not a fill), Inter/Geist body + a tighter mono for labels, small radii (6px),
  dense, keyboard-first, crisp 1px borders, subtle gradients only on focal surfaces.
- "Refined SaaS / Stripe": warm off-white, ink-navy text, a confident brand hue, generous whitespace, a
  serious sans (e.g. Söhne-like / Inter Tight), soft but real shadows, 8–12px radii, restrained.
- "Editorial / Swiss": high-contrast, mostly black/white/one ink color, a strong serif or grotesque display
  (Fraunces, Editorial New, Times-like) paired with a clean grotesque body, big type, tight grids, almost no
  rounded corners, confident negative space.
- "Warm / Friendly product": cream/sand backgrounds, warm neutrals, a friendly saturated accent (coral,
  amber, teal), a rounded-but-not-bubbly sans (e.g. General Sans), 12–16px radii, soft shadows, playful but
  controlled.
- "Bold / Expressive": a vivid, opinionated palette, oversized display type, strong color blocking, sharp or
  fully-pill radii used deliberately, high energy — used for consumer/creator products.
- "Brutalist / Mono": stark, mono or grotesque type, hard 1px black borders, near-zero radii, raw structure,
  one loud accent. Confident and anti-template when done with discipline.

GOOD FONT PAIRINGS (real Google Fonts that look designed, not default):
Fraunces + Inter Tight · Instrument Serif + Geist · Space Grotesk + Inter · Bricolage Grotesque + Inter ·
Sora + Inter · General Sans + Geist · Libre Franklin + Newsreader · IBM Plex Sans + IBM Plex Mono ·
Clash Display + Satoshi · Manrope + Fraunces. Prefer a distinctive DISPLAY face + a clean BODY face.`;

/** Compact bundle for prompts that need all of it. */
export const DESIGN_SYSTEM_BRIEF = `${AI_SLOP_MARKERS}

${DESIGN_PRINCIPLES}

${REFERENCE_AESTHETICS}`;
