/**
 * Created by claytonherendeen on 9/25/15.
 */
var express = require('express');
var router = express.Router();

var coreData = require('../coreData/coreData.js');

var async = require('async');
var mongo = require('mongoskin');
var ObjectID = require('mongodb').ObjectID;
var db = mongo.db("mongodb://localhost:27017/nodetest", {native_parser:true});

// bind method
db.bind("challenges");
db.bind("users");


// restructure challenge to have players array

function generateId(_timestamp, _userChallenged, _challenger){
  return _timestamp + "~" + _userChallenged + "~" + _challenger;
}


/*
 * Send Challenge
 *
 */

router.sendChallenge = function(_data, _actions){
  var usersChallengedIds = _data.usersChallenged,
    challengerId = _data.challengerId,
    challenger = "",
    timestamp = new Date();

  db.users.find({'_id':new ObjectID(challengerId)}).toArray(function (err, items) {
    challenger = items[0].username;

    async.mapSeries(usersChallengedIds, function(id, callback) {

      db.users.find({'_id':new ObjectID(id)}).toArray(function (err, res) {
        if (err) return callback(err);
        callback(null, {
          _id:res[0]._id,
          username:res[0].username
        });
      })
    }, function(err, results) {
      console.log("challenge res" + JSON.stringify(results));
      var challenge = {
        challengeId:generateId(timestamp, challengerId),
        usersChallenged:results,
        challengerId:challengerId,
        challenger:challenger,
        timestamp:timestamp,
        status:"pending"
      };

      db.challenges.insert(challenge, function(err, result){
        (err === null) ? _actions.success() : _actions.error();
      });
    });

  });
};


/*
 * Get Challenges
 *
 */

router.getChallenge = function(_data, _actions){
  // make sure challenges collection exists
  try {
    db.collectionNames("challenges", function (err, names) {
      if (names.length > 0) {
        db.challenges.find({_id: new ObjectID(_data.challengeId)}).toArray(function (err, items) {
          console.log("getChallenge: " + items);
          if(items != ""){
            (err === null) ? _actions.success(new coreData.Challenge(items[0])) : _actions.error(); // send back single challenge
          }else{
            _actions.error();
          }
        });
      } else {
        console.log("challenges collection DNE");
      }
    });
  }catch(e){
    console.log("getChallenge exception: " + e);
  }
};


router.getChallenges = function(_data, _actions){
  // order by timestamp -- NEED TO FINSISH
  db.challenges.find({"usersChallenged._id":new ObjectID(_data.id)}).toArray(function (err, items) {
    var challengesArr = [];
    for(var i = 0; i< items.length; i ++){
      challengesArr.push(new coreData.Challenge(items[i]));
    }
    _actions.success(challengesArr);
  });

};


// get challenges that were sent by user with uid passed in
router.getSentChallenges = function(_data, _actions){
  // order by timestamp -- NEED TO FINSISH
  db.challenges.find({"challengerId":_data.id}).toArray(function (err, items) {


    var challengesArr = [];
    for(var i = 0, j = items.length; i<j; i ++){
      if( checkAllUsersAccepted(items[i]) ){
        items[i].status = "accepted";

        // update in db
        db.challenges.update({_id:new ObjectID(_data.id) }, items[i], function(err){
          (err === null) ? console.log("status updated") : _actions.error();
        });
      }
      challengesArr.push(new coreData.Challenge(items[i]));
    }
    _actions.success(challengesArr);
  });
};


/*
 * Handle Challenge
 *  accept or decline or cancel
 */
router.handleChallenge = function(_data, _actions) {
  db.challenges.find({_id:new ObjectID(_data.id) }).toArray(function (err, items) {
    var desiredStatus = _data.choice,
        statusArr = [ "cancelled", "accepted", "declined"],
        validChoice = false,
        challenge = items[0];

    var userWasChallenged = checkUserWasChallenged(challenge, _data.userId),
        userIndex = getUserChallengedIndex(challenge, _data.userId);
    // ensure that user who sent it is authorized to change status
    switch(desiredStatus){
      case 0:
        // they want to cancel challenge
        // make sure they were challenger or userChallenged
        if( (_data.userId == challenge.challengerId) || (userWasChallenged) ){
          //validChoice = true;
          challenge.status = statusArr[parseInt(desiredStatus)];
        }
        break;
      case 1:
        // they want to accept the challenge
        // make sure they were the userChallenged
        if(userWasChallenged){
          //validChoice = true;
          challenge.usersChallenged[userIndex].status = "accepted";
        }
        break;
      case 2:
        // they want to decline the challenge
        // make sure they were the userChallenged
        if(userWasChallenged){
          if(challenge.status != "accepted"){
            //validChoice = true;
            challenge.usersChallenged[userIndex].status = "declined";
          }
        }
        break;
    }

    console.log("challenge.status: " + challenge.status);
    console.log("challenge.usersChallenged[userIndex].status: " + challenge.usersChallenged[userIndex].status);
    db.challenges.update({_id:new ObjectID(_data.id) }, challenge, function(err){
      console.log("err" + err);
      (err === null) ? _actions.success() : _actions.error();
    });


  });
    // if it updates send notification to both players and give go ahead to start
    // allow them to start match after it is okay to do so?
};


checkAllUsersAccepted = function(_challenge){
  var oneNotAccepted = false;
  for(var i = 0, j = _challenge.usersChallenged.length; i<j; i ++){
    if(_challenge.usersChallenged[i].status != "accepted"){
      oneNotAccepted = true;
    }
  }
  return !oneNotAccepted;
};


checkUserWasChallenged = function(_challenge, _userId){
  var userWasChallenged = false;
  // loop through challenged players
  for(var i = 0, j = _challenge.usersChallenged.length; i<j; i ++){
    if(_challenge.usersChallenged[i]._id == _userId){
      userWasChallenged = true;
    }
  }
  return userWasChallenged;
};

getUserChallengedIndex = function(_challenge, _userId){
  var userIndex = -1;
  // loop through challenged players
  for(var i = 0, j = _challenge.usersChallenged.length; i<j; i ++){
    if(_challenge.usersChallenged[i]._id == _userId){
      userIndex = i;
    }
  }
  return userIndex;
};

module.exports = router;