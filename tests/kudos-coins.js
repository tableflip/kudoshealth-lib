const test = require('tape')
const { calcKudosCoins } = require('../lib/kudos-coins')

const testSet = [
  { kudosPoints: 99999999, kudosCoins: 9 },
  { kudosPoints: 25.01, kudosCoins: 9 },
  { kudosPoints: 25, kudosCoins: 8 },
  { kudosPoints: 24, kudosCoins: 8 },
  { kudosPoints: 20, kudosCoins: 7 },
  { kudosPoints: 19.9999999, kudosCoins: 7 },
  { kudosPoints: 16, kudosCoins: 7 },
  { kudosPoints: 15, kudosCoins: 6 },
  { kudosPoints: 12.123456, kudosCoins: 6 },
  { kudosPoints: 10, kudosCoins: 5 },
  { kudosPoints: 5, kudosCoins: 5 },
  { kudosPoints: 2.01, kudosCoins: 5 },
  { kudosPoints: 2, kudosCoins: 1 },
  { kudosPoints: 0.0000001, kudosCoins: 1 },
  { kudosPoints: 0, kudosCoins: 0 },
  { kudosPoints: -136, kudosCoins: 0 }
]

test('KudosCoins function', (t) => {
  testSet.forEach(({ kudosPoints, kudosCoins }) => {
    t.equals(calcKudosCoins(kudosPoints), kudosCoins, 'Calculated number of KudosCoins should be correct')
  })
  t.throws(() => calcKudosCoins('foobar'), 'KudosCoins calculation throws with string argument')
  t.throws(() => calcKudosCoins(), 'KudosCoins calculation throws with no argument')
  t.end()
})
