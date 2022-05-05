RegisterCommand('reauth', () => emitNet('tinkle:playerAuthenticate'));

RegisterCommand('debug_save_vehicle', (s, args) => {
  const vehicle = GetVehiclePedIsIn(PlayerPedId(), false);
  if (!vehicle) return;

  const vehicleSaveName = args[0];
  if (!vehicleSaveName) return;

  const tinkleVehicle = new TinkleVehicle().fromGTAVehicle(vehicle);
  tinkleVehicle.setName(vehicleSaveName);

  emitNet('tinkle:playerSaveVehicle', tinkleVehicle.convertToTinkleObject());
})

RegisterCommand('pos', () => {
  const player = GetPlayerPed(-1);
  const playerPos = GetEntityCoords(player, true);
  const [x, y, z] = playerPos;

  console.log(`Player pos: ${x}, ${y}, ${z}`);
})

RegisterCommand('tp', (s, args) => {
  const player = GetPlayerPed(-1);
  let [x, y, z] = args;
  x = parseFloat(x);
  y = parseFloat(y);
  z = parseFloat(z);

  console.log(player, [x, y, z]);

  SetEntityCoords(player, x, y, z, false, false, false, false);
})

RegisterCommand('currentPedModel', () => {
  const player = GetPlayerPed(-1);
  const model = GetEntityModel(player);

  const matchingModel = defaultStartingPedModels.find(modelName => GetHashKey(modelName) === model);

  console.log(matchingModel);
})

RegisterCommand('forceRespawn', () => {
  exports.spawnmanager.forceRespawn();
})