var express = require('express');
var router = express.Router();
var http = require('http');
var app = express();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'UNO' });
});

router.get('/login', function(req, res, next) {
  res.render('index', { title: 'UNO', page:'login' });
});


module.exports = router;
