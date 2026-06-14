"use client";
import { Type, Palette, Ban, Shapes } from "lucide-react";
import { COLOR_ROLES, type DesignSystem } from "@/types/polish";

function Swatch({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-7 w-7 rounded-md border border-border shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-foreground truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{color}</p>
      </div>
    </div>
  );
}

export function DesignSystemPanel({ system }: { system: DesignSystem }) {
  return (
    <div className="space-y-4">
      {/* Typography */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Type className="h-4 w-4 text-fuchsia-500" /> Typography
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Display</p>
            <p className="font-medium text-foreground">{system.typography.displayFont}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Body</p>
            <p className="font-medium text-foreground">{system.typography.bodyFont}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mono</p>
            <p className="font-medium text-foreground">{system.typography.monoFont}</p>
          </div>
        </div>
        <div className="space-y-1 pt-1">
          {system.typography.scale.map((t, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 border-t border-border pt-1.5">
              <span className="text-xs text-muted-foreground">{t.name}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {t.size} · {t.weight}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Palette className="h-4 w-4 text-fuchsia-500" /> Color tokens
        </h3>
        <p className="text-xs text-muted-foreground">Light</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {COLOR_ROLES.map((r) => (
            <Swatch key={`l-${r}`} name={r} color={system.colors.light[r]} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-1">Dark</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {COLOR_ROLES.map((r) => (
            <Swatch key={`d-${r}`} name={r} color={system.colors.dark[r]} />
          ))}
        </div>
      </div>

      {/* Shape & motion */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Shapes className="h-4 w-4 text-fuchsia-500" /> Shape &amp; motion
        </h3>
        <p className="text-sm text-foreground/85"><span className="text-muted-foreground">Radius:</span> {system.radius}</p>
        <p className="text-sm text-foreground/85"><span className="text-muted-foreground">Spacing:</span> {system.spacingNote}</p>
        <p className="text-sm text-foreground/85"><span className="text-muted-foreground">Motion:</span> {system.motionNote}</p>
      </div>

      {/* Anti-slop rules */}
      {system.antiSlopChecklist.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Ban className="h-4 w-4 text-fuchsia-500" /> Anti-slop rules
          </h3>
          <ul className="space-y-1.5">
            {system.antiSlopChecklist.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="text-fuchsia-500 mt-0.5">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
