module.exports = {
	// LOCAL CONFIG
	host: process.env.DB_HOST, // server name or IP address;
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE,
	user: process.env.DB_USER,
	ssl: process.env.DB_SSL ,
	password: process.env.DB_PASSWORD,
	uri: process.env.DB_URI
};