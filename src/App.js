import { useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import GlassesCard from "./components/GlassesCard";
import ImageCard from "./components/ImageCard";
import CameraFrame from "./components/CameraFrame";
import ModelStore from "./stores/ModelStore";
import useWindowSize from "./lib/useWindowSize";
import backgroundImage from "./assets/images/468 1.png";
import { Typography } from "@material-ui/core";
import img from "./assets/previews/ray glasses test 13 black.png";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: Roboto;
    background: url("${backgroundImage}") no-repeat center center fixed;
    background-size: cover;
    height: 100%;
  }

  .row {
    margin: 0 !important;
  }

  .ml-40 {
    margin-left: -40px !important;
  }

  .m-40 {
    margin-left: 40px !important;
  }

  canvas {
    border-radius: 10px;
  }

  .active {
    border: 1px solid #007cc5
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
  width: 100%;
  padding: 12px;
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
    state.pairs = models.map((model, index) => {
      return {
        preview: previews[index].default,
        model: model.default,
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
  const [current, setCurrent] = useState(0);

  const [preview, setPreview] = useState(
    {
      img: img,
      price: "$99",
      description: `Ray-Ban Aviator Gradient sunglasses encompass the teardrop shape that started it all.
      Originally designed for U.S. aviators, the Aviator Sunglasses design has become an icon.
      The gradient lenses are nicely toned and give a cool effect to what is considered the sunglass that shaped entire cult movements.`
    }
  );
  const getNameFromImg = (img) => {
    const a = img.split("/");
    return a[a.length - 1].split(".")[0];
  };

  return (
    <>
      <GlobalStyle />
      <div className="App" style={{ marginLeft: '50px', marginRight: '50px' }}>
        <div className="mt-4">
          <div className="" style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Typography variant="h7" className="">
              Glasses
            </Typography>
            <Typography variant="h6" className="font-weight-bold">
              Find your style, Try it now!
            </Typography>
            <Typography variant="h7" className="">
              Pictures
            </Typography>
          </div>
          <div className="row">
            <div className="col-9 p-0 m-0">
              <div className="row w-100">

                <div
                  className="col-4 p-0 m-0 m-40"
                  style={{
                    minHeight: "530px",
                    borderTop: "4px solid #44b5c2",
                    borderRadius: "8%",
                    background: "white",
                  }}
                >
                  <GlassesCard
                    image={preview?.img ?? ''}
                    name={preview?.img ? getNameFromImg(preview.img) : ''}
                    price={preview?.price ?? ''}
                    description={preview?.description ?? ''}
                    onClick={() => {
                      ModelStore.update((state) => {
                        state.currentModelIndex = 0;
                      });
                      setCurrent(0)
                    }}
                  />
                </div>
                <div
                  className="col-8 p-0 m-0 ml-40"
                  style={{
                    justifyContent: "center",
                    display: "flex",
                    minHeight: "530px",
                  }}
                >
                  <CameraFrame setScreenshots={setScreenshots} />
                </div>
              </div>
            </div>
            <div
              className="col-3 p-0 m-0 ml-40"
              style={{
                borderTop: "4px solid #44b5c2",
                borderRadius: "8%",
                padding: "8px !important",
                background: "white",
              }}
            >
              <div className="row justify-content-center">
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
