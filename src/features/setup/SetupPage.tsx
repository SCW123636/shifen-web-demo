import { ArrowRight, CalendarDays, Clock3, FileUp, GraduationCap, ShieldCheck, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppShell } from "../../components/AppShell";
import { CultivationPanel } from "../../components/CultivationPanel";
import {
  clearDemoProgress,
  loadDemoProfile,
  loadDemoProgress,
  saveDemoProfile,
  type DemoProfile,
} from "../../session";

const foundationLabels = {
  beginner: "刚开始系统复习",
  basic: "基本概念已学，综合题薄弱",
  steady: "基础稳定，需要强化迁移",
} as const;

function foundationKeyFor(label: string): keyof typeof foundationLabels {
  return (Object.entries(foundationLabels).find(([, value]) => value === label)?.[0]
    ?? "basic") as keyof typeof foundationLabels;
}

export function SetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialProfile = useMemo(loadDemoProfile, []);
  const resetRound = new URLSearchParams(location.search).get("reset") === "1";
  const [files, setFiles] = useState<File[]>([]);
  const [building, setBuilding] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [courseName, setCourseName] = useState(initialProfile.courseName);
  const [examDate, setExamDate] = useState(initialProfile.examDate);
  const [targetScore, setTargetScore] = useState(initialProfile.targetScore);
  const [foundation, setFoundation] = useState<keyof typeof foundationLabels>(() => foundationKeyFor(initialProfile.foundation));
  const [dailyMinutes, setDailyMinutes] = useState(initialProfile.dailyMinutes);
  const [useDemoMaterials, setUseDemoMaterials] = useState(initialProfile.materialSource === "demo");
  const cultivationProgress = useMemo(() => loadDemoProgress(courseName), [courseName]);
  const cultivationRealm = cultivationProgress.earnedXp > 0 ? "引气 · 一层" : "未入道";
  const cultivationStatus = cultivationProgress.confirmedEvidenceIds.length > 0 ? "ready" as const : "pending" as const;
  const latestEvidenceId = cultivationProgress.confirmedEvidenceIds[cultivationProgress.confirmedEvidenceIds.length - 1];

  function start() {
    const profile: DemoProfile = {
      courseName: courseName.trim(),
      examDate,
      targetScore,
      foundation: foundationLabels[foundation],
      dailyMinutes,
      materialCount: files.length || 8,
      materialSource: files.length ? "uploaded" : "demo",
    };
    if (resetRound) clearDemoProgress(profile.courseName);
    const persisted = saveDemoProfile(profile);
    setStorageWarning(!persisted);
    setBuilding(true);
    window.setTimeout(() => navigate("/study/course_calculus_2026"), 650);
  }

  return (
    <AppShell
      aside={
        <CultivationPanel
          checkpoint={cultivationProgress.confirmedEvidenceIds.length ? "课程设置中" : "等待课程证据"}
          evidenceCount={cultivationProgress.confirmedEvidenceIds.length}
          evidenceId={latestEvidenceId}
          realm={cultivationRealm}
          status={cultivationStatus}
          xp={cultivationProgress.earnedXp}
        />
      }
      cultivation={{ realm: cultivationRealm, status: cultivationStatus, xp: cultivationProgress.earnedXp }}
      setup
    >
      <section className="setup-page">
        <div className="setup-heading">
          <span className="eyebrow">新课程</span>
          <h1>建立你的期末复习路径</h1>
          <p>本 Demo 会记录目标、基础与可用时间，并用预置分支演示后续个性化路线；当前静态版本尚未调用在线规划服务。</p>
          {resetRound ? (
            <p className="reset-round-note" role="note">开始后会清除本课程的本地演示进度，并从第一道样例原题重新开始。</p>
          ) : null}
        </div>

        <form onSubmit={event => { event.preventDefault(); start(); }}>
          <fieldset>
            <legend><GraduationCap aria-hidden="true" size={19} />课程与考试</legend>
            <label>
              <span>课程名称</span>
              <input
                onChange={event => setCourseName(event.target.value)}
                required
                value={courseName}
              />
            </label>
            <label>
              <span>考试日期</span>
              <div className="input-with-icon"><CalendarDays aria-hidden="true" size={17} /><input onChange={event => setExamDate(event.target.value)} required type="date" value={examDate} /></div>
            </label>
          </fieldset>

          <fieldset>
            <legend><Target aria-hidden="true" size={19} />个性化约束</legend>
            <label>
              <span>目标分数</span>
              <div className="input-suffix"><input aria-label="目标分数" max="100" min="0" onChange={event => setTargetScore(Number(event.target.value))} type="number" value={targetScore} /><span>分</span></div>
            </label>
            <label>
              <span>当前基础</span>
              <select aria-label="当前基础" onChange={event => setFoundation(event.target.value as keyof typeof foundationLabels)} value={foundation}>
                <option value="beginner">刚开始系统复习</option>
                <option value="basic">基本概念已学，综合题薄弱</option>
                <option value="steady">基础稳定，需要强化迁移</option>
              </select>
            </label>
            <label>
              <span>每天可用时间</span>
              <div className="input-with-icon"><Clock3 aria-hidden="true" size={17} /><input aria-label="每天可用时间" max="360" min="10" onChange={event => setDailyMinutes(Number(event.target.value))} type="number" value={dailyMinutes} /><span>分钟</span></div>
            </label>
          </fieldset>

          <fieldset className="materials-fieldset">
            <legend><FileUp aria-hidden="true" size={19} />本机课程资料</legend>
            <label className="material-dropzone">
              <FileUp aria-hidden="true" size={25} />
              <strong>{files.length ? `已选择 ${files.length} 份资料` : "选择试卷、题库或课程资料"}</strong>
              <span>TXT、MD、JSON、PNG、JPEG、WEBP</span>
              <input
                accept=".txt,.md,.json,.png,.jpg,.jpeg,.webp"
                aria-label="课程资料"
                multiple
                onChange={event => setFiles([...event.currentTarget.files ?? []])}
                type="file"
              />
            </label>
            <label className="demo-material-toggle">
              <input
                checked={useDemoMaterials}
                onChange={event => setUseDemoMaterials(event.target.checked)}
                type="checkbox"
              />
              <span>未上传文件时，使用已脱敏并获授权的演示资料</span>
            </label>
            <p className="material-boundary-note" role="note">
              当前公开 Demo 的题面来自获授权预置样例。上传文件只作为本机输入元数据，不会上传云端，也不会改变演示题包。
            </p>
          </fieldset>

          <div className="setup-submit">
            <div>
              <p><ShieldCheck aria-hidden="true" size={16} />上传文件不会离开本机；学习进度保存在本机浏览器。</p>
              {storageWarning ? (
                <p className="storage-warning" role="alert">浏览器拒绝本地存储，本次约束仅保留在当前会话；刷新后可能恢复默认值。</p>
              ) : null}
            </div>
            <button
              className="primary-button"
              disabled={building || (!files.length && !useDemoMaterials)}
              type="submit"
            >
              {building ? "正在建立路径" : "建立复习路径"}<ArrowRight aria-hidden="true" size={17} />
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
