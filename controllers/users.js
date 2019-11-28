const db = require('./db');
const jwt = require('jsonwebtoken');
const cryptoRandomString = require('crypto-random-string');
const bcrypt = require('bcrypt');
const passport = require('passport');
const transporter = require('./email'); // pass nodemailer for configuration
const moment = require('moment');
const jwtSecret = require('../config/jwtConfig');


const BCRYPT_SALT_ROUNDS = 12;

// TODO Comment this function
function getAllUsers(req, res, next) {
	passport.authenticate('jwt', { session: false },function (err, user, info) {
		if (err) {
			console.error(err);
			return next(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			res.status(403).json({
				message: info.message
			});
		} else {
			let limit = 16;
			if (typeof req.query.limit !== 'undefined'){
				limit = req.query.limit;
			}
			db.any('select * from account limit $1', limit
			).then(function (data) {
				res.status(200)
					.json({
						status: 'success',
						itemsNumber: data.length,
						data: data,
						message: 'Retrieved ALL users'
					});
			}).catch(function (err) {
				return next(err);
			});
		}
	})(req, res, next);
}

function getSingleUser(req, res, next) {
	passport.authenticate('jwt', { session: false },function (err, user, info) {
		if (err) {
			console.error(err);
			return next(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			res.status(403).json({
				message: info.message
			});
		} else {
			req.user = user;
			res.status(200).json({
				status: 'success',
				data: user,
				message: 'Retrieved ONE user'
			});
		}
	})(req, res, next);
}

function createUser(req, res, next) {
	// if there is no user with that username create the user
	/* TODO - integrate this into code
	const dateb = new Date(req.body.dateborn);

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
	}; */

	passport.authenticate('local-signup',{ session: false }, function (err, user, info) {
		if (err) {
			console.error(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			res.status(403).json({
				message: info.message
			});
		} else {
			// eslint-disable-next-line no-unused-vars
			req.logIn(user, { session: false }, function(error) {
				const data = {
					firstname: req.body.firstname.charAt(0).toUpperCase() + req.body.firstname.toLowerCase().substr(1),
					lastname: req.body.lastname.charAt(0).toUpperCase() + req.body.lastname.toLowerCase().substr(1),
				};
				var userID = parseInt(user.id);
				db.one('select * from account where id = $1', userID
				).then(user => {
					db.none('update account set firstname=$1, lastname=$2 where id=$4',
						[ data.firstname,  data.lastname, parseInt(user.id)]
					).then(() => {
						console.log('User created in db');
						res.status(200).json({ message: 'User created' });
					}).catch(function (err) {
						return next(err);
					});
				}).catch((error) => {
					console.error('problem communicating with db');
					res.status(500).send(error);
				});
			});
		}
	})(req, res, next);
}



function removeUser(req, res, next) {
	passport.authenticate('jwt', { session: false }, (err, user, info) => {
		if (err) {
			console.error(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			res.status(403).json({
				message: info.message
			});
		} else {
			var id = parseInt(req.params.id);
			db.result('delete from account where id = $1', id
			).then((result) => {
				if (result.rowCount > 0) {
					console.log('user deleted from db');
					res.status(200)
						.json({
							status: 'success',
							message: `Removed ${result.rowCount} user`
						});
				} else {
					console.error('user not found in db');
					res.status(404).json({
						message: 'no user with that username to delete'
					});

				}
			}).catch((error) => {
				console.error('problem communicating with db');
				res.status(500).send(error);
			});
		}
	})(req, res, next);
}

function loginUser(req, res, next) {
	passport.authenticate('local', { session: false }, function (err, user, info) {
		if (err) {
			console.error(`error ${err}`);
			return next(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			if (info.message === 'bad username / email') {
				res.status(401).json({
					message: info.message
				});
			} else {
				res.status(403).json({
					message: info.message
				});
			}
		} else {
			req.logIn(user, { session: false }, function(err) {
				if (err) {
					console.error(err);
					return next(err);
				}
				const token = jwt.sign({ id: user.id }, jwtSecret.secret, { expiresIn: '12h'});
				req.user = user;
				res.status(200).json({
					auth: true,
					token,
					id: user.id,
					message: 'User found & logged in',
				});
			});
		}
	})(req, res, next);
}

function forgotPassword(req, res, next){
	if (req.body.email === '') {
		res.status(400).json({
			message: 'email required'
		});
	}
	// let sql='select * from account where email= c.ivetta@veryroadtrip.eu"';
	db.one( 'select * from account where email = $1',[req.body.email.toLowerCase()]
	).then((user) => {
		if (user === null) {
			console.error('email not in database');
			res.status(403).json({
				message: 'Email not in db'
			});
		} else {
			const token = cryptoRandomString({length: 20});
			db.none('update account set localtoken=$1, expireslocaltoken=$2 where id=$3',[token, moment().add(20, 'minutes').format('YYYY-MM-DDTHH:mm'), parseInt(user.id)]
			).then( () => {
				const mailOptions = {
					from: 'VeryRoadTrip.eu <noreply@veryroadtrip.eu>',
					to: `${user.email}`,
					subject: 'Link To Reset Password',
					text:
						'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n'
						+ 'Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n'
						+ `http://${process.env.CLIENT_HOST}/reset/${token}\n\n`
						+ 'If you did not request this, please ignore this email and your password will remain unchanged.\n',
				};
				transporter.sendMail(mailOptions, (err, response) => {
					if (err) {
						console.error('there was an error: ', err);
						res.status(500).json({
							message:'there was an error: ' + err
						});
					} else {
						res.status(200).json({
							message:'recovery email sent'
						});
					}
				});
			}).catch((error) => {
				console.error('problem during update db');
				res.status(500).send(error );
			});
		}
	}).catch(function (err) {
		console.error('problem communicating with db');
		return next(err);
	});
}

function updatePasswordViaEmail(req, res, next){
	if (req.body.email === '' || req.body.resetPasswordToken === '' || req.body.password === '') {
		res.status(400).json({
			message: 'Field required'
		});
	}
	db.one('select * from account where (email = $1 AND localtoken = $2 AND expireslocaltoken::timestamp > current_timestamp) ', [req.body.email.toLowerCase(), req.body.resetPasswordToken]
	).then(user => {
		if (user == null) {
			console.error('password reset link is invalid or has expired');
			res.status(403).json({message: 'Password reset link is invalid or has expired'});
		} else if (user != null) {
			console.log('user exists in db');
			bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS
			).then(hashedPassword => {
				db.none('update account set password = $1, localtoken = NULL, expireslocaltoken = NULL where id=$2',[hashedPassword, parseInt(user.id)]
				).then(() => {
					console.log('password updated');
					res.status(200).json({ message: 'password updated' });
				}).catch((error) => {
					console.error('problem during update db');
					res.status(500).send(error);
				});
			}).catch((error) => {
				console.error('problem during password hash');
				res.status(500).send(error);
			});
		} else {
			console.error('no user exists in db to update');
			res.status(401).json({message: 'no user exists in db to update'});
		}
	}).catch(function (err) {
		console.error('problem communicating with db');
		return next(err);
	});
}

function updatePassword(req, res, next){
	passport.authenticate('jwt', { session: false }, (err, user, info) => {
		if (err) {
			console.error(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			res.status(403).json({
				message: info.message
			});
		} else {
			db.one('select * from account where email = $1', req.body.email.toLowerCase()
			).then((user) => {
				if (user != null) {
					console.log('user found in db');
					bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS
					).then((hashedPassword) => {
						db.none('update account set password = $1 where id=$2',[hashedPassword, parseInt(user.id)]
						).then(() => {
							console.log('password updated');
							res.status(200).json({ message: 'password updated', auth: true });
						}).catch((error) => {
							console.error('problem during update db');
							res.status(500).send(error);
						});
					}).catch((error) => {
						console.error('problem during password hash');
						res.status(500).send(error);
					});
				} else {
					console.error('no user exists in db to update');
					res.status(404).json({message: 'no user exists in db to update'});
				}
			});
		}
	})(req, res, next);
}

// update user information without password
function updateUser(req, res, next) {

	passport.authenticate('jwt', { session: false }, (err, user, info) => {
		if (err) {
			console.error(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			res.status(403).json({
				message: info.message
			});
		} else {
			db.none('update account set firstname = $1, lastname = $2, email = $3 where id=$4',
				[req.body.firstname, req.body.lastname, req.body.email.toLowerCase(), parseInt(req.params.id)])
				.then(function () {
					res.status(200)
						.json({
							status: 'success',
							message: 'Updated user'
						});
				}).catch(function (err) {
					return next(err);
				});
		}
	})(req, res, next);
}

module.exports = {
	getAllUsers: getAllUsers,
	getSingleUser: getSingleUser,

	forgotPassword: forgotPassword,
	updatePasswordViaEmail: updatePasswordViaEmail,
	updatePassword: updatePassword,
	createUser: createUser,
	updateUser: updateUser,
	removeUser: removeUser,
	loginUser: loginUser
};