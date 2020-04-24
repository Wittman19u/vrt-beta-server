const db = require('./db');
const passport = require('passport');

function createVisit(req, res, next) {
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
			let data = req.body
			data.sequence = req.body.sequence
			data.waypoint_id = req.body.waypoint_id
			data.poi_id = req.body.poi_id
			let sql = `INSERT INTO visit(sequence, waypoint_id, poi_id) VALUES(${data.sequence}, ${data.waypoint_id}, ${data.poi_id});`

			db.any(sql, data).then(function (rows) {
				res.status(200)
					.json({
						status: 'success',
						message: 'Inserted one visit',
						id:rows[0].id
					});
			}).catch(function (error) {
				console.error(`Problem during update DB: ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Problem during update DB: ${error}`
				});
			});
		}
	})(req, res, next);
}

function getVisitDetails(req, res, next) {
	var visitId = parseInt(req.params.id);
	db.one('select * from visit INNER JOIN poi on poi.id = visit.poi_id where id = $1', visitId).then(function (visit) {
		res.status(200).json({
			status: 'success',
			data: visit,
			message: 'Retrieved a visit and its associated poi'
		});
	}).catch(function (error) {
		console.error(`Could not find the visit: ${error}`);
		res.status(500).json({
			status: 'error',
			message: `Could not find the visit: ${error}`
		});
	});
}

module.exports = {
	createVisit: createVisit,
	getVisitDetails: getVisitDetails
};