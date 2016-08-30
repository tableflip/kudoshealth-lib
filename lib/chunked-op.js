module.exports = function (array, operation, chunkSize, chunkCallback, finalCallback) {
  let i = 0
  const arraySize = array.length
  const iterate = function (err) {
    if (err) return finalCallback(err)
    if (i >= arraySize) return finalCallback()
    operation(array[i])
    i += 1
    if (i % chunkSize === 0) return chunkCallback(iterate)
    iterate()
  }
  iterate()
}
