var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
const methodOverride = require('method-override');

var logger = require('morgan');
const db=require('./config/connection')
const session=require('express-session')
const {v4:uuid}=require('uuid')
const nocache = require("nocache");
const cors=require('cors')

// const multer=require('multer')
require("dotenv").config();

// const firebaseAdmin = require('firebase-admin');
// const serviceAccount = require('./firebase-admin.json');


var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();
app.use(cors())


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// );
app.use(methodOverride('_method'));







db.connect((err)=>{
  if (err) console.log('eror');
  else console.log("data base connected");
  
})

app.use(nocache());



app.use(session({
  secret:uuid(),
  resave:true,
  saveUninitialized:false
}))
// firebaseAdmin.initializeApp({
//   credential: firebaseAdmin.credential.cert(serviceAccount),
  // databaseURL: 'https://your-project-id.firebaseio.com'
// });


app.use('/',userRouter);
app.use('/admin', adminRouter);

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

module.exports = app;
