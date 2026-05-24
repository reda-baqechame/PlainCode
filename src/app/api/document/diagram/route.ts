import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { regenerateDiagram } from "@/lib/ai/regenerate-diagram";

const schema = z.object({
  code: z.string().min(1).max(50000),
  diagramType: z.enum(["FLOWCHART", "SEQUENCE", "DATAFLOW"]),
  privacyMode: z.boolean().default(false),
  isRepo: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code, diagramType, privacyMode, isRepo } = parsed.data;

  try {
    const diagram = await regenerateDiagram({ code, diagramType, privacyMode, isRepo });
    if (!diagram) {
      return NextResponse.json({ error: "Could not generate diagram" }, { status: 502 });
    }
    return NextResponse.json({ diagram });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Diagram generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
