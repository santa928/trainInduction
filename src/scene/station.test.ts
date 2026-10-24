import { Box3, Mesh, OrthographicCamera, Vector3 } from "three";
import { expect, it } from "vitest";
import { stationForStage } from "./models";
import { routeTiles, sampleRoute } from "../railway/model";
import { stages } from "../railway/stages";
import { Diorama } from "./Diorama";

it("keeps each station beside the track, including the curved approaches", () => {
  for (const stage of stages) {
    const station = stationForStage(stage);
    const bounds = new Box3().setFromObject(station);
    const total = routeTiles(stage).at(-1)!.end;
    for (let distance = 0; distance <= total; distance += 0.04) {
      const point = sampleRoute(stage, distance);
      expect(
        bounds.distanceToPoint(new Vector3(point.x, 0.13, point.z)),
        stage.id,
      ).toBeGreaterThan(0.22);
    }
    expect(bounds.min.x, stage.id).toBeGreaterThan(-0.825);
    expect(bounds.max.x, stage.id).toBeLessThan(5.825);
    expect(bounds.min.z, stage.id).toBeGreaterThan(-0.825);
    expect(bounds.max.z, stage.id).toBeLessThan(5.825);
    // Discard GPU-free geometry after checking the actual model bounds.
    station.traverse((object) => {
      if (object instanceof Mesh) object.geometry.dispose();
    });
  }
});

it("keeps station roofs, clocks and signs inside each supported camera view", () => {
  for (const stage of stages) {
    const station = stationForStage(stage);
    station.updateMatrixWorld(true);
    for (const [width, height] of [
      [390, 320],
      [390, 500],
      [906, 600],
    ]) {
      const camera = new OrthographicCamera();
      const adapter = Object.create(Diorama.prototype) as Diorama;
      Object.assign(adapter, {
        camera,
        options: {
          host: { clientWidth: width, clientHeight: height },
          stage,
          onProjection: () => {},
        },
        renderer: { setSize: () => {} },
        lastRun: null,
      });
      adapter.resize();
      let extentX = 0,
        extentY = 0;
      station.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const positions = object.geometry.getAttribute("position");
        for (let i = 0; i < positions.count; i++) {
          const point = new Vector3()
            .fromBufferAttribute(positions, i)
            .applyMatrix4(object.matrixWorld)
            .project(camera);
          extentX = Math.max(extentX, Math.abs(point.x));
          extentY = Math.max(extentY, Math.abs(point.y));
        }
      });
      expect(extentX, `${stage.id}/${width}x${height}`).toBeLessThan(0.99);
      expect(extentY, `${stage.id}/${width}x${height}`).toBeLessThan(0.99);
    }
    station.traverse((object) => {
      if (object instanceof Mesh) object.geometry.dispose();
    });
  }
});
