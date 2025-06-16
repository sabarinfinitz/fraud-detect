// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fingerprintTemplate: { type: String }, // placeholder for fingerprint data
  behavioralProfile: {
    typingSpeed: Number,
    averageSessionTime: Number,
    deviceList: [String],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
