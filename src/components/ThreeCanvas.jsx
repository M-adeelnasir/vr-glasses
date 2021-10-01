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
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs";

import ModelStore from "../stores/ModelStore";

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
  const currentface = useRef(null);
  const [models, setModels] = useState(null);
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
      // model.rotation.y = -Math.PI / 4;
      // currentModelRef.current = model;
      // currentModelRef.current.scale.set(new THREE.Vector3(2));
     let piviot = new THREE.Group();
     piviot.name="parentPiviot";
      piviot.add(model);
      currentModelRef.current = piviot;
    //  setPiviot(piviotObj)
      sceneRef.current.add( piviot);
    }
  }, [currentModelIndex]);

  useEffect( () => {
    const methodF=async()=>{

  
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

    renderer.domElement.style.transform = "translateX(-25%) scaleX(-1)";

    renderer.physicallyCorrectLights = true;
    // renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000);

    renderer.setPixelRatio(2);

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

    const aiModel = await facemesh.load(
      facemesh.SupportedPackages.mediapipeFacemesh,
      {
        detectorModelUrl: "./models/1/model.json",
        modelUrl: "./models/2/model.json",
        irisModelUrl: "./models/3/model.json",
      }
    );

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
      newPoint.y /= h;

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
      // console.log("DETECT");
      if (currentModelRef.current !== null && faces.length > 0) {
        const piviot = currentModelRef.current;
        const model = piviot.children[0];

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);

        const points = faces[0].annotations;
        if (currentface.current) {
          sceneRef.current.remove(currentface.current);
        }
        var positions = [];

        // var dotGeometry = new THREE.BufferGeometry();
     
        // for ( var i = 0; i < faces[0].scaledMesh.length; i ++ ) {
        // positions.push(faces[0].scaledMesh[i][0]);
        // positions.push(faces[0].scaledMesh[i][1]);
        // positions.push(faces[0].scaledMesh[i][2]);
        //   // dotGeometry.vertices.push( new THREE.Vector3(faces[0].scaledMesh[i][0], faces[0].scaledMesh[i][1], faces[0].scaledMesh[i][2]) );
        // }

        // dotGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        // dotGeometry.verticesNeedUpdate = true;
        // dotGeometry.elementsNeedUpdate = true;
        // dotGeometry.computeBoundingSphere();
        // dotGeometry.computeVertexNormals();

        // var meshMaterial = new THREE.MeshBasicMaterial( {color: 0xff0000,} );

        //         var mesh = new THREE.Mesh( dotGeometry, meshMaterial );
        //         mesh.scale.setScalar(0.001);
        //         currentface.current=mesh;
        //         sceneRef.current.add( mesh );
        // FIND POSITION
        const betweenEyes = convertPoint({
          x: points.midwayBetweenEyes[0][0],
          y: points.midwayBetweenEyes[0][1],
          z: points.midwayBetweenEyes[0][2],
        });

        let nosetop= faces[0].scaledMesh[168];
        let nosebottom =faces[0].scaledMesh[6];
        const nosetop3 = new THREE.Vector3(nosetop[0],nosetop[1],nosetop[2]);
        const nosebottom3 = new THREE.Vector3(nosebottom[0],nosebottom[1],nosebottom[2]);
        let nosesubtracted =nosetop3.clone().sub(nosebottom3);
        nosetop3.y-= nosesubtracted.y/2;
        // model.position.set(betweenEyes.x, -betweenEyes.y - size.y * 0.85, -betweenEyes.z);
        // model.position.set(0, 0  , 0 );
        // let zval=(-betweenEyes.z*0.01)-0.4;
        // let zval=betweenEyes.z;
        let x=faces[0].mesh[10][0]  ;//betweenEyes.x;
        let y=faces[0].mesh[10][1] ;// -(betweenEyes.y*0.5)- (size.y);
        let z=faces[0].mesh[10][2] ;//(-betweenEyes.z*0.001)4
        // z =-z;
        x*=0.01;
        y*=0.01;
        z*=0.01;
        x-=1;
        y=-y;
        y= -betweenEyes.y - size.y * 0.85;//-(betweenEyes.y)- (0.1);
        x=betweenEyes.x;;
        z=(-betweenEyes.z*0.001)
        // z*=0.001;
        // console.log(z);
        // piviot.position.set(0, 0 ,0.5);
        piviot.position.set(x, y ,0);
        // console.log( model.position.z);
        // model.position.set(betweenEyes.x, 0  , 0);
        // FIND SCALE
        const leftEyeUpper1 = convertPoint({
          x: points.leftEyeUpper1[3][0],
          y: points.leftEyeUpper1[3][1],
          z: points.leftEyeUpper1[3][2],
        });
        const rightEyeUpper1 = convertPoint({
          x: points.rightEyeUpper1[3][0],
          y: points.rightEyeUpper1[3][1],
          z: points.rightEyeUpper1[3][2],
        });

        const eyeDistance = Math.sqrt(
          (leftEyeUpper1.x - rightEyeUpper1.x) ** 2,
          (leftEyeUpper1.y - rightEyeUpper1.y) ** 2,
          (leftEyeUpper1.z - rightEyeUpper1.z) ** 2
        );
        // 0.1 --> 0.9
        // console.log(-zval*30);
        // model.scale.setScalar(25- (-zval*30));
        model.scale.setScalar(eyeDistance * 34);
        // model.scale.setScalar(5);
         let top= faces[0].scaledMesh[8]; //10
         let bottom =faces[0].scaledMesh[6]; //152
         const top3 = new THREE.Vector3(top[0],top[1],top[2]);
         const bottom3 = new THREE.Vector3(bottom[0],bottom[1],bottom[2]);
         console.log(top3,bottom3);
         let subtracted =top3.sub(bottom3);
         subtracted.normalize();
        //  console.log(subtracted);
// const zangle =
//           Math.PI / 2 -
//           Math.atan2(
//             noseBottom.y - betweenEyes.y,
//             noseBottom.x - betweenEyes.x
//           );
model.rotation.x = -(Math.PI / 2)  -subtracted.y; //pitch


        // model.rotation.z =  -subtracted.x;

        let right= faces[0].scaledMesh[263];
        let left =faces[0].scaledMesh[33];
        const right3 = new THREE.Vector3(right[0],right[1],right[2]);
        const left3 = new THREE.Vector3(left[0],left[1],left[2]);
      
        let subtractedeye =right3.sub(left3);
        subtractedeye.normalize();
        // console.log(right3,left3);
        // piviot.rotation.z =  -subtractedeye.y; //roll
        // piviot.rotation.y =   subtractedeye.z; //yaw

        // // FIND ROTATION
        const noseBottom = convertPoint({
          x: points.noseBottom[0][0],
          y: points.noseBottom[0][1],
          z: points.noseBottom[0][2],
        });

        const zangle =
          Math.PI / 2 -
          Math.atan2(
            noseBottom.y - betweenEyes.y,
            noseBottom.x - betweenEyes.x
          );
        // model.rotation.z = zangle;
        // model.position.y += mapVal(Math.abs(zangle), 0, 1, 0, size.y);
        // model.scale.multiplyScalar(mapVal(Math.abs(zangle), 0, 1, 1, 1.6));

        // const diff = noseBottom.z - betweenEyes.z;
        // // 0 --> 20
        // if (diff > 0) {
        //   model.position.y += mapVal(diff, 0, 20, 0, size.y / 3);
        // }
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      if (aiModel && currentModelRef.current) {
        // hide the model when detecting the face so it doesn't interfere
        currentModelRef.current.visible = false;

        // I think I need to render the scene twice, once with the face and once with the models, this way I can detect the faces from the canvas without the model interfering
        renderer.render(scene, camera);
        detect(aiModel);

        currentModelRef.current.visible = true;
      }

      renderer.render(scene, camera);
    }

    animate();
  }
  methodF();
  }, []);

  function saveScreenshot() {
    const strMime = "image/jpeg";
    const imgData = rendererRef.current.domElement.toDataURL(strMime);
    return imgData;
  }

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
