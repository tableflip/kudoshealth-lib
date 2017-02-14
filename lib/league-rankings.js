const MemberRankings = require('./member-rankings')
const TeamRankings = require('./team-rankings')

module.exports.get = ({ db, group, sinceDate }, cb) => {
  if (group.teamSize === 1) {
    MemberRankings.get({ db, group }, cb)
  } else {
    TeamRankings.get({ db, group }, cb)
  }
}
