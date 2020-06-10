const db = require('./db');
const passport = require('passport');


// function getAllWaypoints(req, res, next) {
// 	let limit = 16;
// 	if (typeof req.query.limit !== 'undefined'){
// 		limit = req.query.limit;
// 	}
// 	let sql= `select * from waypoint limit ${limit}`;
// 	console.log(sql);
// 	db.any(sql)
// 		.then(function (data) {
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					itemsNumber: data.length,
// 					data: data,
// 					message: 'Retrieved ALL waypoints'
// 				});
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

// function getWaypointsByItinerary(req, res, next) {
// 	if (typeof req.query.itinerary !== 'undefined'){
// 		const itinerary = req.query.itinerary;

// 		let sql= `select * from waypoint where itinerary_id = ${itinerary}`;
// 		console.log(sql);
// 		db.any(sql)
// 			.then(function (data) {
// 				res.status(200)
// 					.json({
// 						status: 'success',
// 						itemsNumber: data.length,
// 						data: data,
// 						message: `Retrieved ALL waypoints for itnerary ${itinerary}`
// 					});
// 			})
// 			.catch(function (err) {
// 				return next(err);
// 			});
// 	}
// }

// function getSingleWaypoint(req, res, next) {
// 	var waypointID = parseInt(req.params.id);
// 	db.one('select * from waypoint where id = $1', waypointID)
// 		.then(function (data) {
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					data: data,
// 					message: 'Retrieved ONE waypoint'
// 				});
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

function createWaypoint(req, res, next) {
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
			var waypoint = req.params.waypoint;
			let sql = `SELECT * FROM participate WHERE roadtrip_id = ${waypoint.roadtrip_id}) AND account_id = ${user.id} AND (status = 1 OR status = 2)`
			db.any(sql).then(function (rows) {
				if (rows[0].id !== null) {
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
					waypoint.geom = new STPoint(waypoint.longitude, waypoint.latitude)
					waypoint.account_id = user.id
					// let sql = `INSERT INTO waypoint (label, day, sequence, transport, geom, latitude, longitude, roadtrip_id, account_id) VALUES('${waypoint.label}', ${waypoint.day}, ${waypoint.sequence}, ${waypoint.transport}, '${geom}', ${waypoint.latitude}, ${waypoint.longitude}, ${waypoint.roadtrip_id}, ${user.id});`;
					db.any('INSERT INTO waypoint ($1:name) VALUES($1:csv) RETURNING id;', [waypoint]).then(function (rows) {
						res.status(200).json({
							status: 'success',
							id: rows[0].id,
							message: `Successfully inserted waypoint`
						})
					}).catch(function (err) {
						res.status(500).json({
							status: 'error',
							message: `Problem during query DB (insert waypoint): ${err}`
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

function updateWaypoint(req, res, next) {
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
			var waypoint_id = parseInt(req.params.id);
			let sql = `SELECT * FROM participate WHERE roadtrip_id IN (select roadtrip_id from waypoint WHERE id = ${waypoint_id}) AND account_id = ${user.id} AND (status = 1 OR status = 2)`
			db.any(sql).then(function (rows) {
				if (rows[0].id !== null) {
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
					var waypoint = req.body.waypoint;
					waypoint.geom = new STPoint(waypoint.longitude, waypoint.latitude)		
					const condition = pgp.as.format(' WHERE id = $1', waypoint_id);
					let sql = pgp.helpers.update(waypoint, ['label', 'day', 'sequence', 'transport', 'geom', 'latitude', 'longitude', 'roadtrip_id'], 'waypoint') + condition;
					// let sql = `UPDATE waypoint SET label = '${waypoint.label}, day = ${waypoint.day}, sequence = ${waypoint.sequence}, transport = ${waypoint.transport}, geom = '${geom}', latitude = ${waypoint.latitude}, longitude = ${waypoint.longitude}, roadtrip_id = ${waypoint.roadtrip_id} WHERE id = ${waypoint_id};`;
					db.none(sql).then(function () {
						res.status(200).json({
							status: 'success',
							message: `Successfully updated waypoint ${waypoint_id}`
						})
					}).catch(function (err) {
						res.status(500).json({
							status: 'error',
							message: `Problem during query DB (update waypoint): ${err}`
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

function removeWaypoint(req, res, next) {
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
			var waypoint_id = parseInt(req.params.id);
			let sql = `SELECT * FROM participate WHERE roadtrip_id IN (select roadtrip_id from waypoint WHERE id = ${waypoint_id}) AND account_id = ${user.id} AND (status = 1 OR status = 2)`
			db.any(sql).then(function (rows) {
				if (rows[0] !== undefined) {
					db.result('delete from visit where waypoint_id = $1', waypoint_id)
					.then(function (result) {
						db.result('delete from waypoint where id = $1', waypoint_id)
							.then(function (result) {
								db.result('delete from comment where waypoint_id = $1', waypoint_id)
									.then(function (result) {
										res.status(200)
											.json({
												status: 'success',
												message: `Removed waypoint`
											});
									})
							})
					})
					.catch(function (err) {
						return next(err);
					});
				} else {
					res.status(403).json({
						status: 'error',
						message: 'The user does not participate in the roadtrip or the waypoint is not a part of the roadtrip'
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
	// getWaypointsByItinerary: getWaypointsByItinerary,
	//getAllWaypoints: getAllWaypoints,
	// getSingleWaypoint: getSingleWaypoint,
	createWaypoint: createWaypoint,
	updateWaypoint: updateWaypoint,
	removeWaypoint: removeWaypoint
};