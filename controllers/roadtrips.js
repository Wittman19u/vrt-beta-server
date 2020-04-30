const db = require('./db');
const passport = require('passport');

function createRoadtrip(req, res, next) {
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
			const pgp = db.$config.pgp;
			class STPoint {
				constructor(x, y) {
					this.x = x;
					this.y = y;
					this.rawType = true; // no escaping, because we return pre-formatted SQL
				}
				toPostgres(self) {
					return pgp.as.format('ST_SetSRID(ST_MakePoint($1, $2),4326)', [this.x, this.y]);
				}
			}
			if (req.body.account_id === null) {
				res.status(500).json({
					status: 'error',
					message: 'account id missing'
				})
			}
			// essential : title/departure/arrival/start/end
			console.log(req.body)
			let roadtrip = req.body.roadtrip
			roadtrip.title = req.body.roadtrip.title
			roadtrip.departure = req.body.roadtrip.departure
			roadtrip.arrival = req.body.roadtrip.arrival
			roadtrip.start = req.body.roadtrip.start
			roadtrip.end = req.body.roadtrip.end
			roadtrip.departurelatitude = req.body.roadtrip.departurelatitude
			roadtrip.departurelongitude = req.body.roadtrip.departurelongitude
			roadtrip.departuregeom = new STPoint(roadtrip.departurelatitude, roadtrip.departurelongitude)
			roadtrip.arrivallatitude = req.body.roadtrip.arrivallatitude
			roadtrip.arrivallongitude = req.body.roadtrip.arrivallongitude
			roadtrip.arrivalgeom = new STPoint(roadtrip.arrivallatitude, roadtrip.arrivallongitude)
			roadtrip.distance = (req.body.roadtrip.distance !== null) ? req.body.roadtrip.distance : null
			roadtrip.duration = (req.body.roadtrip.duration !== null) ? req.body.roadtrip.duration : null
			roadtrip.hashtag = (req.body.roadtrip.hashtag !== null) ? JSON.stringify(req.body.roadtrip.hashtag) : null
			roadtrip.public = 2
			roadtrip.status_id = 3
			let sql = `INSERT INTO roadtrip(title, departure, arrival, "start", "end", distance, duration, hashtag, "public", status_id, departurelongitude, departurelatitude, departuregeom, arrivallongitude, arrivallatitude, arrivalgeom) VALUES(${roadtrip.title}, ${roadtrip.departure}, ${roadtrip.arrival}, ${roadtrip.start}, ${roadtrip.end}, ${roadtrip.distance}, ${roadtrip.duration}, ${roadtrip.hashtag}, ${roadtrip.public}, ${roadtrip.status_id}, ${roadtrip.departurelongitude}, ${roadtrip.departurelatitude}, ${roadtrip.departuregeom}, ${roadtrip.arrivallongitude}, ${roadtrip.arrivallatitude}, ${roadtrip.arrivalgeom});`

			db.any(sql, roadtrip).then(function (rows) {
				let roadtrip_id = rows[0].id
				let sql = `INSERT INTO participate (promoter, account_id, roadtrip_id) VALUES(${true}, ${req.body.account_id}, ${roadtrip_id});`;
				db.any(sql).then(function (rows) {
					if(req.body.waypoints){ // insert waypoints in relative table
						req.body.waypoints.forEach(waypoint => {
							let geom = new STPoint(waypoint.latitude, waypoint.longitude)
							let sql = `INSERT INTO waypoint (label, day, sequence, transport, geom, latitude, longitude, roadtrip_id) VALUES(${waypoint.label}, ${waypoint.day}, ${waypoint.sequence}, ${waypoint.transport}, ${geom}, ${waypoint.latitude}, ${waypoint.longitude}, ${roadtrip_id});`;
							db.any(sql).catch(function (error) {
								console.error(`Problem during update DB (waypoint): ${error}`);
								res.status(500).json({
									status: 'error',
									message: `Problem during update DB (waypoint): ${error}`
								});
							});
						});
					}
					res.status(200)
						.json({
							status: 'success',
							message: 'Inserted one roadtrip',
							id:rows[0].id
						});
				}).catch(function (error) {
					console.error(`Problem during update DB (participate): ${error}`);
					res.status(500).json({
						status: 'error',
						message: `Problem during update DB (participate): ${error}`
					});
				});
			}).catch(function (error) {
				console.error(`Problem during update DB (roadtrip): ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Problem during update DB (roadtrip): ${error}`
				});
			});
		}
	})(req, res, next);
}

function getRoadtripDetails(req, res, next) {
	var roadtripID = parseInt(req.params.id);
	let sql= `select * from waypoint INNER JOIN visit ON visit.waypoint_id = waypoint.id INNER JOIN poi ON poi.id = visit.poi_id WHERE waypoint.roadtrip_id = ${roadtripID} ORDER BY waypoint.day, waypoint.sequence, visit.sequence`;
	console.log(sql);
	db.any(sql).then(function (waypoints) {
		db.one('select * from roadtrip where id = $1', roadtripID
		).then(function (roadtrip) {
			roadtrip.waypoints = waypoints;
			let result = {
				status: 'success',
				data: roadtrip,
				message: 'Retrieved ONE roadtrip'
			};

			if(parseInt(roadtrip.public) === 1 ){
				res.status(200).json(result);
			} else {
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
						res.status(200).json(result);
					}
				})(req, res, next);
			}
		}).catch(function (err) {
			return next(err);
		});
	}).catch(function (err) {
		return next(err);
	});
}

function getUserRoadtrips(req, res, next) {
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
			var userId = parseInt(req.params.id);
			let sql= `select * from roadtrip INNER JOIN participate ON participate.roadtrip_id = roadtrip.id INNER JOIN account ON account.id = participate.account_id WHERE roadtrip.id IN (select roadtrip_id from participate WHERE account_id = ${userId}) ORDER BY roadtrip.id, participate.roadtrip_id`;
			db.any(sql).then(function (roadtrips) {
				roadtrips.waypoints = waypoints
				res.status(200).json({
					status: 'success',
					data: roadtrips,
					message: 'Retrieved ALL the roadtrips and associated participants from user'
				})
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during query DB (roadtrips): ${err}`
				})
			});
		}
	})(req, res, next);
}

function getPublicRoadtrips(req, res, next) {
	let sql= `select * from roadtrip INNER JOIN participate ON participate.roadtrip_id = roadtrip.id INNER JOIN account ON account.id = participate.account_id WHERE roadtrip.public = ${1} AND participate.promoter = ${true} ORDER BY roadtrip.id, participate.roadtrip_id`;
	db.any(sql).then(function (roadtrips) {
		roadtrips.waypoints = waypoints
		res.status(200).json({
			status: 'success',
			data: roadtrips,
			message: 'Retrieved ALL the roadtrips and associated promoter'
		})
	}).catch(function (err) {
		res.status(500).json({
			status: 'error',
			message: `Problem during query DB (roadtrips): ${err}`
		})
	});
}

function updateRoadtrip(req, res, next) {
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
			var roadtrip_id = parseInt(req.params.id);
			let sql = `select * from participate WHERE account_id = ${user.id} AND roadtrip_id = ${roadtrip_id}`
			db.any(sql).then(function (rows) {
				if (rows[0].id !== null) {
					// TODO	change just roadtrip ()

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
	createRoadtrip: createRoadtrip,
	getRoadtripDetails: getRoadtripDetails,
	getUserRoadtrips: getUserRoadtrips,
	getPublicRoadtrips: getPublicRoadtrips,
	updateRoadtrip: updateRoadtrip
};