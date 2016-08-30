const Async = require('async')

module.exports = function (db, startOfDay, user, cb) {
  Async.waterfall([
    function getMaxIntervals (cb) {
      db.intervals.aggregate([
        { $match: { startOfDay: { $gte: startOfDay }, userId: user._id, kudosPoints: { $gt: 0 } } },
        { $sort: { startDate: 1, calories: -1 } },
        { $group: { _id: '$startDate', maxCalories: { $first: '$_id' }, method: { $first: '$method' } } }
      ], {}, cb)
    },
    function replaceMaxs (res, cb) {
      if (!res || !res.length) return cb(null, [])
      const ids = res.map((d) => d.maxCalories)
      const bulkIntervals = db.intervals.initializeOrderedBulkOp()

      bulkIntervals.find({ startOfDay: { $gte: startOfDay }, userId: user._id }).update({ $unset: { maxForPeriod: true } })
      bulkIntervals.find({ _id: { $in: ids } }).update({ $set: { maxForPeriod: true } })
      bulkIntervals.execute(cb)
    }
  ], cb)
}
