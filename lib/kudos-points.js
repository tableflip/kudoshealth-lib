const moment = require('moment')

function bmr (user, date = moment.utc().toDate()) {
  const missingData = ['gender', 'dob', 'weight', 'height'].some((field) => !user[field])
  if (missingData) return 0
  const age = moment.utc(date).diff(moment.utc(user.dob), 'years')
  if (user.gender === 'Male') {
    return (10 * user.weight) + (6.25 * user.height) - (5 * age) + 5
  }
  return (10 * user.weight) + (6.25 * user.height) - (5 * age) - 161
}

function bmrPerInterval (user, intervalSize, date) {
  const intervalDayPortion = intervalSize / (24 * 60 * 60 * 1000)
  return bmr(user, date) * intervalDayPortion
}

// 'googleFit' param is to make this work with the broken Google Fit API:
// Despite advertising "calories-from-activities" and "calories-from-bmr",
// the Google Fit API returns a permanent aggregation of calories from activities
// (even when you're asleep) and virtually nothing from BMR.  So, we have to
// *subtract* the internal BMR calc from their results to get a reasonable estimate
function kudosPoints ({ cals, user, bmrPerInt, date, intervalSize, method }) {
  const intervalDayPortion = intervalSize / (24 * 60 * 60 * 1000)
  const missingData = ['gender', 'dob', 'weight', 'height'].some((field) => !user[field])
  if (missingData) return 0
  bmrPerInt = bmrPerInt || bmrPerInterval(user, intervalSize, date)
  // Need to scale down the points for one interval so that the total kudos points
  // for a whole day equal the percentage of calorie expenditure from exercise
  // rather than the percentage for every single interval
  switch (method) {
    case 'google-fit':
      const ratio = Math.max(0, ((cals - bmrPerInt) / (cals || 1)))
      if (ratio < 0.65) return 0
      return ratio * 100 * intervalDayPortion

    case 'fitbit':
      return Math.max(0, ((cals - bmrPerInt) / (cals || 1))) * 100 * intervalDayPortion

    default:
      return (cals / (bmrPerInt + cals)) * 100 * intervalDayPortion
  }
}

function kudosPointsFromInterval (interval) {
  return kudosPoints({
    cals: interval.calories,
    user: interval,
    date: interval.startOfDay,
    method: interval.method,
    intervalSize: interval.endDate - interval.startDate
  })
}

module.exports = {
  bmrPerInterval,
  kudosPoints,
  kudosPointsFromInterval
}
