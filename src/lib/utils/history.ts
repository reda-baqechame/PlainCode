const SHIP_KEY = "plaincode_ship_history";
const DEFEND_KEY = "plaincode_defend_history";
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
