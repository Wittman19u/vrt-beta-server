// setup modules
require('dotenv').config();
const express = require('express');
const i18n = require('i18n');
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
// file upload
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const _ = require('lodash');


const app = express();

app.use(helmet());
app.use(cors());

// i18n
i18n.configure({
	locales:['en', 'fr'],
	directory: __dirname + '/locales'
})
app.use(i18n.init);

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
// enable files upload
app.use(fileUpload({createParentPath: true}));
//add other middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// ROUTES
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const poisRouter = require('./routes/pois');
const restaurantsRouter = require('./routes/restaurants');
const activitiesRouter = require('./routes/activities');
const hotelsRouter = require('./routes/hotels');
// TODO check if waypoints routes are necessary
const waypointsRouter = require('./routes/waypoints');
const messagesRouter = require('./routes/messages');
const directionsRouter = require('./routes/directions');
const roadtripsRouter = require('./routes/roadtrips');
const visitsRouter = require('./routes/visits');
const mediasRouter = require('./routes/medias');
// TODO delete it, put in different server
const firebaseRouter = require('./routes/firebase');

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/pois', poisRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/waypoints', waypointsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/directions', directionsRouter);
app.use('/api/roadtrips', roadtripsRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/medias', mediasRouter);
// TODO delete
app.use('/api/firebase', firebaseRouter);

// *****Swagger***********
// swagger definition
const swaggerDefinition = {
	swagger: process.env.SWAGGER_VERSION,
	schemes: [process.env.SWAGGER_SCHEMES],
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
