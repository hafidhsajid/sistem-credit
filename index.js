var express = require("express");
var LocalStrategy = require("passport-local");
var dotenv = require("dotenv").config();
var app = express();
var con = require("./database");
var bodyparser = require("body-parser");
var session = require("express-session");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretttt",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 3,
    },
  })
);

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
  } else {
    res.status(401).json({ message: " Please login first. " });
  }
});

app.post("/deposit", (req, res) => {
  var sess = req.session;
  console.log(sess.email);
  if (sess.email) {
    if (req.body.deposit === undefined) {
      return res.status(500).json({ message: " Input deposit first. " });
    } else {
      data = con.query(
        `SELECT * FROM user WHERE user.email='${sess.email}'`,
        function (err, data) {
          var depositSql = `UPDATE user SET balance =${data[0].balance}+${req.body.deposit} WHERE user.id =${data[0].id} ;`;

          con.query(
            depositSql,
            [req.body.name, req.body.email, req.body.password],
            (err, rows, field) => {
              // error handling
              if (err) {
                return res
                  .status(500)
                  .json({ message: "Gagal melakukan deposit!", error: err });
              }

              // res
              //   .status(201)
              //   .json({ success: true, message: "Berhasil melakukan deposit!" });
            }
          );
          var idFormat = parseInt(data[0].balance) + parseInt(req.body.deposit);
          idFormat = idFormat.toLocaleString("id-ID");
          return res.json({
            Name: data[0].name,
            Balance: `Rp. ${idFormat}`,
          });
        }
      );
    }
  } else {
    return res.status(401).json({ message: " Please login first. " });
  }
});
app.post("/login", (req, res) => {
  if (req.body.email != undefined && req.body.password != undefined) {
    con.query(
      "SELECT * FROM user WHERE email = ?",
      [req.body.email],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Database error" });
        } else {
          if (result.length > 0) {
            if (result[0].password == req.body.password) {
              var sess = req.session;
              sess.email = req.body.email;
              var idFormat = parseInt(result[0].balance).toLocaleString(
                "id-ID"
              );
              return res.json({
                Name: result[0].name,
                Balance: `Rp. ${idFormat}`,
                message: "Login Berhasil",
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
    return res.json({ data: "Input not valid" });
  }
});

app.post("/regis", (req, res) => {
  var data = { ...req.body };
  data.created_at = new Date();

  con.query(
    "SELECT * FROM user WHERE email = ?",
    [req.body.email],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      } else {
        if (result.length > 0) {
          res.status(500).json({ message: "Gagal! Email sudah terdaftar" });
        } else {
          var querySql = `INSERT INTO user (name, email, password) VALUES ('${req.body.name}', '${req.body.email}', '${req.body.password}')`;

          con.query(
            querySql,
            [req.body.name, req.body.email, req.body.password],
            (err, rows, field) => {
              // error handling
              if (err) {
                return res
                  .status(500)
                  .json({ message: "Gagal melakukan registrasi!", error: err });
              }

              res
                .status(201)
                .json({
                  success: true,
                  message: "Berhasil melakukan registrasi!",
                });
            }
          );
        }
      }
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect("/");
  });
});

app.listen(3000, (err) => {
  if (err) {
    console.log(err);
  }
  console.log("Server is running on port 3000");
});
