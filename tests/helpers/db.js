const mongojs = require('mongojs')
const collections = [
  'dailyStats',
  'migrations',
  'users',
  'groups',
  'intervals',
  'tokens',
  'oldIntervals',
  'passwordTokens',
  'notifications'
]

module.exports = ({ mongo }) => mongojs(mongo, collections)
module.exports.collections = collections
