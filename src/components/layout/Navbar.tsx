"use client";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Code2 } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
          <Code2 className="h-5 w-5 text-primary" />
          <span>PlainCode</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/brief"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            Brief
          </Link>
          <Link
            href="/explain"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            Explain
          </Link>
          <Link
            href="/document"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            Document
          </Link>
          <Link
            href="/diff"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            Diff
          </Link>
          <Link
            href="/defend"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            Defend
          </Link>
          <Link
            href="/vibe-check"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
          >
            Ship Check
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
