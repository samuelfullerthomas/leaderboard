const express = require('express')
const app = express()
const worker = require('./worker')
const cors = require('cors')
const routes = require('./routes')
if (process.env.NODE_ENV === 'development') {
  app.use(cors())
} else {
  app.use(cors({
    allowedOrigins: [ /https?:\/\/.*\.samthomas.io\/.*/ ]
  }))
}

app.get('/leaderboard/:subdomain', routes.leaderboard)
app.get('/', (req, res) => res.send('hi there!'))

app.listen(1337)
console.log('App listening on port 1337')

worker.start()
