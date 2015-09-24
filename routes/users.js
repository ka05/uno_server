var express = require('express');
var router = express.Router();
var base = require('base-converter');
var bcrypt = require('bcrypt');
var validate = require("validate.js");
validate.moment = require("moment");

/*
 * GET userlist.
 */
router.get('/userlist', function(req, res) {
  var db = req.db;
  db.collection('users').find().toArray(function (err, items) {
    res.json(items);
  });
});

/*
 * GET userlist/uid : retrieves a user given their uid
 */
router.get('/userlist/:username', function(req, res){
  var db = req.db;
  db.collection('users').find({"uid":req.params.uid}).toArray(function (err, items) {
    res.json(items[0]);
  });
});

/*
 * DELETE to deleteuser.
 */
router.delete('/deleteuser/:username', function(req, res) {
  /**
   * Note:
   * Later will want to create JS "Classes" objects
   * to handle all db interaction for each type
   * of data object (ex: books, users, etc.)
   *
   * Then call the methods to perform desired action here
   */
  var db = req.db;
  db.collection('users').remove({ 'uid' : req.params.uid }, function(err) {
    res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
  });
});

/*
 * POST to adduser.
 */
router.post('/adduser', function(req, res) {
  var user = req.body;

  console.log(user);

  // probably want to pull apart the [req.body] and validate the fields coming in.

  var salt = bcrypt.genSaltSync(10);
  user.password = bcrypt.hashSync(user.password, salt);

  console.log("hash value: " + user.password);



  req.db.collection('users').insert(user, function(err, result){
    res.send(
      (err === null) ? { msg: 'success' } : { msg: err }
    );
  });
});


/*
 * POST to validate login.
 */
router.post('/validateLogin', function(req, res) {


  req.db.collection('users').find({
    "username":req.body.username
  }).toArray(function (err, items) {
    if(err){
      res.json({valid:false});
    }else if(items.length <= 0) {
      res.json({valid:false });
    }else if( bcrypt.compareSync(req.body.password, items[0].password) ){
      res.json({valid:true });
    }else{
      res.json({valid:false});
    }
  })
});

/*
 * Token test
 */
router.get('/getToken', function(req, res){
  var token = constructToken();
  var d_token = deconstructToken(token);

  console.log("Decostructed Token: " + d_token);
  res.json({"token":token});
});

router.get('/validateToken/:token',function(){
  var token = deconstructToken(req.params.token),
      valid = false;
  console.log(token);
  if( validateToken(token) ){
    valid = true;
  }
  res.send("token is valid: " + valid);
});



function validateToken(_token){
  var valid = false;

  // time of token is less than 30 seconds
  if(_token.timestamp ){
    valid = true;
  }
  return valid;
}

var IP_BASE = 8,
    USERID_BASE = 6,
    TIMESTAMP_BASE = 16,
    IP_MOD = 4,
    TIMESTAMP_MOD = 2,
    IP_LENGTH = 13,
    TIMESTAMP_LENGTH = 11;

function constructToken(){
  var ipAddress = formatIP(getIPAddress());
  var userId = getUserID();
  var timestamp = getTimestamp();

  //convert bases
  ipAddress = base.decToGeneric(parseInt(ipAddress), IP_BASE);
  userId = base.decToGeneric(parseInt(userId), USERID_BASE);
  timestamp = base.decToGeneric(parseInt(timestamp), TIMESTAMP_BASE);

  // zip them together
  return zip({ipAddress:ipAddress, userId:userId, timestamp:timestamp});
}

function deconstructToken(_token){
  // first unzip data
  var unzippedToken = unzip(_token);
  // unbase them and return as deconstruct

  return {
    ipAddress: base.genericToDec(parseInt(unzippedToken.ipAddress), IP_BASE),
    userId: base.genericToDec(parseInt(unzippedToken.userId), USERID_BASE),
    timestamp: base.genericToDec(unzippedToken.timestamp, TIMESTAMP_BASE)
  };
}


function zip(_tokenData){
  // more complex but i dont love it yet
  var ipStart = (_tokenData.ipAddress).substring(0,IP_MOD),
      ipEnd = (_tokenData.ipAddress).substring(IP_MOD, (_tokenData.ipAddress).length),
      timestampStart = (_tokenData.timestamp).substring(0,TIMESTAMP_MOD),
      timestampEnd = (_tokenData.timestamp).substring(TIMESTAMP_MOD, (_tokenData.timestamp).length);

  // old way - keep it simple first
  //return _tokenData.ipAddress  +  _tokenData.timestamp +  _tokenData.userId;

  var test = ipStart + timestampStart + ipEnd + timestampEnd + _tokenData.userId;
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(test, salt);

  console.log("hash value: " + hash);

  console.log("Validate Hash: " + bcrypt.compareSync(test, hash) );

  return ipStart + timestampStart + ipEnd + timestampEnd + _tokenData.userId;
}

function unzip(_tokenData){
  return {
    ipAddress:
      _tokenData.substring(0, IP_MOD) +
      _tokenData.substring( (IP_MOD + TIMESTAMP_MOD), ((IP_MOD + TIMESTAMP_MOD) + (IP_LENGTH - IP_MOD)) ),
    timestamp:
      _tokenData.substring( IP_MOD, (IP_MOD + TIMESTAMP_MOD) ) +
      _tokenData.substring(
        ((IP_MOD + TIMESTAMP_MOD) + (IP_LENGTH - IP_MOD)),
        ((IP_MOD + TIMESTAMP_MOD)+ (IP_LENGTH - IP_MOD)) + ( TIMESTAMP_LENGTH - TIMESTAMP_MOD)
      ),
    userId:_tokenData.substr(_tokenData.length - 2)
  };
}

function getUserID(){
  // hardcoded for now will pull from db later
  return 13;
}

function getTimestamp(){
  return new Date().getTime();
}

function getIPAddress(){
  var os = require('os');

  var interfaces = os.networkInterfaces();
  var addresses = [];
  for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
      var address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }
  return addresses[0];
}

function formatIP(_ip){
  var ipArr = _ip.split("."),
      formattedIpArr = [];

  for(var i = 0; i < ipArr.length; i++){
    switch(ipArr[i].length){
      case 3:
        formattedIpArr[i] = ipArr[i];
        break;
      case 2:
        formattedIpArr[i] = "0" + ipArr[i];
        break;
      case 1:
        formattedIpArr[i] = "00" + ipArr[i];
        break;
    }
  }

  return formattedIpArr.join("");
}

module.exports = router;