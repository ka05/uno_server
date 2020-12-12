const mongoose = require('mongoose');
const usersSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  socketId: String,
  winCount: Number,
  gamesPlayed: Number,
  online: Boolean,
  inAGame: Boolean,
  token: String,
  profileImg: String,
});

const User = mongoose.model('User', usersSchema);

module.exports = {
  User,
};