import * as THREE from "three";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Box3, Vector3 } from "three";

const DEBUG = false;

const defaults = {
  color: "#ffffff",
  metalness: 0,
  roughness: 0.05,
  transmission: 1,
  thickness: 0.5,
  ior: 1.5,
  envMapIntensity: 1.5,
};

const params = {
  fov: 40,
  exposure: 1.0,
  backgroundBlurriness: 0.0,
  autoRotate: true,
  rotateSpeed: 0.5,
  ...defaults,
};

let container;
let camera, scene, renderer, controls;
let currentModel;
let material;
const originalMaterials = new Map();
const timer = new THREE.Timer();

// Camera animation

const cameraStart = new Vector3(-0.012, 0.03, 1.34);
const cameraEnd = new Vector3(-0.27, -0.12, 1.31);
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
  console.time("loadmodel");
  const glbLoader = new GLTFLoader();
  const gltf = await glbLoader.loadAsync("public/m.glb");
  const gltfModel = gltf.scene;
  // gltfModel.rotation.y = Math.PI;
  gltfModel.updateMatrixWorld(true);
  console.timeEnd("loadmodel");

  // Center the model using a pivot group
  const box = new Box3().setFromObject(gltfModel);
  const center = box.getCenter(new Vector3());
  gltfModel.position.sub(center);

  const pivot = new THREE.Group();
  pivot.add(gltfModel);

  // Store original materials
  gltfModel.traverse((child) => {
    if (child.isMesh) originalMaterials.set(child, child.material);
  });

  // Create material (for GUI controls, not applied initially)
  material = new THREE.MeshPhysicalMaterial({
    color: params.color,
    metalness: params.metalness,
    roughness: params.roughness,
    transmission: params.transmission,
    thickness: params.thickness,
    ior: params.ior,
    envMapIntensity: params.envMapIntensity,
  });

  scene.add(pivot);
  currentModel = pivot;

  await loadTextureExr("public/rogland_4k.exr");
  // await loadTextureHdr("public/kloofendal.hdr");
  // await loadTextureHdr("public/sunflower.hdr");
  // await loadTextureJpg("public/vibrant-sky.png");

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.1;
  controls.maxDistance = 20;
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.enabled = false; // Disable during intro animation

  // Reset timer and animation state so loading time isn't counted
  timer.reset();
  timer.update();
  timer.getDelta(); // Clear any accumulated delta
  animationProgress = 0;
  animationComplete = false;
  renderer.setAnimationLoop(animate);

  window.addEventListener("resize", onWindowResize);

  // Environment defaults
  scene.environmentRotation.order = "YXZ";
  scene.backgroundRotation.order = "YXZ";
  scene.environmentRotation.set(0, 1.13, 0);
  scene.backgroundRotation.set(0, 1.13, 0);

  // GUI (debug only)
  if (!DEBUG) return;

  const gui = new GUI();
  const hdrParams = {
    loadHDR: () => hdrInput.click(),
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  };
  gui.add(hdrParams, "loadHDR").name("Load HDR File");
  gui
    .add(hdrParams, "rotationX", -Math.PI, Math.PI, 0.01)
    .name("HDR Tilt")
    .onChange((v) => {
      scene.environmentRotation.x = v;
      scene.backgroundRotation.x = v;
    });
  gui
    .add(hdrParams, "rotationY", -Math.PI, Math.PI, 0.01)
    .name("HDR Pan")
    .onChange((v) => {
      scene.environmentRotation.y = v;
      scene.backgroundRotation.y = v;
    });
  gui
    .add(hdrParams, "rotationZ", -Math.PI, Math.PI, 0.01)
    .name("HDR Roll")
    .onChange((v) => {
      scene.environmentRotation.z = v;
      scene.backgroundRotation.z = v;
    });

  // Material controls
  const matFolder = gui.addFolder("Material");
  matFolder
    .addColor(params, "color")
    .name("Color")
    .onChange((v) => {
      material.color.set(v);
    });
  matFolder.add(params, "metalness", 0, 1, 0.01).onChange((v) => {
    material.metalness = v;
  });
  matFolder.add(params, "roughness", 0, 1, 0.01).onChange((v) => {
    material.roughness = v;
  });
  matFolder.add(params, "transmission", 0, 1, 0.01).onChange((v) => {
    material.transmission = v;
  });
  matFolder.add(params, "thickness", 0, 2, 0.01).onChange((v) => {
    material.thickness = v;
  });
  matFolder
    .add(params, "ior", 1, 2.5, 0.01)
    .name("IOR")
    .onChange((v) => {
      material.ior = v;
    });
  matFolder
    .add(params, "envMapIntensity", 0, 5, 0.1)
    .name("Reflection")
    .onChange((v) => {
      material.envMapIntensity = v;
    });
  matFolder
    .add(
      {
        apply: () => {
          if (currentModel) {
            currentModel.traverse((child) => {
              if (child.isMesh) child.material = material;
            });
          }
        },
      },
      "apply",
    )
    .name("Apply Material");
  matFolder
    .add(
      {
        reset: () => {
          Object.assign(params, defaults);
          material.color.set(defaults.color);
          material.metalness = defaults.metalness;
          material.roughness = defaults.roughness;
          material.transmission = defaults.transmission;
          material.thickness = defaults.thickness;
          material.ior = defaults.ior;
          material.envMapIntensity = defaults.envMapIntensity;
          matFolder.controllersRecursive().forEach((c) => c.updateDisplay());
        },
      },
      "reset",
    )
    .name("Reset Material");
  matFolder.add(params, "autoRotate").name("Auto Rotate");
  matFolder.add(params, "rotateSpeed", 0, 2, 0.1).name("Rotate Speed");
  matFolder.open();

  // Hidden file input
  const hdrInput = document.createElement("input");
  hdrInput.type = "file";
  hdrInput.accept = ".hdr,.exr,.jpg,.jpeg,.png";
  hdrInput.style.display = "none";
  document.body.appendChild(hdrInput);

  hdrInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const ext = file.name.split(".").pop().toLowerCase();

    let envMap;
    if (ext === "hdr") {
      const loader = new HDRLoader();
      envMap = await loader.loadAsync(url);
    } else if (ext === "exr") {
      const loader = new EXRLoader();
      envMap = await loader.loadAsync(url);
    } else {
      const loader = new THREE.TextureLoader();
      envMap = await loader.loadAsync(url);
    }

    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
    scene.background = envMap;
    URL.revokeObjectURL(url);
  });

  // GLB file input
  const glbParams = { loadGLB: () => glbInput.click() };
  gui.add(glbParams, "loadGLB").name("Load GLB Model");

  const glbInput = document.createElement("input");
  glbInput.type = "file";
  glbInput.accept = ".glb,.gltf";
  glbInput.style.display = "none";
  document.body.appendChild(glbInput);

  glbInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    const newModel = gltf.scene;

    // Remove old model
    if (currentModel) scene.remove(currentModel);
    originalMaterials.clear();

    // Center new model using pivot
    const box = new Box3().setFromObject(newModel);
    const center = box.getCenter(new Vector3());
    newModel.position.sub(center);

    const pivot = new THREE.Group();
    pivot.add(newModel);

    // Store original materials then apply custom material
    newModel.traverse((child) => {
      if (child.isMesh) {
        originalMaterials.set(child, child.material);
        child.material = material;
      }
    });

    scene.add(pivot);
    currentModel = pivot;
    URL.revokeObjectURL(url);
  });
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
  timer.update();
  renderer.toneMappingExposure = params.exposure;
  scene.backgroundBlurriness = params.backgroundBlurriness;

  // Camera intro animation
  if (!animationComplete) {
    animationProgress += timer.getDelta() / animationDuration;
    if (animationProgress >= 1) {
      animationProgress = 1;
      animationComplete = true;
      controls.enabled = true;
    }
    const t = easeIn(animationProgress);
    camera.position.lerpVectors(cameraStart, cameraEnd, t);
  }

  // Model rotation
  if (currentModel && params.autoRotate) {
    currentModel.rotation.y += params.rotateSpeed * timer.getDelta();
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
  console.time("loadtexture");
  try {
    const loader = new HDRLoader();
    console.log("Starting HDR load:", url);
    const envMap = await loader.loadAsync(url);
    console.log("HDR loaded");
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
    scene.background = envMap;
    console.timeEnd("loadtexture");
  } catch (err) {
    console.error("HDR load failed:", err);
  }
}

async function loadTextureExr(url) {
  console.time("loadtexture");
  try {
    const loader = new EXRLoader();
    console.log("Starting EXR load:", url);
    const envMap = await loader.loadAsync(url);
    console.log("EXR loaded");
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
    scene.background = envMap;
    console.timeEnd("loadtexture");
  } catch (err) {
    console.error("EXR load failed:", err);
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "p") console.log(camera.position);
});

(async () => {
  await init();
})();
