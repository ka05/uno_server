/**
 * Created by claytonherendeen on 10/12/15.
 */
define('game', ['jquery', 'knockout', 'coreData', 'util'], function ( $, ko, coreData, util) {
  var self = game = {},
      canSayUno = ko.observable(false),
      allPlayersPresent = ko.observable(false),
      gameObj = ko.observable();

  // TEMPORARY INIT
  initGame = function (_gameObj) {
    gameObj(new coreData.Game(_gameObj));
    util.userInGame(true);

    // continuously get chat msgs
    setInterval(function () {
      chat.getChatMsgs(gameObj().gameId(), coreData.gameChatMsgs);
    }, 1000);


    // set interval to fetch new game objects
    var getGameInterval = setInterval(function () {
      if(util.userInGame()){
        getGame(gameObj().gameId(), {
          success:function(_gameObj){
            var allPlayersInGame = true;
            // ensure all players are still in game
            for(var i = 0, j = _gameObj.players.length; i<j; i++){
              // if player is not inGame
              if( !_gameObj.players[i].inGame ){
                clearInterval(getGameInterval);
                allPlayersInGame = false; // for local logic
                allPlayersPresent(false);
                Materialize.toast(_gameObj.players[i].username + " has left the game so the game must end!", 3000);
                // due to materialize toast callback issue
                setTimeout(function(){
                  util.changeMainView("lobby");
                }, 3000);

              }
            }

            // if everyone is still here
            if(allPlayersInGame){
              // if its not turn update stuff so i know whats going on
              if(!gameObj().currPlayer().isMyTurn()){
                updateView(_gameObj);

                // if there is a winner

                if(_gameObj.winner != ""){
                  clearInterval(getGameInterval);
                  //displayWinner();
                  Materialize.toast(_gameObj.winner + ' has won this game!', 3000);
                  // ideally will want to send them back to lobby
                  setTimeout(function(){
                    util.changeMainView("lobby");
                  }, 3000);
                }
              }
            }

          },
          error:function(){
            console.log("error fetching game")
          }
        });
      }else{
        clearInterval(getGameInterval);
      }
    }, 1000);


    /* OLD WAY OF CLICK EVENTS
    var handCards = document.getElementById('player-hand').getElementsByTagName('div');
    for(var i = 0, j = handCards.length; i<j; i++){
      var cardCont = handCards[i];
      cardCont.addEventListener("load", function () {
        console.log("cardCont: " + cardCont);
        console.log("this: " + this);
        var card = this.contentDocument.getElementsByTagName("g");
        var cardName = card.getAttribute("data-card");
        console.log("cardName: " + cardName);
        console.log("card[0]: " + card[0]);
        card[0].addEventListener("click", function (item, event) {
          alert("clicked a card");
          validateMove();
        }, false);
      }, false);

    }
    */
  };

  updateView = function(_gameObj){
    // update game object in view
    gameObj(new coreData.Game(_gameObj));

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
        util.changeMainView("pre-game-lobby");
        util.preGameLobbyMsg("Waiting for other players, game will start when all players have joined.");

        coreData.gameSocket.emit('setPlayerInGame', { challengeId:challengeId, userId:coreData.currUser().id }, function(data) { });

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
                console.log("error retrieving challenge")
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
                console.log("gameobj: start:" + createGameRes.data);
                initGame(createGameRes.data);
                clearInterval(checkPlayersInGameRoomInterval);
              },
              error:function(){
                clearInterval(checkPlayersInGameRoomInterval);
                console.log("checkPlayersInGameRoom error");
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
      //console.log("getGameByChallengeId res: " + JSON.stringify(data.data));
      if(data.msg == "success"){
        console.log("joinGameCalled");
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
    coreData.gameSocket.emit('getGameById', { gameId:_gameId, userId:coreData.currUser().id }, function(data){
      //console.log("getGameById res: " + JSON.stringify(data.data));
      if(data.msg == "success"){
        _actions.success(data.data);
      }else{
        _actions.error();
      }
    });
  };



  function checkPlayersInGameRoom(_gameId, _actions){
    coreData.gameSocket.emit('checkPlayersInGameRoom', { gameId:_gameId, userId:coreData.currUser().id }, function(data){
      //console.log("getGameById res: " + JSON.stringify(data.data));
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
        //console.log("drawCard res: " + JSON.stringify(data.data));
        if (data.msg == "success") {
          console.log(data.data);
          updateView(data.data);
        } else {
          console.log("error drawing card");
        }
      });
    }else{
      Materialize.toast("Its not your turn", 3000);
    }
  };

  self.displayDraw = function (_card) {
    var cardCont = $('<div>').attr('data-cardname', _card.cardName).attr("class", "card-cont"),
      cardEle = $('#' + _card.svgName).clone();

    cardCont.append(cardEle);

    $('#player-hand').append(cardCont);
    addCardEvent(_card.svgName, function () {
      validateMove(this)
    });
  };

  addCardEvent = function (_cardId, _action) {
    var a = document.getElementById(_cardId);

    a.addEventListener("load", function () {
      var card = a.contentDocument.getElementsByTagName("g");
      card[0].addEventListener("click", function () {
        _action()
      }, false);
    }, false);
  };


  validateMove = function (item, event) {
    // make sure it is my turn ( obviously this check is done on the server as well )
    if (gameObj().currPlayer().isMyTurn()) {
      var svgName = event.target.getAttribute("data-id"),
          chosenColor = "";

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

  handleValidateMove = function(_reqData){
    coreData.gameSocket.emit('validateMove',
      _reqData,
      function (data) {
        //console.log("validate move res: " + JSON.stringify(data));
        if (data.msg == "success") {
          updateView(data.data);
        } else {
          Materialize.toast(data.msg, 3000);
          console.log("cant play that card");
        }
      });
  };


  // wildcard
  displayWildcardChoices = function (_callback) {
    // show modal to select color
    var $wildCardModal = $('#wildCardModal');
    $wildCardModal.openModal();

    $wildCardModal.find('a').each(function () {
      $(this).on("click", function () {

        // set color
        _callback($(this).attr("data-color"));

        $wildCardModal.closeModal();
      });
    });
  };


// GAME LOGIC


  self.sayUno = function () {
    if(gameObj().currPlayer().hand().length <= 2){
      coreData.gameSocket.emit('sayUno',
        {
          gameId:gameObj().gameId(),
          userId:coreData.currUser().id
        },
        function (data) {
          //console.log("sayUno: " + JSON.stringify(data.data));
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

  self.challengeUno = function(){
    coreData.gameSocket.emit('challengeUno',
      {
        gameId:gameObj().gameId(),
        userId:coreData.currUser().id
      },
      function (data) {
        //console.log("challengeUno: " + JSON.stringify(data.data));
        if (data.msg == "success") {
          updateView(data.data);
          Materialize.toast("Challenge successful", 3000);
        } else {
          Materialize.toast(data.msg, 3000);
        }
      });
  };


  // exit game
  self.quitGame = function () {

    coreData.gameSocket.emit('quitGame', {gameId: gameObj().gameId(), userId: coreData.currUser().id}, function (data) {
      //console.log("quit game res: " + JSON.stringify(data.data));
      if (data.msg == "success") {

        util.changeMainView("lobby"); // send back to lobby
        util.userInGame(false);
      } else {
        console.log("error quiting game");
      }
    });

  };

  // variables
  self.gameObj = gameObj;
  self.canSayUno = canSayUno;
  self.allPlayersPresent = allPlayersPresent;

  // functions
  self.validateMove = validateMove;
  self.draw = draw;


  return self;
});