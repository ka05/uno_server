/**
 * Created by claytonherendeen on 10/12/15.
 */

define('chat', ['jquery', 'knockout', 'coreData' ], function ( $, ko, coreData) {
  var self = chat = {};

  self.getChatMsgs = function(_roomId, _dataArray){
    coreData.mainSocket.emit("getChat", {roomId:_roomId, userId:coreData.currUser().id}, function(data){
      if(data.msg == "success"){
        if(data.length != _dataArray().length){
          _dataArray.removeAll();
          $.each(data.data, function(){
            console.log(this);
            _dataArray.push(new coreData.ChatMsg(this));
          });

          coreData.activeChatData({
            roomId:_roomId,
            length:_dataArray.length,
            msgs:_dataArray
          });

          // scroll chat down
          $('#chat-cont').scrollTop(document.getElementById("chat-cont").scrollHeight);
          //$('#game-chat-cont').scrollTop(document.getElementById("game-chat-cont").scrollHeight);
        }
      } else{
        Materialize.toast("error getting chat", 3000); // want to change this to a toast type message later
      }
    })
  };

  self.sendChat = function(){
    var $chatBtn = $('#chat-btn'),
      $msgInput = $('#chat-msg'),
      msg = $msgInput.val(),
      roomId = $chatBtn.attr("data-roomid");

    if(msg != ""){
      coreData.mainSocket.emit('chatMsg', {"senderId":coreData.currUser().id, "message":msg, "roomId":roomId}, function(data){
        if(data.msg == "success"){
          $msgInput.val(""); // reset field
        } else{
          Materialize.toast("error sending chat", 3000);
        }
      });

    }
  };

  return self;
});