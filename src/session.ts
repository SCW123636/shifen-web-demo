export const DEMO_PROFILE_KEY = "shifen-demo-profile";
const DEMO_PROGRESS_PREFIX = "shifen-demo-progress:";

export interface DemoProfile {
  courseName: string;
  examDate: string;
  targetScore: number;
  foundation: string;
  dailyMinutes: number;
  materialCount: number;
  materialSource: "demo" | "uploaded";
}

export interface DemoProgress {
  attemptedIds: string[];
  confirmedEvidenceIds: string[];
  earnedXp: number;
}

export const defaultDemoProfile: DemoProfile = {
  courseName: "高等数学（上）",
  examDate: "2026-08-28",
  targetScore: 80,
  foundation: "综合题薄弱",
  dailyMinutes: 45,
  materialCount: 8,
  materialSource: "demo",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function progressKey(courseName: string) {
  return `${DEMO_PROGRESS_PREFIX}${encodeURIComponent(courseName.trim().toLowerCase())}`;
}

export function loadDemoProfile(): DemoProfile {
  if (!canUseStorage()) return defaultDemoProfile;
  try {
    const stored = window.sessionStorage.getItem(DEMO_PROFILE_KEY);
    if (!stored) return defaultDemoProfile;
    const parsed = JSON.parse(stored) as Partial<DemoProfile>;
    return {
      ...defaultDemoProfile,
      ...parsed,
      targetScore: Number(parsed.targetScore ?? defaultDemoProfile.targetScore),
      dailyMinutes: Number(parsed.dailyMinutes ?? defaultDemoProfile.dailyMinutes),
      materialCount: Number(parsed.materialCount ?? defaultDemoProfile.materialCount),
      materialSource: parsed.materialSource === "uploaded" ? "uploaded" : "demo",
    };
  } catch {
    return defaultDemoProfile;
  }
}

export function saveDemoProfile(profile: DemoProfile) {
  if (!canUseStorage()) return;
  window.sessionStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
}

export function loadDemoProgress(courseName: string): DemoProgress {
  const empty: DemoProgress = { attemptedIds: [], confirmedEvidenceIds: [], earnedXp: 0 };
  if (!canUseLocalStorage()) return empty;
  try {
    const stored = window.localStorage.getItem(progressKey(courseName));
    if (!stored) return empty;
    const parsed = JSON.parse(stored) as Partial<DemoProgress>;
    const attemptedIds = Array.isArray(parsed.attemptedIds)
      ? parsed.attemptedIds.filter((value): value is string => typeof value === "string")
      : [];
    const confirmedEvidenceIds = Array.isArray(parsed.confirmedEvidenceIds)
      ? parsed.confirmedEvidenceIds.filter((value): value is string => typeof value === "string")
      : [];
    const earnedXp = Number(parsed.earnedXp);
    return {
      attemptedIds: [...new Set(attemptedIds)],
      confirmedEvidenceIds: [...new Set(confirmedEvidenceIds)],
      earnedXp: Number.isFinite(earnedXp) && earnedXp >= 0 ? earnedXp : 0,
    };
  } catch {
    return empty;
  }
}

export function saveDemoProgress(courseName: string, progress: DemoProgress) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(progressKey(courseName), JSON.stringify(progress));
}

export function daysUntilExam(examDate: string) {
  if (!examDate) return 0;
  const today = new Date();
  const exam = new Date(examDate + "T00:00:00");
  if (!Number.isFinite(exam.getTime())) return 0;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.ceil((exam.getTime() - start.getTime()) / 86400000));
}
