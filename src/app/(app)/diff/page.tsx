"use client";
import { useState, useEffect, useCallback } from "react";
import { CodeInput } from "@/components/explain/CodeInput";
import { AudienceDial } from "@/components/explain/AudienceDial";
import { ExplanationPanel } from "@/components/output/ExplanationPanel";
import { useExplain } from "@/hooks/useExplain";
import { Loader2, GitCompare } from "lucide-react";
import type { AudienceLevel } from "@/types/explanation";

export default function DiffPage() {
  const [codeBefore, setCodeBefore] = useState("");
  const [codeAfter, setCodeAfter] = useState("");
  const [audienceLevel, setAudienceLevel] = useState<AudienceLevel>("DEVELOPER_PEER");
  const { state, explain } = useExplain();

  const handleExplain = useCallback(() => {
    if (!codeBefore.trim() || !codeAfter.trim() || state.loading) return;
    explain({ code: "", codeBefore, codeAfter, audienceLevel, outputLanguage: "English", privacyMode: false, isDiff: true });
  }, [codeBefore, codeAfter, audienceLevel, state.loading, explain]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleExplain();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleExplain]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GitCompare className="h-6 w-6 text-primary" />
          Explain the Diff
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste the before and after versions — understand what changed, the blast radius on the rest of the system, and whether this is a proper fix or a workaround.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CodeInput value={codeBefore} onChange={setCodeBefore} label="Before" />
        <CodeInput value={codeAfter} onChange={setCodeAfter} label="After" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 max-w-lg">
          <AudienceDial value={audienceLevel} onChange={setAudienceLevel} />
        </div>
        <button
          onClick={handleExplain}
          disabled={!codeBefore.trim() || !codeAfter.trim() || state.loading}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
          Explain Changes
          <span className="text-xs opacity-70">⌘↵</span>
        </button>
      </div>

      <ExplanationPanel stream={state} isDiff={true} />
    </div>
  );
}
