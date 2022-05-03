/**
 * 
 * @param {string} vehicleModel The model of the vehicle to spawn.
 * @param {[x:number, y:number, z:number]} position The position to spawn the vehicle at.
 * @param {float} heading The float heading to spawn the vehicle at.
 * @param {{pedModel:string, clientSide:boolean}} options Optional parameters.
 * @returns {[number, number?]} The vehicle handle and optionally the ped handle if a pedModel was provided.
 */
async function generateVehicle (vehicleModel, position, heading, options = {}) {
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

/**
 * 
 * @param {number} vehicle The vehicle handle. 
 * @param {boolean} state The state to set the vehicle's engine to. 
 */
async function toggleVehicleEngine (vehicle, state) {
  SetVehicleEngineOn(vehicle, !!state, false, true);
}

RegisterCommand('toggle_engine', () => {
  const vehicle = GetVehiclePedIsIn(PlayerPedId(), false);
  if (!vehicle) return;

  toggleVehicleEngine(vehicle, !GetIsVehicleEngineRunning(vehicle));
})


// The following indicator code I wrote a few weeks back at 4am while very sleep deprived.
// It works, I'm not entirely sure HOW it works, but I really can't be bothered to figure it out or simplify it.

const indicatorDirections = {
  'left': {
    id: 1,
    status: 1
  },
  'right': {
    id: 0,
    status: 2
  }
}

/**
 * 
 * @param {number} vehicle The vehicle handle.
 * @param {side} side The side of the vehicle to set the indicator on. `left` or `right`.
 * @returns 
 */
function broadcastVehicleIndication (vehicle, side) {
  if (!['left', 'right'].includes(side.toLowerCase())) return;

  emitNet('tinkle:broadcastVehicleIndicator', NetworkGetNetworkIdFromEntity(vehicle), side.toLowerCase());
}

RegisterCommand('indicator', (s, args) => {
  const vehicle = GetVehiclePedIsIn(PlayerPedId(), false);
  if (!vehicle) return;

  broadcastVehicleIndication(vehicle, args[0]);
})

onNet('tinkle:receiveVehicleIndicator', (vehNet, side) => {
  toggleVehicleIndicatorDirection(NetworkGetEntityFromNetworkId(vehNet), indicatorDirections[side]);
});

/**
 * CLIENT SIDE ONLY
 * Use `broadcastVehicleIndication` to send the indicator to the server.
 * @param {number} vehicle The vehicle handle.
 * @param {string} indicator The indicator to set. `left` or `right`.
 * @returns 
 */
function toggleVehicleIndicatorDirection (vehicle, indicator) {
  if (!vehicle || !indicator) return;

  const currentIndicatorStatus = GetVehicleIndicatorLights(vehicle);
  const indicatorIsOn = currentIndicatorStatus > 0;

  // If the either indicator is already on, turn them both off.
  if (indicatorIsOn) {
    SetVehicleIndicatorLights(vehicle, 0, false);
    SetVehicleIndicatorLights(vehicle, 1, false);
  }

  // If hazards are off, and the indicator we are toggling is off, turn it on.
  if (currentIndicatorStatus !== 3 && currentIndicatorStatus !== indicator.status) {
    // NOTE: I have no idea what this check is for, but I don't have time to figure it out.
    // Best guess: allowing the indicator to be turned off?
    SetVehicleIndicatorLights(vehicle, indicator.id, true);
  }
}

/**
 * 
 * @param {number} vehicle The vehicle handle.
 * @param {object} data Vehicle mod object. Usually has `mods`, `extras`, that sort of thing. See Tinkle API docs.
 */
function applyVehicleMods (vehicle, data) {
  SetVehicleModKit(vehicle, 0); // Do I know what this does? no. Is it required? yes.

  if (!vehicle) return; // Fun fact: if we were using TypeScript, THIS WOULD BE DONE FOR US.

  // Apply all the mods.
  Object.keys(data.mods).forEach(modTypeKey => {
    const modType = parseInt(modTypeKey);
    const modValue = data.mods[modTypeKey];

    // This chunk of code needs revisiting because tyres still don't work correctly.
    let modStyle = false;
    if (tyreModIds.includes(modType) && data.styles[modType] !== undefined) {
      if (modType === 23) modStyle = !data.styles[modType];
      else modStyle = data.styles[modType - 1];
    }

    if (modsThatAreToggleable.includes(modType)) ToggleVehicleMod(vehicle, modType, modValue);
    else SetVehicleMod(vehicle, modType, modValue, modStyle);
  })

  // Apply colours.
  // NOTE: We've been having issues with pearlescent, so we need to come back and take a look at this.
  const primary = data.colors.primary;
  const secondary = data.colors.secondary;

  SetVehicleColours(vehicle, primary, secondary);

  // Disable all extras, then enable just the ones we want.
  // Yes, the value is inverted - I have no idea why.
  for (i=0; i<=20; i++) SetVehicleExtra(vehicle, i, true); // Disable all extras.
  data.extras.forEach(extra  => SetVehicleExtra(vehicle, extra, false));

  SetVehicleNumberPlateText(vehicle, data.licensePlate);
  SetVehicleTyresCanBurst(vehicle, !data.bulletProofTyres);
  SetVehicleWindowTint(vehicle, data.windowTint);
}

RegisterKeyMapping('toggle_engine', 'Toggle vehicle engine', 'keyboard', 'subtract');
RegisterKeyMapping('indicator left', 'Indicate Left', 'keyboard', 'left');
RegisterKeyMapping('indicator right', 'Indicate Right', 'keyboard', 'right');