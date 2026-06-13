import Link from "next/link";
import { Code2 } from "lucide-react";
import { TOOLS } from "@/constants/tools";

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 max-w-xs">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Code2 className="h-5 w-5 text-primary" />
              PlainCode
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              From idea to shipped system. The spec-driven workspace for building with AI.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tools
              </span>
              {TOOLS.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} PlainCode</span>
          <span>Free for everyone · No sign-up</span>
        </div>
      </div>
    </footer>
  );
}
