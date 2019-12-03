// setup modules
require('dotenv').config();
const express = require('express');
const cors = require('cors')
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const helmet = require('helmet');
const favicon = require('serve-favicon');
const passport = require('passport');

const app = express();

app.use(helmet());
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(favicon(__dirname + '/public/images/very-road-trip.jpg'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
// Passport init
app.use(passport.initialize());
require('./controllers/passport');

// ROUTES
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const poisRouter = require('./routes/pois');
const activitiesRouter = require('./routes/activities');
const hotelsRouter = require('./routes/hotels');
const itinerariesRouter = require('./routes/itineraries');
const waypointsRouter = require('./routes/waypoints');

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/pois', poisRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/itineraries', itinerariesRouter);
app.use('/api/waypoints', waypointsRouter);

// *****Swagger***********
// swagger definition
const swaggerDefinition = {
	swagger: process.env.SWAGGER_VERSION,
	schemes: process.env.SWAGGER_SCHEMES,
	info: {
		title: process.env.SWAGGER_API_TITLE,
		version: process.env.SWAGGER_API_VERSION,
		description: process.env.SWAGGER_API_DESCRIPTION,
	},
	host: process.env.SWAGGER_HOST,
	basePath: process.env.SWAGGER_BASEPATH,
	securityDefinitions: {
		authorisationJWT: {
			type: process.env.SWAGGER_BEARER_TYPE,
			name: process.env.SWAGGER_BEARER_NAME,
			in: process.env.SWAGGER_BEARER_IN
		},
	},
};
// options for the swagger docs
const options = {
	// import swaggerDefinitions
	swaggerDefinition: swaggerDefinition,
	// path to the API docs
	apis: ['./routes/*.js'],
};
// initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);
app.get('/swagger.json', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.send(swaggerSpec);
});
// serve swagger
const swaggerUiOpts = {
	explorer: false,
	swaggerOptions: options,
	customCss: '.swagger-ui .topbar { background-color: blue }'
};
app.use('/api-docs', swaggerUi.serve)
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOpts));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
