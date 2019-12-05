// const db = require('./db');
const moment = require('moment');
const Amadeus = require('amadeus');
const amadeus = new Amadeus({
	// AMADEUS CONFIG in ENV file
	clientId: process.env.AMADEUS_CLIENT_ID, // server name or IP address;
	clientSecret: process.env.AMADEUS_CLIENT_SECRET,
	hostaneme: process.env.AMADEUS_HOSTNAME
});


function getHotels(req, res, next) {
	//https://test.api.amadeus.com/v2/shopping/hotel-offers?cityCode=PAR&adults=1&radius=5&radiusUnit=KM&paymentPolicy=NONE&includeClosed=false&bestRateOnly=true&view=FULL&sort=PRICE
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
		res.status(200).json(response.data);
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

function getHotelOffer(req, res, next){
	//https://test.api.amadeus.com/v2/shopping/hotel-offers/by-hotel?hotelId=BGMILBGB&adults=2&roomQuantity=1&paymentPolicy=NONE&view=FULL_ALL_IMAGES
	amadeus.shopping.hotelOffersByHotel.get({
		hotelId: req.body.hotelId
	}).then(function(response){
		res.status(200).json(response.data);
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
	amadeus.shopping.hotelOffer(req.body.offerId).get().then(function(response){
		res.status(200).json(response);
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
	getOffer: getOffer
}