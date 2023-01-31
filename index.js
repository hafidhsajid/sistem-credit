var express = require("express");
var LocalStrategy = require("passport-local");
var dotenv = require("dotenv").config();
var app = express();
var con = require("./database");
var bodyparser = require("body-parser");

var session = require("express-session");

app.use(session({ secret: process.env.SESSION_SECRET || "secretttt" }));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});
app.get("/get", (req, res) => {
  var sess = req.session;
  if (sess.email) {
    data = con.query("SELECT * FROM `Barang`", function (err, data) {
      return res.json({
        data: data,
      });
    });
    // res.write(`<h1>Hello ${sess.email} h1><br>`);
    // res.end('+'>Logout');
  } else {
    res.status(401).json({ message: " Please login first. " });
    // res.end('+'>Login');
  }
});
app.post("/login", (req, res) => {
  if (req.body.email != undefined) {
    con.query(
      "SELECT * FROM user WHERE email = ?",
      [req.body.email],
      (err, result) => {
        if (err) {
          return res.json({ message: "Database error" });
          //   res.status(500).send(JSON.stringify({ message: "Database error" }));
        } else {
          if (result.length > 0) {
            if (result[0].password == req.body.password) {
              var sess = req.session;
              sess.email = req.body.email;
              return res.json({
                message: "Login Berhasil",
                status: 200,
                // data: token,
              });
            } else {
              res.status(401).json({ message: "Wrong email or password" });
            }
          } else {
            res.status(401).json({ message: "Wrong email or password" });
          }
        }
      }
    );
  } else {
    return res.json({ data: "" });
    // res.status(401).send(JSON.stringify({ data: "" }));
  }
});

app.get("/logout",(req,res)=>{
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});


app.listen(3000);
