const db = require('./db');



function getRestaurants(req, res, next) {
	let boundsobj = {
		south: req.query.south,
		west: req.query.west,
		north: req.query.north,
		east:  req.query.east
	};

	let typecond = ' (type=3 OR type=2) AND sourcetype LIKE "%schema:Restaurant%" ';

	let sql= ` WITH points AS ( SELECT distinct on(cells.geom) cells.geom, cells.row, cells.col, poi.id,  MAX(poi.priority) AS bestpriority FROM  ST_CreateFishnet(4, 4,  ${boundsobj.north}, ${boundsobj.south}, ${boundsobj.east}, ${boundsobj.west}) AS cells INNER JOIN public.poi ON ST_Within(poi.geom, cells.geom) GROUP BY cells.row, cells.col, cells.geom, poi.id ORDER BY cells.geom, cells.row ASC, cells.col ASC,  bestpriority DESC ) SELECT * FROM poi INNER JOIN points ON poi.id=points.id WHERE ${typecond}`;
	db.any(sql)
		.then(function (data) {
			res.status(200)
				.json({
					status: 'success',
					itemsNumber: data.length,
					data: data,
					message: 'Retrieved resturants in bound'
				});
		})
		.catch(function (err) {
			console.error(err);
			return next(err);
		});
}

function getRestaurantDetails(req, res, next) {
	var poiID = parseInt(req.params.id);
	db.one('select * from poi where id = $1', poiID)
		.then(function (data) {
			res.status(200)
				.json({
					status: 'success',
					data: data,
					message: 'Retrieved ONE restaurants'
				});
		})
		.catch(function (err) {
			return next(err);
		});
}

module.export={
	getRestaurants: getRestaurants,
	getRestaurantDetails: getRestaurantDetails
}