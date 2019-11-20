module.exports = {
	swagger: process.env.SWAGGER_VERSION,
	info: {
		title: process.env.SWAGGER_API_TITLE,
		version: process.env.SWAGGER_API_VERSION,
		description: process.env.SWAGGER_API_DESCRIPTION,
	},
	host: process.env.SWAGGER_HOST,
	basePath: process.env.SWAGGER_BASEPATH,
	securityDefinitions: {
		bearerAuth: {
			type: process.env.SWAGGER_BEARER_TYPE,
			name: process.env.SWAGGER_BEARER_NAME,
			in: process.env.SWAGGER_BEARER_IN,
		},
	},
};