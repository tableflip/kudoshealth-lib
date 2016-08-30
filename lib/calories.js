module.exports = {
  getTotal ({ db, user, startDate, endDate, strategies }, cb) {
    if (!startDate) return cb(null, 0)
    let match = {
      kudosPoints: { $gt: 0 },
      userId: user._id,
      startDate: { $gte: startDate.valueOf() },
      endDate: { $lte: endDate.valueOf() },
      maxForPeriod: true
    }
    if (strategies) match.method = { $in: strategies }
    db.intervals.aggregate([
      { $match: match },
      { $group: { _id: '$userId', kudosPoints: { $sum: '$kudosPoints' } } }
    ], (err, res) => {
      if (err) return cb(err)
      if (!res || !res.length) return cb(null, 0)
      cb(err, res[0].kudosPoints)
    })
  }
}
