import { expect, test } from "@playwright/test";

test("clear locks the passed rail, unlocks the next course, and survives reload", async ({ page }, testInfo) => {
  test.setTimeout(65000);
  await page.goto("/");
  await page.getByRole("button", { name: "そらでんしゃ", exact: true }).click();
  await page.getByRole("button", { name: /1ばんめのたび/ }).click();
  await page.getByRole("button", { name: "よこ", exact: true }).click();
  await page.getByRole("button", { name: "あな 1", exact: true }).click();
  const passedRail = page.getByRole("button", { name: "あな 1 よこ", exact: true });
  await expect(passedRail).toBeDisabled({ timeout: 22000 });
  await expect(page.getByRole("heading", { name: "えきについたよ！", exact: true })).toBeVisible({ timeout: 22000 });

  // Short landscape view reproduced the old result panel clipping.
  if (testInfo.project.name === "mobile") {
    await page.setViewportSize({ width: 844, height: 390 });
  }
  const bounds = await page.locator(".result-panel").evaluate((panel) => {
    const rect = panel.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, right: rect.right, width: innerWidth, height: innerHeight };
  });
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);
  expect(bounds.right).toBeLessThanOrEqual(bounds.width);
  await page.screenshot({ path: testInfo.outputPath("clear-result.png") });
  const lastAction = page.getByRole("dialog").getByRole("button", { name: "でんしゃをえらぶ", exact: true });
  await lastAction.scrollIntoViewIfNeeded();
  await expect(lastAction).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: testInfo.outputPath("clear-result-bottom.png") });
  await page.getByRole("dialog").getByRole("button", { name: "コースをえらぶ", exact: true }).click();
  await expect(page.getByRole("button", { name: /1ばんめのたび クリア！/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /2ばんめのたび/ })).toBeEnabled();
  await page.reload();
  await page.getByRole("button", { name: "そらでんしゃ", exact: true }).click();
  await expect(page.getByRole("button", { name: /2ばんめのたび/ })).toBeEnabled();
});

test("dense board aligns the train, keeps touch targets, and does not move remaining choices", async ({ page }, testInfo) => {
  // Saved-progress fixture only opens the dense course; it is not clear-flow evidence.
  await page.addInitScript(() => localStorage.setItem("train-induction-progress", JSON.stringify({
    clearedCourseIds: ["sora-1", "sora-2", "sora-3", "sora-4"],
  })));
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  const sizes = testInfo.project.name === "mobile"
    ? [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]
    : [{ width: 768, height: 1024 }];

  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto("/");
    await page.getByRole("button", { name: "そらでんしゃ", exact: true }).click();
    await page.getByRole("button", { name: /5ばんめのたび/ }).click();

    const layout = await page.locator(".game-screen").evaluate((screen) => {
      const selectors = [".game-header", ".track-board", ".piece-tray"];
      return selectors.map((selector) => {
        const box = screen.querySelector(selector)!.getBoundingClientRect();
        return { selector, x: box.x, y: box.y, right: box.right, bottom: box.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight };
      });
    });
    for (const area of layout) {
      expect(area.x, area.selector).toBeGreaterThanOrEqual(0);
      expect(area.y, area.selector).toBeGreaterThanOrEqual(0);
      expect(area.right, area.selector).toBeLessThanOrEqual(area.viewportWidth);
      expect(area.bottom, area.selector).toBeLessThanOrEqual(area.viewportHeight);
    }

    const geometry = await page.locator(".track-surface").evaluate((surface) => {
      const train = surface.querySelector(".train-token")!.getBoundingClientRect();
      const surfaceBox = surface.getBoundingClientRect();
      const boardBox = surface.parentElement!.getBoundingClientRect();
      const start = [...surface.querySelectorAll<HTMLElement>(".track-cell")].find((cell) =>
        getComputedStyle(cell).gridColumnStart === "1" && getComputedStyle(cell).gridRowStart === "6",
      )!.getBoundingClientRect();
      const gaps = [...surface.querySelectorAll(".gap-slot")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      });
      return {
        dx: train.x + train.width / 2 - (start.x + start.width / 2),
        dy: train.y + train.height / 2 - (start.y + start.height / 2),
        surfaceRatio: surfaceBox.width / surfaceBox.height,
        surfaceBottom: surfaceBox.bottom, boardBottom: boardBox.bottom,
        trainBottom: train.bottom, gaps,
      };
    });
    expect(Math.abs(geometry.dx)).toBeLessThan(1);
    expect(Math.abs(geometry.dy)).toBeLessThan(1);
    expect(geometry.surfaceRatio).toBeCloseTo(1, 2);
    expect(geometry.surfaceBottom).toBeLessThan(geometry.boardBottom);
    expect(geometry.trainBottom).toBeLessThan(geometry.surfaceBottom);
    for (const [index, gap] of geometry.gaps.entries()) {
      expect(gap.width).toBeGreaterThanOrEqual(44);
      expect(gap.height).toBeGreaterThanOrEqual(44);
      for (const other of geometry.gaps.slice(index + 1)) {
        expect(gap.x < other.right && gap.right > other.x && gap.y < other.bottom && gap.bottom > other.y).toBe(false);
      }
    }
    const remaining = page.getByLabel("レールピース").getByRole("button", { name: "よこ", exact: true });
    const before = await remaining.boundingBox();
    for (const [index, label] of ["みぎした", "ひだりうえ", "みぎうえ"].entries()) {
      await page.getByLabel("レールピース").getByRole("button", { name: label, exact: true }).first().click();
      await page.getByRole("button", { name: `あな ${index + 1}`, exact: true }).click();
    }
    const after = await remaining.boundingBox();
    expect(after?.x).toBe(before?.x);
    expect(after?.y).toBe(before?.y);
    await page.screenshot({ path: testInfo.outputPath(`dense-${size.width}x${size.height}.png`), fullPage: true });
  }
});
