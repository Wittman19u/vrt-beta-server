const db = require('./db');
const passport = require('passport');

function getUserAlerts(req, res, next) {
	var limit = parseParam(req.query.limit, 10)
	var offset = parseParam(req.query.offset, 0)
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

function deleteAlert(req, res, next) {
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

// to parse limit/offset/etc... (any optional int parameters)
function parseParam(param, defaultValue) {
	const parsed = parseInt(param);
	if (isNaN(parsed)) { return defaultValue; }
	return parsed;
}

module.exports = {
	getUserAlerts: getUserAlerts,
	deleteAlert: deleteAlert
};