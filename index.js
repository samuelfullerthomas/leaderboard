const express = require('express')
const app = express()

const routes = require('./routes')

app.get('/leaderboard/:subdomain', routes.leaderboard)
app.get('/', (req, res) => res.send('hi there!'))

app.listen(1337)
console.log('App listening on port 1337')
