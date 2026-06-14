import type { PromptTarget } from "@/types/blueprint";

// Types for Polish mode: turn an app (brief + optional screenshot) into a real,
// rendered design — beautiful screens in actual code — plus the design system
// (DESIGN.md + tokens) and universal AI prompts that keep it consistent.

export type { PromptTarget };

/** Raw input the user provides on the Polish form. */
export interface PolishInput {
  /** Product name. */
  name: string;
  /** What the app is / does, in the user's words. */
  productType: string;
  /** Who it is for. */
  audience: string;
  /** Desired vibe / mood / brand hints. */
  vibe: string;
  /** Optional pasted current CSS / component code. */
  currentCode: string;
  /** Optional screenshot of the current UI, as a data URL (client → analyze only). */
  screenshot?: string;
}

/** One of the 3 design directions proposed after analysis. */
export interface DesignDirection {
  id: string;
  name: string;
  essence: string;
  /** Signature fonts / color / feel in one line. */
  signature: string;
}

/** Output of the analyze step (POST /api/polish/analyze). */
export interface DesignAnalysis {
  personality: string;
  /** Concrete "this looks AI" tells found in the current UI (empty if no screenshot). */
  critique: string[];
  directions: DesignDirection[];
}

/** The semantic color roles, as hex strings, for one theme. */
export interface DesignColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  ring: string;
  destructive: string;
  success: string;
}

export interface TypeSpecimenRow {
  name: string;
  size: string;
  weight: number;
}

export interface DesignTypography {
  displayFont: string;
  bodyFont: string;
  monoFont: string;
  /** Font family names to load from Google Fonts in the preview. */
  googleFonts: string[];
  scale: TypeSpecimenRow[];
}

export interface DesignTokens {
  tailwind: string;
  css: string;
  json: string;
}

/** A single rendered screen: self-contained HTML using the token CSS variables. */
export interface DesignScreen {
  name: string;
  html: string;
}

/** One issue found by the visual critique. */
export interface DesignIssue {
  area: string;
  problem: string;
  fix: string;
}

/** A vision critique of a rendered screen, scored against the design rubric. */
export interface DesignCritique {
  /** 0–100 craft score. */
  score: number;
  /** True if it still reads as a generic "AI-generated" template. */
  looksAI: boolean;
  issues: DesignIssue[];
  verdict: string;
}

/** The compiled design system (POST /api/polish/compile), before screens. */
export interface DesignSystem {
  direction: string;
  personality: string;
  typography: DesignTypography;
  colors: { light: DesignColors; dark: DesignColors };
  /** Base border-radius, e.g. "0.625rem". */
  radius: string;
  spacingNote: string;
  motionNote: string;
  components: { name: string; notes: string }[];
  antiSlopChecklist: string[];
  /** The full design system rendered as a DESIGN.md (export / copy / display). */
  designMd: string;
  tokens: DesignTokens;
  /** Tool-tailored prompts that apply this system in any agent. */
  prompts: Record<PromptTarget, string>;
}

/** The full Polish result stored in history / share / export. */
export interface PolishResult extends DesignSystem {
  name: string;
  /** Flagship screen first; more can be appended on demand. */
  screens: DesignScreen[];
  /** The visual critique passes that refined the flagship screen (proof of craft). */
  critiqueTrail: DesignCritique[];
}

/** The ordered token role keys — shared by serializers and the live preview. */
export const COLOR_ROLES: (keyof DesignColors)[] = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "border",
  "ring",
  "destructive",
  "success",
];
