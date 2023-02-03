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

app.get("/getinvoice", (req, res) => {
  var sess = req.session;
  // if (sess.email) {
  con.query(
    `SELECT Invoice.Id nomerInvoice, user.id nomerCostumer, user.name namaCustomer, Leasing.LeasingName penagih, Invoice.jumlahPembayaran jumlah  FROM Invoice JOIN user ON Invoice.IdCustomer=user.id JOIN Leasing ON Leasing.ID=Invoice.IdLeasing WHERE user.email='${sess.email}';`,
    function (err, data) {
      // con.query(
      // `SELECT Invoice.Id nomerInvoice, user.id nomerCostumer, user.name namaCustomer, Leasing.LeasingName penagih, Invoice.jumlahPembayaran jumlah FROM Invoice JOIN user ON Invoice.IdCustomer=user.id WHERE user.email='admin@admin.com';`,
      // function (err, data) {
      invoicearr = [];

      invoicearr = data;
      const promises = invoicearr.map((element, idx) => {
        return new Promise((resolve) => {
          // console.log(invoicearr[idx]);
          console.log(idx);
          con.query(
            `SELECT Invoice.id Invoiceid, Leasing.LeasingName namaPenagih, user.name namaPembayar,Pembayaran.jumlahPembayaran jumlahPembayaran, Invoice.jumlahPembayaran jumlahTagihan, Pembayaran.updatedAt, Pembayaran.createdAt, Pembayaran.deletedAt FROM Pembayaran JOIN Invoice ON Invoice.Id = Pembayaran.IdInvoice JOIN Leasing ON Leasing.ID=Invoice.IdLeasing JOIN user ON Pembayaran.IdCustomer=user.id WHERE IdInvoice=${invoicearr[idx].nomerInvoice};`,
            function (err, data1) {
              // console.log(data[idx].id);
              if (err) {
                console.log("Error" + err);
              }
              // invoicearr[
              //   idx
              // ].nomerInvoice = `INV000${invoicearr[idx].nomerInvoice}`;
              // invoicearr[
              //   idx
              // ].nomerCostumer = `CUST000${invoicearr[idx].nomerCostumer}`;
              if (data1.length > 0) {
                invoicearr[idx].status = "OWE";
              } else {
                invoicearr[idx].status = "Menunggu";
              }
              pembayaran = [];
              invoicearr[idx].pembayaran = data1;
              invoicearr[
                idx
              ].nomerInvoice = `INV0000${invoicearr[idx].nomerInvoice}`;
              invoicearr[
                idx
              ].nomerCostumer = `CUST0000${invoicearr[idx].nomerCostumer}`;
              sumpayment = 0;

              data1.map((element, idx) => {
                data1[idx].Invoiceid = `INV0000${data1[idx].Invoiceid}`;
                data1[idx].jumlahTagihan = invoicearr[idx].jumlah;
                sumpayment += data1[idx].jumlahPembayaran;
                data1[idx].sisaPembayran = invoicearr[idx].jumlah - sumpayment;
              });
              resolve();

              // console.log(data);
            }
          );
        });
      });

      Promise.all(promises).then(() => {
        res.send(invoicearr);
      });
      // res.json({
      //   data: data,
      // });
      // console.log(data);
    }
  );
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
          console.log(result[0].name);
          if (result.length > 0) {
            if (result[0].password == req.body.password) {
              var sess = req.session;
              sess.email = req.body.email;
              sess.name = result[0].name;
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

              res.status(201).json({
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
  var sess = req.session;
  if (sess.name) {
    var name = sess.name;

    req.session.destroy((err) => {
      if (err) {
        return console.log(err);

        // return res.status(500).json({ message: "Something wrong!", error: err });
      }
    });

    res.json({ message: `Thankyou ${name}, See You Next Time!` });
  } else {
    res.json({ message: `Thankyou, See You Next Time!` });
  }
});

app.listen(3000, (err) => {
  if (err) {
    console.log(err);
  }
  console.log("Server is running on port 3000");
});
