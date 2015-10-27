/**
 * Created by claytonherendeen on 9/24/15.
 */
module.exports = function(db){
  var self = this,
      ObjectID = require('mongodb').ObjectID;
  //var db = mongo.db("mongodb://localhost:27017/uno", {native_parser:true});

  // bind method for mongo collections
  db.bind("chatMsgs");
  db.bind("users");
  db.bind("games");


  /*
   * get chat messages
   *
   * if roomId = 1 this means the user is trying to get chat messages for the lobby
   *
   * if roomId != 1 it has to be a gameId :. we have to validate
   * that they are even part of the game first then let them have the msgs
   */
  getChat = function(_data, _actions){
    var fifteenMinsAgo = new Date();
    fifteenMinsAgo.setMinutes(fifteenMinsAgo.getMinutes()-15);
    if(_data.roomId == "1"){
      // they want lobby chat :. they can have it
      db.chatMsgs.find({ $query:{roomId:_data.roomId, timestamp:{$gte:fifteenMinsAgo}}, $orderby: { _id:1 } }).toArray(function (err, items) {
        (err === null) ? _actions.success(items) : _actions.error();
      });
    }else{
      //console.log("roomId: getChat: " + _data.roomId);
      // they want game chat :. check if they have access
      db.games.find({ "_id":new ObjectID(_data.roomId) }).toArray(function (err, items) {
        if(items.length > 0){
          if(findPlayerInGame(_data.userId, items[0].players)){ //players undefined
            // they are part of the game they can have it
            if(err === null){
              // get chat messages 5 mins old only
              db.chatMsgs.find({ $query:{roomId:_data.roomId, timestamp:{$gte:fifteenMinsAgo} }, $orderby: { _id:1 } }).toArray(function (err, items) {
                (err === null) ? _actions.success(items) : _actions.error();
              });
            }else{
              _actions.error();
            }
          }else{
            // player isnt part of the game - dont let them have it
            _actions.error();
          }
        }else{
          _actions.error();
        }
      });
    }
  };

  /*
   * Send Chat Message
   *
   * if roomId = 1 this means the user is trying to send chat message for the lobby
   *
   * if roomId != 1 it has to be a gameId :. we have to validate
   * that they are even part of the game first
   */
  sendChat = function(_data, _actions){
    db.users.find({
      "_id":new ObjectID(_data.senderId)
    }).toArray(function (err, items) {
      // If there was a result
      if(err === null){
        // if the user can be in room given roomId
        var senderUsername = items[0].username;

        // they are in lobby chat so they are okay no matter who they are as long as they are loggedIn
        if( (_data.roomId == "1") && (items[0].online == "true") ){

          db.chatMsgs.insert({
            "sender":senderUsername,
            "message":_data.message,
            "roomId":_data.roomId,
            "timestamp":new Date()
          }, function(err, result){
            return (err === null) ? _actions.success() : _actions.error();
          });

        }else{
          // check if they exist as a player in the given gameId
          db.games.find({ "_id":new ObjectID(_data.roomId) }).toArray(function (err, games) {
            if(err === null){
              if (games.length > 0) {
                if(findPlayerInGame(_data.senderId, games[0].players)){
                  db.chatMsgs.insert({
                    "sender":senderUsername,
                    "message":_data.message,
                    "roomId":_data.roomId,
                    "timestamp":new Date()
                  }, function(err, result){
                    //console.log("insert chat msg:" + result);
                    return (err === null) ? _actions.success() : _actions.error();
                  });
                }else{
                  // player isnt part of the game - dont let them have it
                  console.log("player not found");
                  _actions.error();
                }
              }else{
                console.log("no results " + err);
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


  removeOldChat = function(_actions){
    var hourAgo = new Date();
    hourAgo.setMinutes(hourAgo.getMinutes()-60);

    db.chatMsgs.remove({$query:{timestamp:{$gte:hourAgo}}}, function(err){
      if(err === null) {
        _actions.success();
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

  // bind functions
  self.getChat = getChat;
  self.sendChat = sendChat;
  self.removeOldChat = removeOldChat;


  return self;
};