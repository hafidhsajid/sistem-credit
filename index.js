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

app.get("/getcar", (req, res) => {
  var sess = req.session;
  if (sess.email) {
    data = con.query("SELECT * FROM `Car`", function (err, data) {
      data.map((element, idx) => {
        data[idx].Id = `CAR0000${data[idx].Id}`;
      });
      return res.json({
        data: data,
      });
    });
  } else {
    res.status(401).json({ message: " Please login first. " });
  }
});
app.get("/getleasing", (req, res) => {
  var sess = req.session;
  if (sess.email) {
    data = con.query("SELECT * FROM `Leasing`", function (err, data) {
      data.map((element, idx) => {
        data[idx].ID = `L00${data[idx].ID}`;
        data[idx].Rates = `${data[idx].Rates}%`;
      });
      return res.json({
        data: data,
      });
    });
  } else {
    res.status(401).json({ message: " Please login first. " });
  }
});

app.post("/makeinvoice", (req, res) => {
  var sess = req.session;

  if (sess.email) {
    // console.log(String(req.body.leasingId).slice(3));
    arrCar = [];
    arrLeasing = [];
    promises1 = con.query(
      `SELECT * FROM Car WHERE id=${String(req.body.carid).slice(7)}`,
      function (err, data) {
        arrCar = data;
        con.query(
          `SELECT * FROM Leasing WHERE ID=${String(req.body.leasingId).slice(
            3
          )}`,
          function (err, data) {
            arrLeasing = data;
            // console.log(`${arrLeasing[0].Rates} ,${arrLeasing[0].Terms},${((arrLeasing[0].Rates)/100)}`);
            // console.log(arrCar);
            // console.log(`${arrCar[0].Price}`);
            var bunga =
              ((arrLeasing[0].Rates / 100) * arrCar[0].Price) /
              arrLeasing[0].Terms;
            // console.log(`Bunga: ${(((arrLeasing[0].Rates)/100)*(arrCar[0].Price)/arrLeasing[0].Terms)}`);
            // console.log(`Cicilan: ${((arrCar[0].Price)/arrLeasing[0].Terms)+bunga}`);y
            con.query(
              `SELECT id,name FROM user WHERE email='${sess.email}' LIMIT 1`,
              function (err, data1) {
                if (err) {
                  console.log(err);
                }
                con.execute(
                  `INSERT INTO Invoice (IdLeasing, IdCustomer, jumlahPembayaran, updatedAt, createdAt) VALUES ('${
                    arrLeasing[0].ID
                  }','${data1[0].id}', '${
                    arrCar[0].Price / arrLeasing[0].Terms + bunga
                  }',  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                  function (err, data) {
                    if (err) {
                      console.log(err);
                    }
                    console.log(data);
                    if (data.affectedRows>0) {
                      
                      console.log(data.insertId);
                      return res.json({
                        nomerInvoice:`INV000${data.insertId}`,
                        nomerCostumer:`${data1[0].id}`,
                        namaCostumer: `${data1[0].name}`,
                        penagih:`${arrLeasing[0].LeasingName}`,
                        jumlah:`${arrCar[0].Price / arrLeasing[0].Terms + bunga}`,
                        status:'Menunggu',
                        // data: arrCar,
                        // data1: arrLeasing,
                      });
                    }


                  }
                );
              }
            );
          }
        );
      }
    );

    // res.send(invoicearr);
  } else {
    res.status(401).json({ message: " Please login first. " });
  }
});

app.post("/transfer", (req, res) => {
  var sess = req.session;
  console.log(sess.email);
  if (sess.email) {
    con.query(
      `SELECT id,name FROM user WHERE email='${sess.email}' LIMIT 1`,
      function (err, data1) {
        if (err) {
          console.log(err);
        }
    con.query(
      `SELECT * FROM Invoice WHERE Id='${String(req.body.invoiceId).slice(6)}' LIMIT 1`,
      function (err, data2) {
        if (err) {
          console.log(err);
        }
        console.log(data2);
      

    con.execute(
      `INSERT INTO Pembayaran  (IdInvoice, IdCustomer, IdLeasing, jumlahPembayaran, createdAt, updatedAt) VALUES ('${
        String(req.body.invoiceId).slice(6)
      }','${data1[0].id}', '${data2[0].IdLeasing}'
      ,'${data2[0].jumlahPembayaran}',  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      function (err, data3) {
        if (err) {
          console.log(err);
        }
        console.log(data3);
        if (data3.affectedRows>0) {
          
          console.log(data3.insertId);
          // return res.json({
          //   nomerInvoice:`INV000${data3.insertId}`,
          //   nomerCostumer:`${data1[0].id}`,
          //   namaCostumer: `${data1[0].name}`,
          //   // penagih:`${arrLeasing[0].LeasingName}`,
          //   // status:'Menunggu',
          // });
        
        }


      }
    );
      });
      });
  } else {
    return res.status(401).json({ message: " Please login first. " });
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
