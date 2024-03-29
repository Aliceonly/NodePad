var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');

var mongoose = require('mongoose');

var routes = require('./routes/index');
// var users = require('./routes/users');

var app = express();


mongoose.connect('mongodb://localhost:27017/datas', { useMongoClient: true });
mongoose.connection.on('error', console.error.bind(console, '连接数据库失败'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//设置 session 参数并引入
app.use(session({
  key: 'session',
  secret: 'keboard cat',
  cookie: {maxAge: 1000 * 60 * 60 * 24},
  store: new MongoStore({
    db: 'datas',
    mongooseConnection: mongoose.connection
  }),
  resave: false,
  saveUninitialized: true
}));

//引入flash
app.use(flash());
// error handlers

app.use('/', routes);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(3000);

module.exports = app;
