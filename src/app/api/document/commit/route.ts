import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openDocsPullRequest, GitHubCommitError } from "@/lib/github/commit";
import { parseGitHubRepoUrl, slugifyBranch, GH_TOKEN_COOKIE } from "@/lib/github/oauth";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  repoUrl: z.string().url(),
  files: z
    .array(z.object({ path: z.string().min(1), content: z.string() }))
    .min(1)
    .max(5),
  prTitle: z.string().min(1).max(120).default("Add documentation (PlainCode)"),
  prBody: z.string().max(20000).default(""),
  // Option C: a user-supplied fine-grained PAT. Takes precedence over the
  // OAuth cookie when present. Never stored — used only for this request.
  token: z.string().min(1).max(255).optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "document-commit", 10);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { repoUrl, files, prTitle, prBody, token: bodyToken } = parsed.data;

  const token = bodyToken || req.cookies.get(GH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Not authorized. Connect GitHub or provide a token." },
      { status: 401 }
    );
  }

  const ref = parseGitHubRepoUrl(repoUrl);
  if (!ref) {
    return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 });
  }

  try {
    const { url } = await openDocsPullRequest({
      token,
      owner: ref.owner,
      repo: ref.repo,
      files,
      branch: slugifyBranch(prTitle),
      prTitle,
      prBody,
    });
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof GitHubCommitError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to open documentation PR" }, { status: 502 });
  }
}
