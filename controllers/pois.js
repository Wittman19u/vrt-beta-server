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
			let sql = `SELECT * FROM poi where LOWER(label) like LOWER('${query}%') and source='sql.sh' ORDER BY label ASC LIMIT 20`;
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
					//update priority when clicked
					// commented because we do it on createVisit/removeVisit
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
			console.log('Calling getPois !')
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
			// TODO adapt this (remove LIKE '%' ...)
			// let typecond = ` (type=5 OR type=3 OR (type=2) OR ( (type=1 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
			// switch (req.query.type) {
			// 	case "act":
			// 		typecond = ` (type=1 AND start::timestamp::date > '${startDate}'::timestamp::date) OR type=3`;
			// 		break;
			// 	case "poi":
			// 		typecond = ` sourcetype NOT LIKE ALL(ARRAY['%schema:Hotel%','%schema:Restaurant%','%schema:LodgingBusiness%', '%schema:TouristInformationCenter%']) AND (type=2 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
			// 		break;
			// }
			// TODO check limit (for example 200)
			let sql = `SELECT poi.*, poi_category.poi_id, poi_category.category_id AS poi_category_category_id FROM poi LEFT JOIN poi_category ON poi.id = poi_category.poi_id where st_contains(ST_GeomFromText('POLYGON((${boundsobj.west} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.north}))', 4326), geom) ORDER BY priority DESC LIMIT 200`;
			db.any(sql).then(function (data) {
				// call cirkwi worker
				const workerCirkwi = new Worker('./controllers/workerCirkwi.js')
				let params = {
					bounds: `[${boundsobj.south},${boundsobj.west},${boundsobj.north},${boundsobj.east}]`
				}
				let sqlCirkwi = `SELECT poi.*, poi_category.poi_id, poi_category.category_id AS poi_category_category_id FROM poi LEFT JOIN poi_category ON poi.id = poi_category.poi_id where st_contains(ST_GeomFromText('POLYGON((${boundsobj.west} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.north}))', 4326), geom) AND source = 'cirkwi'`;
				const workerAmadeus = new Worker('./controllers/workerAmadeus.js')
				let paramsAmadeus = {
					bounds: boundsobj,
					radiusUnit: 'KM'
				}
				let sqlAmadeus = `SELECT poi.*, poi_category.poi_id, poi_category.category_id AS poi_category_category_id FROM poi LEFT JOIN poi_category ON poi.id = poi_category.poi_id where st_contains(ST_GeomFromText('POLYGON((${boundsobj.west} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.north}))', 4326), geom) AND source = 'Amadeus'`;
				workerCirkwi.on('online', () => { workerCirkwi.postMessage([params, sqlCirkwi]) })
				workerAmadeus.on('online', () => { workerAmadeus.postMessage([paramsAmadeus, sqlAmadeus]) })
				// get the categories of each poi
				var poisId = []
				var poisToReturn = []
				data.forEach(poi => {
					if (!poisId.includes(poi.id)) {
						poi.categories = []
						poisToReturn.push(poi)
						poisId.push(poi.id)
					}
					poisToReturn[poisToReturn.length - 1].categories.push(poi.poi_category_category_id)
				})
				res.status(200).json({
					status: 'success',
					itemsNumber: poisToReturn.length,
					data: poisToReturn,
					message: 'Retrieved pois in bound'
				});
			}).catch(function (err) {
				console.error(err);
				return next(err);
			});
		}
	})(req, res, next);
}

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
			console.log('Calling getPoisByRadius !')
			let query = req.query.query
			let radius = parseInt(req.query.radius) || 5;
			let latitude = req.query.latitude;
			let longitude = req.query.longitude;
			let startDate = moment().format('YYYY-MM-DD');
			if (typeof req.query.datetime !== 'undefined') {
				startDate = req.query.datetime;
			}
			// TODO adapt this
			let typecond = ` (type=5 OR type=3 OR type=2 OR ( (type=1 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
			switch (req.query.type) {
				case "act":
					typecond = ` (type=1 AND start::timestamp::date > '${startDate}'::timestamp::date) OR type=3`;
					break;
				case "poi":
					typecond = ` sourcetype NOT LIKE ALL(ARRAY['%schema:Hotel%','%schema:Restaurant%','%schema:LodgingBusiness%', '%schema:TouristInformationCenter%']) AND (type=2 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
					break;
			}

			let sql = `SELECT poi.*, poi_category.poi_id, poi_category.category_id AS poi_category_category_id FROM poi LEFT JOIN poi_category ON poi.id = poi_category.poi_id where ST_DistanceSphere(geom, ST_MakePoint(${longitude},${latitude})) <= ${radius} * 1000 AND ${typecond} `
			if (query !== undefined) {
				// we use lower to make it case insensitive
				sql += `AND LOWER(label) like LOWER('%${query}%') `
			}
			sql += `ORDER BY priority DESC`;
			db.any(sql).then(function (data) {
				// launching worker on separated threads to do inserts from cirkwi
				const workerCirkwi = new Worker('./controllers/workerCirkwi.js')
				let params = {
					lat: latitude,
					lng: longitude,
					radius: radius
				}
				let sqlCirkwi  = `SELECT poi.*, poi_category.poi_id, poi_category.category_id AS poi_category_category_id FROM poi LEFT JOIN poi_category ON poi.id = poi_category.poi_id where ST_DistanceSphere(geom, ST_MakePoint(${longitude},${latitude})) <= ${radius} * 1000 AND source = 'cirkwi'`
				const workerAmadeus = new Worker('./controllers/workerAmadeus.js')
				let paramsAmadeus = {
					latitude: latitude,
					longitude: longitude,
					radius: radius,
					radiusUnit: 'KM'
				}
				let sqlAmadeus  = `SELECT poi.*, poi_category.poi_id, poi_category.category_id AS poi_category_category_id FROM poi LEFT JOIN poi_category ON poi.id = poi_category.poi_id where ST_DistanceSphere(geom, ST_MakePoint(${longitude},${latitude})) <= ${radius} * 1000 AND source = 'cirkwi'`
				workerCirkwi.on('online', () => { workerCirkwi.postMessage([params, sqlCirkwi]) })
				workerAmadeus.on('online', () => { workerAmadeus.postMessage([paramsAmadeus, sqlAmadeus]) })
				// get data from db
				// get the categories of each poi
				var poisId = []
				var poisToReturn = []
				data.forEach(poi => {
					if (!poisId.includes(poi.id)) {
						poi.categories = []
						poisToReturn.push(poi)
						poisId.push(poi.id)
					}
					poisToReturn[poisToReturn.length - 1].categories.push(poi.poi_category_category_id)
				})
				res.status(200).json({
					status: 'success',
					itemsNumber: poisToReturn.length,
					data: poisToReturn,
					message: 'Retrieved pois in radius'
				});
			}).catch(function (err) {
				res.status(500).json({
					status: 'Error',
					error: `Error in select pois cirkwi : ${err}`
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