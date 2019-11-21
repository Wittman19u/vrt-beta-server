const db = require('./db');
const passport = require('passport');

function getAllItineraries(req, res, next) {
	let limit = 16;
	if (typeof req.query.limit !== 'undefined'){
		limit = req.query.limit;
	}
	let sql= `select * from itinerary limit ${limit}`;
	console.log(sql);
	db.any(sql)
		.then(function (data) {
			res.status(200)
				.json({
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


function getSingleItinerary(req, res, next) {
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
	const userID = passport.authenticate('jwt', { session: false }, function(err, user, info) {
		if (err) { return next(err); }
		if (!user) { return ''; }
		return user.id;
	})(req, res, next);
	console.log("userid:" + userID);
	// passport.authenticate('jwt', { session: false }, (err, user, info) => {
	// 	if (err) {
	// 		console.error(err);
	// 	}
	// 	if (info !== undefined) {
	// 		console.error(info.message);
	// 	} else {
	// 		userID = parseInt(user.id);
	// 	}
	// });

	req.body.show = parseInt(req.body.show);
	let parameters = {
		departure: req.body.departure,
		departurestr: req.body.departurestr,
		departuregeom: new db.STPointClass(req.body.departure.lng,req.body.departure.lat),
		arrival: req.body.arrival,
		arrivalstr: req.body.arrivalstr,
		arrivalgeom: new db.STPointClass(req.body.arrival.lng,req.body.arrival.lat),
		public: 1,
		user_id : userID
	};
	// db.none('insert into itinerary(departure, departuregeom, departurestr, arrival,arrivalgeom, arrivalstr, public, user_id)' +
	// 		'values(${departure}, ${departuregeom}, ${departurestr}, ${arrival}, ${arrivalgeom}, ${arrivalstr}, ${public}, ${user_id})', req.body)
	db.any('INSERT INTO itinerary ($2:name) VALUES($2:csv) RETURNING id;', parameters
	).then((rows) => {
		if(req.body.waypoints){ // insert waypoints in relative table
			wayPoints = req.body.waypoints;
			for(poiId of wayPoints ){
				console.log(poiId);
				let sql = `INSERT INTO waypoint (itineray_id, poi_id) VALUES(${rows[0].id}, ${poiId});`;
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
	getAllItineraries: getAllItineraries,
	getSingleItinerary: getSingleItinerary,
	createItinerary: createItinerary,
	// updateItinerary: updateItinerary,
	removeItinerary: removeItinerary,
	getMyItineraries: getMyItineraries
};