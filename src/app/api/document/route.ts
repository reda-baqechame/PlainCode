import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encodePipelineStream } from "@/lib/ai/pipeline";

const schema = z.object({
  code: z.string().min(1).max(50000),
  outputLanguage: z.string().default("English"),
  privacyMode: z.boolean().default(false),
  isRepo: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code, outputLanguage, privacyMode, isRepo } = parsed.data;

  const pipelineStream = encodePipelineStream({
    code,
    outputLanguage,
    privacyMode,
    mode: "document",
    isRepo,
  });

  return new Response(pipelineStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
