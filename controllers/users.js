const db = require('./db');
const jwt = require('jsonwebtoken');
const cryptoRandomString = require('crypto-random-string');
const bcrypt = require('bcrypt');
const passport = require('passport');
const transporter = require('./email'); // pass nodemailer for configuration
const moment = require('moment');
const BCRYPT_SALT_ROUNDS = 12;
var mediaController = require('../controllers/medias');
var roadtripController = require('../controllers/roadtrips');

// TODO add query par email, return si trouvé ou pas + id utilisateur
function getUsersByQuery(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			const emailQuery = req.query.email
			db.any('select account.*, media.id AS id_media, media.title, media.descript, media.link, media.filename, media.filepath, media.filesize, media.type, media.created_at AS media_created_at, media.updated_at AS media_updated_at, media.status_id AS media_status_id, media.account_id from account LEFT JOIN media ON media.account_id = account.id WHERE account.email = $1', [emailQuery]).then(function (data) {
				var accounts = []
				var accountsId = []
				data.forEach(data => {
					if (!accountsId.includes(data.id)) {
						accounts.push({ "id": data.id, "firstname": data.firstname, "lastname": data.lastname, "dateborn": data.dateborn, "gender": data.gender, "biography": data.biography, "email": data.email, "phone": data.phone, "codetemp": data.codetemp, "expirescodetemp": data.expirescodetemp, "created_at": data.created_at, "updated_at": data.updated_at, "status_id": data.status_id, "localtoken": data.localtoken, "facebookid": data.facebookid, "facebooktoken": data.facebooktoken, "googleid": data.googleid, "googletoken": data.googletoken, "consent": data.consent, "consentthird": data.consentthird, "consent_at": data.consent_at, "language": data.language, "media_id": data.media_id, "expireslocaltoken": data.expireslocaltoken, "medias": [] })
						accountsId.push(data.id)
					}
					if (data.id_media !== null) {
						accounts[accounts.length - 1].medias.push({ "id": data.id_media, "title": data.title, "descript": data.descript, "link": data.link, "filename": data.filename, "filepath": data.filepath, "filesize": data.filesize, "type": data.type, "created_at": data.media_created_at, "updated_at": data.media_updated_at, "status_id": data.media_status_id, "account_id": data.account_id })
					}
				})
				res.status(200)
					.json({
						status: 'success',
						data: accounts,
						message: 'Retrieved users'
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
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			req.user = user;
			db.one('select * from media where id = $1', user.media_id).then(function (media) {
				res.status(200).json({
					status: 'success',
					data: { user, media },
					message: 'Retrieved a user and its associated media'
				});
			}).catch(function (error) {
				console.error(`Could not find the media: ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Could not find the media: ${error}`
				});
			});
		}
	})(req, res, next);
}

function createUser(req, res, next) {
	passport.authenticate('signup', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			let status = 401;
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
				if (info.message === 'Username or email already taken!') {
					status = 409;
				}
			}
			console.error(message);
			res.status(status).json(message);
		} else {
			// TODO reduce expiresIn delay
			const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
			//req.user = user;
			res.status(200).json({
				status: 'success',
				auth: true,
				token,
				id: user.id,
				user: user,
				message: 'User created in db & logged in',
			});
			res.setLocale(user.language);
			const mailOptions = {
				from: process.env.SERVER_EMAIL,
				to: user.email,
				subject: res.__('mail.signup.subject'),
				text: res.__('mail.signup.content'),
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
					message: 'Confirmation email sent!'
				});
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
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
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
				user: user
			};
			let status = 403;
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
				if (info.message === 'Bad username / email!') {
					status = 401;
				}
			}
			console.error(message);
			res.status(status).json(message);
		} else {
			const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
			//req.user = user;
			db.any('SELECT (SELECT COUNT(alert.id) FROM alert WHERE recipient_id = $1 AND isread = false), media.id AS media_id, media.filename, media.filepath, media.filesize, media.type, media.status_id, account.id AS account_id FROM media RIGHT JOIN account ON account.media_id = media.id WHERE account.id = $1', [user.id]).then(function (media) {
				user.alerts = media[0].count
				delete media[0].count
				if (media[0].media_id == null) {
					res.status(200).json({
						status: 'success',
						auth: true,
						token,
						id: user.id,
						user: user,
						message: 'User found & logged in, no media'
					});
				} else {
					try {
						mediaController.getUrl(media[0].filepath, media[0].filename).then(function (data) {
							media[0].linkimg = data
							res.status(200).json({
								status: 'success',
								auth: true,
								token,
								id: user.id,
								user: user,
								media: media[0],
								message: 'User found & logged in with media'
							});
						})
					} catch (err) {
						res.status(500).json({
							status: 'Error',
							message: `Error retrieving item from bucket: ${err}`
						})
					}
				}
			})
		}
	})(req, res, next);
}

function checkUser(req, res, next) {
	if (req.body.email === '') {
		res.status(400).json({
			status: 'error',
			message: 'Email required!'
		});
	} else {
		db.oneOrNone('select * from account where email = $1', [req.body.email.toLowerCase()]
		).then((user) => {
			if (user === null) {
				console.error('Email not in DB!');
				res.status(403).json({
					status: 'error',
					message: 'Email not in DB!'
				});
			} else {
				res.status(200).json({
					status: 'success',
					message: 'Email in DB!',
					data: user.id
				});
			}
		});
	}
}

function forgotPassword(req, res, next) {
	if (req.body.email === '') {
		res.status(400).json({
			status: 'error',
			message: 'Email required!'
		});
	} else {
		db.oneOrNone('select * from account where email = $1', [req.body.email.toLowerCase()]
		).then((user) => {
			if (user === null) {
				console.error('Email not in DB!');
				res.status(403).json({
					status: 'error',
					message: 'Email not in DB!'
				});
			} else {
				const token = cryptoRandomString({ length: 20 });
				db.none('update account set localtoken=$1, expireslocaltoken=$2, updated_at = NOW() where id=$3', [token, moment().add(20, 'minutes').format('YYYY-MM-DDTHH:mm'), parseInt(user.id)]
				).then(() => {
					res.setLocale(user.language)
					const mailOptions = {
						from: process.env.SERVER_EMAIL,
						to: user.email,
						subject: res.__('mail.forgotPassword.subject'),
						text: res.__('mail.forgotPassword.content', { link: `https://${process.env.CLIENT_HOST}/reset/${token}` })
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
							message: 'Recovery email sent!'
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

function forgotPasswordInApp(req, res, next) {
	if (req.body.email === '') {
		res.status(400).json({
			status: 'error',
			message: 'Email required!'
		});
	} else {
		db.oneOrNone('select * from account where email = $1', [req.body.email.toLowerCase()]
		).then((user) => {
			if (user === null) {
				console.error('Email not in DB!');
				res.status(403).json({
					status: 'error',
					message: 'Email not in DB!'
				});
			} else {
				// random 6 digit number
				const codeReset = Math.floor(Math.random() * 899999 + 100000)
				db.none('update account set codetemp=$1, expirescodetemp=$2, updated_at = NOW() where id=$3', [codeReset, moment().add(20, 'minutes').format('YYYY-MM-DDTHH:mm'), parseInt(user.id)]
				).then(() => {
					res.setLocale(user.language)
					const mailOptions = {
						from: process.env.SERVER_EMAIL,
						to: user.email,
						subject: res.__('mail.forgotPassword.subject'),
						text: res.__('mail.forgotPasswordInApp.content', { code: codeReset })
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
							message: 'Recovery email sent!'
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

function checkResetCode(req, res, next) {
	if (req.body.email === '' || req.body.resetPasswordCode === '') {
		res.status(400).json({
			status: 'error',
			message: 'Field required!'
		});
	} else {
		db.oneOrNone('select * from account where (email = $1 AND codetemp = $2 AND expirescodetemp::timestamp > current_timestamp) ', [req.body.email.toLowerCase(), req.body.resetPasswordCode]
		).then(user => {
			if (user === null) {
				console.error('No user exists in db or password reset link is invalid or has expired!');
				res.status(403).json({
					status: 'error',
					message: 'No user exists in db or password reset link is invalid or has expired!'
				});
			}
			console.log('User exists in db');
			res.status(200).json({
				status: 'success',
				message: 'Code is correct!'
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

function updatePasswordViaEmail(req, res, next) {
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
				db.none('update account set password = $1, localtoken = NULL, expireslocaltoken = NULL, updated_at = NOW() where id=$2', [hashedPassword, parseInt(user.id)]
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

function updatePasswordViaApp(req, res, next) {
	if (req.body.email === '' || req.body.resetPasswordCode === '' || req.body.password === '') {
		res.status(400).json({
			status: 'error',
			message: 'Field required!'
		});
	} else {
		db.oneOrNone('select * from account where (email = $1 AND codetemp = $2 AND expirescodetemp::timestamp > current_timestamp) ', [req.body.email.toLowerCase(), req.body.resetPasswordCode]
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
				db.none('update account set password = $1, codetemp = NULL, updated_at = NOW() where id=$2', [hashedPassword, parseInt(user.id)]
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

function updatePassword(req, res, next) {
	passport.authenticate('jwt', { session: false }, (error, user, info) => {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
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
					db.none('update account set password = $1 where id=$2', [hashedPassword, parseInt(user.id)]
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
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(401).json(message);
		} else {
			if (user.id === parseInt(req.params.id)) {
				const pgp = db.$config.pgp;
				let userUpdate = req.body.user
				userUpdate.updated_at = roadtripController.getStringDateFormatted()
				const condition = pgp.as.format(' WHERE id = $1', user.id);
				let sql = pgp.helpers.update(userUpdate, ['firstname', 'lastname', 'dateborn', 'gender', 'biography', 'email', 'phone', 'language', 'media_id', 'firebasetoken', 'updated_at'], 'account') + condition;
				db.none(sql).then(function () {
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
			} else {
				res.status(403).json({
					status: 'error',
					message: `Auth issue`
				});
			}
		}
	})(req, res, next);
}

module.exports = {
	getUsersByQuery: getUsersByQuery,
	getUserDetails: getUserDetails,
	forgotPassword: forgotPassword,
	forgotPasswordInApp: forgotPasswordInApp,
	checkResetCode: checkResetCode,
	updatePasswordViaApp: updatePasswordViaApp,
	updatePasswordViaEmail: updatePasswordViaEmail,
	updatePassword: updatePassword,
	createUser: createUser,
	updateUser: updateUser,
	removeUser: removeUser,
	loginUser: loginUser,
	checkUser: checkUser
};