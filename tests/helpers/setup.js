const config = require('config')
const createDb = require('./db')

let context = null

module.exports.start = (opts, cb) => {
  if (!cb) {
    cb = opts
    opts = {}
  }

  opts = opts || {}
  const db = opts.db || createDb(config)
  context = { db }
  cb(null, context)
}

module.exports.stop = (cb) => {
  const ctx = context
  context = null

  if (!ctx) return process.nextTick(() => cb())
  ctx.db.close(true, cb)
}
