const promise = require('bluebird');
promise.config({
	// Enable warnings
	warnings: true,
	// Enable long stack traces
	longStackTraces: true,
	// Enable cancellation
	cancellation: true,
	// Enable monitoring
	monitoring: true,
	// Enable async hooks
	asyncHooks: true,
});
const pgPromiseOptions = {
	// Initialization Options
	query: (e) => {
		console.log('QUERY: ', e.query);
		if (e.params) {
			console.log('PARAMS:', e.params);
		}
	},
	error(err, e) {

		if (e.cn) {
			// this is a connection-related error
			// cn = safe connection details passed into the library:
			//      if password is present, it is masked by #
			console.log(e.cn);
		}

		if (e.query) {
			// query string is available
			if (e.params) {
				// query parameters are available
				console.log(e.params);
			}
		}

		if (e.ctx) {
			// occurred inside a task or transaction
			console.log(e.ctx);
		}
	},
	promiseLib: promise
};
const pgp = require('pg-promise')(pgPromiseOptions);
// pgMonitor = require('pg-monitor');
// pgMonitor.attach(pgPromiseOptions, ['query', 'error']);
const cn = require('../config/dbConfig');
const db = pgp(cn); // database instance;

module.exports = db;
module.exports.STPointClass = class STPointClass { // class to insert raw data into pg-promise query call (for ST function not transformed in string)
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.rawType = true; // no escaping, because we return pre-formatted SQL
	}
	toPostgres(self) {
		return pgp.as.format('ST_SetSRID(ST_MakePoint($1, $2),4326)', [this.x, this.y]);
	}
}
