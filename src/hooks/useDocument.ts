"use client";
import { useState, useCallback, useRef } from "react";
import type { DocumentResult, DocumentSection } from "@/types/explanation";

type DocSectionMap = Record<DocumentSection, string>;

const DEFAULT_SECTIONS: DocSectionMap = {
  TITLE: "",
  OVERVIEW: "",
  PURPOSE: "",
  API: "",
  STEPS: "",
  FLOWCHART: "",
  SEQUENCE: "",
  DATAFLOW: "",
  EXAMPLE: "",
  EDGECASES: "",
  COMPLEXITY: "",
  ANNOTATIONS: "",
};

export interface DocumentStreamState {
  currentSection: DocumentSection | "";
  sections: DocSectionMap;
  confidence?: number;
  result?: DocumentResult;
  done: boolean;
  error?: string;
  loading: boolean;
}

export function useDocument() {
  const [state, setState] = useState<DocumentStreamState>({
    currentSection: "",
    sections: DEFAULT_SECTIONS,
    done: false,
    loading: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const document = useCallback(
    async (params: { code: string; outputLanguage: string; privacyMode: boolean }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        currentSection: "",
        sections: { ...DEFAULT_SECTIONS },
        done: false,
        loading: true,
      });

      try {
        const res = await fetch("/api/document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
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
                setState((s) => ({ ...s, currentSection: event.section as DocumentSection }));
              } else if (event.type === "delta") {
                setState((s) => {
                  const cur = s.currentSection;
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
                  result: event.result as DocumentResult,
                }));
              } else if (event.type === "error") {
                setState((s) => ({ ...s, error: event.error, loading: false, done: true }));
              }
            } catch {}
          }
        }

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
    setState({
      currentSection: "",
      sections: { ...DEFAULT_SECTIONS },
      done: false,
      loading: false,
    });
  }, []);

  return { state, document, reset };
}
