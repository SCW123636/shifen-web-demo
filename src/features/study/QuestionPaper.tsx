import { Clock3, FileText, ScanLine } from "lucide-react";
import type { DemoQuestion } from "../../model";

export function QuestionPaper({
  attempted = false,
  question,
}: {
  attempted?: boolean;
  question: DemoQuestion;
}) {
  return (
    <section className="question-paper" data-testid="question-paper">
      <div className="paper-meta">
        <span className="source-tag"><FileText aria-hidden="true" size={15} />{question.sourceLabel}</span>
        <span className="mono">{question.sourceLocation}</span>
      </div>
      <div className="question-heading">
        <div className="question-number">{question.questionNumber}</div>
        <div>
          <p className="question-type">计算题 · {question.knowledge}</p>
          <h1>{question.content}</h1>
        </div>
      </div>
      <div className="question-footnotes">
        <span><ScanLine aria-hidden="true" size={15} />{attempted ? "已做原题" : "未做原题"}</span>
        <span><Clock3 aria-hidden="true" size={15} />建议 {question.suggestedMinutes} 分钟</span>
        <span className="mono">{question.score} 分</span>
      </div>
    </section>
  );
}
