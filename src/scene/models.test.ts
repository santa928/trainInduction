import { Box3 } from "three";
import { expect, it } from "vitest";
import { STOP_MARGIN } from "../railway/model";
import { trains } from "../railway/stages";
import { trainModel } from "./models";

it("keeps the visible locomotive nose behind the simulation's stopping margin", () => {
  for (const train of trains) {
    const model = trainModel(train);
    const bounds = new Box3().setFromObject(model.group);
    expect(bounds.max.x).toBeLessThanOrEqual(STOP_MARGIN);
  }
});

it("keeps the entire turned locomotive outside every upcoming gap entrance", async () => {
  const { sampleRoute, routeTiles } = await import("../railway/model");
  const { stages } = await import("../railway/stages");
  for (const stage of stages)
    for (const gap of stage.gaps) {
      const pose = sampleRoute(
        stage,
        routeTiles(stage)[gap.pathIndex].start - STOP_MARGIN,
      );
      const model = trainModel(trains[0]);
      model.group.position.set(pose.x, 0, pose.z);
      model.group.rotation.y = Math.atan2(-pose.dz, pose.dx);
      const bounds = new Box3().setFromObject(model.group);
      const point = stage.path[gap.pathIndex],
        previous = stage.path[gap.pathIndex - 1];
      const nx = point.x - previous.x,
        nz = point.z - previous.z;
      const furthest =
        nx > 0
          ? bounds.max.x
          : nx < 0
            ? -bounds.min.x
            : nz > 0
              ? bounds.max.z
              : -bounds.min.z;
      const plane =
        ((point.x + previous.x) / 2) * nx + ((point.z + previous.z) / 2) * nz;
      expect(furthest, `${stage.id}/${gap.id}`).toBeLessThanOrEqual(plane);
    }
});
