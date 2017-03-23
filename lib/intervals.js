const activityNames = require('activity-names')
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
      [{
        startDate (number): start of the interval in ms since epoch,
        endDate (number); end of the interval in ms since epoch,
        calories (number): total calories expended during this interval (across all activities)
        types (array): normalised activity names during this interval
      }]
*/
const calcIntervals = function ({ startDate, endDate, activities, intervalSize }) {
  if (!activities) return []
  let intervals = []
  for (let time = startDate; time < endDate; time += intervalSize) {
    let endTime = time + intervalSize
    let {calories, types} = dataInPeriod(time, endTime, activities)
    if (calories) {
      intervals.push({
        startDate: time,
        endDate: endTime,
        calories,
        types
      })
    }
  }
  return intervals
}

// (num, num, arr) => {calories: 36, types: ['Running']}
// Type name are ordered with the longest running activity first.
function dataInPeriod (startDate, endDate, activities) {
  return activities
    .map((a) => ({activity: a, ms: activeMillisInPeriod(startDate, endDate, a)}))
    .sort((a, b) => b.ms - a.ms)
    .reduce((res, {ms, activity}) => {
      if (!ms || !activity.calsPerMilli) return res
      const calories = activity.calsPerMilli * ms
      // normalise the name of the activity for our intervals
      const type = activity.type ? activityNames(activity.type) : 'Activity'
      return {
        calories: res.calories + calories,
        types: res.types.concat([type])
      }
    }, {calories: 0, types: []})
}

function activeMillisInPeriod (startDate, endDate, activity) {
  const startMillis = Math.max(startDate, activity.startDate)
  const endMillis = Math.min(endDate, activity.endDate)
  const overlapMillis = Math.max(endMillis - startMillis, 0)
  return overlapMillis
}

function enrichInterval (user, bmrPerInt, intervalSize, method, interval) {
  const kudosPoints = kp.kudosPoints({
    cals: interval.calories,
    user,
    bmrPerInt,
    intervalSize,
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
module.exports.storeAsIntervals = function ({ db, startDate, endDate, activities, user, method, intervalSize, intervals }, done) {
  const bmrPerInt = kp.bmrPerInterval(user, intervalSize)
  // calculate intervals from activities if they haven't been passed in
  intervals = (intervals || calcIntervals({ startDate, endDate, activities, intervalSize }))
    .map(enrichInterval.bind(null, user, bmrPerInt, intervalSize, method))

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
