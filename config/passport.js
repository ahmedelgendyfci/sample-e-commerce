const passport = require('passport');
const User = require('../models/user');
const flash = require('connect-flash')
const localStrategy = require('passport-local').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user.id);
});


passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    }).lean();
});


passport.use('local.signup', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {

    req.checkBody('email', 'Invalid Email').notEmpty().isEmail()
    req.checkBody('password', 'Invalid Password').notEmpty().isLength({min: 4})
    let errors = req.validationErrors();

    // console.log(errors)
    if (errors) {
        let messages = []
        errors.forEach(function (error) {
            messages.push(error.msg)
        })
        return done(null, false, req.flash('error', messages))
    }


    User.findOne({email: email}, function (err, user) {
        if (err) {
            return done(err)
        }
        if (user) {
            return done(null, false, {message: 'Email is already in use.'})
        }

        const newUser = new User();
        newUser.email = email;
        newUser.password = newUser.encryptPassword(password)
        newUser.save(function (err, result) {
            if (err) {
                return done(err);
            }
            return done(null, newUser);
        })
    })
}))

passport.use('local.signin', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {

    req.checkBody('email', 'Invalid Email').notEmpty().isEmail()
    req.checkBody('password', 'Invalid Password').notEmpty()
    let errors = req.validationErrors();
    if (errors) {
        let messages = []
        errors.forEach(function (error) {
            messages.push(error.msg)
        })
        return done(null, false, req.flash('error', messages))
    }

    User.findOne({email: email}, function (err, user) {
        if (err) {
            return done(err)
        }
        if (!user) {
            return done(null, false, {message: 'user not found.'})
        }
        if (!user.validPassword(password)) {
            return done(null, false, {message: 'invalid password.'})
        }
        return done(null, user);
    })

}))
