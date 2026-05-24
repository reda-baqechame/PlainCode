import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  repoUrl: z.string().url(),
});

const IGNORE_DIRS = [
  "node_modules/",
  ".git/",
  ".next/",
  "dist/",
  "build/",
  "out/",
  "coverage/",
  "__pycache__/",
  "vendor/",
  ".vendor/",
  ".cache/",
  ".turbo/",
];

const IGNORE_FILENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Gemfile.lock",
  ".DS_Store",
  "Thumbs.db",
]);

const IGNORE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".mp4",
  ".mp3",
  ".wav",
  ".map",
]);

function shouldIgnore(path: string): boolean {
  const filename = path.split("/").pop() ?? path;
  if (IGNORE_DIRS.some((dir) => path.startsWith(dir) || path.includes(`/${dir}`))) return true;
  if (IGNORE_FILENAMES.has(filename)) return true;
  if (/\.env(\.|$)/.test(filename)) return true;
  if (/\.(lock)$/.test(filename)) return true;
  if (/\.min\.(js|css)$/.test(filename)) return true;
  const lastDot = filename.lastIndexOf(".");
  if (lastDot !== -1 && IGNORE_EXTENSIONS.has(filename.slice(lastDot))) return true;
  return false;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.replace(/^\//, "").replace(/\/$/, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "fetch-repo", 20);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { repoUrl } = parsed.data;
  const repoInfo = parseGitHubUrl(repoUrl);
  if (!repoInfo) {
    return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 });
  }

  const { owner, repo } = repoInfo;
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "PlainCode-Defend/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers }
  ).catch(() => null);

  if (!treeRes || !treeRes.ok) {
    if (treeRes?.status === 404) {
      return NextResponse.json(
        { error: "Repository not found or is private" },
        { status: 404 }
      );
    }
    if (treeRes?.status === 403) {
      return NextResponse.json(
        { error: "GitHub rate limit reached. Try again in a few minutes." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Failed to fetch repository" }, { status: 502 });
  }

  const treeData = await treeRes.json();
  const blobs: { path: string; sha: string; size: number }[] = (treeData.tree ?? [])
    .filter(
      (item: { type: string; path: string; size: number; sha: string }) =>
        item.type === "blob" && !shouldIgnore(item.path) && item.size < 100_000
    )
    .slice(0, 80);

  if (blobs.length === 0) {
    return NextResponse.json(
      { error: "No readable code files found in this repository" },
      { status: 422 }
    );
  }

  let combined = "";
  let fileCount = 0;
  const MAX_CHARS = 30_000;

  for (const blob of blobs) {
    if (combined.length >= MAX_CHARS) break;

    try {
      const contentRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${blob.path}`,
        { headers }
      );
      if (!contentRes.ok) continue;

      const contentData = await contentRes.json();
      if (contentData.encoding !== "base64" || !contentData.content) continue;

      const decoded = Buffer.from(
        contentData.content.replace(/\n/g, ""),
        "base64"
      ).toString("utf-8");

      const header = `\n// FILE: ${blob.path}\n`;
      const available = MAX_CHARS - combined.length;
      if (available <= header.length) break;

      combined += header + decoded.slice(0, available - header.length);
      fileCount++;
    } catch {
      continue;
    }
  }

  if (!combined.trim()) {
    return NextResponse.json(
      { error: "No readable code files found in this repository" },
      { status: 422 }
    );
  }

  return NextResponse.json({
    repoCode: combined.trim(),
    fileCount,
    truncated: combined.length >= MAX_CHARS,
  });
}
