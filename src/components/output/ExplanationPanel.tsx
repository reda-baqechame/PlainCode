"use client";
import { BookOpen, Layers, Lightbulb, Database, Network } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { ConfidenceScore } from "./ConfidenceScore";
import { FlowDiagram } from "./FlowDiagram";
import { QAChat } from "./QAChat";

interface StreamState {
  currentSection: string;
  sections: {
    SUMMARY: string;
    BREAKDOWN: string;
    ANALOGY: string;
    DATAMAP: string;
    SYSTEMS: string;
    MERMAID: string;
  };
  confidence?: number;
  done: boolean;
  error?: string;
}

interface Props {
  stream: StreamState;
  code?: string;
  isDiff?: boolean;
}

export function ExplanationPanel({ stream, code = "", isDiff = false }: Props) {
  const { sections, currentSection, confidence, done, error } = stream;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!sections.SUMMARY && !currentSection) return null;

  const explanation = [sections.SUMMARY, sections.BREAKDOWN, sections.ANALOGY]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Explanation</h2>
        {done && confidence !== undefined && (
          <ConfidenceScore score={confidence} />
        )}
      </div>

      <SectionCard
        title="Summary"
        icon={<BookOpen className="h-4 w-4 text-blue-500" />}
        content={sections.SUMMARY}
        isStreaming={currentSection === "SUMMARY"}
      />

      <SectionCard
        title="Breakdown"
        icon={<Layers className="h-4 w-4 text-purple-500" />}
        content={sections.BREAKDOWN}
        isStreaming={currentSection === "BREAKDOWN"}
      />

      <SectionCard
        title="Analogy"
        icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
        content={sections.ANALOGY}
        isStreaming={currentSection === "ANALOGY"}
      />

      <SectionCard
        title="Data Map"
        icon={<Database className="h-4 w-4 text-green-500" />}
        content={sections.DATAMAP}
        isStreaming={currentSection === "DATAMAP"}
      />

      <SectionCard
        title={isDiff ? "Blast Radius" : "Systems Context"}
        icon={<Network className="h-4 w-4 text-cyan-500" />}
        content={sections.SYSTEMS}
        isStreaming={currentSection === "SYSTEMS"}
      />

      {done && sections.MERMAID && sections.MERMAID !== "none" && (
        <FlowDiagram diagram={sections.MERMAID} />
      )}

      {done && <QAChat code={code} explanation={explanation} />}
    </div>
  );
}
