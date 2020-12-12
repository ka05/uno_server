/**
 * Created by claytonherendeen on 10/12/15.
 */

define('chat', ['jquery', 'knockout', 'coreData', 'util' ], function ( $, ko, coreData) {
  var self = chat = {};

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

  self.sendChatViaEnterKey = function(item, event){
    var sendBtnId = event.target.getAttribute("data-btn-id");

    if (event.keyCode == 13) {
      // Enter Keypress
      chat.sendChat(sendBtnId);
    }
  };


  return self;
});