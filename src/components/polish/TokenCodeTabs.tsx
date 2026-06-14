"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { DesignTokens } from "@/types/polish";
import { cn } from "@/lib/utils/cn";

type TokenKey = keyof DesignTokens;
const TABS: { key: TokenKey; label: string }[] = [
  { key: "tailwind", label: "Tailwind" },
  { key: "css", label: "CSS Variables" },
  { key: "json", label: "JSON" },
];

export function TokenCodeTabs({ tokens }: { tokens: DesignTokens }) {
  const [active, setActive] = useState<TokenKey>("tailwind");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(tokens[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-1 border-b border-border px-2 pt-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActive(t.key);
              setCopied(false);
            }}
            className={cn(
              "text-sm font-medium px-3 py-2 rounded-t-md transition-colors whitespace-nowrap",
              active === t.key
                ? "bg-background text-foreground border-b-2 border-fuchsia-500"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <button
          onClick={copy}
          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-accent transition-colors"
          aria-label="Copy tokens"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className="text-xs text-foreground/90 whitespace-pre-wrap break-words p-4 pt-12 max-h-96 overflow-y-auto font-mono leading-relaxed">
          {tokens[active]}
        </pre>
      </div>
    </div>
  );
}
