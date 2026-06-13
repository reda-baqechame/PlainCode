import type { LucideIcon } from "lucide-react";
import { TOOLS, STAGES, type Accent, type StageId } from "@/constants/tools";

interface Props {
  /** Look up name / icon / accent / stage from the tool registry. */
  toolId?: string;
  /** Overrides (used when no toolId, or to customize). */
  title?: string;
  subtitle: string;
  icon?: LucideIcon;
  accent?: Accent;
  stage?: StageId;
}

export function PageHeader({ toolId, title, subtitle, icon, accent, stage }: Props) {
  const tool = toolId ? TOOLS.find((t) => t.id === toolId) : undefined;
  const Icon = icon ?? tool?.Icon;
  const name = title ?? tool?.name ?? "";
  const acc = accent ?? tool?.accent;
  const stageId = stage ?? tool?.stage;
  const stageLabel = stageId ? STAGES.find((s) => s.id === stageId)?.label : undefined;

  return (
    <div className="space-y-3">
      {stageLabel && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${acc?.solid ?? "bg-primary"}`} />
          {stageLabel}
        </span>
      )}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-card ${acc?.text ?? "text-primary"}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{name}</h1>
      </div>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
        {subtitle}
      </p>
    </div>
  );
}
