const moment = require('moment')
const kp = require('./kudos-points')
const chunkedOp = require('./chunked-op')

/*  Convert an array of activities into an array of intervals with start and end dates (in ms since epoch)
    and the number of calories expended during that interval.
    Params:
      {
        startDate (number): start of the period you want to divide into intervals, in ms since epoch,
        endDate (number): end of the period in ms since epoch,
        activities ([object]): an array of objects with at least the following keys,
          [{
            startDate (number): start of the activity, in ms since epoch,
            endDate (number): end of the activity, in ms since epoch,
            calsPerMilli: the number of calories burned per millisecond during this activity
          }]
        intervalSize (number): the desired size of each interval in ms
      }
    Returns:
      {
        startDate (number): start of the interval in ms since epoch,
        endDate (number); end of the interval in ms since epoch,
        calories (number): total calories expended during this interval (across all activities)
      }
*/
const calcIntervals = function ({ startDate, endDate, activities, intervalSize }) {
  if (!activities) return []
  let intervals = []
  for (let time = startDate; time < endDate; time += intervalSize) {
    let endTime = time + intervalSize
    let calories = activities.map(caloriesInPeriod.bind(null, time, endTime)).reduce((x, y) => x + y, 0)
    if (calories) {
      intervals.push({
        startDate: time,
        endDate: endTime,
        calories
      })
    }
  }
  return intervals
}

function caloriesInPeriod (startDate, endDate, activity) {
  const startMillis = Math.max(startDate, activity.startDate)
  const endMillis = Math.min(endDate, activity.endDate)
  const overlapMillis = Math.max(endMillis - startMillis, 0)
  return overlapMillis * activity.calsPerMilli
}

function enrichInterval (user, bmrPerInt, method, interval) {
  const kudosPoints = kp.kudospoints({
    cals: interval.calories,
    user,
    bmrPerInt,
    method
  })
  return Object.assign({
    userId: user._id,
    method: method,
    startOfDay: moment.utc(interval.startDate).startOf('day').valueOf(),
    height: user.height,
    weight: user.weight,
    gender: user.gender,
    dob: user.dob,
    kudosPoints
  }, interval)
}

// Calulate intervals, enrich with user data, delete old ones, then save.
module.exports.storeAsIntervals = function (db, startDate, endDate, activities, user, method, intervalSize, done) {
  const bmrPerInt = kp.bmrPerInterval(user, intervalSize)
  const intervals = calcIntervals({ startDate, endDate, activities, intervalSize })
    .map(enrichInterval.bind(null, user, bmrPerInt, method))

  let bulkIntervals = db.intervals.initializeUnorderedBulkOp()
  // Bulk updates only accept up to 1000 operations in the current MongoJS (there is a PR for this)
  chunkedOp(
    intervals,
    function operation (i) {
      bulkIntervals.find({ userId: user._id, method, startDate: i.startDate }).upsert().update({ $set: i })
    },
    500,
    function chunkCallback (cb) {
      bulkIntervals.execute((err) => {
        if (err) return cb(err)
        bulkIntervals = db.intervals.initializeUnorderedBulkOp()
        cb()
      })
    },
    function finalCallback () {
      bulkIntervals.execute(done)
    }
  )
}

module.exports.calcIntervals = calcIntervals

module.exports.enrichInterval = enrichInterval
