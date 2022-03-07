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

// import * as facemesh from "@tensorflow-models/face-landmarks-detection";
// import * as tf from "@tensorflow/tfjs";
// import * as Facemesh from "@mediapipe/face_mesh";

import { FaceMesh } from "@mediapipe/face_mesh";//New Face detect lib that we are using.
import * as cam from "@mediapipe/camera_utils";
import ModelStore from "../stores/ModelStore";
import Webcam from "react-webcam";

const isVideoPlaying = (vid) =>
  !!(vid.currentTime > 0 && !vid.paused && !vid.ended && vid.readyState > 2);

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
  const [VIDEO_WIDTH, setVIDEO_WIDTH] = useState(640);
  const [VIDEO_HEIGHT, setVIDEO_HEIGHT] = useState(480);
  const [firstResize, setFirstResize] = useState(false);

  var positionBuff=0;
  var rotationPBuff=0;
  var rotationRBuff=0;
  var rotationYBuff=0;


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
      piviot.name = "parentPiviot";
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
      canvasRef.current.innerHTML = "";
      // setVIDEO_WIDTH(element.clientWidth);
      // setVIDEO_HEIGHT(element.clientHeight)
      console.log(element.clientHeight,element.clientWidth);
      // init renderer
      rendererRef.current = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: true,
      });
      const renderer = rendererRef.current;
      renderer.setSize(
        element.clientWidth,
        element.clientHeight
      );
      renderer.domElement.style.transform = " scaleX(-1)";

      renderer.physicallyCorrectLights = true;
      // renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.setClearColor(0x000000, 0);

      renderer.setPixelRatio(2);

      sceneRef.current = new THREE.Scene();
      const scene = sceneRef.current;

      const camera = new THREE.PerspectiveCamera(75);
      camera.position.set(0, 0, 50);

      canvasRef.current.appendChild(renderer.domElement);

      const resizeCanvas = () => {
        const wrapperHeight = canvasRef.current.clientHeight;

        const aspect =    videoRef.current.video.videoWidth /   videoRef.current.video.videoHeight;

        renderer.setSize(
          videoRef.current.video.videoWidth,
          videoRef.current.video.videoHeight        );
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      };

      window.addEventListener("resize", resizeCanvas);
     

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

      canvasRef.current.height=element.clientHeight;
      canvasRef.current.width=element.clientWidth;
    // setVIDEO_WIDTH( element.clientWidth);
    // setVIDEO_HEIGHT(element.clientHeight);
 
      //Init webcam
      if (
        typeof videoRef.current !== "undefined" &&
        videoRef.current !== null
      ) {
        web_camera = new cam.Camera(videoRef.current.video, {
          onFrame: async () => {
            await aiModel.send({ image: videoRef.current.video });
          },
          width:  VIDEO_WIDTH,
          height:VIDEO_HEIGHT,
        });
        web_camera.start();
      }
     
      //This function occurs for each detection results given by aiModel.
      function onResults(results) {
   
        var element = document.getElementById('camdiv');

      console.log(element.clientHeight,element.clientWidth);

      //Checks for face in the webcam

        if (
          results.multiFaceLandmarks &&
          results.multiFaceLandmarks.length > 0
        ) {
          if (currentModelRef.current !== null) {
            if(!firstResize){
              setFirstResize(true);
              resizeCanvas();
            }
            let bufferPostVal ;
            let offsetLeft= videoRef.current.video.clientWidth-videoRef.current.video.videoWidth;
            offsetLeft=offsetLeft/2;
            let offsetTop= videoRef.current.video.clientHeight-videoRef.current.video.videoHeight;
            offsetTop=offsetTop/2;

            offsetLeft+=videoRef.current.video.offsetLeft;
            offsetTop+= videoRef.current.video.offsetTop;
            const piviot = currentModelRef.current;
            const model = piviot.children[0];
            //console.log(model);
            model.scale.setScalar(1);
            let vvheight= videoRef.current.video.videoHeight;
            vvheight-=offsetTop;
            // Position
            {
              let center8 = results.multiFaceLandmarks[0][8];// Forehead center point
              setCanvasLeft((-center8.x * videoRef.current.video.videoWidth + videoRef.current.video.videoWidth / 2)+offsetLeft);
              let top = center8.y *vvheight - vvheight / 2;
             // console.log((positionBuff-top).abs());
              if((positionBuff-top) > 0.05){
                setCanvasTop(top);
              }
              positionBuff = top;
            }

            // Rotation
            {
              const noseBottom = results.multiFaceLandmarks[0][164];
              const betweenEyes = results.multiFaceLandmarks[0][168];

              let centerpoint = results.multiFaceLandmarks[0][8];// Forehead center point
              var V2 = new THREE.Vector3(
                centerpoint.x,
                centerpoint.y,
                centerpoint.z
              );
              
              //Calculation of Pitch angle(face up and down)
              const pitchangle = Math.atan2(
                noseBottom.z - betweenEyes.z,
                noseBottom.y - betweenEyes.y
              );
              //console.log(rotationPBuff - pitchangle);
              //if((rotationPBuff - pitchangle)>0.05){
                model.rotation.x = pitchangle; //pitch
              //   rotationPBuff = pitchangle;
              // }
              // console.log(radians_to_degrees(pitchangle));
              
              //Calculation of Yaw angle(face turn left and right)
              let righteyep = results.multiFaceLandmarks[0][33];
              var V2yaw = new THREE.Vector3(
                righteyep.x,
                righteyep.y,
                righteyep.z
              );

              const noseTop = results.multiFaceLandmarks[0][8];
              const RightEyeEnd = results.multiFaceLandmarks[0][46];
              const yawangle =
                Math.atan2(
                  noseTop.z - RightEyeEnd.z,
                  noseTop.x - RightEyeEnd.x
                ) + 0.296706;

              //if((yawangle - rotationYBuff).abs> 0.005)
              {
              model.rotation.y = yawangle; //yaw
              rotationYBuff = yawangle;
              }
              if(yawangle<-0.2)
              {
                model.children[1].visible = true;
                model.children[2].visible = false;

              }
              else if(yawangle > 0.2)  {
                model.children[1].visible = false;
                model.children[2].visible = true;                
              }
              //Calculation of Roll angle(face tilt left and right)
              const zangle =
                1.93732 -
                Math.atan2(
                  noseBottom.y - betweenEyes.y,
                  noseBottom.x - betweenEyes.x
                ) *
                  1.2;
              
              //if((rotationRBuff - zangle)>0.25){
              model.rotation.z = zangle; //roll
              // rotationRBuff = zangle;
              // }

              //Scaling of glass
              {
                var noseBottom3 = new THREE.Vector3(
                  noseBottom.x,
                  noseBottom.y,
                  noseBottom.z
                );
                var betweenEyes3 = new THREE.Vector3(
                  betweenEyes.x,
                  betweenEyes.y,
                  betweenEyes.z
                );
                let distanceScale = noseBottom3.distanceTo(betweenEyes3);
                distanceScale *= 9;

                model.scale.setScalar(distanceScale);
              }
            }
          }
        }
      }

      //Render function
      function animate() {
        requestAnimationFrame(animate);

        renderer.render(scene, camera);
      }

      animate();
    };
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
       <div id="camdiv" className="row" style={{ height: "480px" }}>

      <Webcam
        ref={videoRef}
        name="webcame"
        id="webcamid"
        mirrored
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "center",
          objectFit: "cover",
          paddingLeft: "0px",
          paddingRight: "0px",
          left: 0,
          right: 0,
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
        }}
      />
      <div
      name="threed"
        ref={canvasRef}
        style={{
          paddingLeft: "0px",
          paddingRight: "0px",
          // opacity: 0.3,
          position: "absolute",
          left: canvasLeft,
          top: canvasTop,
          right: 0,
          width:VIDEO_WIDTH,
          height:VIDEO_HEIGHT,
        }}
      />
         </div>
    </>
  );

  return [Component, saveScreenshot];
}
