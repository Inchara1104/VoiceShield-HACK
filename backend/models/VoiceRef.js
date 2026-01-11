const mongoose = require('mongoose');
const voiceRefSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  avgVolume: Number,
  avgEnergy: Number,
  avgTempo: Number,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('VoiceRef', voiceRefSchema);
