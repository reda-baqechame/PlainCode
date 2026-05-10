"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  score: number;
  className?: string;
}

function getColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

function getLabel(score: number) {
  if (score >= 85) return "High confidence";
  if (score >= 70) return "Good confidence";
  if (score >= 50) return "Moderate confidence";
  return "Low confidence";
}

export function ConfidenceScore({ score, className }: Props) {
  const [displayed, setDisplayed] = useState(score);

  useEffect(() => {
    let frame = 0;
    const duration = 800;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-8 w-8">
        <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" strokeWidth="2.5" className="stroke-muted fill-none" />
          <circle
            cx="16"
            cy="16"
            r="13"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className={cn(
              "transition-all duration-700",
              score >= 80 ? "stroke-emerald-500" : score >= 60 ? "stroke-yellow-500" : "stroke-red-500"
            )}
            strokeDasharray={`${(score / 100) * 81.7} 81.7`}
          />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", getColor(score))}>
          {displayed}
        </span>
      </div>
      <div>
        <p className={cn("text-xs font-medium", getColor(score))}>{getLabel(score)}</p>
        <p className="text-xs text-muted-foreground">3-layer AI accuracy check</p>
      </div>
    </div>
  );
}
