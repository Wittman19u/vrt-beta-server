const db = require('./db');
const moment = require('moment');
const passport = require('passport');
const axios = require('axios');
const qs = require('qs')
// workers
const { Worker } = require('worker_threads')

// function getAllPois(req, res, next) {
// 	let limit = 16;
// 	if (typeof req.query.limit !== 'undefined'){
// 		limit = req.query.limit;
// 	}
// 	let sql= `select * from poi limit ${limit}`;
// 	console.log(sql);
// 	db.any(sql)
// 		.then(function (data) {
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					itemsNumber: data.length,
// 					data: data,
// 					message: 'Retrieved ALL pois'
// 				});
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

// TODO return only cities (see the category or the source ?)
function getCitiesByQuery(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			let query = req.query.query;
			let sql = `SELECT * FROM poi where LOWER(label) like LOWER('%${query}%') and source='sql.sh' ORDER BY label ASC Limit 20`;
			db.any(sql).then(function (data) {
				res.status(200).json({
					status: 'success',
					itemsNumber: data.length,
					data: data,
					message: 'Retrieved cities by query'
				});
			}).catch(function (err) {
				console.error(err);
				return next(err);
			});
		}
	})(req, res, next);
}

function getPoiDetails(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			var poiID = parseInt(req.params.id);
			db.oneOrNone('select * from poi where id = $1', poiID)
				.then(function (data) {
					// TODO Update priority
					//update priority when clicked
					// db.any('UPDATE public.poi SET po_priority = po_priority+50 WHERE po_latitude = $1 and po_longitude = $2;', [lat, lng])
					// .then(function() {
					//   db.any('UPDATE public.poi SET po_priority = (100*(po_priority - min))/(max-min) FROM (SELECT MAX(po_priority) as max, MIN(po_priority) as min FROM public.poi) as extremum WHERE extremum.min != 0 OR extremum.max != 100; ')
					//   .catch(function(error){throw error});
					// })
					res.status(200).json({
						status: 'success',
						data: data,
						message: 'Retrieved ONE poi'
					});
				})
				.catch(function (err) {
					return next(err);
				});
		}
	})(req, res, next);

}

function getPois(req, res, next) {
	let boundsobj = {
		south: req.query.south,
		west: req.query.west,
		north: req.query.north,
		east: req.query.east
	};
	let startDate = moment().format('YYYY-MM-DD');
	if (typeof req.query.datetime !== 'undefined') {
		startDate = req.query.datetime;
	}

	// let typecond = ` (type=3 OR (type=2 AND sourcetype NOT LIKE ALL(ARRAY['%schema:Hotel%','%schema:Restaurant%','%schema:LodgingBusiness%', '%schema:TouristInformationCenter%']) ) OR ( (type=1 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
	let typecond = ` (type=3 OR (type=2 AND sourcetype LIKE '%CulturalSite%' ) OR ( (type=1 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
	switch (req.query.type) {
		case "act":
			typecond = ` (type=1 AND start::timestamp::date > '${startDate}'::timestamp::date) OR type=3`;
			break;
		case "poi":
			typecond = ` sourcetype NOT LIKE ALL(ARRAY['%schema:Hotel%','%schema:Restaurant%','%schema:LodgingBusiness%', '%schema:TouristInformationCenter%']) AND (type=2 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
			break;
	}
	// let sql= ` WITH points AS ( SELECT distinct on(cells.geom) cells.geom, cells.row, cells.col, poi.id,  MAX(poi.priority) AS bestpriority FROM  ST_CreateFishnet(4, 4,  ${boundsobj.north}, ${boundsobj.south}, ${boundsobj.east}, ${boundsobj.west}) AS cells INNER JOIN public.poi ON ST_Within(poi.geom, cells.geom) WHERE poi.source='Datatourisme' AND ${typecond} GROUP BY cells.row, cells.col, cells.geom, poi.id ORDER BY cells.geom, cells.row ASC, cells.col ASC,  bestpriority DESC ) SELECT * FROM poi INNER JOIN points ON poi.id=points.id`;
	let sql = `SELECT * FROM poi where st_contains(ST_GeomFromText('POLYGON((${boundsobj.west} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.north}))', 4326), geom) AND poi.source='Datatourisme' AND ${typecond} ORDER BY priority DESC`;
	db.any(sql).then(function (data) {
		// TODO UPdate priority
		//update priority when view
		// db.any('UPDATE public.poi SET po_priority = po_priority+10 WHERE St_Within(po_geom,ST_GeomFromText(\'' + polygon+ '\',4326));')
		// .then(function() {
		//   db.any('UPDATE public.poi SET po_priority = (100*(po_priority - min))/(max-min) FROM (SELECT MAX(po_priority) as max, MIN(po_priority) as min FROM public.poi) as extremum WHERE extremum.min != 0 OR extremum.max != 100; ')
		//   .catch(function(error){throw error});
		// })
		res.status(200)
			.json({
				status: 'success',
				itemsNumber: data.length,
				data: data,
				message: 'Retrieved pois in bound'
			});
	}).catch(function (err) {
		console.error(err);
		return next(err);
	});
}

// TODO check limit/offset?
function getPoisByRadius(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			let query = req.query.query
			let radius = parseInt(req.query.radius) || 5;
			let latitude = req.query.latitude;
			let longitude = req.query.longitude;
			let startDate = moment().format('YYYY-MM-DD');
			if (typeof req.query.datetime !== 'undefined') {
				startDate = req.query.datetime;
			}

			let typecond = ` (type=3 OR (type=2 AND sourcetype LIKE '%CulturalSite%' ) OR ( (type=1 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
			switch (req.query.type) {
				case "act":
					typecond = ` (type=1 AND start::timestamp::date > '${startDate}'::timestamp::date) OR type=3`;
					break;
				case "poi":
					typecond = ` sourcetype NOT LIKE ALL(ARRAY['%schema:Hotel%','%schema:Restaurant%','%schema:LodgingBusiness%', '%schema:TouristInformationCenter%']) AND (type=2 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
					break;
			}

			let sql = `SELECT * FROM poi where ST_DistanceSphere(geom, ST_MakePoint(${longitude},${latitude})) <= ${radius} * 1000 AND (poi.source='Datatourisme' OR poi.source='cirkwi') AND ${typecond} `
			if (query !== undefined) {
				// we use lower to make it case insensitive
				sql += `AND LOWER(label) like LOWER('%${query}%') `
			}
			sql += `ORDER BY priority DESC`;
			db.any(sql).then(function (data) {
				// TODO only check cirkwi if data.length too low
				// launching worker on separated threads to do inserts from cirkwi
				const worker = new Worker('./controllers/workerCirkwi.js')
				worker.on('online', () => { worker.postMessage([req.query.latitude, req.query.longitude, req.query.radius, data]) })
				// get data from db
				let sqlCirkwi = `SELECT * FROM poi where ST_DistanceSphere(geom, ST_MakePoint(${longitude},${latitude})) <= ${radius} * 1000 AND poi.source='Cirkwi' AND ${typecond} `
				if (query !== undefined) {
					// we use lower to make it case insensitive
					sqlCirkwi += ` AND LOWER(label) like LOWER('%${query}%') `
				}
				sqlCirkwi += `ORDER BY priority DESC`;
				db.any(sqlCirkwi).then(function (selectCirkwiData) {
					res.status(200)
						.json({
							status: 'success',
							itemsNumber: data.length + selectCirkwiData.length,
							data: data.concat(selectCirkwiData),
							message: 'Retrieved pois in radius'
						});
				}).catch(function (err) {
					res.status(500).json({
						status: 'Error',
						error: `Error in select pois cirkwi : ${err}`
					});
				});
			}).catch(function (err) {
				console.error(err);
				return next(err);
			});
		}
	})(req, res, next);
}

function createPoi(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			let data = req.body;
			data.type = parseInt(req.body.type);
			data.latitude = parseFloat(req.body.latitude).toFixed(5);
			data.longitude = parseFloat(req.body.longitude).toFixed(5);
			data.point = `POINT(${data.longitude} ${data.latitude})`;
			data.source = 'Community';
			data.manuallyupdate = true;
			let sql = 'INSERT INTO poi (source, sourceid, sourcetype, label, sourcetheme, start, "end", street, zipcode, city, country, latitude, longitude, email, web, phone, linkimg, description, type, opening, geom, active, duration, rating, price, ocean, pricerange, handicap, social, hashtag, manuallyupdate) VALUES( ${source}, ${sourceid}, ${sourcetype}, ${label}, ${sourcetheme}, ${start}, ${end}, ${street}, ${zipcode}, ${city}, ${country}, ${latitude}, ${longitude}, ${email}, ${web}, ${phone},  ${linkimg}, ${description}, ${type}, ${opening}, ST_GeomFromText(${point},4326), false, ${duration}, ${rating}, ${price}, ${ocean}, ${pricerange}, ${handicap}, ${social}, ${hashtag}, ${manuallyupdate} ) RETURNING id;'

			db.any(sql, data).then(function (rows) {
				res.status(200).json({
					status: 'success',
					message: 'Inserted one poi',
					id: rows[0]['id']
				});
			}).catch(function (err) {
				return next(err);
			});
		}
	})(req, res, next);

}

function updatePoi(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || user.role_id != 1 || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			let data = req.body;
			// data.social = {
			// 	facebook: req.body.social.facebook
			// };
			// data.opening = {
			// 	sunday: [ req.body.sunday[0], req.body.sunday[1], req.body.sunday[2], req.body.sunday[3]],
			// 	monday: [ req.body.monday[0], req.body.monday[1], req.body.monday[2], req.body.monday[3]],
			// 	tuesday: [ req.body.tuesday[0], req.body.tuesday[1], req.body.tuesday[2], req.body.tuesday[3]],
			// 	wednesday: [ req.body.wednesday[0], req.body.wednesday[1], req.body.wednesday[2], req.body.wednesday[3] ],
			// 	thursday: [ req.body.thursday[0], req.body.thursday[1], req.body.thursday[2], req.body.thursday[3] ],
			// 	friday: [ req.body.friday[0], req.body.friday[1] , req.body.friday[2], req.body.friday[3] ],
			// 	saturday: [ req.body.saturday[0], req.body.saturday[1], req.body.saturday[2], req.body.saturday[3] ]
			// }
			data.parId = parseInt(req.params.id);
			data.type = parseInt(req.body.type);
			data.latitude = parseFloat(req.body.latitude).toFixed(5);
			data.longitude = parseFloat(req.body.longitude).toFixed(5);
			data.point = `POINT(${data.longitude} ${data.latitude})`;
			data.manuallyupdate = true;
			let sql = 'update poi set sourceid = ${sourceid}, sourcetype = ${sourcetype}, label = ${label}, sourcetheme = ${sourcetheme}, start = ${start}, "end" = ${end}, street = ${street}, zipcode = ${zipcode}, city =  ${city}, country = ${country}, latitude = ${latitude}, longitude = ${longitude}, email = ${email}, web = ${web}, phone = ${phone}, linkimg =  ${linkimg}, description = ${description}, type = ${type}, opening = ${opening}, geom = ST_GeomFromText(${point},4326), updated_at = NOW(), active = ${active}, duration = ${duration}, rating = ${rating}, price = ${price}, ocean = ${ocean}, pricerange = ${pricerange}, handicap = ${handicap}, social = ${social}, manuallyupdate = ${manuallyupdate} where id=${parId}';
			db.none(sql, data).then(function () {
				res.status(200)
					.json({
						status: 'success',
						message: 'Updated poi'
					});
			}).catch(function (err) {
				return next(err);
			});
		}
	})(req, res, next);
}

// function removePoi(req, res, next) {
// 	var id = parseInt(req.params.id);
// 	db.result('delete from poi where id = $1', id)
// 		.then(function (result) {
// 			/* jshint ignore:start */
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					message: `Removed ${result.rowCount} poi`
// 				});
// 			/* jshint ignore:end */
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

module.exports = {
	//	getAllPois: getAllPois,
	getPois: getPois,
	getCitiesByQuery: getCitiesByQuery,
	getPoisByRadius: getPoisByRadius,
	getPoiDetails: getPoiDetails,
	createPoi: createPoi,
	updatePoi: updatePoi
	//	removePoi: removePoi
};