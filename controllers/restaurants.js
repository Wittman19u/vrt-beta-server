const db = require('./db');
function getRestaurants(req, res, next) {
	let sql = '';
	if(req.query.south && req.query.west) {
		let boundsobj = {
			south: req.query.south,
			west: req.query.west,
			north: req.query.north,
			east:  req.query.east
		};
		sql= ` WITH points AS ( SELECT distinct on(cells.geom) cells.geom, cells.row, cells.col, poi.id,  MAX(poi.priority) AS bestpriority FROM  ST_CreateFishnet(4, 4,  ${boundsobj.north}, ${boundsobj.south}, ${boundsobj.east}, ${boundsobj.west}) AS cells INNER JOIN public.poi ON ST_Within(poi.geom, cells.geom)  WHERE (type=3 OR type=2) AND sourcetype LIKE '%schema:Restaurant%' GROUP BY cells.row, cells.col, cells.geom, poi.id ORDER BY cells.geom, cells.row ASC, cells.col ASC,  bestpriority DESC ) SELECT * FROM poi INNER JOIN points ON poi.id=points.id`;
	} else if (req.query.latitude && req.query.longitude) {
		let radius = parseInt(req.query.radius) || 5;
		let latitude = req.query.latitude;
		let longitude = req.query.longitude;
		sql = `SELECT *	FROM poi WHERE ST_DistanceSphere(geom, ST_MakePoint(${longitude},${latitude})) <= ${radius} AND (type=3 OR type=2) AND sourcetype LIKE '%schema:Restaurant%'`;
	}
	if(sql !== '') {
		db.manyOrNone(sql).then(function (restaurants) {
			res.status(200)
				.json({
					status: 'success',
					itemsNumber: restaurants.length,
					data: restaurants,
					message: 'Retrieved resturants in radius'
				});
		}).catch(function (err) {
			console.error(err);
			return next(err);
		});
	} else {
		res.status(200).json({
			status: 'success',
			itemsNumber: 0,
			data: {},
			message: 'Retrieved resturants'
		});
	}

}

function getRestaurantDetails(req, res, next) {
	var poiID = parseInt(req.params.id);
	db.oneOrNone('select * from poi where id = $1', poiID)
		.then(function (restaurant) {
			if (restaurant === null) {
				console.error('restaurant not in DB!');
				res.status(400).json({
					status: 'error',
					message: 'restaurant not in DB!'
				});
			} else {
				res.status(200).json({
					status: 'success',
					data: restaurant,
					message: 'Retrieved ONE restaurant'
				});
			}
		})
		.catch(function (err) {
			return next(err);
		});
}

module.exports={
	getRestaurants: getRestaurants,
	getRestaurantDetails: getRestaurantDetails
};