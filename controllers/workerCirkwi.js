const db = require('./db');
const axios = require('axios');
const qs = require('qs')
const { parentPort } = require('worker_threads')

parentPort.onmessage = function(e) {
    // the passed-in data is available via e.data
    getPoisCirkwi(e.data[0], e.data[1], e.data[2])
};

function getPoisCirkwi(latitude, longitude, radius) {
	// TODO recuperer les 30, insert db
	return new Promise((resolve, reject) => {
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
				params: {
					lat: latitude,
					lng: longitude,
					radius: radius || 5
				},
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
					// TODO -> check unique GEOM before insert
					// TODO description -> put in a JSON to allow multiple translations ?
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
					requestsPois.push(db.any('INSERT INTO poi ($1:name) VALUES($1:csv) RETURNING id;', [poiDB]))
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
	});
}
