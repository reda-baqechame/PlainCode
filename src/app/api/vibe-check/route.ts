import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";
import { generateArchitectureDiagram } from "@/lib/ai/architecture-diagram";
import { generateAssessment } from "@/lib/ai/generate-assessment";
import { generateSystemsAnalysis, type SystemsAnalysis } from "@/lib/ai/generate-systems-analysis";
export type { SystemsAnalysis };

const schema = z.object({
  repoCode: z.string().min(100).max(35_000),
});

export interface CheckFinding {
  file: string;
  line?: number;
  detail: string;
}

export interface CheckResult {
  id: number;
  name: string;
  category:
    | "env_vars"
    | "secrets"
    | "readme"
    | "console_logs"
    | "error_handling"
    | "dependencies"
    | "tests"
    | "ci_cd"
    | "todos"
    | "license"
    | "ai_keys"
    | "ai_rate_limit"
    | "ai_prompts"
    | "ai_error_handling";
  passed: boolean;
  findings: CheckFinding[];
}

interface StackAnalysis {
  techStack: string;
  architecture: string;
  keyFiles: Array<{
    path: string;
    importance: "critical" | "important" | "supporting";
    reason: string;
  }>;
}

function parseClaudeJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

async function analyzeStack(repoCode: string): Promise<StackAnalysis> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Analyze this codebase. Return ONLY valid JSON, no markdown:

${repoCode.slice(0, 6000)}

Return this exact shape:
{
  "techStack": "<comma-separated: languages, frameworks, databases, key libraries you see imported>",
  "architecture": "<one sentence describing the architectural pattern>",
  "keyFiles": [
    { "path": "<file path>", "importance": "critical", "reason": "<3-5 words: what it does>" }
  ]
}

keyFiles rules:
- Include 4–8 files maximum
- importance values: "critical" (auth/payments/data writes), "important" (API routes/DB/core logic), "supporting" (config/utils/assets)
- Only include files you can actually see in the codebase
- reason: 3–5 words describing what the file does`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("no response");
    return parseClaudeJSON<StackAnalysis>(block.text);
  } catch {
    return { techStack: "unknown", architecture: "unknown", keyFiles: [] };
  }
}

const CHECK_DEFAULTS: CheckResult[] = [
  { id: 1, name: "Env Vars Documented", category: "env_vars", passed: true, findings: [] },
  { id: 2, name: "No Hardcoded Secrets", category: "secrets", passed: true, findings: [] },
  { id: 3, name: "README with Setup", category: "readme", passed: true, findings: [] },
  { id: 4, name: "No Debug Logs", category: "console_logs", passed: true, findings: [] },
  { id: 5, name: "Error Handling", category: "error_handling", passed: true, findings: [] },
  { id: 6, name: "Dependencies Pinned", category: "dependencies", passed: true, findings: [] },
  { id: 7, name: "Tests Present", category: "tests", passed: true, findings: [] },
  { id: 8, name: "CI/CD Configured", category: "ci_cd", passed: true, findings: [] },
  { id: 9, name: "No TODOs in Production", category: "todos", passed: true, findings: [] },
  { id: 10, name: "License File", category: "license", passed: true, findings: [] },
  { id: 11, name: "LLM Keys Not in Frontend", category: "ai_keys", passed: true, findings: [] },
  { id: 12, name: "AI Rate Limiting", category: "ai_rate_limit", passed: true, findings: [] },
  { id: 13, name: "System Prompts Server-Side", category: "ai_prompts", passed: true, findings: [] },
  { id: 14, name: "AI API Error Handling", category: "ai_error_handling", passed: true, findings: [] },
];

const isAICodebase = (techStack: string) => {
  const lower = techStack.toLowerCase();
  return ["openai", "anthropic", "claude", "gemini", "cohere", "langchain", "llamaindex", "huggingface", "ai sdk", "openrouter", "mistral"].some((t) => lower.includes(t));
};

async function runChecks(repoCode: string, stack: StackAnalysis): Promise<CheckResult[]> {
  const client = getAnthropicClient();
  const aiRepo = isAICodebase(stack.techStack);

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are a senior engineer auditing a codebase for ship-readiness. Run exactly 14 checks and return a JSON object.

Tech stack: ${stack.techStack}
Architecture: ${stack.architecture}
AI codebase: ${aiRepo ? "YES — this uses AI/LLM APIs" : "NO — standard codebase"}

CODEBASE (file paths shown in // FILE: headers):
${repoCode.slice(0, 20000)}

Run these 14 checks in order. For each, determine pass/fail based strictly on what you can see in the code.

— STANDARD CHECKS —

CHECK 1 — id:1, category:"env_vars", name:"Env Vars Documented"
Are all environment variables referenced in code (process.env.*, os.environ[], getenv(), etc.) documented in a README or .env.example file?
PASS: every referenced var appears in README or .env.example. FAIL: any var used but not documented.

CHECK 2 — id:2, category:"secrets", name:"No Hardcoded Secrets"
Are there hardcoded API keys, tokens, passwords, or connection strings in the code?
Look for: strings matching sk-*, ghp_*, AKIA*, password= assignments, connection strings with credentials embedded, private key literals.
PASS: none found. FAIL: any hardcoded secret detected — be specific.

CHECK 3 — id:3, category:"readme", name:"README with Setup"
Does a README file exist and contain setup or installation instructions?
PASS: README exists with setup steps (install, run, env setup). FAIL: missing or no setup instructions.

CHECK 4 — id:4, category:"console_logs", name:"No Debug Logs"
Are there console.log(), print(), System.out.println(), or debug print statements in non-test files?
Ignore files with .test., .spec., __tests__, /test/, /spec/ in their path.
PASS: none in production code. FAIL: found in production code — name the file and line.

CHECK 5 — id:5, category:"error_handling", name:"Error Handling"
Are async functions and API calls wrapped in try/catch or equivalent error handling?
PASS: async operations have error handling. FAIL: bare awaits or unhandled promise chains exist — name examples.

CHECK 6 — id:6, category:"dependencies", name:"Dependencies Pinned"
Is package.json, requirements.txt, Gemfile, or equivalent present? Are versions pinned (not * or "latest")?
PASS: dependency file exists with specific versions. FAIL: missing or using wildcards — be explicit.

CHECK 7 — id:7, category:"tests", name:"Tests Present"
Are there any test files visible? Look for files matching *.test.*, *.spec.*, __tests__ directories, test/ or spec/ directories.
PASS: at least one test file found. FAIL: no test files detected anywhere in the repo.

CHECK 8 — id:8, category:"ci_cd", name:"CI/CD Configured"
Is there a CI/CD configuration present? Look for: .github/workflows/ directory, Dockerfile, docker-compose.yml, railway.toml, netlify.toml, vercel.json, .circleci/, .travis.yml, Jenkinsfile.
PASS: at least one CI/CD or deployment config found. FAIL: no CI/CD configuration detected.

CHECK 9 — id:9, category:"todos", name:"No TODOs in Production"
Are there TODO:, FIXME:, HACK:, or XXX: comments in non-test production source files?
Ignore test files (.test., .spec., __tests__) and markdown files.
PASS: none found in production code. FAIL: found — name the file and line.

CHECK 10 — id:10, category:"license", name:"License File"
Is there a LICENSE, LICENSE.md, LICENSE.txt, or COPYING file present?
PASS: license file found. FAIL: no license file detected.

— AI-SPECIFIC CHECKS (only run if AI codebase: YES; if NO, mark all passed: true with empty findings) —

CHECK 11 — id:11, category:"ai_keys", name:"LLM Keys Not in Frontend"
${aiRepo ? `Are LLM API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, sk-*, AIzaSy*, COHERE_API_KEY, etc.) referenced or hardcoded in client-side files (components/, pages/, public/, *.client.ts, *.tsx files that run in the browser)?
PASS: LLM keys only referenced server-side (api/, lib/ai/, server/). FAIL: key references in frontend/client files — be specific.` : "SKIP — not an AI codebase. Return passed: true, findings: []."}

CHECK 12 — id:12, category:"ai_rate_limit", name:"AI Rate Limiting"
${aiRepo ? `Is there any rate limiting, retry logic, or throttling applied to routes that call AI APIs?
Look for: rate-limit middleware, exponential backoff, p-retry, bottleneck, upstash ratelimit, or manual cooldown logic near AI API calls.
PASS: rate limiting or retry logic found. FAIL: AI API routes have no rate limiting — name the unprotected route.` : "SKIP — not an AI codebase. Return passed: true, findings: []."}

CHECK 13 — id:13, category:"ai_prompts", name:"System Prompts Server-Side"
${aiRepo ? `Are system prompts or AI instructions defined only in server-side files?
Look for: string literals containing "You are a", "system:", prompt templates in client-side .tsx or public files.
PASS: all prompt definitions are server-side. FAIL: prompt content found in frontend files — name the file.` : "SKIP — not an AI codebase. Return passed: true, findings: []."}

CHECK 14 — id:14, category:"ai_error_handling", name:"AI API Error Handling"
${aiRepo ? `Are calls to AI APIs (openai.*, anthropic.*, generateText, streamText, etc.) wrapped in try/catch with error handling for rate limits, timeouts, and API failures?
PASS: AI API calls have error handling. FAIL: bare AI API calls with no error handling — name examples.` : "SKIP — not an AI codebase. Return passed: true, findings: []."}

Rules for findings:
- If PASS: findings must be empty []
- If FAIL: list the specific files and issues. Each finding: { "file": "<path>", "line": <number or omit if unknown>, "detail": "<concise one-line description>" }

Return ONLY valid JSON, no markdown fences — all 14 checks:
{
  "checks": [
    { "id": 1, "name": "Env Vars Documented", "category": "env_vars", "passed": true, "findings": [] },
    { "id": 2, "name": "No Hardcoded Secrets", "category": "secrets", "passed": true, "findings": [] },
    { "id": 3, "name": "README with Setup", "category": "readme", "passed": true, "findings": [] },
    { "id": 4, "name": "No Debug Logs", "category": "console_logs", "passed": true, "findings": [] },
    { "id": 5, "name": "Error Handling", "category": "error_handling", "passed": true, "findings": [] },
    { "id": 6, "name": "Dependencies Pinned", "category": "dependencies", "passed": true, "findings": [] },
    { "id": 7, "name": "Tests Present", "category": "tests", "passed": true, "findings": [] },
    { "id": 8, "name": "CI/CD Configured", "category": "ci_cd", "passed": true, "findings": [] },
    { "id": 9, "name": "No TODOs in Production", "category": "todos", "passed": true, "findings": [] },
    { "id": 10, "name": "License File", "category": "license", "passed": true, "findings": [] },
    { "id": 11, "name": "LLM Keys Not in Frontend", "category": "ai_keys", "passed": true, "findings": [] },
    { "id": 12, "name": "AI Rate Limiting", "category": "ai_rate_limit", "passed": true, "findings": [] },
    { "id": 13, "name": "System Prompts Server-Side", "category": "ai_prompts", "passed": true, "findings": [] },
    { "id": 14, "name": "AI API Error Handling", "category": "ai_error_handling", "passed": true, "findings": [] }
  ]
}`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No audit results");

  try {
    const parsed = parseClaudeJSON<{ checks: CheckResult[] }>(block.text);
    if (!Array.isArray(parsed.checks)) throw new Error("Invalid format");
    const checksMap = new Map(parsed.checks.map((c) => [c.id, c]));
    return CHECK_DEFAULTS.map((d) => checksMap.get(d.id) ?? d);
  } catch {
    throw new Error("Failed to parse audit results");
  }
}

async function validateFindings(checks: CheckResult[], repoCode: string): Promise<CheckResult[]> {
  const failedEmpty = checks.filter((c) => !c.passed && c.findings.length === 0);
  if (failedEmpty.length === 0) return checks;

  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `These audit checks failed but have no file references. Add the most specific finding you can from the codebase.

IMPORTANT: Do NOT change any "passed" field. Do NOT flip false to true. Only populate empty findings arrays.

FAILED CHECKS WITH NO FINDINGS:
${JSON.stringify(failedEmpty, null, 2)}

CODEBASE EXCERPT:
${repoCode.slice(0, 3000)}

Return ONLY valid JSON:
{
  "improvements": [
    { "id": <check id>, "findings": [{ "file": "<file from codebase>", "detail": "<specific finding>" }] }
  ]
}`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") return checks;
    const result = parseClaudeJSON<{
      improvements: { id: number; findings: CheckFinding[] }[];
    }>(block.text);
    if (!Array.isArray(result.improvements)) return checks;
    return checks.map((c) => {
      const imp = result.improvements.find((i) => i.id === c.id);
      return imp && c.findings.length === 0 ? { ...c, findings: imp.findings } : c;
    });
  } catch {
    return checks;
  }
}

const POINTS: Record<string, number> = {
  secrets: 25,
  env_vars: 15,
  readme: 15,
  console_logs: 15,
  error_handling: 15,
  dependencies: 15,
  tests: 10,
  ci_cd: 10,
  todos: 10,
  license: 5,
  ai_keys: 20,
  ai_rate_limit: 10,
  ai_prompts: 10,
  ai_error_handling: 10,
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { repoCode } = parsed.data;
    const stack = await analyzeStack(repoCode);
    const checks = await runChecks(repoCode, stack);
    const dangerHints = checks.filter((c) => !c.passed).map((c) => c.name);
    // Preliminary score — pass/fail never changes during validation
    const totalPossible = checks.reduce((sum, c) => sum + (POINTS[c.category] ?? 0), 0);
    const rawPrelim = checks.reduce(
      (sum, c) => sum + (c.passed ? (POINTS[c.category] ?? 0) : 0),
      0
    );
    const prelimScore = Math.round((rawPrelim / totalPossible) * 100);
    const failedCheckNames = checks.filter((c) => !c.passed).map((c) => c.name);
    const fileFindings = checks
      .filter((c) => !c.passed)
      .flatMap((c) =>
        c.findings.slice(0, 2).map(
          (f) => `${f.file}${f.line ? `:${f.line}` : ""}: ${f.detail}`
        )
      )
      .slice(0, 5);
    const [validated, architectureDiagram, { assessment, builderType }, systemsAnalysis] =
      await Promise.all([
        validateFindings(checks, repoCode),
        generateArchitectureDiagram(repoCode, {
          techStack: stack.techStack,
          architecture: stack.architecture,
          dangerHints,
        }),
        generateAssessment({
          score: prelimScore,
          failedChecks: failedCheckNames,
          fileFindings,
        }),
        generateSystemsAnalysis({
          repoCode,
          techStack: stack.techStack,
          failedChecks: failedCheckNames,
        }),
      ]);
    const rawShip = validated.reduce(
      (sum, c) => sum + (c.passed ? (POINTS[c.category] ?? 0) : 0),
      0
    );
    const shipScore = Math.round((rawShip / totalPossible) * 100);
    return NextResponse.json({
      shipScore,
      techStack: stack.techStack,
      keyFiles: stack.keyFiles ?? [],
      architectureDiagram,
      checks: validated,
      assessment,
      builderType,
      systemsAnalysis,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to audit repository" },
      { status: 500 }
    );
  }
}
