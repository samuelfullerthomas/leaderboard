const axios = require('axios')
const CronJob = require('cron').CronJob
const job = new CronJob({
  cronTime: '00 */12 * * *',
  onTick: refreshCache,
  start: false,
  timeZone: 'America/Los_Angeles'
})
refreshCache()

async function refreshCache () {
  console.log('ticking...')
  console.log('ticking on www...')
  await axios.get(`http://localhost:1337/leaderboard/www?posts=300&refreshcache=true`).catch(e => console.log(e))
  console.log('ticking on metatalk...')
  await axios.get(`http://localhost:1337/leaderboard/metatalk?posts=300&refreshcache=true`).catch(e => console.log(e))
  console.log('ticking on ask...')
  await axios.get(`http://localhost:1337/leaderboard/ask?posts=300&refreshcache=true`).catch(e => console.log(e))
  console.log('tocked!')
}

module.exports = job
