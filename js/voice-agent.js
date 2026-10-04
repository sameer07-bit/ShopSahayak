/**
 * ShopSahayak - Interactive Natasha Virtual AI Agent & Video Call Controller
 * Listens via Web Speech API STT, queries AI engine, speaks back via Web Speech TTS,
 * manages Beyond Presence Video Avatar session, webcam WebRTC stream, and persists
 * conversation sessions to MongoDB Atlas cloud database.
 */

class VoiceAgentController {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.sessionId = `VS-${Date.now()}`;
    this.userStream = null;
    this.isVideoCallActive = false;
    this.isMicMuted = false;
    this.isCamOff = false;
    this.mouthAnimInterval = null;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupSpeechRecognition();
      this.bindVoiceButtons();
    });
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US'; // Supports en-US, hi-IN, te-IN

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateMicUI(true);
        if (window.shopUI) window.shopUI.showToast('Listening... Speak to Natasha now!', 'info');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Speech recognized:', transcript);
        this.handleUserVoiceInput(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        this.updateMicUI(false);
        if (window.shopUI) window.shopUI.showToast('Voice input stopped: ' + event.error, 'warning');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateMicUI(false);
      };
    } else {
      console.warn('Web Speech Recognition API is not supported in this browser.');
    }
  }

  bindVoiceButtons() {
    // Mic button in LiveKit/Voice AI card or chat footer
    const voiceBtn = document.getElementById('voiceStartBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.toggleListening());
    }

    const micChatBtn = document.getElementById('chatMicBtn');
    if (micChatBtn) {
      micChatBtn.addEventListener('click', () => this.toggleListening());
    }
  }

  toggleListening() {
    if (!this.recognition) {
      if (window.shopUI) window.shopUI.showToast('Speech Recognition not supported in browser. Type your message below.', 'warning');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  updateMicUI(listening) {
    const voiceBtn = document.getElementById('voiceStartBtn');
    const statusTitle = document.getElementById('voiceStatusTitle');
    const statusSubtitle = document.getElementById('voiceStatusSubtitle');
    const avatarCard = document.getElementById('beyondPresenceAvatarCard');
    const talkBtn = document.getElementById('natashaTalkBtn');

    if (voiceBtn) {
      if (listening) {
        voiceBtn.classList.add('listening');
        if (statusTitle) statusTitle.textContent = 'Listening... Speak Now';
        if (statusSubtitle) statusSubtitle.textContent = 'ShopSahayak AI Voice Agent active';
      } else {
        voiceBtn.classList.remove('listening');
        if (statusTitle) statusTitle.textContent = 'Tap to Speak';
        if (statusSubtitle) statusSubtitle.textContent = 'LiveKit Real-time Voice Session Ready';
      }
    }

    if (avatarCard) {
      if (listening) avatarCard.classList.add('speaking');
      else avatarCard.classList.remove('speaking');
    }

    if (talkBtn) {
      if (listening) {
        talkBtn.classList.add('active');
        talkBtn.querySelector('span').textContent = 'Listening...';
      } else {
        talkBtn.classList.remove('active');
        talkBtn.querySelector('span').textContent = 'Speak Now';
      }
    }
  }

  /**
   * =========================================================================
   * NATASHA VIDEO VIRTUAL AI AGENT CONTROLLER (Beyond Presence + WebRTC)
   * =========================================================================
   */
  async startVideoCall() {
    const modal = document.getElementById('natashaVideoModal');
    if (!modal) return;

    modal.style.display = 'flex';
    this.isVideoCallActive = true;

    if (window.shopUI) {
      window.shopUI.showToast('Connecting Beyond Presence Virtual AI Video Stream...', 'info');
    }

    // Fetch avatar session metadata
    try {
      const resp = await fetch('/api/voice/avatar-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sessionId, room: 'shopsahayak-voice' })
      });
      const sessionData = await resp.json();
      console.log('🎥 Beyond Presence avatar video session response:', sessionData);
    } catch (e) {
      console.warn('Avatar session init warning:', e);
    }

    // Request webcam & mic access for picture-in-picture stream
    try {
      this.userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const webcamVideo = document.getElementById('natashaUserWebcamVideo');
      if (webcamVideo) {
        webcamVideo.srcObject = this.userStream;
      }
    } catch (err) {
      console.warn('Webcam/Mic permissions warning:', err.message);
      const placeholder = document.getElementById('userWebcamOffPlaceholder');
      if (placeholder) placeholder.style.display = 'flex';
    }

    // Update subtitles & speak initial video greeting
    const welcomeMsg = "Namaste! I am Natasha, your AI Retail Co-Pilot. I can see you! How can I assist your store today?";
    this.updateVideoSubtitles(welcomeMsg);
    this.speakResponse(welcomeMsg, 'English');
  }

  endVideoCall() {
    const modal = document.getElementById('natashaVideoModal');
    if (modal) modal.style.display = 'none';

    this.isVideoCallActive = false;

    // Stop webcam & mic tracks
    if (this.userStream) {
      this.userStream.getTracks().forEach((track) => track.stop());
      this.userStream = null;
    }

    // Stop TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.stopMouthAnimation();

    if (window.shopUI) {
      window.shopUI.showToast('Natasha Virtual AI Video Call Ended', 'info');
    }
  }

  toggleVideoCamera() {
    if (!this.userStream) return;

    const videoTrack = this.userStream.getVideoTracks()[0];
    const camIcon = document.getElementById('natashaCamIcon');
    const camBtn = document.getElementById('natashaCamToggleBtn');
    const placeholder = document.getElementById('userWebcamOffPlaceholder');
    const webcamVideo = document.getElementById('natashaUserWebcamVideo');

    if (videoTrack) {
      this.isCamOff = !this.isCamOff;
      videoTrack.enabled = !this.isCamOff;

      if (this.isCamOff) {
        if (camIcon) camIcon.className = 'fa-solid fa-video-slash';
        if (camBtn) camBtn.querySelector('span').textContent = 'Cam Off';
        if (placeholder) placeholder.style.display = 'flex';
        if (webcamVideo) webcamVideo.style.display = 'none';
      } else {
        if (camIcon) camIcon.className = 'fa-solid fa-video';
        if (camBtn) camBtn.querySelector('span').textContent = 'Cam On';
        if (placeholder) placeholder.style.display = 'none';
        if (webcamVideo) webcamVideo.style.display = 'block';
      }
    }
  }

  toggleVideoMic() {
    if (!this.userStream) return;

    const audioTrack = this.userStream.getAudioTracks()[0];
    const micIcon = document.getElementById('natashaMicIcon');
    const micBtn = document.getElementById('natashaMicToggleBtn');

    if (audioTrack) {
      this.isMicMuted = !this.isMicMuted;
      audioTrack.enabled = !this.isMicMuted;

      if (this.isMicMuted) {
        if (micIcon) micIcon.className = 'fa-solid fa-microphone-slash';
        if (micBtn) micBtn.querySelector('span').textContent = 'Mic Off';
      } else {
        if (micIcon) micIcon.className = 'fa-solid fa-microphone';
        if (micBtn) micBtn.querySelector('span').textContent = 'Mic On';
      }
    }
  }

  sendVideoQuery(promptText) {
    if (!promptText) return;
    this.updateVideoSubtitles(`User: "${promptText}"`);
    this.handleUserVoiceInput(promptText);
  }

  updateVideoSubtitles(text) {
    const subtitleEl = document.getElementById('natashaSubtitleText');
    if (subtitleEl) {
      subtitleEl.textContent = `"${text}"`;
    }
  }

  startMouthAnimation() {
    const glow = document.getElementById('natashaVideoSpeakingGlow');
    const mouth = document.getElementById('natashaAvatarMouth');

    if (glow) glow.style.opacity = '1';

    let open = false;
    this.stopMouthAnimation();

    this.mouthAnimInterval = setInterval(() => {
      open = !open;
      if (mouth) {
        if (open) {
          mouth.setAttribute('d', 'M42 46q8 10 16 0');
        } else {
          mouth.setAttribute('d', 'M44 48q6 4 12 0');
        }
      }
    }, 150);
  }

  stopMouthAnimation() {
    if (this.mouthAnimInterval) {
      clearInterval(this.mouthAnimInterval);
      this.mouthAnimInterval = null;
    }
    const glow = document.getElementById('natashaVideoSpeakingGlow');
    const mouth = document.getElementById('natashaAvatarMouth');

    if (glow) glow.style.opacity = '0';
    if (mouth) mouth.setAttribute('d', 'M44 48q6 4 12 0');
  }

  async handleUserVoiceInput(transcript) {
    if (!transcript) return;

    // Display transcript in chat UI
    if (window.shopAiEngine) {
      window.shopAiEngine.addMessage(transcript, 'user');
    }

    if (this.isVideoCallActive) {
      this.updateVideoSubtitles(`Natasha is thinking...`);
    }

    // Call voice interaction API (persists to MongoDB Atlas)
    try {
      const response = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript,
          sessionId: this.sessionId
        })
      });

      const data = await response.json();

      if (data.success && data.aiResponse) {
        // Display AI response in chat thread
        if (window.shopAiEngine) {
          window.shopAiEngine.addMessage(data.aiResponse, 'assistant', {
            detectedLanguage: data.detectedLanguage,
            calculation: data.calculation,
            actionCard: data.actionCard
          });
        }

        // Update Beyond Presence Avatar caption
        const captionBox = document.getElementById('avatarCaptionText');
        if (captionBox) {
          captionBox.textContent = `"${data.aiResponse.substring(0, 140)}..."`;
        }

        if (this.isVideoCallActive) {
          this.updateVideoSubtitles(data.aiResponse);
        }

        // SPEAK BACK OUT LOUD (Text-To-Speech with avatar lip sync)
        this.speakResponse(data.aiResponse, data.detectedLanguage);
      }
    } catch (err) {
      console.error('Voice interaction error:', err);
    }
  }

  speakResponse(text, language = 'English') {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop prior speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;

    // Set voice language based on detected language
    if (language.includes('Telugu')) utterance.lang = 'te-IN';
    else if (language.includes('Hindi')) utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';

    const avatarCard = document.getElementById('beyondPresenceAvatarCard');

    utterance.onstart = () => {
      if (avatarCard) avatarCard.classList.add('speaking');
      if (this.isVideoCallActive) this.startMouthAnimation();
    };

    utterance.onend = () => {
      if (avatarCard) avatarCard.classList.remove('speaking');
      if (this.isVideoCallActive) this.stopMouthAnimation();
    };

    utterance.onerror = () => {
      if (avatarCard) avatarCard.classList.remove('speaking');
      if (this.isVideoCallActive) this.stopMouthAnimation();
    };

    window.speechSynthesis.speak(utterance);
  }
}

window.voiceAgentController = new VoiceAgentController();
