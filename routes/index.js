var express = require('express');
var router = express.Router();
var http = require('http');
var app = express();
var fs = require('fs');

function getBaseUrl(req){
  return req.protocol + '://' + req.get('host');
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'UNO', baseUrl:getBaseUrl(req) });
});

//router.get('/login', function(req, res, next) {
//  res.render('index', { title: 'UNO', page:'login' });
//});


module.exports = router;
