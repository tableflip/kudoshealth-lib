const Faker = require('faker')
const moment = require('moment')
const ObjectId = require('mongojs').ObjectId

/* Add an interval to the DB and hand it back in the callback */
module.exports = (db, data, cb) => {
  if (!cb) {
    cb = data
    data = {}
  }

  data = data || {}
  const startDate = data.startDate || Faker.date.recent().getTime()
  const endDate = startDate + (15 * 60 * 1000)
  const startOfDay = moment.utc(startDate).startOf('day').valueOf()

  const interval = Object.assign({
    method: Faker.random.arrayElement(['strava', 'fitbit', 'runkeeper', 'google-fit']),
    userId: ObjectId.createFromTime(Date.now()),
    startOfDay,
    startDate,
    endDate,
    height: Faker.random.number(),
    weight: Faker.random.number(),
    dob: Faker.date.past(),
    gender: ((Faker.random.number() % 2) === 0) ? 'male' : 'female',
    maxForPeriod: true,
    kudosPoints: Math.random(),
    calories: Math.random() * 60
  }, data)

  db.intervals.insert(interval, cb)
}
