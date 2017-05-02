const test = require('tape')
const Async = require('async')
const Faker = require('faker')
const teamRankings = require('..').teamRankings
const Setup = require('./helpers/setup')
const clearDb = require('./helpers/clear-db')
const addUser = require('./helpers/add-user')
const addInterval = require('./helpers/add-interval')

let db = null

test('Start server', (t) => {
  t.plan(1)
  Setup.start((err, ctx) => {
    t.ifError(err, 'DB connection opened successfully')
    db = ctx.db
    t.end()
  })
})

test('Team rankings should count the correct number of intervals since the final user joined', (t) => {
  const minTeamSize = Faker.random.number({ min: 1, max: 10 })

  Async.waterfall([
    (cb) => clearDb(db, cb),
    function addUsers (cb) {
      Async.times(10, addUser.bind(addUser, db), cb)
    },
    function addIntervals (users, cb) {
      Async.map(users, (user, done) => {
        addInterval(db, {
          userId: user._id,
          kudosPoints: 10
        }, done)
      }, (err, intervals) => {
        cb(err, { intervals, users })
      })
    },
    function addTeam ({ intervals, users }, cb) {
      db.teams.insert({
        name: Faker.company.companyName(),
        deleted: false,
        members: users.map((u, ind) => ({
          user: u._id,
          activated: true,
          active: true,
          startDate: new Date(intervals[ind].startDate - 1000) // one second before their interval starts
        })),
        startDate: new Date(0)
      }, (err, team) => {
        cb(err, { intervals, users, team })
      })
    },
    function addPanel ({ intervals, users, team }, cb) {
      db.panels.insert({
        name: Faker.commerce.productMaterial(),
        deleted: false,
        team: [{ teamId: team._id }]
      }, (err, panel) => cb(err, { intervals, users, team, panel }))
    },
    function addLeague ({ intervals, users, team, panel }, cb) {
      db.leagues.insert({
        name: Faker.name.jobArea(),
        deleted: false,
        teamSize: 10,
        minTeamSize,
        leagueType: 'corporate',
        panel: [{ panelId: panel._id }]
      }, (err, league) => cb(err, { intervals, users, team, panel, league }))
    },
    function calculateTeamRankings ({ intervals, users, team, panel, league }, cb) {
      teamRankings.get({ db, group: league }, cb)
    },
    function checkRankings (rankings, cb) {
      t.equal(rankings[0].score, 11 - minTeamSize, 'Correct number of users scored for their intervals')
      cb()
    }
  ], (err) => {
    t.ifError(err, 'No error')
    t.end()
  })
})

test('Stop server', (t) => {
  t.plan(1)
  Setup.stop((err, ctx) => {
    t.ifError(err, 'Server stopped successfully')
    t.end()
  })
})
