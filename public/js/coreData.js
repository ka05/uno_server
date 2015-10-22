/**
 * Created by claytonherendeen on 10/12/15.
 */
define('coreData', ['jquery', 'knockout', 'socketio'], function ( $, ko, io) {
  var self = coreData = {},

    // socket io connections
    socket = io(),
    mainSocket = io.connect('http://localhost:3000/login'),
    gameSocket = io.connect('http://localhost:3000/game'),

    // LOBBY STUFF
    activeUsers = ko.observableArray(),
    receivedChallenges = ko.observableArray(),
    sentChallenges = ko.observableArray(),
    chatMsgs = ko.observableArray(),
    currUser = ko.observable(),

    // GAME STUFF
    gameObj = {},
    gameChatMsgs = ko.observableArray();


  self.User = function(_data){
    this.id = _data._id;
    this.email = _data.email;
    this.username = _data.username;
    this.online = _data.online;
  };

  self.ChatMsg = function(_data){
    this.sender = _data.sender;
    this.message = _data.message;
    this.senderColor = getSenderColor(_data.sender);
  };

  // received Challenges
  self.RecChallenge = function(_data){
    this.id = _data.id;
    this.challengeId = _data.challengeId;
    this.usersChallenged = _data.usersChallenged;
    this.timestamp = _data.timestamp;
    this.challenger = _data.challenger;
    this.status = _data.status;
    this.challengeClass = getChallengeClass(_data.status);
    this.challengeText = createChallengeRecText(_data);
    //this.startGameVisible = checkStartGameVisible(_data.status);
    //this.openGameVisible = checkJoinGameVisible(_data.status);
  };

  self.SentChallenge = function(_data){
    this.id = _data.id;
    this.challengeId = _data.challengeId;
    this.usersChallenged = _data.usersChallenged;
    this.usernamesChallenged = getUsernamesChallenged(_data);
    this.timestamp = _data.timestamp;
    this.challenger = _data.challenger;
    this.status = _data.status;
    this.challengeClass = getChallengeClass(_data.status);
    this.startGameVisible = checkStartGameVisible(_data.status);
    this.challengeText = createChallengeSentText(_data);
    //this.openGameVisible = checkJoinGameVisible(_data.status);
  };

  Card = function(_data){
    this.cardName = _data.cardName; // name of card (ex: Red 2)
    this.svgName = _data.svgName; // name of svg to be used
    this.color = _data.color; // name of svg to be used
    this.value = _data.value; // name of svg to be used
    this.count = _data.count; // number of duplicated cards in deck
  };

  GamePlayerCurrUser = function(_playerData){
    this.id = _playerData.id;
    this.username = _playerData.username;
    this.hand = ko.observableArray(_playerData.hand);
    this.calledUno = _playerData.calledUno;
    this.inGame = _playerData.inGame;
    this.isMyTurn = ko.observable(_playerData.isMyTurn);
    this.playerClass = ko.observable(getPlayerClass(_playerData.isMyTurn));
  };

  GamePlayer = function(_playerData){
    this.id = _playerData.id;
    this.username = _playerData.username;
    this.calledUno = _playerData.calledUno;
    this.cardCount = _playerData.cardCount;
    this.isMyTurn = ko.observable(_playerData.isMyTurn);
    this.playerClass = ko.observable(getPlayerClass(_playerData.isMyTurn) );
  };

  self.Game = function(_gameObj){
    this.gameId = ko.observable(_gameObj._id);
    this.discardPile = ko.observableArray(_gameObj.discardPile);
    //this.activePlayer = new GamePlayer(_gameObj.activePlayer);
    this.gamePlayers = ko.observableArray( popPlayersArr(_gameObj.players) );
    this.currPlayer = ko.observable( getCurrPlayer(_gameObj.players) );
    this.currGC = ko.observable( _gameObj.discardPile[_gameObj.discardPile.length - 1].svgName ); // current discard pile card
    this.prevGC = ko.observable( getPrevGC(_gameObj.discardPile) );
    this.currColor = ko.observable( _gameObj.discardPile[_gameObj.discardPile.length - 1].color );
  };

  getPrevGC = function(_discardPile){
    var card = _discardPile[_discardPile.length - 2];
    return ( !( (_discardPile.length - 2) < 0) ) ? card.svgName : "cb";
  };

  popPlayersArr = function(_players){
    var gamePlayers = [];
    for(var i = 0, j = _players.length; i < j; i++){
      // only add other players that arent current User to players array
      if(_players[i].username != currUser().username){
        gamePlayers.push(new GamePlayer(_players[i]));
      }
    }
    return gamePlayers;
  };

  getCurrPlayer = function(_players){
    var currPlayer = {};
    for(var i = 0, j = _players.length; i < j; i++){
      // only add other players that arent current User to players array
      if(_players[i].username == currUser().username){
        currPlayer = new GamePlayerCurrUser(_players[i]);
      }
    }
    return currPlayer;
  };

  getUsernamesChallenged = function(_data){
    var usernamesChallenged = [];
    for(var i = 0, j = _data.usersChallenged.length; i < j; i++){
      usernamesChallenged.push( _data.usersChallenged[i].username );
    }
    return usernamesChallenged.join(", ");
  };

  createChallengeSentText = function(_data){
    return 'You challenged ' + getUsernamesChallenged(_data) + ' (' + _data.status + ')';
  };

  createChallengeRecText = function(_data){
    return 'Challenge from ' + _data.challenger + ' (' + _data.status + ')'
  };

  // UI Manipulation

  getSenderColor = function(_sender){
    if(_sender == coreData.currUser().username){
      return "me-txt";
    }else{
      return "sender-txt";
    }
  };
  checkStartGameVisible = function(_status){
    return (_status == "accepted" )
  };
  checkJoinGameVisible = function(_status){
    return (_status == "ready")
  };
  getChallengeClass = function(_status){
    switch(_status){
      case "cancelled":
        return "cancelled-item";
        break;
      case "accepted":
        return "accepted-item";
        break;
      case "declined":
        return "declined-item";
        break;
      case "pending":
        return "pending-item";
        break;
      case "ready":
        return "ready-item";
        break;
    }
  };
  getPlayerClass = function(_isMyTurn){
    return (_isMyTurn) ? "my-turn" : "";
  };

  self.GamePlayerCurrUser = GamePlayerCurrUser;
  self.GamePlayer = GamePlayer;
  self.Card = Card;

  self.socket = socket;
  self.mainSocket = mainSocket;
  self.gameSocket = gameSocket;
  self.activeUsers = activeUsers;
  self.receivedChallenges = receivedChallenges;
  self.sentChallenges = sentChallenges;
  self.chatMsgs = chatMsgs;
  self.currUser = currUser;
  self.gameObj = gameObj;
  self.gameChatMsgs = gameChatMsgs;

  return self;

});