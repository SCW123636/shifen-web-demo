import {
  BookOpenCheck,
  FileStack,
  History,
  ListChecks,
  Route,
  ScrollText,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { DemoProfile } from "../session";
import { daysUntilExam, defaultDemoProfile } from "../session";
import {
  CultivationSummary,
  type CultivationPanelProps,
} from "./CultivationPanel";

interface AppShellProps {
  children: ReactNode;
  aside: ReactNode;
  cultivation?: Pick<CultivationPanelProps, "realm" | "xp" | "status">;
  availableSections?: {
    route?: boolean;
    diagnosis?: boolean;
    history?: boolean;
  };
  profile?: DemoProfile;
  setup?: boolean;
}

const navItems = [
  { label: "练习", href: "/study/course_calculus_2026", icon: BookOpenCheck },
  { label: "路线", href: "#route", icon: Route },
  { label: "资料", href: "/setup", icon: FileStack },
  { label: "错题", href: "#diagnosis", icon: ListChecks },
  { label: "记录", href: "#history", icon: History },
];

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AppShell({
  children,
  aside,
  availableSections = {},
  cultivation,
  profile = defaultDemoProfile,
  setup = false,
}: AppShellProps) {
  const courseMeta = profile.materialSource === "uploaded"
    ? `距考试 ${daysUntilExam(profile.examDate)} 天 · 本机资料元数据 ${profile.materialCount} 份`
    : `距考试 ${daysUntilExam(profile.examDate)} 天 · 演示资料 ${profile.materialCount} 份`;
  const visibleNavItems = setup
    ? navItems.filter(item => item.href.startsWith("/"))
    : navItems;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="拾分">
          <span className="brand-seal" aria-hidden="true">拾</span>
          <div>
            <strong>拾分</strong>
            <span>大学期末复习</span>
          </div>
        </div>
        <div className="course-heading">
          <span>{setup ? "建立复习课程" : profile.courseName}</span>
          <small>{setup ? "目标、基础与时间约束" : courseMeta}</small>
        </div>
        <div className="topbar-status">
          <div className="runtime-chip">
            <span className="runtime-dot" aria-hidden="true" />
            <span>本地演示数据</span>
          </div>
          <CultivationSummary
            realm={cultivation?.realm ?? (setup ? "未入道" : "引气 · 三层")}
            status={cultivation?.status ?? (setup ? "pending" : "ready")}
            xp={cultivation?.xp ?? (setup ? 0 : 35)}
          />
        </div>
      </header>

      <div className="shell-grid">
        <nav className="primary-nav" aria-label="主导航">
          <div className="nav-track">
            {visibleNavItems.map(({ label, href, icon: Icon }) => (
              href.startsWith("/") ? (
                <Link
                  className={setup === (href === "/setup") ? "nav-link active" : "nav-link"}
                  aria-current={setup === (href === "/setup") ? "page" : undefined}
                  key={label}
                  to={href}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{label}</span>
                </Link>
              ) : (href === "#route" && availableSections.route === false)
                || (href === "#diagnosis" && !availableSections.diagnosis)
                || (href === "#history" && !availableSections.history) ? (
                <span aria-disabled="true" className="nav-link disabled" key={label}>
                  <Icon aria-hidden="true" size={18} />
                  <span>{label}</span>
                </span>
              ) : (
                <button
                  className="nav-link"
                  onClick={() => scrollToSection(href.slice(1))}
                  type="button"
                  key={label}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{label}</span>
                </button>
              )
            ))}
          </div>
          <Link className="nav-settings" to="/setup" title="课程设置">
            <Settings aria-hidden="true" size={18} />
            <span>设置</span>
          </Link>
        </nav>

        <main className="main-workspace">{children}</main>
        <aside className="context-aside" aria-label="学习上下文">
          {aside}
          <section className="local-boundary">
            <ScrollText aria-hidden="true" size={17} />
            <div>
              <strong>学习结论均为有界估计</strong>
              <span>依据课程材料与已确认作答，不替代学校或教师评价。</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
