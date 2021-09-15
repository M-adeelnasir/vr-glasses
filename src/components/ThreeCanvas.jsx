import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs";

import ModelStore from "../stores/ModelStore";
import getFaceMeshCoords from "../lib/getFaceMeshCoords";

const isVideoPlaying = (vid) =>
  !!(vid.currentTime > 0 && !vid.paused && !vid.ended && vid.readyState > 2);

export default function ThreeCanvas() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const currentModelRef = useRef(null);

  const pointRef = useRef(null);

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
    // renderer.outputEncoding = THREE.sRGBEncoding;
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

    // flip the video
    // videoTexture.wrapS = THREE.RepeatWrapping;
    // videoTexture.repeat.x = -1;

    // show webcam

    // scene.background = videoTexture;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = -1;
    plane.scale.set(2, 2, 1);
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

  // ai model

  const runFacemesh = async () => {
    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh, {
      detectorModelUrl: "./models/1/model.json",
      modelUrl: "./models/2/model.json",
      irisModelUrl: "./models/3/model.json",
    });

    detect(net);
  };

  const detect = async (net) => {
    if (!isVideoPlaying(videoRef.current)) {
      return;
    }

    requestAnimationFrame(() => detect(net));

    // run the ai model
    const face = await net.estimateFaces({ input: videoRef.current });

    // get required points from the result
    const points = getFaceMeshCoords(face);
    if (currentModelRef.current !== null && points.length > 0) {
      // flip
      // points[0].x -= videoRef.current.videoWidth / 2;

      // the three js center is in the middle of the screen so we have to substract half of the video width and height from the facemesh points to center the coordinates
      points[2].x -= videoRef.current.videoWidth / 2;
      points[2].y -= videoRef.current.videoHeight / 2;

      // normalize the points
      points[2].x /= videoRef.current.videoWidth;
      points[2].y /= -videoRef.current.videoHeight;

      currentModelRef.current.position.x = points[2].x;
      currentModelRef.current.position.y = points[2].y;

      // TODO: calculate rotation and glasses size based on face rotation and distance from the camera
    }
  };

  useEffect(() => {
    runFacemesh();
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
