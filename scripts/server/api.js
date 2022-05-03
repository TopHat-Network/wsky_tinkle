RegisterNetEvent('tinkle:playerAuthenticate');

const playerUUIDs = {}; // Stores the UUIDs of players mapped by their player handle.

on('playerJoining', () => authenticatePlayerWithTinkle(source));
onNet('tinkle:playerAuthenticate', () => authenticatePlayerWithTinkle(source));

/**
 * 
 * @param {number} playerSrc The player handle.
 * @returns {string} The player's Tinkle UUID.
 */
async function getPlayerUUID(playerSrc) {
  let uuid = playerUUIDs[playerSrc];
  if (!uuid) uuid = await authenticatePlayerWithTinkle(playerSrc);
  return uuid;
}

/**
 * 
 * @param {number} playerSrc The player handle.
 * @param {string} [vehicleName] Optional vehicle name to filter by.
 * @returns {object} Response object.
 */
async function getPlayerVehicles(playerSrc, vehicleName) {
  const uuid = await getPlayerUUID(playerSrc);
  let filters = `?userId=${uuid}`;

  if (vehicleName) filters += `&name=${vehicleName}`;

  return await api.get('/vehicles' + filters).then(res => res.data);
}

/**
 * 
 * @param {number} playerSrc The player handle.
 * @returns {string} The player's Tinkle UUID.
 */
async function authenticatePlayerWithTinkle(playerSrc) {
  const playerName = GetPlayerName(playerSrc);
  
  const identString = [];

  for (i=0; i < GetNumPlayerIdentifiers(playerSrc); i++) {
    identString.push(GetPlayerIdentifier(playerSrc, i));
  }

  const identObj = {};

  identString.forEach(ident => {
    const splitIdent = ident.split(':');
    identObj[splitIdent[0]] = splitIdent[1];
  })

  return await api.post('/authenticate', {
    ...identObj,
    username: playerName
  }).then(res => {
    if (res.status === "success") {
      const { id } = res.data;
      playerUUIDs[playerSrc] = id;
      console.log(logTitleCard, `${playerName} [${id}] authenticated with Tinkle`);
      return id;
    } else {
      console.error(logTitleCard, `${playerName} failed to authenticate with Tinkle`, res);
      return null;
    }
  })
}

/**
 * 
 * @param {number} playerSrc The player handle.
 * @param {object} vehicleData Vehicle object data.
 */
async function savePlayerVehicle(playerSrc, vehicleData) {
  const uuid = await getPlayerUUID(playerSrc);

  api.post('/vehicles', {
    ...vehicleData,
    userId: uuid
  }).then(res => {
    if (res.status === "success") {
      console.log(logTitleCard, `${playerSrc} vehicle saved to Tinkle`);
    } else {
      console.error(logTitleCard, `${playerSrc} failed to save vehicle to Tinkle`, res);
    }
  })
}