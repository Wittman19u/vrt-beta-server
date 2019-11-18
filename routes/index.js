var express = require('express');
var router = express.Router();



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: ' Very Road Trip API server' });
});


module.exports = router;
