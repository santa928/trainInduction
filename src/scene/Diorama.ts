import * as THREE from "three";
import {
  box,
  material,
  railModel,
  trainModel,
  treeModel,
  stationModel,
  flagModel,
  disposeObject,
} from "./models";
import {
  railAt,
  routeTiles,
  sampleRoute,
  type Run,
  type Stage,
} from "../railway/model";
import type { Train } from "../railway/stages";
import { railPreviews, type RailImages } from "./railPreviews";

export interface Projection {
  id: string;
  x: number;
  y: number;
  size: number;
}
interface Options {
  host: HTMLElement;
  stage: Stage;
  train: Train;
  preview?: boolean;
  onProjection: (points: Projection[]) => void;
  onRailImages?: (images: RailImages) => void;
  onContextLost: () => void;
  onContextRestored: () => void;
}

/** Render-only adapter. Gameplay and the clock remain in the pure railway reducer. */
export class Diorama {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera();
  private track = new THREE.Group();
  private placed = new Map<
    string,
    { id: string; model: THREE.Group; born: number }
  >();
  private engine: ReturnType<typeof trainModel>;
  private wagon: ReturnType<typeof trainModel>;
  private flag = flagModel();
  private puffs: THREE.Mesh[] = [];
  private confetti: THREE.InstancedMesh;
  private observer: ResizeObserver;
  private lost = false;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  private options: Options;
  private projected: Projection[] = [];
  private width = 0;
  private height = 0;
  private celebrationStart: number | null = null;
  private lastRun: Run | null = null;

  constructor(options: Options) {
    this.options = options;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.renderer.domElement.addEventListener(
      "webglcontextrestored",
      this.contextRestored,
    );
    options.host.appendChild(this.renderer.domElement);
    this.camera.position.set(2.5, 13, 10);
    this.camera.lookAt(2.5, 0, 2.5);
    this.scene.add(new THREE.HemisphereLight("#fff7df", "#a2b397", 1.9));
    const sun = new THREE.DirectionalLight("#fff4d5", 2.5);
    sun.position.set(-3, 9, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    Object.assign(sun.shadow.camera, {
      left: -6,
      right: 6,
      top: 6,
      bottom: -6,
      near: 1,
      far: 22,
    });
    sun.shadow.normalBias = 0.03;
    sun.shadow.bias = -0.0003;
    sun.shadow.radius = 3;
    this.scene.add(sun);
    this.scene.add(this.track);
    this.buildLandscape();
    this.engine = trainModel(options.train);
    this.wagon = trainModel(options.train, true);
    this.scene.add(this.engine.group, this.wagon.group);
    const smokeMaterial = new THREE.MeshStandardMaterial({
      color: "#fffdf0",
      transparent: true,
      opacity: 0.65,
      roughness: 1,
    });
    for (let i = 0; i < 5; i++) {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.1, 1),
        smokeMaterial.clone(),
      );
      puff.visible = false;
      this.puffs.push(puff);
      this.scene.add(puff);
    }
    this.confetti = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.055, 0.02, 0.09),
      material("#ffffff"),
      45,
    );
    for (let i = 0; i < 45; i++)
      this.confetti.setColorAt(
        i,
        new THREE.Color(
          ["#df9179", "#efc56b", "#75a58b", "#8abdc4", "#f7e0ae"][i % 5],
        ),
      );
    this.confetti.visible = false;
    this.scene.add(this.confetti);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(options.host);
    this.resize();
  }
  private buildLandscape() {
    const { stage } = this.options;
    const palette =
      stage.theme === "meadow"
        ? ["#b5cd98", "#7e9f70", "#9dbb80"]
        : stage.theme === "river"
          ? ["#b2ccad", "#6d9c83", "#8fb99d"]
          : ["#d5cea1", "#a6aa77", "#b9b989"];
    const soil = box(6.65, 0.32, 6.65, "#dcc29a", 0.16);
    soil.position.set(2.5, -0.25, 2.5);
    this.scene.add(soil);
    const grass = box(6.6, 0.13, 6.6, palette[0], 0.11);
    grass.position.set(2.5, -0.06, 2.5);
    this.scene.add(grass);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.43;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const gapIndexes = new Set(stage.gaps.map((g) => g.pathIndex));
    stage.path.forEach((point, index) => {
      if (!gapIndexes.has(index) || this.options.preview) {
        const model = railModel(railAt(stage, index));
        model.position.set(point.x, 0, point.z);
        this.track.add(model);
      } else {
        const socket = box(0.96, 0.065, 0.96, "#9eaa7e", 0.06);
        socket.position.set(point.x, 0.02, point.z);
        this.scene.add(socket);
        const inset = box(0.82, 0.02, 0.82, "#b5be92", 0.08);
        inset.position.set(point.x, 0.065, point.z);
        this.scene.add(inset);
      }
    });
    const goal = stage.path.at(-1)!;
    const station = stationModel();
    station.position.set(
      goal.x + (goal.z === 0 ? 0.8 : 0),
      0,
      goal.z - (goal.z === 0 ? 0 : 0.78),
    );
    this.scene.add(station);
    this.flag.position.set(goal.x + 0.65, 0, goal.z - 0.5);
    this.scene.add(this.flag);
    const start = stage.path[0];
    const marker = box(0.18, 0.36, 0.12, "#f5e6b5", 0.04);
    marker.position.set(start.x, 0.2, start.z + 0.53);
    this.scene.add(marker);
    const cap = box(0.32, 0.16, 0.12, "#d99171", 0.025);
    cap.position.set(start.x, 0.44, start.z + 0.53);
    this.scene.add(cap);
    let decorations = 0;
    for (let z = 0; z <= 5; z++)
      for (let x = 0; x <= 5; x++) {
        if (
          stage.path.some((p) => Math.hypot(p.x - x, p.z - z) < 1.12) ||
          Math.hypot(goal.x - x, goal.z - 0.78 - z) < 1
        )
          continue;
        const value = (x * 7 + z * 11 + stage.number * 3) % 9;
        if (value < 4 && decorations < 10) {
          const tree = treeModel(
            palette[1 + (value % 2)],
            0.75 + (value % 3) * 0.13,
          );
          tree.position.set(x + 0.12, 0, z + 0.05);
          this.scene.add(tree);
          decorations++;
        } else if (value < 7) {
          const bush = box(0.5, 0.18, 0.4, palette[2], 0.08);
          bush.position.set(x, 0.1, z);
          this.scene.add(bush);
          for (let i = 0; i < 3; i++) {
            const flower = new THREE.Mesh(
              new THREE.SphereGeometry(0.045, 6, 4),
              material(i % 2 ? "#fff2ca" : "#e8b185"),
            );
            flower.position.set(x - 0.14 + i * 0.13, 0.21, z + 0.08);
            this.scene.add(flower);
          }
        } else if (stage.theme === "river") {
          const pond = box(0.77, 0.025, 0.7, "#8ebfc4", 0.12);
          pond.position.set(x, 0.02, z);
          this.scene.add(pond);
          const ripple = box(0.3, 0.01, 0.025, "#c6e2dc", 0.012);
          ripple.position.set(x + 0.1, 0.04, z);
          this.scene.add(ripple);
        }
      }
    // Small pegs along the wooden base make the diorama feel like a tabletop toy.
    for (const x of [-0.45, 5.45])
      for (const z of [-0.45, 5.45]) {
        const peg = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 8, 6),
          material("#bf9d73"),
        );
        peg.position.set(x, 0.01, z);
        this.scene.add(peg);
      }
  }
  resize() {
    const width = this.options.host.clientWidth,
      height = this.options.host.clientHeight;
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    const shortBoard = !this.options.preview && height < 400;
    this.camera.position.set(
      2.5,
      this.options.preview ? 11 : shortBoard ? 15 : width >= 600 ? 12 : 13,
      this.options.preview ? 12 : shortBoard ? 7.5 : width >= 600 ? 12.5 : 10,
    );
    this.camera.lookAt(2.5, 0, 2.5);
    this.renderer.setSize(width, height);
    const aspect = width / height;
    const spanX = Math.max(7.25, 6.65 * aspect),
      spanY = spanX / aspect;
    Object.assign(this.camera, {
      left: -spanX / 2,
      right: spanX / 2,
      top: spanY / 2,
      bottom: -spanY / 2,
      near: 0.1,
      far: 80,
    });
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    if (!this.options.preview && this.options.onRailImages)
      this.options.onRailImages(
        railPreviews(
          this.renderer,
          this.camera,
          this.scene.children.filter(
            (object): object is THREE.Light => object instanceof THREE.Light,
          ),
        ),
      );
    this.projected = this.options.stage.gaps.map((gap) => {
      const point = this.options.stage.path[gap.pathIndex];
      const projected = new THREE.Vector3(point.x, 0.13, point.z).project(
        this.camera,
      );
      return {
        id: gap.id,
        x: ((projected.x + 1) * width) / 2,
        y: ((1 - projected.y) * height) / 2,
        size: Math.max(44, Math.min(76, (width / spanX) * 0.72)),
      };
    });
    this.options.onProjection(this.projected);
    if (this.lastRun) this.render(this.lastRun, performance.now() / 1000);
  }
  projection() {
    return this.projected;
  }
  render(run: Run, time: number) {
    if (this.lost) return;
    this.lastRun = run;
    const { stage, preview } = this.options;
    if (!preview)
      for (const gap of stage.gaps) {
        const id = run.placements[gap.id];
        const previous = this.placed.get(gap.id);
        if (previous?.id === id) continue;
        if (previous) {
          this.scene.remove(previous.model);
          disposeObject(previous.model);
          this.placed.delete(gap.id);
        }
        if (id) {
          const piece = stage.pieces.find((p) => p.id === id)!;
          const model = railModel(piece.rail),
            point = stage.path[gap.pathIndex];
          model.position.set(point.x, 0, point.z);
          this.scene.add(model);
          this.placed.set(gap.id, { id, model, born: time });
        }
      }
    for (const { model, born } of this.placed.values()) {
      const age = time - born;
      model.position.y = this.reduced
        ? 0
        : Math.max(0, 0.12 * (1 - age / 0.22)) * Math.cos(age * 18);
    }
    const total = routeTiles(stage).at(-1)!.end;
    const distance = preview
      ? this.reduced
        ? total * 0.4
        : (time * 0.3) % total
      : run.distance;
    const moving = preview || (run.status === "running" && !run.paused);
    [this.engine, this.wagon].forEach((vehicle, index) => {
      let point = sampleRoute(stage, Math.max(0, distance - index * 0.78));
      if (index && distance < 0.78)
        point = {
          ...point,
          x: point.x - point.dx * (0.78 - distance),
          z: point.z - point.dz * (0.78 - distance),
        };
      vehicle.group.position.set(
        point.x,
        moving && !this.reduced ? Math.sin(distance * 35) * 0.007 : 0,
        point.z,
      );
      vehicle.group.rotation.y = Math.atan2(-point.dz, point.dx);
      vehicle.wheels.forEach((wheel) => (wheel.rotation.z = -distance / 0.112));
    });
    this.puffs.forEach((puff, i) => {
      puff.visible = moving && !this.reduced;
      if (!puff.visible) return;
      const age = (time * 0.8 + i / 5) % 1;
      const point = sampleRoute(stage, Math.max(0, distance - age * 0.5));
      puff.position.set(
        point.x + point.dx * 0.18 + age * 0.1,
        0.9 + age * 0.8,
        point.z + point.dz * 0.18,
      );
      puff.scale.setScalar(0.45 + age * 1.1);
      (puff.material as THREE.MeshStandardMaterial).opacity = (1 - age) * 0.5;
    });
    if (run.status === "cleared" && !preview) {
      this.celebrationStart ??= time;
      const age = time - this.celebrationStart;
      this.confetti.visible = !this.reduced && age < 4;
      const transform = new THREE.Object3D();
      const goal = stage.path.at(-1)!;
      for (let i = 0; i < 45; i++) {
        const a = i * 2.399;
        const radius = 0.3 + age * (0.18 + (i % 7) * 0.07);
        transform.position.set(
          goal.x + Math.cos(a) * radius,
          Math.max(0.1, 0.5 + age * (1.5 + (i % 4) * 0.3) - 0.9 * age * age),
          goal.z + Math.sin(a) * radius,
        );
        transform.rotation.set(i + age * 3, i * 2 + age, age * 2);
        transform.updateMatrix();
        this.confetti.setMatrixAt(i, transform.matrix);
      }
      this.confetti.instanceMatrix.needsUpdate = true;
      this.flag.rotation.z = this.reduced ? 0 : Math.sin(age * 8) * 0.05;
    } else {
      this.celebrationStart = null;
      this.confetti.visible = false;
    }
    this.renderer.render(this.scene, this.camera);
  }
  private contextLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    this.options.onContextLost();
  };
  private contextRestored = () => {
    this.lost = false;
    this.options.onContextRestored();
    this.resize();
  };
  dispose() {
    this.observer.disconnect();
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.renderer.domElement.removeEventListener(
      "webglcontextrestored",
      this.contextRestored,
    );
    const sceneMaterials = new Set<THREE.Material>();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const list = Array.isArray(object.material)
          ? object.material
          : [object.material];
        list.forEach((m) => sceneMaterials.add(m));
      }
    });
    disposeObject(this.scene);
    sceneMaterials.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
