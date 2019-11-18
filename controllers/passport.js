/* eslint-disable camelcase */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
const BCRYPT_SALT_ROUNDS = 12;
const jwtSecret = require('../config/jwtConfig');
const db = require('./db');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;


passport.use(
  'local-signup',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
      session: false,
    },
    (req, email, password, done) => {
      console.log(username);
      console.log("rbemail:",req.body.email,"email:", email);

      try {
        let sql = `SELECT * FROM account WHERE email = '${email.toLowerCase()}' limit 1`;
        db.any(sql)
        .then(users => {
          if (users.length) {
            console.log('username or email already taken');
            return done(null, false, {
              message: 'username or email already taken',
            });
          }
          bcrypt.hash(password, BCRYPT_SALT_ROUNDS).then(hashedPassword => {
            let newUser = {
              password: hashedPassword,
              email: email.toLowerCase(),
            }
            db.any('INSERT INTO account (email,password) VALUES($1:csv) RETURNING id;',newUser).then( row => {
              newUser.id = row.id; //Last Id Insert
              console.log('user created');
              return done(null, newUser);
            });
          });
        });
      } catch (error) {
        console.log(error);
        return done(error);
      }
    },
  ),
);

passport.use(
  'local-login',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
      session: false,
    },
    (email, password, done) => {
      try {
        let sql = `SELECT * FROM account WHERE email = '${email.toLowerCase()}' limit 1`;
        db.any(sql).then(users => {
          let user = users[0];
          if (user === null) {
            return done(null, false, { message: 'bad username / email' });
          }
          bcrypt.compare(password, user.password).then(response => {
            if (response !== true) {
              console.log('passwords do not match');
              return done(null, false, { message: 'passwords do not match' });
            }
            console.log('user found & authenticated');
            return done(null, user);
          });
        });
      } catch (err) {
        done(err);
      }
    },
  ),
);

const opts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme('JWT'),
  secretOrKey: jwtSecret.secret,
};

passport.use(
  'jwt',
  new JWTstrategy(opts, (jwt_payload, done) => {
    try {
      let sql = `SELECT * FROM account WHERE id = ${jwt_payload.id} limit 1`;
      db.any(sql).then(users => {
        if (users.length) {
          console.log('user found in db in passport');
          req.user =  users[0];
          done(null, users[0]);
        } else {
          console.log('user not found in db');
          done(null, false);
        }
      });
    } catch (err) {
      done(err);
    }
  }),
);