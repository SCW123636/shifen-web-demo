export type DemoScenario = "incorrect" | "correct" | "uncertain" | "downstream_failure";
export type StudyPhase = "drafting" | "provisional" | "review" | "confirmed" | "unavailable";

export interface DemoQuestion {
  questionId: string;
  sourceLabel: string;
  sourceLocation: string;
  score: number;
  suggestedMinutes: number;
  knowledge: string;
  content: string;
  questionNumber: string;
  correctionFocus: string;
  diagnosis: {
    correctEvidence: string;
    correctExplanation: string;
    firstError: string;
    errorExplanation: string;
    rubric: readonly [string, string, string];
  };
}

export const demoQuestions: DemoQuestion[] = [
  {
    questionId: "q-paper-2024-05",
    sourceLabel: "2024 秋季期末试卷原题",
    sourceLocation: "A 卷 · 第 3 页 · 第 5 题",
    score: 10,
    suggestedMinutes: 8,
    knowledge: "闭区间函数最值",
    content: "已知 f(x) = x³ - 3x² + 2，x ∈ [-1, 3]，求函数在闭区间上的最大值与最小值。",
    questionNumber: "05",
    correctionFocus: "补齐端点比较步骤",
    diagnosis: {
      correctEvidence: "驻点与两个端点均已比较",
      correctExplanation: "步骤覆盖本题三个评分点，结论与材料中的评分标准一致。",
      firstError: "遗漏了区间端点的函数值比较",
      errorExplanation: "闭区间最值必须同时比较驻点和端点。当前答案只代入了 x=0 与 x=2。",
      rubric: ["求导并找到驻点", "比较区间端点", "写出最值结论"],
    },
  },
  {
    questionId: "q-paper-2023-08",
    sourceLabel: "2023 春季期末试卷原题",
    sourceLocation: "B 卷 · 第 4 页 · 第 8 题",
    score: 8,
    suggestedMinutes: 7,
    knowledge: "导数与最值判定",
    content: "设 f(x) = x + 4/x，x ∈ [1, 5]，求 f(x) 的最大值与最小值，并写出判定过程。",
    questionNumber: "08",
    correctionFocus: "补齐区间边界比较",
    diagnosis: {
      correctEvidence: "驻点与区间边界均已比较",
      correctExplanation: "导数判定、候选点计算和最值结论均覆盖评分点。",
      firstError: "只判断了驻点，没有比较区间边界",
      errorExplanation: "闭区间最值必须比较区间内驻点与两个边界的函数值。",
      rubric: ["求导并找到驻点", "比较区间边界", "写出最值结论"],
    },
  },
];

export const probabilityQuestions: DemoQuestion[] = [
  {
    questionId: "q-prob-paper-2024-03",
    sourceLabel: "概率论期末试卷原题",
    sourceLocation: "A 卷 · 第 2 页 · 第 3 题",
    score: 8,
    suggestedMinutes: 7,
    knowledge: "条件概率与独立性",
    content: "设 P(A)=0.6，P(B)=0.5，P(A∩B)=0.3。求 P(A|B)，并判断事件 A 与 B 是否独立。",
    questionNumber: "03",
    correctionFocus: "补齐独立性判定",
    diagnosis: {
      correctEvidence: "条件概率计算与独立性判定均有依据",
      correctExplanation: "答案同时验证了 P(A|B) 与 P(A) 的关系，并覆盖三个评分点。",
      firstError: "给出条件概率后，未验证事件独立性",
      errorExplanation: "还需比较 P(A∩B) 与 P(A)P(B)，才能完成独立性判定。",
      rubric: ["写出条件概率公式", "计算 P(A|B)", "验证事件独立性"],
    },
  },
  {
    questionId: "q-prob-paper-2023-06",
    sourceLabel: "2023 秋季概率论期末原题",
    sourceLocation: "B 卷 · 第 3 页 · 第 6 题",
    score: 10,
    suggestedMinutes: 9,
    knowledge: "全概率公式与贝叶斯公式",
    content: "三台机器生产同一种零件，产量占比为 0.2、0.3、0.5，次品率分别为 1%、2%、3%。随机抽到一件次品，求它来自第三台机器的概率。",
    questionNumber: "06",
    correctionFocus: "补齐贝叶斯分母",
    diagnosis: {
      correctEvidence: "全概率分母与贝叶斯分子均已列出",
      correctExplanation: "来源先验、条件概率与归一化计算均与评分标准一致。",
      firstError: "贝叶斯公式分母遗漏了前两台机器",
      errorExplanation: "分母应为三种来源产生次品的总概率，不能只保留第三台机器。",
      rubric: ["计算次品总概率", "写出贝叶斯公式", "得到后验概率"],
    },
  },
];

export function questionsForCourse(courseName: string): DemoQuestion[] | null {
  if (/概率|统计/.test(courseName)) return probabilityQuestions;
  if (/高等数学|微积分/.test(courseName)) return demoQuestions;
  return null;
}
