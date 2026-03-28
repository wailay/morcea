"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let disposed = false;

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

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let gui: GUI | undefined;
    let ktx2Loader: KTX2Loader;
    let currentModel: THREE.Group | undefined;
    let material: THREE.MeshPhysicalMaterial;
    const originalMaterials = new Map();
    const timer = new THREE.Timer();
    let DEBUG = false;

    // Camera animation
    const cameraStart = new THREE.Vector3(-0.012, 0.03, 1.1);
    const cameraEnd = new THREE.Vector3(-0.22, -0.1, 1.05);
    let animationProgress = 0;
    const animationDuration = 0.75;
    let animationComplete = false;

    function cubicBezier(
      t: number,
      p1x: number,
      p1y: number,
      p2x: number,
      p2y: number,
    ) {
      const cx = 3 * p1x;
      const bx = 3 * (p2x - p1x) - cx;
      const ax = 1 - cx - bx;
      const cy = 3 * p1y;
      const by = 3 * (p2y - p1y) - cy;
      const ay = 1 - cy - by;

      function sampleX(t: number) {
        return ((ax * t + bx) * t + cx) * t;
      }
      function sampleY(t: number) {
        return ((ay * t + by) * t + cy) * t;
      }
      function sampleDerivX(t: number) {
        return (3 * ax * t + 2 * bx) * t + cx;
      }

      let x = t;
      for (let i = 0; i < 8; i++) {
        const error = sampleX(x) - t;
        if (Math.abs(error) < 0.0001) break;
        x -= error / sampleDerivX(x);
      }
      return sampleY(x);
    }

    function easeIn(t: number) {
      return cubicBezier(t, 0.7, 0, 0.3, 1);
    }

    async function loadEnvMap(url: string, ext: string) {
      let envMap: THREE.Texture;
      if (ext === "hdr") {
        const loader = new HDRLoader();
        envMap = await loader.loadAsync(url);
      } else if (ext === "exr") {
        const loader = new EXRLoader();
        envMap = await loader.loadAsync(url);
      } else if (ext === "ktx2") {
        envMap = await ktx2Loader.loadAsync(url);
      } else {
        const loader = new THREE.TextureLoader();
        envMap = await loader.loadAsync(url);
      }

      envMap.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = envMap;
      scene.background = envMap;
    }

    async function loadModel(url: string) {
      const glbLoader = new GLTFLoader();
      const gltf = await glbLoader.loadAsync(url);
      const gltfModel = gltf.scene;
      gltfModel.updateMatrixWorld(true);
      return gltfModel;
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {
      timer.update();
      const delta = timer.getDelta();

      renderer.toneMappingExposure = params.exposure;
      scene.backgroundBlurriness = params.backgroundBlurriness;

      if (!animationComplete) {
        animationProgress += delta / animationDuration;
        if (animationProgress >= 1) {
          animationProgress = 1;
          animationComplete = true;
          controls.enabled = true;
        }
        const t = easeIn(animationProgress);
        camera.position.lerpVectors(cameraStart, cameraEnd, t);
      }

      if (currentModel && params.autoRotate) {
        currentModel.rotation.y += params.rotateSpeed * delta;
      }

      controls.update();
      renderer.render(scene, camera);
    }

    function debugGUI() {
      gui = new GUI();
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
        .onChange((v: number) => {
          scene.environmentRotation.x = v;
          scene.backgroundRotation.x = v;
        });
      gui
        .add(hdrParams, "rotationY", -Math.PI, Math.PI, 0.01)
        .name("HDR Pan")
        .onChange((v: number) => {
          scene.environmentRotation.y = v;
          scene.backgroundRotation.y = v;
        });
      gui
        .add(hdrParams, "rotationZ", -Math.PI, Math.PI, 0.01)
        .name("HDR Roll")
        .onChange((v: number) => {
          scene.environmentRotation.z = v;
          scene.backgroundRotation.z = v;
        });

      const matFolder = gui.addFolder("Material");
      matFolder
        .addColor(params, "color")
        .name("Color")
        .onChange((v: string) => {
          material.color.set(v);
        });
      matFolder.add(params, "metalness", 0, 1, 0.01).onChange((v: number) => {
        material.metalness = v;
      });
      matFolder.add(params, "roughness", 0, 1, 0.01).onChange((v: number) => {
        material.roughness = v;
      });
      matFolder
        .add(params, "transmission", 0, 1, 0.01)
        .onChange((v: number) => {
          material.transmission = v;
        });
      matFolder.add(params, "thickness", 0, 2, 0.01).onChange((v: number) => {
        material.thickness = v;
      });
      matFolder
        .add(params, "ior", 1, 2.5, 0.01)
        .name("IOR")
        .onChange((v: number) => {
          material.ior = v;
        });
      matFolder
        .add(params, "envMapIntensity", 0, 5, 0.1)
        .name("Reflection")
        .onChange((v: number) => {
          material.envMapIntensity = v;
        });
      matFolder
        .add(
          {
            apply: () => {
              if (currentModel) {
                currentModel.traverse((child) => {
                  if ((child as THREE.Mesh).isMesh)
                    (child as THREE.Mesh).material = material;
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
              matFolder
                .controllersRecursive()
                .forEach((c) => c.updateDisplay());
            },
          },
          "reset",
        )
        .name("Reset Material");
      matFolder.add(params, "autoRotate").name("Auto Rotate");
      matFolder.add(params, "rotateSpeed", 0, 2, 0.1).name("Rotate Speed");
      matFolder.open();

      // Hidden file input for HDR
      const hdrInput = document.createElement("input");
      hdrInput.type = "file";
      hdrInput.accept = ".hdr,.exr,.ktx2,.jpg,.jpeg,.png";
      hdrInput.style.display = "none";
      document.body.appendChild(hdrInput);

      hdrInput.addEventListener("change", async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const ext = file.name.split(".").pop()!.toLowerCase();
        loadEnvMap(url, ext);
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
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        const newModel = gltf.scene;

        if (currentModel) scene.remove(currentModel);
        originalMaterials.clear();

        const box = new THREE.Box3().setFromObject(newModel);
        const center = box.getCenter(new THREE.Vector3());
        newModel.position.sub(center);

        const pivot = new THREE.Group();
        pivot.add(newModel);

        newModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            originalMaterials.set(child, (child as THREE.Mesh).material);
            (child as THREE.Mesh).material = material;
          }
        });

        scene.add(pivot);
        currentModel = pivot;
        URL.revokeObjectURL(url);
      });
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "G" && e.shiftKey) {
        if (!gui) {
          DEBUG = true;
          debugGUI();
        } else {
          DEBUG = false;
          gui.destroy();
          gui = undefined;
        }
      }
      if (e.key === "p") console.log(camera.position);
    }

    function initWorker() {
      const myWorker = new Worker("/worker.js", { type: "module" });

      myWorker.postMessage({
        message: "loadTexture",
        url: "/rogland_4k.exr",
        ext: "exr",
      });

      myWorker.onmessage = (e) => {
        if (disposed) return;
        const {
          data: textureBufferData,
          w,
          h,
          type,
          format,
          colorSpace,
        } = e.data;

        const dataTexture = new THREE.DataTexture(
          textureBufferData,
          w,
          h,
          format,
          type,
          THREE.EquirectangularReflectionMapping,
        );

        dataTexture.minFilter = THREE.LinearFilter;
        dataTexture.magFilter = THREE.LinearFilter;
        dataTexture.generateMipmaps = false;
        dataTexture.colorSpace = colorSpace;
        dataTexture.needsUpdate = true;

        scene.environment = dataTexture;
        scene.background = dataTexture;
      };
    }

    async function init() {
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
      renderer.domElement.style.cssText =
        "position:absolute;top:0;left:0;width:100%!important;height:100%!important;";
      container.appendChild(renderer.domElement);

      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath(
        "https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/libs/basis/",
      );
      ktx2Loader.detectSupport(renderer);

      // Load GLB model
      const gltfModel = await loadModel("/m.glb");

      const box = new THREE.Box3().setFromObject(gltfModel);
      const center = box.getCenter(new THREE.Vector3());
      gltfModel.position.sub(center);

      const pivot = new THREE.Group();
      pivot.add(gltfModel);

      gltfModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh)
          originalMaterials.set(child, (child as THREE.Mesh).material);
      });

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

      // Progressive loading: 1k first, then 4k via worker
      await loadEnvMap("/rogland_1k.hdr", "hdr");

      // Orbit controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 0.1;
      controls.maxDistance = 20;
      controls.enableDamping = true;
      controls.target.set(0, 0, 0);
      controls.enabled = false;

      // Reset timer and start animation
      timer.reset();
      timer.update();
      timer.getDelta();
      animationProgress = 0;
      animationComplete = false;

      if (!disposed) {
        renderer.setAnimationLoop(render);
      }

      window.addEventListener("resize", onWindowResize);

      // Environment rotation
      scene.environmentRotation.order = "YXZ";
      scene.backgroundRotation.order = "YXZ";
      scene.environmentRotation.set(0, 1.13, 0);
      scene.backgroundRotation.set(0, 1.13, 0);

      if (DEBUG) {
        debugGUI();
      }
    }

    // Setup
    (async () => {
      await init();
      if (disposed) return;
      initWorker();
    })();

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      disposed = true;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", onWindowResize);
      if (gui) {
        gui.destroy();
        gui = undefined;
      }
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      if (controls) controls.dispose();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full" />;
}
