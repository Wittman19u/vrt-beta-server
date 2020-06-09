const db = require('./db');
const passport = require('passport');

function getUserAlerts(req, res, next) {
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if(info !== undefined){
				message['message']= info.message;
				message['info']= info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			db.any('SELECT * FROM alert WHERE recipient_id = $1 ORDER BY isread, id DESC', user.id).then(function (alerts) {
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

module.exports = {
	getUserAlerts: getUserAlerts
};