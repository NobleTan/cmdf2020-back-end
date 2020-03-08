const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000
const {Client} = require("pg");
const client = new Client({
    host:process.env.PGHOST,
    user:process.env.PGUSER,
    port:process.env.PGPORT,
    password:process.env.PGPASSWORD,
    database:process.env.PGDATABASE,
    ssl: true
});

app.get("/", (req, res) => {
    console.log("hello")
    client.connect().then(()=> {
        client.query("SELECT * FROM account;", (err, dbres) => {
            console.log(err)
            console.log(dbres)
            res.json(dbres.rows[0])        
        })
    })
})

app.listen(PORT,()=>{});
