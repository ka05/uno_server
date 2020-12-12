const express = require('express');
const router = express.Router();

function getBaseUrl(req) {
  return req.protocol + '://' + req.get('host');
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'UNO', baseUrl: getBaseUrl(req)});
});

//router.get('/login', function(req, res, next) {
//  res.render('index', { title: 'UNO', page:'login' });
//});

module.exports = router;
