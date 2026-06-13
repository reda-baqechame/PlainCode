import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "PlainCode — From idea to shipped system",
  description:
    "PlainCode is the spec-driven workspace for building with AI: turn a vague idea into a build-ready Blueprint, then understand, harden, and ship the code your AI agent writes. Free, no sign-up.",
  openGraph: {
    title: "PlainCode — From idea to shipped system",
    description:
      "Turn a vague idea into a build-ready Blueprint for Codex, Claude, ChatGPT, or Cursor — then understand, defend, and ship what you build. Free, no sign-up.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
