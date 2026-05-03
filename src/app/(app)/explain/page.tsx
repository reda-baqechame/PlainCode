"use client";
import { useState, useEffect, useCallback } from "react";
import { CodeInput } from "@/components/explain/CodeInput";
import { AudienceDial } from "@/components/explain/AudienceDial";
import { LanguageSelector } from "@/components/explain/LanguageSelector";
import { ExplanationPanel } from "@/components/output/ExplanationPanel";
import { useExplain } from "@/hooks/useExplain";
import { Loader2, Sparkles, Lock } from "lucide-react";
import type { AudienceLevel } from "@/types/explanation";

export default function ExplainPage() {
  const [code, setCode] = useState("");
  const [audienceLevel, setAudienceLevel] = useState<AudienceLevel>("DEVELOPER_PEER");
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [privacyMode, setPrivacyMode] = useState(false);
  const { state, explain, reset } = useExplain();

  const handleExplain = useCallback(() => {
    if (!code.trim() || state.loading) return;
    explain({ code, audienceLevel, outputLanguage, privacyMode });
  }, [code, audienceLevel, outputLanguage, privacyMode, state.loading, explain]);

  // Cmd+Enter shortcut
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

  // Re-explain on audience level change if there's already a result
  useEffect(() => {
    if (state.done && code.trim()) {
      explain({ code, audienceLevel, outputLanguage, privacyMode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceLevel]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Explain Code</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paste any snippet — understand what it does, where it fits in a system, and what breaks if it fails.
            </p>
          </div>

          <CodeInput value={code} onChange={setCode} />

          <AudienceDial value={audienceLevel} onChange={setAudienceLevel} />

          <div className="flex items-center justify-between flex-wrap gap-3">
            <LanguageSelector value={outputLanguage} onChange={setOutputLanguage} />

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={privacyMode}
                  onChange={(e) => setPrivacyMode(e.target.checked)}
                  className="rounded"
                />
                <Lock className="h-3 w-3" />
                Privacy mode
              </label>
            </div>
          </div>

          <button
            onClick={handleExplain}
            disabled={!code.trim() || state.loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Explaining...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Explain Code
                <span className="text-xs opacity-70 ml-1">⌘↵</span>
              </>
            )}
          </button>

          {privacyMode && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Privacy mode: your code is never stored or used for training.
            </p>
          )}
        </div>

        {/* Right: Output */}
        <div>
          {!state.loading && !state.sections.SUMMARY && !state.currentSection ? (
            <div className="h-full min-h-[400px] flex items-center justify-center rounded-xl border-2 border-dashed border-border">
              <div className="text-center text-muted-foreground space-y-2 px-8">
                <Sparkles className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-sm">Your explanation will appear here</p>
                <p className="text-xs">Free for everyone · No sign-up required</p>
              </div>
            </div>
          ) : (
            <ExplanationPanel stream={state} code={code} />
          )}
        </div>
      </div>
    </div>
  );
}
