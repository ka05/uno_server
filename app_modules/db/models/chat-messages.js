const mongoose = require('mongoose');
const chatMessagesSchema = new mongoose.Schema({
  sender: String,
  message: String,
  roomId: String,
  timestamp: String,
});

const ChatMessage = mongoose.model('ChatMessage', chatMessagesSchema);

module.exports = {
  ChatMessage,
};