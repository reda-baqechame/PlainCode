import { getAnthropicClient } from "./client";

function getBuilderType(score: number): string {
  if (score <= 39) return "Prompt Tourist";
  if (score <= 59) return "Vibe Coder";
  if (score <= 74) return "Dangerous Shipper";
  if (score <= 89) return "Real Builder";
  return "Technical Founder";
}

export async function generateAssessment(input: {
  score: number;
  failedChecks: string[];
  fileFindings: string[];
  repoUrl?: string;
}): Promise<{ assessment: string; builderType: string }> {
  const { score, failedChecks, fileFindings, repoUrl } = input;
  const builderType = getBuilderType(score);

  const client = getAnthropicClient();

  const userPrompt = [
    `Assess this repository:`,
    repoUrl ? `Repository: ${repoUrl}` : "",
    `Score: ${score}/100`,
    `Failed: ${failedChecks.length > 0 ? failedChecks.join(", ") : "none"}`,
    `Findings: ${fileFindings.length > 0 ? fileFindings.join("; ") : "none"}`,
    "",
    "Focus on: what's actually wrong, why it matters, what pattern this represents. Reference specific files when relevant.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system:
        "Generate a concise technical assessment focused on production readiness. Be specific — reference actual files, patterns, and failures. Address both what is broken today and what will not survive real load. 3-4 sentences. Direct but fair. No headers or labels — just the assessment text.",
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = res.content[0];
    const assessment =
      block?.type === "text" ? block.text.trim() : "Assessment unavailable.";
    return { assessment, builderType };
  } catch {
    return { assessment: "Assessment unavailable.", builderType };
  }
}
