const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['online', 'offline', 'busy'], default: 'offline' },
  servers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Server' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
