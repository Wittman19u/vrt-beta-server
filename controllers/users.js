const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const passport = require('passport');
const transporter = require('./../config/nodemailer'); // pass nodemailer for configuration
const BCRYPT_SALT_ROUNDS = 12;

// TODO Comment this function
function getAllUsers(req, res, next) {
	let limit = 16;
	if (typeof req.query.limit !== 'undefined'){
		limit = req.query.limit;
	}
	let sql= `select * from account limit ${limit}`;
	console.log(sql);
	db.any(sql)
		.then(function (data) {
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

function getSingleUser(req, res, next) {
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
			var userID = parseInt(req.params.id);
			db.one('select * from account where id = $1', userID
			).then(function (data) {
				res.status(200)
					.json({
						status: 'success',
						data: data,
						message: 'Retrieved ONE user'
					});
			}).catch(function (err) {
				return next(err);
			});
		}
	});
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

	passport.authenticate('local-signup', (err, user, info) => {
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
			req.logIn(user, error => {
				console.log(user);
				const data = {
					firstname: req.body.firstname.charAt(0).toUpperCase() + req.body.firstname.toLowerCase().substr(1),
					lastname: req.body.lastname.charAt(0).toUpperCase() + req.body.lastname.toLowerCase().substr(1),
				};
				console.log(data);
				var userID = parseInt(user.id);
				db.one('select * from account where id = $1', userID
				).then(user => {
					console.log(user);
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
			db.none('update account set firstname = "$1", lastname = "$2", email = "$3" where id=$4',
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
	});
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
	passport.authenticate('local-login', (err, users, info) => {
		if (err) {
			console.error(`error ${err}`);
		}
		if (info !== undefined) {
			console.error(info.message);
			if (info.message === 'bad username') {
				res.status(401).json({
					message: info.message
				});
			} else {
				res.status(403).json({
					message: info.message
				});
			}
		} else {
			req.logIn(users, () => {
				db.one('select * from account where email = "$1"', req.body.email.toLowerCase()
				).then(user => {
					const token = jwt.sign({ id: user.email }, jwtSecret.secret, {
						expiresIn: 60 * 60,
					});
					res.status(200).json({
						auth: true,
						token,
						message: 'User found & logged in',
					});
				}).catch((error) => {
					console.error('problem communicating with db');
					res.status(500).send(error);
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
	console.error(req.body.email);
	db.one('select * from account where email = "$1"', req.body.email.toLowerCase()
	).then((user) => {
		if (user === null) {
			console.error('email not in database');
			res.status(403).json({
				message: 'Email not in db'
			});
		} else {
			const token = crypto.randomBytes(20).toString('hex');
			db.none('update account set localtoken=$1, expireslocaltoken=$2 where id=$3',[token, Date.now() + 360000, parseInt(user.id)]
			).then( () => {
				const mailOptions = {
					from: 'noreply@veryroadtrip.eu',
					to: `${user.email}`,
					subject: 'Link To Reset Password',
					text:
						'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n'
						+ 'Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n'
						+ `http://localhost:3031/reset/${token}\n\n`
						+ 'If you did not request this, please ignore this email and your password will remain unchanged.\n',
				};

				console.log('sending mail');
				transporter.sendMail(mailOptions, (err, response) => {
					if (err) {
						console.error('there was an error: ', err);
						res.status(500).json({
							message:'there was an error: ' + err
						});
					} else {
						console.log('here is the res: ', response);
						res.status(200).json({
							message:'recovery email sent'
						});
					}
				});
			}).catch((error) => {
				console.error('problem during update db');
				res.status(500).send(error);
			});
		}
	}).catch((error) => {
		console.error('problem communicating with db');
		res.status(500).send(error);
	});
}

function updatePasswordViaEmail(req, res, next){
	db.one('select * from account where email = "$1" AND localtoken = "$2" AND expireslocaltoken::timestamp > current_timestamp ',
		req.body.email.toLowerCase(), req.body.resetPasswordToken
	).then(user => {
		if (user == null) {
			console.error('password reset link is invalid or has expired');
			res.status(403).json({message: 'Password reset link is invalid or has expired'});
		} else if (user != null) {
			console.log('user exists in db');
			bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS
			).then(hashedPassword => {
				db.none('update account set password = "$1", localtoken = NULL, expireslocaltoken = NULL where id=$2',[hashedPassword, parseInt(user.id)]
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
	}).catch((error) => {
		console.error('problem communicating with db');
		res.status(500).send(error);
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
			db.one('select * from account where email = "$1"', req.body.email.toLowerCase()
			).then((user) => {
				if (user != null) {
					console.log('user found in db');
					bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS
					).then((hashedPassword) => {
						db.none('update account set password = "$1" where id=$2',[hashedPassword, parseInt(user.id)]
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


module.exports = {
	getAllUsers: getAllUsers,
	getSingleUser: getSingleUser,
	createUser: createUser,
	updateUser: updateUser,
	removeUser: removeUser,
	loginUser: loginUser,
	forgotPassword: forgotPassword,
	updatePasswordViaEmail: updatePasswordViaEmail,
	updatePassword: updatePassword
};