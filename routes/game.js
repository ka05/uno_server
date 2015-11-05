/**
 * Created by claytonherendeen on 9/25/15.
 */
module.exports = function(db) {
  var self = this,
    async = require('async'),
    ObjectID = require('mongodb').ObjectID,
    coreData = require('../custom_modules/coreData/coreData.js');

  db.bind("challenges");
  db.bind("users");
  db.bind("games");

  var uno = {
    deck: [
      // Red Cards
      {
        "cardName": "Red 0",
        "svgName": "r0",
        "count": "2",
        "color": "red",
        "value": "0"
      },
      {
        "cardName": "Red 1",
        "svgName": "r1",
        "count": "2",
        "color": "red",
        "value": "1"
      },
      {
        "cardName": "Red 2",
        "svgName": "r2",
        "count": "2",
        "color": "red",
        "value": "2"
      },
      {
        "cardName": "Red 3",
        "svgName": "r3",
        "count": "2",
        "color": "red",
        "value": "3"
      },
      {
        "cardName": "Red 4",
        "svgName": "r4",
        "count": "2",
        "color": "red",
        "value": "4"
      },
      {
        "cardName": "Red 5",
        "svgName": "r5",
        "count": "2",
        "color": "red",
        "value": "5"
      },
      {
        "cardName": "Red 6",
        "svgName": "r6",
        "count": "2",
        "color": "red",
        "value": "6"
      },
      {
        "cardName": "Red 7",
        "svgName": "r7",
        "count": "2",
        "color": "red",
        "value": "7"
      },
      {
        "cardName": "Red 8",
        "svgName": "r8",
        "count": "2",
        "color": "red",
        "value": "8"
      },
      {
        "cardName": "Red 9",
        "svgName": "r9",
        "count": "2",
        "color": "red",
        "value": "9"
      },
      {
        "cardName": "Red Skip",
        "svgName": "rs",
        "count": "2",
        "color": "red",
        "value": "skip"
      },
      {
        "cardName": "Red Reverse",
        "svgName": "rr",
        "count": "2",
        "color": "red",
        "value": "reverse"
      },
      {
        "cardName": "Red Draw 2",
        "svgName": "rd",
        "count": "2",
        "color": "red",
        "value": "draw2"
      },
      // blue cards
      {
        "cardName": "Blue 0",
        "svgName": "b0",
        "count": "2",
        "color": "blue",
        "value": "0"
      },
      {
        "cardName": "Blue 1",
        "svgName": "b1",
        "count": "2",
        "color": "blue",
        "value": "1"
      },
      {
        "cardName": "Blue 2",
        "svgName": "b2",
        "count": "2",
        "color": "blue",
        "value": "2"
      },
      {
        "cardName": "Blue 3",
        "svgName": "b3",
        "count": "2",
        "color": "blue",
        "value": "3"
      },
      {
        "cardName": "Blue 4",
        "svgName": "b4",
        "count": "2",
        "color": "blue",
        "value": "4"
      },
      {
        "cardName": "Blue 5",
        "svgName": "b5",
        "count": "2",
        "color": "blue",
        "value": "5"
      },
      {
        "cardName": "Blue 6",
        "svgName": "b6",
        "count": "2",
        "color": "blue",
        "value": "6"
      },
      {
        "cardName": "Blue 7",
        "svgName": "b7",
        "count": "2",
        "color": "blue",
        "value": "7"
      },
      {
        "cardName": "Blue 8",
        "svgName": "b8",
        "count": "2",
        "color": "blue",
        "value": "8"
      },
      {
        "cardName": "Blue 9",
        "svgName": "b9",
        "count": "2",
        "color": "blue",
        "value": "9"
      },
      {
        "cardName": "Blue Skip",
        "svgName": "bs",
        "count": "2",
        "color": "blue",
        "value": "skip"
      },
      {
        "cardName": "Blue Reverse",
        "svgName": "br",
        "count": "2",
        "color": "blue",
        "value": "reverse"
      },
      {
        "cardName": "Blue Draw 2",
        "svgName": "bd",
        "count": "2",
        "color": "blue",
        "value": "draw2"
      },
      // green cards
      {
        "cardName": "Green 0",
        "svgName": "g0",
        "count": "2",
        "color": "green",
        "value": "0"
      },
      {
        "cardName": "Green 1",
        "svgName": "g1",
        "count": "2",
        "color": "green",
        "value": "1"
      },
      {
        "cardName": "Green 2",
        "svgName": "g2",
        "count": "2",
        "color": "green",
        "value": "2"
      },
      {
        "cardName": "Green 3",
        "svgName": "g3",
        "count": "2",
        "color": "green",
        "value": "3"
      },
      {
        "cardName": "Green 4",
        "svgName": "g4",
        "count": "2",
        "color": "green",
        "value": "4"
      },
      {
        "cardName": "Green 5",
        "svgName": "g5",
        "count": "2",
        "color": "green",
        "value": "5"
      },
      {
        "cardName": "Green 6",
        "svgName": "g6",
        "count": "2",
        "color": "green",
        "value": "6"
      },
      {
        "cardName": "Green 7",
        "svgName": "g7",
        "count": "2",
        "color": "green",
        "value": "7"
      },
      {
        "cardName": "Green 8",
        "svgName": "g8",
        "count": "2",
        "color": "green",
        "value": "8"
      },
      {
        "cardName": "Green 9",
        "svgName": "g9",
        "count": "2",
        "color": "green",
        "value": "9"
      },
      {
        "cardName": "Green Skip",
        "svgName": "gs",
        "count": "2",
        "color": "green",
        "value": "skip"
      },
      {
        "cardName": "Green Reverse",
        "svgName": "gr",
        "count": "2",
        "color": "green",
        "value": "reverse"
      },
      {
        "cardName": "Green Draw 2",
        "svgName": "gd",
        "count": "2",
        "color": "green",
        "value": "draw2"
      },
      // yellow cards
      {
        "cardName": "Yellow 0",
        "svgName": "y0",
        "count": "2",
        "color": "yellow",
        "value": "0"
      },
      {
        "cardName": "Yellow 1",
        "svgName": "y1",
        "count": "2",
        "color": "yellow",
        "value": "1"
      },
      {
        "cardName": "Yellow 2",
        "svgName": "y2",
        "count": "2",
        "color": "yellow",
        "value": "2"
      },
      {
        "cardName": "Yellow 3",
        "svgName": "y3",
        "count": "2",
        "color": "yellow",
        "value": "3"
      },
      {
        "cardName": "Yellow 4",
        "svgName": "y4",
        "count": "2",
        "color": "yellow",
        "value": "4"
      },
      {
        "cardName": "Yellow 5",
        "svgName": "y5",
        "count": "2",
        "color": "yellow",
        "value": "5"
      },
      {
        "cardName": "Yellow 6",
        "svgName": "y6",
        "count": "2",
        "color": "yellow",
        "value": "6"
      },
      {
        "cardName": "Yellow 7",
        "svgName": "y7",
        "count": "2",
        "color": "yellow",
        "value": "7"
      },
      {
        "cardName": "Yellow 8",
        "svgName": "y8",
        "count": "2",
        "color": "yellow",
        "value": "8"
      },
      {
        "cardName": "Yellow 9",
        "svgName": "y9",
        "count": "2",
        "color": "yellow",
        "value": "9"
      },
      {
        "cardName": "Yellow Skip",
        "svgName": "ys",
        "count": "2",
        "color": "yellow",
        "value": "skip"
      },
      {
        "cardName": "Yellow Reverse",
        "svgName": "yr",
        "count": "2",
        "color": "yellow",
        "value": "reverse"
      },
      {
        "cardName": "Yellow Draw 2",
        "svgName": "yd",
        "count": "2",
        "color": "yellow",
        "value": "draw2"
      },
      // wild cards
      {
        "cardName": "Wild",
        "svgName": "ww",
        "count": "4",
        "color": "none",
        "value": "wild"
      },
      {
        "cardName": "Wild Draw 4",
        "svgName": "wd",
        "count": "4",
        "color": "none",
        "value": "wilddraw4"
      }
    ],
    lookupDeck: {
// Red Cards
      "r0": {
        "cardName": "Red 0",
        "svgName": "r0",
        "count": "2",
        "color": "red",
        "value": "0"
      },
      "r1": {
        "cardName": "Red 1",
        "svgName": "r1",
        "count": "2",
        "color": "red",
        "value": "1"
      },
      "r2": {
        "cardName": "Red 2",
        "svgName": "r2",
        "count": "2",
        "color": "red",
        "value": "2"
      },
      "r3": {
        "cardName": "Red 3",
        "svgName": "r3",
        "count": "2",
        "color": "red",
        "value": "3"
      },
      "r4": {
        "cardName": "Red 4",
        "svgName": "r4",
        "count": "2",
        "color": "red",
        "value": "4"
      },
      "r5": {
        "cardName": "Red 5",
        "svgName": "r5",
        "count": "2",
        "color": "red",
        "value": "5"
      },
      "r6": {
        "cardName": "Red 6",
        "svgName": "r6",
        "count": "2",
        "color": "red",
        "value": "6"
      },
      "r7": {
        "cardName": "Red 7",
        "svgName": "r7",
        "count": "2",
        "color": "red",
        "value": "7"
      },
      "r8": {
        "cardName": "Red 8",
        "svgName": "r8",
        "count": "2",
        "color": "red",
        "value": "8"
      },
      "r9": {
        "cardName": "Red 9",
        "svgName": "r9",
        "count": "2",
        "color": "red",
        "value": "9"
      },
      "rs": {
        "cardName": "Red Skip",
        "svgName": "rs",
        "count": "2",
        "color": "red",
        "value": "skip"
      },
      "rr": {
        "cardName": "Red Reverse",
        "svgName": "rr",
        "count": "2",
        "color": "red",
        "value": "reverse"
      },
      "rd": {
        "cardName": "Red Draw 2",
        "svgName": "rd",
        "count": "2",
        "color": "red",
        "value": "draw2"
      },
      // blue cards
      "b0": {
        "cardName": "Blue 0",
        "svgName": "b0",
        "count": "2",
        "color": "blue",
        "value": "0"
      },
      "b1": {
        "cardName": "Blue 1",
        "svgName": "b1",
        "count": "2",
        "color": "blue",
        "value": "1"
      },
      "b2": {
        "cardName": "Blue 2",
        "svgName": "b2",
        "count": "2",
        "color": "blue",
        "value": "2"
      },
      "b3": {
        "cardName": "Blue 3",
        "svgName": "b3",
        "count": "2",
        "color": "blue",
        "value": "3"
      },
      "b4": {
        "cardName": "Blue 4",
        "svgName": "b4",
        "count": "2",
        "color": "blue",
        "value": "4"
      },
      "b5": {
        "cardName": "Blue 5",
        "svgName": "b5",
        "count": "2",
        "color": "blue",
        "value": "5"
      },
      "b6": {
        "cardName": "Blue 6",
        "svgName": "b6",
        "count": "2",
        "color": "blue",
        "value": "6"
      },
      "b7": {
        "cardName": "Blue 7",
        "svgName": "b7",
        "count": "2",
        "color": "blue",
        "value": "7"
      },
      "b8": {
        "cardName": "Blue 8",
        "svgName": "b8",
        "count": "2",
        "color": "blue",
        "value": "8"
      },
      "b9": {
        "cardName": "Blue 9",
        "svgName": "b9",
        "count": "2",
        "color": "blue",
        "value": "9"
      },
      "bs": {
        "cardName": "Blue Skip",
        "svgName": "bs",
        "count": "2",
        "color": "blue",
        "value": "skip"
      },
      "br": {
        "cardName": "Blue Reverse",
        "svgName": "br",
        "count": "2",
        "color": "blue",
        "value": "reverse"
      },
      "bd": {
        "cardName": "Blue Draw 2",
        "svgName": "bd",
        "count": "2",
        "color": "blue",
        "value": "draw2"
      },
      // green cards
      "g0": {
        "cardName": "Green 0",
        "svgName": "g0",
        "count": "2",
        "color": "green",
        "value": "0"
      },
      "g1": {
        "cardName": "Green 1",
        "svgName": "g1",
        "count": "2",
        "color": "green",
        "value": "1"
      },
      "g2": {
        "cardName": "Green 2",
        "svgName": "g2",
        "count": "2",
        "color": "green",
        "value": "2"
      },
      "g3": {
        "cardName": "Green 3",
        "svgName": "g3",
        "count": "2",
        "color": "green",
        "value": "3"
      },
      "g4": {
        "cardName": "Green 4",
        "svgName": "g4",
        "count": "2",
        "color": "green",
        "value": "4"
      },
      "g5": {
        "cardName": "Green 5",
        "svgName": "g5",
        "count": "2",
        "color": "green",
        "value": "5"
      },
      "g6": {
        "cardName": "Green 6",
        "svgName": "g6",
        "count": "2",
        "color": "green",
        "value": "6"
      },
      "g7": {
        "cardName": "Green 7",
        "svgName": "g7",
        "count": "2",
        "color": "green",
        "value": "7"
      },
      "g8": {
        "cardName": "Green 8",
        "svgName": "g8",
        "count": "2",
        "color": "green",
        "value": "8"
      },
      "g9": {
        "cardName": "Green 9",
        "svgName": "g9",
        "count": "2",
        "color": "green",
        "value": "9"
      },
      "gs": {
        "cardName": "Green Skip",
        "svgName": "gs",
        "count": "2",
        "color": "green",
        "value": "skip"
      },
      "gr": {
        "cardName": "Green Reverse",
        "svgName": "gr",
        "count": "2",
        "color": "green",
        "value": "reverse"
      },
      "gd": {
        "cardName": "Green Draw 2",
        "svgName": "gd",
        "count": "2",
        "color": "green",
        "value": "draw2"
      },
      // yellow cards
      "y0": {
        "cardName": "Yellow 0",
        "svgName": "y0",
        "count": "2",
        "color": "yellow",
        "value": "0"
      },
      "y1": {
        "cardName": "Yellow 1",
        "svgName": "y1",
        "count": "2",
        "color": "yellow",
        "value": "1"
      },
      "y2": {
        "cardName": "Yellow 2",
        "svgName": "y2",
        "count": "2",
        "color": "yellow",
        "value": "2"
      },
      "y3": {
        "cardName": "Yellow 3",
        "svgName": "y3",
        "count": "2",
        "color": "yellow",
        "value": "3"
      },
      "y4": {
        "cardName": "Yellow 4",
        "svgName": "y4",
        "count": "2",
        "color": "yellow",
        "value": "4"
      },
      "y5": {
        "cardName": "Yellow 5",
        "svgName": "y5",
        "count": "2",
        "color": "yellow",
        "value": "5"
      },
      "y6": {
        "cardName": "Yellow 6",
        "svgName": "y6",
        "count": "2",
        "color": "yellow",
        "value": "6"
      },
      "y7": {
        "cardName": "Yellow 7",
        "svgName": "y7",
        "count": "2",
        "color": "yellow",
        "value": "7"
      },
      "y8": {
        "cardName": "Yellow 8",
        "svgName": "y8",
        "count": "2",
        "color": "yellow",
        "value": "8"
      },
      "y9": {
        "cardName": "Yellow 9",
        "svgName": "y9",
        "count": "2",
        "color": "yellow",
        "value": "9"
      },
      "ys": {
        "cardName": "Yellow Skip",
        "svgName": "ys",
        "count": "2",
        "color": "yellow",
        "value": "skip"
      },
      "yr": {
        "cardName": "Yellow Reverse",
        "svgName": "yr",
        "count": "2",
        "color": "yellow",
        "value": "reverse"
      },
      "yd": {
        "cardName": "Yellow Draw 2",
        "svgName": "yd",
        "count": "2",
        "color": "yellow",
        "value": "draw2"
      },
      // wild cards
      "ww": {
        "cardName": "Wild",
        "svgName": "ww",
        "count": "4",
        "color": "none",
        "value": "wild"
      },
      "wd": {
        "cardName": "Wild Draw 4",
        "svgName": "wd",
        "count": "4",
        "color": "none",
        "value": "wilddraw4"
      }
    },
    possibleColorsArr: ["red", "blue", "yellow", "green"]
  };



  /**** GAME CALLS ****/

// create the game and set things up
  createGame = function (_data, _actions) {

    // find challenge
    db.challenges.find({"_id": new ObjectID(_data.challengeId)}).toArray(function (err, items) {
      if (items.length > 0) {
        // ensure the user trying to start this game is in fact the challenger
        if (_data.userId == items[0].challenger.id) {

          // build array
          var gameUserIds = [items[0].challenger.id];

          for (var i = 0, j = items[0].usersChallenged.length; i < j; i++) {
            if (items[0].usersChallenged[i].status == "accepted") {
              gameUserIds.push(items[0].usersChallenged[i]._id);
            }
          }

          async.mapSeries(gameUserIds, function (id, callback) {

            db.users.find({'_id': new ObjectID(id)}).toArray(function (err, res) {
              if (err) return callback(err);
              callback(null, {
                _id: res[0]._id,
                username: res[0].username
              });
            })
          }, function (err, results) {
            // results is an array of names
            var game = createGameObj(results, items[0]._id);

            // run intitial deal to players
            dealToPlayers(game.deck, game.players);
            calculatePlayersHandCount(game.players);

            // after dealing -> set active player to the host
            // unless action card was first card dealt then apply that action and go to next player
            dealInitDiscardCard(game, items[0].challenger.id);

            // create game with generated ID
            db.games.insert(game, function (err, result) {
              // update challenge status to "ready" => ready to play
              // ( implies user1, "the challenger" has created the game and launched it )
              // Game cannot start until all players have entered gameroom
              if (err === null) {
                // set challenger inGame
                setPlayerInGame({
                  challengeId: _data.challengeId,
                  userId: items[0].challenger.id
                }, {
                  success: function () {

                    // figure out what status is when

                    // update game status to ready - allows all players to join game room and begin
                    db.challenges.update({_id: items[0]._id}, {'$set': {status: "ready"}}, function (err) {
                      (err === null) ? _actions.success(new coreData.SensitiveGame(game, _data.userId)) : _actions.error()
                    });
                  },
                  error: function () {
                    _actions.error();
                  }
                });
              } else {
                //error
                _actions.error()
              }
            });
          });
        } else {
          _actions.error("You are not the owner");
        }
      }else{
        _actions.error("error creating game");
      }
    });
  };

// check to see if all players are in game room (ready to play )
  checkPlayersInGameRoom = function (_data, _actions) {
    // get gameObj
    db.games.find({"_id": new ObjectID(_data.gameId)}).toArray(function (err, items) {
      if (items.length > 0) {
        if (checkAllPlayersPresent(items[0].players)) {
          console.log("all players present");
          // change game status to inprogress ( start game ) if all players are present
          db.games.update({"_id": new ObjectID(_data.gameId)}, {'$set': {status: "inprogress"}}, function (err, res) {
            (err === null) ? _actions.success(res) : _actions.error();
          });
        } else {
          // at least one player is abscent or not yet in the game
          console.log("one absent");
          _actions.error();
        }
      }else{
        console.log("error checking players in game room");
        _actions.error();
      }
    });
  };

// sets a player in the game
  setPlayerInGame = function (_data, _actions) {
    //console.log("setplayeringame: " + _data.userId + " challID: " + _data.challengeId);
    db.games.update({
      "challengeId": new ObjectID(_data.challengeId),
      "players.id": new ObjectID(_data.userId)
    }, {'$set': {"players.$.inGame": true}}, function (err, items) {
      //console.log("setplayeringame: res " + JSON.stringify(items) + " err: " + err);
      if (err === null) {
        updatePlayerInAGame(_data.userId, true);
        _actions.success();
      } else {
        console.log("person not in game");
        _actions.error();
      }
    });
  };

// get a game by its challengeId ( two games will never have the same challengeId )
  getGameByChallengeId = function (_data, _actions) {
    // make sure user is in the game
    console.log(_data.challengeId);
    db.games.find({"challengeId": new ObjectID(_data.challengeId)}).toArray(function (err, items) {
      if (items.length > 0) {
        if (findPlayerInGame(_data.userId, items[0].players)) {
          (err === null) ? _actions.success(new coreData.SensitiveGame(items[0], _data.userId)) : _actions.error()
        } else {
          // player isnt part of the game - dont let them have it
          _actions.error();
        }
      } else {
        _actions.error();
      }

    });
  };

// get a game by its game id
  getGameByGameId = function (_data, _actions) {
    getGameById({gameId: _data.gameId, playerId: _data.userId}, _actions, function (game) {
      _actions.success(new coreData.SensitiveGame(game, _data.userId));
    });
  };

// make sure card that player played was a valid card to play
  validateMove = function (_data, _actions) {
    var playedCardSvgName = _data.svgName, // this will be a card name
      chosenColor = _data.chosenColor, // color from wildcard
      playerId = _data.userId,
      gameId = _data.gameId;

    getGameById({gameId: _data.gameId, playerId: _data.userId}, _actions, function (game) {
      var currPlayerIndex = getPlayerIndex(_data.userId, game.players);
      // check if its their turn
      if (game.players[currPlayerIndex].isMyTurn) {
        var playedCard = getCardByName(playedCardSvgName);

        // playedCard must exist in playerHand
        if (checkPlayedCardInPlayerHand(playedCard, game.players[currPlayerIndex].hand)) {
          // ensure move is valid
          if (checkValidMove(playedCard, game.discardPile)) {
            console.log("ValidateMove player: " + game.players[currPlayerIndex].username);

            resetCallUnoEveryone(game);

            // still have more than one card - play card
            game.discardPile.push(playedCard); // add played card to discard pile ( if move was valid )
            removeCardPlayerHand(game.players[currPlayerIndex].hand, playedCard); // update active players hand to remove played card from hand
            var handLength = game.players[currPlayerIndex].hand.length;

            // Check for win -> their hand is empty ( they played their last card ) :. WIN!
            if (handLength == 0) {
              // update game object with winner
              game.winner = game.players[currPlayerIndex].username;
              game.status = "completed";

              // update player win count in db
              db.users.update({"_id": new ObjectID(playerId)}, {$inc: {winCount: 1}}, function (err) {
                if (err === null) {
                  console.log("updated win count for " + game.players[currPlayerIndex].username);

                  updateUsersPlayedGamesCount(game, {
                    success:function(){ console.log("successfully updated user gamesPlayed count"); },
                    error:function(){ console.log("error updating user gamesPlayed count"); }
                  });


                  // make sure challenges collection exists -> delete challenge
                  db.collectionNames("challenges", function (err, names) {
                    if (names.length > 0) {
                      // delete Challenge
                      db.challenges.remove({_id: new ObjectID(game.challengeId)}, function (err, res) {
                        console.log("delete challenge: err " + err);
                        console.log("delete challenge: " + JSON.stringify(res));
                      });
                    }
                  });

                } else {
                  _actions.error();
                }
              });
            }

            // if the playedCard's svgName has a second character
            // that is not a number then it must be an action card
            if (isNaN(playedCard.svgName.charAt(1))) {
              // handle everything associated with action card ( including setting player turns )
              // card played is a wild card
              // ( this is because when choosing a wild card you have to pick the color )
              (chosenColor && ( uno.possibleColorsArr.indexOf(chosenColor) != -1 ) ) ?
                handleActionCard(game, playedCard, playerId, chosenColor) :
                handleActionCard(game, playedCard, playerId);
            } else {
              setPlayerTurnByIndex(game.players, getNextPlayerIndex(game, currPlayerIndex)); // set next players turn
            }
            calculatePlayersHandCount(game.players); // recalculate card count for players

            // update hand in db
            // ( NEED TO CHANGE THIS TO ONLY UPDATE WHAT IS NECESSARY NTO THE WHOLE OBJ )
            db.games.update({"_id": new ObjectID(_data.gameId)}, game, function (err) {
              console.log("update err: " + err);
              (err === null) ? _actions.success(new coreData.SensitiveGame(game, playerId)) : _actions.error();
            });

          } else {
            // move wasnt valid -
            //handleResetCalledUno(game, playerId, currPlayerIndex);
            // move to draw

            console.log("Invalid Move");
            _actions.error("Invalid Move");
          }
        } else {
          console.log("You dont have that card");
          _actions.error("You dont have that card");
        }
      } else {
        console.log("Its not your turn");
        _actions.error("Its not your turn");
      }
    });
  };

  function handleResetCalledUno(_gameObj, _currPlayerIndex){
    // reset calledUno for me
    var playersIndexWithOneCard = findPlayersWithOneCard(_gameObj);

    // one of the players who has one card is me
    if(playersIndexWithOneCard.indexOf(_currPlayerIndex) != -1){
      _gameObj.players[_currPlayerIndex].calledUno = false;
    }
  }


// draw a card
  drawCard = function (_data, _actions) {
    var playerId = _data.userId,
      gameId = _data.gameId;

    getGameById({gameId: gameId, playerId: playerId}, _actions, function (game) {
      var cardDrawn = game.deck.pop();

      // check if its their turn
      var currPlayerIndex = getPlayerIndex(playerId, game.players);
      console.log("player: " + JSON.stringify(game.players[currPlayerIndex]));
      if (game.players[currPlayerIndex].isMyTurn) {

        // check if deck is almost empty and refill it if it is
        if (game.deck.length == 1) {
          refillDeck(game);
        }

        resetCallUnoEveryone(game);
        handleResetCalledUno(game, currPlayerIndex);

        // draw card and add to hand
        addCardToPlayerHand(game.players[currPlayerIndex].hand, cardDrawn);
        calculatePlayersHandCount(game.players); // terrible -> try to do this a better way later on

        // before changing whos turn it is see if it can be played
        if (checkValidMove(cardDrawn, game.discardPile)) {
          // this card can be played :. dont change turn
          console.log("card can be played: " + cardDrawn.cardName + " : " + game.discardPile[game.discardPile.length - 1].cardName);
        } else {
          console.log("card cant be played");
          setPlayerTurnByIndex(game.players, getNextPlayerIndex(game, currPlayerIndex)); // set next players turn
        }

        db.games.update({"_id": new ObjectID(gameId)}, game, function (err) {
          console.log("update err: " + err);
          (err === null) ? _actions.success(new coreData.SensitiveGame(game, playerId)) : _actions.error();
        });

      } else {
        console.log("its not their turn");
        _actions.error();
      }
    });

  };

  // when a player wants to call out another player for not saying uno.
  challengeUno = function (_data, _actions) {
    var gameId = _data.gameId,
      playerId = _data.userId;

    getGameById({gameId: gameId, playerId: playerId}, _actions, function (game) {

      // first check the card that was last played ( account for skip, reverse, +2, Wild +4 )


      // check if any players have one card left
      var playerIndexWithOneCard = findPlayerWithOneCard(game);
      if (playerIndexWithOneCard != -1) {

        // make sure they arent calling themselves out for not saying uno
        if(game.players[playerIndexWithOneCard].id != playerId){
          // if they did not call uno yet
          if (!game.players[playerIndexWithOneCard].calledUno) {
            console.log("They didnt call uno yet, call them out on that");

            // draw 2 cards to that player (as a penalty for not saying uno)
            drawToPlayerByIndex(game, playerIndexWithOneCard, 2);
            calculatePlayersHandCount(game.players); // recalculate card count for players

            // update the game
            db.games.update({"_id": new ObjectID(gameId)}, game, function (err) {
              console.log("update err: " + err);
              (err === null) ? _actions.success(new coreData.SensitiveGame(game, playerId)) : _actions.error();
            });

          } else {
            console.log("They have already called uno.");
            _actions.error("They have already called uno.");
          }
        } else{
          console.log("You cant challenge yourself for having uno");
          _actions.error("You cant challenge yourself for having uno");
        }

      } else {
        console.log("Nobody has 1 card left, so you cant call them out.");
        _actions.error("Nobody has 1 card left, so you cant call them out.");
      }
    });
  };

// when a player is about to play a card leaving one left in their hand
// they must say uno before placing the card
  sayUno = function (_data, _actions) {
    var gameId = _data.gameId,
      playerId = _data.userId;

    getGameById({gameId: gameId, playerId: playerId}, _actions, function (game) {
      var currPlayerIndex = getPlayerIndex(playerId, game.players),
        currPlayerHandLength = game.players[currPlayerIndex].hand.length;

      // player hasnt played the card yet but is about to
      if (currPlayerHandLength == 2) {
        // validate cards left to make sure at least one can be played
        if (checkValidMove(game.players[currPlayerIndex].hand[0], game.discardPile) ||
          checkValidMove(game.players[currPlayerIndex].hand[1], game.discardPile)) {

          // not efficient
          game.players[currPlayerIndex].calledUno = true;

          db.games.update({
            "_id": new ObjectID(gameId),
            "players.id": new ObjectID(playerId)
          }, {'$set': {"players.$.calledUno": true}}, function (err, items) {
            (err === null) ? _actions.success(new coreData.SensitiveGame(game, playerId)) : _actions.error();
          });
        } else {
          console.log("You cant play any cards so you wont have uno.");
          _actions.error("You cant play any cards so you wont have uno.");
        }
      }
      // they have already played the card
      else if (currPlayerHandLength == 1) {
        // but no one has called them out for not saying uno yet
        // :. they can still call uno so they dont get penalized
        if (!checkPlayersChallengedUno(game)) {

          game.players[currPlayerIndex].calledUno = true;

          db.games.update({
            "_id": new ObjectID(gameId),
            "players.id": new ObjectID(playerId)
          }, {'$set': {"players.$.calledUno": true}}, function (err, items) {
            (err === null) ? _actions.success(new coreData.SensitiveGame(game, playerId)) : _actions.error();

            //need to get updated game before sending back

          });
        } else {
          console.log("Sorry you too late");
          _actions.error("Sorry you too late.");
        }
      }
    });
  };

  quitGame = function (_data, _actions) {
    var gameId = _data.gameId,
      playerId = _data.userId;
    // change status of game - delete game obj
    getGameById({gameId: gameId, playerId: playerId}, _actions, function (_game) {
      // change player status
      db.games.update({
        "_id": new ObjectID(_data.gameId),
        "players.id": new ObjectID(_data.userId)
      }, {'$set': {"players.$.inGame": false}}, function (err) {
        if (err === null) {
          console.log('player quit');
          //console.log("quitgame: update player: " + JSON.stringify(items[0]));
          // change game status to incomplete - meaning that someone quit
          db.games.update({"_id": new ObjectID(_data.gameId)}, {'$set': {status: "incomplete"}}, function (err, items) {
            (err === null) ? _actions.success() : _actions.error();
          });

          // set challenge to cancelled
          db.challenges.update({_id: new ObjectID(_game.challengeId)}, {'$set': {status: "cancelled"}}, function (err) {
            console.log("err" + err);
            (err === null) ? _actions.success() : _actions.error();
          });

          updatePlayerInAGame(_data.userId, false);

        } else {
          _actions.error()
        }
      });
    });
  };

  deleteGameById = function (_gameId, _actions) {
    // make sure games collection exists
    db.collectionNames("games", function (err, names) {
      if (names.length > 0) {
        // delete game
        db.games.remove({_id: new ObjectID(_gameId)}, function (err, res) {
          if (res != "") {
            (err === null) ? _actions.success() : _actions.error();
          }
        });
      }
    });
  };

  deleteChallengeById = function (_challengeId, _actions) {
    // make sure games collection exists
    db.collectionNames("challenges", function (err, names) {
      if (names.length > 0) {
        // delete game
        db.challenges.remove({_id: new ObjectID(_challengeId)}, function (err, res) {
          if (res != "") {
            (err === null) ? _actions.success() : _actions.error();
          }
        });
      }
    });
  };


// utility mongo calls

  getGameById = function (_data, _actions, _callback) {
    // get game object
    db.games.find({"_id": new ObjectID(_data.gameId)}).toArray(function (err, items) {
      // if there were no errors
      if (items.length > 0) {
        if (err === null) {
          // make sure they are in the game
          if (findPlayerInGame(_data.playerId, items[0].players)) {

            _callback(items[0]); // send game object back

          } else {
            _actions.error()
          }
        } else {
          // player isnt part of the game - dont let them have it
          _actions.error();
        }
      }else{
        _actions.error();
      }
    });
  };


  removeCompletedGames = function (_actions) {
    db.games.remove({"status": "completed"}, function (err) {
      if (err === null) {
        _actions.success();
      } else {
        _actions.error();
      }
    });
  };

  updateUsersPlayedGamesCount = function(_gameObj, _actions){

    for (var i = 0; i < _gameObj.players.length; i++) {
      db.users.update({_id:new ObjectID(_gameObj.players[i].id)}, {$inc:{ gamesPlayed:1 }}, function(err){
        if (err === null) {
          _actions.success();
        } else {
          _actions.error();
        }
      });
    }

  };

  updatePlayerInAGame = function(_playerId, _value){
    db.users.update({_id:new ObjectID(_playerId)}, {'$set':{inAGame:_value}},function(err){
      console.log("updatePlayerInAGame: err:" + err);
    });
  };

  /**** END GAME CALLS ****/


  /**** GAME FUNCTIONS ****/

// creates game object
  function createGameObj(_players, _challengeId) {
    return {
      challengeId: _challengeId,
      deck: shuffle(createDeck(uno.deck)), // create Deck and shuffle it
      discardPile: [], // discard Pile
      players: buildPlayersObj(_players), // gather players
      // game status ( inprogress, complete, incomplete[someone quit or started a new game] )
      status: "created",
      allPlayersInGame: false,
      isReversed: false,
      winner: ""
    };
  }

// generates a deck for the game
  function createDeck(_deckObj) {
    var newDeck = [];
    for (var i = 0; i < _deckObj.length; i++) {
      for (var j = 0; j <= _deckObj[i].count; j++) {
        newDeck.push({
          "cardName": _deckObj[i].cardName,
          "svgName": _deckObj[i].svgName,
          "color": _deckObj[i].color,
          "value": _deckObj[i].value
        });
      }
    }
    return newDeck;
  }

// shuffle the deck
  function shuffle(deck) {
    var currentIndex = deck.length, temporaryValue, randomIndex;

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
  function buildPlayersObj(_players, _userId) {
    var players = [];

    for (var i = 0; i < _players.length; i++) {
      // full game players because game needs to hold state of each players hand and id
      players.push(
        new coreData.GamePlayerCurrUser({
          id: _players[i]._id,
          username: _players[i].username,
          hand: [],
          cardCount: 0,
          inGame: false,
          isMyTurn: false,
          calledUno: false,
          challengedUno: false
        })
      );
    }

    return players;
  }

// set player turn
  function setPlayerTurnById(_players, _userId) {
    //isMyTurn
    for (var i = 0, j = _players.length; i < j; i++) {
      // if this players id = userid make it their turn ( otherwise make it not their turn )
      _players[i].isMyTurn = (_players[i].id == _userId);
    }
  }

// make sure all all players are still in game (online)
  function checkAllPlayersPresent(_players) {
    var onePlayerAbscent = false;
    for (var i = 0; i < _players.length; i++) {
      console.log("checkplayerspres: " + JSON.stringify(_players[i]));
      if (_players[i].inGame == false) {
        onePlayerAbscent = true;
      }
    }
    return !onePlayerAbscent;
  }

// make sure player is part of a game
  function findPlayerInGame(_playerId, _players) {
    var playerInGame = false;
    for (var i = 0; i < _players.length; i++) {
      if (_players[i].id == _playerId) {
        playerInGame = true;
      }
    }
    return playerInGame;
  }

// get player object by their uid
  function getPlayerIndex(_playerId, _players) {
    var playerIndex = {};
    for (var i = 0; i < _players.length; i++) {
      if (_players[i].id == _playerId) {
        playerIndex = i;
      }
    }
    return playerIndex;
  }

  function checkPlayersChallengedUno(_gameObj) {
    var aPlayerChallengedUno = false;
    for (var i = 0, j = _gameObj.players.length; i < j; i++) {
      if (_gameObj.players[i].challengedUno) {
        aPlayerChallengedUno = true;
      }
    }
    return aPlayerChallengedUno;
  }

  function findPlayerWithOneCard(_gameObj) {
    var playerIndexWithOneCard = -1,
        playerIndexWTurn = getplayerIndexForTurn(_gameObj),
        prevPlayerIndex = getPrevPlayerIndex(_gameObj, playerIndexWTurn),
        twoBackPlayerIndex = getPrevPlayerIndex(_gameObj, prevPlayerIndex);

    // check last card played for action card
    if( (_gameObj.discardPile[_gameObj.discardPile.length-1].value == "wilddraw4") ||
      (_gameObj.discardPile[_gameObj.discardPile.length-1].value == "draw2") ){

      // reset "calledUno" prop for the player who the action card applied to
      // ( we have to do this because they no longer have one card left )
      _gameObj.players[prevPlayerIndex].calledUno = false;

      if(_gameObj.players[twoBackPlayerIndex].hand.length == 1){
        playerIndexWithOneCard = twoBackPlayerIndex;
      }
    }else if(_gameObj.discardPile[_gameObj.discardPile.length-1].value == "skip"){
      // it skipped someone so we need to check the person two back for if they have one card left
      if(_gameObj.players[twoBackPlayerIndex].hand.length == 1){
        playerIndexWithOneCard = twoBackPlayerIndex;
      }
    }else{
      // regular card - or wild
      if(_gameObj.players[prevPlayerIndex].hand.length == 1){
        playerIndexWithOneCard = prevPlayerIndex;
      }
    }
    return playerIndexWithOneCard;
  }

  function findPlayersWithOneCard(_gameObj){
    var indexArr = [];

    for (var i = 0, j = _gameObj.players.length; i < j; i++) {
      if (_gameObj.players[i].hand.length == 1) {
        indexArr.push(i);
      }
    }

    return indexArr;
  }


// make sure to call this following validate move to reupdate in db
  function calculatePlayersHandCount(_players) {
    for (var i = 0; i < _players.length; i++) {
      _players[i].cardCount = _players[i].hand.length;
    }
  }

// deal cards to players in beginning
  function dealToPlayers(_deck, _players) {
    for (var i = 0; i < _players.length; i++) {
      for (var j = 0; j < 7; j++) {
        // deal 7 cards
        _players[i].hand.push(_deck.pop());
      }
    }
  }

// get card object by its svgname from lookup object
  function getCardByName(_cardSvgName) {
    return uno.lookupDeck[_cardSvgName];
  }

// make sure the card played is actually in the hand (prevent cheating)
  function checkPlayedCardInPlayerHand(_playedCard, _playerHand) {
    var cardInHand = false;
    for (var i = 0; i < _playerHand.length; i++) {
      // not working for wilds ( because of color )
      console.log("checkPlayedCardInPlayerHand comp svgName: " + _playerHand[i].svgName + " : " + _playedCard.svgName);
      if ((_playerHand[i].svgName == _playedCard.svgName)) {
        cardInHand = true;
      }
    }
    return cardInHand;
  }

// resets all players calledUno
  function resetCallUnoEveryone(_gameObj) {
    for (var i = 0; i < _gameObj.players.length; i++) {
      // if they dont really have 1 card left then reset their calledUno prop
      if(_gameObj.players[i].hand.length != 1){
        _gameObj.players[i].calledUno = false;
      }
    }
  }

// ensure that playedCard can be played based on last card in discard pile
  function checkValidMove(_playedCard, _discardPile) {
    var lastCardPlayed = _discardPile[_discardPile.length - 1];

    return (_playedCard.color == lastCardPlayed.color) || // maybe change this back
      (_playedCard.value == lastCardPlayed.value) ||
      (_playedCard.value == "wild" ) ||
      (_playedCard.value == "wilddraw4" );
  }

// deal Initial Card (also will set player turn)
  function dealInitDiscardCard(_gameObj, _challengerId) {
    var cardToBeDealt = _gameObj.deck[_gameObj.deck.length - 1];
    console.log("cardToBeDealt - start: " + JSON.stringify(cardToBeDealt));
    switch (cardToBeDealt.value) {
      case "wild":
      case "wilddraw4":
        _gameObj.deck = shuffle(_gameObj.deck); // shuffle deck
        dealInitDiscardCard(_gameObj, _challengerId); // deal new card
        //setPlayerTurnById(_gameObj.players, _challengerId);
        break;
      case "reverse":
      case "skip":
      case "draw2":
        _gameObj.discardPile.push(_gameObj.deck.pop());
        handleActionCard(_gameObj, cardToBeDealt, _challengerId);
        break;
      default:
        _gameObj.discardPile.push(_gameObj.deck.pop());
        setPlayerTurnById(_gameObj.players, _challengerId);
        break;
    }
  }

// handles wild, wilddraw4, reverse, skip and draw2
  function handleActionCard(_gameObj, _cardPlayed, _userId, _chosenColor) {
    var currPlayerIndex = getPlayerIndex(_userId, _gameObj.players),
      nextPlayerIndex = getNextPlayerIndex(_gameObj, currPlayerIndex);

    // handle based on
    switch (_cardPlayed.value) {
      case "wild":
        // doesnt affect whos turn it is ( it will naturally be the next players turn )
        // we can do this because its already been added to discard pile
        _gameObj.discardPile[_gameObj.discardPile.length - 1].color = _chosenColor;
        setPlayerTurns(_gameObj, currPlayerIndex, "");
        break;
      case "wilddraw4":
        // draw 4 to next player and skip their turn
        //_gameObj.activeColor = _chosenColor;
        _gameObj.discardPile[_gameObj.discardPile.length - 1].color = _chosenColor;
        drawToPlayerByIndex(_gameObj, nextPlayerIndex, 4);
        setPlayerTurns(_gameObj, currPlayerIndex, "skip");
        break;
      case "reverse":
        // if there are 2 players
        if(_gameObj.players.length == 2){
          // reverse acts like a skip
          setPlayerTurns(_gameObj, currPlayerIndex, "skip");
        }else{ // there are more than 2 players
          // reverse order
          _gameObj.isReversed = !_gameObj.isReversed; // change isReversed
          setPlayerTurns(_gameObj, currPlayerIndex, "");
        }
        break;
      case "skip":
        // skip next player
        setPlayerTurns(_gameObj, currPlayerIndex, "skip");
        break;
      case "draw2":
        // draw 2 to next player and skip their turn
        drawToPlayerByIndex(_gameObj, nextPlayerIndex, 2);
        setPlayerTurns(_gameObj, currPlayerIndex, "skip");
        break;
    }
  }


  function setPlayerTurns(_gameObj, _currPlayerIndex, _action) {
    var nextPlayerIndex = getNextPlayerIndex(_gameObj, _currPlayerIndex);
    switch (_action) {
      case "skip":
        // skip next players turn, result of any of the following:
        // skip, draw2, wilddraw4
        var playerIndexAfterSkip = getNextPlayerIndex(_gameObj, nextPlayerIndex);
        console.log("setPlayerTurns: playerIndexAfterSkip: " + playerIndexAfterSkip);
        setPlayerTurnByIndex(_gameObj.players, playerIndexAfterSkip);
        break;
      case "":
        // make it the next persons turn
        setPlayerTurnByIndex(_gameObj.players, nextPlayerIndex);
        break;
      default:
        break;
    }
  }

  function getplayerIndexForTurn(_gameObj){
    for (var i = 0, j = _gameObj.players.length; i < j; i++) {
      if(_gameObj.players[i].isMyTurn == true){
        return i;
      }
    }
  }

// grabs the index of the next player accounting for reversed order
  function getNextPlayerIndex(_gameObj, _currPlayerIndex) {
    var nextPlayerIndex = 0;
    if (_gameObj.isReversed) {
      console.log("is reversed");
      // if the order is reversed ( counter-clockwise )
      nextPlayerIndex = (_currPlayerIndex == 0) ? (_gameObj.players.length - 1) : (_currPlayerIndex - 1);
    } else {
      console.log("not reversed");
      // if the order is regular ( clockwise )
      nextPlayerIndex = (_currPlayerIndex == _gameObj.players.length - 1) ? 0 : (_currPlayerIndex + 1);
    }
    console.log("getNextPlayerIndex: nextPlayerIndex: " + nextPlayerIndex);
    return nextPlayerIndex;
  }

  function getPrevPlayerIndex(_gameObj, _currPlayerIndex) {
    var nextPlayerIndex = 0;

    // opposite of next player
    if (!_gameObj.isReversed) {
      console.log("not reversed");
      // if the order is reversed ( counter-clockwise )
      nextPlayerIndex = (_currPlayerIndex == 0) ? (_gameObj.players.length - 1) : (_currPlayerIndex - 1);
    } else {
      console.log("is reversed");
      // if the order is regular ( clockwise )
      nextPlayerIndex = (_currPlayerIndex == _gameObj.players.length - 1) ? 0 : (_currPlayerIndex + 1);
    }
    console.log("getNextPlayerIndex: nextPlayerIndex: " + nextPlayerIndex);
    return nextPlayerIndex;
  }

// draws given number of cards to a player given their index
  function drawToPlayerByIndex(_gameObj, _playerIndex, _numCards) {
    for (var i = 0; i < _numCards; i++) {
      console.log("playerIndex: " + _playerIndex);
      console.log("pleyer obj: " + JSON.stringify(_gameObj.players[_playerIndex]));
      _gameObj.players[_playerIndex].hand.push(_gameObj.deck.pop()); // pop a card into their hand
    }
  }

  function setPlayerTurnByIndex(_players, _playerIndex) {
    console.log("setPlayerTurnByIndex: index: " + JSON.stringify(_playerIndex));
    // set all turns to false
    for (var i = 0, j = _players.length; i < j; i++) {
      _players[i].isMyTurn = false;
    }
    console.log("setPlayerTurnByIndex player: " + JSON.stringify(_players[_playerIndex]));
    // set players turn by index
    _players[_playerIndex].isMyTurn = true; // having an issue

  }

// remove card played
  function removeCardPlayerHand(_playerHand, _playedCard) {
    // instead may want to assign each card in deck an id and use the id to delete in one line rather than using a loop and wasting memory
    for (var i = 0; i < _playerHand.length; i++) {
      if (_playerHand[i].svgName == _playedCard.svgName) {
        //_playerHand.pop(); // revmove card from players hand
        _playerHand.splice(i, 1);
        break;
      }
    }
  }

// play card
  function playCard() {

  }

// add card to player hand
  function addCardToPlayerHand(_hand, _cardDrawn) {
    _hand.push(_cardDrawn);
  }

// refill deck using discardPile
  function refillDeck(_gameObj) {
    // take all but last item from discard pile and throw it into deck
    for (var i = 0, j = _gameObj.discardPile.length - 1; i < j; i++) {
      _gameObj.deck.push(_gameObj.discardPile.shift());
    }
    // shuffle it after taking cards from discardPile
    _gameObj.deck = shuffle(_gameObj.deck);
  }

  /**** END GAME FUNCTIONS ****/

  // bind internally used functions to "self"
  self.setPlayerInGame = setPlayerInGame;
  self.createGame = createGame;
  self.checkPlayersInGameRoom = checkPlayersInGameRoom;
  self.getGameByChallengeId = getGameByChallengeId;
  self.getGameByGameId = getGameByGameId;
  self.validateMove = validateMove;
  self.drawCard = drawCard;
  self.challengeUno = challengeUno;
  self.sayUno = sayUno;
  self.quitGame = quitGame;
  self.removeCompletedGames = removeCompletedGames;


  return self;
};