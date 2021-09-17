import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs";

import ModelStore from "../stores/ModelStore";
import getFaceMeshCoords from "../lib/getFaceMeshCoords";

const isVideoPlaying = (vid) => !!(vid.currentTime > 0 && !vid.paused && !vid.ended && vid.readyState > 2);

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

    const isVideoPlaying = (vid) => !!(vid.currentTime > 0 && !vid.paused && !vid.ended && vid.readyState > 2);

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

    // we have 2 options to show the webcam inside three js, set it as scene background or display it on a plane as it's texture

    scene.background = videoTexture;

    // const geometry = new THREE.PlaneGeometry(2, 2);
    // const material = new THREE.MeshBasicMaterial({
    //   map: videoTexture,
    //   side: THREE.DoubleSide,
    // });
    // const plane = new THREE.Mesh(geometry, material);
    // plane.position.z = -2;
    // const ratio = VIDEO_WIDTH / VIDEO_HEIGHT;
    // plane.scale.set(1 * ratio, 1, 1);
    // scene.add(plane);

    // environment
    const light = new THREE.HemisphereLight(0xffffff, 0xffffbb, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.z = 1;
    scene.add(light);
    scene.add(directionalLight);

    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute("position", new THREE.Float32BufferAttribute(new THREE.Vector3().toArray(), 3));
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
      const face = await net.estimateFaces({ input: renderer.domElement });
      // get required points from the result
      const points = getFaceMeshCoords(face);
      if (currentModelRef.current !== null && points !== null) {
        // flip
        // points[0].x -= videoRef.current.videoWidth / 2;

        const center = convertPoint(points.center);

        dot.position.x = center.x;
        dot.position.y = center.y;

        // we also need to add a small offset to the position so the glasses look good on the face
        const box = new THREE.Box3().setFromObject(currentModelRef.current);
        const size = new THREE.Vector3();
        box.getSize(size);

        const model = currentModelRef.current;

        model.position.x = center.x;
        model.position.y = center.y - size.y / 2;

        // minz: -22
        // maxz = -2

        const leftEar = convertPoint(points.leftEar);
        const rightEar = convertPoint(points.rightEar);

        const faceWidth = Math.abs(rightEar.x - leftEar.x);

        const scale = mapVal(faceWidth, 0, 1, 1, 17);
        model.scale.set(scale, scale, scale);

        // TODO: maybe offset the model a bit on the z axis when the user's head is turned same for the ydiff

        const zdiff = rightEar.z - leftEar.z;
        // console.log(zdiff);
        if (Math.abs(zdiff) > 30) {
          const angle = mapVal(zdiff, -80, 80, -Math.PI / 8, Math.PI / 8);
          model.rotation.y = angle;
        } else {
          model.rotation.y = 0;
        }

        const ydiff = rightEar.y - leftEar.y;

        if (Math.abs(ydiff) > 0.05) {
          const angle = mapVal(ydiff, -1, 1, -Math.PI / 2, Math.PI / 2);
          console.log(angle);
          model.rotation.z = angle;
        } else {
          model.rotation.z = 0;
        }
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
