const redis = require('redis')
const client = redis.createClient()

module.exports = {
  get: function (key) {
    return new Promise((resolve, reject) => {
      client.get(`mfl-${key}`, (error, response) => {
        if (error) reject(error)
        resolve(response)
      })
    })
  },
  set: function (key, value, options) {
    const { expires } = options
    client.set(`mfl-${key}`, value, 'EX', 60 * (expires || 60 * 24))
  }
}
