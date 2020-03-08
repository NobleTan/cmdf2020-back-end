const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000
const {Client} = require("pg");
const client = new Client();
app.get("/", (req, res) => {
    client.query("SELECT * FROM account", (err, dbres) => {
        res.send(dbres.row[0])        
    })
})

app.listen(PORT,()=>{});