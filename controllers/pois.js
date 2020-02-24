const db = require('./db');
const moment = require('moment');
const passport = require('passport');


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


function getPoisByQuery(req, res, next) {
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || user.role_id != 1 || error || info !== undefined) {
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
			let query = req.query.query;
			// let sql= ` WITH points AS ( SELECT distinct on(cells.geom) cells.geom, cells.row, cells.col, poi.id,  MAX(poi.priority) AS bestpriority FROM  ST_CreateFishnet(4, 4,  ${boundsobj.north}, ${boundsobj.south}, ${boundsobj.east}, ${boundsobj.west}) AS cells INNER JOIN public.poi ON ST_Within(poi.geom, cells.geom) WHERE poi.source='Datatourisme' AND ${typecond} GROUP BY cells.row, cells.col, cells.geom, poi.id ORDER BY cells.geom, cells.row ASC, cells.col ASC,  bestpriority DESC ) SELECT * FROM poi INNER JOIN points ON poi.id=points.id`;
			let sql= `SELECT * FROM poi where label like '%${query}%' ORDER BY label ASC Limit 20`;
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
	})(req, res, next);
}

function getPoiDetails(req, res, next) {
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
			res.status(200)
				.json({
					status: 'success',
					data: data,
					message: 'Retrieved ONE poi'
				});
		})
		.catch(function (err) {
			return next(err);
		});
}

function getPois(req, res, next) {
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
			res.status(200)
				.json({
					status: 'success',
					data: data,
					message: 'Retrieved ONE poi'
				});
		})
		.catch(function (err) {
			return next(err);
		});
}

function createPoi(req, res, next) {
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
			let data = req.body;
			data.type = parseInt(req.body.type);
			data.latitude = parseFloat(req.body.latitude).toFixed(5);
			data.longitude = parseFloat(req.body.longitude).toFixed(5);
			data.point = `POINT(${data.longitude} ${data.latitude})`;
			data.source = 'Community';
			let sql = 'INSERT INTO poi (source, sourceid, sourcetype, label, sourcetheme, start, "end", street, zipcode, city, country, latitude, longitude, email, web, phone, linkimg, description, type, opening, geom) VALUES( ${source}, ${sourceid}, ${sourcetype}, ${label}, ${sourcetheme}, ${start}, ${end}, ${street}, ${zipcode}, ${city}, ${country}, ${latitude}, ${longitude}, ${email}, ${web}, ${phone},  ${linkimg}, ${description}, ${type}, ${opening}, ST_GeomFromText(${point},4326) ) RETURNING id;'

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
	let data = req.body;
	data.parId = parseInt(req.params.id);
	data.type = parseInt(req.body.type);
	data.latitude = parseFloat(req.body.latitude).toFixed(5);
	data.longitude = parseFloat(req.body.longitude).toFixed(5);
	data.point = `POINT(${data.longitude} ${data.latitude})`;
	let sql = 'update poi set sourceid = ${sourceid}, sourcetype = ${sourcetype}, label = ${label}, sourcetheme = ${sourcetheme}, start = ${start}, "end" = ${end}, street = ${street}, zipcode = ${zipcode}, city =  ${city}, country = ${country}, latitude = ${latitude}, longitude = ${longitude}, email = ${email}, web = ${web}, phone = ${phone}, linkimg =  ${linkimg}, description = ${description}, type = ${type}, opening = ${opening}, geom =  ST_GeomFromText(${point},4326) where id=${parId}';
	db.none(sql, data)
		.then(function () {
			res.status(200)
				.json({
					status: 'success',
					message: 'Updated poi'
				});
		})
		.catch(function (err) {
			return next(err);
		});
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
	getPoisByQuery: getPoisByQuery,
	getPoiDetails: getPoiDetails,
	createPoi: createPoi,
	updatePoi: updatePoi,
//	removePoi: removePoi
};