import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeCanvas() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  const rendererRef = useRef(null);

  useEffect(() => {
    if (!videoRef || !canvasRef) {
      return;
    }

    // first, we clear the previous scene
    canvasRef.current.innerHTML = "";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, -0.0, 1.3);
    rendererRef.current = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
    });

    const renderer = rendererRef.current;

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

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    plane.scale.set(-1, 1, 1);
    scene.add(plane);

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
