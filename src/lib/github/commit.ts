import { sanitizeRepoPath, type RepoRef } from "./oauth";

const API = "https://api.github.com";

export interface CommitFile {
  path: string;
  content: string;
}

export interface OpenPrOptions extends RepoRef {
  token: string;
  files: CommitFile[];
  branch: string;
  prTitle: string;
  prBody: string;
}

export class GitHubCommitError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "PlainCode-Document/1.0",
    "Content-Type": "application/json",
  };
}

// Validate + normalize the files a client asked us to commit. Throws on anything
// suspicious so we never write to an unexpected path or commit huge blobs.
export function validateFiles(files: CommitFile[]): CommitFile[] {
  if (!Array.isArray(files) || files.length === 0) {
    throw new GitHubCommitError("No files to commit", 400);
  }
  if (files.length > 5) {
    throw new GitHubCommitError("Too many files", 400);
  }
  return files.map((f) => {
    const path = sanitizeRepoPath(f.path);
    if (!path) throw new GitHubCommitError(`Invalid file path: ${f.path}`, 400);
    if (typeof f.content !== "string" || f.content.length > 200_000) {
      throw new GitHubCommitError(`Invalid content for ${f.path}`, 400);
    }
    return { path, content: f.content };
  });
}

function toBase64(text: string): string {
  // Buffer is available in the Node runtime used by route handlers.
  return Buffer.from(text, "utf-8").toString("base64");
}

async function gh(url: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...init, headers: { ...headers(token), ...(init?.headers ?? {}) } });
  return res;
}

/**
 * Creates a branch, writes the given files, and opens a PR. Returns the PR URL.
 * Each network failure maps to a GitHubCommitError with a useful status.
 */
export async function openDocsPullRequest(opts: OpenPrOptions): Promise<{ url: string }> {
  const { token, owner, repo, files, branch, prTitle, prBody } = opts;
  const safeFiles = validateFiles(files);

  // 1. Default branch + its head SHA.
  const repoRes = await gh(`${API}/repos/${owner}/${repo}`, token);
  if (repoRes.status === 404) throw new GitHubCommitError("Repository not found", 404);
  if (repoRes.status === 401) throw new GitHubCommitError("GitHub authorization failed", 401);
  if (!repoRes.ok) throw new GitHubCommitError("Could not read repository", 502);
  const repoData = await repoRes.json();
  const baseBranch: string = repoData.default_branch ?? "main";

  const refRes = await gh(`${API}/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, token);
  if (!refRes.ok) throw new GitHubCommitError("Could not read base branch", 502);
  const refData = await refRes.json();
  const baseSha: string | undefined = refData?.object?.sha;
  if (!baseSha) throw new GitHubCommitError("Could not resolve base branch SHA", 502);

  // 2. Create the new branch.
  const createRefRes = await gh(`${API}/repos/${owner}/${repo}/git/refs`, token, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  if (createRefRes.status === 403) {
    throw new GitHubCommitError("No write access to this repository", 403);
  }
  if (!createRefRes.ok) throw new GitHubCommitError("Could not create branch", 502);

  // 3. Write each file onto the new branch.
  for (const file of safeFiles) {
    // If the file already exists we need its blob SHA to update it.
    const existingRes = await gh(
      `${API}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
      token
    );
    let sha: string | undefined;
    if (existingRes.ok) {
      const existing = await existingRes.json();
      sha = existing?.sha;
    }

    const putRes = await gh(`${API}/repos/${owner}/${repo}/contents/${file.path}`, token, {
      method: "PUT",
      body: JSON.stringify({
        message: `docs: ${file.path} via PlainCode`,
        content: toBase64(file.content),
        branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!putRes.ok) throw new GitHubCommitError(`Could not write ${file.path}`, 502);
  }

  // 4. Open the PR.
  const prRes = await gh(`${API}/repos/${owner}/${repo}/pulls`, token, {
    method: "POST",
    body: JSON.stringify({ title: prTitle, head: branch, base: baseBranch, body: prBody }),
  });
  if (!prRes.ok) throw new GitHubCommitError("Could not open pull request", 502);
  const prData = await prRes.json();
  if (!prData?.html_url) throw new GitHubCommitError("Pull request created without a URL", 502);

  return { url: prData.html_url };
}

export async function exchangeCodeForToken(code: string): Promise<string | null> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.access_token ?? null;
}
