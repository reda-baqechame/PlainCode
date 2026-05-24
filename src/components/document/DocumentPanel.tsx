"use client";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Target,
  ListOrdered,
  Play,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import { SectionCard } from "@/components/output/SectionCard";
import { ConfidenceScore } from "@/components/output/ConfidenceScore";
import { FlowDiagram } from "@/components/output/FlowDiagram";
import { QAChat } from "@/components/output/QAChat";
import { ApiReferenceTable } from "./ApiReferenceTable";
import { AnnotatedCode } from "./AnnotatedCode";
import { DocActionsBar } from "./DocActionsBar";
import { CommitDocsButton } from "./CommitDocsButton";
import { exportDocumentMarkdown } from "@/lib/utils/export-markdown";
import type {
  ApiEntry,
  CodeAnnotation,
  DocumentResult,
  DocumentSection,
} from "@/types/explanation";
import type { DocumentStreamState } from "@/hooks/useDocument";
import type { DocumentExportData } from "@/lib/utils/export-markdown";

interface Props {
  stream: DocumentStreamState;
  code: string;
  isRepo?: boolean;
  privacyMode?: boolean;
  repoUrl?: string;
}

type RegenType = "FLOWCHART" | "SEQUENCE" | "DATAFLOW";

const SECTION_ORDER: DocumentSection[] = [
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
];

/**
 * Returns true once the named section has fully finished streaming —
 * i.e., its content is stable and a later section has begun (or the
 * stream is done). Used to gate Mermaid + JSON-lines rendering so we
 * don't try to parse partial output mid-stream.
 */
function isSectionComplete(
  section: DocumentSection,
  stream: DocumentStreamState
): boolean {
  if (stream.done) return true;
  if (!stream.currentSection) return false;
  const currentIdx = SECTION_ORDER.indexOf(stream.currentSection as DocumentSection);
  const targetIdx = SECTION_ORDER.indexOf(section);
  return currentIdx > targetIdx;
}

function parseJsonLines<T>(raw: string): T[] {
  if (!raw) return [];
  const out: T[] = [];
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line || !line.startsWith("{")) continue;
    try {
      out.push(JSON.parse(line) as T);
    } catch {}
  }
  return out;
}

function stripFence(text: string): string {
  return text
    .replace(/^```[a-zA-Z0-9]*\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();
}

export function DocumentPanel({ stream, code, isRepo = false, privacyMode = false, repoUrl }: Props) {
  const { sections, currentSection, confidence, done, error, result } = stream;

  const [overrides, setOverrides] = useState<Partial<Record<RegenType, string>>>({});
  const [regenning, setRegenning] = useState<RegenType | null>(null);

  // Regeneration is only possible when we still hold the original source
  // (live paste sessions) — not for repo or shared/reopened read-only views.
  const canRegenerate = done && !!code && !isRepo;

  const regenerate = async (type: RegenType) => {
    if (!canRegenerate || regenning) return;
    setRegenning(type);
    try {
      const res = await fetch("/api/document/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, diagramType: type, privacyMode, isRepo: false }),
      });
      const data = await res.json();
      if (res.ok && data.diagram) {
        setOverrides((o) => ({ ...o, [type]: data.diagram }));
      }
    } catch {
      // leave the existing diagram in place on failure
    } finally {
      setRegenning(null);
    }
  };

  const apiEntries = useMemo<ApiEntry[]>(() => {
    if (result?.apiEntries) return result.apiEntries;
    return isSectionComplete("API", stream) ? parseJsonLines<ApiEntry>(sections.API) : [];
  }, [result, sections.API, stream]);

  const annotations = useMemo<CodeAnnotation[]>(() => {
    if (result?.annotations) return result.annotations;
    return isSectionComplete("ANNOTATIONS", stream)
      ? parseJsonLines<CodeAnnotation>(sections.ANNOTATIONS)
      : [];
  }, [result, sections.ANNOTATIONS, stream]);

  const title = useMemo(() => {
    const raw = result?.title ?? sections.TITLE;
    return raw.split("\n")[0]?.trim() || "Documentation";
  }, [result, sections.TITLE]);

  const example = useMemo(() => stripFence(result?.example ?? sections.EXAMPLE), [result, sections.EXAMPLE]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!sections.TITLE && !sections.OVERVIEW && !currentSection) return null;

  const detectedLanguage = result?.detectedLanguage ?? "";

  // A regenerated diagram (override) wins over the originally streamed one.
  const flowchartSrc = overrides.FLOWCHART ?? sections.FLOWCHART;
  const sequenceSrc = overrides.SEQUENCE ?? sections.SEQUENCE;
  const dataflowSrc = overrides.DATAFLOW ?? sections.DATAFLOW;

  const exportData: DocumentExportData = {
    title,
    overview: sections.OVERVIEW,
    purpose: sections.PURPOSE,
    apiEntries,
    steps: sections.STEPS,
    flowchart: flowchartSrc,
    sequenceDiagram: sequenceSrc,
    dataflow: dataflowSrc,
    example,
    edgeCases: sections.EDGECASES,
    complexity: sections.COMPLEXITY,
    detectedLanguage,
  };

  const showFlowchart = isSectionComplete("FLOWCHART", stream) && flowchartSrc.trim();
  const showSequence = isSectionComplete("SEQUENCE", stream) && sequenceSrc.trim();
  const showDataflow = isSectionComplete("DATAFLOW", stream) && dataflowSrc.trim();
  const showAnnotated = !isRepo && isSectionComplete("ANNOTATIONS", stream) && annotations.length > 0;

  const shareResult: DocumentResult | null = result
    ? { ...result, flowchart: flowchartSrc, sequenceDiagram: sequenceSrc, dataflow: dataflowSrc }
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">
            {title}
          </h2>
          {detectedLanguage && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Detected: {detectedLanguage}
            </p>
          )}
        </div>
        {done && confidence !== undefined && <ConfidenceScore score={confidence} />}
      </div>

      {done && <DocActionsBar data={exportData} code={code} isRepo={isRepo} result={shareResult} />}

      {done && isRepo && repoUrl && (
        <CommitDocsButton
          repoUrl={repoUrl}
          markdown={exportDocumentMarkdown(exportData)}
          defaultPath={`docs/${(title || "documentation")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40) || "documentation"}.md`}
        />
      )}

      <SectionCard
        title="Overview"
        icon={<BookOpen className="h-4 w-4 text-blue-500" />}
        content={sections.OVERVIEW}
        isStreaming={currentSection === "OVERVIEW"}
      />

      <SectionCard
        title="Purpose"
        icon={<Target className="h-4 w-4 text-rose-500" />}
        content={sections.PURPOSE}
        isStreaming={currentSection === "PURPOSE"}
      />

      <ApiReferenceTable
        entries={apiEntries}
        isStreaming={currentSection === "API"}
      />

      <SectionCard
        title="Step-by-Step"
        icon={<ListOrdered className="h-4 w-4 text-purple-500" />}
        content={sections.STEPS}
        isStreaming={currentSection === "STEPS"}
      />

      {showFlowchart && (
        <FlowDiagram
          diagram={flowchartSrc}
          title="Control Flow"
          downloadName="control-flow.svg"
          onRegenerate={canRegenerate ? () => regenerate("FLOWCHART") : undefined}
          regenerating={regenning === "FLOWCHART"}
        />
      )}

      {showSequence && (
        <FlowDiagram
          diagram={sequenceSrc}
          title="Sequence Diagram"
          downloadName="sequence.svg"
          onRegenerate={canRegenerate ? () => regenerate("SEQUENCE") : undefined}
          regenerating={regenning === "SEQUENCE"}
        />
      )}

      {showDataflow && (
        <FlowDiagram
          diagram={dataflowSrc}
          title="Data Flow"
          downloadName="data-flow.svg"
          onRegenerate={canRegenerate ? () => regenerate("DATAFLOW") : undefined}
          regenerating={regenning === "DATAFLOW"}
        />
      )}

      {(currentSection === "FLOWCHART" || currentSection === "SEQUENCE" || currentSection === "DATAFLOW") && (
        <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="animate-pulse">●</span>
          Drawing {currentSection === "FLOWCHART" ? "control flow" : currentSection === "SEQUENCE" ? "sequence" : "data flow"} diagram...
        </div>
      )}

      <ExampleBlock
        example={example}
        rawWhileStreaming={sections.EXAMPLE}
        isStreaming={currentSection === "EXAMPLE"}
        language={detectedLanguage}
      />

      <SectionCard
        title="Edge Cases & Gotchas"
        icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
        content={sections.EDGECASES}
        isStreaming={currentSection === "EDGECASES"}
      />

      <SectionCard
        title="Complexity & Performance"
        icon={<Gauge className="h-4 w-4 text-cyan-500" />}
        content={sections.COMPLEXITY}
        isStreaming={currentSection === "COMPLEXITY"}
      />

      {showAnnotated && <AnnotatedCode code={code} annotations={annotations} />}

      {done && (
        <QAChat
          code={code.slice(0, 6000)}
          explanation={[sections.OVERVIEW, sections.PURPOSE, sections.STEPS]
            .filter(Boolean)
            .join("\n\n")
            .slice(0, 2800)}
        />
      )}
    </div>
  );
}

function ExampleBlock({
  example,
  rawWhileStreaming,
  isStreaming,
  language,
}: {
  example: string;
  rawWhileStreaming: string;
  isStreaming: boolean;
  language: string;
}) {
  const display = example || (isStreaming ? stripFence(rawWhileStreaming) : "");
  if (!display && !isStreaming) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2 section-fade-in">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Play className="h-4 w-4 text-emerald-500" />
        Usage Example
        {language && (
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            {language}
          </span>
        )}
      </div>
      {display ? (
        <pre className="text-xs font-mono leading-6 bg-muted/40 rounded-md p-3 overflow-x-auto">
          <code className="text-foreground/90 whitespace-pre">{display}</code>
        </pre>
      ) : (
        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <span className="animate-pulse">●</span>
          Generating...
        </div>
      )}
    </div>
  );
}
