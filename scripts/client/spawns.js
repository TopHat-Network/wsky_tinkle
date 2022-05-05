let firstRespawn = true;
let respawning = false;

/**
 * This function opens the NUI respawn HUD, and resets the values from last use.
 */
function playerJustDied() {
  if (firstRespawn) return;

  SendNuiMessage(JSON.stringify({
    type: 'tinkle:showWasted',
    data: {
      respawnHealth: 0,
      closestHospital: { name: null }
    }
  }))

  DoScreenFadeOut(3000);
}

on('baseevents:onPlayerKilled', playerJustDied)

on('baseevents:onPlayerDied', playerJustDied)

on('baseevents:onPlayerWasted', playerJustDied)

exports.spawnmanager.setAutoSpawnCallback(async () => {
  if (respawning && !firstRespawn) return; // prevent multiple spawns/respawns
  respawning = true;

  // If first respawn in the server, spawn at a random default spawn position.
  if (firstRespawn) {
    firstRespawn = false;
    
    const [x, y, z] = defaultSpawnPositions[Math.floor(Math.random() * defaultSpawnPositions.length)];
    const pedModel = defaultStartingPedModels[Math.floor(Math.random() * defaultStartingPedModels.length)];

    exports.spawnmanager.spawnPlayer({
      x, y, z,
      model: pedModel,
      skipFade: true
    }, () => {
      setTimeout(() => {
        DoScreenFadeIn(1000);
        respawning = false;
        givePlayerWeapons();
      }, 500);
    })

    return; // Stop code now to prevent accidentally doing other stuff.
  }

  // Otherwise, they just died and should use an ambulance.
  const player = GetPlayerPed(-1);
  const playerPos = GetEntityCoords(player, true);

  while (!IsScreenFadedOut()) {
    await Delay(50);
  }

  exports.spawnmanager.spawnPlayer({
    // Motel interior - great place to dump people during loading.
    skipFade: false, x: playerPos[0], y: playerPos[1], z: playerPos[2]
  }, () => {
    DoScreenFadeOut(0); // Fuck you spawnmanager.
    setTimeout(() => {
      respawn(playerPos);
      givePlayerWeapons();
    }, 500);
  })
})

const player = GetPlayerPed(-1);
const playerIsAlive = !IsPedDeadOrDying(player, true);

exports.spawnmanager.setAutoSpawn(true)
if (!playerIsAlive) exports.spawnmanager.forceRespawn() // If player is dead, force respawn them - useful for when restarting resource.

/**
 * Give weapons to current player.
 */
function givePlayerWeapons() {
  const player = PlayerPedId();
  defaultStartingWeapons.forEach(weaponName => {
    GiveWeaponToPed(player, GetHashKey(weaponName), 1000, false, false);
  })
}

/**
 * @param {Array} deathPosition - [x, y, z] Position where player died
 * Respawn the player in an ambulance.
 */
async function respawn(deathPosition = [0, 0, 0]) {
  let showForceRespawn = false;

  const player = GetPlayerPed(-1);

  DisplayHud(false); // Doesn't work for some reason.

  const offsetAmount = 400;
  let offset = Math.floor(Math.random() * offsetAmount) - (offsetAmount / 2);
  if (offset > 0) offset = Math.max(100, offset);
  else if (offset < 0) offset = Math.min(-100, offset);
  else offset = 200;

  const x = deathPosition[0] + offset;
  const y = deathPosition[1] + offset;
  const z = deathPosition[2];
  respawning = false;
  let respawnHealth = 50;

  const closestRoad = GetClosestRoad(x, y, z, 1.0, 1, true);
  const [chk, roadPos1, roadPos2] = closestRoad;

  // Out of roadPos1 and roadPos2, find the FURTHEST road.
  const roadPos = [roadPos1, roadPos2].reduce((prev, curr) => {
    const prevDist = Vdist2(x, y, z, prev[0], prev[1], prev[2]);
    const currDist = Vdist2(x, y, z, curr[0], curr[1], curr[2]);

    return prevDist > currDist ? prev : curr;
  })

  const [roadX, roadY, roadZ] = roadPos;

  const closestHospital = hospitalData.reduce((prev, curr) => {
    const currLoc = curr.vehicleDropOff;
    const prevLoc = prev.vehicleDropOff;

    const prevDist = Vdist2(x, y, z, prevLoc[0], prevLoc[1], prevLoc[2]);
    const currDist = Vdist2(x, y, z, currLoc[0], currLoc[1], currLoc[2]);

    return currDist < prevDist ? curr : prev;
  })

  const { vehicleDropOff, playerRespawn } = closestHospital;
  const [dropOffX, dropOffY, dropOffZ, dropOffH] = vehicleDropOff;

  const roadHeading = GetHeadingFromVector_2d(dropOffX - roadX, dropOffY - roadY);

  const [ ambulance, driver ] = await generateVehicle('AMBULANCE', roadPos, roadHeading, { pedModel: 's_m_m_paramedic_01' })

  // Godmode the shit out of the ambulance and the driver, to prevent griefing.
  SetEntityInvincible(ambulance, true);
  SetVehicleCanBreak(ambulance, false);
  SetVehicleTyresCanBurst(ambulance, false);
  SetEntityInvincible(driver, true);
  TaskSetBlockingOfNonTemporaryEvents(driver, true);
  SetBlockingOfNonTemporaryEvents(driver, true);

  const playerSeat = GetVehicleModelNumberOfSeats('AMBULANCE') - 2;
  SetPedIntoVehicle(player, ambulance, playerSeat);

  setTimeout(() => DoScreenFadeIn(3000), 4000);

  TaskVehicleDriveToCoordLongrange(driver, ambulance, dropOffX, dropOffY, dropOffZ, 600, GetConvarInt('tinkle:respawnDrivingStyle', 812), 0)

  setTimeout(() => SetVehRadioStation(ambulance, 'OFF'), 1000);

  SetVehicleSiren(ambulance, true);

  const isPlayerMale = IsPedMale(player);
  SetEntityMaxHealth(player, 200);
  const playerMaxHealth = 100;

  SendNuiMessage(JSON.stringify({
    type: 'tinkle:showWasted',
    data: {
      closestHospital,
      respawnHealth,
      showForceRespawn
    }
  }));

  let counter = 0;
  let playerNewHealth = Math.ceil(playerMaxHealth * (respawnHealth / 100)) + (isPlayerMale ? 100 : 0); // For some reason female/male peds programatically have different health, no idea why. This weird abomination of code is required to not kill players in ambulance.
  SetEntityHealth(player, playerNewHealth);

  while (!hasVehicleArrivedAtDestination(ambulance, vehicleDropOff) && IsPedSittingInVehicle(player, ambulance) && IsPedSittingInVehicle(driver, ambulance)) {
    counter += 1;

    if (counter >= 200 && !showForceRespawn) {
      counter = 0;
      showForceRespawn = true;
    } else if (counter > 0 && !(counter % 40) && respawnHealth < 100) {
      if (showForceRespawn) counter = 0;
      respawnHealth += 1;
      playerNewHealth = Math.ceil(playerMaxHealth * (respawnHealth / 100)) + (isPlayerMale ? 100 : 0);
      SetEntityHealth(player, playerNewHealth);
    }

    SendNuiMessage(JSON.stringify({
      type: 'tinkle:updateWasted',
      data: {
        respawnHealth,
        showForceRespawn
      }
    }));
    await Delay(50);
  }

  if (!IsPedSittingInVehicle(player, ambulance)) {
    BringVehicleToHalt(ambulance, 0, 3.0, false);
  }

  SendNuiMessage(JSON.stringify({
    type: 'tinkle:updateWasted',
    data: {
      respawnHealth: 100,
      showForceRespawn: false
    }
  }));

  DisplayHud(true); // Doesn't work for some reason.

  SetVehicleSiren(ambulance, false);

  TaskVehiclePark(driver, ambulance, dropOffX, dropOffY, dropOffZ, dropOffH, 0, 10, false);

  while (IsPedSittingInVehicle(player, ambulance) && IsPedSittingInVehicle(driver, ambulance) && !IsVehicleStopped(ambulance) && GetIsVehicleEngineRunning(ambulance) && !hasVehicleArrivedAtDestination(ambulance, vehicleDropOff, 10)) {
    await Delay(500);
  }

  SendNuiMessage(JSON.stringify({ type: 'tinkle:hideWasted' }));

  SetVehicleAsNoLongerNeeded(ambulance);
  SetPedAsNoLongerNeeded(driver);

  if (!IsPedSittingInVehicle(player, ambulance)) return; // If player is already out of ambulance, don't attempt to teleport them.

  TaskLeaveVehicle(player, ambulance, 0);

  const [respawnX, respawnY, respawnZ, respawnH] = playerRespawn;
  SetEntityCoords(player, respawnX, respawnY, respawnZ, true, true, true, true);
  SetEntityHeading(player, respawnH);

  SetEntityHealth(player, Math.ceil(playerMaxHealth + (isPlayerMale ? 100 : 0)));
}