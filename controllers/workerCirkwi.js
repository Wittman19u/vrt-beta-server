const db = require('./db');
const axios = require('axios');
const qs = require('qs')
const { parentPort } = require('worker_threads')

parentPort.onmessage = function (e) {
	// the passed-in data is available via e.data
	getPoisCirkwi(e.data[0], e.data[1])
};

function getPoisCirkwi(params, dataFromDB) {
	return new Promise((resolve, reject) => {
		console.log('Calling workerCirkwi !')
		axios({
			method: 'post',
			url: `${process.env.CIRKWI_URL}/oauth/v2/token`,
			data: qs.stringify({
				client_id: process.env.CIRKWI_CLIENT_ID,
				client_secret: process.env.CIRKWI_CLIENT_SECRET,
				grant_type: 'https://api.wim.cirkwi.com/grants/client_credentials',
				scope: 'CLIENT'
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'accept': 'application/json'
			}
		}).then(token => {
			var auth = token.data.access_token
			// get pois
			axios({
				method: 'get',
				url: `${process.env.CIRKWI_URL}/v1/objects`,
				params: params,
				headers: { 'Authorization': `Bearer ${auth}` }
			}).then(pois => {
				let requestsPois = []
				// to create geom item
				const pgp = db.$config.pgp;
				class STPoint {
					constructor(x, y) {
						this.x = x;
						this.y = y;
						this.rawType = true; // no escaping, because we return pre-formatted SQL
					}
					toPostgres(self) {
						return pgp.as.format('ST_SetSRID(ST_MakePoint($1, $2),4326)', [this.x, this.y]);
					}
				}
				pois.data.data.forEach(poi => {
					// TODO description -> put in a JSON to allow multiple translations ?
					// get the category
					db.any(`SELECT id_category, id_cirkwi FROM category_correspondence WHERE id_cirkwi IN (${poi.categories.join(', ')}) AND id_category IS NOT NULL ORDER BY id_cirkwi ASC`).then(function (category) {
						let poiDB = {
							sourceid: poi.id,
							// categories ids
							sourcetype: poi.categories.toString(),
							// themes ids
							sourcetheme: poi.themes.toString(),
							street: `${poi.location.address.route}`,
							zipcode: poi.location.address.postalCode,
							city: poi.location.address.locality,
							country: poi.location.address.country,
							latitude: poi.location.coordinates.latitude,
							longitude: poi.location.coordinates.longitude,
							// TODO maybe use themes or categories to determine type ?
							type: 2,
							priority: 0,
							visnumber: 0,
							source: 'cirkwi',
							active: true,
							duration: 0,
							manuallyupdate: false
						}
						// TODO remove the category_id part because we now use a relational table
						if (category.length == 0) {
							poiDB.category_id = null
						} else {
							// si il contient la categorie 38, c'est un parking
							let categoryParking = category.find(item => item.id_cirkwi == 38)
							poiDB.category_id = categoryParking == undefined ? category[0].id_category : categoryParking.id_category
						}
						poiDB.geom = new STPoint(poiDB.longitude, poiDB.latitude)
						if (poi.updatedAt !== null) {
							poiDB.sourcelastupdate = poi.updatedAt
						} else {
							poiDB.sourcelastupdate = poi.createdAt
						}
						if (poi.location.address.streetNumber.length > 0) poiDB.street = `${poi.location.address.streetNumber} ${poi.location.address.route}`
						if (poi.defaultPicture != 'cirkwi') poiDB.linkimg = poi.defaultPicture
						if (poi.locales.indexOf('fr_FR') != -1) {
							poiDB.label = poi.translations.fr_FR.title
							poiDB.description = poi.translations.fr_FR.description
							poiDB.web = poi.translations.fr_FR.uri
						} else {
							poiDB.label = poi.translations[poi.locales[0]].title
							poiDB.description = poi.translations[poi.locales[0]].description
							poiDB.web = poi.translations[poi.locales[0]].uri
						}
						// remove xml from description with regex parsing (removing everything between < >)
						poiDB.description = poiDB.description.replace(/\s*\<.*?\>\s*/g, '')
						let index = dataFromDB.find(item => item.sourceid == poi.id);
						// if the poi was not returned from the request then we insert it, else we update it
						if (index === undefined) {
							// make sure there is no point with the same geometry and label
							if (dataFromDB.find(item => item.geom == poiDB.geom && item.label == poiDB.label) !== undefined) {
								requestsPois.push(
									db.task('insert-poi-and-category', async t => {
										// insert the poi and get its id
										const poi_id = await t.any('INSERT INTO poi ($1:name) VALUES($1:csv) RETURNING id;', [poiDB])
										// insert categories in relational table
										const category_values = getCategoryValuesSql(category, poi_id[0].id)
										if (category_values !== null) {
											await t.none(`INSERT INTO poi_category(poi_id, category_id) VALUES ${category_values}`)
										}
									}).catch(function (err) {
										console.error(err);
										reject(`error in insert pois task : ${err}`)
									})
								)
							}
						} else {
							// we check if the poi has been updated by cirkwi
							// TODO uncomment this
							// if (index.sourcelastupdate !== poiDB.sourcelastupdate) {
								requestsPois.push(db.any('update poi set sourcetype=$1, label=$2, city=$3, latitude=$4, longitude=$5, web=$6, linkimg=$7, description=$8, type=$9, duration=$10,rating=$11, price=$12, category_id=$13, geom=$14, sourcelastupdate=$17 WHERE source=$15 AND sourceid = $16 RETURNING id', [poiDB.sourcetype, poiDB.label, poiDB.city, poiDB.latitude, poiDB.longitude, poiDB.web, poiDB.linkimg, poiDB.description, poiDB.type, poiDB.duration, poiDB.rating, poiDB.price, poiDB.category_id, poiDB.geom, poiDB.source, poiDB.sourceid, poiDB.sourcelastupdate]));
							// }
						}
					})
				});
				Promise.all(requestsPois).then((ids) => {
					resolve(ids)
				}).catch(function (err) {
					console.error(err);
					reject(`error in insert pois promise : ${err}`)
				});
			}).catch(function (err) {
				console.error(err);
				reject(err)
			});
		}).catch(function (err) {
			console.error(err);
			reject(err)
		});
	}).catch(function (err) {
		console.error(err);
	});
}

function getCategoryValuesSql(categories, poi_id) {
	if (categories.length == 0) {
		return null
	} else {
		let sql = ''
		categories.forEach(cat => {
			sql += ',( ' + poi_id + ', ' + cat.id_category + ')'
		})
		// substring to remove the first comma
		return sql.substring(1)
	}
}