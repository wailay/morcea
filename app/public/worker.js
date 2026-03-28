import * as THREE from "https://esm.sh/three/build/three.module.js";
import { HDRLoader } from "https://esm.sh/three/examples/jsm/loaders/HDRLoader.js";
import { EXRLoader } from "https://esm.sh/three/examples/jsm/loaders/EXRLoader.js";

console.log("Worker has started");

async function loadTexture(url, ext) {
  let dataTexture;
  console.time(`worker-loadTexture-${url}`);
  if (ext === "hdr") {
    const loader = new HDRLoader();
    dataTexture = await loader.loadAsync(url);
  } else if (ext === "exr") {
    const loader = new EXRLoader();
    dataTexture = await loader.loadAsync(url);
  } else {
    const loader = new THREE.TextureLoader();
    dataTexture = await loader.loadAsync(url);
  }
  console.timeEnd(`worker-loadTexture-${url}`);

  postMessage(
    {
      data: dataTexture.image.data,
      w: dataTexture.image.width,
      h: dataTexture.image.height,
      format: dataTexture.format, // THREE.RGBAFormat or THREE.RGBFormat
      type: dataTexture.type, // THREE.HalfFloatType or THREE.FloatType
      colorSpace: dataTexture.colorSpace,
    },
    [dataTexture.image.data.buffer],
  );

  //   dataTexture.mapping = THREE.EquirectangularReflectionMapping;
  //   scene.environment = dataTexture;
  //   scene.background = dataTexture;
}

onmessage = async (e) => {
  if (e.data.message === "loadTexture") {
    try {
      await loadTexture(e.data.url, e.data.ext);
      //   postMessage(workerResult);
    } catch (error) {
      console.error("Got error while running loadEnvMap from worker", error);
    }
  }
};

onerror = (event) => {
  console.log("Error event", event);
};
