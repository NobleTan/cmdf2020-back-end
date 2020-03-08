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


app.post('/reg', (req, res) => {        // loads new reg to database +check if username already exist
    console.log(req.body);
    let body = req.body;
    let userCheck = `SELECT * FROM account WHERE username = '${body.username}';`;
    pool.query(userCheck, (error, result) => {
      if (result.rows.length > 0) {
        res.render('pages/home', { 'props': { regFailed: true } });
        return;
      }
      var getUsersQuery = `INSERT INTO users (username , password) VALUES ('${body.username}' , '${body.password}');`;
      console.log(getUsersQuery);
      pool.query(getUsersQuery, (error, result) => {
        if (error) {
          res.send("error");
          console.log(error);
        }
      });
      console.log("passed User Query\n");
      pool.query(getStatsQuery, (error, result) => {
        if (error) {
          res.send("error");
          console.log(error);
        }
      });
      res.render("pages/home", { props: { 'login': true } });
    });
  })
  
  app.get("/home", (req, res) => {
    res.render("pages/home", { "props": { loginFailed: false } })
  })
  
  
  
  app.post("/pages/login", (req, res) => {
    //console.log(req.body);
      var queryString = `SELECT * FROM account WHERE username='${req.body.username}';`;
      pool.query(queryString, (error, result) => {
          if(error)
              res.send(error);
          if(result.rows.length > 0 && result.rows[0].password === req.body.password){
    
            res.render("pages/play", {'props': {username: req.body.username}});    // load user page for users
            return;
              
          }
          res.render('pages/home', {'props': {loginFailed: true}});
      })
  
  })
  
