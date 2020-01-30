const axios = require('axios');

function getDirection(req, res, next) {
	// https://api.mapbox.com/optimized-trips/v1/mapbox/driving/-122.42,37.78;-122.45,37.91;-122.48,37.73?access_token=YOUR_MAPBOX_ACCESS_TOKEN"
	let coordinates = req.query.coordinates;
	let service = req.query.service || 'route';
	let typeRoute = req.query.typeroute || 'driving';
	let params = {
		alternatives: 'false',
		overview: 'full',
		steps: 'false',
		geometries: 'geojson'
	};
	if (service === 'trip') {
		params = {
			roundtrip: 'false',
			source: 'first',
			destination: 'last',
			overview: 'full',
			steps: 'true',
			geometries: 'geojson'
		};
	}
	let server = process.env.ROUTING_SERVER_DRIVING;
	switch (typeRoute) {
	case 'cycling':
		server = process.env.ROUTING_SERVER_CYCLING;
		break;
	case 'walking':
		server = process.env.ROUTING_SERVER_WALKING;
		break;
	}
	let urlItinerary = `${server}/${service}/v1/${typeRoute}/${coordinates}`;
	axios.get(urlItinerary, {
		params: params,
		responseType: 'json'
	}).then((data) => {
		res.status(200).json({
			status: 'success',
			message:'Retrieved data from OSRM Server!',
			data: data.data
		});
	}).catch((error) => {
		console.error(`Error retrieving data from OSRM Server: ${error}`);
		res.status(500).json({
			status: 'error',
			message: `There was an error retrieving data from OSRM Server: ${error}`
		});
	});
}

module.exports = {
	getDirection: getDirection
};