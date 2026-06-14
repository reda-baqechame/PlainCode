import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { critiqueScreenImage } from "@/lib/ai/polish-critique";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { DesignSystem, PolishInput } from "@/types/polish";

const inputSchema = z.object({
  name: z.string().max(200).optional().default(""),
  productType: z.string().min(5).max(4000),
  audience: z.string().max(2000).optional().default(""),
  vibe: z.string().max(2000).optional().default(""),
  currentCode: z.string().max(15000).optional().default(""),
});

const systemSchema = z.object({ direction: z.string().max(200) }).passthrough();

const schema = z.object({
  input: inputSchema,
  system: systemSchema,
  // The rendered screenshot as a JPEG data URL (downscaled client-side).
  image: z.string().max(5_000_000),
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
    const critique = await critiqueScreenImage(
      parsed.data.image,
      parsed.data.system as unknown as DesignSystem,
      parsed.data.input as PolishInput
    );
    return NextResponse.json(critique);
  } catch (err) {
    console.error("[polish/critique]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to critique" },
      { status: 500 }
    );
  }
}
