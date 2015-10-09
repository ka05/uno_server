/**
 * Created by claytonherendeen on 9/25/15.
 */
var express = require('express');
var router = express.Router();

var coreData = require('../coreData/coreData.js');

var mongo = require('mongoskin');
var ObjectID = require('mongodb').ObjectID;
var db = mongo.db("mongodb://localhost:27017/nodetest", {native_parser:true});

// bind method
db.bind("challenges");
db.bind("users");


function generateId(_timestamp, _userChallenged, _challenger){
  return _timestamp + "~" + _userChallenged + "~" + _challenger;
}


/*
 * Send Challenge
 *
 */
router.post('/sendchallenge', function(req, res) {


  var userChallengedId = req.body.userChallengedId,
    userChallenged = "",
    challengerId = req.body.challengerId,
    challenger = "",
    timestamp = new Date();

  db.users.find({'_id':new ObjectID(challengerId)}).toArray(function (err, items) {
    challenger = items[0].username;

    db.users.find({'_id':new ObjectID(userChallengedId)}).toArray(function (err, items) {
      userChallenged = items[0].username;

      var challenge = {
        challengeId:generateId(timestamp, userChallengedId, challengerId),
        userChallengedId:userChallengedId,
        userChallenged:userChallenged,
        challengerId:challengerId,
        challenger:challenger,
        timestamp:timestamp,
        status:"pending"
      };

      db.challenges.insert(challenge, function(err, result){
        res.send(
          (err === null) ? { msg: 'success' } : { msg: err }
        );
      });

    });

  });


});


/*
 * Get Challenges
 *
 */
router.post('/challenges', function(req, res) {
  // order by timestamp -- NEED TO FINSISH
  db.challenges.find({"userChallengedId":req.body.id}).toArray(function (err, items) {
    var challengesArr = [];
    for(var i = 0; i< items.length; i ++){
      challengesArr.push(new coreData.Challenge(items[0]));
    }
    res.json(challengesArr);
  });

});

router.getChallenges = function(_data, _actions){
  // order by timestamp -- NEED TO FINSISH
  db.challenges.find({"userChallengedId":_data.id}).toArray(function (err, items) {
    var challengesArr = [];
    for(var i = 0; i< items.length; i ++){
      challengesArr.push(new coreData.Challenge(items[0]));
    }
    _actions.success(challengesArr);
  });
};

// get challenges that were sent by user with uid passed in
router.getSentChallenges = function(_data, _actions){
  // order by timestamp -- NEED TO FINSISH
  db.challenges.find({"challengerId":_data.id}).toArray(function (err, items) {
    var challengesArr = [];
    for(var i = 0; i< items.length; i ++){
      challengesArr.push(new coreData.Challenge(items[0]));
    }
    _actions.success(challengesArr);
  });
};


/*
 * Handle Challenge
 *  accept or decline
 */
router.post('/handlechallenge', function(req, res) {
  db.challenges.find({challengeId:req.body.challengeId}).toArray(function (err, items) {
    var desiredStatus = req.body.choice,
        statusArr = [ "cancelled", "accepted", "declined"],
        validChoice = false;

    // ensure that user who sent it is authorized to change status
    switch(desiredStatus){
      case "0":
        // they want to cancel challenge
        // make sure they were the challenger
        if(req.body.userId == items[0].challengerId){
          validChoice = true;
        }
        break;
      case "1":
        // they want to accept the challenge
        // make sure they were the userChallenged
        if(req.body.userId == items[0].userChallengedId){
          validChoice = true;
        }
        break;
      case "2":
        // they want to decline the challenge
        // make sure they were the userChallenged
        if(req.body.userId == items[0].userChallengedId){
          validChoice = true;
        }
        break;
    }
    console.log("validChoice: " + validChoice);
    console.log("desiredStatus: " + desiredStatus);
    console.log("user comp: " + req.body.userId + " : " + items[0].challengerId);
    if(validChoice){
      items[0].status = statusArr[parseInt(desiredStatus)];

      db.challenges.update({challengeId:req.body.challengeId}, items[0], function(err){
        if(err){
          throw err;
        } else{
          res.json({msg:'success'});
        }
      });
    }else{
      res.json({msg:'error'});
    }

  });
    // if it updates send notification to both players and give go ahead to start
    // allow them to start match after it is okay to do so?
});



module.exports = router;