
/**
 * 
 * @param {string} vehicleModel The model of the vehicle to spawn.
 * @param {[x:number, y:number, z:number]} position The position to spawn the vehicle at.
 * @param {float} heading The float heading to spawn the vehicle at.
 * @param {{pedModel:string, clientSide:boolean}} options Optional parameters.
 * @returns {[number, number?]} The vehicle handle and optionally the ped handle if a pedModel was provided.
 */
async function generateVehicle (vehicleModel, position, heading, options) {
  const [ x, y, z ] = position
  const { pedModel, clientSide } = options

  // Load the vehicle model, and wait until it's loaded.
  RequestModel(vehicleModel);
  while (!HasModelLoaded(vehicleModel)) await Delay(50);

  // If a pedModel is specified, load that model too.
  if (pedModel) {
    RequestModel(pedModel);
    while (!HasModelLoaded(pedModel)) await Delay(50);
  }

  // Create the vehicle.
  const vehicle = CreateVehicle(GetHashKey(vehicleModel), x, y, z, heading, !clientSide, false);

  // If a pedModel is specified, let's create a driver for the vehicle using that pedModel.
  let driver = null;
  if (pedModel) {
    driver = CreatePedInsideVehicle(vehicle, 4, pedModel, -1, !clientSide, false);
  }

  return driver ? [vehicle, driver] : [vehicle];
}