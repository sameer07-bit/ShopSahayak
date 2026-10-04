const mongoose = require('mongoose');

const voiceSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      default: () => `VS-${Date.now()}`
    },
    userTranscript: {
      type: String,
      required: true
    },
    aiResponse: {
      type: String,
      required: true
    },
    detectedLanguage: {
      type: String,
      default: 'English'
    },
    intent: {
      type: String,
      default: 'general_query'
    },
    toolResults: {
      type: Array,
      default: []
    },
    audioUrl: {
      type: String,
      default: null
    },
    userId: {
      type: String,
      default: 'USER-ADMIN'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VoiceSession', voiceSessionSchema);
