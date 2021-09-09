import styled from "styled-components";
import { MdOpenWith, MdDelete, MdCameraAlt } from "react-icons/md";
import ThreeCanvas from "./ThreeCanvas";

const Frame = styled.div`
  background: #eaeaea;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  width: 100%;
  height: 100%;
  border: 10px solid white;
  position: relative;
`;

const BottomOverlay = styled.div`
  background-color: black;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  color: white;
  text-align: center;
  font-size: 14px;

  display: flex;
  justify-content: space-around;
`;

const Button = styled.div`
  cursor: pointer;
  transition: 0.1s ease all;
  &:hover {
    color: #ccc;
  }
  margin-top: 15px;
`;

const CameraButton = styled.div`
  background: #007cc5;
  border: 2px solid #ffffff;
  box-sizing: border-box;
  box-shadow: 0px 16px 32px rgba(79, 79, 79, 0.25);

  cursor: pointer;

  width: 100px;
  height: 100px;
  border-radius: 100px;

  transform: translateY(-50%);

  transition: 0.1s ease all;
  &:hover {
    filter: brightness(0.8);
  }
`;

export default function CameraFrame({ setScreenshots }) {
  const [ThreeCanvasComponent, saveScreenshot] = ThreeCanvas();

  const newScreenshot = () => {
    const screenshot = saveScreenshot();
    setScreenshots((old) => [...old, screenshot]);
  };

  return (
    <Frame>
      {ThreeCanvasComponent}
      <BottomOverlay className="container">
        <div className="row align-items-center w-100">
          <Button className="col">
            <div className="row">
              <MdOpenWith size="25px" />
            </div>
            <div className="row">
              <p>Frame position</p>
            </div>
          </Button>
          <CameraButton className="row align-items-center" onClick={newScreenshot}>
            <MdCameraAlt size="50px" color="white" />
          </CameraButton>
          <Button className="col">
            <div className="row">
              <MdDelete size="25px" />
            </div>
            <div className="row">
              <p>Remove frame</p>
            </div>
          </Button>
        </div>
      </BottomOverlay>
    </Frame>
  );
}
