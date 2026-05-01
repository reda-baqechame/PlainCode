"use client";
import { useState } from "react";
import { GitBranch, Check, Copy, ChevronDown, ChevronRight } from "lucide-react";

interface GithubActionsGeneratorProps {
  repoUrl: string;
  shipScore: number;
}

export function GithubActionsGenerator({ repoUrl, shipScore }: GithubActionsGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const repoName = repoUrl.replace(/\/$/, "").split("/").pop() ?? "repo";

  const threshold = Math.max(shipScore - 10, 50);
  // Use placeholder tokens so GH Actions expressions don't get parsed as JS template literals
  const GH_REPO = "${{ github.repository }}";
  const GH_SERVER = "${{ github.server_url }}";

  const yaml = [
    "# PlainCode Ship Check — runs on every push to main",
    `# Fails CI if Ship Score drops below ${threshold}`,
    "name: Ship Check",
    "",
    "on:",
    "  push:",
    "    branches: [main]",
    "  pull_request:",
    "    branches: [main]",
    "",
    "jobs:",
    "  ship-check:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "",
    "      - name: Fetch repo code",
    "        id: fetch",
    "        run: |",
    `          REPO_URL="${GH_SERVER}/${GH_REPO}"`,
    "          RESULT=$(curl -s -X POST https://plaincode-production.up.railway.app/api/fetch-repo \\",
    '            -H "Content-Type: application/json" \\',
    '            -d "{\\"repoUrl\\":\\"$REPO_URL\\"}")',
    '          echo "repoCode=$(echo $RESULT | jq -r \'.repoCode\' | head -c 30000)" >> $GITHUB_OUTPUT',
    "",
    "      - name: Run Ship Check",
    "        id: audit",
    "        run: |",
    "          RESULT=$(curl -s -X POST https://plaincode-production.up.railway.app/api/vibe-check \\",
    '            -H "Content-Type: application/json" \\',
    '            -d "{\\"repoCode\\":\\"$(echo \'${{ steps.fetch.outputs.repoCode }}\' | sed \'s/"/\\\\"/g\')\\"}")',
    '          SCORE=$(echo $RESULT | jq -r \'.shipScore\')',
    '          echo "score=$SCORE" >> $GITHUB_OUTPUT',
    `          if [ "$SCORE" -lt ${threshold} ]; then`,
    `            echo "Ship Score $SCORE is below threshold (${threshold}) — fix issues before merging"`,
    "            exit 1",
    "          fi",
  ].join("\n");

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-sm font-semibold text-foreground hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          Add to CI/CD
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Copy this GitHub Actions workflow into{" "}
            <span className="font-mono text-foreground">.github/workflows/ship-check.yml</span> in{" "}
            <span className="font-mono text-foreground">{repoName}</span>. It runs Ship Check on every push to{" "}
            <span className="font-mono text-foreground">main</span> and fails if your score drops below{" "}
            <span className="font-mono text-foreground">{Math.max(shipScore - 10, 50)}</span>.
          </p>
          <div className="relative">
            <pre className="text-xs font-mono bg-muted rounded-md p-3 overflow-x-auto max-h-48 text-muted-foreground whitespace-pre leading-relaxed">
              {yaml}
            </pre>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(yaml);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="absolute top-2 right-2 p-1.5 rounded bg-background border border-border hover:bg-accent transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
