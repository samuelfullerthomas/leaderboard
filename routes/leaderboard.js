const axios = require('axios')
const format = require('date-fns/format')
const subDays = require('date-fns/sub_days')
const isBefore = require('date-fns/is_before')
const calculations = require('../lib/calculations')
const regexes = require('../lib/regexes')
const cache = require('../lib/cache')

module.exports = async function (req, res) {
  const subdomain = req.params.subdomain
  const user = req.query.user
  const limit = req.query.limit
  const posts = req.query.posts || 200
  const sort = req.query.sort || 'activity'

  const subdomainHomepage = `https://${subdomain === 'www' ? '' : `${subdomain}.`}metafilter.com/`
  const cachedHomepage = await cache.get(subdomainHomepage)
  let startPosition
  if (cachedHomepage) {
    startPosition = cachedHomepage.match(regexes.postNumber)[1]
  } else {
    const { data } = await axios.get(subdomainHomepage)
    startPosition = data.match(regexes.postNumber)[1]
    cache.set(subdomainHomepage, data, { expires: 15 })
  }
  console.log(`requesting from post ${startPosition}`)

  const responses = await createBatches({
    numberOfPosts: Number(posts),
    startPosition,
    subdomain
  })
  console.log('batches resolved!')

  const userInformation = responses.map(({ data }, index, resp) => {
    if (!data) return []
    const strippedData = data.replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '').replace(/\0/g, '')
    const comments = strippedData.match(regexes.comments)
    if (!comments) return []

    if (index === resp.length - 1) {
      console.log(`${format(new Date(), 'MMMM Do, YYYY')} to ${data.match(regexes.dateRegex)[1]}`)
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
  function flatten (arr) {
    return arr.reduce((acc, currentArr) => acc.concat(currentArr), [])
  }

  function rankCommenters (commenters) {
    const commentersArr = Object.values(commenters)
    const qualifiedCommenters = commentersArr.filter(c => c.commentCount >= 5)
    let currentPopularityRank = 0
    const popularitySorted = Object.values(commentersArr)
      .sort((a, b) => a.commentCount < b.commentCount ? 1 : -1)
      .map((userInfo, index) => {
        userInfo.activityRank = index + 1
        return userInfo
      })
      .sort((a, b) => a.favorited < b.favorited ? 1 : -1)
      .map((userInfo, index) => {
        userInfo.popularityRank = index + 1
        return userInfo
      })
      .map((userInfo) => {
        userInfo.coolness = userInfo.activityRank - userInfo.popularityRank
        return userInfo
      }).sort((a, b) => {
        return a.favoritesPerComment < b.favoritesPerComment ? 1 : -1
      }).map((userInfo, index) => {
        const moreThanTenComments = userInfo.commentCount >= 5
        if (moreThanTenComments) {
          currentPopularityRank = currentPopularityRank + 1
          userInfo.relativePopularity = `${currentPopularityRank} of ${qualifiedCommenters.length}`
        }
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
    return popularitySorted
  }
  const leaderboard = rankCommenters(flatten(userInformation).reduce((users, comment) => {
    const { name, href, userId, tags, commentFavorites, commentUrl } = comment
    const currentTags = users[userId] ? users[userId].tags : {}
    const commentCount = users[userId] ? users[userId].commentCount + 1 : 1
    const favorited = users[userId] ? users[userId].favorited + commentFavorites : commentFavorites
    const politicalness = calculations.percentage(currentTags.potus45, commentCount)
    const favoritesPerComment = favorited / commentCount

    tags.forEach(tag => {
      currentTags[tag] ? currentTags[tag] = currentTags[tag] + 1 : currentTags[tag] = 1
    })
    const comments = users[userId]
      ? users[userId].comments.concat([{
        commentUrl,
        commentFavorites,
        tags
      }])
      : [{
        commentUrl,
        commentFavorites,
        tags
      }]

    users[userId] = {
      tags: currentTags,
      favoritesPerComment,
      politicalness,
      commentCount,
      favorited,
      comments,
      userId,
      href,
      name
    }
    return users
  }, {}))

  const totalComments = leaderboard.reduce((acc, user) => {
    acc = acc + user.commentCount
    return acc
  }, 0)
  const politicalComments = leaderboard.reduce((acc, user) => {
    acc = acc + (user.tags.potus45 ? user.tags.potus45 : 0)
    return acc
  }, 0)

  console.log(`Total comments: ${totalComments}`)
  console.log(`Political comments: ${politicalComments}`)
  console.log(`Political percentage (sitewide): ${politicalComments / totalComments}`)

  if (user) {
    const singleUser = leaderboard.filter((userInfo) => userInfo.name === user)
    res.send({
      data: singleUser
    })
  } else {
    res.send({
      data: limit ? leaderboard.slice(0, limit) : leaderboard
    })
  }

  async function createBatches ({ numberOfPosts, startPosition, subdomain }) {
    return new Promise(async (resolve, reject) => {
      let currentProccessed = 0
      let batchSize = numberOfPosts < 30 ? numberOfPosts : 30
      let sp = startPosition
      let batchResponses = []
      console.log('starting batches...')
      while (currentProccessed < numberOfPosts) {
        console.log(`current processed: ${currentProccessed}`)
        const batchedResponses = await batch(sp, batchSize, subdomain)
        const batchResponse = await Promise.all(batchedResponses)
        batchResponses = batchResponses.concat(batchResponse)
        sp = sp - batchSize
        currentProccessed = currentProccessed + batchSize
        batchSize = (numberOfPosts - currentProccessed) < 30 ? (numberOfPosts - currentProccessed) : 30
      }
      console.log('resolving batches...')
      batchResponses.forEach(response => {
        if (!response.fromCache) {
          const cuttoff = subDays(new Date(), 2)
          let options = {}
          // if (isBefore(new Date(response.data.match(regexes.dateRegex)[1]), cuttoff)) {
          //   options.expires = 60 * 24 * 7
          // }
          cache.set(`https://${subdomain}.metafilter.com/${response.request.path.split('/')[1]}`, response.data, options)
        }
      })
      resolve(batchResponses)
    })
  }

  async function batch (startPosition, batchNumber, subdomain) {
    let x = 0
    let responses = []
    while (x < batchNumber) {
      const cachedResponse = await cache.get(`https://${subdomain}.metafilter.com/${startPosition - x}`)
      if (cachedResponse) {
        responses.push(new Promise((resolve) => resolve({ data: cachedResponse, fromCache: true })))
      } else {
        responses.push(axios.get(`https://${subdomain}.metafilter.com/${startPosition - x}`).catch(e => {
          console.log(e.code)
          return { data: '' }
        }))
      }
      x++
    }
    return responses
  }
}
