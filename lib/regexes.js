module.exports = {
  dateRegex: /((January|February|March|April|May|June|July|August|September|October|November|December)\W\d{1,2},\W\d{4})/,
  postNumber: /class="posttitle front"><a href="\/(\d+)\/.+">/,
  tags: /<a class="taglink".+>(.{0,20})<\/a>/g,
  comments: /<a name="\d{1,20}"><\/a><div class="comments(?: best)?" ?(?:id=".{0,10}")?>.*?<\/span><\/div><br><br>/g,
  user: {
    id: /<a href="https?:\/\/www\.metafilter\.com\/user\/(\d+?)" target="_self"\W?>.{1,60}<\/a>/,
    href: /<a href="(https?:\/\/www\.metafilter\.com\/user\/\d+)" target="_self"\W?>.{1,60}<\/a>/,
    name: /<a href="https?:\/\/www\.metafilter\.com\/user\/\d+" target="_self"\W?>(.{1,60})<\/a>/
  },
  comment: {
    text: /<div class="comments(?: best)?" ?(?:id=".{0,10}")?>(.*?)<span class="smallcopy">/,
    href: /href="(\/\d{1,6}\/.*?#\d{1,9})"/,
    favorites: /(\d{1,4}) favorite/
  }
}
