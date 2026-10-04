const express = require('express');
const router = express.Router();
const { interactVoiceAgent, getVoiceHistory, createAvatarSession, getLiveKitToken } = require('../controllers/voiceController');

router.post('/interact', interactVoiceAgent);
router.get('/history', getVoiceHistory);
router.all('/avatar-session', createAvatarSession);
router.post('/livekit-token', getLiveKitToken);

module.exports = router;

