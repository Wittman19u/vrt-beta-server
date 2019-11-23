const db = require('./db');
const moment = require('moment');


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

function getInBoundPois(req, res, next) {
	let boundsobj = {
		south: req.query.south,
		west: req.query.west,
		north: req.query.north,
		east:  req.query.east
	};
	let startDate = moment().format('YYYY-MM-DD')
	if( typeof req.query.datetime !== 'undefined'){
		startDate = req.query.datetime;
	}

	let typecond = ` (type=3 OR (type=2 AND sourcetype NOT LIKE ALL(ARRAY['%schema:Hotel%','%schema:Restaurant%']) ) OR ( (type=1 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
	switch (req.query.type){
	case "act":
		typecond = ` (type=1 AND start::timestamp::date > '${startDate}'::timestamp::date) OR type=3`;
		break;
	case "poi":
		typecond = ` sourcetype NOT LIKE ALL(ARRAY['%schema:Hotel%','%schema:Restaurant%']) AND (type=2 AND ((start::timestamp::date > '${startDate}'::timestamp::date) OR start IS NULL))))`;
		break;
	}
	let sql= ` WITH points AS ( SELECT distinct on(cells.geom) cells.geom, cells.row, cells.col, poi.id,  MAX(poi.priority) AS bestpriority FROM  ST_CreateFishnet(4, 4,  ${boundsobj.north}, ${boundsobj.south}, ${boundsobj.east}, ${boundsobj.west}) AS cells INNER JOIN public.poi ON ST_Within(poi.geom, cells.geom) GROUP BY cells.row, cells.col, cells.geom, poi.id ORDER BY cells.geom, cells.row ASC, cells.col ASC,  bestpriority DESC ) SELECT * FROM poi INNER JOIN points ON poi.id=points.id WHERE ${typecond}`;
	db.any(sql)
	.then(function (data) {
		res.status(200)
			.json({
				status: 'success',
				itemsNumber: data.length,
				data: data,
				message: 'Retrieved pois in bound'
			});
	})
	.catch(function (err) {
		console.error(err);
		return next(err);
	});
}

function getSinglePoi(req, res, next) {
	var poiID = parseInt(req.params.id);
	db.one('select * from poi where id = $1', poiID)
		.then(function (data) {
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

// function createPoi(req, res, next) {
// 	req.body.age = parseInt(req.body.age);
// 	db.none('insert into poi(name, breed, age, sex)' +
// 			'values(${name}, ${breed}, ${age}, ${sex})', req.body)
// 		.then(function () {
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					message: 'Inserted one poi'
// 				});
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

// function updatePoi(req, res, next) {
// 	db.none('update poi set name=$1, breed=$2, age=$3, sex=$4 where id=$5',
// 		[req.body.name, req.body.breed, parseInt(req.body.age),
// 			req.body.sex, parseInt(req.params.id)])
// 		.then(function () {
// 			res.status(200)
// 				.json({
// 					status: 'success',
// 					message: 'Updated poi'
// 				});
// 		})
// 		.catch(function (err) {
// 			return next(err);
// 		});
// }

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
	getInBoundPois: getInBoundPois,
	getSinglePoi: getSinglePoi
//	createPoi: createPoi,
//	updatePoi: updatePoi,
//	removePoi: removePoi
};