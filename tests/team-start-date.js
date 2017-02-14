const test = require('tape')
const Faker = require('faker')
const teamStartDate = require('..').teamStartDate

test('Should return the correct start date for a team', (t) => {
  const minTeamSize = Faker.random.number({ min: 1, max: 10 })
  const members = Array(10).fill(0).map(() => ({
    active: true,
    startDate: Faker.date.recent()
  }))

  const startDate = teamStartDate({
    team: { members },
    league: { minTeamSize }
  })

  const joinersBeforeStartDate = members.filter((m) => m.startDate.getTime() <= startDate.getTime()).length
  t.equal(joinersBeforeStartDate, minTeamSize, 'The minimum team size of members joined on or before the returned start date')

  t.end()
})
