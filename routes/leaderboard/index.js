const redis = require('../../lib/redis')
const log = require('../../lib/createLogger')('leadboard-handler')

const cache = redis.connect()
const _ = require('lodash')

module.exports = async function leaderboard (req, res) {
  const subdomain = req.params.subdomain
  const user = req.query.user
  // const posts = req.query.posts || 200
  // const sort = req.query.sort || 'activity'

  const emptyResponse = JSON.stringify({
    totalComments: 0,
    politicalComments: 0,
    politicalPercentage: 0,
    data: []
  })

  if (!['www', 'metatalk', 'ask'].includes(subdomain)) {
    res.send(404)
  }

  let leaderboard
  try {
    const information = await cache.get(subdomain)
    leaderboard = JSON.parse(information)
  } catch (e) {
    log.error(e)
    res.send(emptyResponse)
  }

  const {
    totalComments,
    politicalComments,
    politicalPercentage,
    users,
    dateRangeCovered
  } = leaderboard
  log.info(`Total comments: ${totalComments}`)
  log.info(`Political comments: ${politicalComments}`)
  log.info(`Political percentage (sitewide): ${politicalPercentage}`)

  res.header('Content-Type', 'application/json')

  if (user) {
    res.send(JSON.stringify({
      totalComments,
      politicalComments,
      politicalPercentage,
      dateRangeCovered,
      data: filterUsersInformation(leaderboard.getUser(user))
    }))
  } else {
    res.send(JSON.stringify({
      totalComments,
      politicalComments,
      politicalPercentage,
      dateRangeCovered,
      data: filterUsersInformation(users)
    }))
  }
}

function filterUsersInformation (users) {
  return users.map(user => _.omit(user, ['tags', 'comments']))
}
