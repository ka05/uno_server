/**
 * Created by claytonherendeen on 10/24/15.
 */
const mongoose = require('mongoose');
const models = require('./models');
const ObjectID = require('mongodb').ObjectID;
const databaseName = process.env.MONGO_DATABASE_NAME || "uno";
const databaseHost = process.env.MONGO_DATABASE_HOST || "localhost:27017";
const credentials = {
  username: process.env.MONGO_USERNAME || "",
  password: process.env.MONGO_PASSWORD || "",
};
mongoose.connect(
  `mongodb+srv://${credentials.username}:${credentials.password}@${databaseHost}/${databaseName}?retryWrites=true&w=majority`,
  {useNewUrlParser: true}
);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
});

const getObjectId = function (id) {
  return (typeof id === 'string') ? new ObjectID(id) : id;
}

const findById = function (DBModel, id, callback) {
  DBModel.findOne({_id: getObjectId(id)}, callback);
}

const updateModel = function (DBModel, id, updateModelProps, callback) {
  findById(DBModel, id, function (err, item) {
    if (item) {
      const itemToSave = updateModelProps(item);
      itemToSave.save();
    }
    callback(err, item);
  });
};

const insertModel = function (DBModel, model, callback) {
  DBModel.create(model, callback);
}

const helperFunctions = {
  findById,
  updateModel,
  insertModel,
}

module.exports = {
  db,
  ...models,
  ...helperFunctions,
};