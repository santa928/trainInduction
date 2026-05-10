import { beforeEach, describe, expect, it } from "vitest";

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
});
