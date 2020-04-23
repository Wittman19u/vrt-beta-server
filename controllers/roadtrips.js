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
			// essential : title/departure/arrival/start/end
			let data = req.body
			data.title = req.body.title
			data.departure = req.body.departure
			data.arrival = req.body.arrival
			data.start = req.body.start
			data.end = req.body.end
			data.distance = (req.body.distance !== null) ? req.body.distance : null
			data.duration = (req.body.duration !== null) ? req.body.duration : null
			data.hashtag = (req.body.hashtag !== null) ? JSON.stringify(req.body.hashtag) : null
			data.public = 2
			data.status_id = 3
			let sql = `INSERT INTO roadtrip(title, departure, arrival, start, end, distance, duration, hashtag, public, status_id) VALUES(${data.title}, ${data.departure}, ${data.arrival}, ${data.start}, ${data.end}, ${data.distance}, ${data.duration}, ${data.hashtag}, ${data.public}, ${data.status_id});`

			db.any(sql, data).then(function (rows) {
				if(req.body.waypoints){ // insert waypoints in relative table
					req.body.waypoints.forEach(waypoint => {
						let geom = new STPoint(waypoint.latitude, waypoint.longitude)
						let sql = `INSERT INTO waypoint (label, day, sequence, transport, geom, latitude, longitude, roadtrip_id) VALUES(${waypoint.label}, ${waypoint.day}, ${waypoint.sequence}, ${waypoint.transport}, ${geom}, ${waypoint.latitude}, ${waypoint.longitude}, ${rows[0].id});`;
						db.any(sql);
					});
				}
				res.status(200)
					.json({
						status: 'success',
						message: 'Inserted one roadtrip',
						id:rows[0].id
					});
			}).catch(function (err) {
				return next(err);
			});
		}
	})(req, res, next);
}

function getRoadtripDetails(req, res, next) {
	var roadtripID = parseInt(req.params.id);
	let sql= `select * from waypoint INNER JOIN visit ON visit.waypoint_id = waypoint.id INNER JOIN poi ON poi.id = visit.poi_id WHERE roadtrip_id = ${roadtripID} ORDER BY waypoint.day, waypoint.sequence, visit.sequence`;
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

module.exports = {
	createRoadtrip: createRoadtrip,
	getRoadtripDetails: getRoadtripDetails
};