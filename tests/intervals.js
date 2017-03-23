const test = require('tape')
const moment = require('moment')
const calcIntervals = require('..').intervals.calcIntervals

test('Should calculate intervals', (t) => {
  const start = moment('2017-01-10T10:00:00Z')
  const activities = [
    {
      startDate: moment(start).add(14, 'minutes').valueOf(),
      endDate: moment(start).add(16, 'minutes').valueOf(),
      calsPerMilli: 0.01,
      type: 'Ride'
    },
    {
      startDate: moment(start).add(15, 'minutes').valueOf(),
      endDate: moment(start).add(20, 'minutes').valueOf(),
      calsPerMilli: 0.02,
      type: 'Run'
    }
  ]
  const startDate = start.valueOf()
  const endDate = moment(start).add(4, 'hours').valueOf()
  const intervalSize = 1000 * 60 * 15

  // DO IT!
  const intervals = calcIntervals({startDate, endDate, activities, intervalSize})

  t.equal(intervals.length, 2, 'Found 2 intervals with activity')
  t.equal(intervals[0].startDate, startDate, 'interval times as expected')
  t.equal(intervals[0].endDate, moment(startDate).add(intervalSize, 'ms').valueOf(), 'interval times as expected')
  t.equal(intervals[1].startDate, moment(startDate).add(intervalSize, 'ms').valueOf(), 'interval times as expected')
  t.equal(intervals[1].endDate, moment(startDate).add(2 * intervalSize, 'ms').valueOf(), 'interval times as expected')
  t.equal(intervals[0].calories, 1000 * 60 * 0.01, 'Calories calc as expected')
  t.equal(intervals[1].calories, (1000 * 60 * 0.01) + (1000 * 60 * 5 * 0.02), 'Calories calc as expected')
  t.deepEqual(intervals[0].types, ['Cycling'], 'Activity names are normalised')
  t.deepEqual(intervals[1].types, ['Running', 'Cycling'], 'Activity names are ordered by duration')
  t.end()
})
