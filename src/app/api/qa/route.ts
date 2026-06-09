import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamQAAnswer } from "@/lib/ai/qa";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().max(6000).default(""),
  explanation: z.string().max(3000).default(""),
  context: z.string().max(6000).default(""),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(24).default([]),
  question: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "qa", 40);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code, explanation, context, messages, question } = parsed.data;

  const allMessages = [...messages, { role: "user" as const, content: question }];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamQAAnswer(code, explanation, allMessages, false, context || undefined)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Q&A failed";
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
