export default function getFaceMeshCoords(face) {
  if (face.length == 0) {
    return [];
  }

  // we only need one face
  const keypoints = face[0].scaledMesh;

  const points = [
    // left ear
    {
      x: keypoints[127][0],
      y: keypoints[127][1],
      z: keypoints[127][2],
    },
    // right ear
    {
      x: keypoints[356][0],
      y: keypoints[356][1],
      z: keypoints[356][2],
    },
    // center
    {
      x: keypoints[168][0],
      y: keypoints[168][1],
      z: keypoints[168][2],
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
