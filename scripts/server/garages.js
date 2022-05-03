RegisterNetEvent('tinkle:playerEnteringGarage');
RegisterNetEvent('tinkle:responsePopulateGarage');
RegisterNetEvent('tinkle:playerEnteredVehicle');

onNet('tinkle:playerEnteringGarage', async () => {
  const playerSrc = source;
  const vehicles = await getPlayerVehicles(playerSrc);
  emitNet('tinkle:responsePopulateGarage', playerSrc, vehicles);
})

onNet('baseevents:enteredVehicle', vehicle => {
  const playerSrc = source;
  const player = GetPlayerPed(playerSrc);

  const playerPos = GetEntityCoords(player);
  const isVehicleInGarage = isPositionInAGarage(playerPos);

  if (isVehicleInGarage) emitNet('tinkle:playerEnteredVehicle', playerSrc, vehicle);
})