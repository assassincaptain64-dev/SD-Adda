const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  attachments: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
