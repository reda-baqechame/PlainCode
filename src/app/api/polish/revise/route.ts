import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reviseScreen } from "@/lib/ai/polish-draft";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { DesignSystem, PolishInput } from "@/types/polish";

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
    spacingNote: z.string().max(1000).optional().default(""),
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
  current: z.object({ name: z.string().max(120), html: z.string().max(40000) }),
  critique: z.object({
    score: z.number(),
    looksAI: z.boolean(),
    issues: z
      .array(z.object({ area: z.string().max(120), problem: z.string().max(2000), fix: z.string().max(2000) }))
      .max(8),
    verdict: z.string().max(2000),
  }),
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
    const screen = await reviseScreen(
      parsed.data.current,
      parsed.data.critique,
      parsed.data.system as unknown as DesignSystem,
      parsed.data.input as PolishInput
    );
    return NextResponse.json({ screen });
  } catch (err) {
    console.error("[polish/revise]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to revise" },
      { status: 500 }
    );
  }
}
