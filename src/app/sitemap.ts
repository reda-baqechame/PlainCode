import type { MetadataRoute } from "next";
import { TOOLS } from "@/constants/tools";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://plaincode-production.up.railway.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...TOOLS.map((t) => ({
      url: `${BASE}${t.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
