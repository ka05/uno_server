/**
 * Created by claytonherendeen on 9/25/15.
 */
module.exports = function(db) {
  var self = this,
    async = require('async'),
    ObjectID = require('mongodb').ObjectID,
    coreData = require('../custom_modules/coreData/coreData.js');


  // bind method
  db.bind("challenges");
  db.bind("users");


  /*
   * Send Challenge
   *
   */

  self.sendChallenge = function (_data, _actions) {
    var usersChallengedIds = _data.usersChallenged,
      challengerId = _data.challengerId,
      timestamp = Math.floor(new Date() / 1000);

    db.users.find({'_id': new ObjectID(challengerId)}).toArray(function (err, items) {
      var challenger = {
        id: challengerId,
        username: items[0].username,
        status: ""
      };

      async.mapSeries(usersChallengedIds, function (id, callback) {
        db.users.find({$query: {'_id': new ObjectID(id)}}).toArray(function (err, res) {
          if (err) return callback(err);
          callback(null, {
            _id: res[0]._id,
            username: res[0].username,
            status: ""
          });
        })
      }, function (err, results) {
        var challenge = {
          usersChallenged: results,
          challenger: challenger,
          timestamp: timestamp,
          expired: false,
          status: "pending"
        };

        db.challenges.insert(challenge, function (err, result) {
          (err === null) ? _actions.success() : _actions.error();
        });
      });

    });
  };


  /*
   * Get Challenges
   *
   */

  self.getChallenge = function (_data, _actions) {
    // make sure challenges collection exists
    try {
      db.collectionNames("challenges", function (err, names) {
        if (names.length > 0) {
          db.challenges.find({_id: new ObjectID(_data.challengeId)}).toArray(function (err, items) {
            if (items != "") {
              (err === null) ? _actions.success(new coreData.Challenge(items[0])) : _actions.error(); // send back single challenge
            } else {
              _actions.error();
            }
          });
        } else {
          console.log("challenges collection DNE");
        }
      });
    } catch (e) {
      console.log("getChallenge exception: " + e);
    }
  };


  self.getChallenges = function (_data, _actions) {
    // order by timestamp -- NEED TO FINSISH
    db.challenges.find({"usersChallenged._id": new ObjectID(_data.id)}).toArray(function (err, items) {
      var challengesArr = [];
      for (var i = 0; i < items.length; i++) {
        challengesArr.push(new coreData.Challenge(items[i]));
      }
      _actions.success(challengesArr);
    });

  };


  // get challenges that were sent by user with uid passed in
  self.getSentChallenges = function (_data, _actions) {
    // order by timestamp -- NEED TO FINSISH
    db.challenges.find({"challenger.id": _data.id}).toArray(function (err, items) {

      var challengesArr = [];
      for (var i = 0, j = items.length; i < j; i++) {
        var newStatus = items[i].status;

        if (items[i].status != "cancelled" && items[i].status != "declined") {
          if (items[i].challenger.status != "cancelled") {
            if (checkAllUsersResponded(items[i])) {
              if (checkAllStatus(items[i], "declined")) {
                newStatus = "declined";
              } else if (checkAllStatus(items[i], "cancelled")) {
                newStatus = "cancelled";
              }else {
                newStatus = "all responded";
              }
            }
          } else {
            // challenger cancelled it
            newStatus = "cancelled";
          }

          if (newStatus != items[i].status) {
            // update in db
            db.challenges.update({_id: new ObjectID(items[i]._id)}, {'$set': {"status": newStatus}}, function (err) {
              if (err != null)
                _actions.error();
            });
          }
        }

        if(items[i].status == "pending"){
          // check if the challenge has existed for more than 10 minutes...
          var date1 = new Date(items[i].timestamp * 1000),
              date2 = new Date(),
              challengeTimestampGood = false;

          if(date1.getYear() == date2.getYear()){
            if(date1.getMonth() == date2.getMonth()){
              if(date1.getDate() == date2.getDate()){
                if(date1.getHours() == date2.getHours()){
                  if( (date1.getMinutes() + 5) >= date2.getMinutes()){
                    console.log("within 5 mins");
                    // still good.
                    challengeTimestampGood = true;
                  }
                }
              }
            }
          }

          // deal with old challenge if its timstamp is not good
          if(!challengeTimestampGood){
            // make challenge cancelled
            items[i].status = "cancelled";
            // set expired property of challenge
            items[i].expired = true;

            db.challenges.update({_id: new ObjectID(items[i]._id)}, items[i], function (err) {
              if (err != null)
                _actions.error();
            });
          }
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
  self.handleChallenge = function (_data, _actions) {
    db.challenges.find({_id: new ObjectID(_data.id)}).toArray(function (err, items) {
      console.log("handleChallenge: " + items + " : " + _data.id);
      if(items.length > 0){
        var desiredStatus = _data.choice,
          challenge = items[0];

        var userWasChallenged = checkUserWasChallenged(challenge, _data.userId),
          userIndex = getUserChallengedIndex(challenge, _data.userId);
        // ensure that user who sent it is authorized to change status
        switch (desiredStatus) {
          case 0:
            // they want to cancel challenge
            // make sure they were challenger or userChallenged
            if ((_data.userId == challenge.challenger.id)) {
              challenge.challenger.status = "cancelled";
            } else if (userWasChallenged) {
              challenge.usersChallenged[userIndex].status = "cancelled";
            }
            break;
          case 1:
            // they want to accept the challenge
            // make sure they were the userChallenged
            if (userWasChallenged) {
              challenge.usersChallenged[userIndex].status = "accepted";
            }
            break;
          case 2:
            // they want to decline the challenge
            // make sure they were the userChallenged
            if (userWasChallenged) {
              if (challenge.status != "accepted") {
                challenge.usersChallenged[userIndex].status = "declined";
              }
            }
            break;
        }

        db.challenges.update({_id: new ObjectID(_data.id)}, challenge, function (err) {
          console.log("err" + err);
          (err === null) ? _actions.success() : _actions.error();
        });
      }else{
        _actions.error();
      }
    });
    // if it updates send notification to both players and give go ahead to start
    // allow them to start match after it is okay to do so?
  };


  self.removeBadChallenges = function (_actions) {
    db.challenges.remove({$or: [{"status": "cancelled"}, {"status": "declined"}]}, function (err) {
      if (err === null) {
        _actions.success();
      } else {
        _actions.error();
      }
    });
  };


  checkAllUsersResponded = function (_challenge) {
    var oneNotResponded = false;
    for (var i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
      if (_challenge.usersChallenged[i].status == "") {
        oneNotResponded = true;
      }
    }
    return !oneNotResponded;
  };

  checkAllStatus = function (_challenge, _status) {
    var oneNotDeclined = false;
    for (var i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
      if ( (_challenge.usersChallenged[i].status != _status)) {
        oneNotDeclined = true;
      }
    }
    return !oneNotDeclined;
  };


  checkUserWasChallenged = function (_challenge, _userId) {
    var userWasChallenged = false;
    // loop through challenged players
    for (var i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
      if (_challenge.usersChallenged[i]._id == _userId) {
        userWasChallenged = true;
      }
    }
    return userWasChallenged;
  };


  getUserChallengedIndex = function (_challenge, _userId) {
    var userIndex = -1;
    // loop through challenged players
    for (var i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
      if (_challenge.usersChallenged[i]._id == _userId) {
        userIndex = i;
      }
    }
    return userIndex;
  };

  return self;
};
