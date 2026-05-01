"use client";
import { Layers, ArrowRight } from "lucide-react";
import type { SystemsAnalysis as SystemsAnalysisData } from "@/app/api/vibe-check/route";

interface Props {
  data: SystemsAnalysisData;
}

function verdictLabel(v: SystemsAnalysisData["systemsVerdict"]): string {
  if (v === "scalable") return "Scalable";
  if (v === "partially-scalable") return "Partially Scalable";
  return "Not Scalable";
}

function verdictStyles(v: SystemsAnalysisData["systemsVerdict"]): string {
  if (v === "scalable")
    return "bg-green-500/10 text-green-500 border-green-500/30";
  if (v === "partially-scalable")
    return "bg-amber-500/10 text-amber-500 border-amber-500/30";
  return "bg-red-500/10 text-red-500 border-red-500/30";
}

function parseChain(item: string): { parts: string[] } {
  return { parts: item.split("→").map((p) => p.trim()).filter(Boolean) };
}

export function SystemsAnalysis({ data }: Props) {
  if (
    data.failureCascade.length === 0 &&
    data.criticalGaps.length === 0
  ) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">
            Systems Stress Test
          </h2>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${verdictStyles(
            data.systemsVerdict
          )}`}
        >
          {verdictLabel(data.systemsVerdict)}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Failure cascade */}
        {data.failureCascade.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              What breaks first at scale
            </p>
            <ol className="space-y-3">
              {data.failureCascade.map((item, i) => {
                const { parts } = parseChain(item);
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-xs font-bold text-muted-foreground mt-0.5 w-4 shrink-0 tabular-nums">
                      {i + 1}.
                    </span>
                    {parts.length > 1 ? (
                      <div className="flex flex-wrap items-center gap-1 min-w-0">
                        {parts.map((part, pi) => (
                          <span key={pi} className="flex items-center gap-1">
                            <span
                              className={`text-xs leading-relaxed ${
                                pi === 0
                                  ? "font-mono text-foreground/80"
                                  : pi === parts.length - 1
                                  ? "text-red-500/90 font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {part}
                            </span>
                            {pi < parts.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {item}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Divider */}
        {data.failureCascade.length > 0 && data.criticalGaps.length > 0 && (
          <div className="border-t border-border" />
        )}

        {/* Critical gaps */}
        {data.criticalGaps.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Missing systems
            </p>
            <ul className="space-y-2">
              {data.criticalGaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 text-xs mt-0.5 shrink-0">
                    ◆
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {gap}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
