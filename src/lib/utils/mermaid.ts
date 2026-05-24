/**
 * Pure Mermaid source sanitization — shared by diagram renderers and tests.
 * No DOM / React dependencies so it can be unit-tested in a node environment.
 */

export function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:mermaid)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

const SUPPORTED_PREFIX =
  /^(flowchart|graph|sequenceDiagram|stateDiagram(?:-v2)?|classDiagram|erDiagram|journey|gantt)\b/i;

export function sanitizeMermaid(raw: string): string {
  let cleaned = stripCodeFences(raw);

  // Ensure it starts with a valid diagram type. If not, default to flowchart TD.
  if (!SUPPORTED_PREFIX.test(cleaned)) {
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
