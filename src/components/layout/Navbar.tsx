"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Code2, Menu, X } from "lucide-react";
import { TOOLS } from "@/constants/tools";
import { cn } from "@/lib/utils/cn";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-[15px] hover:opacity-80 transition-opacity"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-glow">
            <Code2 className="h-4 w-4" />
          </span>
          <span>PlainCode</span>
        </Link>

        <div className="flex items-center gap-0.5">
          <div className="hidden md:flex items-center gap-0.5">
            {TOOLS.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-md transition-colors",
                    active
                      ? "text-foreground bg-accent font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {t.name}
                </Link>
              );
            })}
          </div>
          <Link
            href="/blueprint"
            className="ml-1.5 text-sm font-medium bg-brand-gradient text-white px-3.5 py-1.5 rounded-md shadow-glow hover:opacity-90 transition-opacity"
          >
            Start free
          </Link>
          <div className="ml-1">
            <ThemeToggle />
          </div>
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="md:hidden ml-0.5 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {open && (
        <div id="mobile-nav" className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-col">
            {TOOLS.map((t) => {
              const active = pathname === t.href;
              const Icon = t.Icon;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2.5 rounded-md text-sm transition-colors",
                    active
                      ? "text-foreground bg-accent font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-md bg-muted", t.accent.text)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col">
                    <span>{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.tagline}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
