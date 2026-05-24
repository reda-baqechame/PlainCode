"use client";
import { useEffect, useRef, useState } from "react";
import { GitBranch, Download } from "lucide-react";

interface Props {
  diagram: string;
  title?: string;
  downloadName?: string;
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:mermaid)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function sanitizeMermaid(raw: string): string {
  let cleaned = stripCodeFences(raw);

  // Ensure it starts with a valid diagram type. If not, default to flowchart TD.
  const supportedPrefix = /^(flowchart|graph|sequenceDiagram|stateDiagram(?:-v2)?|classDiagram|erDiagram|journey|gantt)\b/i;
  if (!supportedPrefix.test(cleaned)) {
    cleaned = `flowchart TD\n${cleaned}`;
  }

  // The node-label-quoting regex below is specific to flowchart/graph syntax and
  // would mangle sequence-message syntax like "A->>B: do thing". Skip for non-flow diagrams.
  const isFlow = /^(flowchart|graph)\b/i.test(cleaned);
  if (!isFlow) return cleaned;

  // Quote node labels that contain special characters Mermaid can't parse.
  // Matches node definitions like:  A[label] A(label) A{label} A((label))
  cleaned = cleaned.replace(
    /(\w+)(\[|\(+|\{+)(.*?)(\]|\)+|\}+)/g,
    (_match, id, open, label, close) => {
      if (/[→←↔<>&"()[\]{}|#]/.test(label) && !label.startsWith('"')) {
        const escaped = label.replace(/"/g, "'");
        return `${id}${open}"${escaped}"${close}`;
      }
      return `${id}${open}${label}${close}`;
    }
  );

  return cleaned;
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
