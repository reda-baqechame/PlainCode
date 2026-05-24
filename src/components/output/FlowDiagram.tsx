"use client";
import { useEffect, useRef, useState } from "react";
import { GitBranch, Download } from "lucide-react";
import { sanitizeMermaid } from "@/lib/utils/mermaid";

interface Props {
  diagram: string;
  title?: string;
  downloadName?: string;
}

/**
 * Removes any mermaid error elements that get injected into document.body.
 * Mermaid v11 renders syntax errors as visible SVG elements with bomb icons
 * directly into the DOM, bypassing try/catch.
 */
function cleanupMermaidErrors() {
  document.querySelectorAll('[id^="d"]').forEach((el) => {
    if (el.textContent?.includes("Syntax error in text")) {
      el.remove();
    }
  });
  // Mermaid also adds elements with id "d" + number pattern
  document.querySelectorAll("svg").forEach((el) => {
    if (
      el.parentElement === document.body &&
      el.textContent?.includes("Syntax error")
    ) {
      el.remove();
    }
  });
}

export function FlowDiagram({ diagram, title = "Flow Diagram", downloadName = "flow-diagram.svg" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!diagram || diagram === "none") return;

    let cancelled = false;

    (async () => {
      // Set up a MutationObserver to immediately remove any error elements
      // mermaid injects into the DOM body (bomb icon SVGs)
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement || node instanceof SVGElement) {
              if (node.textContent?.includes("Syntax error in text")) {
                node.remove();
              }
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: false });

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
        });

        const cleaned = sanitizeMermaid(diagram);

        // Validate syntax before rendering — parse() returns void on success
        // and throws on invalid syntax in mermaid v11
        try {
          await mermaid.parse(cleaned);
        } catch {
          cleanupMermaidErrors();
          if (!cancelled) setError(true);
          observer.disconnect();
          return;
        }

        // Clean up any error elements parse() may have injected
        cleanupMermaidErrors();

        const id = `diagram-${Math.random().toString(36).slice(2)}`;
        const { svg: renderedSvg } = await mermaid.render(id, cleaned);

        // Clean up detached render element mermaid may leave behind
        document.getElementById(id)?.remove();
        cleanupMermaidErrors();

        if (!cancelled) setSvg(renderedSvg);
      } catch {
        cleanupMermaidErrors();
        if (!cancelled) setError(true);
      } finally {
        observer.disconnect();
        // Final cleanup pass
        cleanupMermaidErrors();
      }
    })();

    return () => {
      cancelled = true;
      cleanupMermaidErrors();
    };
  }, [diagram]);

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!diagram || diagram === "none") return null;
  if (error) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2 section-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <GitBranch className="h-4 w-4 text-primary" />
          {title}
        </div>
        {svg && (
          <button
            onClick={downloadSvg}
            className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Download SVG"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {svg ? (
        <div
          ref={containerRef}
          className="overflow-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="h-16 flex items-center justify-center">
          <span className="animate-pulse text-muted-foreground text-sm">Rendering diagram...</span>
        </div>
      )}
    </div>
  );
}
