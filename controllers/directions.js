const axios = require('axios');
var version = 'v5';
var osrmTextInstructions = require('osrm-text-instructions')(version);
var qs = require('qs');


function getDirection(req, res, next) {
	// https://api.mapbox.com/optimized-trips/v1/mapbox/driving/-122.42,37.78;-122.45,37.91;-122.48,37.73?access_token=YOUR_MAPBOX_ACCESS_TOKEN"
	let coordinates = req.query.coordinates;
	let service = req.query.service || 'route';
	let typeRoute = req.query.typeroute || 'driving';
	let lang = 'fr';
	let waypointNames = '';
	if(req.query.lang !== undefined) {
		lang = req.query.lang;
	}
	if(req.query.waypointnames !== undefined) {
		waypointNames = qs.parse(req.query.waypointnames);
	}
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
	}).then((response) => {
		let modified = Object.assign({}, response);
		if (service === 'trip' && waypointNames !== '') {
			let index = 1;
			let legsNumber = modified.data.trips[0].legs.length;
			modified.data.trips[0].legs.forEach(function(leg) {
				let i = modified.data.waypoints[index].waypoint_index - 1;
				let wayName = waypointNames[i];
				let textInstructionsOptions = { legCount: legsNumber, legIndex: index, waypointName: wayName };
				index++;
				leg.steps.forEach(function(step) {
					step.voiceInstructions = osrmTextInstructions.compile(lang, step, textInstructionsOptions);
				});
			});
		}
		// else if (service === 'route') {
		// 	let index = 0;
		// 	let legsNumber = modified.data.routes[0].legs.length;
		// 	modified.data.routes[0].legs.forEach(function(leg) {
		// 		let textInstructionsOptions = { legCount: legsNumber, legIndex: index, waypointName: waypointNames[index] }
		// 		leg.steps.forEach(function(step) {
		// 			step.voiceInstructions = osrmTextInstructions.compile(lang, step, textInstructionsOptions)
		// 		});
		// 	});
		// }
		res.status(200).json({
			status: 'success',
			message:'Retrieved data from OSRM Server!',
			data: modified.data
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