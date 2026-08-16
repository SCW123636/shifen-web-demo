import { Mountain, ShieldCheck, Sparkles } from "lucide-react";

export type CultivationStatus = "ready" | "pending" | "frozen" | "unchanged" | "unavailable";

export interface CultivationPanelProps {
  realm?: string;
  xp?: number;
  xpDelta?: number;
  status?: CultivationStatus;
  evidenceId?: string;
  evidenceCount?: number;
  checkpoint?: string;
}

const statusCopy = {
  ready: "当前成长已由有效证据确认",
  pending: "确认后才会结算成长",
  frozen: "复核中，争议证据暂不计入修行",
  unchanged: "本次未形成正向成长证据",
  unavailable: "成长投影暂时不可用",
} as const;

export function CultivationSummary({
  realm = "引气 · 三层",
  xp = 35,
  status = "ready",
}: Pick<CultivationPanelProps, "realm" | "xp" | "status">) {
  return (
    <div
      aria-label="常驻修行摘要"
      className={`cultivation-summary status-${status}`}
      role="status"
    >
      <Mountain aria-hidden="true" size={16} />
      <span>
        <small>修行常驻</small>
        <strong>{realm}</strong>
      </span>
      <b>{status === "unavailable" ? "--" : xp} XP</b>
    </div>
  );
}

export function CultivationPanel({
  realm = "引气 · 三层",
  xp = 35,
  xpDelta = 0,
  status = "ready",
  evidenceId,
  evidenceCount = 0,
  checkpoint = "闭区间最值 · 初窥门径",
}: CultivationPanelProps) {
  const progress = Math.min(100, Math.max(0, (xp / 50) * 100));
  return (
    <section className="cultivation-panel" aria-label="修行进度">
      <div className="panel-kicker">
        <Mountain aria-hidden="true" size={18} />
        <span>修行进度</span>
        <em>常驻</em>
      </div>
      <div className="realm-row">
        <div>
          <span>当前境界</span>
          <strong>{realm}</strong>
        </div>
        <div className="xp-number">
          <span>累计 XP</span>
          <strong>{status === "unavailable" ? "--" : xp}</strong>
        </div>
      </div>
      <div
        aria-label="修行进度"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={status === "unavailable" ? undefined : Math.round(progress)}
        aria-valuetext={status === "unavailable" ? "暂时不可用" : undefined}
        className={`xp-track${status === "unavailable" ? " is-unavailable" : ""}`}
        role="progressbar"
      >
        <span style={{ width: status === "unavailable" ? "0%" : `${progress}%` }} />
      </div>
      <p className={`cultivation-status status-${status}`}>
        {status === "ready" ? <ShieldCheck aria-hidden="true" size={15} /> : <Sparkles aria-hidden="true" size={15} />}
        {statusCopy[status]}
      </p>
      {xpDelta !== 0 ? <p className="xp-delta">{xpDelta > 0 ? "+" : ""}{xpDelta} XP</p> : null}
      <dl className="checkpoint-list">
        <div>
          <dt>有效证据</dt>
          <dd>{evidenceCount} 条有效证据</dd>
        </div>
        <div>
          <dt>功法检查点</dt>
          <dd>{checkpoint}</dd>
        </div>
        {evidenceId ? (
          <div>
            <dt>最近有效证据</dt>
            <dd className="mono">{evidenceId}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
