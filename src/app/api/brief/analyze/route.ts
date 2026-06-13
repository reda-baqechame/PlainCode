import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeBrief } from "@/lib/ai/brief-analyze";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().max(200).optional().default(""),
  rawIdea: z.string().min(10).max(8000),
  targetUser: z.string().max(2000).optional().default(""),
  problem: z.string().max(2000).optional().default(""),
  extraContext: z.string().max(15000).optional().default(""),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "brief", 15);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await analyzeBrief(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze idea" },
      { status: 500 }
    );
  }
}
