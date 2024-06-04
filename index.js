import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "dr$Mac123#",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

// async function getCurrentUser() {
//   const result = await db.query("SELECT * FROM users");
//   const users = result.rows;
//   const currentUser = users.find((u) => u.id == currentUserId) || users[0];
//   return currentUser;
// }

app.get("/", async (req, res) => {
  const users = await db.query("SELECT * FROM users");
  const user = users.rows;
  const currentUser = user.find((u) => u.id == currentUserId) || user[0];
  console.log(currentUser);
  // console.log(currentUserId);
  const countries = await checkVisisted();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users.rows,
    color: currentUser.color,
  });
});

app.post("/add", async (req, res) => {
  try{
    const newCountry = req.body["country"];
    console.log(newCountry);
    const countryCode = await db.query("SELECT country_code FROM countries WHERE country_name = '" + newCountry + "'");
    const countryCodeID = countryCode.rows[0].country_code;
    console.log(countryCodeID);
    
    try{
      await db.query("INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)", [countryCodeID, currentUserId]);
      res.redirect("/");
    }catch(error){
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
    
  }catch(error){
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
 
  const result = await db.query("INSERT INTO users(name,color) VALUES($1,$2) RETURNING id", [req.body.name, req.body.color]);
  console.log(result.rows[0].id);           
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
