import { getAnthropicClient } from "./client";
import { buildDiagramPrompt, type DiagramType } from "./layer2-document";

export interface RegenerateDiagramOptions {
  code: string;
  diagramType: DiagramType;
  privacyMode: boolean;
  isRepo: boolean;
}

// Single focused Sonnet call that returns one Mermaid diagram. Non-streaming —
// a single diagram is small and fast, and the caller swaps it in atomically.
export async function regenerateDiagram(opts: RegenerateDiagramOptions): Promise<string> {
  const { system, user } = buildDiagramPrompt(opts.diagramType, opts.code, opts.isRepo);
  const client = getAnthropicClient(opts.privacyMode);

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system,
    messages: [{ role: "user", content: user }],
  });

  const block = res.content[0];
  return block && block.type === "text" ? block.text.trim() : "";
}
