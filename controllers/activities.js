const db = require('./db');
const moment = require('moment');
const axios = require('axios');
const { Worker } = require('worker_threads')

// async function getViatorData(cities, params) {
//     const ops = [];
//     for (let icity in cities){
//         params['destId'] = parseInt(cities[icity].sourceid);
//         let url =`https://viatorapi.viator.com/service/search/products?apiKey=${process.env.VIATOR_API_KEY}`;
//         let op = axios.post(url, params).then( activities => {
//             // data = Object.assign({}, data, activities);
//             console.log(activities);
//         });
//         ops.push(op);
//     }
//     let res = await axios.all(ops);
//     console.log(res);
//     return res;
// }

function getActivities(req, res, next) {
	let boundsobj = {
		south: req.query.south,
		west: req.query.west,
		north: req.query.north,
		east: req.query.east
	};
	// get list of activity from our db
	let sql = `select * from poi where poi.source = 'Viator' AND st_contains(ST_GeomFromText('POLYGON((${boundsobj.west} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.north}))', 4326), poi.geom)`
	db.manyOrNone(sql).then(function (dataFromDB) {
		if (dataFromDB.length > 4) {
			res.status(200).json({
				status: 'success',
				itemsNumber: dataFromDB.length,
				data: dataFromDB,
				message: 'Retrieved activities in bound from cache.'
			});
		} else {
			// TODO question about geobuffer -> does not exist ???
			let sql = `SELECT * FROM geobuffer where st_contains(ST_GeomFromText('POLYGON((${boundsobj.west} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.north}))', 4326), geom)`;
			db.any(sql).then(function (cities) {
				let startDate = req.query.startdate || moment().format('YYYY-MM-DD');
				let params = {
					'startDate': startDate,
					'endDate': req.query.enddate || moment(startDate).add(1, 'days').format('YYYY-MM-DD'),
					'topX': '1-15',
					'currencyCode': req.query.currency || 'EUR',
					'catId': 0,
					'subCatId': 0,
					'dealsOnly': false
				};
				// http://viatorapi.viator.com/service/search/products  {'startDate':'2019-12-02','endDate':'2020-12-02', 'topX':'1-15','destId':684,'currencyCode':'EUR', 'catId':0, 'subCatId':0, 'dealsOnly':false}
				const worker = new Worker('./controllers/workerViator.js')
				worker.on('online', () => { worker.postMessage([params, cities, dataFromDB]) })
				res.status(200).json({
					status: 'success',
					itemsNumber: dataFromDB.length,
					data: dataFromDB,
					message: 'Retrieved activities in bound from cache.'
				});
			}).catch(error => {
				let message = 'Error retrieved cities from geobuffer!';
				console.error(error);
				res.status(400).json({
					code: error.code,
					status: 'error',
					error: error,
					message: message
				});
			});
		}
	}).catch(error => {
		let message = 'Error retrieved activities from db!';
		console.error(message);
		res.status(400).json({
			code: error.code,
			status: 'error',
			error: error,
			message: message
		});
	});
}

function getActivityDetails(req, res, next) {
	// http://viatorapi.viator.com/service/product?code=5010SYDNEY&currencyCode=EUR&excludeTourGradeAvailability=true&showUnavailable=false&apiKey=9217412952177776889
	let url = `http://viatorapi.viator.com/service/product?code=${req.query.id}&currencyCode=EUR&excludeTourGradeAvailability=true&showUnavailable=false&apiKey=${process.env.VIATOR_API_KEY}`
	axios.get(url).then(activity => {
		res.status(200)
			.json({
				status: 'success',
				activity: activity,
				message: 'Retrieved activity details.'
			});
	}).catch(error => {
		let message = 'Error retrieved activity details!';
		console.log(message);
		res.status(400).json({
			code: error.code,
			status: 'error',
			error: error,
			message: message
		});
	});
}


module.exports = {
	//	getAllPois: getAllPois,
	getActivities: getActivities,
	getActivityDetails: getActivityDetails
	//	createPoi: createPoi,
	//	updatePoi: updatePoi,
	//	removePoi: removePoi
};