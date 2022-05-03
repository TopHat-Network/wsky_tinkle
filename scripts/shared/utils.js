Delay = ms => new Promise(res => setTimeout(res, ms));

const logTitleCard = '[Tinkle]';

const baseGarageData = {
  2: { // 2 Car Garage
    playerEnterPosition: [173, -1008, -99, 360],
    centerPosition: [173, -1003, -99],
    radius: 10.0,
    vehicleSpawnPositions: [
      [171, -1004, -99, 177],
      [175, -1004, -99, 177]
    ]
  },
  6: { // 6 Car Garage
    playerEnterPosition: [198, -1007, -99, 360],
    centerPosition: [198, -1002, -99],
    radius: 10.0,
    vehicleSpawnPositions: [
      [193, -998, -99, 180],
      [197, -998, -99, 180],
      [201, -998, -99, 180],
      [193, -1004, -99, 180],
      [197, -1004, -99, 180],
      [201, -1004, -99, 180]
    ]
  },
  10: { // 10 Car Garage
    playerEnterPosition: [229, -1005, -99, 360],
    centerPosition: [229, -991, -99],
    radius: 100.0, // Come back and check this one, 100 is way too big.
    vehicleSpawnPositions: [
      [233.32, -983, -99, 117],
      [233.32, -987, -99, 117],
      [233.32, -991, -99, 117],
      [233.32, -995, -99, 117],
      [233.32, -999, -99, 117],

      [223.32, -983, -99, 243],
      [223.32, -987, -99, 243],
      [223.32, -991, -99, 243],
      [223.32, -995, -99, 243],
      [223.32, -999, -99, 243]
    ]
  }
}

function getDistance (location1, location2) {
  const [x1, y1, z1] = location1;
  const [x2, y2, z2] = location2;

  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
}

function isPositionInAGarage (pos) {
  return Object.keys(baseGarageData).some(key => {
    const garage = baseGarageData[key];
    const distance = getDistance(pos, garage.centerPosition);
    return distance <= garage.radius;
  })
}