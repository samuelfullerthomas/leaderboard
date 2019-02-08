const axios = require('axios')
const CronJob = require('cron').CronJob
const regexes = require('../routes/leaderboard/helpers/regexes')
const redis = require('../lib/redis')
const log = require('../lib/createLogger')('worker')
const createUserInformation = require('../routes/leaderboard/helpers/createUserInformation')
const createLeaderboard = require('../routes/leaderboard/helpers/createLeaderboard')

const DEFAULT_POSTS = 400
const BATCH_SIZE = 100
const DEFAULT_BATCH_SIZE = 20

async function refreshCache () {
  log.info('ticking...')
  log.info('ticking on www...')

  await process('www')
  log.info('ticking on metatalk...')
  await process('metatalk')
  log.info('ticking on ask...')
  await process('ask')
  log.info('tocked!')
}

async function process (subdomain, posts = DEFAULT_POSTS) {
  const cache = redis.connect()
  const subdomainHomepage = `https://${subdomain === 'www' ? '' : `${subdomain}.`}metafilter.com/`
  const { data: homepageData } = await axios.get(subdomainHomepage)
  let startPosition = homepageData.match(regexes.postNumber)[1]

  cache.set(subdomainHomepage, homepageData)
  const allUserInformation = { users: [] }
  while (posts > 0) {
    const { users, dateRangeCovered } = await createBatches({
      numberOfPosts: BATCH_SIZE,
      startPosition,
      subdomain,
      startingPost: DEFAULT_POSTS - posts
    })
    allUserInformation.users = allUserInformation.users.concat(users)
    allUserInformation.dateRangeCovered = dateRangeCovered
    startPosition = startPosition - BATCH_SIZE
    posts = posts - BATCH_SIZE
  }

  const { users: userInformation, dateRangeCovered } = allUserInformation
  const leaderboard = createLeaderboard(userInformation, 'activity', dateRangeCovered)

  cache.set(subdomain, JSON.stringify(leaderboard))

  redis.disconnect()

  async function createBatches ({ numberOfPosts, startPosition, subdomain, startingPost }) {
    return new Promise(async (resolve, reject) => {
      let currentProccessed = 0
      let batchSize = DEFAULT_BATCH_SIZE
      let batchResponses = []

      log.info('starting batches...')

      while (currentProccessed < numberOfPosts) {
        log.info(`current processed: ${startingPost + currentProccessed}`)

        const batchedResponses = await batch(startPosition, batchSize, subdomain)
        const batchResponse = await Promise.all(batchedResponses)
        batchResponses = batchResponses.concat(batchResponse)
        startPosition = startPosition - batchSize
        currentProccessed = currentProccessed + batchSize
        batchSize = (numberOfPosts - currentProccessed) < 20 ? (numberOfPosts - currentProccessed) : 20
      }

      log.info('resolving batches...')
      resolve(createUserInformation(batchResponses))
    })
  }

  async function batch (startPosition, batchNumber, subdomain) {
    let x = 0
    let responses = []
    while (x < batchNumber) {
      const url = `https://${subdomain}.metafilter.com/${startPosition - x}`
      responses.push(axios.get(url).catch(e => {
        log.error(`Error for ${url}`)
        log.error(e.code)
        return { data: '' }
      }))
      x++
    }
    return responses
  }
}

module.exports = {
  start: function () {
    refreshCache()
    const job = new CronJob({
      cronTime: '00 */12 * * *',
      onTick: refreshCache,
      start: false,
      timeZone: 'America/Los_Angeles'
    })
    job.start()
  }
}
