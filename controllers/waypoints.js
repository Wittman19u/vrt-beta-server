const db = require('./db');


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

function getWaypointsByItinerary(req, res, next) {
	if (typeof req.query.itinerary !== 'undefined'){
		const itinerary = req.query.itinerary;

		let sql= `select * from waypoint where itinerary_id = ${itinerary}`;
		console.log(sql);
		db.any(sql)
			.then(function (data) {
				res.status(200)
					.json({
						status: 'success',
						itemsNumber: data.length,
						data: data,
						message: `Retrieved ALL waypoints for itnerary ${itinerary}`
					});
			})
			.catch(function (err) {
				return next(err);
			});
	}
}

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

// function createWaypoint(req, res, next) {
// 	req.body.itinerary_id = parseInt(req.body.itinerary_id);
// 	req.body.poi_id = parseInt(req.body.poi_id);
// 	db.none('insert into waypoint(itinerary_id,poi_id)' +
// 			'values(${itinerary_id}, ${poi_id})', req.body)
// 		.then(function () {
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					message: 'Inserted one waypoint'
// 				});
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

// function updateWaypoint(req, res, next) {
// 	db.none('update waypoint set itinerary_id=$1, poi_id=$2 where id=$5',
// 		[parseInt(req.body.itinerary_id), parseInt(req.body.poi_id), parseInt(req.params.id)])
// 		.then(function () {
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					message: 'Updated waypoint'
// 				});
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

// function removeWaypoint(req, res, next) {
// 	var id = parseInt(req.params.id);
// 	db.result('delete from waypoint where id = $1', id)
// 		.then(function (result) {
// 			/* jshint ignore:start */
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					message: `Removed ${result.rowCount} waypoint`
// 				});
// 			/* jshint ignore:end */
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }


module.exports = {
	getWaypointsByItinerary: getWaypointsByItinerary,
	//getAllWaypoints: getAllWaypoints,
	// getSingleWaypoint: getSingleWaypoint,
	// createWaypoint: createWaypoint,
	// updateWaypoint: updateWaypoint,
	// removeWaypoint: removeWaypoint
};