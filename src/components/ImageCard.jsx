import styled from "styled-components";
import { MdDelete, MdShare } from "react-icons/md";
import { useState } from "react";

const IconButton = styled.div`
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;

  background-color: white;
  border-radius: 40px;
  transition: 0.1s ease all;

  &:hover {
    background-color: #eee;
    cursor: pointer;
  }
`;

const Container = styled.div`
  position: relative;
  min-width: 210px;
  max-width: 210px;
  height: 230px;
  background-image: url("${(props) => props.image}");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;

  border-radius: 10px;

  margin-bottom: 10px;

  @media (max-width: 1200px) {
    margin-top: 10px;
    margin-right: 10px;
  }
`;

export default function ImageCard({ image, deleteScreenshot }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Container
      className="shadow-sm"
      image={image}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      <div style={{ opacity: hovered ? 1 : 0, transition: "0.1s ease all" }}>
        <IconButton
          style={{ position: "absolute", top: 10, right: 10 }}
          onClick={() => deleteScreenshot()}
        >
          <MdDelete size="20px" />
        </IconButton>
        <IconButton style={{ position: "absolute", bottom: 10, right: 10 }}>
          <MdShare size="20px" />
        </IconButton>
      </div>
    </Container>
  );
}
