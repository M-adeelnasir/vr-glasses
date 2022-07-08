import styled from 'styled-components';
import { MdDelete, MdShare } from 'react-icons/md';
import { useState } from 'react';
import { TwitterShareButton } from 'react-share';
import axios from 'axios';
import { useEffect } from 'react';
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
  max-width: 100%;
  height: 230px;
  background-image: url('${(props) => props.image}');
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
  const [share, setShare] = useState();
  const ImageHoster = async (base64uri) => {
    const URL = `https://api.imgbb.com/1/upload`;
    const KEY = `8958e49304a13b68338f70ec8097b5cf`;
    let fd = new FormData();
    let file_to_upload = dataURLtoFile(base64uri, 'SecomindAwesomeRayban.png');
    fd.append('image', file_to_upload);
    const response = await axios({
      method: 'post',
      url: URL,
      data: fd,
      params: {
        key: KEY,
      },
    });
    return response;
  };

  function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  useEffect(() => {
    ImageHoster(image).then((res) => {
      setShare(res.data.data.display_url);
    });
  }, []);

  return (
    <Container
      className="shadow-sm"
      image={image}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      <div style={{ opacity: hovered ? 1 : 0, transition: '0.1s ease all' }}>
        <IconButton
          style={{ position: 'absolute', top: 10, right: 10 }}
          onClick={() => deleteScreenshot()}
        >
          <MdDelete size="20px" />
        </IconButton>
        <IconButton style={{ position: 'absolute', bottom: 10, right: 10 }}>
          {/* <MdShare size="20px" /> */}
          <TwitterShareButton
            url={`Hey Everyone checkout my new rayban ${share}`}
          >
            <MdShare size="20px" />
          </TwitterShareButton>
        </IconButton>
      </div>
    </Container>
  );
}
