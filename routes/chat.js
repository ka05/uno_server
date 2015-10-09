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


router.sendChat = function(_data, _actions){
  db.users.find({
    "_id":new ObjectID(_data.senderId)
  }).toArray(function (err, items) {
    // If there was a result
    console.log(JSON.stringify(items[0]));
    if(items[0]){
      // if the user can be in room given roomId

      // they are in lobby chat so they are okay no matter who they are as long as they are loggedIn
      if( (_data.roomId == "1") && (items[0].online == "true") ){

        db.chatMsgs.insert({"sender":items[0].username, "message":_data.message, "roomId":_data.roomId}, function(err, result){
          return (err === null) ? _actions.success() : _actions.error();
        });

      }else{
        // check if they exist as a player in the given gameId
        _actions.error();

      }

    }else{
      _actions.error();
    }

  });

};

module.exports = router;