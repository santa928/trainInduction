import { expect, test } from "@playwright/test";

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const verticalGapBetween = (upper: Box, lower: Box): number => lower.y - (upper.y + upper.height);

const intersects = (first: Box, second: Box): boolean =>
  first.x < second.x + second.width &&
  first.x + first.width > second.x &&
  first.y < second.y + second.height &&
  first.y + first.height > second.y;

test("player can open first train and first course", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /そらでんしゃ/ }).click();
  await page.getByRole("button", { name: /1ばんめのたび/ }).click();

  await expect(page.getByRole("heading", { name: /1ばんめのたび/ })).toBeVisible();
  await expect(page.getByLabel("レールピース")).toBeVisible();
  await expect(page.getByLabel("せんろ")).toBeVisible();

  const headerBox = await page.locator(".game-header").boundingBox();
  const boardBox = await page.getByLabel("せんろ").boundingBox();
  const trayBox = await page.getByLabel("レールピース").boundingBox();

  expect(headerBox, "header should have layout bounds").not.toBeNull();
  expect(boardBox, "board should have layout bounds").not.toBeNull();
  expect(trayBox, "tray should have layout bounds").not.toBeNull();

  expect(verticalGapBetween(headerBox!, boardBox!), "header and board should not overlap").toBeGreaterThanOrEqual(0);
  expect(verticalGapBetween(boardBox!, trayBox!), "board and tray should not overlap").toBeGreaterThanOrEqual(0);

  const gapBoxes = await page.getByRole("button", { name: /^あな/ }).evaluateAll((slots) =>
    slots.map((slot) => {
      const rect = slot.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );

  for (let index = 0; index < gapBoxes.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < gapBoxes.length; nextIndex += 1) {
      expect(
        intersects(gapBoxes[index], gapBoxes[nextIndex]),
        `gap slot ${index + 1} should not intersect gap slot ${nextIndex + 1}`,
      ).toBe(false);
    }
  }
});
