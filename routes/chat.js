/**
 * Created by claytonherendeen on 9/24/15.
 */
module.exports = function (db) {
  const self = this,
    moment = require('moment'),
    ObjectID = require('mongodb').ObjectID;

  const {
    Game,
    ChatMessage,
    User,
  } = db;

  /*
   * get chat messages
   *
   * if roomId = 1 this means the user is trying to get chat messages for the lobby
   *
   * if roomId != 1 it has to be a gameId :. we have to validate
   * that they are even part of the game first then let them have the msgs
   */
  const getChat = function (_data, _actions) {

    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    const fifteenMinsAgo = new Date();
    fifteenMinsAgo.setMinutes(fifteenMinsAgo.getMinutes() - 15);
    const time = moment(fifteenMinsAgo).format('MM/DD/YYYY h:mm:ss');

    if (_data.roomId === "1") {
      // they want lobby chat :. they can have it
      // TODO: fix data coming from android client
      ChatMessage.find({
        $query: {roomId: _data.roomId, timestamp: {$gte: time}},
        $orderby: {_id: 1}
      }, function (err, items) {
        (err === null) ? _actions.success(items) : _actions.error();
      });
    } else {
      //console.log("roomId: getChat: " + _data.roomId);
      // they want game chat :. check if they have access
      Game.find({"_id": new ObjectID(_data.roomId)}, function (err, items) {
        if (items.length > 0) {
          if (findPlayerInGame(_data.userId, items[0].players)) { //players undefined
            // they are part of the game they can have it
            if (err === null) {
              // get chat messages 5 mins old only
              ChatMessage.find({$query: {roomId: _data.roomId}, $orderby: {_id: 1}}, function (err, items) {
                (err === null) ? _actions.success(items) : _actions.error();
              });
            } else {
              _actions.error();
            }
          } else {
            // player isnt part of the game - dont let them have it
            _actions.error();
          }
        } else {
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
  const sendChat = function (_data, _actions) {

    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    User.findOne({
      "_id": new ObjectID(_data.senderId)
    }, function (err, item) {
      // If there was a result
      if (err === null && item) {
        // if the user can be in room given roomId
        const senderUsername = item.username;

        // they are in lobby chat so they are okay no matter who they are as long as they are loggedIn
        if ((_data.roomId === "1") && item.online) {
          const chatMessage = createChatMessage(
            senderUsername,
            _data.message,
            _data.roomId
          );
          chatMessage.save(function (err) {
            return (err === null) ? _actions.success() : _actions.error();
          });
        } else {
          if (_data.roomId !== "1") {
            // check if they exist as a player in the given gameId
            Game.findOne({"_id": new ObjectID(_data.roomId)}, function (err, item) {
              if (err === null) {
                if (item) {
                  if (findPlayerInGame(_data.senderId, item.players)) {
                    const chatMessage = createChatMessage(
                      senderUsername,
                      _data.message,
                      _data.roomId
                    );
                    chatMessage.save(function (err) {
                      return (err === null) ? _actions.success() : _actions.error();
                    });
                  } else {
                    // player isn't part of the game - dont let them have it
                    console.log("player not found");
                    _actions.error();
                  }
                } else {
                  console.log("no results " + err);
                  _actions.error();
                }
              } else {
                console.log("error in sendchat " + err);
                _actions.error();
              }
            });
          }
        }
      } else {
        _actions.error();
      }
    });
  };

  const createChatMessage = function (sender, message, roomId) {
    return new ChatMessage({
      "sender": sender,
      "message": message,
      "roomId": roomId,
      "timestamp": moment().format('MM/DD/YYYY h:mm:ss')
    });
  };

  const removeOldChat = function (_actions) {
    const hourAgo = new Date();
    hourAgo.setMinutes(hourAgo.getMinutes() - 60);

    ChatMessage.remove({$query: {timestamp: {$gte: hourAgo}}}, function (err) {
      if (err === null) {
        _actions.success();
      } else {
        _actions.error();
      }
    });
  };

  // this should be in util js file
  function findPlayerInGame(_playerId, _players) {
    let playerInGame = false;
    for (let i = 0; i < _players.length; i++) {
      if (_players[i].id === _playerId) {
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