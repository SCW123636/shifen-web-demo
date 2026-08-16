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

let volatileDemoProfile: DemoProfile | undefined;
let profileStorageFallback = false;
const volatileDemoProgress = new Map<string, DemoProgress>();
const progressStorageFallback = new Set<string>();

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
  try {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function progressKey(courseName: string) {
  return `${DEMO_PROGRESS_PREFIX}${encodeURIComponent(courseName.trim().toLowerCase())}`;
}

function evidenceScope(evidenceId: string) {
  return evidenceId.match(/^(ev_demo_.+)_(?:correct|incorrect)$/)?.[1] ?? evidenceId;
}

function normalizeEvidenceIds(evidenceIds: string[]) {
  const activeByQuestion = new Map<string, string>();
  for (const evidenceId of evidenceIds) {
    const scope = evidenceScope(evidenceId);
    activeByQuestion.delete(scope);
    activeByQuestion.set(scope, evidenceId);
  }
  return [...activeByQuestion.values()];
}

function normalizeProgress(progress: Partial<DemoProgress>): DemoProgress {
  const attemptedIds = Array.isArray(progress.attemptedIds)
    ? progress.attemptedIds.filter((value): value is string => typeof value === "string")
    : [];
  const evidenceIds = Array.isArray(progress.confirmedEvidenceIds)
    ? progress.confirmedEvidenceIds.filter((value): value is string => typeof value === "string")
    : [];
  const earnedXp = Number(progress.earnedXp);
  return {
    attemptedIds: [...new Set(attemptedIds)],
    confirmedEvidenceIds: normalizeEvidenceIds(evidenceIds),
    earnedXp: Number.isFinite(earnedXp) && earnedXp >= 0 ? earnedXp : 0,
  };
}

export function loadDemoProfile(): DemoProfile {
  if (!canUseStorage()) return volatileDemoProfile ?? defaultDemoProfile;
  try {
    const stored = window.sessionStorage.getItem(DEMO_PROFILE_KEY);
    if (!stored) return profileStorageFallback && volatileDemoProfile
      ? volatileDemoProfile
      : defaultDemoProfile;
    const parsed = JSON.parse(stored) as Partial<DemoProfile>;
    const profile: DemoProfile = {
      ...defaultDemoProfile,
      ...parsed,
      targetScore: Number(parsed.targetScore ?? defaultDemoProfile.targetScore),
      dailyMinutes: Number(parsed.dailyMinutes ?? defaultDemoProfile.dailyMinutes),
      materialCount: Number(parsed.materialCount ?? defaultDemoProfile.materialCount),
      materialSource: parsed.materialSource === "uploaded" ? "uploaded" : "demo",
    };
    volatileDemoProfile = profile;
    profileStorageFallback = false;
    return profile;
  } catch {
    return volatileDemoProfile ?? defaultDemoProfile;
  }
}

export function saveDemoProfile(profile: DemoProfile) {
  volatileDemoProfile = { ...profile };
  profileStorageFallback = true;
  if (!canUseStorage()) return false;
  try {
    window.sessionStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
    profileStorageFallback = false;
    return true;
  } catch {
    return false;
  }
}

export function isDemoProfileVolatile() {
  return profileStorageFallback;
}

export function loadDemoProgress(courseName: string): DemoProgress {
  const empty: DemoProgress = { attemptedIds: [], confirmedEvidenceIds: [], earnedXp: 0 };
  const key = progressKey(courseName);
  if (!canUseLocalStorage()) return volatileDemoProgress.get(key) ?? empty;
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return progressStorageFallback.has(key)
      ? volatileDemoProgress.get(key) ?? empty
      : empty;
    const progress = normalizeProgress(JSON.parse(stored) as Partial<DemoProgress>);
    volatileDemoProgress.set(key, progress);
    progressStorageFallback.delete(key);
    return progress;
  } catch {
    return volatileDemoProgress.get(key) ?? empty;
  }
}

export function saveDemoProgress(courseName: string, progress: DemoProgress) {
  const key = progressKey(courseName);
  const normalized = normalizeProgress(progress);
  volatileDemoProgress.set(key, normalized);
  progressStorageFallback.add(key);
  if (!canUseLocalStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(normalized));
    progressStorageFallback.delete(key);
    return true;
  } catch {
    return false;
  }
}

export function clearDemoProgress(courseName: string) {
  const key = progressKey(courseName);
  volatileDemoProgress.delete(key);
  progressStorageFallback.delete(key);
  if (!canUseLocalStorage()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function daysUntilExam(examDate: string) {
  if (!examDate) return 0;
  const today = new Date();
  const exam = new Date(examDate + "T00:00:00");
  if (!Number.isFinite(exam.getTime())) return 0;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.ceil((exam.getTime() - start.getTime()) / 86400000));
}
