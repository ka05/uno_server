const mongoose = require('mongoose');

const CardModel = {
  cardName: String,
  svgName: String,
  color: String,
  value: String,
}

const PlayerModel = {
  id: String,
  username: String,
  profileImg: String,
  hand: [CardModel],
  cardCount: Number,
  inGame: Boolean,
  isMyTurn: Boolean,
  calledUno: Boolean,
  challengedUno: Boolean,
}

const gamesSchema = new mongoose.Schema({
  challengeId: String,
  deck: [CardModel],
  discardPile: [CardModel],
  players: [PlayerModel],
  activePlayer: String,
  status: String,
  allPlayersInGame: Boolean,
  isReversed: Boolean,
  winner: String,
});

const Game = mongoose.model('Game', gamesSchema);

module.exports = {
  Game,
};