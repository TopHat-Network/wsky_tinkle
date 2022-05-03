RegisterNetEvent('tinkle:broadcastVehicleIndicator');
RegisterNetEvent('tinkle:receiveVehicleIndicator');
RegisterNetEvent('tinkle:playerSaveVehicle');

onNet('tinkle:broadcastVehicleIndicator', (vehNet, side) => {
  // Emit to all players the direction of this vehicle's indicator.
  emitNet('tinkle:receiveVehicleIndicator', -1, vehNet, side);
})

onNet('tinkle:playerSaveVehicle', vehicleData => {
  savePlayerVehicle(source, vehicleData);
})