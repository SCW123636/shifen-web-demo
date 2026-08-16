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

  it("keeps a newer profile when a persisted profile overwrite is rejected", () => {
    const original = {
      courseName: "高等数学（上）",
      examDate: "2026-08-28",
      targetScore: 80,
      foundation: "综合题薄弱",
      dailyMinutes: 45,
      materialCount: 8,
      materialSource: "demo",
    } as const;
    const updated = { ...original, courseName: "概率论", targetScore: 88 };

    expect(saveDemoProfile(original)).toBe(true);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });

    expect(saveDemoProfile(updated)).toBe(false);
    expect(loadDemoProfile()).toEqual(updated);
  });

  it("keeps newer progress when a persisted progress overwrite is rejected", () => {
    const original = {
      attemptedIds: ["q-paper-2024-05"],
      confirmedEvidenceIds: ["ev_demo_q-paper-2024-05_correct"],
      earnedXp: 5,
    };
    const updated = {
      attemptedIds: ["q-paper-2024-05", "q-paper-2023-08"],
      confirmedEvidenceIds: ["ev_demo_q-paper-2023-08_correct"],
      earnedXp: 10,
    };

    expect(saveDemoProgress("高等数学（上）", original)).toBe(true);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });

    expect(saveDemoProgress("高等数学（上）", updated)).toBe(false);
    expect(loadDemoProgress("高等数学（上）")).toEqual(updated);
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

  it("keeps a failed new-round clear as an empty current-session tombstone", () => {
    const existing = {
      attemptedIds: ["q-paper-2024-05"],
      confirmedEvidenceIds: ["ev_demo_q-paper-2024-05_correct"],
      earnedXp: 5,
    };
    saveDemoProgress("高等数学（上）", existing);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });

    expect(clearDemoProgress("高等数学（上）")).toBe(false);
    expect(loadDemoProgress("高等数学（上）")).toEqual({
      attemptedIds: [],
      confirmedEvidenceIds: [],
      earnedXp: 0,
    });
  });
});
