var express = require('express');
var router = express.Router();
var base = require('base-converter');
var bcrypt = require('bcrypt');
var validate = require("validate.js");
validate.moment = require("moment");

var coreData = require('../coreData/coreData.js');

var mongo = require('mongoskin');
var ObjectID = require('mongodb').ObjectID;
var db = mongo.db("mongodb://localhost:27017/nodetest", {native_parser:true});

// bind method
db.bind("users");

// Authentication/Login resources
// http://miamicoder.com/2014/using-mongodb-and-mongoose-for-user-registration-login-and-logout-in-a-mobile-application/


// notes: ideally want to use all data objects on server instead of client.

/*
 * GET userlist.
 *
 */
router.get('/userlist', function(req, res) {
  db.users.find().toArray(function (err, items) {
    var userArr = [];
    for(var i = 0; i < items.length; i++){
      userArr.push(new coreData.User(items[i]));
    }
    res.json(userArr);
  });
});

/*
 * GET active/online userlist.
 *
 */
router.get('/userlist/online', function(req, res) {
  db.users.find({"online":"true", "_id":{ $ne: new ObjectID( res.body.uid ) } }).toArray(function (err, items) {
    var userArr = [];
    for(var i = 0; i < items.length; i++){
      userArr.push(new coreData.User(items[i]));
    }
    res.json(userArr);
  });
});


router.getOnlineUsers = function(_data, _actions){
  db.users.find({"online":"true", "_id":{ $ne: new ObjectID( _data.uid ) } }).toArray(function (err, items) {
    var userArr = [];
    for(var i = 0; i < items.length; i++){
      userArr.push(new coreData.User(items[i]));
    }
    _actions.success(userArr);
  });
};

/*
 * GET userlist/username : retrieves a user given their uid
 */
router.get('/userlist/:username', function(req, res){
  db.users.find({"username":req.params.username}).toArray(function (err, items) {
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
  db.users.remove({ 'username' : req.params.username }, function(err) {
    res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
  });
});

/*
 * POST to adduser.
 */
router.post('/adduser', function(req, res) {
  var user = req.body;

  console.log(user);

  // check if username exists
  db.users.find({
    "username":req.body.username
  }).toArray(function(err, items){
    if(err){
      // error occurred
      res.json({msg:"Error Signing up"})
    }else if(items.length <= 0) {
      // no results :. username doesnt exist yet :. let them sign up
      var salt = bcrypt.genSaltSync(10);
      user.password = bcrypt.hashSync(user.password, salt);
      user.online = "false";
      user.winCount = 0;
      //console.log("hash value: " + user.password);

      db.users.insert(new coreData.User(user), function(err, result){
        res.send(
          (err === null) ? { msg: 'success' } : { msg: err }
        );
      });

    }else{
      res.json({msg:"User with that username already exists"})
    }
  });

});


/*
 * POST to validate login.
 */
router.post('/validateLogin', function(req, res) {
  db.users.find({
    "username":req.body.username
  }).toArray(function (err, items) {
    if(err){
      // error occurred
      res.json( { valid : false } );
    }else if(items.length <= 0) {
      // no results
      res.json( { valid : false } );
    }else if( bcrypt.compareSync(req.body.password, items[0].password) ){
      // found result and password matches

      // update user to show online as true
      router.setUserOnline(items[0]._id);

      res.json( {valid:true, user:new coreData.User(items[0])} );
    }else{
      // found result but password doesnt match
      res.json( { valid : false } );
    }
    // will want to inset logged in property for user if they are logged in
  })
});

router.validateLogin = function(_data, _actions){
  db.users.find({
    "username":_data.username
  }).toArray(function (err, items) {
    if(err){
      // error occurred
      _actions.error();
    }else if(items.length <= 0) {
      // no results
      _actions.error();
    }else if( bcrypt.compareSync(_data.password, items[0].password) ){
      // found result and password matches

      // update user to show online as true
      router.setUserOnline(items[0]._id, _data.socketId);
      items[0].token = constructToken(items[0]._id, _data.socketId); // need to use socket io conn id
      _actions.success(items[0]);
    }else{
      // found result but password doesnt match
      _actions.error();
    }
    // will want to inset logged in property for user if they are logged in
  });
};


/*
 * Token test
 */
router.get('/getToken', function(req, res){
  var token = constructToken();

  res.json({"token":token});
});

router.get('/validateToken/:token',function(){
  var token = deconstructToken(req.params.token),
      valid = false;

  if( router.validateToken(token) ){
    valid = true;
  }
  res.send("token is valid: " + valid);
});



router.validateToken = function(_data, _actions){

  var token = deconstructToken(_data.token);
  // Would normally check if time of token is less than 30 seconds
  // but since im using socket.io im using this for checking to make
  // sure a user is logged in already when the page loads.

  //console.log(token);
  // get userObj from userId
  db.users.find({
    "_id":new ObjectID(token.userId)
  }).toArray(function (err, items) {
    // If there was a result ( userId from token matches one in DB )
    if(items[0]){
      // if the socketId is the same
      if(items[0].socketId == token.socketId) {
        var newToken = constructToken(items[0]._id, _data.socketId); // have to update because of socketId
        router.setUserOnline(
          items[0]._id,
          _data.socketId,
          newToken
        ); // need to use socket io conn id);
        items[0].token = newToken;
        _actions.success(items[0]);
      }else{
        _actions.error();
      }
    }else{
      _actions.error();
    }

  });

};

var USERID_BASE = 6,
    //SOCKET_BASE = 8,
    //IP_BASE = 8,
    TIMESTAMP_BASE = 16,
    //IP_MOD = 4,
    SOCKET_MOD = 4,
    TIMESTAMP_MOD = 2,
    //IP_LENGTH = 13,
    SOCKET_LENGTH = 20,
    USERID_LENGTH = 24,
    TIMESTAMP_LENGTH = 11;

function constructToken(_userId, _socketId){
  console.log(getIPAddress());
  //var ipAddress = formatIP(getIPAddress());
  //var userId = getUserID();
  var socketId = _socketId;
  var userId = _userId;
  var timestamp = getTimestamp();
  //console.log(" socketId: " + _socketId + "userId: " + _userId + " timestamp " + timestamp);
  //convert bases
  //ipAddress = base.decToGeneric(parseInt(ipAddress), IP_BASE);
  //socketId = base.decToGeneric(parseInt(socketId), SOCKET_BASE);
  //userId = base.decToGeneric(parseInt(userId), USERID_BASE);
  timestamp = base.decToGeneric(parseInt(timestamp), TIMESTAMP_BASE);

  // zip them together
  //return zip({ipAddress:ipAddress, userId:userId, timestamp:timestamp});
  return zip({socketId:socketId, userId:userId, timestamp:timestamp});
}

function deconstructToken(_token){
  // first unzip data
  var unzippedToken = unzip(_token);
  // unbase them and return as deconstruct

  return {
    //ipAddress: base.genericToDec(parseInt(unzippedToken.ipAddress), IP_BASE),
    socketId: unzippedToken.socketId,
    userId: unzippedToken.userId,
    timestamp: base.genericToDec(unzippedToken.timestamp, TIMESTAMP_BASE)
  };
}


function zip(_tokenData){
  // more complex but i dont love it yet
  var socketStart = (_tokenData.socketId).substring(0,SOCKET_MOD),
      //ipStart = (_tokenData.ipAddress).substring(0,IP_MOD),
      //ipEnd = (_tokenData.ipAddress).substring(IP_MOD, (_tokenData.ipAddress).length),
      socketEnd = (_tokenData.socketId).substring(SOCKET_MOD, (_tokenData.socketId).length),
      timestampStart = (_tokenData.timestamp).substring(0,TIMESTAMP_MOD),
      timestampEnd = (_tokenData.timestamp).substring(TIMESTAMP_MOD, (_tokenData.timestamp).length);

  // old way - keep it simple first
  //return _tokenData.ipAddress  +  _tokenData.timestamp +  _tokenData.userId;

  //var test = ipStart + timestampStart + ipEnd + timestampEnd + _tokenData.userId;
  var test = socketStart + timestampStart + socketEnd + timestampEnd + _tokenData.userId;
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(test, salt);

  //console.log("hash value: " + hash);
  //console.log("Validate Hash: " + bcrypt.compareSync(test, hash) );

  //return ipStart + timestampStart + ipEnd + timestampEnd + _tokenData.userId;
  //console.log(socketStart + timestampStart + socketEnd + timestampEnd + _tokenData.userId);
  return socketStart + timestampStart + socketEnd + timestampEnd + _tokenData.userId;
}

function unzip(_tokenData){
  return {
    //ipAddress:
      //_tokenData.substring(0, IP_MOD) +
      //_tokenData.substring( (IP_MOD + TIMESTAMP_MOD), ((IP_MOD + TIMESTAMP_MOD) + (IP_LENGTH - IP_MOD)) ),
    socketId:
      _tokenData.substring(0, SOCKET_MOD) +
      _tokenData.substring( (SOCKET_MOD + TIMESTAMP_MOD), ((SOCKET_MOD + TIMESTAMP_MOD) + (SOCKET_LENGTH - SOCKET_MOD)) ),
    timestamp:
      //_tokenData.substring( IP_MOD, (IP_MOD + TIMESTAMP_MOD) ) +
      //_tokenData.substring(
      //  ((IP_MOD + TIMESTAMP_MOD) + (IP_LENGTH - IP_MOD)),
      //  ((IP_MOD + TIMESTAMP_MOD)+ (IP_LENGTH - IP_MOD)) + ( TIMESTAMP_LENGTH - TIMESTAMP_MOD)
      //),
      _tokenData.substring( SOCKET_MOD, (SOCKET_MOD + TIMESTAMP_MOD) ) +
      _tokenData.substring(
        ((SOCKET_MOD + TIMESTAMP_MOD) + (SOCKET_LENGTH - SOCKET_MOD)),
        ((SOCKET_MOD + TIMESTAMP_MOD)+ (SOCKET_LENGTH - SOCKET_MOD)) + ( TIMESTAMP_LENGTH - TIMESTAMP_MOD)
      ),
    userId:_tokenData.substr(_tokenData.length - USERID_LENGTH)
  };
}

function getTimestamp(){
  return new Date().getTime();
}


router.setUserOnline = function(_userId, _socketId, _token){
  db.users.update(
    {_id:_userId},
    {'$set':{online:"true", socketId:_socketId, token:_token}},
    function(err) {
      if (err) throw err;
      console.log('Updated!');
    }
  );
};

router.setUserOffline = function(_socketId){
  db.users.update(
    {socketId:_socketId},
    {'$set':{online:"false"}},
    function(err) {
      if (err) throw err;
      console.log('Updated!');
    }
  );
};

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

/*
OLD CODE

function getUserID(){
  // hardcoded for now will pull from db later
  return 13;
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
*/


module.exports = router;