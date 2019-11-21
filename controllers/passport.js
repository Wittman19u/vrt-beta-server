/* eslint-disable camelcase */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
const BCRYPT_SALT_ROUNDS = 12;
const jwtSecret = require('../config/jwtConfig');
const db = require('./db');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;


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
      passReqToCallback: true
    },
    function (req, email, password, done) {
      try {
			db.one('SELECT * FROM account WHERE email = $1',email.toLowerCase())
			.then(user => {
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
        console.log("Error:", err);
        return done(null,false,{message: err});
      }
    },
  ),
);



var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('JWT');
opts.secretOrKey = jwtSecret.secret;
// opts.passReqToCallback = true;

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
  console.log(jwt_payload);
  db.one('SELECT * FROM account WHERE id = $1',jwt_payload.id).then( user => {
    if (user) {
      console.log('user found in db in passport');
      return done(null, user);
    } else {
      console.log('user not found in db');
      return done(null, false);
    }
  });
}));
