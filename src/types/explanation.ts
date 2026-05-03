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

export interface StreamEvent {
  type: "section" | "delta" | "done" | "error" | "confidence";
  section?: "SUMMARY" | "BREAKDOWN" | "ANALOGY" | "DATAMAP" | "SYSTEMS" | "MERMAID";
  delta?: string;
  confidence?: number;
  error?: string;
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
