import { beforeEach, expect, it } from "vitest";
import {
  loadJourney,
  saveJourney,
  completeJourney,
  PROGRESS_KEY,
} from "./progress";

beforeEach(() => localStorage.clear());
it("migrates legacy reach without inventing new clears or touching the old key", () => {
  const raw = JSON.stringify({
    clearedCourseIds: ["mori-3", "sora-1", "not-a-course"],
  });
  localStorage.setItem("train-induction-progress", raw);
  const progress = loadJourney();
  expect(progress.unlockedThrough).toBe(8);
  expect(progress.clearedStageIds).toEqual([]);
  saveJourney(progress);
  expect(localStorage.getItem("train-induction-progress")).toBe(raw);
  expect(loadJourney()).toEqual(progress);
});
it("roundtrips clear, unlock, train and sound and deduplicates repeated clear", () => {
  const progress = completeJourney(
    { ...loadJourney(), trainId: "niji", sound: false },
    "journey-1",
  );
  saveJourney(completeJourney(progress, "journey-1"));
  expect(loadJourney()).toMatchObject({
    clearedStageIds: ["journey-1"],
    unlockedThrough: 2,
    trainId: "niji",
    sound: false,
  });
});
it("validates damaged progress and bounds every stage identifier", () => {
  localStorage.setItem(
    PROGRESS_KEY,
    '{"version":2,"clearedStageIds":["journey-12","journey-99",null],"unlockedThrough":999,"trainId":"unknown"}',
  );
  expect(loadJourney()).toMatchObject({
    clearedStageIds: ["journey-12"],
    unlockedThrough: 12,
    trainId: "sora",
  });
  localStorage.setItem(PROGRESS_KEY, "{");
  expect(loadJourney().unlockedThrough).toBe(1);
  expect(completeJourney(loadJourney(), "journey-99").clearedStageIds).toEqual(
    [],
  );
});
it("remains playable when storage reads or writes throw", () => {
  const blocked = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
  };
  expect(loadJourney(blocked).unlockedThrough).toBe(1);
  expect(() => saveJourney(loadJourney(blocked), blocked)).not.toThrow();
});
