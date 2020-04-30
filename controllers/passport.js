const BCRYPT_SALT_ROUNDS = 12;
const db = require('./db');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy,
		ExtractJwt = require('passport-jwt').ExtractJwt;



/* TODO - integrate this into code
const dateb = new Date(req.body.dateborn);
let newUser = {
	firstname: firstname,
	lastname: lastname,
	dateborn: dateb.toISOString().split('T')[0],
	gender: req.body.gender,
	phone:req.body.phone,
	email: email.toLowerCase(),
	facebookemail: email.toLowerCase(),
	roleid: '1',
	consent: req.body.consent,
	consentthird: req.body.consentthird,
	password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
}; */
passport.use(
	'signup',
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true,
			session: false,
		},
		(req, email, password, done) => {
			email =  email.toLowerCase();
			db.oneOrNone('SELECT * FROM account WHERE email = $1', email
			).then(users => {
				if (users !== null ) {
					console.log('Username or email already taken!');
					return done(null, false, {
						message: 'Username or email already taken!',
					});
				}
				bcrypt.hash(password, BCRYPT_SALT_ROUNDS).then(hashedPassword => {
					let newUser = {
						email: email,
						password: hashedPassword,
						firstname: req.body.firstname.charAt(0).toUpperCase() + req.body.firstname.toLowerCase().substr(1),
						lastname: req.body.lastname.charAt(0).toUpperCase() + req.body.lastname.toLowerCase().substr(1),
						gender: req.body.gender,
						language: req.body.language
					};
					db.any('INSERT INTO account($1:name) VALUES($1:csv) RETURNING id;',[newUser]).then( row => {
						newUser.id = row.id; //Last Id Insert
						console.log('User created!');
						return done(null, newUser);
					}).catch((error) => {
						console.error('Problem to create user', error);
						return done(error, false, { message: 'Problem to create user!' });
					});
				});
			}).catch((error) => {
				console.error('Problem to create user, maybe found multiple roxs with same email!', error);
				return done(error, false, { message: 'Problem to create user, maybe found multiple roxs with same email!' });
			});
		}
	)
);

passport.use(
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true,
			session: false
		},
		function (req, email, password, done) {
			db.oneOrNone('SELECT * FROM account WHERE email = $1', email.toLowerCase()
			).then(user => {
				if (user === null) {
					console.error('Bad username / email!');
					return done(null, false, { message: 'Bad username / email!' });
				}
				bcrypt.compare(password, user.password).then(response => {
					if (response !== true) {
						console.error('Passwords do not match!');
						return done(null, false, { message: 'Passwords do not match' });
					}
					console.log('User found & authenticated!');
					return done(null, user);
				});
			}).catch((error) => {
				console.error('Error during search into DB!');
				return done(error, false, { message: 'Error during search into DB!' });
			});
		}
	)
);

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('JWT');
opts.secretOrKey = process.env.JWT_SECRET;
// opts.passReqToCallback = true;

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
	db.oneOrNone('SELECT * FROM account WHERE id = $1',jwt_payload.id).then( user => {
		if (user !== null) {
			console.log('User found in DB!');
			return done(null, user);
		} else {
			console.log('User not found in DB!');
			return done(null, false);
		}
	});
}));
