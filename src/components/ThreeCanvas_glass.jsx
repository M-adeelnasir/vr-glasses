/* eslint-disable radix */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable prefer-destructuring */
/* eslint-disable max-len */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-first-prop-new-line */
/* eslint-disable func-names */
/* eslint-disable no-console */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// import * as facemesh from "@tensorflow-models/face-landmarks-detection";
// import * as tf from "@tensorflow/tfjs";
// import * as Facemesh from "@mediapipe/face_mesh";

import { FaceMesh } from '@mediapipe/face_mesh'; //New Face detect lib that we are using.
import * as cam from '@mediapipe/camera_utils';
import ModelStore from '../stores/ModelStore';
import Webcam from 'react-webcam';
import VideoBackground from '../lib/videobg';

const isVideoPlaying = (vid) =>
  !!(vid.currentTime > 0 && !vid.paused && !vid.ended && vid.readyState > 2);

const mapVal = (value, start1, stop1, start2, stop2) =>
  start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));

//Input Video frame size
// const VIDEO_WIDTH = 320;
// const VIDEO_HEIGHT = 240;

var web_camera = null;

export default function ThreeCanvas() {
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const currentModelRef = useRef(null);
  const currentface = useRef(null);
  const [models, setModels] = useState(null);
  const [btnDisable, setBtnDisable] = useState(false);
  const [left, setLeft] = useState(0);
  //To move canvas based on glass position
  const [canvasLeft, setCanvasLeft] = useState(0);
  const [canvasTop, setCanvasTop] = useState(0);

  const [faceCenter, setFaceCenter] = useState();

  const [VIDEO_WIDTH, setVIDEO_WIDTH] = useState(640);
  const [VIDEO_HEIGHT, setVIDEO_HEIGHT] = useState(480);
  const [firstResize, setFirstResize] = useState(false);

  var positionBuff = 0;
  var rotationPBuff = 0;
  var rotationRBuff = 0;
  var rotationYBuff = 0;

  //let piviot=null;
  const modelPaths = ModelStore.useState((state) => state.pairs).map(
    (pair) => pair.model
  );
  const currentModelIndex = ModelStore.useState(
    (state) => state.currentModelIndex
  );

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

      let piviot = new THREE.Group();
      piviot.name = 'parentPiviot';
      piviot.add(model);
      currentModelRef.current = piviot;
      //  setPiviot(piviotObj)
      sceneRef.current.add(piviot);
    }
  }, [currentModelIndex]);

  useEffect(() => {
    const methodF = async () => {
      if (!videoRef || !canvasRef) {
        return;
      }
      // first, we clear the previous scene
      var element = document.getElementById('camdiv');
      canvasRef.current.innerHTML = '';
      // setVIDEO_WIDTH(element.clientWidth);
      // setVIDEO_HEIGHT(element.clientHeight)
      console.log(element.clientHeight, element.clientWidth);


      // init renderer
      rendererRef.current = new THREE.WebGLRenderer({

        //  canvas: canvasRef,
        devicePixelRation: window.devicePixelRatio || 1,
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: true,
      });
      const renderer = rendererRef.current;
      //     renderer.setSize(element.clientWidth, element.clientHeight);
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.domElement.style.transform = ' scaleX(-1)';

      renderer.physicallyCorrectLights = true;
     // renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.setClearColor(0x00000000, 0);

      //renderer.setPixelRatio(2);

      sceneRef.current = new THREE.Scene();
      const scene = sceneRef.current;

      // const camera = new THREE.PerspectiveCamera(75);
      // camera.position.set(0, 0,0);

      const camera = new THREE.OrthographicCamera(
        - renderer.domElement.width / 2,
        renderer.domElement.width / 2,
        renderer.domElement.height / 2,
        - renderer.domElement.height / 2,
        -2000,
        2000
      )
      camera.position.z = 2


      let videoBg = new VideoBackground(scene, VIDEO_WIDTH, VIDEO_HEIGHT);

      canvasRef.current.appendChild(renderer.domElement);

      const resizeCanvas = () => {
        const wrapperHeight = canvasRef.current.clientHeight;

        const aspect =
          videoRef.current.video.videoWidth /
          videoRef.current.video.videoHeight;

        renderer.setSize(
          videoRef.current.video.videoWidth,
          videoRef.current.video.videoHeight
        );
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      };

      window.addEventListener('resize', resizeCanvas);

      // environment
      const light = new THREE.HemisphereLight(0xffffff, 0xffffbb, 1);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.z = 1;
      scene.add(light);
      scene.add(directionalLight);

      //init aiModel for face mesh
      const aiModel = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });
      aiModel.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      aiModel.onResults(onResults);

      canvasRef.current.height = element.clientHeight;
      canvasRef.current.width = element.clientWidth;
      // setVIDEO_WIDTH( element.clientWidth);
      // setVIDEO_HEIGHT(element.clientHeight);

      //Init webcam
      if (
        typeof videoRef.current !== 'undefined' &&
        videoRef.current !== null
      ) {
        web_camera = new cam.Camera(videoRef.current.video, {
          onFrame: async () => {
            await aiModel.send({ image: videoRef.current.video });
          },
          width: 640,
          height: 480,
        });
        web_camera.start();
      }


      function scaleLandmark(landmark, width, height) {
        let { x, y, z } = landmark;
        return {
          ...landmark,
          x: x * width,
          y: y * height,
          z: z * width,
        }
      }


      function transformLandmarks(landmarks) {
        if (!landmarks) {
          return landmarks;
        }

        let hasVisiblity = !!landmarks.find(l => l.visibility);

        let minZ = 1e-4;

        // currently mediapipe facemesh js
        // has visibility set to undefined
        // so we use a heuristic to set z position of facemesh
        if (hasVisiblity) {
          landmarks.forEach(landmark => {
            let { z, visibility } = landmark;
            z = -z;
            if (z < minZ && visibility) {
              minZ = z
            }
          });
        } else {
          minZ = Math.max(-landmarks[234].z, -landmarks[454].z);
        }

        return landmarks.map(landmark => {
          let { x, y, z } = landmark;
          return {
            x: -0.5 + x,
            y: 0.5 - y,
            z: -z - minZ,
            visibility: landmark.visibility,
          }
        });
      }

      function updateCamera() {


        // camera need to be adjusted according to
        // renderer dimensions
        camera.aspect = VIDEO_WIDTH / VIDEO_HEIGHT;
        if (camera.type == 'OrthographicCamera') {
          camera.top = VIDEO_HEIGHT / 2
          camera.bottom = -VIDEO_HEIGHT / 2
          camera.left = -VIDEO_WIDTH / 2
          camera.right = VIDEO_WIDTH / 2
        } else {
          //  this.camera.position.z = cameraDistance(this.videoHeight, this.fov);
        }
        camera.updateProjectionMatrix();
      }

      updateCamera();


      //This function occurs for each detection results given by aiModel.
      function onResults(results) {
        var element = document.getElementById('camdiv');

        console.log(element.clientHeight, element.clientWidth);
        videoBg.setImage(results.image);
        //Checks for face in the webcam

        if (
          results.multiFaceLandmarks &&
          results.multiFaceLandmarks.length > 0
        ) {
          if (currentModelRef.current !== null) {
            // if (!firstResize) {
            //   setFirstResize(true);
            //   resizeCanvas();
            // }


            let multiFaceLandmarks = transformLandmarks(results.multiFaceLandmarks[0]);
            let landmarks = multiFaceLandmarks;
            // let width =  element.clientWidth;
            // let height = element.clientHeight;

            let width = VIDEO_WIDTH;
            let height = VIDEO_HEIGHT;


            let midEyes = scaleLandmark(landmarks[168], width, height);
            let leftEyeInnerCorner = scaleLandmark(landmarks[463], width, height);
            let rightEyeInnerCorner = scaleLandmark(landmarks[243], width, height);
            let noseBottom = scaleLandmark(landmarks[2], width, height);
            let leftEyeUpper1 = scaleLandmark(landmarks[446], width, height);
            let rightEyeUpper1 = scaleLandmark(landmarks[226], width, height);

            // position

            const piviot = currentModelRef.current;
            const model = piviot.children[0];
            //  model.scale.setScalar(1);
            model.position.set(
              midEyes.x,
              midEyes.y,
              midEyes.z,
            )

            // scale to make glasses
            // as wide as distance between
            // left eye corner and right eye corner
            const eyeDist = Math.sqrt(
              (leftEyeUpper1.x - rightEyeUpper1.x) ** 2 +
              (leftEyeUpper1.y - rightEyeUpper1.y) ** 2 +
              (leftEyeUpper1.z - rightEyeUpper1.z) ** 2
            );
            // 1.4 is width of 3d model of glasses
            const scale = eyeDist / 1.4;

            model.scale.set(scale, scale, scale);

            // use two vectors to rotate glasses
            // Vertical Vector from midEyes to noseBottom
            // is used for calculating rotation around x and z axis
            // Horizontal Vector from leftEyeCorner to rightEyeCorner
            // us use to calculate rotation around y axis
            let upVector = new THREE.Vector3(
              midEyes.x - noseBottom.x,
              midEyes.y - noseBottom.y,
              midEyes.z - noseBottom.z,
            ).normalize();

            let sideVector = new THREE.Vector3(
              leftEyeInnerCorner.x - rightEyeInnerCorner.x,
              leftEyeInnerCorner.y - rightEyeInnerCorner.y,
              leftEyeInnerCorner.z - rightEyeInnerCorner.z,
            ).normalize();

            let zRot = (new THREE.Vector3(1, 0, 0)).angleTo(
              upVector.clone().projectOnPlane(
                new THREE.Vector3(0, 0, 1)
              )
            ) - (Math.PI / 2)

            let xRot = (Math.PI / 2) - (new THREE.Vector3(0, 0, 1)).angleTo(
              upVector.clone().projectOnPlane(
                new THREE.Vector3(1, 0, 0)
              )
            );

            let yRot = (
              new THREE.Vector3(sideVector.x, 0, sideVector.z)
            ).angleTo(new THREE.Vector3(0, 0, 1)) - (Math.PI / 2);

            model.rotation.set(xRot, yRot, zRot);


          }
        }
      }

      //Render function
      function animate() {
        requestAnimationFrame(animate);
        videoBg.update();
        renderer.render(scene, camera);
      }

      animate();
    };
    methodF();
  }, []);

  async function saveScreenshot() {
    const ssCanvas = document.createElement('canvas');

    const width = videoRef.current.video.videoWidth;
    const height = videoRef.current.video.videoHeight;

    ssCanvas.width = width;
    ssCanvas.height = height;
    const ssContext = ssCanvas.getContext('2d');

    ssContext.translate(width, 0);
    ssContext.scale(-1, 1);

    var img = document.getElementById("threejsCanvas");

    ssContext.drawImage(img.children[0], 0, 0);
    //ssContext.drawImage(videoRef.current.video, 0, 0);

    if (faceCenter) {
      const gx = faceCenter.x * width - width / 2;
      const gy = faceCenter.y * height - height / 2;
      ssContext.drawImage(
        rendererRef.current.domElement,
        gx,
        gy,
        width,
        height
      );
    }

    return ssCanvas.toDataURL('image/png');
  }

  // the div's height is 100% - the bottom overlay height
  const Component = (
    <>
      <div id="camdiv" className="row" style={{ height: '480px' }}>
        <Webcam
          ref={videoRef}
          name="webcame"
          id="webcamid"
          screenshotFormat="image/jpeg"
          mirrored
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            objectFit: 'cover',
            paddingLeft: '0px',
            paddingRight: '0px',
            left: 0,
            right: 0,
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
          }}
        />
        <div
          name="threed"
          ref={canvasRef}
          id="threejsCanvas"
          style={{
            paddingLeft: '0px',
            paddingRight: '0px',
            // opacity: 0.3,
            position: 'absolute',
            left: canvasLeft,
            top: canvasTop,
            right: 0,
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
          }}
        />
      </div>
    </>
  );

  return [Component, saveScreenshot];
}
