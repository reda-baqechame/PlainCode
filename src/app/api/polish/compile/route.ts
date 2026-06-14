import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { compilePolish } from "@/lib/ai/polish-compile";
import { enforceRateLimit } from "@/lib/rate-limit";

const inputSchema = z.object({
  name: z.string().max(200).optional().default(""),
  productType: z.string().min(5).max(4000),
  audience: z.string().max(2000).optional().default(""),
  vibe: z.string().max(2000).optional().default(""),
  currentCode: z.string().max(15000).optional().default(""),
});

const schema = z.object({
  input: inputSchema,
  direction: z.string().min(1).max(200),
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
    const result = await compilePolish(parsed.data.input, parsed.data.direction);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[polish/compile]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compile design system" },
      { status: 500 }
    );
  }
}
