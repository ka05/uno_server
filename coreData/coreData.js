/**
 * Created by claytonherendeen on 10/8/15.
 */
var CoreData = {

  // Challenge Objects
  Challenge:function(_data){
    this.id = _data._id;
    this.challengeId = _data.challengeId;
    this.userChallenged = _data.userChallenged;
    this.timestamp = _data.timestamp;
    this.challenger = _data.challenger;
    this.status = _data.status;
  },
  //SChallenge:SChallenge, //sent challenge
  //RChallenge:RChallenge, //received challenge


  // User Objects
  User:function(_data){
    this.id = _data._id;
    this.email = _data.email;
    this.username = _data.username;
    this.token = _data.token;
  },

  // Game Objects
  GamePlayer:function(_playerData){
    this.id = _playerData.id;
    this.username = _playerData.username;
    this.hand = _playerData.hand;
    this.calledUno = _playerData.calledUno;
    this.cardCount = _playerData.hand.length; // length of hand array
  },
  Game:function(_gameData){
    this.gameId = _gameData.gameId;
    this.deck = _gameData.deck;
    this.discardPile = _gameData.discardPile;
    this.players = _gameData.players;
    this.activePlayer = _gameData.activePlayer;
    this.status = _gameData.status;
  },
  Card:function(_data){
    this.cardName = _data.cardName; // name of card (ex: Red 2)
    this.svgName = _data.svgName; // name of svg to be used
    this.count = _data.count; // number of duplicated cards in deck
  }
};

//var RChallenge = new function(_data){
//
//};
//
//var SChallenge = new function(_data){
//
//};
//
//RChallenge.prototype = new CoreData.Challenge();
//SChallenge.prototype = new CoreData.Challenge();


module.exports = CoreData;