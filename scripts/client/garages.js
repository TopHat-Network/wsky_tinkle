let currentGarage = 10; // Debug only, will be done by Tinkle later.

let screenFadeTimeMs = 1000; // This is pretty nice, might move it into a shared util at some point in the future.

let playerLocationBeforeEnteringGarage = null; // Damn, long ass variable name.

let currentGarageVehicles = {}; // Store for current vehicles, so we can delete them later.

function cleanGarage (garage) {
  const [garageCenterX, garageCenterY, garageCenterZ] = garage.centerPosition;
  const vehicleIds = Object.keys(currentGarageVehicles);

  // Loop through all the vehicles in the garage and attempt to delete them.
  vehicleIds.forEach(vehicleId => {
    try {
      SetVehicleAsNoLongerNeeded(vehicleId);
      DeleteEntity(vehicleId);
    } catch (err) {
      console.error('Error cleaning up vehicle.', err); // We don't really care if this fails, it's just a cleanup.
    }
  })

  // Reset the currentGarageVehicles object.
  currentGarageVehicles = {};

  // Last ditch effort to cleanup the garage, this usually does nothing though.
  ClearArea(garageCenterX, garageCenterY, garageCenterZ, garage.radius, true, false, false, false);
}

/**
 * 
 * @param {number} player - The player handle.
 * @param {number} garageNumber Garage to enter: 2, 6, or 10.
 * @returns {void}
 */
async function enterGarage (player, garageNumber) {
  const playerPosition = GetEntityCoords(player);
  const isPlayerInGarage = isPositionInAGarage(playerPosition);

  if (isPlayerInGarage) return; // If the player is already in a garage, don't do anything.

  if (![2, 6, 10].includes(garageNumber)) {
    console.error('Invalid garage number.', garageNumber, 'Expected 2, 6, or 10.');
    return;
  }

  const garage = baseGarageData[garageNumber];
  const [garageEntranceX, garageEntranceY, garageEntranceZ, garageEntranceH] = garage.playerEnterPosition;

  cleanGarage(garage); // Clean up any vehicles that might be in the garage.

  emitNet('tinkle:playerEnteringGarage'); // Tell the server that the player is entering their garage, so it can begin loading vehicle data.

  DoScreenFadeOut(screenFadeTimeMs);
  await Delay(screenFadeTimeMs);

  playerLocationBeforeEnteringGarage = playerPosition; // Store the player's location before entering the garage.

  SetEntityCoords(player, garageEntranceX, garageEntranceY, garageEntranceZ, true, false, false, false); // Teleport the player to the garage interior.
  if (garageEntranceH) SetEntityHeading(player, garageEntranceH);

  await Delay(screenFadeTimeMs * 1.5); // Just, give everything a _bit_ of time to load.

  DoScreenFadeIn(screenFadeTimeMs);
}

RegisterCommand('garage', (s, args) => {
  if (args[0] && ['2', '6', '10'].includes(args[0])) currentGarage = parseInt(args[0]);
  enterGarage(GetPlayerPed(-1), currentGarage);
})

/**
 * 
 * @param {number[]} vehicles An array of vehicle handles.
 */
async function populateGarage(vehicles) {
  const garage = baseGarageData[currentGarage];
  const vehicleLimit = garage.vehicleSpawnPositions.length;

  if (vehicles.length > vehicleLimit) {
    console.warn('Too many vehicles in the garage, only the first ' + vehicleLimit + ' will be spawned.');
    console.log('Vehicles:', vehicles.map(vehicle => vehicle.name).join(', '));
  }

  const slicedVehicles = vehicles.slice(0, vehicleLimit);

  // Loop through all the vehicle handles and spawn them.
  await slicedVehicles.reduce(async (promise, vehicleData, index) => {
    await promise;

    const [x, y, z, h] = garage.vehicleSpawnPositions[index];
    const vehicleId = await generateVehicle(vehicleData.model, [x, y, z], h, {
      clientSide: true
    })

    // applyVehicleMods(vehicleId, vehicleData); // Apply the vehicle mods. - Not available as wsky_vehicles has not been brought over yet.
    currentGarageVehicles[vehicleId] = vehicleData; // Store the vehicle data so we can delete it later.
  }, undefined)
}

onNet('tinke:requestPopulateGarage', populateGarage)

onNet('tinkle:playerEnteredVehicle', async vehicle => {
  const garage = baseGarageData[currentGarage];
  
  while (IsVehicleStopped(vehicle) && IsPedInAnyVehicle(GetPlayerPed(-1), true)) {
    await Delay(500); // Wait for the vehicle to start moving. - Need to revist, really easy to accidentally trigger this.
  }

  if (!IsPedInAnyVehicle(GetPlayerPed(-1), true)) return; // If the player isn't in a vehicle, don't do anything.

  BringVehicleToHalt(vehicle, 0, 3.0, false); // Stop the vehicle.

  DoScreenFadeOut(screenFadeTimeMs);
  await Delay(screenFadeTimeMs);

  const vehicleData = currentGarageVehicles[vehicle];
  cleanGarage(garage); // Clean up any vehicles that might be in the garage.

  const newVehicle = await generateVehicle(vehicleData.model, [0, 0, 0], 0); // Spawn the vehicle.
  SetPedIntoVehicle(GetPlayerPed(-1), newVehicle, -1); // Put the player into the vehicle.
  // applyVehicleMods(newVehicle, vehicleData); // Apply the vehicle mods. - Not available as wsky_vehicles has not been brought over yet.

  let [x, y, z] = [0, 0, 0]; // Pulled over from old code, looks dumb should try to remove it later.
  if (playerLocationBeforeEnteringGarage) {
    [x, y, z] = playerLocationBeforeEnteringGarage;
  }

  const closestRoad = GetClosestRoad(x, y, z, 1.0, 1, true);
  const [chk, roadPos1, roadPos2] = closestRoad;

  // Compare the two closest roads for distance, and chose the closest one.
  const roadPos = [roadPos1, roadPos2].reduce((prev, curr) => {
    const currLoc = curr;
    const prevLoc = prev;
    const distance = getDistance(vehiclePos, currLoc);
    return distance < getDistance(vehiclePos, prevLoc) ? curr : prev;
  });

  const [roadX, roadY, roadZ] = roadPos;

  SetEntityCoords(newVehicle, roadX, roadY, roadZ, true, false, false, false); // Teleport the vehicle to the closest road.

  await Delay(screenFadeTimeMs * 1.5);
  DoScreenFadeIn(screenFadeTimeMs);
})