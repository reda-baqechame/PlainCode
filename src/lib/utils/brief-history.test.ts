// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveBriefHistory,
  getBriefHistory,
  deleteBriefHistory,
  type BriefHistoryEntry,
} from "./history";
import type { BriefResult } from "@/types/brief";

const emptyResult: BriefResult = {
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
  briefMarkdown: "",
  prompts: { codex: "", claude: "", chatgpt: "", cursor: "", generic: "" },
};

function entry(id: string): BriefHistoryEntry {
  return { id, name: `Brief ${id}`, goal: `goal ${id}`, date: "2026-06-13", result: emptyResult };
}

describe("brief history", () => {
  beforeEach(() => localStorage.clear());

  it("saves and reads back, newest first", () => {
    saveBriefHistory(entry("1"));
    saveBriefHistory(entry("2"));
    const list = getBriefHistory();
    expect(list.map((e) => e.id)).toEqual(["2", "1"]);
  });

  it("dedups by id (re-saving moves it to the front)", () => {
    saveBriefHistory(entry("1"));
    saveBriefHistory(entry("2"));
    saveBriefHistory(entry("1"));
    const list = getBriefHistory();
    expect(list.map((e) => e.id)).toEqual(["1", "2"]);
  });

  it("caps at 5 entries", () => {
    for (let i = 1; i <= 7; i++) saveBriefHistory(entry(String(i)));
    expect(getBriefHistory()).toHaveLength(5);
    expect(getBriefHistory()[0].id).toBe("7");
  });

  it("deletes by id", () => {
    saveBriefHistory(entry("1"));
    saveBriefHistory(entry("2"));
    deleteBriefHistory("1");
    expect(getBriefHistory().map((e) => e.id)).toEqual(["2"]);
  });
});
