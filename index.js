var createError = require('http-errors');
const express = require("express");
const app = express();
var path = require('path');
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

  // render the error page
  res.status(err.status || 500);
  res.render('error');
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

module.exports = app;
