const express = require("express");
const _ = require("lodash");
const links = JSON.parse(
  require("fs").readFileSync("links.json").toString()
).map((l, i) => ({ ...l, id: i }));
const app = express();
const port = process.env.PORT || 5000;

const linksByCategory = _.keyBy(links, "category");

const categories = _.uniq(
  links.map(({ category }) => category)
).map((category, id) => ({ category, id }));

const linksByTitle = _.keyBy(links, "title");

app.get("/books", (req, res) => {
  const image_url = "https://via.placeholder.com/150";
  const categories = req.query.category?.split(",");
  let books;
  if (categories) {
    books = categories.map((cat) => linksByCategory[cat]).flat();
  }
  booksWithImages = boks.map((book) => ({ ...book, image }));
  res.send(JSON.stringify(booksWithImages));
});

app.get("/category", (req, res) => {
  res.send(JSON.stringify(categories));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
