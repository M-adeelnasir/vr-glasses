import styled from 'styled-components';
import useWindowSize from '../lib/useWindowSize';

const Container = styled.div`
  border-radius: 10px;
  margin-top: 10px;
  width: 95%;
  /* max-width: 280px; */
  /* min-width: 200px;
  margin-bottom: 10px;
  margin-right: 10px;
  margin-top: 10px;
  @media (min-width: 1201px) {
    margin-right: -10px;
    margin-bottom: 10px;
  } */
`;

const PriceText = styled.p`
  font-weight: bold;
  font-size: 1.9em;
  text-align: left;
  padding: 0px;
  margin: 0px;
`;
const DescriptionText = styled.p`
  font-size: 0.8em;
  text-align: left;
  padding: 10px;
  margin: 0px;
`;

export default function GlassesCard({ image, name, price, ...props }) {
  const windowWidth = useWindowSize().width;

  return (
    <Container
      className="container shadow-sm d-flex flex-column justify-content-center p-2"
      {...props}
    >
      <div className="row">
        <div className="col-8">
          <img src={image} className="img-fluid" />
        </div>
        <div className="col">
          <div className="h-100 d-flex justify-content-end">
            <PriceText className="align-self-center">{price}</PriceText>
          </div>
        </div>
      </div>
      <div className="row text-center">
        <p className="mt-4" style={{ fontSize: '1.2em' }}>
          {windowWidth <= 1200 ? name.split(' ')[0] : name}
        </p>
      </div>
      <div>
        <DescriptionText>{props.description}</DescriptionText>
      </div>
    </Container>
  );
}
