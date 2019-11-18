//connection


const bcrypt = require('bcrypt');
const db = require('./db');
// load all the things we need
import bcrypt from 'bcrypt';
import jwtSecret from '../config/jwtConfig';
import db from './db';
const LocalStrategy   = require('passport-local').Strategy;



const BCRYPT_SALT_ROUNDS = 12;
// eslint-disable-next-line prefer-destructuring
const Op = Sequelize.Op;

const passport = require('passport');

const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;



// expose this function to our app using module.exports
module.exports = function(passport, cruddb, i18n  ) {
	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function(user, done) {
			done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(id, done) {
		const parameters ={
				table: 'account' ,
				join: ' INNER JOIN role ON ro_id = roleid',
				where:  ` id = ${id}`,
				orderBy: '',
				limit : 1
		};
		cruddb.list(parameters)
				.then( (rows) => {
						done(null, rows[0]);
				}).catch((error) => {
						console.log(error);
						done(error);
				});
	});

	// =========================================================================
	// LOCAL SIGNUP ============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
	passport.use(
		'local-signup',
		new LocalStrategy({
			// by default, local strategy uses username and password, we will override with email
			usernameField : 'email',
			passwordField : 'password',
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, email, password, done) {
			// find a user whose email is the same as the forms email
			// we are checking to see if the user trying to login already exists
			const parameters ={
					table: 'account' ,
					where:  ` email = '${email}'`,
					orderBy: '',
					limit : 1
			};
			cruddb.list(parameters)
				.then( (rows) => {
				if (rows.length) {
					return done(null, false, req.flash('errorMessage', i18n.__('That email is already taken.')));
				} else {
					// if there is no user with that username create the user
					const dateb = new Date(req.body.dateborn);
					let firstname = req.body.firstname;
					let lastname  = req.body.lastname;
					firstname = firstname.charAt(0).toUpperCase() + firstname.toLowerCase().substr(1);
					lastname = lastname.charAt(0).toUpperCase() + lastname.toLowerCase().substr(1);
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
					};
					console.log(newUser);
					cruddb.create('account',newUser).then( (row) =>{
						console.log('row',row);
						newUser.id = row.id; //Last Id Insert
						// new log  FOR RGPD
						let consentTxt = consentThirdTxt = 'No';
						if(newUser.consent == 1){
								consentTxt = 'Yes';
						}
						if(newUser.consentthird == 1){
								consentThirdTxt = 'Yes';
						}
						const logData ={
								lo_activity: `New user ${newUser.email} with consent ${consentTxt} for VRT and consent ${consentThirdTxt} for VRT Partners`,
								lo_accountid: newUser.id,
								lo_iserror : 2
						};
						cruddb.create('log',logData);
						//END NEW LOG
						return done(null, newUser);
					}).catch( (error) => {
						console.log(error);
						return done(error);
					});
				}
			}).catch((error) => {
				console.log(error);
				return done(error);
			});
			})
	);

	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

	passport.use(
		'local-login',
		new LocalStrategy({
			// by default, local strategy uses username and password, we will override with email
			usernameField : 'email',
			passwordField : 'password',
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, email, password, done) { // callback with email and password from our form
			// console.log("SELECT * FROM account WHERE email = ", [email])
			const emailLower = email.toLowerCase();
			const parameters ={
					table: 'account' ,
					where:  ` email = '${emailLower}'`,
					orderBy: '',
					limit : 1
			};
			cruddb.list(parameters)
				.then( (rows) => {
					if (rows[0].password ) {
						if (!bcrypt.compareSync(password, rows[0].password)) {
								return done(null, false, req.flash('errorMessage', i18n.__('Oops! Wrong password.'))); // create the loginMessage and save it to session as flashdata
						}
						// all is well, return successful user
						return done(null, rows[0]);
					} else {
						console.log("Login: No user found.");
						// req.flash is the way to set flashdata using connect-flash
						return done(null, false, req.flash('errorMessage', i18n.__('No user found.')));
					}
				}).catch((error) => {
						console.log('error:' + error);
						return done(error);
				});
		})
	);
};
