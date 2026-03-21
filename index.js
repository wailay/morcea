import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Box3, Vector3 } from "three";

const params = {
  fov: 40,
  exposure: 1.0,
  backgroundBlurriness: 0.0,
  metalness: 0,
  roughness: 0.05,
  transmission: 1,
  thickness: 0.5,
  ior: 1.5,
  envMapIntensity: 1.5,
};

let container;
let camera, scene, renderer, controls;
const clock = new THREE.Clock();

// Camera animation
const cameraStart = new Vector3(-0.06, -0.03, 1.35);
const cameraEnd = new Vector3(-0.611, -0.35, 1.146);
let animationProgress = 0;
const animationDuration = 0.75; // seconds
let animationComplete = false;

// Custom cubic-bezier easing (like CSS cubic-bezier)
// (0.42, 0, 1, 1) = ease-in
function cubicBezier(t, p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  function sampleX(t) {
    return ((ax * t + bx) * t + cx) * t;
  }
  function sampleY(t) {
    return ((ay * t + by) * t + cy) * t;
  }
  function sampleDerivX(t) {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  // Newton-Raphson to find t for given x
  let x = t;
  for (let i = 0; i < 8; i++) {
    const error = sampleX(x) - t;
    if (Math.abs(error) < 0.0001) break;
    x -= error / sampleDerivX(x);
  }
  return sampleY(x);
}

// Slow start, damped end: cubic-bezier(0.7, 0, 0.3, 1)
function easeIn(t) {
  return cubicBezier(t, 0.7, 0, 0.3, 1);
}

async function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    params.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    50,
  );
  camera.position.copy(cameraStart);

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);

  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // GLB
  const glbLoader = new GLTFLoader();
  const gltf = await glbLoader.loadAsync("public/morcea.glb");
  const gltfModel = gltf.scene;
  // gltfModel.rotation.y = Math.PI;
  gltfModel.updateMatrixWorld(true);

  // Center the model at origin
  const box = new Box3().setFromObject(gltfModel);
  const center = box.getCenter(new Vector3());
  gltfModel.position.sub(center);

  scene.add(gltfModel);

  await loadTextureHdr("public/citrus.hdr");
  // await loadTextureJpg("public/vibrant-sky.png");

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.1;
  controls.maxDistance = 20;
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.enabled = false; // Disable during intro animation

  clock.getDelta(); // Reset clock so loading time isn't counted
  renderer.setAnimationLoop(animate);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function animate() {
  render();
}

function render() {
  renderer.toneMappingExposure = params.exposure;
  scene.backgroundBlurriness = params.backgroundBlurriness;

  // Camera intro animation
  if (!animationComplete) {
    animationProgress += clock.getDelta() / animationDuration;
    if (animationProgress >= 1) {
      animationProgress = 1;
      animationComplete = true;
      controls.enabled = true;
    }
    const t = easeIn(animationProgress);
    camera.position.lerpVectors(cameraStart, cameraEnd, t);
  }

  controls.update();
  renderer.render(scene, camera);
}

async function loadTextureJpg(url) {
  const textureLoader = new THREE.TextureLoader();
  const envMap = await textureLoader.loadAsync(url);
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = envMap;
  scene.background = envMap;
}

async function loadTextureHdr(url) {
  const loader = new HDRLoader();
  const envMap = await loader.loadAsync(url);
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = envMap;
  scene.background = envMap;
}

window.addEventListener("keydown", (e) => {
  if (e.key === "p") console.log(camera.position);
});

(async () => {
  await init();
})();
