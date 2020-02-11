const db = require('./db');
const passport = require('passport');

function getItineraryDetails(req, res, next) {
	var itineraryID = parseInt(req.params.id);
	let sql= `select * from waypoint INNER JOIN poi ON poi.id = waypoint.poi_id WHERE itinerary_id = ${itineraryID}`;
	console.log(sql);
	db.any(sql).then(function (waypoints) {
		db.one('select * from itinerary where id = $1', itineraryID
		).then(function (itinerary) {
			itinerary.waypoints = waypoints;
			let result = {
				status: 'success',
				data: itinerary,
				message: 'Retrieved ONE itinerary'
			};

			if(parseInt(itinerary.public) === 1 ){
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

function createItinerary(req, res, next) {
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
			console.log("userid:" + user);
			console.log(req.body);
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
			req.body.show = parseInt(req.body.show);
			let parameters = {
				departure: JSON.stringify(req.body.departure),
				departurestr: req.body.departurestr,
				departuregeom:  new STPoint(req.body.departure[0], req.body.departure[1]),
				arrival:  JSON.stringify(req.body.arrival),
				arrivalstr: req.body.arrivalstr,
				arrivalgeom: new STPoint(req.body.arrival[0], req.body.arrival[1]),
				public: 1,
				user_id : user.id
			};
			// db.none('insert into itinerary(departure, departuregeom, departurestr, arrival,arrivalgeom, arrivalstr, public, user_id)' +
			// 		'values(${departure}, ${departuregeom}, ${departurestr}, ${arrival}, ${arrivalgeom}, ${arrivalstr}, ${public}, ${user_id})', req.body)
			db.any('INSERT INTO itinerary ($1:name) VALUES($1:csv) RETURNING id;', [parameters]
			).then((rows) => {
				if(req.body.waypoints){ // insert waypoints in relative table
					let wayPoints = req.body.waypoints;
					for(let poiId of wayPoints ){
						console.log(poiId);
						let sql = `INSERT INTO waypoint (itinerary_id, poi_id) VALUES(${rows[0].id}, ${poiId});`;
						db.any(sql);
					}
				}
				res.status(200)
					.json({
						status: 'success',
						message: 'Inserted one itinerary',
						id:rows[0].id
					});
			}).catch(function (err) {
				return next(err);
			});
		}
	})(req, res, next);
}

// function updateItinerary(req, res, next) {
// 	db.none('update itinerary set name=$1, breed=$2, age=$3, sex=$4 where id=$5',
// 		[req.body.name, req.body.breed, parseInt(req.body.age),
// 			req.body.sex, parseInt(req.params.id)])
// 		.then(function () {
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					message: 'Updated itinerary'
// 				});
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

function removeItinerary(req, res, next) {
	passport.authenticate('jwt', { session: false }, (err, user, info) => {
		if (err) {
			console.error(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			res.status(403).send(info.message);
		} else {
			const itineraryID = parseInt(req.params.id);
			const userID = parseInt(user.id);
			db.result('delete from waypoint WHERE itinerary_id = $1', itineraryID
			).then( wayres=>{
				db.result('delete from itinerary where id = $1 AND user_id = $2', itineraryID, userID
				).then( result => {
					/* jshint ignore:start */
					res.status(200)
						.json({
							status: 'success',
							message: `Removed ${wayres.rowCount} waypoint and ${result.rowCount} itinerary`
						});
					/* jshint ignore:end */
				}).catch(function (err) {
					return next(err);
				});
			}).catch(function (err) {
				return next(err);
			});

		}
	})(req, res, next);
}


// show the itinerary list
function getMyItineraries(req, res, next) {
	passport.authenticate('jwt', { session: false }, (err, user, info) => {
		if (err) {
			console.error(err);
		}
		if (info !== undefined) {
			console.error(info.message);
			res.status(403).send(info.message);
		} else {
			const userID = parseInt(user.id);
			db.any('select * from itinerary where user_id = $1', userID)
				.then((data) => {
					res.status(200).json({
						status: 'success',
						itemsNumber: data.length,
						data: data,
						message: 'Retrieved ALL itinerarys'
					});
				})
				.catch(function (err) {
					return next(err);
				});
		}
	})(req, res, next);
}

module.exports = {
	// getAllItineraries: getAllItineraries,
	getItineraryDetails: getItineraryDetails,
	createItinerary: createItinerary,
	// updateItinerary: updateItinerary,
	removeItinerary: removeItinerary,
	getMyItineraries: getMyItineraries
};