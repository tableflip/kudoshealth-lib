const Async = require('async')
const moment = require('moment')
const Calories = require('./calories')

module.exports.get = ({ db, group, sinceDate }, cb) => {
  Async.waterfall([
    function getMembers (cb) {
      getGroupMembers(db, group, cb)
    },
    function getRankings (members, cb) {
      getGroupRankings(db, group, members, sinceDate, cb)
    }
  ], cb)
}

function getGroupMembers (db, group, cb) {
  const userIds = (group.members || [])
    .filter((m) => m.active && m.activated)
    .map((m) => m.user)

  const query = { _id: { $in: userIds }, deleted: false }
  const fields = { firstName: 1, lastName: 1, methods: 1 }

  db.users.find(query, fields, (err, users) => {
    if (err) return cb(err)
    cb(null, users.map((user) => {
      let member = group.members.find((m) => m.user && m.user.equals && m.user.equals(user._id))
      return Object.assign({}, member, user)
    }))
  })
}

function getGroupRankings (db, group, members, sinceDate, cb) {
  Async.map(members, (member, cb) => {
    let startDate = sinceDate || group.startDate

    if (member.startDate && moment.utc(member.startDate).isAfter(startDate)) {
      startDate = member.startDate
    }

    let endDate = moment.utc().toDate()

    if (group.endDate && moment.utc(group.endDate).isBefore(endDate)) {
      endDate = group.endDate
    }

    Calories.getTotal({ db, user: member, startDate, endDate }, (err, calories) => {
      if (err) return cb(err)
      cb(null, {
        userId: member._id,
        members: [member._id],
        name: `${member.firstName} ${member.lastName}`,
        active: member.active,
        activated: member.activated,
        startDate: member.startDate,
        score: Math.round(calories * 10) / 10
      })
    })
  }, (err, rankings) => {
    if (err) return cb(err)
    cb(null, addRank(rankings.sort(sortByScore)))
  })
}

function sortByScore (a, b) {
  if (a.score < b.score) return 1
  if (a.score > b.score) return -1
  if (a.name < b.name) return 1
  if (a.name > b.name) return -1
  return 0
}

function addRank (docs) {
  return docs.map((doc, ind) => {
    doc.ranking = ind
    return doc
  })
}
