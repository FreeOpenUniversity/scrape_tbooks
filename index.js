const cheerio = require("cheerio")
const { log } = require("console")
const axios = require("axios").default
const fs = require("fs")
const { join } = require("url")

function cacheFact(base) {
  let cacheMap = {}
  let i = 0
  const cache = {
    async get(url) {
      const absoluteUrl = new URL(url, base).toString()
      if (fs.existsSync(cacheMap[absoluteUrl]))
        return fs.readFileSync(cacheMap[absoluteUrl]).toString()

      cacheMap[absoluteUrl] = `${i++}.html`
      const { data } = await axios.get(absoluteUrl)
      fs.writeFileSync(cacheMap[absoluteUrl], data)
      return data
    },
  }
  return cache
}

/**
 * @typedef { _url }node
 */
const cache = cacheFact("https://github.com/")

async function getFileLinks(url) {
  const html = await cache.get(url)
  const $ = cheerio.load(html)
  const links = $("a.js-navigation-open")
  return $(links)
    .map((i, link) => ({
      text: $(link).text(),
      url: $(link).attr("href"),
    }))
    .toArray()
    .filter(({ url }) => url)
}

const rootUrl = "https://github.com/FreeOpenU/tbooks"

/**
 *
 * @param {string[]} visited
 * @param {string} rootUrl
 */
async function recGetLinks(visited, rootUrl) {
  if (rootUrl.includes("tbooks/blob/master")) {
    return [rootUrl.replace("tbooks/blob/master", "tbooks/raw/master")]
  }
  const links = await getFileLinks(rootUrl)
  let leaves = [rootUrl]
  for (const link of links.filter((l) => !visited.includes(l.url))) {
    leaves = leaves.concat(await recGetLinks(leaves, link.url))
  }
  return leaves
}

recGetLinks([], rootUrl).then((l) =>
  fs.writeFileSync("links.json", JSON.stringify(l))
)

// const url = "https://github.com/FreeOpenU/tbooks"
