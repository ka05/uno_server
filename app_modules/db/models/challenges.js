const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;

class Challenger {
  constructor(id, username, status) {
    this._id = id;
    this.username = username;
    this.status = status;
  }
}

const ChallengerSchema = {
  _id: ObjectID,
  username: String,
  status: String
}

const challengesSchema = new mongoose.Schema({
  challenger: ChallengerSchema,
  usersChallenged:[ChallengerSchema],
  timestamp: String,
  status: String,
});

const Challenge = mongoose.model('Challenge', challengesSchema);

module.exports = {
  Challenger,
  Challenge,
}