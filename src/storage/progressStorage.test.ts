import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadProgress, saveProgress } from "./progressStorage";

describe("progressStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty progress when storage is empty", () => {
    expect(loadProgress()).toEqual({ clearedCourseIds: [] });
  });

  it("saves and loads cleared course ids", () => {
    saveProgress({ clearedCourseIds: ["sora-1"] });
    expect(loadProgress()).toEqual({ clearedCourseIds: ["sora-1"] });
  });

  it("falls back to empty progress when stored JSON is invalid", () => {
    localStorage.setItem("train-induction-progress", "{bad json");
    expect(loadProgress()).toEqual({ clearedCourseIds: [] });
  });

  it("does not reuse mutated fallback progress", () => {
    const progress = loadProgress();
    (progress.clearedCourseIds as string[]).push("mutated-course");

    expect(loadProgress()).toEqual({ clearedCourseIds: [] });
  });

  it("falls back to empty progress when cleared course ids is not an array", () => {
    localStorage.setItem("train-induction-progress", JSON.stringify({ clearedCourseIds: "sora-1" }));

    expect(loadProgress()).toEqual({ clearedCourseIds: [] });
  });

  it("loads only string course ids from mixed stored values", () => {
    localStorage.setItem(
      "train-induction-progress",
      JSON.stringify({ clearedCourseIds: ["sora-1", 1, null, "mori-2"] }),
    );

    expect(loadProgress()).toEqual({ clearedCourseIds: ["sora-1", "mori-2"] });
  });

  it("does not throw when localStorage setItem fails", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() => saveProgress({ clearedCourseIds: ["sora-1"] })).not.toThrow();

    setItemSpy.mockRestore();
  });
});
