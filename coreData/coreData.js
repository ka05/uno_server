/**
 * Created by claytonherendeen on 10/8/15.
 */
var util = require("util");
var ko = require("knockout");
var CoreData = {};

  // Challenge Objects
  CoreData.Challenge = function(_data){
    this.id = _data._id;
    this.challengeId = _data.challengeId;
    this.challenger = _data.challenger;
    this.usersChallenged = _data.usersChallenged;
    this.timestamp = _data.timestamp;
    this.status = _data.status;
  };
  // User Objects
  CoreData.User = function(_data){
    this.id = _data._id;
    this.email = _data.email;
    this.username = _data.username;
    this.winCount = _data.winCount;
    this.token = _data.token;
  };

  // Game Objects
  GamePlayer = function(_playerData){
    this.id = _playerData.id;
    this.username = _playerData.username;
    this.calledUno = _playerData.calledUno;
    this.cardCount = _playerData.cardCount;
    this.inGame = _playerData.inGame;
    this.isMyTurn = _playerData.isMyTurn;
  };
  GamePlayerCurrUser = function(_playerData){
    this.id = _playerData.id;
    this.hand = _playerData.hand;
    this.username = _playerData.username;
    this.calledUno = _playerData.calledUno;
    this.inGame = _playerData.inGame;
    this.isMyTurn = _playerData.isMyTurn;
  };
  CoreData.Game = function(_gameData){
    this._id = _gameData._id;
    this.deck = _gameData.deck;
    this.discardPile = _gameData.discardPile;
    this.players = _gameData.players;
    this.activePlayer = _gameData.activePlayer;
    this.status = _gameData.status;
  };
  CoreData.SensitiveGame = function(_gameData, _userId){
    this._id = _gameData._id;
    this.discardPile = _gameData.discardPile;
    this.players = returnSensitivePlayersObj(_gameData.players, _userId);
    // should create different internal player objects that provides minimal info.
    // ( dont want to send all players information like deck and such )
    this.allPlayersInGame = _gameData.allPlayersInGame;
    this.status = _gameData.status;
    this.winner = _gameData.winner;
  };
  CoreData.Card = function(_data){
    this.cardName = _data.cardName; // name of card (ex: Red 2)
    this.svgName = _data.svgName; // name of svg to be used
    this.count = _data.count; // number of duplicated cards in deck
  };

function returnSensitivePlayersObj(_players, _userId){
  var players = [];

  for(var i = 0; i < _players.length; i++ ){
    if(_players[i].id == _userId){
      // this is the current user
      players.push( new GamePlayerCurrUser(_players[i]) );
    }else{
      // its a generic player - dont give them everything
      players.push( new GamePlayer(_players[i]) );
    }

  }

  return players;
}

//GamePlayer.prototype.cardCount = function(){
//  return this.hand.length;
//};

//util.inherits(CoreData.GamePlayerCurrUser, GamePlayer);

// bind objects to CoreData
CoreData.GamePlayer = GamePlayer;
CoreData.GamePlayerCurrUser = GamePlayerCurrUser;

module.exports = CoreData;