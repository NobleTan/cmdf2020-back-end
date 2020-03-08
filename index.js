var createError = require('http-errors');
const express = require("express");
const app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
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

var indexRouter = require('./routes/index');
var speechRouter = require('./routes/speech');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/speech', speechRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // json the error page
  res.status(err.status || 500);
  res.json('error');
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
    client.query(userCheck, (error, dbres) => {
      if (result.rows.length > 0) {
        res.json('pages/home', { 'props': { regFailed: true } });
        return;
      }
      var getUsersQuery = `INSERT INTO account (username , password) VALUES ('${body.username}' , '${body.password}');`;
      console.log(getUsersQuery);
      client.query(getUsersQuery, (error, dbres) => {
        if (error) {
          res.send("error");
          console.log(error);
        }
      });
      console.log("passed User Query\n");
      client.query(getStatsQuery, (error, dbres) => {
        if (error) {
          res.send("error");
          console.log(error);
        }
      });
      res.json("pages/home", { props: { 'login': true } });
    });
  })

  app.get("/home", (req, res) => {
    res.json("pages/home", { "props": { loginFailed: false } })
  })
  app.post("/pages/login", (req, res) => {
    //console.log(req.body);
      var queryString = `SELECT * FROM account WHERE username='${req.body.username}';`;
      client.query(queryString, (error, dbres) => {
          if(error)
              res.send(error);
          if(result.rows.length > 0 && result.rows[0].password === req.body.password){

            res.json("pages/play", {'props': {username: req.body.username}});    // load user page for users
            return;
          }
          res.json('pages/home', {'props': {loginFailed: true}});
      })

  })

module.exports = app;   

