const mongoose = require('mongoose');
const attemptLogSchema = new mongoose.Schema({
  userId: String,
  timestamp: { type: Date, default: Date.now },
  trustScore: Number,
  flags: [String],
  phrase: String
});
module.exports = mongoose.model('AttemptLog', attemptLogSchema);
