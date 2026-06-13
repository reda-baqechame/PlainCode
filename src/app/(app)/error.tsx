"use client";
import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, AlertTriangle } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app route error]", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
      <div className="flex justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">This tool hit an error</h1>
      <p className="text-muted-foreground text-sm">
        Something went wrong while loading this page. Try again, or head back home.
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
  );
}
