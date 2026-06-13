"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Code2, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="absolute inset-0 bg-grid" aria-hidden />
      <div className="relative space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-glow">
            <Code2 className="h-5 w-5" />
          </span>
          PlainCode
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          An unexpected error occurred. Try again — your work isn&apos;t lost.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-brand-gradient text-white px-5 py-2.5 rounded-lg font-semibold shadow-glow hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-border px-5 py-2.5 rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
