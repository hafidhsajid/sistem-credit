var express = require("express");
var LocalStrategy = require("passport-local");
var dotenv = require("dotenv").config();
var app = express();
var con = require("./database");
app.use(express.json());

console.log(process.env.DB_HOST);
app.get("/", (req, res) => {
  res.json({ message: "ok" });
});
app.get("/get", (req, res) => {
  data = con.query("SELECT * FROM `Barang`", function (err, data) {
    return res.json({
      data: data,
    });
  });
});
app.listen(3000);
