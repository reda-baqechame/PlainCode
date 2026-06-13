import type { Metadata } from "next";
import { TOOLS } from "@/constants/tools";

const tool = TOOLS.find((t) => t.id === "explain")!;

export const metadata: Metadata = {
  title: `${tool.name} — PlainCode`,
  description: tool.blurb,
  openGraph: { title: `${tool.name} — PlainCode`, description: tool.blurb },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
