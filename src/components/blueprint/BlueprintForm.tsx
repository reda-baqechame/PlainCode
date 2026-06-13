"use client";
import { Wand2, ChevronRight } from "lucide-react";
import type { BlueprintInput } from "@/types/blueprint";

interface Props {
  value: BlueprintInput;
  onChange: (value: BlueprintInput) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function BlueprintForm({ value, onChange, onSubmit, disabled }: Props) {
  const set = (patch: Partial<BlueprintInput>) => onChange({ ...value, ...patch });
  const canSubmit = value.rawIdea.trim().length >= 10;

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Project name</span>
        <input
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. ContextOS"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          What are you trying to build? <span className="text-muted-foreground">(it&apos;s OK to be messy)</span>
        </span>
        <textarea
          value={value.rawIdea}
          onChange={(e) => set({ rawIdea: e.target.value })}
          rows={5}
          autoFocus
          placeholder="Dump the idea exactly as it lives in your head. Don't polish it."
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Who is it for?</span>
          <input
            value={value.targetUser}
            onChange={(e) => set({ targetUser: e.target.value })}
            placeholder="e.g. solo founders, agencies"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">What problem does it solve?</span>
          <input
            value={value.problem}
            onChange={(e) => set({ problem: e.target.value })}
            placeholder="e.g. people give AI bad context"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          Paste any notes / context <span className="text-muted-foreground">(optional)</span>
        </span>
        <textarea
          value={value.extraContext}
          onChange={(e) => set({ extraContext: e.target.value })}
          rows={4}
          placeholder="Links, examples, competitors, constraints, style preferences — anything."
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <button
        onClick={onSubmit}
        disabled={!canSubmit || disabled}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wand2 className="h-4 w-4" />
        Analyze my idea
        <ChevronRight className="h-4 w-4" />
      </button>
      <p className="text-xs text-muted-foreground text-center">
        Free · No sign-up · Your idea is never stored on our servers
      </p>
    </div>
  );
}
