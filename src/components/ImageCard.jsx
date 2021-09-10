import styled from "styled-components";
import { MdDelete, MdShare } from "react-icons/md";

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
  box-shadow: 0px 0px 4px 4px rgba(0, 0, 0, 0.1);

  border-radius: 10px;

  margin: 10px;
`;

export default function ImageCard({ image, deleteScreenshot }) {
  return (
    <Container image={image}>
      <IconButton
        style={{ position: "absolute", top: 10, right: 10 }}
        onClick={() => deleteScreenshot()}
      >
        <MdDelete size="20px" />
      </IconButton>
      <IconButton style={{ position: "absolute", bottom: 10, right: 10 }}>
        <MdShare size="20px" />
      </IconButton>
    </Container>
  );
}