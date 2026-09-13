import { expect, test, type Page } from "@playwright/test";

async function completeOnboarding(page: Page) {
  await page.goto("/onboarding");
  await page.getByLabel("每天大约抽多少支？").fill("15");
  await page.getByLabel("吸烟多少年？").fill("8");
  await page.getByLabel("起床后多久会抽第一支烟？").fill("30");
  await page.getByLabel("过去认真戒过几次？").fill("2");
  await page.getByRole("button", { name: "工作或情绪压力" }).click();
  await page.getByLabel("你最想戒烟的原因是什么？").fill("为了家人和健康");
  await page.getByLabel("当前状态").selectOption("reducing");
  await page.getByRole("button", { name: "保存并开始" }).click();
  await expect(page).toHaveURL(/\/home$/);
}

async function deleteTestUser(page: Page) {
  await page.request.delete("/api/profile");
}

test("新用户完成 onboarding 后进入首页", async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByRole("link", { name: "我现在想抽烟" })).toBeVisible();
  await deleteTestUser(page);
});

test("完成前置评分、干预、后置评分和未吸烟结果", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("link", { name: "我现在想抽烟" }).click();
  await page.getByLabel("烟瘾评分").fill("8");
  await page.getByRole("button", { name: "压力", exact: true }).click();
  await page.getByPlaceholder("例如：刚开完一个很不顺利的会议").fill("刚开完会，压力很大");
  await page.getByRole("button", { name: "开始 2 分钟支持" }).click();
  await expect(page.getByText(/连接刚刚出了点问题/)).toBeVisible();
  await page.getByRole("button", { name: "结束干预并评分" }).click();
  await page.getByLabel("干预后烟瘾评分").fill("4");
  await page.getByRole("button", { name: "我没有抽" }).click();
  await page.getByLabel("刚才什么最有帮助？").fill("呼吸和延迟决定");
  await page.getByRole("button", { name: "完成记录" }).click();
  await expect(page.getByRole("heading", { name: "这次记录完成了" })).toBeVisible();
  await deleteTestUser(page);
});

test("AI provider 故障时使用本地 fallback", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("link", { name: "我现在想抽烟" }).click();
  await page.getByLabel("烟瘾评分").fill("6");
  await page.getByRole("button", { name: "社交", exact: true }).click();
  await page.getByRole("button", { name: "开始 2 分钟支持" }).click();
  await expect(page.getByText(/连接刚刚出了点问题/)).toBeVisible();
  await expect(page.getByText(/谢谢，我最近不抽/)).toBeVisible();
  await deleteTestUser(page);
});
