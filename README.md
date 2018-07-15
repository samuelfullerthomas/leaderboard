If you were to get API access, it works like this:
<strong>Usage:</strong>
<strong>GET</strong> https://api.samthomas.io/leaderboard/:subdomain
Subdomain can be metatalk, www (for metafilter), or ask
<strong>example:</strong>
https://api.samthomas.io/leaderboard/ask

https://api.samthomas.io/leaderboard/www?posts=300&limit=200


<strong>Filters:</strong>
posts: default 200<em> // the number of posts you want to include</em>
limit: default no limit<em> // the number of users you want to include (i.e., top 200)</em>
user: default null <em>// if you want to return information on a specific user (like yourself!)</em>
sort: default activity<em> // how you want to sort the comments (two options, activity and popularity)
</em>
<strong>example filtered request:</strong>
https://api.samthomas.io/leaderboard/www?posts=300&user=samuelfullerth


<strong>Response:</strong>
{
    totalComments: total comments over the last x number of posts
    politicalComments: total comments in threads tagged potus45
    politicalPercentage: percentage of total comments that are political
    dateRangeCovered: the dates those posts were made over
    data: [
        <em>// user information</em>
          {
              tags: tags of posts a user has commented in
              favoritesPerComment	: average number of favs / comment
              politicalCommentsPercentage: percentage of a users comments made in a political thread
              totalFavorites: total favorites of all the users comments
              commentCount: number of comments a user made over the previous x number of posts
              comments: [
                  commentUrl
                  favorites
              ]
              userId	user id
              href	user profile link
              name	username
              activityRank	how active the user is compared to the rest of the site
              popularityRank	how many total favorites a user has compared to the rest of the site
          }
    ]
}

