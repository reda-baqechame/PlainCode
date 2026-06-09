import type { CheckResult } from "@/app/api/vibe-check/route";
import type { DocumentResult } from "@/types/explanation";

export interface ShipShareData {
  repoUrl: string;
  shipScore: number;
  verdict: string;
  builderType: string;
  assessment: string;
  techStack: string;
  checks: Array<{ id: number; name: string; category: string; passed: boolean; findings: CheckResult["findings"] }>;
}

export interface DefendShareData {
  repoUrl: string;
  defenseScore: number;
  builderType: string;
  assessment: string;
  weakSpots: string[];
}

export function encodeShareResult(data: ShipShareData | DefendShareData): string {
  try {
    const json = JSON.stringify(data);
    const b64 = btoa(encodeURIComponent(json));
    return b64;
  } catch {
    return "";
  }
}

export function decodeShipShare(encoded: string): ShipShareData | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as ShipShareData;
  } catch {
    return null;
  }
}

export function decodeDefendShare(encoded: string): DefendShareData | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as DefendShareData;
  } catch {
    return null;
  }
}

export function buildShareUrl(base: string, encoded: string): string {
  return `${base}?r=${encoded}`;
}

export interface DocumentShareData {
  result: DocumentResult;
  isRepo: boolean;
}

export function encodeDocumentShare(data: DocumentShareData): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(data)));
  } catch {
    return "";
  }
}

export function decodeDocumentShare(encoded: string): DocumentShareData | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded))) as DocumentShareData;
  } catch {
    return null;
  }
}

// Document share payloads are large (three diagrams + prose + API), so they
// ride in the URL hash fragment, which is not subject to server / proxy URL
// length limits the way a query string is.
export function buildDocumentShareUrl(origin: string, encoded: string): string {
  return `${origin}/document#d=${encoded}`;
}
