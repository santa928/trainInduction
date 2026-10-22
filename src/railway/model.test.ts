import { describe, expect, it } from "vitest";
import { stages } from "./stages";
import {
  createRun,
  reduceRun,
  railAt,
  routeTiles,
  sampleRoute,
  solveStage,
  STOP_MARGIN,
} from "./model";

describe("authored railway", () => {
  it("contains twelve distinct connected puzzles with progressively more gaps", () => {
    expect(stages).toHaveLength(12);
    expect(new Set(stages.map((s) => JSON.stringify(s.path))).size).toBe(12);
    for (const stage of stages) {
      expect(new Set(stage.path.map((p) => `${p.x},${p.z}`)).size).toBe(
        stage.path.length,
      );
      for (let i = 1; i < stage.path.length; i++) {
        expect(
          Math.abs(stage.path[i].x - stage.path[i - 1].x) +
            Math.abs(stage.path[i].z - stage.path[i - 1].z),
        ).toBe(1);
      }
      expect(
        stage.gaps.every(
          (g) => g.pathIndex >= 2 && g.pathIndex < stage.path.length - 1,
        ),
      ).toBe(true);
      expect(solveStage(stage)).toHaveLength(stage.gaps.length);
    }
    expect(stages[0].gaps.length).toBe(1);
    expect(stages[11].gaps.length).toBeGreaterThanOrEqual(4);
  });

  it("clears every stage with actual connecting pieces regardless of piece ID", () => {
    for (const stage of stages) {
      let run = createRun(stage, 123);
      for (const [gapId, pieceId] of solveStage(stage))
        run = reduceRun(run, { type: "place", gapId, pieceId });
      run = reduceRun(run, { type: "tick", seconds: 200 });
      expect(run.status, stage.id).toBe("cleared");
      expect(run.distance).toBeCloseTo(routeTiles(stage).at(-1)!.end);
    }
  });

  it("stops before each missing or wrong rail even with a huge frame delta", () => {
    for (const stage of stages)
      for (const missingGap of stage.gaps) {
        let run = createRun(stage, 7);
        for (const [gapId, pieceId] of solveStage(stage))
          if (gapId !== missingGap.id)
            run = reduceRun(run, { type: "place", gapId, pieceId });
        const bad = stage.pieces.find(
          (p) =>
            p.rail !== railAt(stage, missingGap.pathIndex) &&
            !Object.values(run.placements).includes(p.id),
        );
        for (const wrong of [undefined, bad]) {
          const input = wrong
            ? reduceRun(run, {
                type: "place",
                gapId: missingGap.id,
                pieceId: wrong.id,
              })
            : run;
          const failed = reduceRun(input, { type: "tick", seconds: 200 });
          expect(failed.status).toBe("failed");
          expect(failed.failedGap).toBe(missingGap.id);
          expect(failed.distance + STOP_MARGIN).toBeLessThanOrEqual(
            routeTiles(stage)[missingGap.pathIndex].start + 0.000001,
          );
        }
      }
  });

  it("resets all work on retry, preserves tray positions, and ignores repeated result actions", () => {
    let run = createRun(stages[8], 13);
    const [gapId, pieceId] = solveStage(stages[8])[0];
    run = reduceRun(run, { type: "place", gapId, pieceId });
    run = reduceRun(run, { type: "tick", seconds: 200 });
    expect(run.status).toBe("failed");
    const retried = reduceRun(run, { type: "retry" });
    expect(retried.placements).toEqual({});
    expect(retried.distance).toBe(0);
    expect(retried.order).toEqual(run.order);
    expect(reduceRun(retried, { type: "retry" })).toBe(retried);
  });

  it("supports return, overwrite and moving without duplicating finite pieces", () => {
    const stage = stages[8];
    const [g1, g2] = stage.gaps;
    const [p1, p2] = stage.pieces;
    let run = createRun(stage, 1);
    run = reduceRun(run, { type: "place", gapId: g1.id, pieceId: p1.id });
    run = reduceRun(run, { type: "place", gapId: g2.id, pieceId: p2.id });
    run = reduceRun(run, { type: "place", gapId: g2.id, pieceId: p1.id });
    expect(run.placements).toEqual({ [g2.id]: p1.id });
    expect(new Set(Object.values(run.placements)).size).toBe(
      Object.values(run.placements).length,
    );
    expect(reduceRun(run, { type: "return", gapId: g2.id }).placements).toEqual(
      {},
    );
    expect(
      reduceRun(run, { type: "place", gapId: "unknown", pieceId: p1.id }),
    ).toBe(run);
    expect(
      reduceRun(run, { type: "place", gapId: g1.id, pieceId: "unknown" }),
    ).toBe(run);
  });

  it("locks rails once the train enters and rejects editing while paused", () => {
    const stage = stages[8];
    let run = createRun(stage, 2);
    for (const [gapId, pieceId] of solveStage(stage))
      run = reduceRun(run, { type: "place", gapId, pieceId });
    const first = stage.gaps[0];
    const distance =
      routeTiles(stage)[first.pathIndex].start - STOP_MARGIN + 0.05;
    run = reduceRun(run, { type: "tick", seconds: 3 + distance / stage.speed });
    expect(run.nextGap).toBeGreaterThan(0);
    expect(reduceRun(run, { type: "return", gapId: first.id })).toBe(run);
    const paused = reduceRun(run, { type: "pause" });
    expect(reduceRun(paused, { type: "tick", seconds: 200 })).toBe(paused);
    expect(reduceRun(paused, { type: "return", gapId: stage.gaps[1].id })).toBe(
      paused,
    );
    expect(reduceRun(paused, { type: "resume" }).paused).toBe(false);
  });

  it("has a three second preparation and ignores invalid deltas", () => {
    const run = createRun(stages[0], 1);
    const ready = reduceRun(run, { type: "tick", seconds: 2.9 });
    expect(ready.distance).toBe(0);
    expect(ready.status).toBe("ready");
    expect(
      reduceRun(ready, { type: "tick", seconds: 0.2 }).distance,
    ).toBeGreaterThan(0);
    for (const seconds of [-1, NaN, Infinity])
      expect(reduceRun(run, { type: "tick", seconds })).toBe(run);
  });

  it("shuffles only the tray, with different starting positions across seeds", () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        createRun(stages[8], seed).order.join(","),
      ),
    );
    expect(orders.size).toBeGreaterThan(5);
    const run = createRun(stages[8], 15);
    const [gapId, pieceId] = solveStage(stages[8])[0];
    expect(reduceRun(run, { type: "place", gapId, pieceId }).order).toEqual(
      run.order,
    );
  });

  it("samples continuous curves with unit tangents through every tile seam", () => {
    for (const stage of stages) {
      for (const tile of routeTiles(stage).slice(1)) {
        const before = sampleRoute(stage, tile.start - 0.00001);
        const after = sampleRoute(stage, tile.start + 0.00001);
        expect(Math.hypot(before.x - after.x, before.z - after.z)).toBeLessThan(
          0.00003,
        );
        expect(Math.hypot(after.dx, after.dz)).toBeCloseTo(1);
        expect(before.dx * after.dx + before.dz * after.dz).toBeGreaterThan(
          0.999,
        );
      }
    }
  });
});
