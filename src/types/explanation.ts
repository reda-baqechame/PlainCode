export type AudienceLevel =
  | "ELI5"
  | "NON_TECHNICAL"
  | "BUSINESS_CONTEXT"
  | "TECHNICAL_NON_DEV"
  | "DEVELOPER_PEER";

export type ExplainMode = "STANDARD" | "DIFF";

export interface ExplanationResult {
  summaryText: string;
  breakdownText: string;
  analogyText: string;
  dataMapText: string;
  systemsText: string;
  confidenceScore: number;
  mermaidDiagram?: string;
  layer1Confidence?: number;
  layer3Passed?: boolean;
}

export type ExplainSection =
  | "SUMMARY"
  | "BREAKDOWN"
  | "ANALOGY"
  | "DATAMAP"
  | "SYSTEMS"
  | "MERMAID";

export type DocumentSection =
  | "TITLE"
  | "OVERVIEW"
  | "PURPOSE"
  | "API"
  | "STEPS"
  | "FLOWCHART"
  | "SEQUENCE"
  | "DATAFLOW"
  | "EXAMPLE"
  | "EDGECASES"
  | "COMPLEXITY"
  | "ANNOTATIONS";

export interface StreamEvent {
  type: "section" | "delta" | "done" | "error" | "confidence";
  section?: ExplainSection | DocumentSection;
  delta?: string;
  confidence?: number;
  error?: string;
}

export interface ApiParam {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
}

export interface ApiEntry {
  name: string;
  kind: "function" | "method" | "class" | "constant";
  signature: string;
  description: string;
  params: ApiParam[];
  returns: { type: string; description: string };
  throws: { type: string; description: string }[];
}

export interface CodeAnnotation {
  startLine: number;
  endLine: number;
  note: string;
}

export interface DocumentRequest {
  code: string;
  outputLanguage?: string;
  privacyMode?: boolean;
}

export interface DocumentResult {
  title: string;
  overview: string;
  purpose: string;
  apiEntries: ApiEntry[];
  steps: string;
  flowchart: string;
  sequenceDiagram: string;
  dataflow: string;
  example: string;
  edgeCases: string;
  complexity: string;
  annotations: CodeAnnotation[];
  detectedLanguage: string;
  confidenceScore: number;
  layer1Confidence?: number;
  layer3Passed?: boolean;
}

export interface ExplainRequest {
  code: string;
  audienceLevel: AudienceLevel;
  outputLanguage?: string;
  privacyMode?: boolean;
}

export interface DiffExplainRequest {
  codeBefore: string;
  codeAfter: string;
  audienceLevel: AudienceLevel;
  outputLanguage?: string;
}

export interface StoredExplanation {
  id: string;
  audienceLevel: AudienceLevel;
  mode: ExplainMode;
  outputLanguage: string;
  summaryText: string;
  breakdownText: string;
  analogyText: string;
  dataMapText: string;
  confidenceScore: number;
  mermaidDiagram?: string | null;
  titlePreview: string;
  summaryPreview: string;
  createdAt: Date;
}
