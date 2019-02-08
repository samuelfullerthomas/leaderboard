const redis = require('redis')
const log = require('./createLogger')('redis')

let client

module.exports = {
  connect: function () {
    client = redis.createClient()
    log.info('client connected')
    return {
      get: function (key) {
        return new Promise((resolve, reject) => {
          client.get(`mfl-${key}`, (error, response) => {
            if (error) reject(error)
            resolve(response)
          })
        })
      },
      set: function (key, value, options = {}) {
        const { expires } = options
        client.set(`mfl-${key}`, value, 'EX', 60 * (expires || 60 * 24))
      }
    }
  },
  disconnect: function () {
    if (client.quit) client.quit()
    log.info('client disconnected')
  }
}
