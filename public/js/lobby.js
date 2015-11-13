/**
 * Created by claytonherendeen on 10/12/15.
 */
define('lobby', ['jquery', 'knockout', 'coreData', 'util'], function ( $, ko, coreData, util) {
  var self = lobby = {},

    challengeModalHeaderMsg = ko.observable(""),
    challengeFooterTmpl = ko.observable("blank-tmpl"),
    challengeModalTitle = ko.observable(),
    challengeModalBody = ko.observable("blank-tmpl"),
    currentSentChallenge = ko.observable(),

    // confirmation modal
    confirmFooterTmpl = ko.observable("blank-tmpl"),
    confirmModalHeaderMsg = ko.observable(""),
    usersChallenged = ko.observableArray("");


  // confirm quiting game
  self.confirmQuitGame = function () {
    var $confirmModal = $('#confirmModal');
    confirmModalHeaderMsg("Are you sure you want to quit?");
    confirmFooterTmpl("confirm-quit-footer-tmpl");
    $confirmModal.openModal();

    $('#btn-quit-game').on("click", function () {
      $confirmModal.closeModal();
    });
  };

  // CHALLENGE STUFF

  self.promptChallengeResponse = function(data, event){
    var challengeIndex = event.target.getAttribute("data-index"),
        currChallenge = coreData.receivedChallenges()[challengeIndex];

    if( (currChallenge.status == "cancelled" ) || (currChallenge.status == "declined") ){
      Materialize.toast("This Challenge is " + currChallenge.status + ", you cannot cancel it.", 4000);
    }else{

      var $challengeRespModal = $('#challengeRespModal'),
        challengeId = currChallenge.id,
        challengerName = currChallenge.challenger.username;

      if( (currChallenge.status == "ready") || (currChallenge.status == "accepted") ) {

        // allow them to cancel
        challengeFooterTmpl('challenge-cancel-footer-tmpl');
        challengeModalHeaderMsg("Cancel your Challenge from: " + challengerName);
        $challengeRespModal.openModal();

        $('#btn-cancel-challenge').on("click", function(){
          // declined challenge
          handleChallenge(challengeId, 0);
        });

      }else if(currChallenge.status == "pending"){
        // only show modal if status is sent
        challengeFooterTmpl('challenge-resp-footer-tmpl');
        challengeModalHeaderMsg("Accept or Decline Challenge from: " + challengerName);
        $challengeRespModal.openModal();

        $('#btn-accept-challenge').on("click", function(){
          // accepted challenge
          handleChallenge(challengeId, 1);

          // set activeChallengeId
          util.activeChallengeId(challengeId);

          // show pre-game-lobby page
          util.showPreGameLobby("Please wait for host to start game...");

          // start setInterval for getting challenge object
          var getChallengeInterval = setInterval(
            function(){
              util.getChallenge(util.activeChallengeId(), {
                success:function(challenge){
                  if(challenge.status == "all responded"){

                    // check if game exists yet
                    coreData.gameSocket.emit('getGameByChallengeId', { challengeId:challenge.id, userId:coreData.currUser().id }, function(data){

                      if(data.msg == "success"){

                        clearInterval(getChallengeInterval);
                        // set current player inGame=true
                        coreData.gameSocket.emit('setPlayerInGame', { challengeId:challenge.id, userId:coreData.currUser().id }, function(data) {  });
                        // then host has started the game so send them to the game room
                        game.joinGame(challenge.id);
                      }else{
                        console.log("error joining game");
                      }
                    });

                  }else if(challenge.status == "cancelled"){
                    clearInterval(getChallengeInterval);
                    util.changeMainView("lobby");
                    Materialize.toast('Sorry this challenge was cancelled.', 3000);
                  }
                },
                error:function(){
                  clearInterval(getChallengeInterval);
                  console.log("error retrieving challenge")
                }
              });
            }, 1000);
        });
        $('#btn-decline-challenge').on("click", function(){
          // declined challenge
          handleChallenge(challengeId, 2);
        });
      }
    }
  };

  // modal for checking up on and cancelling a challenge or starting a game if everyone has responded
  self.promptCancelChallenge = function(data, event){
    // cant cancel it because its already dead
    var index = event.target.getAttribute("data-index");

    currentSentChallenge(coreData.sentChallenges()[index]);
    var currStatus = currentSentChallenge().status;
    if( (currStatus == "cancelled") || (currStatus == "declined") ){
      Materialize.toast('This Challenge is ' + currStatus + ", you cannot cancel it.", 4000);
    }else{
      // only show modal if status is sent
      // if status is declined remove?
      var $challengeRespModal = $('#challengeRespModal');
      challengeModalHeaderMsg('Cancel your challenge to: ' + currentSentChallenge().usernamesChallenged);
      challengeModalBody("challenger-response-modal");
      challengeFooterTmpl('challenge-cancel-footer-tmpl');
      $challengeRespModal.openModal();

      var getChallengeInterval = setInterval(
        function(){
          util.getChallenge(currentSentChallenge().id, {
            success:function(challenge){
              currentSentChallenge(challenge);
            },
            error:function(){
              console.log("error retrieving current sent challenge");
            }
          });
        }, 1000);

      $challengeRespModal.find('a.modal-close').on('click', function(){
        clearInterval(getChallengeInterval);
      });

      $('#btn-cancel-challenge').on("click", function(){
        // cancel challenge
        handleChallenge(currentSentChallenge().id, 0);
        clearInterval(getChallengeInterval);
      });
    }
  };

  // modal for challenging others
  self.showSendChallengeModal = function(data, event){
    var $challengeModal = $('#challengeUserModal'),
      $challengeBtn = $('#btn-challenge');

    $challengeModal.openModal();
    util.challengeModalOpen(true);

    $challengeModal.find('input[type=checkbox]').each(function(){
      $(this).on("change", function(){
        var oneChecked = false;
        $("#multiplayer").find("input[type=checkbox]").each(function(){
          if($(this).is(":checked")){
            oneChecked = true;
          }
        });

        // if at least one is checked the enable button
        if(oneChecked){
          // if it is disabled currently
          if($challengeBtn.hasClass('disabled')) {
            // enable it
            $challengeBtn.removeClass('disabled');
          }
        }
        // nothing is checked
        else{
          // if it is currently enabled ( doesnt have disabled class )
          if(!$challengeBtn.hasClass('disabled')) {
            // disable it
            $challengeBtn.addClass('disabled');
          }
        }

      });
    });

    $challengeBtn.unbind('click');
    $challengeBtn.on('click', function(){
      usersChallenged.removeAll(); // empty it first
      $("#multiplayer").find("input[type=checkbox]").each(function() {
        if ($(this).is(":checked")) {
          usersChallenged.push($(this).attr("id"));
        }
      });

      if( !($challengeBtn.hasClass('disabled')) ){
        sendChallenge({
          usersChallenged:usersChallenged(),
          challengerId:coreData.currUser().id
        }, {
          success:function(){
            Materialize.toast("Challenge sent", 3000);
          },
          error:function(){
            Materialize.toast("Error sending challenge", 3000);
          }
        });
        $('#challengeUserModal').closeModal();
        util.challengeModalOpen(false);
        $challengeBtn.addClass('disabled');
      }
    });

    $challengeModal.find('a.modal-close').on('click', function(){
      util.challengeModalOpen(false);
      $challengeBtn.addClass('disabled');
    });

  };

  sendChallenge = function(_data, _actions){
    coreData.mainSocket.emit('sendChallenge',
      {
        'challengerId': _data.challengerId,
        'usersChallenged': _data.usersChallenged
      }, function(res){
      if(res.msg == 'success'){
        (res.msg == 'success') ? _actions.success() : _actions.error();
      }
    });
  };

  self.cancelChallenge = function(item, event){
    var challengeId = event.target.getAttribute("data-id");

    handleChallenge(challengeId, 0); // cancel challenge
    Materialize.toast("Challenge cancelled", 3000);
    util.changeMainView("lobby");
  };

  handleChallenge = function(_challengeId, _choice){
    coreData.mainSocket.emit('handleChallenge',
      {
        'id': _challengeId,
        'userId':coreData.currUser().id,
        'choice':_choice
      }, function(res){
        if(res.msg == 'success'){
          $('#challengeRespModal').closeModal();
        }else{
          console.log("handle challenge error");
          $('#challengeRespModal').closeModal();
        }
      });

  };

  // variables
  self.challengeModalHeaderMsg = challengeModalHeaderMsg;
  self.challengeModalTitle = challengeModalTitle;
  self.confirmFooterTmpl = confirmFooterTmpl;
  self.confirmModalHeaderMsg = confirmModalHeaderMsg;
  self.challengeFooterTmpl = challengeFooterTmpl;
  self.usersChallenged = usersChallenged;
  self.challengeModalBody = challengeModalBody;
  self.currentSentChallenge = currentSentChallenge;


  // functions
  self.sendChallenge = sendChallenge;
  self.handleChallenge = handleChallenge;

  return self;
});