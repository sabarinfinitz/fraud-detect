const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserBehavior'
  },
  email: String,
  username: String,
  jwtToken: String,
  ipAddress: String,
  geoLocation: Object,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LoginLog', LoginLogSchema);
