import styled from "styled-components";

const Card = styled.div`
  background-color: white;
  width: 290px;
  font-size: 14px;
  padding: 5px;
  margin: 10px 0px;

  p,
  h1 {
    margin: 0;
  }
`;

export default function GlassesCard({ name, price, image }) {
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
        <p>{name}</p>
      </div>
    </Card>
  );
}
