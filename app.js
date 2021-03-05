const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressHbs = require('express-handlebars')
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const validator = require('express-validator')
const mongoStore = require('connect-mongo')(session)

// Routers
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');

const app = express();

// database connection
mongoose.connect('mongodb://localhost:27017/shopping', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});


require('./config/passport')

// view engine setup
app.engine('hbs', expressHbs({defaultLayout: 'layout', extname: 'hbs'}))
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(validator()); // express validator must be version 4 to work
app.use(cookieParser());

// initialize session
app.use(session({
    secret: 'this is my secret session',
    resave: false,
    saveUninitialized: false,
    store: new mongoStore({mongooseConnection: mongoose.connection}),
    cookie: {maxAge: 180 * 60 * 1000}
}))

// passport and flash message for signup and singin auth
app.use(flash())
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    res.locals.signin = req.isAuthenticated(); // to check logged in or not
    res.locals.session = req.session; // to store cart
    next()
})

app.use('/', indexRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
