import Link from "next/link";
import { Code2, ArrowLeft } from "lucide-react";

export default function NotFound() {
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
        <h1 className="text-6xl font-bold tracking-tight text-gradient">404</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          That page doesn&apos;t exist. It may have moved, or the link was mistyped.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand-gradient text-white px-5 py-2.5 rounded-lg font-semibold shadow-glow hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
