// Maps the number of kudosPoints scored in a UTC calendar day to the number of
// KudosCoins that should be awarded as a result

// The coin mapping MUST be in descending order of minPoints
const coinMapping = [
  { minPoints: 25, coins: 9 },
  { minPoints: 20, coins: 8 },
  { minPoints: 15, coins: 7 },
  { minPoints: 10, coins: 6 },
  { minPoints: 2, coins: 5 },
  { minPoints: 0, coins: 1 }
]

function calcKudosCoins (kudosPoints) {
  if (typeof kudosPoints !== 'number') throw new Error('KudosPoints must be a number')
  const band = coinMapping.find(({ minPoints }) => minPoints < kudosPoints)
  return band ? band.coins : 0
}

module.exports = {
  calcKudosCoins
}
