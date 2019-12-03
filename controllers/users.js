const db = require('./db');
const jwt = require('jsonwebtoken');
const cryptoRandomString = require('crypto-random-string');
const bcrypt = require('bcrypt');
const passport = require('passport');
const transporter = require('./email'); // pass nodemailer for configuration
const moment = require('moment');
const BCRYPT_SALT_ROUNDS = 12;

// TODO Comment this function
function getAllUsers(req, res, next) {
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				message: info.message,
				info: info,
				user: user
			};
			console.error(message);
			res.status(403).json(message);
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
			}).catch(function (error) {
				console.error(`Error during Select in DB: ${error}`);
				res.status(500).json({
					message: 'Error during Select!',
					error: error
				});
			});
		}
	})(req, res, next);
}

function getUserDetails(req, res, next) {
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				message: info.message,
				info: info,
				user: user
			};
			console.error(message);
			res.status(403).json(message);
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
	passport.authenticate('signup',{ session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				message: info.message,
				info: info,
				user: user
			};
			let status = 401;
			if (info.message === 'Username or email already taken!') {
				status = 409;
			}
			res.status(status).json(message);
		} else {
			// TODO reduce expiresIn delay
			const token = jwt.sign({ id: userID }, process.env.JWT_SECRET, { expiresIn: '12h'});
			//req.user = user;
			res.status(200).json({
				status: 'success',
				auth: true,
				token,
				id: userID,
				user: user,
				message: 'User created in db & logged in',
			});
		}
	})(req, res, next);
}

function removeUser(req, res, next) {
	passport.authenticate('jwt', { session: false }, (error, user, info) => {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				message: info.message,
				info: info,
				user: user
			};
			res.status(401).json(message);
		} else {
			var id = parseInt(req.params.id);
			db.result('delete from account where id = $1', id
			).then((result) => {
				if (result.rowCount > 0) {
					console.log('User deleted from DB!');
					res.status(200)
						.json({
							status: 'Success',
							message: `Removed ${result.rowCount} user.`
						});
				} else {
					console.error('User not found in DB!');
					res.status(404).json({
						status: 'error',
						message: 'No user with that username/email to delete!'
					});
				}
			}).catch((error) => {
				console.error(`Problem communicating with DB: ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Problem communicating with DB: ${error}`
				});
			});
		}
	})(req, res, next);
}

function loginUser(req, res, next) {
	passport.authenticate('local', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				message: info.message,
				info: info,
				user: user
			};
			let status = 403;
			if (info.message === 'Bad username / email!') {
				status = 401;
			}
			res.status(status).json(message);
		} else {
			const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '12h'});
			//req.user = user;
			res.status(200).json({
				status: 'success',
				auth: true,
				token,
				id: user.id,
				user: user,
				message: 'User found & logged in',
			});
		}
	})(req, res, next);
}

function forgotPassword(req, res, next){
	if (req.body.email === '') {
		res.status(400).json({
			status: 'error',
			message: 'Email required!'
		});
	} else {
		db.oneOrNone( 'select * from account where email = $1',[req.body.email.toLowerCase()]
		).then((user) => {
			if (user === null) {
				console.error('Email not in DB!');
				res.status(403).json({
					status: 'error',
					message: 'Email not in DB!'
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
					transporter.sendMail(mailOptions, (error, response) => {
						if (error) {
							console.error(`There was an error sending email: ${error}`);
							res.status(500).json({
								status: 'error',
								message: `There was an error sending email: ${error}`
							});
						}
						res.status(200).json({
							status: 'success',
							message:'Recovery email sent!'
						});
					});
				}).catch((error) => {
					console.error('Problem during update DB!');
					res.status(500).json({
						status: 'error',
						message: `Problem during update DB: ${error}`
					});
				});
			}
		}).catch(function (error) {
			console.error(error);
			res.status(500).json({
				status: 'error',
				message: 'Problem communicating with DB!'
			});
		});
	}
}

function updatePasswordViaEmail(req, res, next){
	if (req.body.email === '' || req.body.resetPasswordToken === '' || req.body.password === '') {
		res.status(400).json({
			status: 'error',
			message: 'Field required!'
		});
	} else {
		db.oneOrNone('select * from account where (email = $1 AND localtoken = $2 AND expireslocaltoken::timestamp > current_timestamp) ', [req.body.email.toLowerCase(), req.body.resetPasswordToken]
		).then(user => {
			if (user === null) {
				console.error('No user exists in db or password reset link is invalid or has expired!');
				res.status(403).json({
					status: 'error',
					message: 'No user exists in db or password reset link is invalid or has expired!'
				});
			}
			console.log('User exists in db');
			bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS
			).then(hashedPassword => {
				db.none('update account set password = $1, localtoken = NULL, expireslocaltoken = NULL where id=$2',[hashedPassword, parseInt(user.id)]
				).then(() => {
					console.log('Password updated!');
					res.status(200).json({
						status: 'success',
						message: 'Password updated!'
					});
				}).catch((error) => {
					console.error(`Problem during update DB: ${error}`);
					res.status(500).json({
						status: 'error',
						message: `Problem during update DB: ${error}`
					});
				});
			}).catch((error) => {
				console.error(`Problem during password hash: ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Problem during password hash: ${error}`
				});
			});
		}).catch(function (error) {
			console.error(error);
			res.status(500).json({
				status: 'error',
				message: 'Problem communicating with DB!'
			});
		});
	}

}

function updatePassword(req, res, next){
	passport.authenticate('jwt', { session: false }, (error, user, info) => {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				message: info.message,
				info: info,
				user: user
			};
			res.status(401).json(message);
		} else {
			db.oneOrNone('select * from account where email = $1', req.body.email.toLowerCase()
			).then((user) => {
				if (user === null) {
					console.error('No user exists in db to update!');
					res.status(403).json({
						status: 'error',
						message: 'No user exists in db to update!'
					});
				}
				console.log('User found in db.');
				bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS
				).then((hashedPassword) => {
					db.none('update account set password = $1 where id=$2',[hashedPassword, parseInt(user.id)]
					).then(() => {
						console.log('Password updated');
						res.status(200).json({ message: 'Password updated', auth: true });
					}).catch((error) => {
						console.error(`Problem during update DB: ${error}`);
						res.status(500).json({
							status: 'error',
							message: `Problem during update DB: ${error}`
						});
					});
				}).catch((error) => {
					console.error(`Problem during password hash: ${error}`);
					res.status(500).json({
						status: 'error',
						message: `Problem during password hash: ${error}`
					});
				});
			}).catch(function (error) {
				console.error(error);
				res.status(500).json({
					status: 'error',
					message: 'Problem communicating with DB!'
				});
			});
		}
	})(req, res, next);
}

// update user information without password
function updateUser(req, res, next) {
	passport.authenticate('jwt', { session: false }, (error, user, info) => {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				message: info.message,
				info: info,
				user: user
			};
			res.status(401).json(message);
		} else {
			db.none('update account set firstname = $1, lastname = $2, email = $3 where id=$4',
				[req.body.firstname, req.body.lastname, req.body.email.toLowerCase(), parseInt(req.params.id)]
			).then(function () {
				res.status(200)
					.json({
						status: 'success',
						message: 'Updated user!'
					});
			}).catch((error) => {
				console.error(`Problem during update DB: ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Problem during update DB: ${error}`
				});
			});
		}
	})(req, res, next);
}

module.exports = {
	getAllUsers: getAllUsers,
	getUserDetails: getUserDetails,
	forgotPassword: forgotPassword,
	updatePasswordViaEmail: updatePasswordViaEmail,
	updatePassword: updatePassword,
	createUser: createUser,
	updateUser: updateUser,
	removeUser: removeUser,
	loginUser: loginUser
};