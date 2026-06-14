"use client";
import { Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import type { DesignAnalysis } from "@/types/polish";

interface Props {
  analysis: DesignAnalysis;
  onPick: (directionName: string) => void;
  onBack: () => void;
  disabled?: boolean;
}

export function DirectionPicker({ analysis, onPick, onBack, disabled }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-fuchsia-500" />
          What I see
        </h2>
        <p className="text-sm text-foreground/90 leading-relaxed">{analysis.personality}</p>
        {analysis.critique.length > 0 && (
          <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Why your current UI reads as &quot;AI&quot;
            </p>
            <ul className="space-y-1">
              {analysis.critique.map((c, i) => (
                <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                  <span className="text-muted-foreground">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">Pick a direction — each is genuinely different. You can refine it after.</p>

      <div className="grid grid-cols-1 gap-3">
        {analysis.directions.map((d) => (
          <button
            key={d.id}
            onClick={() => onPick(d.name)}
            disabled={disabled}
            className="text-left rounded-lg border border-border bg-card p-5 hover:border-fuchsia-500 hover:shadow-elevated transition-all disabled:opacity-50 group"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-foreground">{d.name}</h3>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-fuchsia-500 transition-colors shrink-0" />
            </div>
            <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">{d.essence}</p>
            <p className="mt-2 text-xs text-muted-foreground font-mono">{d.signature}</p>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        disabled={disabled}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        ← Back
      </button>
    </div>
  );
}
