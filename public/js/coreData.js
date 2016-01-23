/**
 * Created by claytonherendeen on 10/12/15.
 */
define('coreData', ['jquery', 'knockout', 'socketio'], function ( $, ko, io) {
  var self = coreData = {},
    //uri = "192.168.2.13";
    //uri = "ccd.student.rit.edu";
    //uri = "localhost",
    uri = "uno-server.herokuapp.com",
    // socket io connections
    socket = io(),
    mainSocket = io.connect('http://' + uri + '/login'),
    gameSocket = io.connect('http://' + uri + '/game'),

    // LOBBY STUFF
    activeUsers = ko.observableArray(),
    activeChatData = ko.observable({
      length:0,
        msgs:ko.observableArray(),
      roomId:1
    }),
    receivedChallenges = ko.observableArray(),
    sentChallenges = ko.observableArray(),
    chatMsgs = ko.observableArray(),
    currUser = ko.observable(),

    // GAME STUFF
    gameObj = {},
    gamePlayers = ko.observableArray(),
    gameChatMsgs = ko.observableArray(),
    gameInstructions = [
      {
        heading:"Setup",
        content:"The game is for 2-10 players, ages 7 and over. Every player starts with seven cards, and they are dealt face down. The rest of the cards are placed in a Draw Pile face down. Next to the pile a space should be designated for a Discard Pile. The top card should be placed in the Discard Pile, and the game begins!"
      },
      {
        heading:"Game Play",
        content:"The first player is normally the player to the left of the dealer (you can also choose the youngest player) and gameplay usually follows a clockwise direction. Every player views his/her cards and tries to match the card in the Discard Pile.You have to match either by the number, color, or the symbol/Action. For instance, if the Discard Pile has a red card that is an 8 you have to place either a red card or a card with an 8 on it. You can also play a Wild card (which can alter current color in play). If the player has no matches or they choose not to play any of their cards even though they might have a match, they must draw a card from the Draw pile. If that card can be played, play it. Otherwise, the game moves on to the next person in turn. You can also play a Wild card, or a Wild Draw Four card on your turn.",
        note:"Note: If the first card turned up from the Draw Pile (to form the Discard Pile) is an Action card, the Action from that card applies and must be carried out. The exceptions are if the Wild or Wild Draw Four cards are turned up, in which case – Return them to the Draw Pile, shuffle them, and turn over a new card. At any time, if the Draw Pile becomes depleted and no one has yet won the round, take the Discard Pile, shuffle it, and turn it over to regenerate a new Draw Pile. There are two different ways to play regarding drawing new cards. The Official Uno Rules states that after a card is drawn the player can discard it if it is a match, or if not, play passes on to the next player. The other type is where players continue to draw cards until they have a match, even if it is 10 times. The game continues until a player has one card left. The moment a player has just one card they must yell “UNO!”. If they are caught not saying “Uno” by another player before any card has been played, the player must draw two new cards. Once a player has no cards remaining, the game round is over, points are scored, and the game begins over again. Normally, everyone tries to be the first one to achieve 500 points, but you can also choose whatever points number to win the game, as long as everyone agrees to it."
      },
      {
        heading:"Action Cards",
        content:"Besides the number cards, there are several other cards that help mix up the game. These are called Action or Symbol cards.",
        subContent:[
          {
            text:"Reverse – If going clockwise, switch to counterclockwise or vice versa."
          },
          {
            text:"Skip – When a player places this card, the next player has to skip their turn. If turned up at the beginning, the first player loses his/her turn."
          },
          {
            text:"Draw Two – When a person places this card, the next player will have to pick up two cards and forfeit his/her turn."
          },
          {
            text:"Wild – This card represents all four colors, and can be placed on any card. The player has to state which color it will represent for the next player. It can be played regardless of whether another card is available."
          },
          {
            text:"Wild Draw Four – This acts just like the wild card except that the next player also has to draw four cards. With this card, you must have no other alternative cards to play that matches the color of the card previously played. If you play this card illegally, you may be challenged by the other player to show your hand. If guilty, you need to draw 4 cards. If not, the challenger needs to draw 6 cards instead."
          }
        ],
        image:"media/cards/Uno-Action-Cards.jpg"
      },
      {
        heading:"Two Player & Four Player Rules",
        content:"For four players (two-partner teams), players sit opposite their partners, and play until one of either partner goes out with one Uno card left. Scoring for the winning team is done by adding up all the points from opposing partner’s hands. For two players, there is a slight change of rules:",
        subContent:[
          {
            text:"Reverse works like Skip"
          },
          {
            text:"Play Skip, and you may immediately play another card"
          },
          {
            text:"If you play a Draw Two or Wild Draw Four card, your opponent has to draw the number of cards required, and then play immediately resumes back on your turn."
          }
        ]
      }
    ];


  self.User = function(_data){
    this.id = _data._id;
    this.email = _data.email;
    this.username = _data.username;
    this.online = _data.online;
    this.inAGame = _data.inAGame;
  };

  self.ChatMsg = function(_data){
    this.sender = _data.sender;
    this.message = _data.message;
    this.timestamp = _data.timestamp;
    this.timeSent = getTimeSent(_data.timestamp);
    this.senderColor = getSenderColor(_data.sender);
  };

  // received Challenges
  self.RecChallenge = function(_data){
    this.id = _data.id;
    this.status = _data.status;
    this.timestamp = _data.timestamp;
    this.challenger = _data.challenger;
    this.usersChallenged = _data.usersChallenged;
    this.challengeText = createChallengeRecText(_data);
    this.challengeClass = getChallengeClass( getRecChallengeStatus(_data) );
  };

  self.SentChallenge = function(_data){
    this.id = _data.id;
    this.status = _data.status;
    this.timestamp = _data.timestamp;
    this.challenger = _data.challenger;
    this.usersChallenged = _data.usersChallenged;
    this.usernamesChallenged = getUsernamesChallenged(_data);
    this.challengeText = createChallengeSentText(_data);
    this.challengeClass = getChallengeClass(_data.status);
    this.startGameVisible = (_data.status == "all responded");
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
    this.playerClass = ko.observable( (_playerData.isMyTurn) ? "my-turn" : "" );
  };

  GamePlayer = function(_playerData){
    this.id = _playerData.id;
    this.username = _playerData.username;
    this.calledUno = _playerData.calledUno;
    this.cardCount = _playerData.cardCount;
    this.isMyTurn = ko.observable(_playerData.isMyTurn);
    this.playerClass = ko.observable( (_playerData.isMyTurn) ? "my-turn" : "" );
  };

  self.Game = function(_gameObj){
    this.gameId = ko.observable(_gameObj._id);
    this.discardPile = ko.observableArray(_gameObj.discardPile);
    //this.activePlayer = new GamePlayer(_gameObj.activePlayer);
    this.gamePlayers = ko.observableArray( popPlayersArr(_gameObj.players) );
    this.currPlayer = ko.observable( getCurrGamePlayer(_gameObj.players) );

    // change this to call getcolor func
    this.currGC = ko.computed( this.getSVGName, this); // current discard pile card
    this.prevGC = ko.computed( this.getPrevGC, this );
    this.currColor = ko.observable( _gameObj.discardPile[_gameObj.discardPile.length - 1].color );
  };


  self.Game.prototype.getSVGName = function(){
    var svgName = this.discardPile()[this.discardPile().length - 1].svgName,
        color = this.discardPile()[this.discardPile().length - 1].color;
    if(svgName == "ww" || svgName == "wd"){
      return svgName + "_" + color;
    }else{
      return svgName;
    }
  };

  getTimeSent = function(_date){
    console.log(_date);
    var date = new Date(_date),
        hours = date.getHoursNonMilitary(),
        mins = date.getMinutesTwoDigits();

    return hours + ":" + mins;
  };


  self.Game.prototype.getPrevGC = function(){
    return ( !( (this.discardPile().length - 2) < 0) ) ? this.discardPile()[this.discardPile().length - 2].svgName : "cb";
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

  getCurrGamePlayer = function(_players){
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
    var status = getRecChallengeStatus(_data);
    return 'Challenge from ' + _data.challenger.username + ' (' + status + ')'
  };

  // UI Manipulation

  getSenderColor = function(_sender){
    if(_sender == coreData.currUser().username){
      return "me-txt";
    }else{
      return "sender-txt";
    }
  };

  getChallengeClass = function(_status){
    var className = "";
    if(_status == "all responded"){
      className = "ready-item";
    }else{
      className = _status + "-item";
    }
    return className;
  };
  getRecChallengeStatus = function(_challenge){
    var status = null;

    if(_challenge.status == "cancelled"){
      return _challenge.status;
    }else {
      // check this specific users response
      for (var i = 0, j = _challenge.usersChallenged.length; i < j; i++) {
        // make sure that they are a challenged user
        if (_challenge.usersChallenged[i]._id == currUser().id) {
          // see if status anything but declined or accepted
          if (_challenge.usersChallenged[i].status != "") {
            status = _challenge.usersChallenged[i].status;
          }
        }
      }
      if (status != null) {
        return status;
      } else {
        return _challenge.status;
      }
    }
  };


  self.GamePlayerCurrUser = GamePlayerCurrUser;
  self.GamePlayer = GamePlayer;
  self.Card = Card;

  // functions
  self.popPlayersArr = popPlayersArr;
  self.getCurrGamePlayer = getCurrGamePlayer;

  // vars
  self.socket = socket;
  self.mainSocket = mainSocket;
  self.gameSocket = gameSocket;
  self.activeUsers = activeUsers;
  self.receivedChallenges = receivedChallenges;
  self.sentChallenges = sentChallenges;
  self.chatMsgs = chatMsgs;
  self.currUser = currUser;
  self.gameObj = gameObj;
  self.gamePlayers = gamePlayers;
  self.gameChatMsgs = gameChatMsgs;
  self.activeChatData = activeChatData;
  self.gameInstructions = gameInstructions;

  return self;

});