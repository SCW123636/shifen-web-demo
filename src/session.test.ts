import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  daysUntilExam,
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
  afterEach(() => vi.restoreAllMocks());

  it("does not crash when browser storage rejects writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });

    expect(() => saveDemoProfile({
      courseName: "高等数学（上）",
      examDate: "2026-08-28",
      targetScore: 80,
      foundation: "综合题薄弱",
      dailyMinutes: 45,
      materialCount: 8,
      materialSource: "demo",
    })).not.toThrow();
    expect(() => saveDemoProgress("高等数学（上）", {
      attemptedIds: ["q-paper-2024-05"],
      confirmedEvidenceIds: ["ev_demo_q-paper-2024-05_correct"],
      earnedXp: 5,
    })).not.toThrow();
  });
});
