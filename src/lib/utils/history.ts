import type { DocumentResult } from "@/types/explanation";

const SHIP_KEY = "plaincode_ship_history";
const DEFEND_KEY = "plaincode_defend_history";
const DOCUMENT_KEY = "plaincode_document_history";
const MAX = 5;

export interface ShipHistoryEntry {
  repoUrl: string;
  repoName: string;
  score: number;
  verdict: string;
  builderType: string;
  date: string;
}

export interface DefendHistoryEntry {
  repoUrl: string;
  repoName: string;
  score: number;
  builderType: string;
  date: string;
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX)));
  } catch {}
}

export function saveShipHistory(entry: ShipHistoryEntry): void {
  const list = readList<ShipHistoryEntry>(SHIP_KEY).filter(
    (e) => e.repoUrl !== entry.repoUrl
  );
  writeList(SHIP_KEY, [entry, ...list]);
}

export function getShipHistory(): ShipHistoryEntry[] {
  return readList<ShipHistoryEntry>(SHIP_KEY);
}

export function saveDefendHistory(entry: DefendHistoryEntry): void {
  const list = readList<DefendHistoryEntry>(DEFEND_KEY).filter(
    (e) => e.repoUrl !== entry.repoUrl
  );
  writeList(DEFEND_KEY, [entry, ...list]);
}

export function getDefendHistory(): DefendHistoryEntry[] {
  return readList<DefendHistoryEntry>(DEFEND_KEY);
}

export interface DocumentHistoryEntry {
  id: string;
  title: string;
  detectedLanguage: string;
  isRepo: boolean;
  date: string;
  code: string;
  result: DocumentResult;
}

// Dedup key: the original source for snippets, the title for repos.
function documentDedupKey(entry: DocumentHistoryEntry): string {
  return entry.isRepo ? `repo:${entry.title}` : `code:${entry.code}`;
}

export function saveDocumentHistory(entry: DocumentHistoryEntry): void {
  const key = documentDedupKey(entry);
  const list = readList<DocumentHistoryEntry>(DOCUMENT_KEY).filter(
    (e) => documentDedupKey(e) !== key
  );
  writeList(DOCUMENT_KEY, [entry, ...list]);
}

export function getDocumentHistory(): DocumentHistoryEntry[] {
  return readList<DocumentHistoryEntry>(DOCUMENT_KEY);
}

export function deleteDocumentHistory(id: string): void {
  const list = readList<DocumentHistoryEntry>(DOCUMENT_KEY).filter((e) => e.id !== id);
  writeList(DOCUMENT_KEY, list);
}
