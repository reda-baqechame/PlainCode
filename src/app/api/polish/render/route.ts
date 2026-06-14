import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { renderScreens } from "@/lib/ai/polish-render";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { DesignSystem } from "@/types/polish";

const inputSchema = z.object({
  name: z.string().max(200).optional().default(""),
  productType: z.string().min(5).max(4000),
  audience: z.string().max(2000).optional().default(""),
  vibe: z.string().max(2000).optional().default(""),
  currentCode: z.string().max(15000).optional().default(""),
});

// Only the fields renderScreens reads; the rest of the system rides along.
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
    tokens: z.object({ css: z.string().max(20000) }).optional(),
  })
  .passthrough();

const schema = z.object({ input: inputSchema, system: systemSchema });

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "polish", 15);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const screens = await renderScreens(parsed.data.input, parsed.data.system as unknown as DesignSystem);
    return NextResponse.json({ screens });
  } catch (err) {
    console.error("[polish/render]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to render designs" },
      { status: 500 }
    );
  }
}
