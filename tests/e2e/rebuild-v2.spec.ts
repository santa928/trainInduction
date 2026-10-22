import { expect, test, type Page } from "@playwright/test";
import { stages } from "../../src/railway/stages";
import { railAt, routeTiles, STOP_MARGIN } from "../../src/railway/model";

async function openStage(page: Page, number: number, unlock = false) {
  if (unlock)
    await page.addInitScript(() =>
      localStorage.setItem(
        "train-induction-progress",
        JSON.stringify({ clearedCourseIds: ["sora-5"] }),
      ),
    );
  await page.goto("/");
  await page.getByRole("button", { name: "あそぶ", exact: true }).tap();
  await page
    .getByRole("button", { name: new RegExp(`^ステージ ${number} `) })
    .tap();
  await expect(page.locator(".rail-choice").first()).toBeEnabled();
}
async function fillStage(page: Page, number: number) {
  const stage = stages[number - 1];
  for (const [index, gap] of stage.gaps.entries()) {
    await page
      .locator(`.rail-choice[data-rail="${railAt(stage, gap.pathIndex)}"]`)
      .first()
      .tap();
    await page
      .getByRole("button", { name: `あな ${index + 1}`, exact: true })
      .tap();
  }
}

for (const stage of stages)
  test(`real-time clear ${stage.number}: ${stage.title}`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== "chromium-touch",
      "All-stage real-time motion is measured on Chromium; WebKit has separate interaction checks.",
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openStage(page, stage.number, true);
    await fillStage(page, stage.number);
    await expect(
      page.getByRole("heading", { name: "えきに ついたよ！" }),
    ).toBeVisible({ timeout: 65000 });
    expect(errors).toEqual([]);
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("train-induction-progress-v2")!),
    );
    expect(saved.clearedStageIds).toContain(stage.id);
    await page.screenshot({
      path: info.outputPath(`clear-${stage.number}.png`),
    });
  });

test("wrong rail fails before entry, retry resets all work, and taps cannot edit behind result", async ({
  page,
}, info) => {
  await openStage(page, 9, true);
  const stage = stages[8],
    gap = stage.gaps[0];
  const wrong = stage.pieces.find(
    (p) => p.rail !== railAt(stage, gap.pathIndex),
  )!;
  await page.locator(`.rail-choice[data-piece="${wrong.id}"]`).tap();
  await page.getByRole("button", { name: "あな 1", exact: true }).tap();
  await expect(
    page.getByRole("heading", { name: "あっ、レールが！" }),
  ).toBeVisible({ timeout: 20000 });
  const distance = Number(
    await page.locator(".railway-game").getAttribute("data-distance"),
  );
  expect(distance + STOP_MARGIN).toBeLessThanOrEqual(
    routeTiles(stage)[gap.pathIndex].start + 0.00001,
  );
  const order = await page
    .locator(".tray-pieces")
    .evaluate((e) =>
      [...e.children].map((c) => c.getAttribute("data-piece") ?? "placed"),
    );
  await page.screenshot({ path: info.outputPath("failure.png") });
  await page.getByRole("button", { name: "もういちど", exact: true }).tap();
  await expect(page.locator(".rail-gap[data-filled=true]")).toHaveCount(0);
  await expect(page.locator(".railway-game")).toHaveAttribute(
    "data-distance",
    "0.00000",
  );
  const resetOrder = await page
    .locator(".rail-choice")
    .evaluateAll((es) => es.map((e) => e.getAttribute("data-piece")));
  expect(order.filter((p) => p !== "placed")).toEqual(
    resetOrder.filter((p) => p !== wrong.id),
  );
});

test("missing rail fails, rapid select is harmless, and progress survives reload", async ({
  page,
}) => {
  await openStage(page, 1);
  const choice = page.locator('.rail-choice[data-rail="EW"]');
  for (let i = 0; i < 4; i++) await choice.tap();
  await expect(choice).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("heading", { name: "あっ、レールが！" }),
  ).toBeVisible({ timeout: 23000 });
  await page.getByRole("button", { name: "もういちど", exact: true }).tap();
  await fillStage(page, 1);
  await expect(
    page.getByRole("heading", { name: "えきに ついたよ！" }),
  ).toBeVisible({ timeout: 40000 });
  await page.reload();
  await page.getByRole("button", { name: "あそぶ", exact: true }).tap();
  await expect(
    page.getByRole("button", { name: /^ステージ 2 / }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /^ステージ 1 .*クリア/ }),
  ).toBeVisible();
});

test("return, overwrite, resize and background pause retain state and large touch targets", async ({
  page,
}, info) => {
  await openStage(page, 12, true);
  await page.getByRole("button", { name: "ひとやすみ" }).tap();
  const frozen = await page
    .locator(".railway-game")
    .getAttribute("data-distance");
  await page.waitForTimeout(500);
  expect(
    await page.locator(".railway-game").getAttribute("data-distance"),
  ).toBe(frozen);
  for (const size of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(size);
    const boxes = await page.locator(".rail-gap").evaluateAll((es) =>
      es.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }),
    );
    for (const [i, box] of boxes.entries()) {
      expect(box.w).toBeGreaterThanOrEqual(44);
      expect(box.h).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w).toBeLessThanOrEqual(size.width);
      expect(box.y + box.h).toBeLessThanOrEqual(size.height);
      for (const other of boxes.slice(i + 1))
        expect(
          box.x < other.x + other.w &&
            box.x + box.w > other.x &&
            box.y < other.y + other.h &&
            box.y + box.h > other.y,
        ).toBe(false);
    }
    const tray = await page.locator(".rail-tray").boundingBox();
    expect(tray!.y + tray!.height).toBeLessThanOrEqual(size.height);
    await page.screenshot({
      path: info.outputPath(`paused-${size.width}x${size.height}.png`),
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "つづける", exact: false }).tap();
  const first = page.locator(".rail-choice").first();
  const id = await first.getAttribute("data-piece");
  await first.tap();
  await page.getByRole("button", { name: "あな 1", exact: true }).tap();
  await page
    .getByRole("button", { name: "あな 1 おいたレール", exact: true })
    .tap();
  await expect(page.locator(`.rail-choice[data-piece="${id}"]`)).toBeVisible();
  await page.locator(`.rail-choice[data-piece="${id}"]`).tap();
  await page.getByRole("button", { name: "あな 1", exact: true }).tap();
  await page.locator(".rail-choice").first().tap();
  await page
    .getByRole("button", { name: "あな 1 おいたレール", exact: true })
    .tap();
  await expect(page.locator(`.rail-choice[data-piece="${id}"]`)).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByRole("heading", { name: "ひとやすみ" })).toBeVisible();
});

test("touch drag and cancellation preserve a finite inventory", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Real multi-point touch injection uses Chromium's touch protocol.",
  );
  await openStage(page, 1);
  const piece = page.locator('.rail-choice[data-rail="EW"]');
  const from = (await piece.boundingBox())!,
    to = (await page.locator(".rail-gap").boundingBox())!;
  const client = await page.context().newCDPSession(page);
  const x = from.x + from.width / 2,
    y = from.y + from.height / 2;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 15, y: y - 15 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(piece).toBeVisible();
  await expect(page.locator(".rail-gap[data-filled=true]")).toHaveCount(0);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 6; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: x + ((to.x + to.width / 2 - x) * i) / 6,
          y: y + ((to.y + to.height / 2 - y) * i) / 6,
        },
      ],
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".rail-gap[data-filled=true]")).toHaveCount(1);
  await expect(page.locator(".rail-placeholder")).toHaveCount(1);
});

test("WebGL context loss pauses and restoration requires deliberate resume", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "WebGL context recovery is tested on the available Chromium GPU stack.",
  );
  await openStage(page, 1);
  await page.evaluate(() => {
    const canvas = document.querySelector("canvas")!;
    const gl = canvas.getContext("webgl2")!;
    const extension = gl.getExtension("WEBGL_lose_context")!;
    extension.loseContext();
    setTimeout(() => extension.restoreContext(), 700);
  });
  await expect(page.locator(".railway-game")).toHaveAttribute(
    "data-paused",
    "true",
  );
  await expect(page.getByRole("heading", { name: "ひとやすみ" })).toBeVisible();
  await page.getByRole("button", { name: "つづける", exact: false }).tap();
  await expect(page.locator(".railway-game")).toHaveAttribute(
    "data-paused",
    "false",
  );
});
