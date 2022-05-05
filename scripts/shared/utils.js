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

const defaultSpawnPositions = [
  [-1040, -2690, 13.75],
  [-995, -2710, 13.75],
  [-1040, -2740, 13.75],
  [-975, -2640, 13.98]
]

const defaultStartingPedModels = [
  'a_f_y_beach_01',
  'a_f_y_bevhills_03',
  'a_f_y_business_01',
  'a_m_m_bevhills_01',
  'a_m_m_paparazzi_01',
  'a_m_y_business_02',
  'mp_m_bogdangoon',
  'mp_m_weapexp_01',
  's_m_y_devinsec_01',
  's_m_y_prisoner_01',
  'ig_chrisformage',
  'ig_tomcasino'
]

const defaultStartingWeapons = [
  'WEAPON_SNOWBALL',
  'WEAPON_PISTOL',
  'WEAPON_SMG',
  'WEAPON_ASSAULTRIFLE',
  'WEAPON_SNIPERRIFLE',
  'WEAPON_PUMPSHOTGUN',
  'GADGET_PARACHUTE'
]

const hospitalData = [
  { // St. Fiacre Hospital
    name: 'St. Fiacre Hospital',
    vehicleDropOff: [1178.59, -1523.59, 34.46, 180.38],
    playerRespawn: [1152.23, -1526.78, 34.84, 338.47]
  },
  { // Central Los Santos Medical Center
    name: 'Central Los Santos Medical Center',
    vehicleDropOff: [299.64, -1432.19, 29.57, 231.77],
    playerRespawn: [341.07, -1396.18, 32.51, 51.05]
  },
  { // Mount Zonah Medical Center
    name: 'Mount Zonah Medical Center',
    vehicleDropOff: [-467.76, -337.8, 34.14, 351.26],
    playerRespawn: [-451.18, -341.14, 34.5, 110.59]
  },
  { // Pillbox Hill Medical Center
    name: 'Pillbox Hill Medical Center',
    vehicleDropOff: [294.17, -581.33, 42.95, 351.47],
    playerRespawn: [298.07, -584.21, 43.27, 85.26]
  },
  { // Sandy Shores Medical Center
    name: 'Sandy Shores Medical Center',
    vehicleDropOff: [1832.96, 3697.08, 33.99, 300.53],
    playerRespawn: [1839.29, 3672.5, 34.28, 214.49]
  },
  { // The Bay Care Center
    name: 'The Bay Care Center',
    vehicleDropOff: [-233.07, 6327.52, 31.74, 46.31],
    playerRespawn: [-246.45, 6329.94, 32.43, 239.8]
  }
]

function getDistance (location1, location2) {
  const [x1, y1, z1] = location1;
  const [x2, y2, z2] = location2;

  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
}

function isPositionInAGarage (pos) {
  return Object.keys(baseGarageData).some(key => {
    const garage = baseGarageData[key];
    const distance = getDistance(pos, garage.centerPosition);
    console.log(`Distance to garage ${key}: ${distance}`, distance <= garage.radius);
    return distance <= garage.radius;
  })
}

function hasVehicleArrivedAtDestination (vehicle, [x, y, z], tolerance = GetConvarInt('tinkle:parkingTolerance', 3000)) {
  const [vehX, vehY, vehZ] = GetEntityCoords(vehicle);
  const distance = Vdist2(vehX, vehY, vehZ, x, y, z);

  return distance <= tolerance;
}