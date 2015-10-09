/**
 * Created by claytonherendeen on 9/25/15.
 */
var express = require('express');
var router = express.Router();
var base = require('base-converter');
var bcrypt = require('bcrypt');
var validate = require("validate.js");
validate.moment = require("moment");

// GAME OBJECTS




var uno = {
  deck:[
    // Red Cards
    {
      "cardName":"Red 0",
      "svgName":"r0",
      "count":"2",
      "color":"red",
      "value":"0"
    },
    {
      "cardName":"Red 1",
      "svgName":"r1",
      "count":"2",
      "color":"red",
      "value":"1"
    },
    {
      "cardName":"Red 2",
      "svgName":"r2",
      "count":"2",
      "color":"red",
      "value":"2"
    },
    {
      "cardName":"Red 3",
      "svgName":"r3",
      "count":"2",
      "color":"red",
      "value":"3"
    },
    {
      "cardName":"Red 4",
      "svgName":"r4",
      "count":"2",
      "color":"red",
      "value":"4"
    },
    {
      "cardName":"Red 5",
      "svgName":"r5",
      "count":"2",
      "color":"red",
      "value":"5"
    },
    {
      "cardName":"Red 6",
      "svgName":"r6",
      "count":"2",
      "color":"red",
      "value":"6"
    },
    {
      "cardName":"Red 7",
      "svgName":"r7",
      "count":"2",
      "color":"red",
      "value":"7"
    },
    {
      "cardName":"Red 8",
      "svgName":"r8",
      "count":"2",
      "color":"red",
      "value":"8"
    },
    {
      "cardName":"Red 9",
      "svgName":"r9",
      "count":"2",
      "color":"red",
      "value":"9"
    },
    {
      "cardName":"Red Skip",
      "svgName":"rs",
      "count":"2",
      "color":"red",
      "value":"skip"
    },
    {
      "cardName":"Red Reverse",
      "svgName":"rr",
      "count":"2",
      "color":"red",
      "value":"reverse"
    },
    {
      "cardName":"Red Draw 2",
      "svgName":"rd",
      "count":"2",
      "color":"red",
      "value":"draw2"
    },
    // blue cards
    {
      "cardName":"Blue 0",
      "svgName":"b0",
      "count":"2",
      "color":"blue",
      "value":"0"
    },
    {
      "cardName":"Blue 1",
      "svgName":"b1",
      "count":"2",
      "color":"blue",
      "value":"1"
    },
    {
      "cardName":"Blue 2",
      "svgName":"b2",
      "count":"2",
      "color":"blue",
      "value":"2"
    },
    {
      "cardName":"Blue 3",
      "svgName":"b3",
      "count":"2",
      "color":"blue",
      "value":"3"
    },
    {
      "cardName":"Blue 4",
      "svgName":"b4",
      "count":"2",
      "color":"blue",
      "value":"4"
    },
    {
      "cardName":"Blue 5",
      "svgName":"b5",
      "count":"2",
      "color":"blue",
      "value":"5"
    },
    {
      "cardName":"Blue 6",
      "svgName":"b6",
      "count":"2",
      "color":"blue",
      "value":"6"
    },
    {
      "cardName":"Blue 7",
      "svgName":"b7",
      "count":"2",
      "color":"blue",
      "value":"7"
    },
    {
      "cardName":"Blue 8",
      "svgName":"b8",
      "count":"2",
      "color":"blue",
      "value":"8"
    },
    {
      "cardName":"Blue 9",
      "svgName":"b9",
      "count":"2",
      "color":"blue",
      "value":"9"
    },
    {
      "cardName":"Blue Skip",
      "svgName":"bs",
      "count":"2",
      "color":"blue",
      "value":"skip"
    },
    {
      "cardName":"Blue Reverse",
      "svgName":"br",
      "count":"2",
      "color":"blue",
      "value":"reverse"
    },
    {
      "cardName":"Blue Draw 2",
      "svgName":"bd",
      "count":"2",
      "color":"blue",
      "value":"draw2"
    },
    // green cards
    {
      "cardName":"Green 0",
      "svgName":"g0",
      "count":"2",
      "color":"green",
      "value":"0"
    },
    {
      "cardName":"Green 1",
      "svgName":"g1",
      "count":"2",
      "color":"green",
      "value":"1"
    },
    {
      "cardName":"Green 2",
      "svgName":"g2",
      "count":"2",
      "color":"green",
      "value":"2"
    },
    {
      "cardName":"Green 3",
      "svgName":"g3",
      "count":"2",
      "color":"green",
      "value":"3"
    },
    {
      "cardName":"Green 4",
      "svgName":"g4",
      "count":"2",
      "color":"green",
      "value":"4"
    },
    {
      "cardName":"Green 5",
      "svgName":"g5",
      "count":"2",
      "color":"green",
      "value":"5"
    },
    {
      "cardName":"Green 6",
      "svgName":"g6",
      "count":"2",
      "color":"green",
      "value":"6"
    },
    {
      "cardName":"Green 7",
      "svgName":"g7",
      "count":"2",
      "color":"green",
      "value":"7"
    },
    {
      "cardName":"Green 8",
      "svgName":"g8",
      "count":"2",
      "color":"green",
      "value":"8"
    },
    {
      "cardName":"Green 9",
      "svgName":"g9",
      "count":"2",
      "color":"green",
      "value":"9"
    },
    {
      "cardName":"Green Skip",
      "svgName":"gs",
      "count":"2",
      "color":"green",
      "value":"skip"
    },
    {
      "cardName":"Green Reverse",
      "svgName":"gr",
      "count":"2",
      "color":"green",
      "value":"reverse"
    },
    {
      "cardName":"Red Draw 2",
      "svgName":"rd",
      "count":"2",
      "color":"green",
      "value":"draw2"
    },
    // yellow cards
    {
      "cardName":"Yellow 0",
      "svgName":"y0",
      "count":"2",
      "color":"yellow",
      "value":"0"
    },
    {
      "cardName":"Yellow 1",
      "svgName":"y1",
      "count":"2",
      "color":"yellow",
      "value":"1"
    },
    {
      "cardName":"Yellow 2",
      "svgName":"y2",
      "count":"2",
      "color":"yellow",
      "value":"2"
    },
    {
      "cardName":"Yellow 3",
      "svgName":"y3",
      "count":"2",
      "color":"yellow",
      "value":"3"
    },
    {
      "cardName":"Yellow 4",
      "svgName":"y4",
      "count":"2",
      "color":"yellow",
      "value":"4"
    },
    {
      "cardName":"Yellow 5",
      "svgName":"y5",
      "count":"2",
      "color":"yellow",
      "value":"5"
    },
    {
      "cardName":"Yellow 6",
      "svgName":"y6",
      "count":"2",
      "color":"yellow",
      "value":"6"
    },
    {
      "cardName":"Yellow 7",
      "svgName":"y7",
      "count":"2",
      "color":"yellow",
      "value":"7"
    },
    {
      "cardName":"Yellow 8",
      "svgName":"y8",
      "count":"2",
      "color":"yellow",
      "value":"8"
    },
    {
      "cardName":"Yellow 9",
      "svgName":"y9",
      "count":"2",
      "color":"yellow",
      "value":"9"
    },
    {
      "cardName":"Yellow Skip",
      "svgName":"ys",
      "count":"2",
      "color":"yellow",
      "value":"skip"
    },
    {
      "cardName":"Yellow Reverse",
      "svgName":"yr",
      "count":"2",
      "color":"yellow",
      "value":"reverse"
    },
    {
      "cardName":"Yellow Draw 2",
      "svgName":"yd",
      "count":"2",
      "color":"yellow",
      "value":"draw2"
    },
    // wild cards
    {
      "cardName":"Wild",
      "svgName":"w",
      "count":"4",
      "color":"none",
      "value":"wild"
    },
    {
      "cardName":"Wild Draw 4",
      "svgName":"wd",
      "count":"4",
      "color":"none",
      "value":"wilddraw4"
    }
  ]
};

/*
 * Get Active Games - so we can list them in the lobby
 *
 */
router.get('/activegames', function(req, res) {
  req.db.collection('games').find({"status":"inprogress"}).toArray(function (err, items) {
    res.json(items);
  });

});

/*
 * Create Game.
 *
 */
router.get('/creategame', function(req, res) {
  var game = createGame(req.body);

  // run intitial deal to players
  dealToPlayers(game.deck, game.players);
  dealInitDiscardCard(game.deck);

  // create game with generated ID
  req.db.collection('games').insert(game, function(err, result){
    res.send(
      (err === null) ? { msg: 'success' } : { msg: err }
    );
  });

});

function createGame(_gameInfo){
  return {
    // game id
    gameId:generateGameId(),
    // create Deck and shuffle it
    deck:shuffle(createDeck(uno.deck)),
    // discard Pile
    discardPile:[],
    // gather players
    players:buildPlayersObj(_gameInfo.players),
    // number of players?
    //numPlayers:players.length,
    // active player -> player who's turn it is
    activePlayer:_gameInfo.players,
    // game status ( inprogress, complete, incomplete[someone quit or started a new game] )
    status:"inprogress"

  };
}

function createDeck(_deckObj){
  var newDeck = [];
  $.each(_deckObj, function(index, value){
    for(var i = 0; i < parseInt(value.count); i++ ){
      newDeck.push({
        "cardName":value.cardName,
        "svgName":value.svgName,
        "color":value.color,
        "value":value.value
      });
    }
  });
  return newDeck;
}

// shuffle the deck
function shuffle(deck) {
  var currentIndex = deck.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = deck[currentIndex];
    deck[currentIndex] = deck[randomIndex];
    deck[randomIndex] = temporaryValue;
  }
  return deck;
}

// create player objects
function buildPlayersObj(_players){
  var players = [];

  $.each(_players, function(){
    players.push(
      new GamePlayer({

      })
    );
  });

  return players;
}

function generateGameId(){
  return "someid"; // finish later
}

/*
 * delete Game.
 *
 */
router.delete('/deletegame/:gameId', function(req, res) {

  req.db.collection('games').remove({ 'gameId' : req.params.gameId }, function(err) {
    res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
  });

});

// deal cards to players in beginning
function dealToPlayers(_deck, _players){
  $.each(_players, function(index, value){
    for(var i = 0; i < 7; i++){
      value.hand.push(_deck.pop());
    }

  });
}

// validate move
router.post('/validatemove', function(req, res) {

  var playedCard = req.body.playedCard,
      playerId = req.body.playerId,
      gameId = req.body.gameId;

  // find game
  req.db.collection('games').find({"gameId":gameId}).toArray(function (err, items) {
    var game = items[0];
    // playedCard must exist in playerHand
    if(checkPlayedCardInPlayerHand()) {
      // ensure move is valid
      if (validateMove(playedCard, game.discardPile)) {
        game.discardPile.push(playedCard); // add played card to discard pile ( if move was valid )
        removeCardPlayerHand(game.players[playerId].hand, playedCard); // update active players hand to remove played card from hand
        game.activePlayer = getNextPlayer(game.players, game.activePlayer); // set active player to next player in order
        saveGame(game); // save game ( items changed: discardPile, activePlayer,
      }
    }
  });
});

function checkPlayedCardInPlayerHand(_playedCard, _playerHand){
  var cardInHand = false;
  $.each(_playerHand, function(index, value){
    if(value.color == _playedCard.color && value.value == _playedCard.value){
      cardInHand = true;
    }
  });
  return cardInHand;
}

function validateMove(_playedCard, _discardPile){
  var lastCardPlayed = _discardPile[_discardPile.length - 1];

  return _playedCard.color == lastCardPlayed.color || _playedCard.value == lastCardPlayed.value || _playedCard.value == ( "w" || "wd" );
}


// deal Initial Card
function dealInitDiscardCard(_deck, _discardPile){
  _discardPile.push(_deck.pop());
}


// get next player
function getNextPlayer(_players, _activePlayer){
  $.each(_players, function(index, value){

  });
}

function reversePlayers(_players){

}

// remove card played
function removeCardPlayerHand(_playerHand, _playedCard){
  // instead may want to assign each card in deck an id and use the id to delete in one line rather than using a loop and wasting memory
  $.each(_playerHand, function(index, value){
    if(value.color == _playedCard.color && value.value == _playedCard.value){
      //_playerHand.pop(); // revmove card from players hand
      // **** see if you can remove by id

    }
  });
}

// add card to player hand
function addCardToPlayerHand(_hand, _cardDrawn){
  _hand.push(_cardDrawn);
}


router.post('/drawcard', function(req, res) {
  // find game
  req.db.collection('games').find({"gameId":req.body.gameId}).toArray(function (err, items) {
    var game = items[0],
        cardDrawn = game.deck.pop();

    addCardToPlayerHand(game.players[activePlayer.id].hand, cardDrawn);
  });
});

module.exports = router;