// Pure Mermaid source sanitization — shared by diagram renderers and tests.
// No DOM / React dependencies so it can be unit-tested in a node environment.

const SUPPORTED_PREFIX =
  /^(flowchart|graph|sequenceDiagram|stateDiagram(?:-v2)?|classDiagram|erDiagram|journey|gantt)\b/i;

export function stripCodeFences(raw: string): string {
  // Prefer the contents of a fenced block if one exists anywhere — handles the
  // case where the model emits prose around a ```mermaid ... ``` block.
  const fenced = raw.match(/```(?:mermaid)?\s*\n([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  return raw
    .replace(/^```(?:mermaid)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

// A lone "mermaid" word on the first line (some models prepend it) breaks parsing.
function stripLeadingMermaidWord(src: string): string {
  return src.replace(/^mermaid[ \t]*\n/i, "");
}

function needsQuoting(label: string): boolean {
  // Characters that break unquoted Mermaid node labels. Parentheses are the big
  // one — an unquoted "(" inside [ ] confuses the parser.
  return /[(),<>&|#;]/.test(label);
}

// Quote labels for the two node shapes our prompt uses: [rect] and {decision}.
// Each regex captures up to the matching closing bracket of the SAME kind, so a
// label containing "(" or ")" can no longer be mis-closed on the paren.
function quoteFlowLabels(src: string): string {
  // [label]  — first inner char is not " (skip already-quoted), [ (skip [[ ]]) or ].
  src = src.replace(/(\b\w+)\[([^"\][\n][^\]\n]*)\]/g, (full, id: string, label: string) => {
    if (!needsQuoting(label)) return full;
    return `${id}["${label.replace(/"/g, "'")}"]`;
  });

  // {label} — decision nodes. Skip already-quoted ({"..."}) and {{ }}.
  src = src.replace(/(\b\w+)\{([^"{}\n][^{}\n]*)\}/g, (full, id: string, label: string) => {
    if (!needsQuoting(label)) return full;
    return `${id}{"${label.replace(/"/g, "'")}"}`;
  });

  return src;
}

export function sanitizeMermaid(raw: string): string {
  let cleaned = stripLeadingMermaidWord(stripCodeFences(raw));

  // Ensure it starts with a valid diagram type. If not, default to flowchart TD.
  if (!SUPPORTED_PREFIX.test(cleaned)) {
    cleaned = `flowchart TD\n${cleaned}`;
  }

  // Label-quoting only applies to flowchart/graph syntax; it would corrupt
  // sequence-message syntax like "A->>B: do thing".
  const isFlow = /^(flowchart|graph)\b/i.test(cleaned);
  if (!isFlow) return cleaned;

  return quoteFlowLabels(cleaned);
}
