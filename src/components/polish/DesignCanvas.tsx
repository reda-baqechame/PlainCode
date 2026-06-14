"use client";
import { useMemo, useState } from "react";
import { Check, Copy, Monitor, Smartphone, Sun, Moon, Download } from "lucide-react";
import type { DesignScreen, DesignTypography } from "@/types/polish";
import { googleFontsHref, buildScreenDoc } from "@/lib/utils/capture";
import { cn } from "@/lib/utils/cn";

interface Props {
  screens: DesignScreen[];
  /** The design-system CSS (`:root` + `.dark` variable blocks). */
  css: string;
  typography: DesignTypography;
}

export function DesignCanvas({ screens, css, typography }: Props) {
  const [active, setActive] = useState(0);
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  const fontsHref = useMemo(() => googleFontsHref(typography), [typography]);
  const screen = screens[active];
  const doc = useMemo(
    () => (screen ? buildScreenDoc(screen.html, css, fontsHref, dark) : ""),
    [screen, css, fontsHref, dark]
  );

  if (!screen) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(screen.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${screen.name.toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 flex-wrap">
        <div className="flex items-center gap-1 overflow-x-auto">
          {screens.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "text-sm font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors",
                i === active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDark((v) => !v)}
            aria-label={dark ? "Light preview" : "Dark preview"}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobile(false)}
            aria-label="Desktop"
            className={cn("p-1.5 rounded-md transition-colors", !mobile ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent")}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobile(true)}
            aria-label="Mobile"
            className={cn("p-1.5 rounded-md transition-colors", mobile ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent")}
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <span className="w-px h-5 bg-border mx-1" />
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy HTML"}
          </button>
          <button
            onClick={download}
            aria-label="Download HTML"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-muted/40 p-3 sm:p-5 flex justify-center">
        <iframe
          title={`${screen.name} preview`}
          srcDoc={doc}
          sandbox="allow-same-origin"
          className={cn(
            "bg-white rounded-lg border border-border shadow-elevated transition-all",
            mobile ? "w-[390px]" : "w-full"
          )}
          style={{ height: "640px", maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}
