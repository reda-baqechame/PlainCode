import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./client";
import { runLayer1 } from "./layer1-intent";
import { buildLayer2SystemPrompt, buildLayer2UserPrompt } from "./layer2-explain";
import { runLayer3, reviseExplanation } from "./layer3-validate";
import type { AudienceLevel, ExplanationResult } from "@/types/explanation";

export interface PipelineOptions {
  code: string;
  audienceLevel: AudienceLevel;
  outputLanguage: string;
  privacyMode: boolean;
  isDiff?: boolean;
  codeBefore?: string;
  codeAfter?: string;
}

export interface PipelineStreamCallbacks {
  onSection: (section: string) => void;
  onDelta: (delta: string) => void;
  onDone: (result: ExplanationResult) => void;
  onError: (error: string) => void;
}

export function parseSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {
    SUMMARY: "",
    BREAKDOWN: "",
    ANALOGY: "",
    DATAMAP: "",
    SYSTEMS: "",
    MERMAID: "",
  };

  const sectionNames = ["SUMMARY", "BREAKDOWN", "ANALOGY", "DATAMAP", "SYSTEMS", "MERMAID"];
  for (let i = 0; i < sectionNames.length; i++) {
    const current = sectionNames[i];
    const next = sectionNames[i + 1];
    const startMarker = `<!-- SECTION:${current} -->`;
    const endMarker = next ? `<!-- SECTION:${next} -->` : null;

    const startIdx = text.indexOf(startMarker);
    if (startIdx === -1) continue;

    const contentStart = startIdx + startMarker.length;
    const contentEnd = endMarker ? text.indexOf(endMarker) : text.length;
    sections[current] = text.slice(contentStart, contentEnd === -1 ? text.length : contentEnd).trim();
  }

  // Fallback: if no section delimiters found, treat entire text as summary
  const hasAnySections = sectionNames.some((s) => text.includes(`<!-- SECTION:${s} -->`));
  if (!hasAnySections) {
    sections.SUMMARY = text.trim();
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

export async function runPipeline(
  options: PipelineOptions,
  callbacks: PipelineStreamCallbacks
): Promise<void> {
  const { code, audienceLevel, outputLanguage, privacyMode, isDiff, codeBefore, codeAfter } =
    options;

  try {
    // Layer 1 — intent cross-check (fast, parallel-ish)
    const codeForAnalysis = isDiff ? `${codeBefore}\n---\n${codeAfter}` : code;
    const layer1Promise = runLayer1(codeForAnalysis, privacyMode);

    const client = getAnthropicClient(privacyMode);
    const systemPrompt = buildLayer2SystemPrompt(audienceLevel);
    const userPrompt = buildLayer2UserPrompt(
      code,
      "analyzing...", // will update after layer1 resolves
      outputLanguage,
      isDiff,
      codeBefore,
      codeAfter
    );

    const layer1 = await layer1Promise;
    const capAt70 = layer1.confidence < 60;

    // Update user prompt with actual inferred purpose
    const finalUserPrompt = buildLayer2UserPrompt(
      code,
      layer1.inferredPurpose,
      outputLanguage,
      isDiff,
      codeBefore,
      codeAfter
    );

    // Layer 2 — streaming explanation
    let fullText = "";
    let currentSection = "";

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: finalUserPrompt }],
    });

    const sectionPattern = /<!-- SECTION:(\w+) -->/g;
    let buffer = "";

    stream.on("text", (text: string) => {
      fullText += text;
      buffer += text;

      // Check for section delimiters in buffer
      let match;
      let lastIndex = 0;
      sectionPattern.lastIndex = 0;

      const tempPattern = /<!-- SECTION:(\w+) -->/g;
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
        // Only emit if not a partial delimiter
        if (!remaining.includes("<!--")) {
          callbacks.onDelta(remaining);
          buffer = "";
        } else {
          // Keep partial delimiter in buffer
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

    // Layer 3 — accuracy validation (concurrent with end of Layer 2)
    const layer3 = await runLayer3(codeForAnalysis, fullText, privacyMode);

    let finalText = fullText;

    // Revision loop if Layer 3 found errors
    if (!layer3.accurate && layer3.errors.length > 0) {
      const revised = await reviseExplanation(codeForAnalysis, fullText, layer3.errors, privacyMode);
      const revalidate = await runLayer3(codeForAnalysis, revised, privacyMode);
      if (revalidate.accurate || revalidate.errors.length < layer3.errors.length) {
        finalText = revised;
      }
    }

    const sections = parseSections(finalText);
    const confidence = computeConfidence(
      layer1.confidence,
      layer3.confidenceAdjustment,
      layer3.accurate,
      layer3.errors.length,
      capAt70
    );

    callbacks.onDone({
      summaryText: sections.SUMMARY,
      breakdownText: sections.BREAKDOWN,
      analogyText: sections.ANALOGY,
      dataMapText: sections.DATAMAP,
      systemsText: sections.SYSTEMS,
      mermaidDiagram: sections.MERMAID === "none" || !sections.MERMAID ? undefined : sections.MERMAID,
      confidenceScore: confidence,
      layer1Confidence: layer1.confidence,
      layer3Passed: layer3.accurate,
    });
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
