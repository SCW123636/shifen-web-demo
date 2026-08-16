import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileCheck2,
  FlaskConical,
  ImagePlus,
  RefreshCw,
  Route,
  Scale,
  Send,
  TextCursorInput,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "../../components/AppShell";
import { CultivationPanel } from "../../components/CultivationPanel";
import {
  questionsForCourse,
  type DemoQuestion,
  type DemoScenario,
  type StudyPhase,
} from "../../model";
import {
  loadDemoProfile,
  loadDemoProgress,
  saveDemoProgress,
  type DemoProfile,
} from "../../session";
import { EvidenceRail } from "./EvidenceRail";
import { QuestionPaper } from "./QuestionPaper";

type AnswerMode = "text" | "photo";
const MAX_PHOTO_COUNT = 6;
const MAX_PHOTO_SIZE = 12 * 1024 * 1024;

function evidenceIdFor(questionId: string, correct: boolean) {
  return `ev_demo_${questionId}_${correct ? "correct" : "incorrect"}`;
}

function isEvidenceForQuestion(evidenceId: string, questionId: string) {
  const legacyId = `ev_demo_${questionId}`;
  return evidenceId === legacyId || evidenceId.startsWith(`${legacyId}_`);
}

function PersonalPath({
  phase,
  profile,
  question,
  scenario,
  evidenceCount,
}: {
  phase: StudyPhase;
  profile: DemoProfile;
  question: DemoQuestion;
  scenario: DemoScenario;
  evidenceCount: number;
}) {
  const confirmed = phase === "confirmed";
  const correct = scenario === "correct";
  const focus = confirmed && correct
    ? "进入间隔复习"
    : confirmed
      ? question.correctionFocus
      : phase === "unavailable"
        ? "等待恢复下一步"
        : phase === "review"
          ? "等待人工复核"
          : question.knowledge;
  const focusCopy = confirmed && correct
    ? "正确证据已确认，48 小时后复习，再进入综合迁移。"
    : confirmed
      ? "错误证据已进入路线，先做同知识点原题，再回到综合应用。"
      : phase === "unavailable"
        ? "作答证据已保存，路线尚未更新；恢复后会从同一证据继续。"
        : phase === "review"
          ? "争议尝试暂不计入掌握估计或修行 XP，等待人工确认。"
          : "分值高、近三套试卷重复出现，且当前掌握估计为 42%。";
  const basis = phase === "confirmed" || phase === "unavailable"
    ? "刚确认的作答"
    : phase === "review"
      ? "复核中的尝试"
      : `本次会话 ${evidenceCount} 条有效证据`;

  return (
    <section className="path-panel" id="route">
      <div className="panel-kicker">
        <Route aria-hidden="true" size={18} />
        <span>当前得分路线</span>
      </div>
      <dl className="constraint-grid">
        <div><dt>目标</dt><dd>{profile.targetScore} 分</dd></div>
        <div><dt>基础</dt><dd>{profile.foundation}</dd></div>
        <div><dt>时间</dt><dd>{profile.dailyMinutes} 分钟 / 天</dd></div>
        <div><dt>依据</dt><dd>{basis}</dd></div>
      </dl>
      <div className="focus-block">
        <span>当前重点</span>
        <strong>{focus}</strong>
        <p>{focusCopy}</p>
      </div>
      <ol className="next-steps">
        <li className="active">{confirmed && correct ? "48 小时后间隔复习" : `${question.knowledge}原题`}</li>
        <li>{confirmed && correct ? "综合题迁移" : `${question.correctionFocus}变式`}</li>
        <li>{confirmed && correct ? "一周后巩固" : "48 小时后间隔复习"}</li>
      </ol>
    </section>
  );
}

function UnsupportedCourse({ profile }: { profile: DemoProfile }) {
  return (
    <AppShell
      availableSections={{ route: false }}
      aside={
        <CultivationPanel
          checkpoint="等待课程知识库"
          evidenceCount={0}
          realm="未入道"
          status="pending"
          xp={0}
        />
      }
      cultivation={{ realm: "未入道", status: "pending", xp: 0 }}
      profile={profile}
    >
      <section className="unsupported-course" aria-labelledby="unsupported-course-heading">
        <AlertTriangle aria-hidden="true" size={28} />
        <span className="eyebrow">题包边界</span>
        <h1 id="unsupported-course-heading">当前演示题包暂不支持{profile.courseName}</h1>
        <p>本地 Demo 只提供高等数学与概率论的获授权样例，未建立课程知识库前不会套用其他课程的题目或评分点。</p>
        <Link className="primary-button" to="/setup">
          返回课程设置<ArrowRight aria-hidden="true" size={17} />
        </Link>
      </section>
    </AppShell>
  );
}

export function StudyPage() {
  const profile = useMemo(loadDemoProfile, []);
  const questions = useMemo(() => questionsForCourse(profile.courseName), [profile.courseName]);

  if (!questions) return <UnsupportedCourse profile={profile} />;
  return <StudyWorkspace profile={profile} questions={questions} />;
}

function StudyWorkspace({
  profile,
  questions,
}: {
  profile: DemoProfile;
  questions: DemoQuestion[];
}) {
  const initialProgress = useMemo(() => loadDemoProgress(profile.courseName), [profile.courseName]);
  const [questionIndex, setQuestionIndex] = useState(() => {
    const firstUnseen = questions.findIndex(item => !initialProgress.attemptedIds.includes(item.questionId));
    return firstUnseen === -1 ? 0 : firstUnseen;
  });
  const [answer, setAnswer] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("text");
  const [scenario, setScenario] = useState<DemoScenario>("incorrect");
  const [phase, setPhase] = useState<StudyPhase>("drafting");
  const [retryRecovered, setRetryRecovered] = useState(false);
  const [attemptedIds, setAttemptedIds] = useState<string[]>(initialProgress.attemptedIds);
  const [earnedXp, setEarnedXp] = useState(initialProgress.earnedXp);
  const [confirmedEvidenceIds, setConfirmedEvidenceIds] = useState<string[]>(initialProgress.confirmedEvidenceIds);
  const [confirmationXpDelta, setConfirmationXpDelta] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const diagnosisHeadingRef = useRef<HTMLHeadingElement>(null);
  const receiptHeadingRef = useRef<HTMLHeadingElement>(null);
  const question = questions[questionIndex % questions.length];

  useEffect(() => {
    saveDemoProgress(profile.courseName, {
      attemptedIds,
      confirmedEvidenceIds,
      earnedXp,
    });
  }, [attemptedIds, confirmedEvidenceIds, earnedXp, profile.courseName]);

  useEffect(() => {
    if (phase === "provisional" || phase === "review") {
      diagnosisHeadingRef.current?.focus();
    } else if (phase === "confirmed" || phase === "unavailable") {
      receiptHeadingRef.current?.focus();
    }
  }, [phase]);

  const currentEvidenceId = evidenceIdFor(question.questionId, scenario === "correct");
  const evidenceId = phase === "confirmed" || phase === "unavailable" ? currentEvidenceId : undefined;
  const latestEvidenceId = confirmedEvidenceIds[confirmedEvidenceIds.length - 1];
  const isCorrect = scenario === "correct";
  const realm = earnedXp > 0 ? "引气 · 一层" : "未入道";
  const answerLocked = phase !== "drafting";
  const hasDraft = answerMode === "text" ? Boolean(answer.trim()) : photoFiles.length > 0;
  const unseenQuestionCount = questions.filter(item => !attemptedIds.includes(item.questionId)).length;
  const poolLabel = unseenQuestionCount === 0
    ? "可信未做原题池：本轮已完成"
    : attemptedIds.includes(question.questionId)
      ? `可信未做原题池：剩余 ${unseenQuestionCount} 题`
      : "优先池：可信未做原题";
  const cultivation = useMemo(() => {
    if (phase === "review") return { status: "frozen" as const, xp: earnedXp, xpDelta: 0 };
    if (phase === "unavailable") return { status: "unavailable" as const, xp: earnedXp, xpDelta: 0 };
    if (phase === "provisional" && scenario === "uncertain") {
      return { status: "unchanged" as const, xp: earnedXp, xpDelta: 0 };
    }
    if (phase === "provisional") return { status: "pending" as const, xp: earnedXp, xpDelta: 0 };
    if (phase === "confirmed" && isCorrect) {
      return { status: "ready" as const, xp: earnedXp, xpDelta: confirmationXpDelta };
    }
    if (phase === "confirmed") return { status: "unchanged" as const, xp: earnedXp, xpDelta: 0 };
    return { status: "pending" as const, xp: earnedXp, xpDelta: 0 };
  }, [confirmationXpDelta, earnedXp, isCorrect, phase, scenario]);

  const stage: 1 | 2 | 3 | 4 = phase === "confirmed" || phase === "unavailable"
    ? 4
    : phase === "provisional" || phase === "review"
      ? 3
      : hasDraft
        ? 2
        : 1;

  function submitAnswer() {
    if (!hasDraft) return;
    setAttemptedIds(current => current.includes(question.questionId)
      ? current
      : [...current, question.questionId]);
    setPhase("provisional");
  }

  function requestReview() {
    setPhase("review");
  }

  function confirmAnswer() {
    const previousEvidenceId = confirmedEvidenceIds.find(id => isEvidenceForQuestion(id, question.questionId));
    const isSameVersion = previousEvidenceId === currentEvidenceId;
    const previousWasCorrect = previousEvidenceId?.endsWith("_correct") ?? false;
    const xpDelta = isSameVersion ? 0 : isCorrect ? 5 : previousWasCorrect ? -5 : 0;

    setConfirmationXpDelta(Math.max(0, xpDelta));
    if (!isSameVersion) {
      setConfirmedEvidenceIds(current => [
        ...current.filter(id => !isEvidenceForQuestion(id, question.questionId)),
        currentEvidenceId,
      ]);
      if (xpDelta !== 0) setEarnedXp(current => Math.max(0, current + xpDelta));
    }
    if (scenario === "downstream_failure" && !retryRecovered) {
      setPhase("unavailable");
      return;
    }
    setPhase("confirmed");
  }

  function retryNextAction() {
    setRetryRecovered(true);
    setPhase("confirmed");
  }

  function resetAnswer() {
    setAnswer("");
    setPhotoFiles([]);
    setPhotoError("");
    setPhase("drafting");
    setRetryRecovered(false);
    setConfirmationXpDelta(0);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function nextQuestion() {
    const attempted = new Set([...attemptedIds, question.questionId]);
    const nextUnseenOffset = Array.from(
      { length: questions.length },
      (_, offset) => offset + 1,
    ).find(offset => !attempted.has(questions[(questionIndex + offset) % questions.length].questionId));
    if (nextUnseenOffset === undefined) return;
    setQuestionIndex(current => (current + nextUnseenOffset) % questions.length);
    resetAnswer();
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  function selectPhotos(files: FileList | null) {
    const candidates = Array.from(files ?? []);
    const supported = candidates.filter(file => file.type === "image/jpeg" || file.type === "image/png");
    const withinSizeLimit = supported.filter(file => file.size <= MAX_PHOTO_SIZE);
    const errors: string[] = [];
    if (supported.length !== candidates.length) errors.push("仅支持 JPEG 或 PNG 图片");
    if (supported.some(file => file.size > MAX_PHOTO_SIZE)) errors.push("图片需小于 12 MiB");
    if (withinSizeLimit.length > MAX_PHOTO_COUNT) errors.push("最多上传 6 张图片");
    setPhotoFiles(withinSizeLimit.slice(0, MAX_PHOTO_COUNT));
    setPhotoError(errors.join("；"));
  }

  const roundCompleteOnMount = questions.every(item => initialProgress.attemptedIds.includes(item.questionId));
  if (roundCompleteOnMount) {
    const completionRealm = earnedXp > 0 ? "引气 · 一层" : "未入道";
    const completionEvidenceId = confirmedEvidenceIds[confirmedEvidenceIds.length - 1];

    return (
      <AppShell
        availableSections={{ diagnosis: false, history: false, route: false }}
        aside={
          <CultivationPanel
            checkpoint="本轮原题已完成"
            evidenceCount={confirmedEvidenceIds.length}
            evidenceId={completionEvidenceId}
            realm={completionRealm}
            status="ready"
            xp={earnedXp}
          />
        }
        cultivation={{ realm: completionRealm, status: "ready", xp: earnedXp }}
        profile={profile}
      >
        <section className="round-complete" aria-labelledby="round-complete-heading">
          <CheckCircle2 aria-hidden="true" size={30} />
          <span className="eyebrow">可信原题池</span>
          <h1 id="round-complete-heading">本轮可信未做原题已完成</h1>
          <p>本轮作答记录已保留。下一阶段可进入间隔复习与变式迁移，修行进度继续沿用已确认的有效证据。</p>
          <div className="completion-metrics" aria-label="本轮学习结果">
            <div><span>当前证据</span><strong>{confirmedEvidenceIds.length} 条有效证据</strong></div>
            <div><span>修行进度</span><strong>{earnedXp} XP</strong></div>
          </div>
          <Link className="primary-button" to="/setup">
            调整下一轮计划<ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>
      </AppShell>
    );
  }

  const aside = (
    <>
      <PersonalPath
        evidenceCount={confirmedEvidenceIds.length}
        phase={phase}
        profile={profile}
        question={question}
        scenario={scenario}
      />
      <CultivationPanel
        checkpoint={`${question.knowledge} · ${phase === "confirmed" ? "已留证" : "修习中"}`}
        evidenceCount={confirmedEvidenceIds.length}
        evidenceId={latestEvidenceId}
        realm={realm}
        status={cultivation.status}
        xp={cultivation.xp}
        xpDelta={cultivation.xpDelta}
      />
    </>
  );

  return (
    <AppShell
      availableSections={{
        diagnosis: phase !== "drafting",
        history: phase === "confirmed" || phase === "unavailable",
      }}
      aside={aside}
      cultivation={{
        realm,
        status: cultivation.status,
        xp: cultivation.xp,
      }}
      profile={profile}
    >
      <div className="workspace-toolbar">
        <div>
          <span className="eyebrow">今日第 {questionIndex + 1} 题</span>
          <strong>{poolLabel}</strong>
        </div>
        <label className="scenario-control">
          <span>演示场景</span>
          <select
            aria-label="演示场景"
            disabled={answerLocked}
            onChange={event => {
              setScenario(event.target.value as DemoScenario);
              resetAnswer();
            }}
            value={scenario}
          >
            <option value="incorrect">错因诊断</option>
            <option value="correct">正确作答</option>
            <option value="uncertain">图片不清</option>
            <option value="downstream_failure">确认后依赖故障</option>
          </select>
        </label>
      </div>
      <div className="scenario-note" role="note">
        <FlaskConical aria-hidden="true" size={15} />
        <span>现场演示分支使用预置样例；正式批改必须来自真实作答、课程证据与学习者确认。</span>
      </div>

      <div className="paper-layout">
        <EvidenceRail
          stage={stage}
          terminalLabel={scenario === "uncertain" ? "复核" : "确认"}
        />
        <div className="paper-column">
          <QuestionPaper
            attempted={attemptedIds.includes(question.questionId)}
            question={question}
          />

          <section
            className={`answer-section${answerLocked ? " is-locked" : ""}`}
            aria-labelledby="answer-heading"
          >
            <div className="section-heading-row">
              <div>
                <span className="section-index">作答</span>
                <h2 id="answer-heading">写下你的解题过程</h2>
              </div>
              <div className="mode-switch" aria-label="作答方式">
                <button
                  aria-pressed={answerMode === "text"}
                  className={answerMode === "text" ? "active" : ""}
                  disabled={answerLocked}
                  onClick={() => setAnswerMode("text")}
                  type="button"
                >
                  <TextCursorInput aria-hidden="true" size={16} />文字
                </button>
                <button
                  aria-pressed={answerMode === "photo"}
                  className={answerMode === "photo" ? "active" : ""}
                  disabled={answerLocked}
                  onClick={() => setAnswerMode("photo")}
                  type="button"
                >
                  <Camera aria-hidden="true" size={16} />拍照
                </button>
              </div>
            </div>

            {answerMode === "text" ? (
              <textarea
                aria-label="文字答案"
                disabled={answerLocked}
                onChange={event => setAnswer(event.target.value)}
                placeholder="列出关键步骤、计算过程和最终结论"
                rows={7}
                value={answer}
              />
            ) : (
              <>
                <label className={`photo-dropzone${answerLocked ? " is-disabled" : ""}`}>
                  <ImagePlus aria-hidden="true" size={24} />
                  <strong>{photoFiles.length ? `已选择 ${photoFiles.length} 张答案图片` : "选择答题照片"}</strong>
                  <span>JPEG 或 PNG · 最多 6 张 · 单张不超过 12 MiB</span>
                  <input
                    accept="image/jpeg,image/png"
                    aria-label="答案图片"
                    capture="environment"
                    disabled={answerLocked}
                    multiple
                    onChange={event => selectPhotos(event.currentTarget.files)}
                    ref={photoInputRef}
                    type="file"
                  />
                </label>
                {photoError ? <p className="photo-error" role="alert">{photoError}</p> : null}
                {photoFiles.length ? (
                  <ul className="selected-files" aria-label="已选答案图片">
                    {photoFiles.map(file => (
                      <li key={`${file.name}-${file.lastModified}`}>
                        <span>{file.name}</span>
                        <button
                          aria-label={`移除 ${file.name}`}
                          disabled={answerLocked}
                          onClick={() => setPhotoFiles(current => current.filter(item => item !== file))}
                          title="移除图片"
                          type="button"
                        >
                          <X aria-hidden="true" size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}

            {phase === "drafting" ? (
              <div className="submit-row">
                <span>提交只产生临时判断</span>
                <button
                  className="primary-button"
                  disabled={!hasDraft}
                  onClick={submitAnswer}
                  type="button"
                >
                  <Send aria-hidden="true" size={17} />提交批改
                </button>
              </div>
            ) : null}
          </section>

          {phase !== "drafting" ? (
            <section className="diagnosis-section" id="diagnosis" aria-live="polite">
              {scenario === "uncertain" ? (
                <>
                  <div className="diagnosis-title uncertain">
                    <AlertTriangle aria-hidden="true" size={21} />
                    <div>
                      <span>识别置信度 31%</span>
                      <h2 ref={diagnosisHeadingRef} tabIndex={-1}>{phase === "review" ? "复核中，暂不结算" : "暂时无法可靠批改"}</h2>
                    </div>
                  </div>
                  <p className="diagnosis-summary">关键公式与等号右侧无法辨认，本次尝试不形成有效证据。</p>
                  {phase === "review" ? (
                    <div className="receipt-block warning">
                      <div><Scale aria-hidden="true" size={19} /><strong>复核申请已记录</strong></div>
                      <p>该尝试已冻结，不计入掌握估计或修行 XP。人工确认前不会生成有效证据。</p>
                      <button className="secondary-button" onClick={resetAnswer} type="button">
                        <RefreshCw aria-hidden="true" size={17} />撤回复核并重新作答
                      </button>
                    </div>
                  ) : (
                    <div className="action-row">
                      <button className="secondary-button" onClick={resetAnswer} type="button">
                        <RefreshCw aria-hidden="true" size={17} />重新作答
                      </button>
                      <button className="text-button" onClick={requestReview} type="button">提出复核</button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={`diagnosis-title ${isCorrect ? "correct" : "incorrect"}`}>
                    {isCorrect ? <CheckCircle2 aria-hidden="true" size={22} /> : <XCircle aria-hidden="true" size={22} />}
                    <div>
                      <span>判断置信度 {isCorrect ? "94%" : "92%"}</span>
                      <h2 ref={diagnosisHeadingRef} tabIndex={-1}>{isCorrect ? "暂判正确" : "暂判有误"}</h2>
                    </div>
                  </div>
                  <div className="diagnosis-grid">
                    <div className="first-error">
                      <span>{isCorrect ? "关键依据" : "最早失分点"}</span>
                      <strong>{isCorrect ? question.diagnosis.correctEvidence : question.diagnosis.firstError}</strong>
                      <p>{isCorrect ? question.diagnosis.correctExplanation : question.diagnosis.errorExplanation}</p>
                    </div>
                    <ul className="rubric-list" aria-label="评分点证据">
                      {question.diagnosis.rubric.map((rubric, index) => {
                        const state = isCorrect || index === 0
                          ? "matched"
                          : index === 1
                            ? "missing"
                            : "partial";
                        return (
                          <li className={state} key={rubric}>
                            {state === "missing"
                              ? <XCircle aria-hidden="true" size={15} />
                              : state === "partial"
                                ? <AlertTriangle aria-hidden="true" size={15} />
                                : <CheckCircle2 aria-hidden="true" size={15} />}
                            {rubric}
                            <span>{state === "matched" ? "已覆盖" : state === "missing" ? "未覆盖" : "待补充"}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {phase === "provisional" ? (
                    <div className="confirmation-gate">
                      <p>确认前不会改变掌握状态或修行 XP</p>
                      <div className="action-row">
                        <button className="text-button" onClick={resetAnswer} type="button">修改答案</button>
                        <button className="primary-button" onClick={confirmAnswer} type="button">
                          <FileCheck2 aria-hidden="true" size={17} />确认批改并更新路线
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {phase === "unavailable" ? (
                    <div className="receipt-block warning" id="history">
                      <div><FileCheck2 aria-hidden="true" size={19} /><h2 ref={receiptHeadingRef} tabIndex={-1}>有效证据 {evidenceId} 已记录</h2></div>
                      <p>下一步暂时不可用。已确认的学习证据不会丢失，也不会重复结算。</p>
                      <button className="secondary-button" onClick={retryNextAction} type="button">
                        <RefreshCw aria-hidden="true" size={17} />重新生成下一步
                      </button>
                    </div>
                  ) : null}

                  {phase === "confirmed" ? (
                    <div className="receipt-block success" id="history">
                      <div><CheckCircle2 aria-hidden="true" size={19} /><h2 ref={receiptHeadingRef} tabIndex={-1}>有效证据 {evidenceId} 已记录</h2></div>
                      <p><b>路线已更新</b> · {isCorrect ? "该知识点掌握估计上调，进入间隔复习。" : `先完成“${question.correctionFocus}”，再做同类原题。`}</p>
                      <div className="action-row receipt-actions">
                        <button className="secondary-button" onClick={resetAnswer} type="button">
                          <RefreshCw aria-hidden="true" size={17} />重新练习本题
                        </button>
                        {unseenQuestionCount > 0 ? (
                          <button className="primary-button" onClick={nextQuestion} type="button">
                            下一道原题<ArrowRight aria-hidden="true" size={17} />
                          </button>
                        ) : null}
                      </div>
                      {unseenQuestionCount === 0 ? (
                        <div className="pool-complete" role="status">
                          <CheckCircle2 aria-hidden="true" size={18} />
                          <div>
                            <strong>本轮可信未做原题已完成</strong>
                            <span>下一阶段进入间隔复习与变式迁移。</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
