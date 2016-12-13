const calories = require('./lib/calories')
const intervals = require('./lib/intervals')
const kudosPoints = require('./lib/kudos-points')
const leagueRankings = require('./lib/league-rankings')
const teamRankings = require('./lib/team-rankings')
const memberRankings = require('./lib/member-rankings')
const promote = require('./lib/promote')
const createAuth0Api = require('./lib/auth0-api')

module.exports = {
  calories,
  intervals,
  kudosPoints,
  leagueRankings,
  teamRankings,
  memberRankings,
  promote,
  createAuth0Api
}
