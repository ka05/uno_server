/**
 * Created by claytonherendeen on 9/25/15.
 */
module.exports = function (db) {
  const self = this,
    async = require('async'),
    ObjectID = require('mongodb').ObjectID,
    coreData = require('../app_modules/coreData/coreData.js'),
    uno = require('./../app_modules/coreData/deck');

  const {
    Challenge,
    Game,
    User,
    findById,
    updateModel,
  } = db;

  /**** GAME CALLS ****/

    // create the game and set things up
  const createGame = function (_data, _actions) {
      _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
      console.log("createGame: " + JSON.stringify(_data));

      // find challenge
      findById(Challenge, _data.challengeId, function (err, item) {
        if (item) {
          const challengerId = item.challenger._id.toString();
          // ensure the user trying to start this game is in fact the challenger
          if (_data.userId === challengerId) {

            // build array
            const gameUserIds = [challengerId];

            for (let i = 0, j = item.usersChallenged.length; i < j; i++) {
              if (item.usersChallenged[i].status === "accepted") {
                gameUserIds.push(item.usersChallenged[i]._id.toString());
              }
            }

            async.mapSeries(gameUserIds, function (id, mapResultCallback) {
              findById(User, id, function (err, item) {
                if (err) return mapResultCallback(err);
                mapResultCallback(null, {
                  _id: item._id,
                  username: item.username,
                  profileImg: item.profileImg
                });
              })
            }, function (err, gameUsers) {
              // results is an array of names
              const game = createGameObj(gameUsers, item._id);

              // run initial deal to players
              dealToPlayers(game.deck, game.players);
              calculatePlayersHandCount(game.players);

              // after dealing -> set active player to the host
              // unless action card was first card dealt then apply that action and go to next player
              dealInitDiscardCard(game, challengerId);

              // create game with generated ID
              game.save(function (err) {
                // update challenge status to "ready" => ready to play
                // ( implies user1, "the challenger" has created the game and launched it )
                // Game cannot start until all players have entered game room
                if (err === null) {
                  // set challenger inGame
                  setPlayerInGame({
                    challengeId: _data.challengeId,
                    userId: challengerId
                  }, {
                    success: function () {
                      // figure out what status is when
                      // update game status to ready - allows all players to join game room and begin
                      updateModel(Challenge, item._id, function (item) {
                        item.status = "ready";
                        return item;
                      }, function (err, item) {
                        (err === null) ? _actions.success(new coreData.SensitiveGame(game, _data.userId)) : _actions.error()
                      });
                    },
                    error: function () {
                      _actions.error();
                    }
                  });
                } else {
                  _actions.error()
                }
              });
            });
          } else {
            _actions.error("You are not the owner");
          }
        } else {
          _actions.error("error creating game");
        }
      });
    };

  // check to see if all players are in game room (ready to play )
  const checkPlayersInGameRoom = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
    console.log("checkPlayersInGameRoom: " + JSON.stringify(_data));

    // get gameObj
    findById(Game, _data.gameId, function (err, item) {
      if (item) {
        if (checkAllPlayersPresent(item.players)) {
          console.log("all players present");
          // change game status to inprogress ( start game ) if all players are present
          updateModel(Game, _data.game, function(item){
            item.status = "inprogress";
            return item;
          }, function(err){
            (err === null) ? _actions.success(item) : _actions.error();
          });
        } else {
          // at least one player is abscent or not yet in the game
          console.log("one absent");
          _actions.error();
        }
      } else {
        console.log("error checking players in game room");
        _actions.error();
      }
    });
  };

  // sets a player in the game
  const setPlayerInGame = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
    console.log(`setPlayerInGame: [userId:${_data.userId}, challengeId: ${_data.challengeId}]`);

    // TODO :Find out why this is erroring
    Game.findOneAndUpdate(
      {
        "challengeId": new ObjectID(_data.challengeId),
        "players.id": new ObjectID(_data.userId)
      },
      {'$set': {"players.$.inGame": true}},
      function (err, item) {
        if (err === null) {
          updatePlayerInAGame(_data.userId, true);
          _actions.success();
        } else {
          console.log("Person not in game");
          _actions.error();
        }
      });
  };

  // get a game by its challengeId ( two games will never have the same challengeId )
  const getGameByChallengeId = function (_data, _actions) {
    // make sure user is in the game
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
    console.log(`getGameByChallengeId: ${_data.challengeId}`);

    Game.findOne({challengeId: new ObjectID(_data.challengeId)}, function (err, item) {
      if (item) {
        console.log("getGameByChallengeId: items.length > 0");
        if (findPlayerInGame(_data.userId, item.players)) {
          console.log("getGameByChallengeId: findPlayerInGame true");
          (err === null) ? _actions.success(new coreData.SensitiveGame(item, _data.userId)) : _actions.error()
        } else {
          console.log("getGameByChallengeId: findPlayerInGame false");
          // player isnt part of the game - dont let them have it
          _actions.error();
        }
      } else {
        _actions.error();
      }
    });
  };

  // get a game by its game id
  const getGameByGameId = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    getGameById({gameId: _data.gameId, playerId: _data.userId}, _actions, function (game) {
      _actions.success(new coreData.SensitiveGame(game, _data.userId));
    });
  };

  // make sure card that player played was a valid card to play
  const validateMove = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;
    console.log("validateMove" + JSON.stringify(_data));
    const playedCardSvgName = _data.svgName, // this will be a card name
      chosenColor = _data.chosenColor, // color from wildcard
      playerId = _data.userId,
      gameId = _data.gameId;

    getGameById({gameId: _data.gameId, playerId: _data.userId}, _actions, function (game) {
      const currPlayerIndex = getPlayerIndex(_data.userId, game.players);
      // check if its their turn
      if (game.players[currPlayerIndex].isMyTurn) {
        const playedCard = getCardByName(playedCardSvgName);

        // playedCard must exist in playerHand
        if (checkPlayedCardInPlayerHand(playedCard, game.players[currPlayerIndex].hand)) {
          // ensure move is valid
          if (checkValidMove(playedCard, game.discardPile)) {
            console.log("ValidateMove player: " + game.players[currPlayerIndex].username);

            resetCallUnoEveryone(game);

            // still have more than one card - play card
            game.discardPile.push(playedCard); // add played card to discard pile ( if move was valid )
            removeCardPlayerHand(game.players[currPlayerIndex].hand, playedCard); // update active players hand to remove played card from hand
            const handLength = game.players[currPlayerIndex].hand.length;

            // Check for win -> their hand is empty ( they played their last card ) :. WIN!
            if (handLength === 0) {
              // update game object with winner
              game.winner = game.players[currPlayerIndex].username;
              game.status = "completed";

              for (let i = 0, j = game.players.length; i < j; i++) {
                updatePlayerInAGame(game.players[i].id, false);
              }

              // update player win count in db
              updateModel(User, playerId, function (item) {
                item.winCount++;
                return item;
              }, function (err) {
                if (err === null) {
                  console.log("updated win count for " + game.players[currPlayerIndex].username);

                  // make sure challenges collection exists -> delete challenge
                  // delete Challenge
                  Challenge.deleteOne({_id: new ObjectID(game.challengeId)}, function (err, res) {
                    console.log("delete challenge: err " + err);
                    console.log("delete challenge: " + JSON.stringify(res));

                    updateUsersPlayedGamesCount(game, {
                      success: function () {
                        console.log("successfully updated user gamesPlayed count");
                      },
                      error: function () {
                        console.log("error updating user gamesPlayed count");
                      }
                    });
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
              (chosenColor && (uno.possibleColorsArr.indexOf(chosenColor) !== -1)) ?
                handleActionCard(game, playedCard, playerId, chosenColor) :
                handleActionCard(game, playedCard, playerId);
            } else {
              setPlayerTurnByIndex(game.players, getNextPlayerIndex(game, currPlayerIndex)); // set next players turn
            }
            calculatePlayersHandCount(game.players); // recalculate card count for players

            // Update hand in db
            // ( NEED TO CHANGE THIS TO ONLY UPDATE WHAT IS NECESSARY INTO THE WHOLE OBJ )
            updateGame(_data.gameId, game, playerId, _actions);
          } else {
            // Move was NOT valid
            // handleResetCalledUno(game, playerId, currPlayerIndex);
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

  function handleResetCalledUno(_gameObj, _currPlayerIndex) {
    // reset calledUno for me
    const playersIndexWithOneCard = findPlayersWithOneCard(_gameObj);

    // one of the players who has one card is me
    if (playersIndexWithOneCard.indexOf(_currPlayerIndex) !== -1) {
      _gameObj.players[_currPlayerIndex].calledUno = false;
    }
  }

  // draw a card
  const drawCard = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    const playerId = _data.userId,
      gameId = _data.gameId;

    getGameById({gameId: gameId, playerId: playerId}, _actions, function (game) {
      const cardDrawn = game.deck.pop();

      // check if its their turn
      const currPlayerIndex = getPlayerIndex(playerId, game.players);
      console.log("player: " + JSON.stringify(game.players[currPlayerIndex]));
      if (game.players[currPlayerIndex].isMyTurn) {

        // check if deck is almost empty and refill it if it is
        if (game.deck.length === 1) {
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

        updateGame(gameId, game, playerId, _actions);
      } else {
        console.log("It is NOT their turn");
        _actions.error();
      }
    });
  };

  // when a player wants to call out another player for not saying uno.
  const challengeUno = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    const gameId = _data.gameId,
      playerId = _data.userId;

    getGameById({gameId: gameId, playerId: playerId}, _actions, function (game) {

      // first check the card that was last played ( account for skip, reverse, +2, Wild +4 )

      // check if any players have one card left
      const playerIndexWithOneCard = findPlayerWithOneCard(game);
      if (playerIndexWithOneCard !== -1) {

        // make sure they arent calling themselves out for not saying uno
        if (game.players[playerIndexWithOneCard].id !== playerId) {
          // if they did not call uno yet
          if (!game.players[playerIndexWithOneCard].calledUno) {
            console.log("They didnt call uno yet, call them out on that");

            // draw 2 cards to that player (as a penalty for not saying uno)
            drawToPlayerByIndex(game, playerIndexWithOneCard, 2);
            calculatePlayersHandCount(game.players); // recalculate card count for players

            // update the game
            updateGame(gameId, game, playerId, _actions);
          } else {
            console.log("They have already called uno.");
            _actions.error("They have already called uno.");
          }
        } else {
          console.log("You cant challenge yourself for having uno");
          _actions.error("You cant challenge yourself for having uno");
        }

      } else {
        console.log("Nobody has 1 card left, so you cant call them out.");
        _actions.error("Nobody has 1 card left, so you cant call them out.");
      }
    });
  };

  const updateGame = function(gameId, game, currPlayerId, _actions){
    updateModel(Game, gameId, function (item) {
      item.deck = game.deck;
      item.discardPile = game.discardPile;
      item.players = game.players;
      item.activePlayer = game.activePlayer;
      item.status = game.status;
      item.winner = game.winner;
      return item;
    }, function (err) {
      console.log("update err: " + err);
      (err === null) ? _actions.success(new coreData.SensitiveGame(game, currPlayerId)) : _actions.error();
    });
  }

  // when a player is about to play a card leaving one left in their hand
  // they must say uno before placing the card
  const sayUno = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    const gameId = _data.gameId,
      playerId = _data.userId;

    getGameById({gameId: gameId, playerId: playerId}, _actions, function (game) {
      const currPlayerIndex = getPlayerIndex(playerId, game.players),
        currPlayerHandLength = game.players[currPlayerIndex].hand.length;

      // player hasnt played the card yet but is about to
      if (currPlayerHandLength === 2) {
        // validate cards left to make sure at least one can be played
        if (checkValidMove(game.players[currPlayerIndex].hand[0], game.discardPile) ||
          checkValidMove(game.players[currPlayerIndex].hand[1], game.discardPile)) {

          // not efficient
          game.players[currPlayerIndex].calledUno = true;
          game.save();
          _actions.success(new coreData.SensitiveGame(game, playerId));
        } else {
          console.log("You cant play any cards so you wont have uno.");
          _actions.error("You cant play any cards so you wont have uno.");
        }
      }
      // they have already played the card
      else if (currPlayerHandLength === 1) {
        // but no one has called them out for not saying uno yet
        // :. they can still call uno so they dont get penalized
        if (!checkPlayersChallengedUno(game)) {

          game.players[currPlayerIndex].calledUno = true;
          game.save();
          _actions.success(new coreData.SensitiveGame(game, playerId));
        } else {
          console.log("Sorry you too late");
          _actions.error("Sorry you too late.");
        }
      }
    });
  };

  const quitGame = function (_data, _actions) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    const gameId = _data.gameId,
      playerId = _data.userId;

    // change status of game - delete game obj
    getGameById({gameId: gameId, playerId: playerId}, _actions, function (_game) {

      // change player status
      for (let i = 0; i < _game.players.length; i++) {
        if (_game.players[i]._id === _data.userId) {
          _game.players[i].inGame = false;
        }
      }
      console.log('player quit');

      // change game status to incomplete - meaning that someone quit
      _game.status = "incomplete";
      _game.save();

      // set current player inGame to false
      updatePlayerInAGame(_data.userId, false);

      // set challenge to cancelled
      cancelChallenge(_game.challengeId, _actions);

      _actions.success();
    });
  };

  const cancelChallenge = function (_challengeId, _actions) {
    updateModel(Challenge, _challengeId, function (item) {
      item.status = "cancelled";
      return item;
    }, function (err) {
      (err === null) ? _actions.success() : _actions.error();
    });
  };

  const deleteGameById = function (_gameId, _actions) {
    // delete game
    Game.removeOne({_id: new ObjectID(_gameId)}, function (err, res) {
      (err === null) ? _actions.success() : _actions.error();
    });
  };

  const deleteChallengeById = function (_challengeId, _actions) {

    // delete game
    Challenge.removeOne({_id: new ObjectID(_challengeId)}, function (err, res) {
      (err === null) ? _actions.success() : _actions.error();
    });
  };

  // utility mongo calls
  const getGameById = function (_data, _actions, _callback) {
    _data = (typeof _data === 'string') ? JSON.parse(_data) : _data;

    // get game object
    findById(Game, _data.gameId, function (err, item) {
      // if there were no errors
      if (item && err === null) {
        // make sure they are in the game
        if (findPlayerInGame(_data.playerId, item.players)) {
          _callback(item); // send game object back
        } else {
          _actions.error();
        }
      } else {
        // player isn't part of the game - dont let them have it
        _actions.error();
      }
    });
  };

  const removeCompletedGames = function (_actions) {
    Game.remove({status: "completed"}, function (err) {
      (err) ? _actions.error() : _actions.success();
    });
  };

  const updateUsersPlayedGamesCount = function (_gameObj, _actions) {
    async.mapSeries(_gameObj.players, function (player, mapResultCallback) {
      updateModel(User, player.id, function (item) {
        let gamesPlayed = item.gamesPlayed != null ? item.gamesPlayed : 0;
        gamesPlayed++;
        item.gamesPlayed = gamesPlayed;
        return item;
      }, function (err) {
        mapResultCallback(err)
      });
    }, function (err, errors) {
      (err) ? _actions.error() : _actions.success();
    });
  };

  const updatePlayerInAGame = function (_playerId, _value) {
    updateModel(User, _playerId, function (item) {
      item.inAGame = _value;
      return item;
    }, function (err) {
      console.log("updatePlayerInAGame: err:" + err);
      console.log("updatePlayerInAGame: playerId" + _playerId);
    });
  };

  /**** END GAME CALLS ****/


  /**** GAME FUNCTIONS ****/

  // creates game object
  function createGameObj(_players, _challengeId) {
    return new Game({
      challengeId: _challengeId,
      deck: shuffle(createDeck(uno.deck)), // create Deck and shuffle it
      discardPile: [], // discard Pile
      players: buildPlayersObj(_players), // gather players
      // game status ( inprogress, complete, incomplete[someone quit or started a new game] )
      status: "created",
      allPlayersInGame: false,
      isReversed: false,
      winner: ""
    });
  }

  // generates a deck for the game
  function createDeck(_deckObj) {
    const newDeck = [];
    for (let i = 0; i < _deckObj.length; i++) {
      for (let j = 0; j <= _deckObj[i].count; j++) {
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
    let currentIndex = deck.length, temporaryValue, randomIndex;

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
    const players = [];

    for (let i = 0; i < _players.length; i++) {
      // full game players because game needs to hold state of each players hand and id
      players.push(
        new coreData.GamePlayerCurrUser({
          id: _players[i]._id,
          username: _players[i].username,
          profileImg: _players[i].profileImg,
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
    for (let i = 0, j = _players.length; i < j; i++) {
      // if this players id = userid make it their turn ( otherwise make it not their turn )
      _players[i].isMyTurn = (_players[i].id === _userId);
    }
  }

  // make sure all all players are still in game (online)
  function checkAllPlayersPresent(_players) {
    let onePlayerAbscent = false;
    for (let i = 0; i < _players.length; i++) {
      console.log("checkAllPlayersPresent: " + JSON.stringify(_players[i]));
      if (_players[i].inGame === false) {
        onePlayerAbscent = true;
      }
    }
    return !onePlayerAbscent;
  }

  // make sure player is part of a game
  function findPlayerInGame(_playerId, _players) {
    let playerInGame = false;
    for (let i = 0; i < _players.length; i++) {
      if (_players[i].id === _playerId) {
        playerInGame = true;
      }
    }
    return playerInGame;
  }

  // get player object by their uid
  function getPlayerIndex(_playerId, _players) {
    let playerIndex = {};
    for (let i = 0; i < _players.length; i++) {
      if (_players[i].id === _playerId) {
        playerIndex = i;
      }
    }
    return playerIndex;
  }

  function checkPlayersChallengedUno(_gameObj) {
    let aPlayerChallengedUno = false;
    for (let i = 0, j = _gameObj.players.length; i < j; i++) {
      if (_gameObj.players[i].challengedUno) {
        aPlayerChallengedUno = true;
      }
    }
    return aPlayerChallengedUno;
  }

  function findPlayerWithOneCard(_gameObj) {
    let playerIndexWithOneCard = -1,
      playerIndexWTurn = getPlayerIndexForTurn(_gameObj),
      prevPlayerIndex = getPrevPlayerIndex(_gameObj, playerIndexWTurn),
      twoBackPlayerIndex = getPrevPlayerIndex(_gameObj, prevPlayerIndex);

    // check last card played for action card
    if ((_gameObj.discardPile[_gameObj.discardPile.length - 1].value == "wilddraw4") ||
      (_gameObj.discardPile[_gameObj.discardPile.length - 1].value == "draw2")) {

      // reset "calledUno" prop for the player who the action card applied to
      // ( we have to do this because they no longer have one card left )
      _gameObj.players[prevPlayerIndex].calledUno = false;

      if (_gameObj.players[twoBackPlayerIndex].hand.length === 1) {
        playerIndexWithOneCard = twoBackPlayerIndex;
      }
    } else if (_gameObj.discardPile[_gameObj.discardPile.length - 1].value == "skip") {
      // it skipped someone so we need to check the person two back for if they have one card left
      if (_gameObj.players[twoBackPlayerIndex].hand.length === 1) {
        playerIndexWithOneCard = twoBackPlayerIndex;
      }
    } else {
      // regular card - or wild
      if (_gameObj.players[prevPlayerIndex].hand.length === 1) {
        playerIndexWithOneCard = prevPlayerIndex;
      }
    }
    return playerIndexWithOneCard;
  }

  function findPlayersWithOneCard(_gameObj) {
    const indexArr = [];

    for (let i = 0, j = _gameObj.players.length; i < j; i++) {
      if (_gameObj.players[i].hand.length === 1) {
        indexArr.push(i);
      }
    }
    return indexArr;
  }

  // make sure to call this following validate move to reupdate in db
  function calculatePlayersHandCount(_players) {
    for (let i = 0; i < _players.length; i++) {
      _players[i].cardCount = _players[i].hand.length;
    }
  }

  // deal cards to players in beginning
  function dealToPlayers(_deck, _players) {
    for (let i = 0; i < _players.length; i++) {
      for (let j = 0; j < 7; j++) {
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
    let cardInHand = false;
    for (let i = 0; i < _playerHand.length; i++) {
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
    for (let i = 0; i < _gameObj.players.length; i++) {
      // if they dont really have 1 card left then reset their calledUno prop
      if (_gameObj.players[i].hand.length !== 1) {
        _gameObj.players[i].calledUno = false;
      }
    }
  }

  // ensure that playedCard can be played based on last card in discard pile
  function checkValidMove(_playedCard, _discardPile) {
    let lastCardPlayed = _discardPile[_discardPile.length - 1];

    return (_playedCard.color == lastCardPlayed.color) || // maybe change this back
      (_playedCard.value == lastCardPlayed.value) ||
      (_playedCard.value == "wild") ||
      (_playedCard.value == "wilddraw4");
  }

  // deal Initial Card (also will set player turn)
  function dealInitDiscardCard(_gameObj, _challengerId) {
    let cardToBeDealt = _gameObj.deck[_gameObj.deck.length - 1];
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
    console.log("_gameObj.discardPile - start: " + JSON.stringify(_gameObj.discardPile));
  }

  // handles wild, wilddraw4, reverse, skip and draw2
  function handleActionCard(_gameObj, _cardPlayed, _userId, _chosenColor) {
    const currPlayerIndex = getPlayerIndex(_userId, _gameObj.players),
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
        if (_gameObj.players.length === 2) {
          // reverse acts like a skip
          setPlayerTurns(_gameObj, currPlayerIndex, "skip");
        } else { // there are more than 2 players
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
    const nextPlayerIndex = getNextPlayerIndex(_gameObj, _currPlayerIndex);
    switch (_action) {
      case "skip":
        // skip next players turn, result of any of the following:
        // skip, draw2, wilddraw4
        const playerIndexAfterSkip = getNextPlayerIndex(_gameObj, nextPlayerIndex);
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

  function getPlayerIndexForTurn(_gameObj) {
    for (let i = 0, j = _gameObj.players.length; i < j; i++) {
      if (_gameObj.players[i].isMyTurn === true) {
        return i;
      }
    }
  }

  // grabs the index of the next player accounting for reversed order
  function getNextPlayerIndex(_gameObj, _currPlayerIndex) {
    let nextPlayerIndex = 0;
    if (_gameObj.isReversed) {
      console.log("is reversed");
      // if the order is reversed ( counter-clockwise )
      nextPlayerIndex = (_currPlayerIndex === 0) ? (_gameObj.players.length - 1) : (_currPlayerIndex - 1);
    } else {
      console.log("not reversed");
      // if the order is regular ( clockwise )
      nextPlayerIndex = (_currPlayerIndex === _gameObj.players.length - 1) ? 0 : (_currPlayerIndex + 1);
    }
    console.log("getNextPlayerIndex: nextPlayerIndex: " + nextPlayerIndex);
    return nextPlayerIndex;
  }

  function getPrevPlayerIndex(_gameObj, _currPlayerIndex) {
    let nextPlayerIndex = 0;

    // opposite of next player
    if (!_gameObj.isReversed) {
      console.log("not reversed");
      // if the order is reversed ( counter-clockwise )
      nextPlayerIndex = (_currPlayerIndex === 0) ? (_gameObj.players.length - 1) : (_currPlayerIndex - 1);
    } else {
      console.log("is reversed");
      // if the order is regular ( clockwise )
      nextPlayerIndex = (_currPlayerIndex === _gameObj.players.length - 1) ? 0 : (_currPlayerIndex + 1);
    }
    console.log("getNextPlayerIndex: nextPlayerIndex: " + nextPlayerIndex);
    return nextPlayerIndex;
  }

  // draws given number of cards to a player given their index
  function drawToPlayerByIndex(_gameObj, _playerIndex, _numCards) {
    for (let i = 0; i < _numCards; i++) {
      console.log("playerIndex: ", _playerIndex);
      console.log("player: ", _gameObj.players[_playerIndex]);
      _gameObj.players[_playerIndex].hand.push(_gameObj.deck.pop()); // pop a card into their hand
    }
  }

  function setPlayerTurnByIndex(_players, _playerIndex) {
    console.log("setPlayerTurnByIndex: index: " + JSON.stringify(_playerIndex));
    // set all turns to false
    for (let i = 0, j = _players.length; i < j; i++) {
      _players[i].isMyTurn = false;
    }
    console.log("setPlayerTurnByIndex player: " + JSON.stringify(_players[_playerIndex]));
    // set players turn by index
    _players[_playerIndex].isMyTurn = true; // having an issue
  }

  // remove card played
  function removeCardPlayerHand(_playerHand, _playedCard) {
    // instead may want to assign each card in deck an id and use the id to delete in one line rather than using a loop and wasting memory
    for (let i = 0; i < _playerHand.length; i++) {
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
    for (let i = 0, j = _gameObj.discardPile.length - 1; i < j; i++) {
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