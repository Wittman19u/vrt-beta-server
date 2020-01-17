const db = require('./db');
const moment = require('moment');
const Amadeus = require('amadeus');
const amadeus = new Amadeus({
	// AMADEUS CONFIG in ENV file
	clientId: process.env.AMADEUS_CLIENT_ID, // server name or IP address;
	clientSecret: process.env.AMADEUS_CLIENT_SECRET,
	hostaneme: process.env.AMADEUS_HOSTNAME
});

function getPricesHotels(req, res, next) {
	let startDate = req.query.startdate || moment().format('YYYY-MM-DD');
	let params = {
		latitude: req.query.latitude,
		longitude: req.query.longitude ,
		radius: req.query.radius || 5,
		radiusUnit: req.query.radiusunit || 'KM' ,
		paymentPolicy:'NONE', // filter the response based on a specific payment type. NONE means all types (default)
		includeClosed: 'false', // show All properties (include Sold Out) or Available only. For Sold Out properties, please check availability on other dates. To be used with sort DISTANCE or NONE
		bestRateOnly:'true', // use to return only the cheapest offer per hotel or all available offers
		checkInDate: startDate,
		checkOutDate: req.query.checkoutdate || moment(startDate).add(1,'days').format('YYYY-MM-DD'),
		view:'LIGHT', // NONE: geocoordinates, hotel distance; LIGHT: NONE view + city name, phone number, fax, address, postal code, country code, state code, ratings, 1 image; 		FULL: LIGHT view + hotel description, amenities and facilities
		sort:'DISTANCE', // DISTANCE: from city center (or reference point); LOWEST: price first (warning: all hotels may not be returned)
		lang: req.query.lang || 'fr-FR',
		currency: req.query.currency || 'EUR',
		adults:  req.query.adults || 1,
		childAges:  req.query.childages || [],
		roomQuantity:  req.query.roomquantity || 1,
		priceRange: req.query.pricerange || ''
	};
	amadeus.shopping.hotelOffers.get(params).then(function(response){
		let min = 0;
		let max = 1500;
		if (response.data.length > 0) {
			let hotelsList = response.data;
			min = parseInt(hotelsList[0].offers[0].price.total)
			max = parseInt(hotelsList[0].offers[0].price.total)
			for (let ets of hotelsList) {
				let price = parseInt(ets.offers[0].price.total);
				if (price < min) {
					min = price;
				}
				if (price > max) {
					max = price;
				}
			}
		}
		res.status(200).json({
			status: 'success',
			itemsNumber: response.data.length,
			data: [min, max],
			message: 'Retrieved hotels prices for this destination.'
		});

	}).catch( error => {
		let message = 'Error amadeus!';
		console.log(message);
		res.status(400).json({
			code: error.code,
			status: 'error',
			error: error,
			message: message
		});
	});
}

function getHotels(req, res, next) {
	//https://test.api.amadeus.com/v2/shopping/hotel-offers?cityCode=PAR&adults=1&radius=5&radiusUnit=KM&paymentPolicy=NONE&includeClosed=false&bestRateOnly=true&view=FULL&sort=PRICE
	let radius = parseInt(req.query.radius) || 5;
	let latitude = req.query.latitude;
	let longitude = req.query.longitude;
	let sql = `SELECT *	FROM poi WHERE ST_DistanceSphere(geom, ST_MakePoint(${longitude},${latitude})) <= ${radius} * 1000 AND sourcetype = 'Hotel'`;
	db.manyOrNone(sql).then(function (dataFromDB) {
		if (dataFromDB.length > 4) {
			res.status(200).json({
				status: 'success',
				itemsNumber: dataFromDB.length,
				data: dataFromDB,
				message: 'Retrieved hotels in radius from cache.'
			});
		} else {
			let startDate = req.query.startdate || moment().format('YYYY-MM-DD');
			let params = {
				latitude: latitude,
				longitude: longitude,
				radius: radius,
				radiusUnit: req.query.radiusunit || 'KM' ,
				paymentPolicy:'NONE', // filter the response based on a specific payment type. NONE means all types (default)
				includeClosed: 'false', // show All properties (include Sold Out) or Available only. For Sold Out properties, please check availability on other dates. To be used with sort DISTANCE or NONE
				bestRateOnly:'true', // use to return only the cheapest offer per hotel or all available offers
				checkInDate: startDate,
				checkOutDate: req.query.checkoutdate || moment(startDate).add(1,'days').format('YYYY-MM-DD'),
				view:'LIGHT', // NONE: geocoordinates, hotel distance; LIGHT: NONE view + city name, phone number, fax, address, postal code, country code, state code, ratings, 1 image; 		FULL: LIGHT view + hotel description, amenities and facilities
				sort:'DISTANCE', // DISTANCE: from city center (or reference point); LOWEST: price first (warning: all hotels may not be returned)
				lang: req.query.lang || 'fr-FR',
				currency: req.query.currency || 'EUR',
				adults:  req.query.adults || 1,
				childAges:  req.query.childages || [],
				roomQuantity:  req.query.roomquantity || 1,
				priceRange: req.query.pricerange.join('-') || ''
			};
			amadeus.shopping.hotelOffers.get(params).then(function(response){
				let hotels = [];
				for (let ets of response.data){
					let hotel = ets.hotel;
					let offer = ets.offers[0];
					let description = '';
					if (typeof hotel.description !== 'undefined') {
						description = hotel.description.text;
					}
					let hot = {
						fieldId: hotel.hotelId,
						name: hotel.name,
						longitude: hotel.longitude,
						latitude: hotel.latitude,
						address: `${hotel.address.lines[0]}, ${hotel.address.postalCode} ${hotel.address.cityName} - ${hotel.address.countryCode}` || '',
						zipCode: hotel.address.postalCode || '',
						city: hotel.address.cityName || '',
						description: description || '',
						image: hotel.media[0].uri.replace('http://', 'https://') || '',
						link: hotel.web || '',
						phone: hotel.contact.phone || '',
						email: hotel.contact.email || '',
						price: `${offer.price.total} ${offer.price.currency}` || '',
						duration: '',
						distance: `${hotel.hotelDistance.distance} ${hotel.hotelDistance.distanceUnit}` || '',
						rating: hotel.rating
					};

					hotels.push(hot);
					// CREATE ACTIVITIES in OUR DB
					let point = `POINT(${hot.longitude} ${hot.latitude})`;
					let index = dataFromDB.find(item => {
						if (item.source === 'Amadeus' && item.sourceid ===  hotel.hotelId){
							return true;
						}
						return false;
					});
					if (index === undefined) {
						let sql = 'INSERT INTO poi (source, sourceid, sourcetype, label, sourcetheme, street, zipcode, city, latitude, longitude, web, linkimg, description, type, rating, price, geom) VALUES( $1, $2, $3 , $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, ST_GeomFromText($17,4326)) RETURNING id;';
						let values= ['Amadeus', hotel.hotelId, 'Hotel', hot.name, 'Hotel',  hot.address,  hot.zipCode, hot.city, hot.latitude, hot.longitude, hot.link, hot.image, hot.description, 1, hot.rating, parseFloat(offer.price.total), point];
						db.any(sql, values).then(function (rows) {
							console.log({
								status: 'success',
								message: 'Inserted one hotel',
								id: rows[0]['id']
							});
						}).catch( error => {
							let message = 'Error insert hotel in db!';
							console.error(message);
							res.status(400).json({
								code: error.code,
								status: 'error',
								error: error,
								message: message
							});
						});
					} else {
						db.none('update poi set label=$1, street=$2, zipcode=$3, city=$4, latitude=$5, longitude=$6, web=$7, linkimg=$8, description=$9, type=$10, rating=$11, price=$12, geom=ST_GeomFromText($13,4326) WHERE source=$14 AND sourceid = $15', [hot.name, hot.address, hot.zipCode, hot.city, hot.latitude, hot.longitude, hot.link, hot.image, hot.description, 4, hot.rating, parseFloat(offer.price.total), point, 'Amadeus', hotel.hotelId]).then(() => {
							console.log({
								status: 'success',
								message: 'Updated one hotel',
								id: hotel.hotelId
							});
						}).catch( error => {
							let message = 'Error update hotel in db!';
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
				return hotels;
			}).then((hotels) => {
				res.status(200).json({
					status: 'success',
					itemsNumber: hotels.length,
					data: hotels,
					message: 'Retrieved hotel for this destination.'
				});
			}).catch( error => {
				if( (error.description[0].code === 11126 && error.description[0].status === 400) || (error.description[0].code === 38194 && error.description[0].status === 429)  ) {
					res.status(200).json({
						status: 'success',
						itemsNumber: 0,
						data: [],
						message: 'Retrieved 0 hotels for this destination.'
					});
				} else {
					let message = 'Error amadeus!';
					console.log(message);
					res.status(400).json({
						code: error.code,
						status: 'error',
						error: error,
						message: message
					});
				}
			});
		}
	}).catch( error => {
		let message = 'Error retrieved Hotels from db!';
		console.error(message);
		res.status(400).json({
			code: error.code,
			status: 'error',
			error: error,
			message: message
		});
	});
}

function getHotelOffer(req, res, next){
	//https://test.api.amadeus.com/v2/shopping/hotel-offers/by-hotel?hotelId=BGMILBGB&adults=2&roomQuantity=1&paymentPolicy=NONE&view=FULL_ALL_IMAGES
	amadeus.shopping.hotelOffersByHotel.get({
		hotelId: req.body.hotelId
	}).then(function(hotelOffers){
		res.status(200).json({
			status: 'success',
			itemsNumber: hotelOffers.data.length,
			data: hotelOffers.data,
			message: 'Retrieved Offers fot this hotel.'
		});
	}).catch( error => {
		let message = 'Error getHotelOffer amadeus!';
		console.log(message);
		res.status(400).json({
			code: error.code,
			status: 'error',
			error: error,
			message: message
		});
	});
}


// Confirm the availability of a specific offer id view room details
function getOffer(req, res, next){
	//https://test.api.amadeus.com/v2/shopping/hotel-offers/{offerId}
	amadeus.shopping.hotelOffer(req.body.offerId).get().then(function(offer){
		res.status(200).json({
			status: 'success',
			itemsNumber: offer.data.length,
			data: offer.data,
			message: 'Retrieved details of this offer.'
		});
	}).catch(error => {
		let message = 'Error getOffer amadeus!';
		console.log(message);
		res.status(400).json({
			code: error.code,
			status: 'error',
			error: error,
			message: message
		});
	});
}

module.exports={
	getHotels: getHotels,
	getHotelOffer: getHotelOffer,
	getOffer: getOffer,
	getPricesHotels: getPricesHotels
}