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
	db.one('select visit.*, poi.id as id_poi, poi.sourceid, poi.sourcetype, poi.label AS poi_label, poi.sourcetheme, poi.start, poi.end, poi.stree, poi.zipcode, poi.city, poi.country, poi.latitude AS poi_latitude, poi.longitude AS poi_longitude, poi.geom AS poi_geom, poi.email, poi.web, poi.phone, poi.linkimg, poi.description, poi.type, poi.priority, poi.visnumber, poi.opening, poi.created_at AS poi_created_at, poi.updated_at AS poi_updated_at, poi.source, poi.sourcelastupdate, poi.active, poi.profiles, poi.duration, poi.price, poi.rating, poi.ocean, poi.pricerange, poi.social, poi.handicap, poi.manuallyupdate, poi.hashtag from visit INNER JOIN poi on poi.id = visit.poi_id where visit.id = $1', visitId).then(function (visit) {
		var poi = {"id": visit.id_poi, "sourceid": visit.sourceid, "sourcetype": visit.sourcetype, "poi_label": visit.poi_label, "sourcetheme": visit.sourcetheme, "start": visit.start, "end": visit.end, "stree": visit.stree, "zipcode": visit.zipcode, "city": visit.city, "country": visit.country, "latitude": visit.poi_latitude, "longitude": visit.poi_longitude, "geom": visit.poi_geom, "email": visit.email, "web": visit.web, "phone": visit.phone, "linkimg": visit.linkimg, "description": visit.description, "type": visit.type, "priority": visit.priority, "visnumber": visit.visnumber, "opening": visit.opening, "created_at": visit.poi_created_at, "updated_at": visit.poi_updated_at, "source": visit.source, "sourcelastupdate": visit.sourcelastupdate, "active": visit.active, "profiles": visit.profiles, "duration": visit.duration, "price": visit.price, "rating": visit.rating, "ocean": visit.ocean, "pricerange": visit.pricerange, "social": visit.social, "handicap": visit.handicap, "manuallyupdate": visit.manuallyupdate, "hashtag": visit.hashtag}
		var formattedVisit = {"id": visit.id, "sequence": visit.sequence, "waypoint_id": visit.waypoint_id, "poi_id": visit.poi_id, "transport": visit.transport}
		res.status(200).json({
			status: 'success',
			data: {"visit": formattedVisit, "poi": poi},
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

function updateVisit(req, res, next) {
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
			var visit_id = parseInt(req.params.id);
			let sql = `SELECT * FROM participate WHERE roadtrip_id IN (SELECT roadtrip_id FROM waypoint WHERE id IN (SELECT waypoint_id FROM visit WHERE id = ${visit_id})) AND account_id = ${user.id}`
			db.any(sql).then(function (rows) {
				if (rows[0].id !== null) {
					const pgp = db.$config.pgp;
					let visit = req.body.visit
					const condition = pgp.as.format(' WHERE id = ${1}', visit_id);
					let sql = pgp.helpers.update(visit, ['sequence', 'waypoint_id', 'poi_id'], 'visit') + condition;
					db.one(sql).then(function () {
						res.status(200).json({
							status: 'success',
							message: `Successfully updated visit ${visit_id}`
						})
					}).catch(function (err) {
						res.status(500).json({
							status: 'error',
							message: `Problem during query DB (update visit): ${err}`
						})
					});
				} else {
					res.status(403).json({
						status: 'error',
						message: 'The user does not participate in the roadtrip'
					})
				}
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during query DB (participate): ${err}`
				})
			});
		}
	})(req, res, next);
}

function removeVisit(req, res, next) {
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
			var visit_id = parseInt(req.params.id);
			let sql = `SELECT * FROM participate WHERE roadtrip_id IN (SELECT roadtrip_id FROM waypoint WHERE id IN (SELECT waypoint_id FROM visit WHERE id = ${visit_id})) AND account_id = ${user.id}`
			db.any(sql).then(function (rows) {
				if (rows[0].id !== null) {
					db.result('delete from visit where id = $1', visit_id).then(function () {
						res.status(200).json({
							status: 'success',
							message: `Removed visit`
						});
					}).catch(function (err) {
						return next(err);
					});
				} else {
					res.status(403).json({
						status: 'error',
						message: 'The user does not participate in the roadtrip'
					})
				}
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during query DB (participate): ${err}`
				})
			});
		}
	})(req, res, next);
}

module.exports = {
	createVisit: createVisit,
	removeVisit: removeVisit,
	updateVisit: updateVisit,
	getVisitDetails: getVisitDetails
};