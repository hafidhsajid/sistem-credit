var mysql = require("mysql2");

var con = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "",
});

con.connect(function(err) {
    if (err) {
        console.error("error connecting: " + err.stack);
        res
            .status(500)
            .json(({ message: "Database connection error" }));
    } else {
        console.log("Database connected succesfully!");
    }
});

module.exports = con;

