const mongoose = require('mongoose');

const BehaviorSchema = new mongoose.Schema({
  signupData: {
    fullName: String,
    username: String,
    email: String,
    password: String,
    dob: String,
    timestamp: { type: Date, default: Date.now }
  },
  behaviorData: {
    typingDelays: [Number],
    fieldFocusOrder: [String],
    mouseMoves: Number
  }
});

module.exports = mongoose.model('UserBehavior', BehaviorSchema);
