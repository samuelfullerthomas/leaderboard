module.exports = function flatten (arr) {
  return arr.reduce((acc, currentArr) => acc.concat(currentArr), [])
}
