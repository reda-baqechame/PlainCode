import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzePolish } from "@/lib/ai/polish-analyze";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().max(200).optional().default(""),
  productType: z.string().min(5).max(4000),
  audience: z.string().max(2000).optional().default(""),
  vibe: z.string().max(2000).optional().default(""),
  currentCode: z.string().max(15000).optional().default(""),
  // Optional screenshot data URL (≈ up to 7MB base64).
  screenshot: z.string().max(9_500_000).optional(),
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
    const result = await analyzePolish(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[polish/analyze]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze design" },
      { status: 500 }
    );
  }
}
