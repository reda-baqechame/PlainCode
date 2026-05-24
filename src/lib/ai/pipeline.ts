import { getAnthropicClient } from "./client";
import { runLayer1 } from "./layer1-intent";
import { buildLayer2SystemPrompt, buildLayer2UserPrompt } from "./layer2-explain";
import { buildDocumentSystemPrompt, buildDocumentUserPrompt } from "./layer2-document";
import { runLayer3, reviseExplanation } from "./layer3-validate";
import type {
  AudienceLevel,
  ApiEntry,
  CodeAnnotation,
  DocumentResult,
  ExplanationResult,
} from "@/types/explanation";

export type PipelineMode = "explain" | "document";

export interface PipelineOptions {
  code: string;
  audienceLevel?: AudienceLevel;
  outputLanguage: string;
  privacyMode: boolean;
  mode?: PipelineMode;
  isDiff?: boolean;
  codeBefore?: string;
  codeAfter?: string;
}

export interface PipelineStreamCallbacks {
  onSection: (section: string) => void;
  onDelta: (delta: string) => void;
  onDone: (result: ExplanationResult | DocumentResult) => void;
  onError: (error: string) => void;
}

const EXPLAIN_SECTIONS = ["SUMMARY", "BREAKDOWN", "ANALOGY", "DATAMAP", "SYSTEMS", "MERMAID"] as const;
const DOCUMENT_SECTIONS = [
  "TITLE",
  "OVERVIEW",
  "PURPOSE",
  "API",
  "STEPS",
  "FLOWCHART",
  "SEQUENCE",
  "DATAFLOW",
  "EXAMPLE",
  "EDGECASES",
  "COMPLEXITY",
  "ANNOTATIONS",
] as const;

export function parseSections(text: string, sectionNames?: readonly string[]): Record<string, string> {
  const names = sectionNames ?? EXPLAIN_SECTIONS;
  const sections: Record<string, string> = {};
  for (const n of names) sections[n] = "";

  for (let i = 0; i < names.length; i++) {
    const current = names[i];
    const startMarker = `<!-- SECTION:${current} -->`;

    const startIdx = text.indexOf(startMarker);
    if (startIdx === -1) continue;

    const contentStart = startIdx + startMarker.length;

    // If the model skipped the immediate next section, scan forward through the
    // remaining section names and stop at the first one that actually appears
    // after this section's start — so a missing BREAKDOWN doesn't make SUMMARY
    // swallow ANALOGY / DATAMAP / ... as well.
    let contentEnd = text.length;
    for (let j = i + 1; j < names.length; j++) {
      const candidate = text.indexOf(`<!-- SECTION:${names[j]} -->`, contentStart);
      if (candidate !== -1) {
        contentEnd = candidate;
        break;
      }
    }

    sections[current] = text.slice(contentStart, contentEnd).trim();
  }

  // Fallback: if no section delimiters found, treat entire text as first section
  const hasAnySections = names.some((s) => text.includes(`<!-- SECTION:${s} -->`));
  if (!hasAnySections && names.length > 0) {
    sections[names[0]] = text.trim();
  }

  return sections;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeConfidence(
  layer1Confidence: number,
  layer3Adjustment: number,
  layer3Accurate: boolean,
  layer3ErrorCount: number,
  capAt70: boolean
): number {
  let score = layer1Confidence + layer3Adjustment;
  if (!layer3Accurate && layer3ErrorCount > 0) score = Math.min(score, 60);
  if (capAt70) score = Math.min(score, 70);
  return clamp(score, 0, 100);
}

function stripCodeFence(raw: string): string {
  return raw
    .replace(/^```[a-zA-Z0-9]*\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();
}

function parseJsonLines<T>(raw: string): T[] {
  const entries: T[] = [];
  const lines = raw.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || !line.startsWith("{")) continue;
    try {
      entries.push(JSON.parse(line) as T);
    } catch {
      // Skip malformed lines silently — partial / truncated JSON during streaming
    }
  }
  return entries;
}

export async function runPipeline(
  options: PipelineOptions,
  callbacks: PipelineStreamCallbacks
): Promise<void> {
  const {
    code,
    audienceLevel,
    outputLanguage,
    privacyMode,
    mode = "explain",
    isDiff,
    codeBefore,
    codeAfter,
  } = options;

  try {
    // Layer 1 — intent cross-check (fast)
    const codeForAnalysis = isDiff ? `${codeBefore}\n---\n${codeAfter}` : code;
    const layer1Promise = runLayer1(codeForAnalysis, privacyMode);

    const client = getAnthropicClient(privacyMode);
    const sectionNames = mode === "document" ? DOCUMENT_SECTIONS : EXPLAIN_SECTIONS;
    const maxTokens = mode === "document" ? 6000 : 2500;

    const layer1 = await layer1Promise;
    const capAt70 = layer1.confidence < 60;

    let systemPrompt: string;
    let finalUserPrompt: string;

    if (mode === "document") {
      systemPrompt = buildDocumentSystemPrompt();
      finalUserPrompt = buildDocumentUserPrompt(
        code,
        layer1.inferredPurpose,
        outputLanguage,
        layer1.primaryLanguage
      );
    } else {
      const audience = audienceLevel ?? "DEVELOPER_PEER";
      systemPrompt = buildLayer2SystemPrompt(audience);
      finalUserPrompt = buildLayer2UserPrompt(
        code,
        layer1.inferredPurpose,
        outputLanguage,
        isDiff,
        codeBefore,
        codeAfter
      );
    }

    // Layer 2 — streaming
    let fullText = "";
    let currentSection = "";

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: finalUserPrompt }],
    });

    let buffer = "";

    stream.on("text", (text: string) => {
      fullText += text;
      buffer += text;

      const tempPattern = /<!-- SECTION:(\w+) -->/g;
      let match;
      let lastIndex = 0;

      while ((match = tempPattern.exec(buffer)) !== null) {
        const beforeDelimiter = buffer.slice(lastIndex, match.index);
        if (beforeDelimiter && currentSection) {
          callbacks.onDelta(beforeDelimiter);
        }
        currentSection = match[1];
        callbacks.onSection(currentSection);
        lastIndex = match.index + match[0].length;
      }

      // Send remaining text after last delimiter
      const remaining = buffer.slice(lastIndex);
      if (remaining && currentSection) {
        if (!remaining.includes("<!--")) {
          callbacks.onDelta(remaining);
          buffer = "";
        } else {
          const partialStart = remaining.lastIndexOf("<");
          callbacks.onDelta(remaining.slice(0, partialStart));
          buffer = remaining.slice(partialStart);
        }
      } else if (!currentSection && remaining) {
        buffer = remaining;
      } else {
        buffer = "";
      }
    });

    await stream.finalMessage();

    // Layer 3 — accuracy validation
    const layer3 = await runLayer3(codeForAnalysis, fullText, privacyMode);

    let finalText = fullText;

    if (!layer3.accurate && layer3.errors.length > 0) {
      const revised = await reviseExplanation(codeForAnalysis, fullText, layer3.errors, privacyMode);
      const revalidate = await runLayer3(codeForAnalysis, revised, privacyMode);
      if (revalidate.accurate || revalidate.errors.length < layer3.errors.length) {
        finalText = revised;
      }
    }

    const sections = parseSections(finalText, sectionNames);
    const confidence = computeConfidence(
      layer1.confidence,
      layer3.confidenceAdjustment,
      layer3.accurate,
      layer3.errors.length,
      capAt70
    );

    if (mode === "document") {
      const flowchart = sections.FLOWCHART;
      const sequenceDiagram = sections.SEQUENCE;
      const dataflow = sections.DATAFLOW;
      const apiEntries = parseJsonLines<ApiEntry>(sections.API);
      const annotations = parseJsonLines<CodeAnnotation>(sections.ANNOTATIONS);

      const documentResult: DocumentResult = {
        title: sections.TITLE.split("\n")[0]?.trim() || "Documentation",
        overview: sections.OVERVIEW,
        purpose: sections.PURPOSE,
        apiEntries,
        steps: sections.STEPS,
        flowchart,
        sequenceDiagram,
        dataflow,
        example: stripCodeFence(sections.EXAMPLE),
        edgeCases: sections.EDGECASES,
        complexity: sections.COMPLEXITY,
        annotations,
        detectedLanguage: layer1.primaryLanguage,
        confidenceScore: confidence,
        layer1Confidence: layer1.confidence,
        layer3Passed: layer3.accurate,
      };

      callbacks.onDone(documentResult);
    } else {
      const explainResult: ExplanationResult = {
        summaryText: sections.SUMMARY,
        breakdownText: sections.BREAKDOWN,
        analogyText: sections.ANALOGY,
        dataMapText: sections.DATAMAP,
        systemsText: sections.SYSTEMS,
        mermaidDiagram:
          sections.MERMAID === "none" || !sections.MERMAID ? undefined : sections.MERMAID,
        confidenceScore: confidence,
        layer1Confidence: layer1.confidence,
        layer3Passed: layer3.accurate,
      };
      callbacks.onDone(explainResult);
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : "Pipeline error");
  }
}

// Streaming encoder for SSE
export function encodePipelineStream(options: PipelineOptions): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      runPipeline(options, {
        onSection: (section) => send({ type: "section", section }),
        onDelta: (delta) => send({ type: "delta", delta }),
        onDone: (result) => {
          send({ type: "confidence", confidence: result.confidenceScore });
          send({ type: "done", result });
          controller.close();
        },
        onError: (error) => {
          send({ type: "error", error });
          controller.close();
        },
      });
    },
  });
}
