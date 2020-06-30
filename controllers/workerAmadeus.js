const db = require('./db');
const { parentPort } = require('worker_threads')
const Amadeus = require('amadeus');
const amadeus = new Amadeus({
	// AMADEUS CONFIG in ENV file
	clientId: process.env.AMADEUS_CLIENT_ID, // server name or IP address;
	clientSecret: process.env.AMADEUS_CLIENT_SECRET,
	hostaneme: process.env.AMADEUS_HOSTNAME
});

parentPort.onmessage = function (e) {
	// the passed-in data is available via e.data
	getPoisAmadeus(e.data[0], e.data[1]).then(function (response) {
		console.log(response)
	})
};

// TODO rajouter en param la liste des sources ids et comparer dessus au lieu de faire requete sql ?
// ne pas mettre de limite dans le premier appel (juste le radius)
function getPoisAmadeus(params, dataFromDB) {
	// TODO recuperer les 30, insert db
	return new Promise((resolve, reject) => {
		amadeus.shopping.hotelOffers.get(params).then(function (response) {
			let hotels = [];
			let calls = [];
			for (let ets of response.data) {
				let hotel = ets.hotel;
				let offer = ets.offers[0];
				let description = '';
				let address = hotel.address.lines[0] || '';
				let currency = 'EUR';
				if (offer.price.currency !== undefined && offer.price.currency !== '') {
					currency = offer.price.currency;
				}
				if (typeof hotel.description !== 'undefined') {
					description = hotel.description.text;
				}
				if (address.indexOf('{') !== -1) {
					address = address.replace('{', '').replace('}', '').replace('"', '').replace('","', ', ').replace('"', '');
				}
				let hot = {
					fieldId: hotel.hotelId,
					name: hotel.name,
					longitude: hotel.longitude,
					latitude: hotel.latitude,
					street: address,
					zipcode: hotel.address.postalCode || '',
					city: hotel.address.cityName || '',
					description: description || '',
					image: hotel.media[0].uri.replace('http://', 'https://') || '',
					link: hotel.web || '',
					phone: hotel.contact.phone || '',
					email: hotel.contact.email || '',
					price: `${offer.price.total} ${currency}` || '',
					duration: '',
					distance: `${hotel.hotelDistance.distance} ${hotel.hotelDistance.distanceUnit}` || '',
					rating: hotel.rating
				};
				hotels.push(hot);
				// CREATE ACTIVITIES in OUR DB
				let point = `POINT(${hot.longitude} ${hot.latitude})`;
				let index = dataFromDB.find(item => {
					if (item.source === 'Amadeus' && item.sourceid === hotel.hotelId) {
						return true;
					}
					return false;
				});
				let opt;
				if (index === undefined) {
					let sql = 'INSERT INTO poi (source, sourceid, sourcetype, label, sourcetheme, street, zipcode, city, latitude, longitude, web, linkimg, description, type, rating, price, geom) VALUES( $1, $2, $3 , $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, ST_GeomFromText($17,4326)) RETURNING id;';
					let values = ['Amadeus', hotel.hotelId, 'Hotel', hot.name, 'Hotel', hot.address, hot.zipCode, hot.city, hot.latitude, hot.longitude, hot.link, hot.image, hot.description, 5, hot.rating, parseFloat(offer.price.total), point];
					opt = db.any(sql, values);

				} else {
					opt = db.any('update poi set label=$1, street=$2, zipcode=$3, city=$4, latitude=$5, longitude=$6, web=$7, linkimg=$8, description=$9, type=$10, rating=$11, price=$12, geom=ST_GeomFromText($13,4326) WHERE source=$14 AND sourceid = $15 RETURNING id;', [hot.name, hot.address, hot.zipCode, hot.city, hot.latitude, hot.longitude, hot.link, hot.image, hot.description, 5, hot.rating, parseFloat(offer.price.total), point, 'Amadeus', hotel.hotelId]);
				}
				calls.push(opt);
			}
			Promise.all(calls).then((ids) => {
				for (let i = 0; i < ids.length; i++) {
					hotels[i].id = ids[i][0].id;
				}
				resolve(hotels)
			}).catch(error => {
				reject(error)
			});
		}).catch(error => {
			console.error(error)
		});
	}).catch(function (err) {
		console.error(err);
	});
}
