/**
 * Created by claytonherendeen on 9/24/15.
 */
var express = require('express');
var router = express.Router();

var mongo = require('mongoskin');
var ObjectID = require('mongodb').ObjectID;
var db = mongo.db("mongodb://localhost:27017/nodetest", {native_parser:true});

// bind method
db.bind("chatMsgs");
db.bind("users");
db.bind("games");

/*
 * Get Chat Messages
 *
 */
router.post('/chatmsgs', function(req, res) {
  // order by timestamp -- NEED TO FINSISH
  db.chatMsgs.find().toArray(function (err, items) {
    res.json(items);
  });
});

/*
 * Send Chat Message
 *
 */
router.post('/sendchat', function(req, res) {
  // order by timestamp -- NEED TO FINSISH
  router.sendChat(req.body, {
    success:function(){
      res.json({ msg: 'success' });
    },
    error:function(){
      res.json({ msg: 'error' });
    }
  });
});


router.getChat = function(_data, _actions){
  if(_data.roomId == "1"){
    // they want lobby chat :. they can have it
    db.chatMsgs.find({roomId:_data.roomId}).toArray(function (err, items) {
      (err === null) ? _actions.success(items) : _actions.error();
    });
  }else{
    //console.log("roomId: getChat: " + _data.roomId);
    // they want game chat :. check if they have access
    db.games.find({ "_id":new ObjectID(_data.roomId) }).toArray(function (err, items) {
      if(findPlayerInGame(_data.userId, items[0].players)){ //players undefined
        // they are part of the game they can have it
        if(err === null){
          // get chat messages
          db.chatMsgs.find({roomId:_data.roomId}).toArray(function (err, items) {
            (err === null) ? _actions.success(items) : _actions.error();
          });
        }else{
          _actions.error();
        }
      }else{
        // player isnt part of the game - dont let them have it
        _actions.error();
      }
    });

  }

};

router.sendChat = function(_data, _actions){
  db.users.find({
    "_id":new ObjectID(_data.senderId)
  }).toArray(function (err, items) {
    // If there was a result
    //console.log(JSON.stringify(items[0]));
    if(err === null){
      // if the user can be in room given roomId

      var senderUsername = items[0].username;

      // they are in lobby chat so they are okay no matter who they are as long as they are loggedIn
      if( (_data.roomId == "1") && (items[0].online == "true") ){

        db.chatMsgs.insert({"sender":senderUsername, "message":_data.message, "roomId":_data.roomId}, function(err, result){
          return (err === null) ? _actions.success() : _actions.error();
        });

      }else{
        // check if they exist as a player in the given gameId
        db.games.find({ "_id":new ObjectID(_data.roomId) }).toArray(function (err, games) {
          if(err === null){
            if(findPlayerInGame(_data.senderId, games[0].players)){
              db.chatMsgs.insert({"sender":senderUsername, "message":_data.message, "roomId":_data.roomId}, function(err, result){
                //console.log("insert chat msg:" + result);
                return (err === null) ? _actions.success() : _actions.error();
              });
            }else{
              console.log("player not found");
              // player isnt part of the game - dont let them have it
              _actions.error();
            }
          }else{
            console.log("error in sendchat " + err);
            _actions.error();
          }

        });


      }

    }else{
      _actions.error();
    }

  });

};

// this should be in util js file
function findPlayerInGame(_playerId, _players){
  var playerInGame = false;
  for(var i = 0; i<_players.length; i++){
    //console.log("compare players: " + _players[i].id + " : " + _playerId);
    if(_players[i].id == _playerId){
      playerInGame = true;
    }
  }
  return playerInGame;
}

module.exports = router;