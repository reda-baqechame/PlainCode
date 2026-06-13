import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { compileBlueprint } from "@/lib/ai/blueprint-compile";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  input: z.object({
    name: z.string().max(200).optional().default(""),
    rawIdea: z.string().min(10).max(8000),
    targetUser: z.string().max(2000).optional().default(""),
    problem: z.string().max(2000).optional().default(""),
    extraContext: z.string().max(15000).optional().default(""),
  }),
  answers: z
    .array(
      z.object({
        id: z.number(),
        category: z.string().max(100),
        question: z.string().max(2000),
        answer: z.string().max(4000),
      })
    )
    .max(10),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "blueprint", 15);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await compileBlueprint(parsed.data.input, parsed.data.answers);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compile blueprint" },
      { status: 500 }
    );
  }
}
