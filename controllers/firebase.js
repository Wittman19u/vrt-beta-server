const db = require('./db');
const admin = require("firebase-admin");
const serviceAccount = require("../very-road-trip-firebase-adminsdk-llx1r-46a4c6cab3.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://very-road-trip.firebaseio.com"
});

// select
function sendMessageToUsersWithRoadtripStartingToday(req, res, next) {
	const date = new Date()
	var todayString = date.toISOString().substr(0, 10)
	date.setDate(date.getDate() + 1)
	var tomorrowString = date.toISOString().substr(0, 10)
	db.any('SELECT account.id AS account_id, firebasetoken, roadtrip.id AS roadtrip_id, roadtrip.title FROM account INNER JOIN participate ON account.id = participate.account_id INNER JOIN roadtrip ON participate.roadtrip_id = roadtrip.id WHERE firebasetoken IS NOT NULL AND roadtrip.start >= $1 AND roadtrip.start <= $2 AND roadtrip.status_id = 1', [todayString, tomorrowString]).then(function (rows) {
		// for every response, populate alert table, and send ONE notification per user
		console.log(rows)
		var messages = []
		var uniqueTokens = []
		var insertAlertRequests = []
		var title = 'You have new notifications !'
		var message = ''
		if (rows[0] == null) {
			res.status(200).json({
				status: 'Success',
				message: 'No notifications to send'
			});
		} else {
			rows.forEach(function(row) {
				message = `Your roadtrip ${row.title} will start in the next few days !`
				if (!uniqueTokens.includes(row.firebasetoken)) {
					uniqueTokens.push(row.firebasetoken)
					messages.push({
						notification: {
							title: title,
							body: message
						},
						token: row.firebasetoken
					})
				}
				insertAlertRequests.push(db.any(`INSERT INTO alert (title, message, recipient_id, roadtrip_id) VALUES ('${title}', '${message}', ${row.account_id}, ${row.roadtrip_id})`))
			})
			Promise.all(insertAlertRequests).then(() => {
				admin.messaging().sendAll(messages)
					.then((response) => {
						console.log(response.successCount + ' messages were sent successfully');
						res.status(200).json({
							status: 'success',
							message: 'Inserted into alert table and sent notifications'
						});
					})
					.catch((error) => {
						console.log('Error sending message:', error);
					});
			}).catch(function (error) {
				console.error(`Problem during insert DB (alert): ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Problem during insert DB (alert): ${error}`
				});
			});
		}
	})
}

module.exports = {
	sendMessageToUsersWithRoadtripStartingToday: sendMessageToUsersWithRoadtripStartingToday
};