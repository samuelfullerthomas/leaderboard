const _ = require('lodash')

const flatten = require('../../../lib/flatten')

module.exports = function createLeaderboard (userInformation, sort, dateRangeCovered) {
  const leaderboard = {}

  leaderboard.users = rankCommenters(flatten(userInformation).reduce((users, comment) => {
    const { name, href, userId, tags, commentFavorites, commentUrl } = comment
    const currentTags = users[userId] ? users[userId].tags : {}
    const commentCount = users[userId] ? users[userId].commentCount + 1 : 1
    const totalFavorites = users[userId] ? users[userId].totalFavorites + commentFavorites : commentFavorites
    const politicalCommentsPercentage = Number(((currentTags.potus45 / commentCount) || 0).toFixed(2))
    const favoritesPerComment = Number(((totalFavorites / commentCount) || 0).toFixed(2))

    tags.forEach(tag => {
      currentTags[tag] ? currentTags[tag] = currentTags[tag] + 1 : currentTags[tag] = 1
    })

    const comments = users[userId]
      ? users[userId].comments.concat([{
        commentUrl,
        commentFavorites
      }])
      : [{
        commentUrl,
        commentFavorites
      }]

    users[userId] = {
      tags: currentTags,
      favoritesPerComment,
      politicalCommentsPercentage,
      totalFavorites,
      commentCount,
      comments: comments.sort((a, b) => a.commentFavorites < b.commentFavorites ? 1 : -1),
      userId,
      href,
      name
    }
    return users
  }, {}), sort)

  leaderboard.totalComments = leaderboard.users.reduce((acc, user) => {
    acc = acc + user.commentCount
    return acc
  }, 0)

  leaderboard.politicalComments = leaderboard.users.reduce((acc, user) => {
    acc = acc + (user.tags.potus45 ? user.tags.potus45 : 0)
    return acc
  }, 0)

  leaderboard.politicalPercentage = Number(((leaderboard.politicalComments / leaderboard.totalComments) || 0).toFixed(2))

  leaderboard.dateRangeCovered = dateRangeCovered

  leaderboard.getUser = function getUser (userName) {
    return leaderboard.users.filter((userInfo) => userInfo.name === userName)
  }

  return leaderboard
}

function rankCommenters (commenters, sort) {
  const commentersArr = Object.values(commenters)
  const popularitySorted = Object.values(commentersArr)
    .sort((a, b) => a.commentCount < b.commentCount ? 1 : -1)
    .map((userInfo, index) => {
      userInfo.activityRank = index + 1
      return userInfo
    })
    .sort((a, b) => a.totalFavorites < b.totalFavorites ? 1 : -1)
    .map((userInfo, index) => {
      userInfo.popularityRank = index + 1
      return userInfo
    })
  if (sort === 'activity') {
    return popularitySorted.sort((a, b) => {
      return a.commentCount < b.commentCount ? 1 : -1
    })
  }
  if (sort === 'popularity') {
    return popularitySorted.filter(comment => comment.commentCount > 10).sort((a, b) => {
      return a.favoritesPerComment < b.favoritesPerComment ? 1 : -1
    })
  }
  let test = true
  return popularitySorted.map(user => {
    if (test) {
      console.log(user)
      console.log(_.omit(user, ['tags', 'comments']))
      test = false
    }
    return _.omit(user, ['tags', 'comments'])
  })
}
