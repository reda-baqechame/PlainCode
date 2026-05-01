import { getAnthropicClient } from "./client";

export interface SystemsAnalysis {
  failureCascade: string[];
  criticalGaps: string[];
  systemsVerdict: "not-scalable" | "partially-scalable" | "scalable";
}

function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

export async function generateSystemsAnalysis(input: {
  repoCode: string;
  techStack: string;
  failedChecks: string[];
}): Promise<SystemsAnalysis> {
  const { repoCode, techStack, failedChecks } = input;
  const client = getAnthropicClient();

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system:
        "You are a systems architect stress-testing a codebase for production scale. Identify what fails first when load increases 100x. Be specific: reference actual file names and patterns visible in the code. No generic advice — every finding must be grounded in what you observe.",
      messages: [
        {
          role: "user",
          content: `Tech stack: ${techStack}
Failed checks: ${failedChecks.join(", ") || "none"}

CODEBASE:
${repoCode.slice(0, 15000)}

Identify the 3 most specific failure modes for this system at scale. Return ONLY valid JSON, no markdown fences:
{
  "failureCascade": [
    "[specific file or route from this code] → [specific trigger at scale] → [consequence]",
    "[second failure chain]",
    "[third failure chain]"
  ],
  "criticalGaps": [
    "[systemic missing piece grounded in what you see: observability, caching, queuing, circuit breakers, retry logic]",
    "[second gap]"
  ],
  "systemsVerdict": "not-scalable"
}

Rules:
- failureCascade: exactly 3 items. Each must name a specific file, route, or function visible in the code. Format: "[component] → [trigger] → [failure]"
- criticalGaps: 2-3 items. Architectural missing pieces that limit scale
- systemsVerdict: "not-scalable" if critical failure modes exist with no mitigation, "scalable" if the architecture handles load well, "partially-scalable" otherwise`,
        },
      ],
    });

    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("no response");
    const result = parseJSON<SystemsAnalysis>(block.text);
    if (
      !Array.isArray(result.failureCascade) ||
      !Array.isArray(result.criticalGaps)
    ) {
      throw new Error("invalid shape");
    }
    return result;
  } catch {
    return {
      failureCascade: [],
      criticalGaps: [],
      systemsVerdict: "not-scalable",
    };
  }
}
