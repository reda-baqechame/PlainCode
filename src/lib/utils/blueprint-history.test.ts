// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveBlueprintHistory,
  getBlueprintHistory,
  deleteBlueprintHistory,
  type BlueprintHistoryEntry,
} from "./history";
import type { BlueprintResult } from "@/types/blueprint";

const emptyResult: BlueprintResult = {
  goal: "",
  targetUser: "",
  problem: "",
  corePromise: "",
  mvpFeatures: [],
  nonGoals: [],
  userFlow: "",
  techStack: "",
  dbNeeds: "",
  aiBehavior: "",
  buildTickets: [],
  validationChecklist: [],
  blueprintMarkdown: "",
  prompts: { codex: "", claude: "", chatgpt: "", cursor: "", generic: "" },
};

function entry(id: string): BlueprintHistoryEntry {
  return { id, name: `Blueprint ${id}`, goal: `goal ${id}`, date: "2026-06-13", result: emptyResult };
}

describe("blueprint history", () => {
  beforeEach(() => localStorage.clear());

  it("saves and reads back, newest first", () => {
    saveBlueprintHistory(entry("1"));
    saveBlueprintHistory(entry("2"));
    const list = getBlueprintHistory();
    expect(list.map((e) => e.id)).toEqual(["2", "1"]);
  });

  it("dedups by id (re-saving moves it to the front)", () => {
    saveBlueprintHistory(entry("1"));
    saveBlueprintHistory(entry("2"));
    saveBlueprintHistory(entry("1"));
    const list = getBlueprintHistory();
    expect(list.map((e) => e.id)).toEqual(["1", "2"]);
  });

  it("caps at 5 entries", () => {
    for (let i = 1; i <= 7; i++) saveBlueprintHistory(entry(String(i)));
    expect(getBlueprintHistory()).toHaveLength(5);
    expect(getBlueprintHistory()[0].id).toBe("7");
  });

  it("deletes by id", () => {
    saveBlueprintHistory(entry("1"));
    saveBlueprintHistory(entry("2"));
    deleteBlueprintHistory("1");
    expect(getBlueprintHistory().map((e) => e.id)).toEqual(["2"]);
  });
});
