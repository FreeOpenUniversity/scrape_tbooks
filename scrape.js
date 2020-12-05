const cheerio = require("cheerio");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

function hash(string) {
  var hash = 0;
  if (string.length == 0) {
    return hash;
  }
  for (var i = 0; i < string.length; i++) {
    var char = string.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function cacheFact(base) {
  const dir = "cache";
  const cache = {
    async get(url) {
      const absoluteUrl = new URL(url, base).toString();
      const fname = `${hash(absoluteUrl)}.html`;
      const cachePath = path.join(dir, fname);
      if (fs.existsSync(cachePath))
        return fs.readFileSync(cachePath).toString();
      const { data } = await axios.get(absoluteUrl);
      fs.writeFileSync(cachePath, data);
      return data;
    },
  };
  return cache;
}

/**
 * @typedef { _url }node
 */
const cache = cacheFact("https://github.com/");

async function getFileLinks(url) {
  const html = await cache.get(url);
  const $ = cheerio.load(html);
  const links = $("a.js-navigation-open");
  return $(links)
    .map((i, link) => ({
      text: $(link).text(),
      url: $(link).attr("href"),
    }))
    .toArray()
    .filter(({ url }) => url);
}

const rootUrl = "https://github.com/FreeOpenU/tbooks";

/**
 *
 * @param {string[]} visited
 * @param {string} rootUrl
 */
async function recGetLinks(visited, rootUrl) {
  if (rootUrl.includes("tbooks/blob/master")) {
    return [rootUrl.replace("tbooks/blob/master", "tbooks/raw/master")];
  }
  const links = await getFileLinks(rootUrl);
  let leaves = [rootUrl];
  for (const link of links.filter((l) => !visited.includes(l.url))) {
    leaves = leaves.concat(await recGetLinks(leaves, link.url));
  }
  return leaves;
}

module.exports.refreshLinks = recGetLinks([], rootUrl).then((l) => {
  const base = "https://github.com/";
  const links = l
    .filter((url) => url.toLowerCase().includes(".pdf"))
    .map((url) => {
      const [, , , , , category, title] = url.split("/");
      return {
        title: title.replace(".pdf", "").split("%20").join(" "),
        category,
        url: new URL(url, base).toString(),
      };
    });

  return fs.writeFileSync("links.json", JSON.stringify(links));
});

// const url = "https://github.com/FreeOpenU/tbooks"
