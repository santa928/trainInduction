import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ends, sampleRail, type Rail } from "../railway/model";
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
  const platform = box(1.22, 0.13, 0.65, "#d9c4a2", 0.05);
  platform.position.y = 0.08;
  station.add(platform);
  const wall = box(0.88, 0.58, 0.5, "#fff0cd", 0.035);
  wall.position.y = 0.41;
  station.add(wall);
  for (const side of [-1, 1]) {
    const roof = box(1.12, 0.075, 0.46, "#c77c65", 0.025);
    roof.rotation.x = side * 0.55;
    roof.position.set(0, 0.82, side * 0.18);
    station.add(roof);
  }
  const ridge = box(1.16, 0.06, 0.07, "#b06d58", 0.025);
  ridge.position.y = 0.95;
  station.add(ridge);
  for (const x of [-0.26, 0.26]) {
    const window = box(0.19, 0.22, 0.02, "#88b9bc", 0.025);
    window.position.set(x, 0.44, 0.26);
    station.add(window);
  }
  const door = box(0.18, 0.34, 0.025, "#a18865", 0.02);
  door.position.set(0, 0.32, 0.26);
  station.add(door);
  const clock = cylinder(0.105, 0.025, "#fff9e9");
  clock.rotation.x = Math.PI / 2;
  clock.position.set(0, 0.67, 0.3);
  station.add(clock);
  const hand = box(0.012, 0.07, 0.02, "#625b48", 0.003);
  hand.position.set(0, 0.69, 0.32);
  station.add(hand);
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
