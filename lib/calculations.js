module.exports = {
  percentage: (tagAmount, totalAmount) => tagAmount ? `${(100 * (tagAmount / totalAmount).toFixed(2))}%` : '0%'
}
