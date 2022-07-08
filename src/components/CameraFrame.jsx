import React from 'react';
import styled from 'styled-components';
import { MdOpenWith, MdDelete, MdCameraAlt } from 'react-icons/md';
import './custom.css';
import ThreeCanvas from './ThreeCanvas_glass';
import { Typography } from '@material-ui/core';

const Frame = styled.div`
  width: 100%;
  max-width: 560px;
  border: none;
  position: relative;
  border-radius: 8%;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
  border-top: 4px solid #fc5680;
`;

const BottomOverlay = styled.div`
  background-color: white;
  /* position: absolute; */
  width: 100%;
  z-index: 100;
  height: 75px;
  color: white;
  text-align: center;
  font-size: 14px;

  /* opacity: 0; */
  display: flex;
  justify-content: space-around;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
`;

const Button = styled.div`
  cursor: pointer;
  transition: 0.1s ease all;
  &:hover {
    color: #ccc;
  }
`;

const CameraButton = styled.div`
  background: #007cc5;
  border: none;
  box-sizing: border-box;
  box-shadow: 0px 16px 32px rgba(79, 79, 79, 0.25);

  cursor: pointer;

  width: 50px;
  height: 50px;
  border-radius: 100px;

  transform: translateY(-50%);

  transition: 0.1s ease all;
  &:hover {
    filter: brightness(0.8);
  }
  position: absolute;
  left: 50%;
  top: -25px;
  transform: translateX(-50%);
`;

export default function CameraFrame({ setScreenshots }) {
  const [ThreeCanvasComponent, saveScreenshot, removeFrame] = ThreeCanvas();

  const newScreenshot = async () => {
    const screenshot = await saveScreenshot();
    setScreenshots((old) => [...old, screenshot]);
  };

  const remove = () => {
    removeFrame();
  };

  return (
    <Frame className="shadow-sm col p-0 m-0" id="cam-frame">
      {ThreeCanvasComponent}

      <div className="row">
        <BottomOverlay>
          <div className="row align-items-center w-100 position-relative justify-content-between">
            <Button
              className="col-4 d-flex flex-column align-items-center"
              style={{ color: 'black' }}
            >
              <div className="row">
                <MdOpenWith color="#007cc5" size="25px" />
              </div>
              <div className="row">
                <Typography variant="body2">Frame position</Typography>
              </div>
            </Button>
            <CameraButton
              className="row align-items-center d-flex flex-column justify-content-center"
              onClick={newScreenshot}
            >
              <div style={{ marginLeft: '-24px' }}>
                <MdCameraAlt size="25px" color="white" />
              </div>
            </CameraButton>
            <Button
              onClick={remove}
              className="col-4 d-flex flex-column align-items-center"
              style={{ color: 'black' }}
            >
              <div className="row">
                <MdDelete color="red" size="25px" />
              </div>
              <div className="row">
                <Typography variant="body2">Remove frame</Typography>
              </div>
            </Button>
          </div>
        </BottomOverlay>
      </div>
    </Frame>
  );
}
