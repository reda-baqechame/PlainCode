"use client";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface RefineEntry {
  label: string;
  status: "active" | "done";
  /** Optional craft score to show as a badge (critique passes). */
  score?: number;
}

function scoreColor(score: number): string {
  if (score >= 85) return "bg-emerald-500/10 text-emerald-600";
  if (score >= 65) return "bg-amber-500/10 text-amber-600";
  return "bg-destructive/10 text-destructive";
}

export function RefineLog({ entries }: { entries: RefineEntry[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
        <p className="text-sm font-semibold text-foreground">Designing &amp; self-critiquing</p>
      </div>
      <ol className="space-y-2">
        {entries.map((e, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            {e.status === "active" ? (
              <Loader2 className="h-4 w-4 text-fuchsia-500 animate-spin shrink-0" aria-hidden />
            ) : (
              <Check className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden />
            )}
            <span className={cn(e.status === "active" ? "text-foreground" : "text-muted-foreground")}>
              {e.label}
            </span>
            {typeof e.score === "number" && (
              <span className={cn("ml-auto text-xs font-semibold px-2 py-0.5 rounded-full", scoreColor(e.score))}>
                {e.score}/100
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
