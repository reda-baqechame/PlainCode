import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { draftScreen } from "@/lib/ai/polish-draft";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { DesignSystem } from "@/types/polish";

const inputSchema = z.object({
  name: z.string().max(200).optional().default(""),
  productType: z.string().min(5).max(4000),
  audience: z.string().max(2000).optional().default(""),
  vibe: z.string().max(2000).optional().default(""),
  currentCode: z.string().max(15000).optional().default(""),
});

const systemSchema = z
  .object({
    direction: z.string().max(200),
    personality: z.string().max(2000),
    spacingNote: z.string().max(1000).optional().default(""),
    motionNote: z.string().max(1000).optional().default(""),
    typography: z.object({
      displayFont: z.string().max(120),
      bodyFont: z.string().max(120),
      monoFont: z.string().max(120),
    }),
  })
  .passthrough();

const schema = z.object({
  input: inputSchema,
  system: systemSchema,
  direction: z.string().min(1).max(200),
  exemplarHtml: z.string().max(40000).optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "polish", 15);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const screen = await draftScreen(
      parsed.data.input,
      parsed.data.system as unknown as DesignSystem,
      parsed.data.direction,
      parsed.data.exemplarHtml
    );
    return NextResponse.json({ screen });
  } catch (err) {
    console.error("[polish/draft]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to draft screen" },
      { status: 500 }
    );
  }
}
