const http = require('http'); // Need to switch to using https when we're ready to use it.
const querystring = require('querystring');

const apiBaseUrl = GetConvar('tinkle:apiBaseUrl', 'http://localhost:8081');

const api = {
  URL (url) {
    return new URL(url.startsWith('http') ? url : apiBaseUrl + url)
  },
  get (url, options = {}) {
    if (options.query) {
      url = url + '?' + querystring.stringify(options.query)
    }
    var headers = options.headers || {}
    return httpRequest(api.URL(url), { headers })
  },
  post (url, data, options = {}) {
    var headers = options.headers || {}
    return httpRequest(api.URL(url), {
      method: 'POST',
      body: JSON.stringify(data),
      headers
    })
  },
  serialize (params) {
    return querystring.stringify(params)
  }
}

/**
 * 
 * @param {string} url The URL to send the request to.
 * @param {{method:string,headers:object,body:object}} config The configuration for the request.
 * @returns {Promise<{statusCode:number,body:object}>} The response from the server.
 */
async function httpRequest (url, config = {}) {
  let requestOptions = {
    method: config.method || 'GET',
    headers: {
      ...config.headers
    }
  }

  if (config.body) {
    requestOptions.headers['Content-Type'] = 'application/json'
    requestOptions.body = config.body
  }

  return new Promise((resolve, reject) => {
    const request = http.request(url, requestOptions, (response) => {
      let responseData = ''
      response.on('data', (chunk) => {
        responseData += chunk
      })
      response.on('end', () => {
        responseData = JSON.parse(responseData)
        resolve(responseData)
      })
    })
    request.on('error', (error) => {
      reject(error)
    })

    if (['POST', 'PUT'].includes(requestOptions.method)) {
      request.write(requestOptions.body)
    }

    request.end()
  })
}