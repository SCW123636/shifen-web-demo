import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { StudyPage } from "./StudyPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <StudyPage />
    </MemoryRouter>,
  );
}

describe("StudyPage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("opens on an unseen trusted original with permanent cultivation", () => {
    renderPage();

    expect(screen.getByText("2024 秋季期末试卷原题")).toBeVisible();
    expect(screen.getByText(/求函数在闭区间上的最大值与最小值/)).toBeVisible();
    expect(screen.getByRole("region", { name: "修行进度" })).toBeVisible();
    expect(screen.getByRole("status", { name: "常驻修行摘要" })).toHaveTextContent("未入道");
    expect(screen.getByRole("status", { name: "常驻修行摘要" })).toHaveTextContent("0 XP");
    expect(screen.getByText("0 条有效证据")).toBeVisible();
    expect(screen.getByText("题面")).toBeVisible();
    expect(screen.getAllByText("作答")[0]).toBeVisible();
    expect(screen.getByText("确认")).toBeVisible();
  });

  it("moves to a different unseen original with its own tracking identity", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("文字答案"), "求导后比较驻点和端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));
    await user.click(screen.getByRole("button", { name: "下一道原题" }));

    expect(screen.getByText("2023 春季期末试卷原题")).toBeVisible();
    expect(screen.getByText("08")).toBeVisible();
    expect(screen.getByText("未做原题")).toBeVisible();
  });

  it("keeps provisional diagnosis non-effective until confirmation", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("文字答案"),
      "求导得到驻点 x=0 和 x=2，代入后最大值为 2，最小值为 -2。",
    );
    await user.click(screen.getByRole("button", { name: "提交批改" }));

    expect(await screen.findByText("暂判有误")).toBeVisible();
    expect(screen.getByText("遗漏了区间端点的函数值比较")).toBeVisible();
    expect(screen.getByText("确认前不会改变掌握状态或修行 XP")).toBeVisible();
    expect(screen.queryByText(/有效证据 ev_/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));

    expect(await screen.findByText(/有效证据 ev_/)).toBeVisible();
    expect(screen.getByText("路线已更新")).toBeVisible();
  });

  it("locks the submitted answer and demo branch until confirmation", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("文字答案"), "先求导，再比较端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));

    expect(screen.getByLabelText("文字答案")).toBeDisabled();
    expect(screen.getByRole("button", { name: "文字" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "拍照" })).toBeDisabled();
    expect(screen.getByLabelText("演示场景")).toBeDisabled();
  });

  it("does not offer confirmation for an uncertain judgement", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "uncertain");
    await user.type(screen.getByLabelText("文字答案"), "图片中的关键符号无法辨认");
    await user.click(screen.getByRole("button", { name: "提交批改" }));

    expect(await screen.findByText("暂时无法可靠批改")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "确认批改并更新路线" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新作答" })).toBeEnabled();
    expect(screen.getByRole("region", { name: "修行进度" })).toBeVisible();
    expect(screen.getByText("本次未形成正向成长证据")).toBeVisible();
    expect(screen.queryByText("确认后才会结算成长")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "学习证据阶段" })).getByText("复核"),
    ).toBeVisible();
  });

  it("keeps photo submission disabled until an answer image is selected", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "拍照" }));
    expect(screen.getByRole("button", { name: "提交批改" })).toBeDisabled();

    await user.upload(
      screen.getByLabelText("答案图片"),
      new File(["answer"], "answer.png", { type: "image/png" }),
    );

    expect(screen.getByText("answer.png")).toBeVisible();
    expect(screen.getByRole("button", { name: "提交批改" })).toBeEnabled();
  });

  it("records an uncertain review request and freezes cultivation", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "uncertain");
    await user.type(screen.getByLabelText("文字答案"), "图片中的关键符号无法辨认");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "提出复核" }));

    expect(screen.getByText("复核申请已记录")).toBeVisible();
    expect(screen.getByText("复核中，争议证据暂不计入修行")).toBeVisible();
    expect(screen.queryByText(/有效证据 ev_/)).not.toBeInTheDocument();
  });

  it("keeps the correct route projection consistent after confirmation", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "correct");
    await user.type(
      screen.getByLabelText("文字答案"),
      "求导，比较驻点和两个端点，最大值为 2，最小值为 -25。",
    );
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));

    expect(screen.getByText("进入间隔复习")).toBeVisible();
    expect(screen.queryByText("错误证据已确认")).not.toBeInTheDocument();
    expect(screen.getByText("+5 XP")).toBeVisible();
  });

  it("preserves evidence and rebuilds the next action after a dependency failure", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "downstream_failure");
    await user.type(screen.getByLabelText("文字答案"), "求导后比较驻点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));

    expect(screen.getByText(/下一步暂时不可用/)).toBeVisible();
    expect(screen.getByText(/有效证据 ev_demo_q-paper-2024-05 已记录/)).toBeVisible();
    expect(screen.queryByText("路线已更新")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "重新生成下一步" }));

    expect(screen.getByText("路线已更新")).toBeVisible();
    expect(screen.getByRole("button", { name: "下一道原题" })).toBeEnabled();
  });

  it("keeps confirmed XP and evidence count when moving to the next original", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "correct");
    await user.type(screen.getByLabelText("文字答案"), "比较驻点和两个端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));
    await user.click(screen.getByRole("button", { name: "下一道原题" }));

    expect(screen.getByRole("status", { name: "常驻修行摘要" })).toHaveTextContent("5 XP");
    expect(screen.getByText("1 条有效证据")).toBeVisible();
  });

  it("restores confirmed evidence and XP after the study page remounts", async () => {
    const user = userEvent.setup();
    const first = renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "correct");
    await user.type(screen.getByLabelText("文字答案"), "比较驻点和两个端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));
    expect(screen.getByRole("status", { name: "常驻修行摘要" })).toHaveTextContent("5 XP");

    first.unmount();
    renderPage();

    expect(screen.getByRole("status", { name: "常驻修行摘要" })).toHaveTextContent("5 XP");
    expect(screen.getByText("1 条有效证据")).toBeVisible();
    expect(screen.getByText("2023 春季期末试卷原题")).toBeVisible();
  });

  it("does not award XP twice when the same confirmed question is retried", async () => {
    const user = userEvent.setup();
    const first = renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "correct");
    await user.type(screen.getByLabelText("文字答案"), "比较驻点和两个端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));
    await user.click(screen.getByRole("button", { name: "下一道原题" }));
    await user.type(screen.getByLabelText("文字答案"), "继续求导并比较边界。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));
    expect(screen.getByRole("status", { name: "常驻修行摘要" })).toHaveTextContent("10 XP");

    first.unmount();
    renderPage();
    await user.selectOptions(screen.getByLabelText("演示场景"), "correct");
    await user.type(screen.getByLabelText("文字答案"), "再次比较驻点和两个端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));

    expect(screen.getByRole("status", { name: "常驻修行摘要" })).toHaveTextContent("10 XP");
    expect(screen.getByText("2 条有效证据")).toBeVisible();
  });

  it("moves focus to the diagnosis and receipt as the evidence stages advance", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("文字答案"), "求导后比较驻点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("heading", { name: "暂判有误" })));

    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("heading", { name: /有效证据 ev_demo_q-paper-2024-05 已记录/ })));
  });

  it("switches to the matching demo course pack when the learner selects probability", () => {
    window.sessionStorage.setItem(
      "shifen-demo-profile",
      JSON.stringify({
        courseName: "概率论",
        examDate: "2026-08-30",
        targetScore: 88,
        foundation: "刚开始系统复习",
        dailyMinutes: 30,
        materialCount: 2,
        materialSource: "uploaded",
      }),
    );

    renderPage();

    expect(screen.getByText("概率论期末试卷原题")).toBeVisible();
    expect(within(screen.getByTestId("question-paper")).getByText(/条件概率/)).toBeVisible();
    expect(screen.queryByText("2024 秋季期末试卷原题")).not.toBeInTheDocument();
  });

  it("uses the selected course rubric in diagnosis", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      "shifen-demo-profile",
      JSON.stringify({
        courseName: "概率论",
        examDate: "2026-08-30",
        targetScore: 88,
        foundation: "刚开始系统复习",
        dailyMinutes: 30,
        materialCount: 2,
        materialSource: "uploaded",
      }),
    );

    renderPage();
    await user.type(screen.getByLabelText("文字答案"), "P(A|B)=0.6");
    await user.click(screen.getByRole("button", { name: "提交批改" }));

    expect(screen.getByText("给出条件概率后，未验证事件独立性")).toBeVisible();
    expect(screen.queryByText("遗漏了区间端点的函数值比较")).not.toBeInTheDocument();
  });

  it("rejects an answer image larger than the declared limit", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "拍照" }));
    const oversized = new File(["answer"], "large.png", { type: "image/png" });
    Object.defineProperty(oversized, "size", { value: 13 * 1024 * 1024 });
    await user.upload(screen.getByLabelText("答案图片"), oversized);

    expect(screen.getByText("图片需小于 12 MiB")).toBeVisible();
    expect(screen.getByRole("button", { name: "提交批改" })).toBeDisabled();
  });

  it("limits one answer submission to six images", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "拍照" }));
    const files = Array.from(
      { length: 7 },
      (_, index) => new File([`answer-${index}`], `answer-${index}.png`, { type: "image/png" }),
    );
    await user.upload(screen.getByLabelText("答案图片"), files);

    expect(screen.getByText("最多上传 6 张图片")).toBeVisible();
    expect(screen.getAllByRole("button", { name: /移除 answer-/ })).toHaveLength(6);
  });

  it("keeps six valid images when an earlier selected image is oversized", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "拍照" }));
    const oversized = new File(["answer"], "large.png", { type: "image/png" });
    Object.defineProperty(oversized, "size", { value: 13 * 1024 * 1024 });
    const validFiles = Array.from(
      { length: 6 },
      (_, index) => new File([`answer-${index}`], `valid-${index}.png`, { type: "image/png" }),
    );
    await user.upload(screen.getByLabelText("答案图片"), [oversized, ...validFiles]);

    expect(screen.getByText("图片需小于 12 MiB")).toBeVisible();
    expect(screen.getAllByRole("button", { name: /移除 valid-/ })).toHaveLength(6);
    expect(screen.queryByRole("button", { name: "移除 large.png" })).not.toBeInTheDocument();
  });

  it("rejects answer files whose MIME type is not JPEG or PNG", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();

    await user.click(screen.getByRole("button", { name: "拍照" }));
    await user.upload(
      screen.getByLabelText("答案图片"),
      new File(["not-an-image"], "answer.txt", { type: "text/plain" }),
    );

    expect(screen.getByText("仅支持 JPEG 或 PNG 图片")).toBeVisible();
    expect(screen.queryByText("answer.txt")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交批改" })).toBeDisabled();
  });

  it("reports unavailable cultivation progress without a stale numeric value", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "downstream_failure");
    await user.type(screen.getByLabelText("文字答案"), "比较驻点和端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));

    expect(screen.getByRole("progressbar", { name: "修行进度" })).not.toHaveAttribute("aria-valuenow");
  });

  it("does not expose unavailable nav targets before their sections exist", () => {
    renderPage();

    expect(screen.queryByRole("link", { name: "错题" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "记录" })).not.toBeInTheDocument();
  });

  it("uses the saved learner constraints in the personalized route", () => {
    window.sessionStorage.setItem(
      "shifen-demo-profile",
      JSON.stringify({
        courseName: "概率论",
        examDate: "2026-08-30",
        targetScore: 88,
        foundation: "刚开始系统复习",
        dailyMinutes: 30,
        materialCount: 2,
        materialSource: "uploaded",
      }),
    );

    renderPage();

    expect(screen.getByText("概率论")).toBeVisible();
    expect(screen.getByText("88 分")).toBeVisible();
    expect(screen.getByText("刚开始系统复习")).toBeVisible();
    expect(screen.getByText("30 分钟 / 天")).toBeVisible();
    expect(screen.getByText(/本机资料元数据 2 份/)).toBeVisible();
  });

  it("blocks unsupported courses instead of silently using calculus questions", () => {
    window.sessionStorage.setItem(
      "shifen-demo-profile",
      JSON.stringify({
        courseName: "线性代数",
        examDate: "2026-08-30",
        targetScore: 85,
        foundation: "综合题薄弱",
        dailyMinutes: 40,
        materialCount: 3,
        materialSource: "uploaded",
      }),
    );

    renderPage();

    expect(screen.getByRole("heading", { name: "当前演示题包暂不支持线性代数" })).toBeVisible();
    expect(screen.getByRole("link", { name: "返回课程设置" })).toBeVisible();
    expect(screen.queryByText("2024 秋季期末试卷原题")).not.toBeInTheDocument();
  });

  it("labels prior-question evidence as recent rather than support for the new checkpoint", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "correct");
    await user.type(screen.getByLabelText("文字答案"), "比较驻点和两个端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));
    await user.click(screen.getByRole("button", { name: "下一道原题" }));

    const cultivation = screen.getByRole("region", { name: "修行进度" });
    expect(within(cultivation).getByText("最近有效证据")).toBeVisible();
    expect(within(cultivation).getByText("ev_demo_q-paper-2024-05")).toBeVisible();
    expect(within(cultivation).getByText("导数与最值判定 · 修习中")).toBeVisible();
    expect(within(cultivation).queryByText("支撑证据")).not.toBeInTheDocument();
  });

  it("stops at a truthful completion state when the unseen original pool is exhausted", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("演示场景"), "correct");
    await user.type(screen.getByLabelText("文字答案"), "比较驻点和两个端点。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));
    await user.click(screen.getByRole("button", { name: "下一道原题" }));
    await user.type(screen.getByLabelText("文字答案"), "求导并比较区间边界。");
    await user.click(screen.getByRole("button", { name: "提交批改" }));
    await user.click(screen.getByRole("button", { name: "确认批改并更新路线" }));

    expect(screen.getByText("本轮可信未做原题已完成")).toBeVisible();
    expect(screen.getByText("可信未做原题池：本轮已完成")).toBeVisible();
    expect(screen.queryByRole("button", { name: "下一道原题" })).not.toBeInTheDocument();
  });
});
