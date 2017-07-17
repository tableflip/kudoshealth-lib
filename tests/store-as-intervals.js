const test = require('tape')
const moment = require('moment')
const Async = require('async')
const { storeAsIntervals } = require('../lib/intervals')
const Setup = require('./helpers/setup')
const clearDb = require('./helpers/clear-db')

let db = null

test('Start server', (t) => {
  t.plan(1)
  Setup.start((err, ctx) => {
    t.ifError(err, 'DB connection opened successfully')
    db = ctx.db
    t.end()
  })
})

test('Should store activity data as intervals', (t) => {
  const start = moment('2017-01-10T10:00:00Z')
  const activities = [
    {
      startDate: moment(start).add(14, 'minutes').valueOf(),
      endDate: moment(start).add(16, 'minutes').valueOf(),
      calsPerMilli: 0.0001,
      type: 'Ride'
    },
    {
      startDate: moment(start).add(15, 'minutes').valueOf(),
      endDate: moment(start).add(20, 'minutes').valueOf(),
      calsPerMilli: 0.0002,
      type: 'Run'
    },
    {
      startDate: moment(start).add(30, 'minutes').valueOf(),
      endDate: moment(start).add(35, 'minutes').valueOf(),
      calsPerMilli: 0.0003
    },
    {
      startDate: moment(start).add(35, 'minutes').valueOf(),
      endDate: moment(start).add(40, 'minutes').valueOf(),
      calsPerMilli: 0.0004
    }
  ]
  const approxKPs = [0.31, 0.86, 0.98]

  const startDate = start.valueOf()
  const endDate = moment(start).add(4, 'hours').valueOf()
  const intervalSize = 1000 * 60 * 15

  const user = {
    gender: 'Female',
    dob: new Date(1970, 0, 1),
    height: 170,
    weight: 70
  }

  Async.waterfall([
    (cb) => clearDb(db, cb),
    (cb) => storeAsIntervals({
      db,
      startDate,
      endDate,
      activities,
      user,
      method: 'test-method',
      intervalSize,
      chunkSize: 2
    }, cb),
    (_, cb) => {
      db.intervals.find({}).sort({ startDate: 1 }, cb)
    }
  ], (err, intervals) => {
    t.notOk(err, 'No error')
    intervals.forEach(({ kudosPoints }, ind) => {
      t.equals(Math.round(kudosPoints * 100), Math.round(approxKPs[ind] * 100), 'KudosPoints are correct')
    })
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
