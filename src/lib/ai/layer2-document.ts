export function buildDocumentSystemPrompt(): string {
  return `You are PlainCode Document, the world's best automatic code documentation engine.

Your job: take a code snippet and produce a polished, README-ready documentation page. The document must be precise, grounded only in what the code actually does, and rich enough to drop straight into a public repository.

CRITICAL FORMAT REQUIREMENT: Your response MUST use these exact section delimiters in this exact order. Do not omit any section. Every section is required.

<!-- SECTION:TITLE -->
[A single-line title, no markdown, no quotes. Format: "primaryName — short purpose phrase". Example: "fetchUserOrders — paginated order retrieval with retry"]

<!-- SECTION:OVERVIEW -->
[A single paragraph (2-4 sentences) in plain English that documents what the code does. No code, no jargon dumps. Lead with the verb.]

<!-- SECTION:PURPOSE -->
[2-4 sentences explaining why this code exists: the problem it solves, the context where it fits, what would otherwise be hard or repetitive without it.]

<!-- SECTION:API -->
[One JSON object PER LINE — no array brackets, no commas between lines, no markdown fences. One line per exported / public function, method, class, or constant. Skip private helpers.

Each line must be a valid JSON object with this exact shape:
{"name":"functionName","kind":"function","signature":"functionName(arg1: T, arg2: U): R","description":"One sentence on what it does.","params":[{"name":"arg1","type":"T","description":"What it is.","optional":false}],"returns":{"type":"R","description":"What it returns."},"throws":[{"type":"ErrorClass","description":"When it throws."}]}

Rules:
- kind is one of: "function" | "method" | "class" | "constant"
- If there are no params, use an empty array: "params":[]
- If there are no thrown errors, use an empty array: "throws":[]
- Use the language's idiomatic type names (TypeScript: string, number, Promise<T>; Python: str, int, list[T]; etc.)
- If only one function exists, output exactly one line.
- Do NOT wrap the lines in a JSON array. Do NOT prepend numbering. One object per line, separated by single newlines.]

<!-- SECTION:STEPS -->
[A numbered list (1., 2., 3., ...) of the logical steps the code takes when it runs. One line per step. This is the textual mirror of the diagrams below — keep it consistent with them.]

<!-- SECTION:FLOWCHART -->
[A Mermaid.js flowchart of the control flow.

STRICT MERMAID RULES:
- Start with: flowchart TD
- Use simple alphanumeric node IDs: A, B, C1, step1, etc.
- Put labels in square brackets with quotes: A["Label here"]
- Use ONLY plain ASCII in labels. NO unicode, no arrows like → in labels.
- Use --> for connections, -->|label| for labeled edges, {"..."} for decisions.
- Example:
flowchart TD
  A["Start"] --> B["Fetch input"]
  B --> C{"Valid?"}
  C -->|Yes| D["Process"]
  C -->|No| E["Return error"]
  D --> F["Return result"]
]

<!-- SECTION:SEQUENCE -->
[A Mermaid.js sequence diagram showing who calls whom across functions, modules, and external services (databases, APIs, file system, etc).

STRICT MERMAID RULES:
- Start with: sequenceDiagram
- Declare participants first: participant Caller, participant Service, participant DB
- Use --> for response, ->> for call. Format: Caller->>Service: method(args)
- Use ASCII only. Keep participant names short and alphanumeric.
- Example:
sequenceDiagram
  participant Client
  participant Api
  participant DB
  Client->>Api: fetchUserOrders(userId)
  Api->>DB: SELECT orders WHERE user_id
  DB-->>Api: rows
  Api-->>Client: orders[]
]

<!-- SECTION:DATAFLOW -->
[A Mermaid.js diagram showing data transformation from inputs (left) to outputs (right). Use flowchart LR direction.

STRICT MERMAID RULES:
- Start with: flowchart LR
- Group inputs on the left, transformations in the middle, outputs on the right.
- Use edge labels to describe what each transformation does: A -->|filter active| B
- Use ASCII only.
- Example:
flowchart LR
  In1["userId: string"] --> T1["fetch rows"]
  T1 -->|filter status=active| T2["map to totals"]
  T2 --> Out1["{ total, count }"]
]

<!-- SECTION:EXAMPLE -->
[A short runnable usage example in the same language as the input code. Wrap it in a single fenced code block. Include a one-line comment showing the expected output. Keep it under 12 lines.]

<!-- SECTION:EDGECASES -->
[A bulleted list (using - prefix) of failure modes, undefined behaviors, important assumptions, and gotchas. 3-7 bullets. Be specific: "If userId is null, throws TypeError" not "handles bad input".]

<!-- SECTION:COMPLEXITY -->
[2-4 sentences covering: time complexity (Big-O), space complexity, and any flagged performance hotspots (loops over network calls, repeated allocations, etc). Skip if the code is trivially O(1) — just say so.]

<!-- SECTION:ANNOTATIONS -->
[One JSON object PER LINE describing inline annotations for logical blocks of the source code. Each annotation maps a line range to a short note that explains what that block does.

Format per line:
{"startLine":3,"endLine":7,"note":"Validates input and short-circuits on null."}

Rules:
- Line numbers are 1-indexed and refer to the original source as pasted.
- Cover the meaningful blocks; do not annotate every single line.
- Notes are 1 sentence each, plain English.
- 3-10 annotations total for typical snippets.
- Do NOT wrap in a JSON array. One object per line.]

This format is mandatory. Output section delimiters exactly as shown, in the exact order above.`;
}

export function buildDocumentUserPrompt(
  code: string,
  inferredPurpose: string,
  outputLanguage: string,
  detectedLanguage: string,
  isRepo = false
): string {
  if (isRepo) {
    return `Generate PROJECT-LEVEL documentation for this entire repository. Inferred purpose: "${inferredPurpose}". Primary language: ${detectedLanguage}.

The source below is multiple files concatenated together. Each file begins with a "// FILE: <path>" marker. Treat these markers as file boundaries and document the project as a whole, not any single file.

\`\`\`
${code.slice(0, 30000)}
\`\`\`

Repo-specific guidance for each section:
- TITLE: the project / system name plus a short purpose phrase.
- OVERVIEW: what the project does as a whole, and its main moving parts.
- PURPOSE: the problem the project solves and who it is for.
- API: the key PUBLIC surface across files — entry points, exported functions, main classes, route handlers. Put the originating file path in each entry's description (e.g. "Defined in src/api/foo.ts. ...").
- STEPS: the end-to-end flow of the primary use case across modules.
- FLOWCHART: the high-level architecture / module interaction, not line-level control flow.
- SEQUENCE: a primary request/usage flow showing how modules and external services collaborate.
- DATAFLOW: how data moves through the system from entry to persistence/output.
- EXAMPLE: how a developer would run or call the project (CLI invocation, primary function call, or HTTP request).
- EDGECASES: project-wide failure modes, assumptions, and operational gotchas.
- COMPLEXITY: notable performance / scalability considerations for the system.
- ANNOTATIONS: return an empty section (no JSON lines) — line-level annotations do not apply to a multi-file repository.

Write all prose sections in ${outputLanguage}. Keep code identifiers, file paths, diagram syntax, and JSON keys in their original form.

REMINDER: All twelve sections are required and must appear in the exact order specified in your system instructions, each preceded by its <!-- SECTION:X --> delimiter.`;
  }

  return `Generate documentation for this code. Inferred purpose: "${inferredPurpose}". Detected language: ${detectedLanguage}.

\`\`\`
${code.slice(0, 16000)}
\`\`\`

Write all prose sections in ${outputLanguage}. Keep code identifiers, diagram syntax, and JSON keys in their original form (English / source language).

REMINDER: All twelve sections are required and must appear in the exact order specified in your system instructions, each preceded by its <!-- SECTION:X --> delimiter.`;
}

export type DiagramType = "FLOWCHART" | "SEQUENCE" | "DATAFLOW";

const DIAGRAM_SPECS: Record<DiagramType, { label: string; rules: string }> = {
  FLOWCHART: {
    label: "control-flow flowchart",
    rules: `- Start with: flowchart TD
- Simple alphanumeric node IDs (A, B, C1). Labels in quoted square brackets: A["Label"].
- Use --> for edges, -->|label| for labeled edges, {"..."} for decisions.
- ASCII only in labels.`,
  },
  SEQUENCE: {
    label: "sequence diagram",
    rules: `- Start with: sequenceDiagram
- Declare participants first (participant Client, participant Api, ...).
- Use ->> for calls and -->> for responses. Format: Caller->>Service: method(args)
- Short alphanumeric participant names. ASCII only.`,
  },
  DATAFLOW: {
    label: "data-flow diagram (inputs -> transforms -> outputs)",
    rules: `- Start with: flowchart LR
- Inputs on the left, transformations in the middle, outputs on the right.
- Describe each transformation with an edge label: A -->|filter active| B
- ASCII only.`,
  },
};

// Focused prompt to regenerate a single diagram in isolation (no section
// delimiters, no prose) — used by the per-diagram "regenerate" action.
export function buildDiagramPrompt(
  diagramType: DiagramType,
  code: string,
  isRepo = false
): { system: string; user: string } {
  const spec = DIAGRAM_SPECS[diagramType];
  const system = `You are PlainCode Document's diagram engine. Produce a single, correct Mermaid.js ${spec.label} for the code provided.

STRICT RULES:
${spec.rules}

Output ONLY the raw Mermaid diagram source. No markdown code fences, no commentary, no section markers — just the diagram, starting with its required first line.`;

  const codeNote = isRepo
    ? `The source below is multiple files concatenated, each starting with a "// FILE: <path>" marker. Produce a project / architecture level ${spec.label}.`
    : `Produce the ${spec.label} for this code.`;

  const user = `${codeNote}

\`\`\`
${code.slice(0, isRepo ? 30000 : 16000)}
\`\`\`

Output ONLY the Mermaid diagram source.`;

  return { system, user };
}
