import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  ends,
  routeTiles,
  sampleRail,
  sampleRoute,
  type Rail,
  type Stage,
} from "../railway/model";
import type { Train } from "../railway/stages";

const materials = new Map<string, THREE.MeshStandardMaterial>();
export function material(color: string, roughness = 0.82) {
  const key = `${color}:${roughness}`;
  let result = materials.get(key);
  if (!result) {
    result = new THREE.MeshStandardMaterial({ color, roughness });
    materials.set(key, result);
  }
  return result;
}
export function box(
  w: number,
  h: number,
  d: number,
  color: string,
  radius = 0.06,
) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)),
    material(color),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function cylinder(
  radius: number,
  height: number,
  color: string,
  segments = 16,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments),
    material(color),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
export function railModel(rail: Rail) {
  const group = new THREE.Group();
  const base = box(0.98, 0.1, 0.98, "#efd6a1", 0.06);
  base.position.y = 0.055;
  group.add(base);
  const [entry, exit] = ends[rail];
  const sleeperGeometry = new RoundedBoxGeometry(0.6, 0.065, 0.105, 2, 0.022);
  const sleepers = new THREE.InstancedMesh(
    sleeperGeometry,
    material("#ae8054"),
    6,
  );
  sleepers.castShadow = true;
  sleepers.receiveShadow = true;
  const transform = new THREE.Object3D();
  for (let i = 0; i < 6; i++) {
    const p = sampleRail(entry, exit, (i + 0.25) / 5.5);
    transform.position.set(p.x, 0.125, p.z);
    transform.rotation.y = Math.atan2(p.dx, p.dz);
    transform.updateMatrix();
    sleepers.setMatrixAt(i, transform.matrix);
  }
  group.add(sleepers);
  for (const offset of [-0.18, 0.18]) {
    const points = Array.from({ length: 25 }, (_, i) => {
      const p = sampleRail(entry, exit, i / 24);
      return new THREE.Vector3(p.x + p.dz * offset, 0.18, p.z - p.dx * offset);
    });
    const geometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      28,
      0.026,
      5,
      false,
    );
    const railMesh = new THREE.Mesh(geometry, material("#797968", 0.4));
    railMesh.castShadow = true;
    group.add(railMesh);
  }
  return group;
}

export function trainModel(train: Train, wagon = false) {
  const group = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const chassis = box(0.78, 0.105, 0.47, train.dark, 0.035);
  chassis.position.y = 0.27;
  group.add(chassis);
  for (const x of [-0.24, 0.24])
    for (const z of [-0.25, 0.25]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.19, z);
      const tire = cylinder(0.112, 0.065, "#40524b");
      tire.rotation.x = Math.PI / 2;
      wheel.add(tire);
      const hub = cylinder(0.056, 0.071, "#f9df99");
      hub.rotation.x = Math.PI / 2;
      wheel.add(hub);
      const spoke = box(0.014, 0.12, 0.075, "#8a6a4b", 0.005);
      wheel.add(spoke);
      wheels.push(wheel);
      group.add(wheel);
    }
  const bumper = box(0.08, 0.08, 0.44, "#ca7563", 0.025);
  bumper.position.set(0.4, 0.27, 0);
  group.add(bumper);
  if (wagon) {
    const body = box(0.66, 0.35, 0.43, "#f7dfad", 0.07);
    body.position.y = 0.49;
    group.add(body);
    const roof = box(0.76, 0.085, 0.54, train.color, 0.05);
    roof.position.y = 0.72;
    group.add(roof);
    for (const z of [-0.221, 0.221])
      for (const x of [-0.17, 0.17]) {
        const window = box(0.2, 0.18, 0.014, "#8cbbbd", 0.025);
        window.position.set(x, 0.52, z);
        group.add(window);
      }
  } else {
    const cabin = box(0.36, 0.42, 0.44, train.color, 0.05);
    cabin.position.set(-0.17, 0.5, 0);
    group.add(cabin);
    const roof = box(0.48, 0.095, 0.56, train.dark, 0.06);
    roof.position.set(-0.17, 0.76, 0);
    group.add(roof);
    for (const z of [-0.226, 0.226]) {
      const rim = box(0.235, 0.235, 0.015, "#fff2d5", 0.04);
      rim.position.set(-0.17, 0.56, z);
      group.add(rim);
      const glass = box(0.17, 0.17, 0.02, "#91c8ce", 0.03);
      glass.position.set(-0.17, 0.57, z * 1.025);
      group.add(glass);
    }
    const boiler = cylinder(0.19, 0.43, train.color, 24);
    boiler.rotation.z = Math.PI / 2;
    boiler.position.set(0.12, 0.45, 0);
    group.add(boiler);
    const front = cylinder(0.14, 0.03, train.dark);
    front.rotation.z = Math.PI / 2;
    front.position.set(0.35, 0.45, 0);
    group.add(front);
    const lamp = cylinder(0.06, 0.045, "#ffe5a0");
    lamp.rotation.z = Math.PI / 2;
    lamp.position.set(0.375, 0.49, 0);
    group.add(lamp);
    const chimney = cylinder(0.065, 0.25, train.dark);
    chimney.position.set(0.18, 0.72, 0);
    group.add(chimney);
    const lip = cylinder(0.09, 0.07, train.dark);
    lip.position.set(0.18, 0.86, 0);
    group.add(lip);
    const stripe = box(0.34, 0.045, 0.455, "#f9df99", 0.01);
    stripe.position.set(-0.17, 0.36, 0);
    group.add(stripe);
  }
  return { group, wheels };
}

export function treeModel(color: string, size = 1) {
  const tree = new THREE.Group();
  const trunk = cylinder(0.065, 0.42, "#b08b64", 8);
  trunk.position.y = 0.21;
  tree.add(trunk);
  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.29, 2),
    material(color),
  );
  crown.position.y = 0.58;
  crown.scale.set(0.9, 1.25, 0.9);
  crown.castShadow = true;
  tree.add(crown);
  tree.scale.setScalar(size);
  return tree;
}

export function stationModel() {
  const station = new THREE.Group();
  const platform = box(1.8, 0.13, 0.78, "#d9c4a2", 0.05);
  platform.position.y = 0.08;
  station.add(platform);
  const safety = box(1.6, 0.015, 0.055, "#f4cf66", 0.008);
  safety.position.set(0, 0.153, 0.33);
  station.add(safety);
  const wall = box(0.8, 0.5, 0.4, "#fff0cd", 0.035);
  wall.position.set(-0.22, 0.37, -0.16);
  station.add(wall);
  for (const side of [-1, 1]) {
    const roof = box(1.1, 0.07, 0.35, "#c77c65", 0.025);
    roof.rotation.x = side * 0.55;
    roof.position.set(-0.22, 0.72, -0.16 + side * 0.14);
    station.add(roof);
  }
  const ridge = box(1.13, 0.06, 0.07, "#b06d58", 0.025);
  ridge.position.set(-0.22, 0.85, -0.16);
  station.add(ridge);
  for (const x of [-0.49, 0.05]) {
    const window = box(0.16, 0.2, 0.02, "#88b9bc", 0.025);
    window.position.set(x, 0.42, 0.06);
    station.add(window);
  }
  const door = box(0.18, 0.34, 0.025, "#a18865", 0.02);
  door.position.set(-0.22, 0.32, 0.055);
  station.add(door);
  const canopy = box(1.45, 0.075, 0.55, "#618f88", 0.035);
  canopy.position.set(-0.15, 0.61, 0.05);
  station.add(canopy);
  for (const x of [-0.74, 0.44]) {
    const post = box(0.045, 0.45, 0.045, "#52786d", 0.012);
    post.position.set(x, 0.37, 0.25);
    station.add(post);
  }
  const bench = box(0.34, 0.07, 0.12, "#a57f53", 0.025);
  bench.position.set(-0.56, 0.24, 0.18);
  station.add(bench);
  const back = box(0.34, 0.2, 0.035, "#a57f53", 0.015);
  back.position.set(-0.56, 0.31, 0.13);
  station.add(back);

  // Tilt the train sign and clock toward the overhead camera; reading is optional.
  const sign = new THREE.Group();
  sign.add(box(0.62, 0.3, 0.04, "#fff9e9", 0.035));
  const body = box(0.36, 0.115, 0.025, "#4daec5", 0.02);
  body.position.set(0.02, -0.025, 0.033);
  sign.add(body);
  const cabin = box(0.14, 0.18, 0.025, "#237a96", 0.015);
  cabin.position.set(-0.12, 0.02, 0.035);
  sign.add(cabin);
  const glass = box(0.07, 0.075, 0.025, "#bfe2e0", 0.01);
  glass.position.set(-0.12, 0.045, 0.055);
  sign.add(glass);
  const chimney = box(0.04, 0.07, 0.03, "#237a96", 0.008);
  chimney.position.set(0.12, 0.06, 0.04);
  sign.add(chimney);
  for (const x of [-0.12, 0.12]) {
    const wheel = cylinder(0.035, 0.025, "#40524b", 12);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, -0.1, 0.045);
    sign.add(wheel);
  }
  sign.rotation.x = -Math.PI / 4;
  sign.position.set(-0.04, 0.96, 0.14);
  station.add(sign);
  const pole = box(0.035, 0.65, 0.035, "#52786d", 0.01);
  pole.position.set(0.67, 0.45, 0.19);
  station.add(pole);
  const clock = new THREE.Group();
  clock.add(cylinder(0.2, 0.045, "#52786d"));
  const face = cylinder(0.17, 0.05, "#fff9e9");
  clock.add(face);
  const hour = box(0.025, 0.012, 0.1, "#40524b", 0.006);
  hour.position.set(0, 0.031, -0.035);
  clock.add(hour);
  const minute = box(0.11, 0.012, 0.022, "#40524b", 0.006);
  minute.position.set(0.04, 0.032, 0);
  clock.add(minute);
  clock.rotation.x = Math.PI / 4;
  clock.position.set(0.67, 0.78, 0.19);
  station.add(clock);
  return station;
}

/** Place a platform along the arrival track, preferring space inside the toy board. */
export function stationForStage(stage: Stage) {
  const station = stationModel();
  const goal = stage.path.at(-1)!,
    previous = stage.path.at(-2)!;
  const direction = { x: goal.x - previous.x, z: goal.z - previous.z };
  const normal = { x: -direction.z, z: direction.x };
  const total = routeTiles(stage).at(-1)!.end;
  let bestScore = -Infinity,
    bestPosition = new THREE.Vector3(),
    bestRotation = 0,
    bestScale = 1;
  for (const [scale, along] of [
    [1, -0.4],
    [1, 0.35],
    [0.8, 0.1],
  ] as const)
    for (const side of [-1, 1]) {
      station.scale.x = scale;
      station.position.set(
        goal.x + direction.x * along + normal.x * side * 0.82,
        0,
        goal.z + direction.z * along + normal.z * side * 0.82,
      );
      station.rotation.y = Math.atan2(-normal.x * side, -normal.z * side);
      const bounds = new THREE.Box3().setFromObject(station);
      let clearance = Infinity;
      for (let distance = 0; distance <= total; distance += 0.125) {
        const point = sampleRoute(stage, distance);
        clearance = Math.min(
          clearance,
          bounds.distanceToPoint(new THREE.Vector3(point.x, 0.13, point.z)),
        );
      }
      const overflow = Math.max(
        0,
        -0.825 - bounds.min.x,
        bounds.max.x - 5.825,
        -0.825 - bounds.min.z,
        bounds.max.z - 5.825,
      );
      // The camera looks from the south. Keep roofs and signs behind the rails.
      const foreground = normal.z * side > 0 ? 0.5 : 0;
      const score = clearance - overflow - foreground - (scale < 1 ? 0.025 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestPosition.copy(station.position);
        bestRotation = station.rotation.y;
        bestScale = scale;
      }
    }
  station.position.copy(bestPosition);
  station.rotation.y = bestRotation;
  station.scale.x = bestScale;
  return station;
}

export function flagModel() {
  const group = new THREE.Group();
  const pole = cylinder(0.018, 0.8, "#b49b72", 8);
  pole.position.y = 0.4;
  group.add(pole);
  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.19, 0.018),
    material("#e3ac53"),
  );
  flag.position.set(0.13, 0.69, 0);
  group.add(flag);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 6),
    material("#ffe4a1"),
  );
  cap.position.y = 0.83;
  group.add(cap);
  return group;
}

export function disposeObject(object: THREE.Object3D) {
  // Materials are shared by the small procedural model palette; dispose once per renderer, not per tile.
  const geometries = new Set<THREE.BufferGeometry>();
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) geometries.add(child.geometry);
  });
  geometries.forEach((geometry) => geometry.dispose());
}
