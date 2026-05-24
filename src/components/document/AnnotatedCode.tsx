"use client";
import { useMemo, useState } from "react";
import { FileCode } from "lucide-react";
import type { CodeAnnotation } from "@/types/explanation";

interface Props {
  code: string;
  annotations: CodeAnnotation[];
}

interface LineMeta {
  text: string;
  annotation?: CodeAnnotation;
  isBlockStart?: boolean;
}

const PALETTE = [
  "border-l-amber-400/70",
  "border-l-sky-400/70",
  "border-l-emerald-400/70",
  "border-l-violet-400/70",
  "border-l-rose-400/70",
  "border-l-teal-400/70",
];

export function AnnotatedCode({ code, annotations }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const lines: LineMeta[] = useMemo(() => {
    const sourceLines = code.split("\n");
    return sourceLines.map((text, i) => {
      const lineNo = i + 1;
      const annotation = annotations.find((a) => lineNo >= a.startLine && lineNo <= a.endLine);
      const isBlockStart = annotation ? lineNo === annotation.startLine : false;
      return { text, annotation, isBlockStart };
    });
  }, [code, annotations]);

  if (!code) return null;

  const colorFor = (annotation: CodeAnnotation | undefined): string => {
    if (!annotation) return "border-l-transparent";
    const idx = annotations.indexOf(annotation);
    return PALETTE[idx % PALETTE.length];
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3 section-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileCode className="h-4 w-4 text-amber-500" />
          Inline Annotated Code
        </div>
        {annotations.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {annotations.length} {annotations.length === 1 ? "annotation" : "annotations"} · hover lines to read
          </span>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
        <div className="overflow-x-auto">
          <pre className="text-xs font-mono leading-6 m-0">
            {lines.map((line, i) => {
              const annotationIdx = line.annotation ? annotations.indexOf(line.annotation) : -1;
              const isActive = annotationIdx >= 0 && annotationIdx === activeIdx;
              const colorClass = colorFor(line.annotation);
              return (
                <div
                  key={i}
                  className={`flex items-start border-l-4 ${colorClass} ${
                    isActive ? "bg-accent/50" : ""
                  } ${line.annotation ? "cursor-pointer hover:bg-accent/30" : ""}`}
                  onMouseEnter={() => line.annotation && setActiveIdx(annotationIdx)}
                  onMouseLeave={() => setActiveIdx((v) => (v === annotationIdx ? null : v))}
                >
                  <span className="select-none w-10 text-right pr-3 text-muted-foreground/60 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90 whitespace-pre">{line.text || " "}</span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      {annotations.length > 0 && (
        <div className="grid gap-2">
          {annotations.map((a, idx) => {
            const isActive = idx === activeIdx;
            const colorClass = PALETTE[idx % PALETTE.length];
            return (
              <div
                key={idx}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx((v) => (v === idx ? null : v))}
                className={`flex gap-3 text-xs border-l-4 ${colorClass} pl-3 py-1.5 rounded-r ${
                  isActive ? "bg-accent/50" : "bg-muted/30"
                } transition-colors cursor-default`}
              >
                <span className="font-mono text-muted-foreground shrink-0">
                  L{a.startLine}
                  {a.endLine !== a.startLine ? `–${a.endLine}` : ""}
                </span>
                <span className="text-foreground/90">{a.note}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
