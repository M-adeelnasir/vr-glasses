import { useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

import GlassesCard from "./components/GlassesCard";
import ImageCard from "./components/ImageCard";
import CameraFrame from "./components/CameraFrame";

import ModelStore from "./stores/ModelStore";

import useWindowSize from "./lib/useWindowSize";

import backgroundImage from "./assets/images/468 1.png";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: Roboto;
    background: url("${backgroundImage}") no-repeat center center fixed;
    background-size: cover;
    height: 100%;
  }

  canvas {
    border-radius: 10px;
  }
`;

const Header = styled.h1`
  font-weight: bold;
  font-size: 48px;
  color: #373737;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  text-align: center;

  @media (max-width: 1200px) {
    font-size: 2em;
  }
`;

const ScrollContainer = styled.div`
  max-height: 80vh;
  overflow: scroll;

  @media (max-width: 1200px) {
    height: auto;

    display: flex;
    flex-direction: row;
  }

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

function loadModelsAndPreviews() {
  function importAll(r) {
    return r.keys().map(r);
  }

  const previews = importAll(require.context("./assets/previews/", false, /\.(png)$/));
  const models = importAll(require.context("./assets/models/", false, /\.(glb)$/));

  ModelStore.update((state) => {
    state.pairs = previews.map((img, index) => {
      return {
        preview: img.default,
        model: models[index].default,
      };
    });
  });
}

function App() {
  loadModelsAndPreviews();

  const [screenshots, setScreenshots] = useState([]);

  const glassesPreviews = ModelStore.useState((state) => state.pairs).map((pair) => pair.preview);
  const currentModelIndex = ModelStore.useState((state) => state.currentModelIndex);

  const windowSize = useWindowSize();

  const getNameFromImg = (img) => {
    const a = img.split("/");
    return a[a.length - 1].split(".")[0];
  };

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
          <div className="row mt-2 row-cols-xl-3 row-cols-1">
            <div className="row">
              <ScrollContainer
                className={windowSize.width >= 1200 ? "row justify-content-end" : ""}
              >
                {glassesPreviews.map((img, index) => (
                  <GlassesCard
                    key={index}
                    image={img}
                    name={getNameFromImg(img)}
                    price="$99"
                    style={currentModelIndex === index ? { border: "1px solid blue" } : null}
                    onClick={() => {
                      ModelStore.update((state) => {
                        state.currentModelIndex = index;
                      });
                    }}
                  />
                ))}
              </ScrollContainer>
            </div>
            <div className="col" style={{ minHeight: "80vh" }}>
              <CameraFrame setScreenshots={setScreenshots} />
            </div>
            <div className="col">
              <div className="row">
                <ScrollContainer>
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
