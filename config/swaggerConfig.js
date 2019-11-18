module.exports = {
	swagger: "2.0",
	info: {
		title: 'VeryRoadTrip API',
		version: '1.0.0',
		description: 'VeryRoadTrip RESTful API description with Swagger',
	},
	host: 'localhost:3000',
	basePath: '/',
	securityDefinitions: {
		bearerAuth: {
			type: 'apiKey',
			name: 'Authorization',
			in: 'header',
		},
	},
};