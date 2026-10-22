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
