import { useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

import GlassesCard from "./components/GlassesCard";
import ImageCard from "./components/ImageCard";
import CameraFrame from "./components/CameraFrame";

import backgroundImage from "./assets/images/468 1.png";
import glassesImage from "./assets/images/FR_rayban_justin_noir_bleuMirroir 1.png";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: Roboto;
    background: url("${backgroundImage}") no-repeat center center fixed;
    background-size: cover;
    height: 100%;
  }
`;

const Header = styled.h1`
  font-weight: bold;
  font-size: 48px;
  color: #373737;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  text-align: center;
`;

const ScrollContainer = styled.div`
  height: 80vh;
  overflow-y: scroll;
`;

function App() {
  const [screenshots, setScreenshots] = useState([]);

  return (
    <>
      <GlobalStyle />
      <div className="App">
        <div className="container mt-3">
          <div className="row">
            <Header>
              Find your style, <span style={{ color: "red" }}>Try it on!</span>
            </Header>
          </div>
          <div className="row justify-content mt-2">
            <div className="col">
              <ScrollContainer className="row justify-content-end">
                <GlassesCard
                  name="Ray-Ban JUSTIN - BLACK RUBBER Frame GREEN MIRROR BLUE Lenses"
                  price="$99"
                  image={glassesImage}
                />
                <GlassesCard
                  name="Ray-Ban JUSTIN - BLACK RUBBER Frame GREEN MIRROR BLUE Lenses"
                  price="$99"
                  image={glassesImage}
                />
                <GlassesCard
                  name="Ray-Ban JUSTIN - BLACK RUBBER Frame GREEN MIRROR BLUE Lenses"
                  price="$99"
                  image={glassesImage}
                />
                <GlassesCard
                  name="Ray-Ban JUSTIN - BLACK RUBBER Frame GREEN MIRROR BLUE Lenses"
                  price="$99"
                  image={glassesImage}
                />
              </ScrollContainer>
            </div>
            <div className="col">
              <CameraFrame setScreenshots={setScreenshots} />
            </div>
            <div className="col">
              <div className="row justify-content-start">
                <ScrollContainer className="col" style={{ maxWidth: "250px" }}>
                  {screenshots.map((screenshot, index) => (
                    <ImageCard
                      key={index}
                      image={screenshot}
                      deleteScreenshot={() => {
                        const old = [...screenshots];
                        old.splice(index, 1);
                        setScreenshots(old);
                      }}
                    />
                  ))}
                </ScrollContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
