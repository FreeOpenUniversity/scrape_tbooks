const express = require("express");
const _ = require("lodash");
const { refreshLinks } = require("./scrape");
const links = JSON.parse(
  require("fs")
    .readFileSync(__dirname + "/links.json")
    .toString()
).map((l, i) => ({ ...l, id: i }));

const app = express();
const port = process.env.PORT || 5000;

const linksByCategory = links.reduce((obj, curr) => {
  obj[curr.category]
    ? obj[curr.category].push(curr)
    : (obj[curr.category] = [curr]);
  return obj;
}, {});

const categories = _.uniq(
  links.map(({ category }) => category)
).map((category, id) => ({ category, id }));

const linksByTitle = _.keyBy(links, "title");

app.post("/refreshLinks", (req, res) => {
  refreshLinks.then(res.json("done"));
});

app.get("/", (req, res) => {
  res.json({ endpoints: ["/book", "/category"] });
});

app.get("/book", (req, res) => {
  const image = "https://via.placeholder.com/150";
  const categories = req.query.category && req.query.category.split(",");
  let books = links;
  if (categories) {
    books = categories.map((cat) => linksByCategory[cat]).flat();
  }
  const booksWithImages = books.map((book) => ({ ...book, image }));
  res.json(booksWithImages);
});

app.get("/category", (req, res) => {
  res.json(categories);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
