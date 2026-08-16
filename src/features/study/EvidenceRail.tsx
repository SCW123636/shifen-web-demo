import { Check, Circle } from "lucide-react";

interface EvidenceRailProps {
  stage: 1 | 2 | 3 | 4;
  terminalLabel?: "确认" | "复核";
}

export function EvidenceRail({
  stage,
  terminalLabel = "确认",
}: EvidenceRailProps) {
  const stages = ["题面", "作答", terminalLabel] as const;
  return (
    <ol className="evidence-rail" aria-label="学习证据阶段">
      {stages.map((label, index) => {
        const position = (index + 1) as 1 | 2 | 3;
        const complete = position < stage;
        const current = position === stage;
        return (
          <li
            aria-current={current ? "step" : undefined}
            className={current ? "current" : complete ? "complete" : ""}
            key={label}
          >
            <span className="rail-marker">
              {complete ? <Check aria-hidden="true" size={13} /> : <Circle aria-hidden="true" size={10} />}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
