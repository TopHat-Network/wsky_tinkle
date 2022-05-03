fx_version 'cerulean'
game 'gta5'

author 'WhiskeeDev <dev@whiskee.me>'
description 'Master resource and integration with the Tinkle API'
version '1.0.0'

client_scripts {
  'scripts/shared/utils.js',
  'scripts/shared/classes.js',
  'scripts/client/vehicles.js',
  'scripts/client/garages.js',
  'scripts/client/debug.js' -- As name implies, this is for debugging purposes only. Should not be included in release builds.
}

server_scripts {
  'scripts/shared/utils.js',
  'scripts/shared/classes.js',
  'scripts/server/http.js',
  'scripts/server/api.js',
  'scripts/server/vehicles.js',
  'scripts/server/garages.js'
}