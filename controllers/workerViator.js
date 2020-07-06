const db = require('./db');
const axios = require('axios');
const { parentPort } = require('worker_threads')

parentPort.onmessage = function (e) {
	getPoisViator(e.data[0], e.data[1], e.data[2]).then(function (response) {
		console.log(response)
	})
};

// updates the pois table in the provided 'cities' argument by requesting the viator api
function getPoisViator(params, cities, dataFromDB) {
	return new Promise((resolve, reject) => {
		let url = `https://viatorapi.viator.com/service/search/products?apiKey=${process.env.VIATOR_API_KEY}`;
		let ops = [];
		for (let i = 0; (i < cities.length) && (i < 24); i++) {
			params['destId'] = parseInt(cities[i].sourceid);
			let op = axios.post(url, params);
			ops.push(op);
		}
		Promise.all(ops).then(activitiesLists => {
			let resultList = [];
			if (activitiesLists.length > 0) {
				let calls = [];
				let activities = [];
				for (let i = 0; i < activitiesLists.length; i++) {
					if (activitiesLists[i].data.data.length > 0) {
						var resultActList = activitiesLists[i].data.data.map(function (el) {
							var o = Object.assign({}, el);
							o.latitude = cities[i].latitude;
							o.longitude = cities[i].longitude;
							return o;
						});
						activities = activities.concat(resultActList);
					}
				}
				let arrayFiltered = activities.filter((element, index, array) => array.findIndex(item => (item.code === element.code)) === index)
				for (let activity of arrayFiltered) {
					let act = {
						// fieldId: activity.code,
						name: activity.shortTitle,
						longitude: activity.longitude,
						latitude: activity.latitude,
						street: '',
						zipcode: '',
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
					let index = dataFromDB.find((item) => {
						if (item.source === 'Viator' && item.sourceid === activity.code) {
							return true;
						}
						return false;
					});
					let opt;
					if (index === undefined) {
						let sql = 'INSERT INTO poi (source, sourceid, sourcetype, label, sourcetheme, city, latitude, longitude, web, linkimg, description, type, duration,rating, price, geom) VALUES( $1, $2, $3 , $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, ST_GeomFromText($16,4326)) RETURNING id;';
						let values = ['Viator', activity.code, sourceType, act.name, 'Activity', act.city, act.latitude, act.longitude, act.link, act.image, act.description, 4, duration, act.rating, act.price, point];
						opt = db.any(sql, values);

					} else {
						// TODO check geom problem ?
						opt = db.any('update poi set sourcetype=$1, label=$2, city=$3, latitude=$4, longitude=$5, web=$6, linkimg=$7, description=$8, type=$9, duration=$10,rating=$11, price=$12, geom=ST_GeomFromText($13,4326) WHERE source=$14 AND sourceid = $15 RETURNING id', [sourceType, act.name, act.city, act.latitude, act.longitude, act.link, act.image, act.description, 4, duration, act.rating, act.price, point, 'Viator', activity.code]);
					}
					calls.push(opt);
				}
				Promise.all(calls).then((ids) => {
					for (let i = 0; i < ids.length; i++) {
						resultList[i].id = ids[i][0].id;
					}
					resolve(resultList)
				}).catch(error => {
					reject(error)
				});
			} else {
				resolve(resultList)
			}
		}).catch(error => {
			reject(error)
		});
	}).catch(function (err) {
		console.error(err);
	});
}
