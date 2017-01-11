const Async = require('async')
const MemberRankings = require('./member-rankings')

module.exports.get = ({ db, group, sinceDate }, cb) => {
  Async.waterfall([
    function getPanelTeams (cb) {
      const panelIds = (group.panel || []).map((m) => m.panelId)
      if (!panelIds.length) return cb(null, [])

      db.groups.aggregate([
        { $match: { _id: { $in: panelIds }, deleted: false } },
        { $unwind: '$team' },
        { $project: { _id: 0, teamId: '$team.teamId' } }
      ], cb)
    },

    function getTeams (teamIdDocs, cb) {
      const teamIds = teamIdDocs.map((doc) => doc.teamId)
      const query = { _id: { $in: teamIds }, deleted: false }
      const fields = { members: 1, name: 1, startDate: 1 }

      db.groups.find(query, fields, cb)
    },

    function getRankings (teams, cb) {
      const getMemberRankings = (team, cb) => MemberRankings.get({ db, group: team, sinceDate }, cb)

      Async.map(teams, getMemberRankings, (err, memberRankings) => {
        if (err) return cb(err)

        const rankings = teams.map((team, i) => {
          const rankings = memberRankings[i]
          const total = rankings.reduce((total, ranking) => total + ranking.score, 0)
          const score = rankings.length ? Math.round((total / rankings.length) * 10) / 10 : 0

          return {
            name: team.name,
            userId: team._id,
            members: team.members.map((m) => m.user),
            startDate: team.startDate,
            endDate: team.endDate,
            score
          }
        })

        cb(null, addRank(rankings.sort(sortByScore)))
      })
    }
  ], cb)
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
