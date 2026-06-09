import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encodePipelineStream } from "@/lib/ai/pipeline";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { AudienceLevel } from "@/types/explanation";

const schema = z.object({
  codeBefore: z.string().min(1).max(25000),
  codeAfter: z.string().min(1).max(25000),
  audienceLevel: z.enum(["ELI5", "NON_TECHNICAL", "BUSINESS_CONTEXT", "TECHNICAL_NON_DEV", "DEVELOPER_PEER"]),
  outputLanguage: z.string().default("English"),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "explain-diff", 30);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { codeBefore, codeAfter, audienceLevel, outputLanguage } = parsed.data;

  const pipelineStream = encodePipelineStream({
    code: "",
    codeBefore,
    codeAfter,
    audienceLevel: audienceLevel as AudienceLevel,
    outputLanguage,
    privacyMode: false,
    isDiff: true,
  });

  return new Response(pipelineStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
