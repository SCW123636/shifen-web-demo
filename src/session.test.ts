import { beforeEach, describe, expect, it, vi } from "vitest";

import { daysUntilExam } from "./session";

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
