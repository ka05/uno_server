/**
 * Created by claytonherendeen on 10/12/15.
 */
define('game', ['jquery', 'knockout', 'coreData', 'util'], function ( $, ko, coreData, util) {
  var self = game = {},
      canSayUno = ko.observable(false),
      allPlayersPresent = ko.observable(false),
      gameObj = ko.observable(),
      currGameObj,
      gamePlayers = ko.observableArray(),
      getGameChatInterval = null,
      getGameInterval = null,
      handOffset = ko.observable(0);


  function getOffset(){
    return (
      (gameObj() != null) ?
        ( $(window).width() - 20 - (gameObj().currPlayer().hand().length * 6.4) )  / ( gameObj().currPlayer().hand().length ) : 0
    );
  }

  // TEMPORARY INIT
  initGame = function (_gameObj) {
    gameObj(new coreData.Game(_gameObj));
    util.userInGame(true);

    coreData.activeChatData({
      roomId:_gameObj._id,
      length:0,
      msgs:ko.observableArray()
    });

    // continuously get chat msgs
    getGameChatInterval = setInterval(function () {
      if(util.userInGame()){
        // check new msgs
        chat.getChatMsgs(gameObj().gameId(), coreData.gameChatMsgs);
      }
    }, 1000);

    $( window ).unbind( 'beforeunload');
    $( window ).bind( 'beforeunload' , function( event ) {
      quitGame();
    } );

    showHotKeyInfo();

    // disable these when chatting

    //include indicator on chat icon

    $(window).off('keyup'); // ensure im not recreating a new event listener


    handOffset(getOffset());

    $(window).on('resize', function(){
      handOffset( getOffset() );
    });

    // set interval to fetch new game objects
    getGameInterval = setInterval(function () {
      if(util.userInGame()){
        getGame(gameObj().gameId(), {
          success:function(_gameObj){
            var allPlayersInGame = true;
            // ensure all players are still in game
            for(var i = 0, j = _gameObj.players.length; i<j; i++){
              // if player is not inGame
              if( !_gameObj.players[i].inGame ){
                clearInterval(getGameInterval); // clear get game interval
                clearInterval(getGameChatInterval); // clear get game chat interval
                allPlayersInGame = false; // for local logic
                allPlayersPresent(false);
                util.userInGame(false);
                Materialize.toast(_gameObj.players[i].username + " has left the game so the game must end!", 3000);
                // due to materialize toast callback issue
                quitGame();
              }
            }

            // if everyone is still here
            if(allPlayersInGame){


              // if something has changed
              if(JSON.stringify(currGameObj) !== JSON.stringify(_gameObj)){
                // if its not my turn update stuff so i know whats going on
                if( ( !gameObj().currPlayer().isMyTurn() ) ||
                  ( gameObj().currPlayer().hand().length == 0 ) ){

                  updateView(_gameObj);

                  // if there is a winner
                  checkWinner(_gameObj);
                }else{
                  // it is my turn just check for if someone said uno
                  coreData.gamePlayers(coreData.popPlayersArr(_gameObj.players));

                  // update my hand if the length differs from before
                  if(gameObj().currPlayer().hand().length != (coreData.getCurrGamePlayer(_gameObj.players)).hand.length){
                    updateView(_gameObj);
                  }
                }
              }
              // nothing changed in the new game object
              else{
                // check if there is a winner
                checkWinner(_gameObj);
              }
            }
          },
          error:function(){
            console.log("error fetching game");
          }
        });
      }else{
        clearInterval(getGameInterval);
      }
    }, 1000);

  };

  checkWinner = function(_gameObj){
    if(_gameObj.winner != ""){
      clearInterval(getGameInterval); // clear get game interval
      clearInterval(getGameChatInterval); // clear get game chat interval
      util.userInGame(false);
      Materialize.toast(_gameObj.winner + ' has won this game!', 3000);
      // ideally will want to send them back to lobby
      setTimeout(function(){
        closeGame();
      }, 3000);
    }
  };

  updateView = function(_gameObj){
    // update game object in view
    gameObj(new coreData.Game(_gameObj));
    currGameObj = _gameObj;
    coreData.gamePlayers(coreData.popPlayersArr(_gameObj.players));

    handOffset( getOffset() );

    if(gameObj().currPlayer().hand().length == 1){
      canSayUno(true);
    }else{
      canSayUno(false);
    }
  };

  // creates game and launches it notifying other players
  self.startGame = function(data, event){
    var challengeId = event.target.getAttribute("data-id");
    util.activeChallengeId(challengeId);
    // make call to server to create game
    coreData.gameSocket.emit('createGame', { challengeId:challengeId, userId:coreData.currUser().id }, function(createGameRes){

      // if game created successfully
      if(createGameRes.msg == "success"){
        // send to pre game lobby and have them wait for other players
        util.showPreGameLobby("Waiting for other players, game will start when all players have joined.");

        // start setInterval for getting challenge object
        var getChallengeInterval = setInterval(
          function(){
            util.getChallenge(util.activeChallengeId(), {
              success:function(challenge){
                if(challenge.status == "cancelled"){
                  util.changeMainView("lobby");
                  Materialize.toast('Sorry someone has cancelled this challenge.', 3000);
                  clearInterval(getChallengeInterval);
                }
                if(allPlayersPresent()){
                  clearInterval(getChallengeInterval);
                }
              },
              error:function(){
                clearInterval(getChallengeInterval);
                console.log("error retrieving challenge");
              }
            });
          }, 1000);

        // interval for checking if all players have joined yet
        var checkPlayersInGameRoomInterval = setInterval(
          function(){
            checkPlayersInGameRoom(createGameRes.data._id, {
              success:function(result){
                // all players in game so open game view
                allPlayersPresent(true);
                util.changeMainView("game");
                initGame(createGameRes.data);
                clearInterval(checkPlayersInGameRoomInterval);
              },
              error:function(error){
                //clearInterval(checkPlayersInGameRoomInterval);
                console.log("checkPlayersInGameRoom: " + error);
              }
            });
          }, 1000);

      }else{
        console.log("error creating game");
      }
    });
  };

  // when user challenged joins
  self.joinGame = function(_challengeId){
    //var challengeId = event.target.getAttribute("data-id");
    coreData.gameSocket.emit('getGameByChallengeId', { challengeId:_challengeId, userId:coreData.currUser().id }, function(data){
      if(data.msg == "success"){
        // open game view
        util.changeMainView("game");
        initGame(data.data);
      }else{
        console.log("error joining game");
      }
    });
  };

  // periodically get game
  getGame = function(_gameId, _actions){
    coreData.gameSocket.emit('getGameByGameId', { gameId:_gameId, userId:coreData.currUser().id }, function(data){
      if(data.msg == "success"){
        _actions.success(data.data);
      }else{
        _actions.error();
      }
    });
  };

  self.enableHotKeys = function(){
    $(window).on('keyup', function (e) {
      var U_KEY = 85, // U key
        C_KEY = 67; // C Key
      if(e.keyCode == U_KEY) {
        // call uno
        self.sayUno();
      }
      if(e.keyCode == C_KEY){
        //challenge uno
        self.challengeUno();
      }
    });
  };

  function checkPlayersInGameRoom(_gameId, _actions){
    coreData.gameSocket.emit('checkPlayersInGameRoom', { gameId:_gameId, userId:coreData.currUser().id }, function(data){
      if(data.msg == "success"){
        _actions.success(data);
      }else{
        _actions.error(data.msg);
      }
    });
  }

  // draw a card
  draw = function () {
    // check if its my turn
    if (gameObj().currPlayer().isMyTurn()) {
      coreData.gameSocket.emit('drawCard', {gameId: gameObj().gameId(), userId: coreData.currUser().id}, function (data) {
        if (data.msg == "success") {
          updateView(data.data);
        } else {
          console.log("error drawing card");
        }
      });
    }else{
      Materialize.toast("Its not your turn", 3000);
    }
  };

  // validates that the clicked card was a vild card to play
  validateMove = function (item, event) {
    // make sure it is my turn
    // ( obviously more detailed checking is done on the server as well )
    if (gameObj().currPlayer().isMyTurn()) {
      var svgName = event.target.getAttribute("data-id");

      // if it is wild or wild draw4
      if(svgName == "ww" || svgName == "wd"){
        displayWildcardChoices(function(_color){
          handleValidateMove({
            gameId: gameObj().gameId(),
            userId: coreData.currUser().id,
            svgName:svgName,
            chosenColor:_color
          });
        });
      }else{
        // regular card - play it
        handleValidateMove({
          gameId: gameObj().gameId(),
          userId: coreData.currUser().id,
          svgName:svgName
        });
      }
    }else{
      Materialize.toast("Its not your turn", 3000);
    }
  };

  // handle call to validate move
  handleValidateMove = function(_reqData){
    coreData.gameSocket.emit('validateMove',
      _reqData,
      function (data) {
        if (data.msg == "success") {
          updateView(data.data);
        } else {
          Materialize.toast(data.msg, 3000);
          console.log("cant play that card");
        }
      });
  };


  // wildcard color choice modal
  displayWildcardChoices = function (_callback) {
    // show modal to select color
    var $wildCardModal = $('#wildCardModal');
    $wildCardModal.openModal();

    $wildCardModal.find('a').each(function () {
      $(this).unbind('click');
      $(this).on("click", function () {
        // set color
        _callback($(this).attr("data-color"));
        $wildCardModal.closeModal();
      });
    });
  };
/*
  // pass your turn - choose not to play a card
  self.pass = function () {
    coreData.gameSocket.emit('pass',
      {
        gameId:gameObj().gameId(),
        userId:coreData.currUser().id
      },
      function (data) {
        if (data.msg == "success") {
          updateView(data.data);
          Materialize.toast("You said Uno", 3000);
        } else {
          Materialize.toast(data.msg, 3000);
        }
      });
  };
*/
  // say uno ( when you have one card left )
  self.sayUno = function () {
    if(gameObj().currPlayer().hand().length <= 2){
      coreData.gameSocket.emit('sayUno',
        {
          gameId:gameObj().gameId(),
          userId:coreData.currUser().id
        },
        function (data) {
          if (data.msg == "success") {
            updateView(data.data);
            Materialize.toast("You said Uno", 3000);
          } else {
            Materialize.toast(data.msg, 3000);
          }
        });
    }else{
      Materialize.toast("You have more than 2 cards.", 3000);
    }
  };

  // challenge someone not saying uno
  self.challengeUno = function(){
    coreData.gameSocket.emit('challengeUno',
      {
        gameId:gameObj().gameId(),
        userId:coreData.currUser().id
      },
      function (data) {
        if (data.msg == "success") {
          updateView(data.data);
          Materialize.toast("Challenge successful", 3000);
        } else {
          Materialize.toast(data.msg, 3000);
        }
      });
  };


  // exit game
  quitGame = function () {
    coreData.gameSocket.emit('quitGame',
      {
        gameId: gameObj().gameId(),
        userId: coreData.currUser().id
      }, function (data) {
        if (data.msg == "success") {
          closeGame();
        } else {
          console.log("error quiting game");
        }
      });
  };

  closeGame = function(){
    util.userInGame(false);
    $(window).unbind( 'beforeunload');
    $(window).off('keyup');
    gameObj(null); // empty game object
    util.changeMainView("lobby"); // send back to lobby
  };

  function showHotKeyInfo(){
    // check in local storage
    if(!localStorage.getItem("showHotKeyInfo") ){
      Materialize.toast($('<p>Hot Keys: "U" - Call UNO "C" - Challenge</p>').append('<input type="button" value="Dont show again?" class="waves-effect waves-green btn-flat white-text" data-user-pref="game-hotkeys" onclick="_uno.util.saveUserPreference(this)"/>'), 4000);
    }
  }


  // variables
  self.gameObj = gameObj;
  self.canSayUno = canSayUno;
  self.allPlayersPresent = allPlayersPresent;

  // functions
  self.validateMove = validateMove;
  self.draw = draw;
  self.quitGame = quitGame;
  self.handOffset = handOffset;

  return self;
});