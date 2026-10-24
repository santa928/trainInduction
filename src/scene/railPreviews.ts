import * as THREE from "three";
import { ends, type Rail } from "../railway/model";
import { disposeObject, railModel } from "./models";

export type RailImages = Record<Rail, string>;
// The board uses three fixed viewpoints and a shared material/light palette.
const cache = new Map<string, RailImages>();

/** Photograph the actual board models using its renderer, lighting and viewpoint. */
export function railPreviews(
  renderer: THREE.WebGLRenderer,
  boardCamera: THREE.Camera,
  lights: THREE.Light[],
): RailImages {
  const key = boardCamera.quaternion.toArray().join(",");
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 192;
  const scene = new THREE.Scene();
  scene.add(...lights.map((light) => light.clone()));
  const camera = new THREE.OrthographicCamera(-0.6, 0.6, 0.6, -0.6, 0.1, 20);
  camera.quaternion.copy(boardCamera.quaternion);
  camera.position.set(0, 0, 10).applyQuaternion(camera.quaternion);
  camera.position.y += 0.13;
  const previousTarget = renderer.getRenderTarget();
  const previousSize = renderer.getSize(new THREE.Vector2());
  const pixelRatio = renderer.getPixelRatio();
  const clearColor = renderer.getClearColor(new THREE.Color());
  const clearAlpha = renderer.getClearAlpha();
  const images = {} as RailImages;
  try {
    // Capture the normal framebuffer so tone mapping and antialiasing match the board.
    // Keep CSS dimensions intact; the real board is rendered again before the next paint.
    renderer.setRenderTarget(null);
    renderer.setPixelRatio(1);
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);
    for (const rail of Object.keys(ends) as Rail[]) {
      const model = railModel(rail);
      scene.add(model);
      renderer.render(scene, camera);
      images[rail] = renderer.domElement.toDataURL("image/png");
      scene.remove(model);
      disposeObject(model);
    }
    cache.set(key, images);
    return images;
  } finally {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(previousSize.x, previousSize.y, false);
    renderer.setRenderTarget(previousTarget);
    renderer.setClearColor(clearColor, clearAlpha);
    disposeObject(scene);
    scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
  }
}
