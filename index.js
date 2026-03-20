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

async function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    params.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    50,
  );
  camera.position.set(0, 0, 3);
  camera.position.set(0.43, -0.08, 1.27);

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

  loadTextureHdr("public/citrus.hdr");
  // await loadTextureJpg("public/vibrant-sky.png");

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.1;
  controls.maxDistance = 20;
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);

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
