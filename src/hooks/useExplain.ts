"use client";
import { useState, useCallback, useRef } from "react";
import type { AudienceLevel } from "@/types/explanation";

interface StreamState {
  currentSection: string;
  sections: {
    SUMMARY: string;
    BREAKDOWN: string;
    ANALOGY: string;
    DATAMAP: string;
    SYSTEMS: string;
    MERMAID: string;
  };
  confidence?: number;
  done: boolean;
  error?: string;
  loading: boolean;
}

const DEFAULT_SECTIONS = { SUMMARY: "", BREAKDOWN: "", ANALOGY: "", DATAMAP: "", SYSTEMS: "", MERMAID: "" };

export function useExplain() {
  const [state, setState] = useState<StreamState>({
    currentSection: "",
    sections: DEFAULT_SECTIONS,
    done: false,
    loading: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const explain = useCallback(
    async (params: {
      code: string;
      audienceLevel: AudienceLevel;
      outputLanguage: string;
      privacyMode: boolean;
      isDiff?: boolean;
      codeBefore?: string;
      codeAfter?: string;
    }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ currentSection: "", sections: DEFAULT_SECTIONS, done: false, loading: true });

      const endpoint = params.isDiff ? "/api/explain-diff" : "/api/explain";
      const body = params.isDiff
        ? {
            codeBefore: params.codeBefore,
            codeAfter: params.codeAfter,
            audienceLevel: params.audienceLevel,
            outputLanguage: params.outputLanguage,
          }
        : {
            code: params.code,
            audienceLevel: params.audienceLevel,
            outputLanguage: params.outputLanguage,
            privacyMode: params.privacyMode,
          };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          setState((s) => ({ ...s, error: err.error ?? "Request failed", loading: false, done: true }));
          return;
        }

        if (!res.body) {
          setState((s) => ({ ...s, error: "No response stream", loading: false, done: true }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "section") {
                setState((s) => ({ ...s, currentSection: event.section }));
              } else if (event.type === "delta") {
                setState((s) => {
                  const cur = s.currentSection as keyof typeof DEFAULT_SECTIONS;
                  if (!cur) return s;
                  return {
                    ...s,
                    sections: { ...s.sections, [cur]: s.sections[cur] + event.delta },
                  };
                });
              } else if (event.type === "confidence") {
                setState((s) => ({ ...s, confidence: event.confidence }));
              } else if (event.type === "done") {
                setState((s) => ({
                  ...s,
                  done: true,
                  loading: false,
                  currentSection: "",
                }));
              } else if (event.type === "error") {
                setState((s) => ({ ...s, error: event.error, loading: false, done: true }));
              }
            } catch {}
          }
        }

        // Ensure loading is cleared even if "done" event wasn't received
        setState((s) => (s.loading ? { ...s, loading: false, done: true } : s));
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setState((s) => ({ ...s, error: "Connection error", loading: false, done: true }));
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ currentSection: "", sections: DEFAULT_SECTIONS, done: false, loading: false });
  }, []);

  return { state, explain, reset };
}
