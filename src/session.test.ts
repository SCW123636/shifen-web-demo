import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDemoProgress,
  daysUntilExam,
  loadDemoProfile,
  loadDemoProgress,
  saveDemoProfile,
  saveDemoProgress,
} from "./session";

describe("daysUntilExam", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T12:00:00"));
  });

  it("returns zero for an empty or invalid exam date", () => {
    expect(daysUntilExam("")).toBe(0);
    expect(daysUntilExam("not-a-date")).toBe(0);
  });
});

describe("browser storage fallback", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.useRealTimers();
  });
  afterEach(() => vi.restoreAllMocks());

  it("keeps the current profile in memory when browser storage rejects writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });

    const profile = {
      courseName: "高等数学（上）",
      examDate: "2026-08-28",
      targetScore: 80,
      foundation: "综合题薄弱",
      dailyMinutes: 45,
      materialCount: 8,
      materialSource: "demo",
    } as const;

    expect(saveDemoProfile(profile)).toBe(false);
    expect(loadDemoProfile()).toEqual(profile);
    expect(() => saveDemoProgress("高等数学（上）", {
      attemptedIds: ["q-paper-2024-05"],
      confirmedEvidenceIds: ["ev_demo_q-paper-2024-05_correct"],
      earnedXp: 5,
    })).not.toThrow();
  });

  it("keeps only the latest active evidence version for each question", () => {
    saveDemoProgress("高等数学（上）", {
      attemptedIds: ["q-paper-2024-05", "q-paper-2023-08"],
      confirmedEvidenceIds: [
        "ev_demo_q-paper-2024-05",
        "ev_demo_q-paper-2024-05_incorrect",
        "ev_demo_q-paper-2023-08_correct",
        "ev_demo_q-paper-2024-05_correct",
      ],
      earnedXp: 10,
    });

    expect(loadDemoProgress("高等数学（上）").confirmedEvidenceIds).toEqual([
      "ev_demo_q-paper-2023-08_correct",
      "ev_demo_q-paper-2024-05_correct",
    ]);
  });

  it("clears one course progress for an explicitly requested new round", () => {
    saveDemoProgress("高等数学（上）", {
      attemptedIds: ["q-paper-2024-05"],
      confirmedEvidenceIds: ["ev_demo_q-paper-2024-05_correct"],
      earnedXp: 5,
    });

    expect(clearDemoProgress("高等数学（上）")).toBe(true);
    expect(loadDemoProgress("高等数学（上）")).toEqual({
      attemptedIds: [],
      confirmedEvidenceIds: [],
      earnedXp: 0,
    });
  });
});
