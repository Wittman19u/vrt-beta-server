const db = require('./db');
const moment = require('moment');
const axios = require('axios');

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

function getActivities(req, res, next){
	let boundsobj = {
		south: req.query.south,
		west: req.query.west,
		north: req.query.north,
		east:  req.query.east
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
			let sql = `SELECT * FROM geobuffer where st_contains(ST_GeomFromText('POLYGON((${boundsobj.west} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.north}, ${boundsobj.east} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.south}, ${boundsobj.west} ${boundsobj.north}))', 4326), geom)`;
			db.any(sql).then(function (cities) {
				// http://viatorapi.viator.com/service/search/products  {'startDate':'2019-12-02','endDate':'2020-12-02', 'topX':'1-15','destId':684,'currencyCode':'EUR', 'catId':0, 'subCatId':0, 'dealsOnly':false}
				let startDate = req.query.startdate || moment().format('YYYY-MM-DD');
				let params = {
					'startDate':  startDate,
					'endDate': req.query.enddate || moment(startDate).add(1,'days').format('YYYY-MM-DD'),
					'topX':'1-15',
					'currencyCode': req.query.currency || 'EUR',
					'catId':0,
					'subCatId':0,
					'dealsOnly':false
				};
				let url =`https://viatorapi.viator.com/service/search/products?apiKey=${process.env.VIATOR_API_KEY}`;
				let ops = [];
				for(let i=0; (i < cities.length) && (i < 24); i++){
					params['destId'] = parseInt(cities[i].sourceid);
					let op = axios.post(url, params);
					ops.push(op);
				}
				Promise.all(ops).then( activitiesLists => {
					let resultList = [];
					if(activitiesLists.length > 0){
						let activities = [];
						for (let i = 0; i < activitiesLists.length; i++){
							if(activitiesLists[i].data.data.length > 0){
								var resultActList = activitiesLists[i].data.data.map(function(el) {
									var o = Object.assign({}, el);
									o.latitude = cities[i].latitude;
									o.longitude = cities[i].longitude;
									return o;
								});
								activities = activities.concat(resultActList);
							}
						}
						let arrayFiltered = activities.filter((element,index,array)=>array.findIndex(item=>(item.code === element.code))===index)
						for (let activity of arrayFiltered){
							let act = {
								fieldId: activity.code,
								name: activity.shortTitle,
								longitude: activity.longitude,
								latitude: activity.latitude,
								address: '',
								zipCode: '',
								city: activity.primaryDestinationName || '',
								description: activity.shortDescription || '',
								image: activity.thumbnailURL || '',
								link: activity.webURL || '',
								phone: '',
								email: '',
								price: activity.price || '',
								duration: activity.duration || '',
								rating: activity.rating
							};
							resultList.push(act);
							// CREATE ACTIVITIES in OUR DB
							let point = `POINT(${act.longitude} ${act.latitude})`;
							let pos = activity.duration.indexOf('hours');
							let duration = 0;
							if (pos !== -1) {
								duration = moment.duration(parseInt(activity.duration.substring(0, pos - 1)), 'hours').asMinutes();
							} else {
								pos = activity.duration.indexOf('minutes');
								if (pos !== -1) {
									duration = parseInt(activity.duration.substring(0, pos - 1));
								}
							}
							let sourceType = `catIds:[${activity.catIds.join(',')}] subCatIds: [${activity.subCatIds.join(',')}]`;
							let index = dataFromDB.find( (item) => {
								if(item.source === 'Viator' && item.sourceid === activity.code) {
									return true;
								}
								return false;
							});

							if (index === undefined) {
								let sql = 'INSERT INTO poi (source, sourceid, sourcetype, label, sourcetheme, city, latitude, longitude, web, linkimg, description, type, duration,rating, price, geom) VALUES( $1, $2, $3 , $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, ST_GeomFromText($16,4326)) RETURNING id;';
								let values= ['Viator', activity.code, sourceType , act.name, 'Activity', act.city, act.latitude, act.longitude, act.link, act.image, act.description, 4, duration, act.rating, act.price, point];
								db.any(sql, values).then(function (rows) {
									console.log({
										status: 'success',
										message: 'Inserted one act',
										id: rows[0]['id']
									});
								}).catch( error => {
									let message = 'Error insert activity in db!';
									console.error(message);
									res.status(400).json({
										code: error.code,
										status: 'error',
										error: error,
										message: message
									});
								});
							} else {
								db.none('update poi set sourcetype=$1, label=$2, city=$3, latitude=$4, longitude=$5, web=$6, linkimg=$7, description=$8, type=$9, duration=$10,rating=$11, price=$12, geom=ST_GeomFromText($13,4326) WHERE source=$14 AND sourceid = $15', [sourceType, act.name, act.city, act.latitude, act.longitude, act.link, act.image, act.description, 4, duration, act.rating, act.price, point, 'Viator', activity.code]).then( () => {
									console.log({
										status: 'success',
										message: 'Updated one act',
										id: activity.code
									});
								}).catch( error => {
									let message = 'Error update activity in db!';
									console.error(message);
									res.status(400).json({
										code: error.code,
										status: 'error',
										error: error,
										message: message
									});
								});
							}
						}
					}
					return resultList;
				}).then((activities) => {
					res.status(200).json({
						status: 'success',
						itemsNumber: activities.length,
						data: activities,
						message: 'Retrieved activities in bound.'
					});
				}).catch( error => {
					let message = 'Error retrieved activities from Viator!';
					console.error(message);
					res.status(400).json({
						code: error.code,
						status: 'error',
						error: error,
						message: message
					});
				});

			}).catch( error => {
				let message = 'Error retrieved cities from geobuffer!';
				console.error(message);
				res.status(400).json({
					code: error.code,
					status: 'error',
					error: error,
					message: message
				});
			});
		}
	}).catch( error => {
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

function getActivityDetails(req, res, next){
	// http://viatorapi.viator.com/service/product?code=5010SYDNEY&currencyCode=EUR&excludeTourGradeAvailability=true&showUnavailable=false&apiKey=9217412952177776889
	let url = `http://viatorapi.viator.com/service/product?code=${req.query.id}&currencyCode=EUR&excludeTourGradeAvailability=true&showUnavailable=false&apiKey=${process.env.VIATOR_API_KEY}`
	axios.get(url).then( activity => {
		res.status(200)
			.json({
				status: 'success',
				activity: activity,
				message: 'Retrieved activity details.'
			});
	}).catch( error => {
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