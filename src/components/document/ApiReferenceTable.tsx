"use client";
import { Braces } from "lucide-react";
import type { ApiEntry } from "@/types/explanation";

interface Props {
  entries: ApiEntry[];
  isStreaming?: boolean;
}

export function ApiReferenceTable({ entries, isStreaming }: Props) {
  if (entries.length === 0 && !isStreaming) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3 section-fade-in">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Braces className="h-4 w-4 text-indigo-500" />
        API Reference
      </div>

      {entries.length === 0 ? (
        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <span className="animate-pulse">●</span>
          Extracting signatures...
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <div key={idx} className="space-y-2 border-l-2 border-indigo-500/40 pl-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-medium">
                  {entry.kind}
                </span>
                <code className="text-xs font-mono text-foreground bg-muted/60 px-2 py-1 rounded">
                  {entry.signature}
                </code>
              </div>

              <p className="text-sm text-foreground/90">{entry.description}</p>

              {entry.params.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-left font-medium py-1 pr-3">Param</th>
                        <th className="text-left font-medium py-1 pr-3">Type</th>
                        <th className="text-left font-medium py-1">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.params.map((p, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-1 pr-3 font-mono text-foreground">
                            {p.name}
                            {p.optional && <span className="text-muted-foreground">?</span>}
                          </td>
                          <td className="py-1 pr-3 font-mono text-muted-foreground">{p.type}</td>
                          <td className="py-1 text-foreground/80">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {entry.returns && entry.returns.type && (
                <p className="text-xs">
                  <span className="text-muted-foreground">Returns: </span>
                  <code className="font-mono text-foreground">{entry.returns.type}</code>
                  {entry.returns.description && (
                    <span className="text-foreground/80"> — {entry.returns.description}</span>
                  )}
                </p>
              )}

              {entry.throws.length > 0 && (
                <div className="text-xs space-y-0.5">
                  <span className="text-muted-foreground">Throws:</span>
                  {entry.throws.map((t, i) => (
                    <div key={i} className="ml-3">
                      <code className="font-mono text-red-500">{t.type}</code>
                      <span className="text-foreground/80"> — {t.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
