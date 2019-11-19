var express = require('express');
var router = express.Router();

// =============================================================================
// 404 AND ERRORS  =============================================================
// =============================================================================

router.get('/404', function(req, res, next){
	// trigger a 404 since no other middleware
	// will match /404 after this one, and we're not
	// responding here
	next();
});

router.get('/403', function(req, res, next){
	// trigger a 403 error
	var err = new Error(i18n.__('Not allowed!'));
	err.status = 403;
	next(err);
});

router.get('/500', function(req, res, next){
	// trigger a generic (500) error
	next(new Error(i18n.__('Keyboard cat!') ));
});

// Error handlers

// Since this is the last non-error-handling middleware use()d, we assume 404, as nothing else responded.

app.use(function(req, res, next){
	res.status(404);
	res.format({
		html: () => {
			const msg = i18n.__('Error 404 - Cannot find page');
			res.render('index', {
				title: i18n.__('Error Page'),
				headerTitle: i18n.__('Error'),
				icon:'',
				content: 'contents/error',
				message: `${msg} : ${req.url}`
			});
		},
		//  res.render('error', { message: `Error 404 - Cannot find page : ${req.url}`}); },
		json:  () => { res.json({ error: i18n.__('Not found') }); },
		default:  () => { res.type('txt').send(i18n.__('Not found')); }
	});
});

// error-handling middleware, take the same form as regular middleware, however they require an arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling middleware.

// If we were to next() here any remaining non-error-handling middleware would then be executed, or if we next(err) to continue passing the error, only error-handling middleware
// would remain being executed, however here we simply respond with an error page.

app.use(function(err, req, res, next){
	// we may use properties of the error object here and next(err) appropriately, or if we possibly recovered from the error, simply next().
	res.status(err.status || 500);
	// res.render('error', { message: `Error ${err.status} : ${err}`});
	res.render('index', {
		title:  i18n.__('Error Page'),
		headerTitle: i18n.__('Error'),
		icon:'',
		content: 'contents/error',
		message: `Error ${err.status} : ${err}`
	});
});

module.exports = router;
