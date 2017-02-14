module.exports = function ({ team, league }) {
  return team.members
    .filter((m) => m.active)
    .map((m) => m.startDate)
    .sort((a, b) => a.getTime() - b.getTime())[league.minTeamSize - 1]
}
