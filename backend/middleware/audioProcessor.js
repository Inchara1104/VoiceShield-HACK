const fs = require('fs');
const VoiceRef = require('../models/VoiceRef');
const AttemptLog = require('../models/AttemptLog');
const phrases = ["Jaldi utho, chai thandi ho jayegi!", "Arre bhaiya, thodi si mirchi kam daal dena", "Daal mein kuch kala hai"];

function generatePhrase() {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

async function processAudio(filePath, userId) {
  const buffer = fs.readFileSync(filePath);
  const duration = buffer.length / 16000 / 2;
  let volume = 0, pauses = 0;
  for (let i = 0; i < buffer.length; i += 1000) {
    const chunk = buffer.slice(i, i + 1000);
    const rms = Math.sqrt(chunk.reduce((sum, b) => sum + b**2, 0) / chunk.length);
    volume += rms;
    if (rms < 0.01) pauses++;
  }
  volume /= buffer.length / 1000;
  return { duration, volume, energy: volume * duration, pauses, responseTime: 3, tempo: 120, flags: [] };
}

function calculateTrustScore(features, userId) {
  let score = 100;
  if (features.volume < 0.1) { score -= 30; features.flags.push('low_volume'); }
  if (features.pauses > 5) { score -= 20; features.flags.push('long_pause'); }
  if (features.responseTime > 5) score -= 25;
  return Math.max(0, score);
}

function getStatus(score) {
  if (score > 70) return 'Verified';
  if (score > 40) return 'Suspicious';
  return 'Blocked';
}

module.exports = { processAudio, generatePhrase, calculateTrustScore };
