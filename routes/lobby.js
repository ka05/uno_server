/**
 * Created by claytonherendeen on 9/25/15.
 */
module.exports = function (db) {
  const self = this,
    async = require('async'),
    ObjectID = require('mongodb').ObjectID,
    coreData = require('../app_modules/coreData/coreData.js');

  const {
    Chat,
    Game,
    Challenge,
    Challenger,
    User,
    findById,
    updateModel,
  } = db;

  /*
   * Send Challenge
   */
  self.sendChallenge = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    const usersChallengedIds = _data.usersChallenged,
      challengerId = _data.challengerId,
      timestamp = Math.floor(new Date() / 1000);

    findById(User, challengerId, function (err, item) {
      const challenger = new Challenger(item._id, item.username, "");

      async.mapSeries(usersChallengedIds, function (id, callback) {
        findById(User, id, function (err, user) {
          if (err) return callback(err);
          callback(null, {
            _id: user._id,
            username: user.username,
            status: ""
          });
        })
      }, function (err, results) {
        const challenge = new Challenge({
          usersChallenged: results,
          challenger: challenger,
          timestamp: timestamp,
          expired: false,
          status: "pending"
        });

        Challenge.create(challenge, function (err) {
          (err === null) ? _actions.success() : _actions.error();
        });
      });
    });
  };

  /*
   * Get Challenge by Id
   */
  self.getChallenge = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
    // make sure challenges collection exists
    try {
      console.log("GET CHALLENGE : ID = " + _data.challengeId);
      findById(Challenge, _data.challengeId, function (err, item) {
        console.log("getChallenge:::::" + JSON.stringify(item));
        if (item) {
          (err === null) ? _actions.success(new coreData.Challenge(item)) : _actions.error(); // send back single challenge
        } else {
          _actions.error();
        }
      });
    } catch (e) {
      console.log("getChallenge exception: " + e);
      _actions.error();
    }
  };

  // TODO: check to make sure id being sent in is correct
  self.getChallenges = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
    // order by timestamp -- NEED TO FINSISH
    Challenge.find({"usersChallenged._id": new ObjectID(_data.id)}, function (err, items) {
      if (items != null) {
        const challengesArr = [];
        for (let i = 0; i < items.length; i++) {
          challengesArr.push(new coreData.Challenge(items[i]));
        }
        _actions.success(challengesArr);
      } else {
        _actions.error();
      }
    });
  };

  // get challenges that were sent by user with uid passed in
  self.getSentChallenges = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
    // order by timestamp -- NEED TO FINSISH
    Challenge.find({"challenger._id": _data.id}, function (err, items) {
      if (items != null) {
        const challengesArr = [];
        for (let i = 0, j = items.length; i < j; i++) {
          let newStatus = items[i].status;

          if (items[i].status !== "cancelled" && items[i].status !== "declined") {
            if (items[i].challenger.status !== "cancelled") {
              if (checkAllUsersResponded(items[i])) {
                if (checkAllStatus(items[i], "declined")) {
                  newStatus = "declined";
                } else if (checkAllStatus(items[i], "cancelled")) {
                  newStatus = "cancelled";
                } else {
                  newStatus = "all responded";
                }
              }
            } else {
              // challenger cancelled it
              newStatus = "cancelled";
            }

            if (newStatus !== items[i].status) {
              updateModel(Challenge, items[i]._id, function (item){
                item.status = newStatus;
                return item;
              }, function (err) {
                if (err != null)
                  _actions.error();
              });
            }
          }

          if (items[i].status === "pending") {
            // check if the challenge has existed for more than 10 minutes...
            let date1 = new Date(items[i].timestamp * 1000),
              date2 = new Date(),
              challengeTimestampGood = false;

            if (
              date1.getYear() === date2.getYear() &&
              date1.getMonth() === date2.getMonth() &&
              date1.getDate() === date2.getDate() &&
              date1.getHours() === date2.getHours() &&
              (date1.getMinutes() + 5) >= date2.getMinutes()
            ) {
              console.log("Challenge is within 5 mins. Still valid");
              challengeTimestampGood = true;
            }

            // deal with old challenge if its timstamp is not good
            if (!challengeTimestampGood) {
              // make challenge cancelled
              items[i].status = "cancelled";
              // set expired property of challenge
              items[i].expired = true;

              updateModel(Challenge, items[i]._id, function (item){
                const challenge = items[i];
                item.challenger = challenge.challenger;
                item.usersChallenged = challenge.usersChallenged;
                item.timestamp = challenge.timestamp;
                item.status = challenge.status;
                return item;
              }, function (err) {
                if (err != null)
                  _actions.error();
              });
            }
          }
          challengesArr.push(new coreData.Challenge(items[i]));
        }
        _actions.success(challengesArr);
      } else {
        _actions.error();
      }
    });
  };

  /*
   * Handle Challenge
   *  accept or decline or cancel
   */
  self.handleChallenge = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
    findById(Challenge, _data.id, function (err, item) {
      console.log("handleChallenge: ", item);
      if (item) {
        const desiredStatus = _data.choice,
          challenge = item;

        const userWasChallenged = checkUserWasChallenged(challenge, _data.userId),
          userIndex = getUserChallengedIndex(challenge, _data.userId);

        // ensure that user who sent it is authorized to change status
        switch (desiredStatus) {
          case 0:
            // they want to cancel challenge
            // make sure they were challenger or userChallenged
            if ((_data.userId === challenge.challenger.id)) {
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
              if (challenge.status !== "accepted") {
                challenge.usersChallenged[userIndex].status = "declined";
              }
            }
            break;
        }

        updateModel(Challenge, _data.id, function (item){
          item.challenger = challenge.challenger;
          item.usersChallenged = challenge.usersChallenged;
          item.timestamp = challenge.timestamp;
          item.status = challenge.status;

          return item;
        }, function (err) {
          (err === null) ? _actions.success() : _actions.error();
        });
      } else {
        _actions.error();
      }
    });
    // if it updates send notification to both players and give go ahead to start
    // allow them to start match after it is okay to do so?
  };

  self.removeBadChallenges = function (_actions) {
    Challenge.remove({$or: [{"status": "cancelled"}, {"status": "declined"}]}, function (err) {
      if (err === null) {
        _actions.success();
      } else {
        _actions.error();
      }
    });
  };

  const checkAllUsersResponded = function (_challenge) {
    let oneNotResponded = false;
    for (let i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
      if (_challenge.usersChallenged[i].status == "") {
        oneNotResponded = true;
      }
    }
    return !oneNotResponded;
  };

  const checkAllStatus = function (_challenge, _status) {
    let oneNotDeclined = false;
    for (let i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
      if ((_challenge.usersChallenged[i].status !== _status)) {
        oneNotDeclined = true;
      }
    }
    return !oneNotDeclined;
  };

  const checkUserWasChallenged = function (_challenge, _userId) {
    let userWasChallenged = false;
    // loop through challenged players
    for (let i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
      if (_challenge.usersChallenged[i]._id == _userId) {
        userWasChallenged = true;
      }
    }
    return userWasChallenged;
  };

  const getUserChallengedIndex = function (_challenge, _userId) {
    let userIndex = -1;
    // loop through challenged players
    for (let i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
      if (_challenge.usersChallenged[i]._id == _userId) {
        userIndex = i;
      }
    }
    return userIndex;
  };

  return self;
};
