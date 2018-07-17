"use strict";

var express = require('express');
var path = require('path');
// var logger = require('morgan');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/Models.js')


// Express setup
var app = express();
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


// MONGODB SETUP HERE
var mongoose = require('mongoose')
mongoose.connection.on('connected', function() {
    console.log('Connected to MongoDB!')
})
mongoose.connect(process.env.MONGODB_URI)


var session = require('express-session')
var MongoStore = require('connect-mongo')(session)

app.use(session({
    secret: 'my secret here',
    store: new MongoStore({mongooseConnection: require('mongoose').connection})
}))


passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({username: username}, function(error, result) {
            if (error) {
                console.log('Error in finding the user', error)
                return done(error)
            } else {
                if (!result) {
                    console.log(result);
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (password === result.password) {
                    return done(null, result)
                } else {
                    console.log('Incorrect password')
                    return done(null, false)
                }
            }
        })
    }
))

// PASSPORT SERIALIZE/DESERIALIZE USER HERE HERE
passport.serializeUser(function(user, done) {
    done(null, user._id)
})

passport.deserializeUser(function(id, done) {
    var user;
    User.findById(id, function(error, result) {
        if (error) {
            console.log('Error in finding the user', error)
        } else {
            user = result
        }
        done(error, user)
    })
})

// PASSPORT MIDDLEWARE HERE
app.use(passport.initialize())
app.use(passport.session())

// YOUR ROUTES HERE
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.status(500).end(err.message)}

    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.json({user: user})
    });
  })(req, res, next);
});


app.post('/register', function(req, res) {
  new User(req.body)
    .save()
    .then((doc) => res.json({id: doc.id}))
    .catch((err) => res.status(500).end(err.message))
})



app.listen(1337)
console.log('Server Started!')