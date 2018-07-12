var conn = {
  host: '127.0.0.1',
  user: 'root',
  password: 'password',
  charset: 'utf8'
}

// connect without database selected
var knex = require('knex')({ client: 'mysql', connection: conn })

knex.raw('CREATE DATABASE IF NOT EXISTS metafilter').then(() => {
  knex.destroy()
  conn.database = 'metafilter'
  knex = require('knex')({ client: 'mysql', connection: conn })

  knex.schema.createTable('threads', (table) => {
    table.increments('id').primary().index().unique()
    table.string('title').unique().index()
  }).then(function () {
    knex.destroy()
  })
})
