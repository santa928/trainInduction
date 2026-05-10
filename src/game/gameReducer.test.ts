import { describe, expect, it } from "vitest";

import { courses } from "../data/courses";
import { createGameState } from "./createGameState";
import { gameReducer } from "./gameReducer";

const course = courses[0];

describe("gameReducer", () => {
  it("places a piece into a gap and removes it from the tray", () => {
    const initial = createGameState(course);
    const pieceId = course.pieces[0].id;
    const gapId = course.gaps[0].id;

    const next = gameReducer(initial, { type: "placePiece", pieceId, gapId });

    expect(next.placements[gapId]).toBe(pieceId);
    expect(next.trayPieceIds).not.toContain(pieceId);
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
