import styled from "styled-components";
import useWindowSize from "../lib/useWindowSize";

const Card = styled.div`
  background-color: white;
  width: 280px;
  font-size: 14px;
  padding: 10px;
  margin: 10px;

  border-radius: 10px;
  box-shadow: 0px 0px 2px 2px rgba(0, 0, 0, 0.1);

  p,
  h1 {
    margin: 0;
  }

  h1 {
    font-size: 2em;
  }
`;

export default function GlassesCard({ name, price, image }) {
  const windowSize = useWindowSize();

  return (
    <Card className="container">
      <div className="row">
        <div className="col">
          <img style={{ width: "auto", height: "105px" }} src={image} alt={name} />
        </div>
        <div className="col align-self-center">
          <h1 style={{ fontWeight: "bold", textAlign: "right" }}>{price}</h1>
        </div>
      </div>
      <div className="row">
        <p>{windowSize.width <= 1200 ? name.split(" ")[0] : name}</p>
      </div>
    </Card>
  );
}
