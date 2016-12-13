const request = require('request')

module.exports = function ({ auth0, auth0Backend }) {
  let token = null

  function requestToken (cb) {
    const params = {
      method: 'POST',
      uri: `https://${auth0.domain}/oauth/token`,
      headers: { 'content-type': 'application/json' },
      json: {
        client_id: auth0Backend.clientId,
        client_secret: auth0Backend.secret,
        audience: `https://${auth0.domain}/api/v2/`,
        grant_type: 'client_credentials'
      }
    }

    request(params, (error, res, body) => {
      if (error) return cb(new Error(error))
      if (res.statusCode !== 200) {
        console.error('Cannot request Auth0 creds', res.statusCode, body)
        return cb(new Error('Cannot request credentials'))
      }

      token = body.access_token
      cb()
    })
  }

  return function callApi ({ method = 'GET', route, json = true, noAuth = false }, cb) {
    if (!token && !noAuth) {
      return requestToken((err) => {
        if (err) return cb(err)
        callApi({ method, route, json }, cb)
      })
    }
    const params = {
      method,
      uri: `https://${auth0.domain}${route}`,
      json
    }
    if (!noAuth) {
      params.headers = {
        authorization: `Bearer ${token}`
      }
    }

    request(params, cb)
  }
}
