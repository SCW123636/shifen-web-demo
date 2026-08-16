import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";

import { SetupPage } from "./SetupPage";

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.useRealTimers();
});

it("collects the learner goal, foundation, time, and real course files", () => {
  render(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
  );

  expect(screen.getByLabelText("目标分数")).toBeVisible();
  expect(screen.getByLabelText("当前基础")).toBeVisible();
  expect(screen.getByLabelText("每天可用时间")).toBeVisible();
  expect(screen.getByLabelText("课程资料")).toHaveAttribute(
    "accept",
    ".txt,.md,.json,.png,.jpg,.jpeg,.webp",
  );
  expect(screen.getByRole("region", { name: "修行进度" })).toBeVisible();
  expect(screen.getByRole("status", { name: "常驻修行摘要" })).toBeVisible();
  expect(screen.getByRole("link", { name: "资料" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "练习" })).not.toHaveAttribute("aria-current");
  expect(screen.getByLabelText("考试日期")).toBeRequired();
  expect(screen.getByText(/上传文件只作为本机输入元数据/)).toBeVisible();
});

it("saves learner constraints and uploaded material metadata before starting", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
  );

  await user.clear(screen.getByLabelText("课程名称"));
  await user.type(screen.getByLabelText("课程名称"), "概率论");
  await user.clear(screen.getByLabelText("目标分数"));
  await user.type(screen.getByLabelText("目标分数"), "88");
  await user.selectOptions(screen.getByLabelText("当前基础"), "beginner");
  await user.clear(screen.getByLabelText("每天可用时间"));
  await user.type(screen.getByLabelText("每天可用时间"), "30");
  await user.upload(
    screen.getByLabelText("课程资料"),
    new File(["paper"], "paper.txt", { type: "text/plain" }),
  );
  await user.click(screen.getByRole("button", { name: "建立复习路径" }));

  expect(JSON.parse(window.sessionStorage.getItem("shifen-demo-profile") ?? "{}")).toMatchObject({
    courseName: "概率论",
    targetScore: 88,
    foundation: "刚开始系统复习",
    dailyMinutes: 30,
    materialCount: 1,
    materialSource: "uploaded",
  });
});
