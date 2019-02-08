const regexes = require('./regexes')
const format = require('date-fns/format')

module.exports = function createUserInformation (responses, subdomain) {
  let dateRangeCovered
  const users = responses.map(({ data }, index, resp) => {
    if (!data) return []
    const strippedData = data.replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '').replace(/\0/g, '')
    const comments = strippedData.match(regexes.comments)
    if (!comments) return []

    if (index === resp.length - 1) {
      const startDate = data.match(regexes.dateRegex)[1]
      const endDate = format(new Date(), 'MMMM Do, YYYY')
      dateRangeCovered = `${startDate} to  ${endDate}`
      console.log(dateRangeCovered)
    }

    const tagInfo = data.match(regexes.tags) ? data.match(regexes.tags).map(match => {
      return match.match(/>(.{0,20})<\/a>/) && match.match(/>(.{0,20})<\/a>/)[1]
    }) : []

    return comments.map(comment => {
      const commentFavorites = comment.match(regexes.comment.favorites)
        ? Number(comment.match(regexes.comment.favorites)[1])
        : 0
      return {
        userId: Number(comment.match(regexes.user.id)[1]),
        href: comment.match(regexes.user.href)[1],
        name: comment.match(regexes.user.name)[1],
        commentFavorites,
        commentUrl: `https://${subdomain}.metafilter.com${comment.match(regexes.comment.href)[1]}`,
        tags: tagInfo
      }
    })
  })

  return {
    users,
    dateRangeCovered
  }
}
