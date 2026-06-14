// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { savePolishHistory, getPolishHistory, deletePolishHistory, type PolishHistoryEntry } from "./history";
import { COLOR_ROLES, type DesignColors, type PolishResult } from "@/types/polish";

const c = COLOR_ROLES.reduce((a, r) => ((a[r] = "#000"), a), {} as DesignColors);
const result: PolishResult = {
  name: "", direction: "", personality: "",
  typography: { displayFont: "", bodyFont: "", monoFont: "", googleFonts: [], scale: [] },
  colors: { light: c, dark: c },
  radius: "", spacingNote: "", motionNote: "", components: [], antiSlopChecklist: [],
  designMd: "", tokens: { tailwind: "", css: "", json: "" },
  prompts: { codex: "", claude: "", chatgpt: "", cursor: "", generic: "" }, screens: [],
};

function entry(id: string): PolishHistoryEntry {
  return { id, name: `Design ${id}`, direction: "Dir", date: "2026-06-14", result };
}

describe("polish history", () => {
  beforeEach(() => localStorage.clear());

  it("saves newest first and dedups by id", () => {
    savePolishHistory(entry("1"));
    savePolishHistory(entry("2"));
    savePolishHistory(entry("1"));
    expect(getPolishHistory().map((e) => e.id)).toEqual(["1", "2"]);
  });
  it("caps at 5", () => {
    for (let i = 1; i <= 7; i++) savePolishHistory(entry(String(i)));
    expect(getPolishHistory()).toHaveLength(5);
    expect(getPolishHistory()[0].id).toBe("7");
  });
  it("deletes by id", () => {
    savePolishHistory(entry("1"));
    savePolishHistory(entry("2"));
    deletePolishHistory("1");
    expect(getPolishHistory().map((e) => e.id)).toEqual(["2"]);
  });
});
