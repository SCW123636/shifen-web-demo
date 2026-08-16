import { ArrowRight, CalendarDays, Clock3, FileUp, GraduationCap, ShieldCheck, Target } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../../components/AppShell";
import { CultivationPanel } from "../../components/CultivationPanel";
import { saveDemoProfile, type DemoProfile } from "../../session";

const foundationLabels = {
  beginner: "刚开始系统复习",
  basic: "基本概念已学，综合题薄弱",
  steady: "基础稳定，需要强化迁移",
} as const;

export function SetupPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [building, setBuilding] = useState(false);
  const [courseName, setCourseName] = useState("高等数学（上）");
  const [examDate, setExamDate] = useState("2026-08-28");
  const [targetScore, setTargetScore] = useState(80);
  const [foundation, setFoundation] = useState<keyof typeof foundationLabels>("basic");
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [useDemoMaterials, setUseDemoMaterials] = useState(true);

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
    saveDemoProfile(profile);
    setBuilding(true);
    window.setTimeout(() => navigate("/study/course_calculus_2026"), 650);
  }

  return (
    <AppShell
      aside={
        <CultivationPanel
          checkpoint="等待课程证据"
          realm="未入道"
          status="pending"
          xp={0}
        />
      }
      cultivation={{ realm: "未入道", status: "pending", xp: 0 }}
      setup
    >
      <section className="setup-page">
        <div className="setup-heading">
          <span className="eyebrow">新课程</span>
          <h1>建立你的期末复习路径</h1>
          <p>高价值原题会结合目标、基础、作答表现和可用时间动态排序。</p>
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
            <p><ShieldCheck aria-hidden="true" size={16} />上传文件不会离开本机；学习进度保存在本机浏览器。</p>
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
