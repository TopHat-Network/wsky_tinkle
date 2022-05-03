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