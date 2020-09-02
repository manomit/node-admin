'use strict';
const bCrypt = require('bcryptjs'),
      LocalStrategy = require('passport-local').Strategy,
      Admin = require('../db/mongo/schemas').adminSchema;
      

module.exports = (passport) => {
    passport.serializeUser((admin, done) => {
        done(null, admin._id);
    });

    passport.deserializeUser((_id, done) => {
        Admin
            .findById(_id)
            .then(admin => {
                if(admin) {
                    done(null, admin.toObject());
                } else {
                    done(admin.errors, null);
                }
            });
    });

    passport.use('local-login',
        new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        }, (req, email, password, done) => {
          const isValidPassword = (adminpass, password) => {
              return bCrypt.compareSync(password, adminpass)
          };
          
          Admin
            .findOne({email})
            .then(admin => {
                if(!admin) {
                    return done(null, false, req.flash('loginMessage', 'Email or password is invalid'));
                } else if(!isValidPassword(admin.password, password)) {
                    return done(null, false, req.flash('loginMessage', 'Email or password is invalid'));
                }
                return done(null, admin.toObject());
            })
            .catch(err => {
                console.log(err);
                return done(null, false, req.flash('loginMessage', 'Something wrong. Please try again.'));
            })
        })
    )
};