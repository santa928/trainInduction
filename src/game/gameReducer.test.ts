import { describe, expect, it } from "vitest";

import { courses } from "../data/courses";
import { createGameState } from "./createGameState";
import { gameReducer } from "./gameReducer";
import { getUnlockedDifficulty } from "./selectors";

const course = courses[0];
const multiGapCourse = courses[1];

describe("gameReducer", () => {
  it("places a piece into a gap and removes it from the tray", () => {
    const initial = createGameState(course);
    const pieceId = course.pieces[0].id;
    const gapId = course.gaps[0].id;

    const next = gameReducer(initial, { type: "placePiece", pieceId, gapId });

    expect(next.placements[gapId]).toBe(pieceId);
    expect(next.trayPieceIds).not.toContain(pieceId);
  });

  it("does not return a piece to the tray when placing it into the same gap again", () => {
    const placed = gameReducer(createGameState(course), {
      type: "placePiece",
      pieceId: course.pieces[0].id,
      gapId: course.gaps[0].id,
    });

    const next = gameReducer(placed, {
      type: "placePiece",
      pieceId: course.pieces[0].id,
      gapId: course.gaps[0].id,
    });

    expect(next).toEqual(placed);
    expect(next.trayPieceIds).not.toContain(course.pieces[0].id);
  });

  it("moves a placed piece to another gap and clears the source gap", () => {
    const placed = gameReducer(createGameState(multiGapCourse), {
      type: "placePiece",
      pieceId: multiGapCourse.pieces[0].id,
      gapId: multiGapCourse.gaps[0].id,
    });

    const next = gameReducer(placed, {
      type: "placePiece",
      pieceId: multiGapCourse.pieces[0].id,
      gapId: multiGapCourse.gaps[1].id,
    });

    expect(next.placements[multiGapCourse.gaps[0].id]).toBeUndefined();
    expect(next.placements[multiGapCourse.gaps[1].id]).toBe(multiGapCourse.pieces[0].id);
    expect(next.trayPieceIds).not.toContain(multiGapCourse.pieces[0].id);
  });

  it("returns the destination piece to the tray when replacing it", () => {
    const withFirstPiece = gameReducer(createGameState(multiGapCourse), {
      type: "placePiece",
      pieceId: multiGapCourse.pieces[0].id,
      gapId: multiGapCourse.gaps[0].id,
    });
    const withSecondPiece = gameReducer(withFirstPiece, {
      type: "placePiece",
      pieceId: multiGapCourse.pieces[1].id,
      gapId: multiGapCourse.gaps[1].id,
    });

    const next = gameReducer(withSecondPiece, {
      type: "placePiece",
      pieceId: multiGapCourse.pieces[0].id,
      gapId: multiGapCourse.gaps[1].id,
    });

    expect(next.placements[multiGapCourse.gaps[0].id]).toBeUndefined();
    expect(next.placements[multiGapCourse.gaps[1].id]).toBe(multiGapCourse.pieces[0].id);
    expect(next.trayPieceIds).toContain(multiGapCourse.pieces[1].id);
    expect(next.trayPieceIds).not.toContain(multiGapCourse.pieces[0].id);
    expect(next.trayPieceIds.filter((pieceId) => pieceId === multiGapCourse.pieces[1].id)).toHaveLength(1);
  });

  it("ignores placement actions for unknown pieces or gaps", () => {
    const initial = createGameState(course);

    expect(gameReducer(initial, { type: "placePiece", pieceId: "missing-piece", gapId: course.gaps[0].id })).toBe(
      initial,
    );
    expect(gameReducer(initial, { type: "placePiece", pieceId: course.pieces[0].id, gapId: "missing-gap" })).toBe(
      initial,
    );
  });

  it("returns a placed piece to the tray", () => {
    const placed = gameReducer(createGameState(course), {
      type: "placePiece",
      pieceId: course.pieces[0].id,
      gapId: course.gaps[0].id,
    });

    const next = gameReducer(placed, { type: "returnPiece", gapId: course.gaps[0].id });

    expect(next.placements[course.gaps[0].id]).toBeUndefined();
    expect(next.trayPieceIds).toContain(course.pieces[0].id);
  });

  it("marks retry when train reaches an incorrect gap", () => {
    const initial = createGameState(course);
    const next = gameReducer(initial, {
      type: "advanceTrain",
      deltaDistance: course.gaps[0].arrivalDistance,
    });

    expect(next.status).toBe("retry");
  });

  it("marks cleared when all gaps are correct and the train reaches the goal", () => {
    const placed = gameReducer(createGameState(course), {
      type: "placePiece",
      pieceId: course.gaps[0].requiredPieceId,
      gapId: course.gaps[0].id,
    });

    const next = gameReducer(placed, { type: "advanceTrain", deltaDistance: 120 });

    expect(next.status).toBe("cleared");
  });

  it("processes every reached gap when advancing across multiple gaps", () => {
    const withFirstPiece = gameReducer(createGameState(multiGapCourse), {
      type: "placePiece",
      pieceId: multiGapCourse.gaps[0].requiredPieceId,
      gapId: multiGapCourse.gaps[0].id,
    });
    const withAllPieces = gameReducer(withFirstPiece, {
      type: "placePiece",
      pieceId: multiGapCourse.gaps[1].requiredPieceId,
      gapId: multiGapCourse.gaps[1].id,
    });

    const next = gameReducer(withAllPieces, { type: "advanceTrain", deltaDistance: 120 });

    expect(next.nextGapIndex).toBe(multiGapCourse.gaps.length);
    expect(next.status).toBe("cleared");
  });

  it("marks retry when a later reached gap is incorrect during a large advance", () => {
    const placed = gameReducer(createGameState(multiGapCourse), {
      type: "placePiece",
      pieceId: multiGapCourse.gaps[0].requiredPieceId,
      gapId: multiGapCourse.gaps[0].id,
    });

    const next = gameReducer(placed, { type: "advanceTrain", deltaDistance: 120 });

    expect(next.status).toBe("retry");
    expect(next.nextGapIndex).toBe(1);
  });

  it("keeps playing when the train reaches the goal but a gap remains unvisited", () => {
    const lateGapCourse = {
      ...course,
      gaps: [{ ...course.gaps[0], arrivalDistance: 120 }, ...course.gaps.slice(1)],
    };
    const placed = gameReducer(createGameState(lateGapCourse), {
      type: "placePiece",
      pieceId: lateGapCourse.gaps[0].requiredPieceId,
      gapId: lateGapCourse.gaps[0].id,
    });

    const next = gameReducer(placed, { type: "advanceTrain", deltaDistance: 100 });

    expect(next.status).toBe("playing");
  });
});

describe("getUnlockedDifficulty", () => {
  it("only unlocks the next difficulty after consecutive clears", () => {
    expect(getUnlockedDifficulty("sora", ["sora-3"])).toBe(1);
    expect(getUnlockedDifficulty("sora", ["sora-1", "sora-2"])).toBe(3);
  });
});
