const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['TEXT', 'VOICE'], required: true },
  server: { type: mongoose.Schema.Types.ObjectId, ref: 'Server', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Channel', channelSchema);
