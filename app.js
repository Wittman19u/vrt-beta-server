const createError = require('http-errors');
const path = require('path');
//const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const express = require('express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const helmet = require('helmet');
var favicon = require('serve-favicon');
const passport = require('passport');
require('./controllers/passport');
const app = express();
app.use(helmet());
app.use(passport.initialize());
//const router = express.Router();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/images/very-road-trip.jpg'));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// ROUTES
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const poisRouter = require('./routes/pois');
const itinerariesRouter = require('./routes/itineraries');
const waypointsRouter = require('./routes/waypoints');

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/pois', poisRouter);
app.use('/api/itineraries', itinerariesRouter);
app.use('/api/waypoints', waypointsRouter);


//Swagger

// swagger definition
const swaggerDefinition = require('./config/swaggerConfig');
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
