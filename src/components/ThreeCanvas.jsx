import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import ModelStore from "../stores/ModelStore";

export default function ThreeCanvas() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const currentModelRef = useRef(null);

  const [models, setModels] = useState(null);

  const modelPaths = ModelStore.useState((state) => state.pairs).map((pair) => pair.model);
  const currentModelIndex = ModelStore.useState((state) => state.currentModelIndex);

  // load all the models first
  useEffect(() => {
    // load models
    const loader = new GLTFLoader();

    const newModels = [];

    modelPaths.forEach((modelPath) => {
      loader.load(
        modelPath,
        (model) => {
          model.scene.pathName = modelPath;
          newModels.push(model.scene);
        },
        null,
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    });

    setModels(newModels);
  }, []);

  // check if the current model has changed
  useEffect(() => {
    if (currentModelIndex !== null) {
      // if yes, remove the last model from the scene
      if (currentModelRef.current) {
        sceneRef.current.remove(currentModelRef.current);
      }

      // and add a new one
      const model = models[currentModelIndex];
      console.log(model);
      model.scale.setScalar(8);
      // model.rotation.y = -Math.PI / 4;
      currentModelRef.current = model;
      sceneRef.current.add(model);
    }
  }, [currentModelIndex]);

  useEffect(() => {
    if (!videoRef || !canvasRef) {
      return;
    }
    // first, we clear the previous scene
    canvasRef.current.innerHTML = "";

    rendererRef.current = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
    });

    const renderer = rendererRef.current;

    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);

    sceneRef.current = new THREE.Scene();
    const scene = sceneRef.current;

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, -0.0, 1.3);
    canvasRef.current.appendChild(renderer.domElement);

    const resizeCanvas = () => {
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const isVideoPlaying = (vid) =>
      !!(vid.currentTime > 0 && !vid.paused && !vid.ended && vid.readyState > 2);

    const video = videoRef.current;

    // get the webcam video
    if (!isVideoPlaying(video)) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then(function (stream) {
          video.srcObject = stream;
          video.play();
        })
        .catch(function (err) {
          console.log("An error occured! " + err);
        });
    }

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;

    // show webcam
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.scale.set(-1, 1, 1);
    scene.add(plane);

    // environment
    const light = new THREE.HemisphereLight(0xffffff, 0xffffbb, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.z = 1;
    scene.add(light);
    scene.add(directionalLight);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
  }, []);

  const saveScreenshot = () => {
    const strMime = "image/jpeg";
    const imgData = rendererRef.current.domElement.toDataURL(strMime);
    return imgData;
  };

  // the div's height is 100% - the bottom overlay height
  const Component = (
    <>
      <div ref={canvasRef} style={{ minHeight: "70vh", height: "calc(100% - 100px)" }} />
      <video ref={videoRef} style={{ display: "none" }} autoPlay playsInline></video>
    </>
  );

  return [Component, saveScreenshot];
}
