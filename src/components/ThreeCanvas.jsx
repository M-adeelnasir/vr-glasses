import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs";

import ModelStore from "../stores/ModelStore";
import getFaceMeshCoords from "../lib/getFaceMeshCoords";

const isVideoPlaying = (vid) =>
  !!(vid.currentTime > 0 && !vid.paused && !vid.ended && vid.readyState > 2);

const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;

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
      // currentModelRef.current.scale.set(new THREE.Vector3(2));
      sceneRef.current.add(model);
    }
  }, [currentModelIndex]);

  useEffect(async () => {
    if (!videoRef || !canvasRef) {
      return;
    }
    // first, we clear the previous scene
    canvasRef.current.innerHTML = "";

    // init renderer
    rendererRef.current = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
    });
    const renderer = rendererRef.current;

    renderer.domElement.style.transform = "translateX(-25%)";

    renderer.physicallyCorrectLights = true;
    // renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);

    sceneRef.current = new THREE.Scene();
    const scene = sceneRef.current;

    const camera = new THREE.PerspectiveCamera(75);
    camera.position.set(0, 0, 1.2);
    canvasRef.current.appendChild(renderer.domElement);

    const resizeCanvas = () => {
      const wrapperHeight = canvasRef.current.clientHeight;

      const aspect = VIDEO_WIDTH / VIDEO_HEIGHT;

      renderer.setSize(wrapperHeight * aspect, wrapperHeight);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

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

    scene.background = videoTexture;

    // environment
    const light = new THREE.HemisphereLight(0xffffff, 0xffffbb, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.z = 1;
    scene.add(light);
    scene.add(directionalLight);

    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new THREE.Vector3().toArray(), 3)
    );
    const dotMaterial = new THREE.PointsMaterial({ size: 0.01, color: 0xff00ff });
    const dot = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dot);

    const aiModel = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh, {
      detectorModelUrl: "./models/1/model.json",
      modelUrl: "./models/2/model.json",
      irisModelUrl: "./models/3/model.json",
    });

    function convertPoint(point) {
      // converts from video coordinates to three js 3d world coordinates

      const newPoint = { ...point };

      const w = renderer.domElement.clientWidth;
      const h = renderer.domElement.clientHeight;

      // the three js center is in the middle of the screen so we have to substract
      // half of the video width and height from the facemesh points to center the coordinates
      newPoint.x -= w;
      newPoint.y -= h;

      // normalize the points
      newPoint.x /= w;
      newPoint.y /= -h;

      return newPoint;
    }

    function mapVal(value, start1, stop1, start2, stop2) {
      return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }

    async function detect(net) {
      if (!isVideoPlaying(videoRef.current)) {
        return;
      }

      // run the ai model
      const faces = await net.estimateFaces({
        input: renderer.domElement,
        returnTensors: false,
      });

      if (currentModelRef.current !== null && faces.length > 0) {
        const model = currentModelRef.current;

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);

        const annotations = faces[0].annotations;

        const midwayBetweenEyes = convertPoint({
          x: annotations.midwayBetweenEyes[0][0],
          y: annotations.midwayBetweenEyes[0][1],
          z: annotations.midwayBetweenEyes[0][2],
        });

        // position
        model.position.set(
          midwayBetweenEyes.x,
          midwayBetweenEyes.y,
          0
          // -camera.position.z + midwayBetweenEyes.z
        );

        const noseBottom = convertPoint({
          x: annotations.noseBottom[0][0],
          y: annotations.noseBottom[0][1],
          z: annotations.noseBottom[0][2],
        });

        model.up.x = midwayBetweenEyes.x - noseBottom.x;
        model.up.y = midwayBetweenEyes.y - noseBottom.y;
        model.up.z = midwayBetweenEyes.z - noseBottom.z;

        const length = Math.sqrt(model.up.x ** 2 + model.up.y ** 2 + model.up.z ** 2);
        model.up.x /= length;
        model.up.y /= length;
        model.up.z /= length;

        const leftEyeUpper = convertPoint({
          x: annotations.leftEyeUpper1[3][0],
          y: annotations.leftEyeUpper1[3][1],
          z: annotations.leftEyeUpper1[3][2],
        });
        const rightEyeUpper = convertPoint({
          x: annotations.rightEyeUpper1[3][0],
          y: annotations.rightEyeUpper1[3][1],
          z: annotations.rightEyeUpper1[3][2],
        });

        const eyeDist = Math.sqrt(
          (leftEyeUpper.x - rightEyeUpper.x) ** 2 +
            (leftEyeUpper.y - rightEyeUpper.y) ** 2 +
            (leftEyeUpper.z - rightEyeUpper.z) ** 2
        );
        // 0.1 -> 9

        const scale = eyeDist * 10;
        model.scale.set(scale, scale, scale);

        // model.rotation.y = Math.PI;
        model.rotation.z = Math.PI / 2 - Math.acos(model.up.x);

        // console.log(model.position, model.scale.model.rotation);
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      if (aiModel && currentModelRef.current) {
        // hide the model when detecting the face so it doesn't interfere
        currentModelRef.current.visible = false;
        dot.visible = false;

        // I think I need to render the scene twice, once with the face and once with the models, this way I can detect the faces from the canvas without the model interfering
        renderer.render(scene, camera);
        detect(aiModel);

        currentModelRef.current.visible = true;
        dot.visible = true;
      }

      renderer.render(scene, camera);
    }

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
      <video
        ref={videoRef}
        style={{
          display: "none",
          position: "absolute",
          left: 0,
          right: 0,
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
        }}
        autoPlay
        playsInline
      ></video>
      <div
        ref={canvasRef}
        style={{
          // opacity: 0.3,
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
          height: "calc(100% - 100px)",
        }}
      />
    </>
  );

  return [Component, saveScreenshot];
}
