const test = require('tape')
const chunkedOp = require('../lib/chunked-op')

test('Should chunk operations successfully', (t) => {
  let total = 0
  chunkedOp(
    [1, 2, 3, 4, 5],
    (n) => { total += n },
    2,
    function chunkCallback (cb) {
      setTimeout(cb, 100)
    },
    function finalCallback () {
      t.equals(total, 15, 'All numbers should have been added to total')
      t.end()
    }
  )
})
