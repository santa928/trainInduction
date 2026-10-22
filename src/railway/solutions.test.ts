import { expect, it } from "vitest";
import {
  ends,
  railAt,
  routeTiles,
  vectors,
  type Direction,
  type Rail,
  type Stage,
} from "./model";
import { stages } from "./stages";

function reachesStation(stage: Stage, assignment: Rail[]): boolean {
  const board = new Map(
    stage.path.map((point, i) => [`${point.x},${point.z}`, railAt(stage, i)]),
  );
  stage.gaps.forEach((gap, i) => {
    const p = stage.path[gap.pathIndex];
    board.set(`${p.x},${p.z}`, assignment[i]);
  });
  let point = stage.path[0],
    entry = routeTiles(stage)[0].entry;
  const goal = stage.path.at(-1)!;
  const opposite: Record<Direction, Direction> = {
    N: "S",
    S: "N",
    E: "W",
    W: "E",
  };
  const seen = new Set<string>();
  while (true) {
    const key = `${point.x},${point.z}`,
      rail = board.get(key);
    if (!rail || seen.has(key) || !ends[rail].includes(entry)) return false;
    if (point.x === goal.x && point.z === goal.z) return true;
    seen.add(key);
    const exit = ends[rail].find((d) => d !== entry)!;
    point = { x: point.x + vectors[exit].x, z: point.z + vectors[exit].z };
    entry = opposite[exit];
  }
}

it("has no physically connected shortcut that the authored train would reject", () => {
  for (const stage of stages) {
    const required = stage.gaps.map((g) => railAt(stage, g.pathIndex));
    let solutions = 0;
    function check(assignment: Rail[], remaining: Rail[]) {
      if (assignment.length === stage.gaps.length) {
        if (reachesStation(stage, assignment)) {
          solutions++;
          expect(assignment, stage.id).toEqual(required);
        }
        return;
      }
      for (const rail of new Set(remaining)) {
        const index = remaining.indexOf(rail);
        check(
          [...assignment, rail],
          remaining.filter((_, i) => i !== index),
        );
      }
    }
    check(
      [],
      stage.pieces.map((p) => p.rail),
    );
    expect(solutions, stage.id).toBeGreaterThan(0);
  }
});
