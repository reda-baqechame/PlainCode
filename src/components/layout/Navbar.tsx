"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Code2 } from "lucide-react";
import { TOOLS } from "@/constants/tools";
import { cn } from "@/lib/utils/cn";

export function Navbar() {
  const pathname = usePathname();

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
        </div>
      </div>
    </nav>
  );
}
