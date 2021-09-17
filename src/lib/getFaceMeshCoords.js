export default function getFaceMeshCoords(face) {
  if (face.length == 0) {
    return [];
  }

  // we only need one face
  const keypoints = face[0].scaledMesh;

  const points = [
    // left eye
    {
      x: keypoints[145][0],
      y: keypoints[145][1],
      z: keypoints[145][2],
    },
    // right eye
    {
      x: keypoints[174][0],
      y: keypoints[174][1],
      z: keypoints[174][2],
    },
    // center
    {
      x: keypoints[6][0],
      y: keypoints[6][1],
      z: keypoints[6][2],
    }
  ];

  // if (i == 68) {
  // const p = {
  // x: keypoints[i][0],
  // y: keypoints[i][1],
  // z: keypoints[i][2],
  // };
  // points.push(p);
  // }
  // if (i == 8) {
  // const p = {
  // x: keypoints[i][0],
  // y: keypoints[i][1],
  // z: keypoints[i][2],
  // };
  // points.push(p);
  // }
  // if (i == 356) {
  // const p = {
  // x: keypoints[i][0],
  // y: keypoints[i][1],
  // z: keypoints[i][2],
  // };
  // points.push(p);
  // }
  // if (i == 127) {
  // const p = {
  // x: keypoints[i][0],
  // y: keypoints[i][1],
  // z: keypoints[i][2],
  // };
  // points.push(p);
  // }

  return points;
}
