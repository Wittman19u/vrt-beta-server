const db = require('./db');
const passport = require('passport');
const transporter = require('./email');
const admin = require("firebase-admin");
const serviceAccount = require("../very-road-trip-firebase-adminsdk-llx1r-46a4c6cab3.json");

//firebase
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://very-road-trip.firebaseio.com"
});

function getUserAlerts(req, res, next) {
	var limit = parseParam(req.query.limit, 10)
	var offset = parseParam(req.query.offset, 0)
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
			db.any('SELECT * FROM alert WHERE recipient_id = $1 ORDER BY isread, id DESC LIMIT $2 OFFSET $3', [user.id, limit, offset]).then(function (alerts) {
				res.status(200).json({
					status: 'success',
					data: alerts,
					message: 'Retrieved ALL the alerts from user'
				})
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during query DB (alerts): ${err}`
				})
			});
		}
	})(req, res, next);
}

// firebase notif + insert dans alert + insert dans participate avec le status correct (3 pour invité)
function sendInviteToRoadtrip(req, res, next) {
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
			var senderId = user.id
			var userId = req.query.userId
			var roadtripId = req.query.roadtripId
			// we do an inner join on participate to make the sender does participate in the roadtrip
			db.any('SELECT firebasetoken, title FROM account FULL JOIN roadtrip ON roadtrip.id = $1 INNER JOIN participate ON participate.account_id = $2 AND participate.roadtrip_id = roadtrip.id WHERE account.id = $3', [roadtripId, senderId, userId]).then(function (row) {
				if (row[0] != null) {
					// send notif
					var alertTitle = 'You received an invitation to a roadtrip !'
					var alertBody = `You were invited to join the roadtrip "${row[0].title}" !`
					var message = {
						notification: {
							title: alertTitle,
							body: alertBody
						},
						token: row[0].firebasetoken
					}
					admin.messaging().send(message).then((response) => {
						// TODO -> mettre promise all pour rejoindre les deux
						// insert into alert (category 6 is roadtrip invite)
						// TODO  use promise.all to reduce execution time
						db.any(`INSERT INTO alert (title, message, recipient_id, sender_id, roadtrip_id, category_id) VALUES ('${alertTitle}', '${alertBody}', ${userId}, ${senderId}, ${roadtripId}, ${6})`).then(function () {
							// insert into participate
							db.any(`INSERT INTO participate (promoter, account_id, roadtrip_id, status) VALUES(false, ${userId}, ${roadtripId}, 3)`).then(function () {
								res.status(200).json({
									status: 'Success',
									message: `Inserted into alert and participate. Sent notif : ${response}`
								})
							}).catch(function (err) {
								res.status(500).json({
									status: 'error',
									message: `Problem during insert DB (participate): ${err}`
								})
							});
						}).catch(function (err) {
							res.status(500).json({
								status: 'error',
								message: `Problem during insert DB (alerts): ${err}`
							})
						});
					})
				} else {
					res.status(403).json({
						status: 'Error',
						message: `You are not allowed to invite people to this roadtrip`
					})
				}

			})
		}
	})(req, res, next);
}

// insert in invite
function sendInviteNewUser(req, res, next) {
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
			var senderId = user.id
			var email = req.query.email
			var roadtripId = req.query.roadtripId
			var sql = `INSERT INTO invited (email, sender_id) VALUES('${email}', ${senderId})`
			if (roadtripId !== undefined) {
				console.log(roadtripId)
				sql = `INSERT INTO invited (email, sender_id, roadtrip_id) VALUES('${email}', ${senderId}, ${roadtripId})`
			}
			db.any(sql).then(function () {
				const mailOptions = {
					from: process.env.SERVER_EMAIL,
					to: email,
					subject: res.__('mail.invite.subject'),
					// TODO add link to download app (same in en.json)
					text: res.__('mail.invite.content'),
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
						message: 'Confirmation email sent and inserted in invited!'
					});
				});
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during insert DB (invited): ${err}`
				})
			});
		}
	})(req, res, next);
}

function deleteAlert(req, res, next) {
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
			var alert_id = parseInt(req.params.id)
			db.none('DELETE FROM alert WHERE id = $1 AND recipient_id = $2', [alert_id, user.id]).then(function () {
				res.status(200).json({
					status: 'Success',
					message: `Succesfully deleted alert ${alert_id}`
				})
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during remove db (alerts): ${err}`
				})
			});
		}
	})(req, res, next);
}

function updateAlert(req, res, next) {
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
			let sql = `UPDATE alert SET isread = true WHERE recipient_id = ${user.id}`
			if (req.body.alertIds !== undefined) {
				sql += ` AND id IN (${req.body.alertIds})`
			}
			db.any(sql).then(function () {
				res.status(200).json({
					status: 'Success',
					message: `Succesfully updated all alerts to isread = true from user ${user.id}`
				})
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during update db (alerts): ${err}`
				})
			});
		}
	})(req, res, next);
}

// to parse limit/offset/etc... (any optional int parameters)
function parseParam(param, defaultValue) {
	const parsed = parseInt(param);
	if (isNaN(parsed)) { return defaultValue; }
	return parsed;
}

module.exports = {
	getUserAlerts: getUserAlerts,
	deleteAlert: deleteAlert,
	sendInviteToRoadtrip: sendInviteToRoadtrip,
	updateAlert: updateAlert,
	sendInviteNewUser: sendInviteNewUser
};