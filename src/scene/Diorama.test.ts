import { OrthographicCamera, Vector3 } from "three";
import { expect, it } from "vitest";
import { Diorama, type Projection } from "./Diorama";
import { stages } from "../railway/stages";

it("aligns DOM holes with the rendered sockets after changing camera pose on resize", () => {
  const camera = new OrthographicCamera();
  camera.position.set(2.5, 13, 10);
  camera.lookAt(2.5, 0, 2.5);
  camera.updateMatrixWorld();
  const host = { clientWidth: 390, clientHeight: 500 };
  let projection: Projection[] = [];
  // Real resize/projection and real camera; only the GPU allocation is omitted.
  const adapter = Object.create(Diorama.prototype) as Diorama;
  Object.assign(adapter, {
    camera,
    options: {
      host,
      stage: stages[11],
      preview: false,
      onProjection: (points: Projection[]) => {
        projection = points;
      },
    },
    renderer: { setSize: () => {} },
    lastRun: null,
  });
  for (const [width, height] of [
    [390, 323],
    [390, 320],
    [390, 500],
    [768, 800],
    [450, 374],
  ]) {
    host.clientWidth = width;
    host.clientHeight = height;
    adapter.resize();
    camera.updateMatrixWorld(); // The renderer performs this before drawing.
    const gap = stages[11].gaps[0],
      point = stages[11].path[gap.pathIndex];
    const rendered = new Vector3(point.x, 0.13, point.z).project(camera);
    expect(projection[0].x).toBeCloseTo(((rendered.x + 1) * width) / 2, 5);
    expect(projection[0].y).toBeCloseTo(((1 - rendered.y) * height) / 2, 5);
  }
});

it("keeps projected touch squares apart in portrait, tablet and desktop camera poses", () => {
  const camera = new OrthographicCamera();
  camera.position.set(2.5, 13, 10);
  camera.lookAt(2.5, 0, 2.5);
  camera.updateMatrixWorld();
  const host = { clientWidth: 390, clientHeight: 500 };
  let projection: Projection[] = [];
  const adapter = Object.create(Diorama.prototype) as Diorama;
  Object.assign(adapter, {
    camera,
    options: {
      host,
      stage: stages[11],
      preview: false,
      onProjection: (points: Projection[]) => {
        projection = points;
      },
    },
    renderer: { setSize: () => {} },
    lastRun: null,
  });
  for (const [width, height] of [
    [390, 323],
    [390, 320],
    [390, 500],
    [768, 800],
    [906, 600],
    [445, 374],
  ]) {
    host.clientWidth = width;
    host.clientHeight = height;
    adapter.resize();
    for (const [i, p] of projection.entries()) {
      expect(p.size).toBeGreaterThanOrEqual(44);
      for (const q of projection.slice(i + 1)) {
        expect(
          Math.abs(p.x - q.x) < (p.size + q.size) / 2 &&
            Math.abs(p.y - q.y) < (p.size + q.size) / 2,
          `${width}x${height}/${p.id}/${q.id}`,
        ).toBe(false);
      }
    }
  }
});
