/**
 * AI Reader - Multilingual Handwriting Recognizer Frontend Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const dropzoneContent = document.getElementById('dropzoneContent');
  const previewBox = document.getElementById('previewBox');
  const imagePreview = document.getElementById('imagePreview');
  const removeImgBtn = document.getElementById('removeImgBtn');
  
  // Image Filters
  const btnContrast = document.getElementById('btnContrast');
  const btnGrayscale = document.getElementById('btnGrayscale');
  const btnResetImg = document.getElementById('btnResetImg');

  // Form Controls
  const modelSelect = document.getElementById('modelSelect');
  const domainSelect = document.getElementById('domainSelect');
  const translateSelect = document.getElementById('translateSelect');
  const deepScanToggle = document.getElementById('deepScanToggle');
  const btnRecognize = document.getElementById('btnRecognize');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Outputs & Display
  const emptyState = document.getElementById('emptyState');
  const extractedTextDisplay = document.getElementById('extractedTextDisplay');
  const summaryBox = document.getElementById('summaryBox');
  const summaryText = document.getElementById('summaryText');
  const langBadge = document.getElementById('langBadge');
  const translatedBadge = document.getElementById('translatedBadge');
  const entitiesContainer = document.getElementById('entitiesContainer');
  const entitiesChips = document.getElementById('entitiesChips');
  const linesTableBody = document.getElementById('linesTableBody');
  const jsonDisplay = document.getElementById('jsonDisplay');

  // Actions
  const btnCopyText = document.getElementById('btnCopyText');
  const btnTTS = document.getElementById('btnTTS');
  const btnDownloadTxt = document.getElementById('btnDownloadTxt');
  const btnCopyJson = document.getElementById('btnCopyJson');

  // Modal & Toast
  const keyModal = document.getElementById('keyModal');
  const apiKeyModalBtn = document.getElementById('apiKeyModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  const customApiKeyInput = document.getElementById('customApiKeyInput');
  const toast = document.getElementById('toast');

  let selectedFile = null;
  let currentOcrData = null;
  let customApiKey = localStorage.getItem('gemini_custom_key') || '';

  if (customApiKey) {
    customApiKeyInput.value = customApiKey;
  }

  // Check health on load
  checkServerHealth();

  async function checkServerHealth() {
    try {
      const res = await fetch('/api/ocr/health');
      const data = await res.json();
      const statusText = document.getElementById('statusText');
      if (data.status === 'online') {
        statusText.innerText = `Gemini Vision Active (${data.apiKeyConfigured ? 'Key Loaded' : 'Key Missing'})`;
      }
    } catch (e) {
      console.warn('Server health check error:', e);
    }
  }

  // --- Tab Navigation ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // --- File Dropzone & Selection ---
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelection(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelection(e.target.files[0]);
    }
  });

  // Clipboard Paste Support (Ctrl+V)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        handleImageSelection(file);
        showToast('Pasted image from clipboard!');
        break;
      }
    }
  });

  function handleImageSelection(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      dropzoneContent.classList.add('hidden');
      previewBox.classList.remove('hidden');
      resetFilters();
    };
    reader.readAsDataURL(file);
  }

  // Global sample loader function
  window.loadSample = async (url, label) => {
    try {
      showToast(`Loading sample: ${label}...`);
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `sample_${label.toLowerCase().replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      handleImageSelection(file);
      
      // Update sample pills UI
      document.querySelectorAll('.sample-pill').forEach(p => p.classList.remove('active'));
      if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
      }
    } catch (err) {
      showToast('Error loading sample image: ' + err.message);
    }
  };

  removeImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    imagePreview.src = '';
    fileInput.value = '';
    dropzoneContent.classList.remove('hidden');
    previewBox.classList.add('hidden');
  });

  // --- Image Processing Filters ---
  btnContrast.addEventListener('click', () => {
    imagePreview.classList.toggle('filter-contrast');
    btnContrast.classList.toggle('active');
  });

  btnGrayscale.addEventListener('click', () => {
    imagePreview.classList.toggle('filter-grayscale');
    btnGrayscale.classList.toggle('active');
  });

  btnResetImg.addEventListener('click', () => {
    resetFilters();
  });

  function resetFilters() {
    imagePreview.classList.remove('filter-contrast', 'filter-grayscale');
    btnContrast.classList.remove('active');
    btnGrayscale.classList.remove('active');
  }

  // --- OCR Recognition Trigger ---
  btnRecognize.addEventListener('click', async () => {
    if (!selectedFile && !imagePreview.src) {
      showToast('Please upload or select a handwritten image first!');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (imagePreview.src.startsWith('data:')) {
        formData.append('imageBase64', imagePreview.src);
      } else {
        // Fetch URL as blob if it's a relative sample path
        const res = await fetch(imagePreview.src);
        const blob = await res.blob();
        formData.append('image', blob, 'sample.jpg');
      }

      formData.append('modelName', modelSelect.value);
      formData.append('domainHint', domainSelect.value);
      formData.append('deepScan', deepScanToggle.checked);
      if (translateSelect.value) {
        formData.append('targetLanguage', translateSelect.value);
      }

      const headers = {};
      if (customApiKey) {
        headers['x-api-key'] = customApiKey;
      }

      const response = await fetch('/api/ocr/recognize', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.details || 'Failed to process image');
      }

      currentOcrData = data;
      renderResults(data);
      showToast('Handwriting extracted successfully!');
    } catch (error) {
      console.error('Recognition error:', error);
      showToast(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    btnRecognize.disabled = isLoading;
    if (isLoading) {
      loadingSpinner.classList.remove('hidden');
      btnRecognize.querySelector('.btn-text').innerHTML = '<i class="fa-solid fa-gear fa-spin"></i> Processing Handwriting...';
    } else {
      loadingSpinner.classList.add('hidden');
      btnRecognize.querySelector('.btn-text').innerHTML = '<i class="fa-solid fa-bolt"></i> Recognize & Extract Text';
    }
  }

  // --- Render Results ---
  function renderResults(data) {
    emptyState.classList.add('hidden');
    extractedTextDisplay.classList.remove('hidden');

    // Display text (either translated or original fullText)
    const displayText = data.translatedText || data.fullText || 'No text detected.';
    extractedTextDisplay.textContent = displayText;

    // Language Badge
    langBadge.innerHTML = `<i class="fa-solid fa-language"></i> Lang: ${data.detectedLanguage || 'Auto-Detected'}`;
    
    if (data.translatedText) {
      translatedBadge.classList.remove('hidden');
      translatedBadge.innerHTML = `<i class="fa-solid fa-globe"></i> Translated to ${translateSelect.value}`;
    } else {
      translatedBadge.classList.add('hidden');
    }

    // Summary Box
    if (data.summary) {
      summaryBox.classList.remove('hidden');
      summaryText.textContent = data.summary;
    } else {
      summaryBox.classList.add('hidden');
    }

    // Entity Chips
    if (data.keyEntities && data.keyEntities.length > 0) {
      entitiesContainer.classList.remove('hidden');
      entitiesChips.innerHTML = data.keyEntities
        .map(ent => `<span class="chip"><i class="fa-solid fa-tag"></i> ${ent}</span>`)
        .join('');
    } else {
      entitiesContainer.classList.add('hidden');
    }

    // Lines Breakdown Table
    if (data.lines && data.lines.length > 0) {
      linesTableBody.innerHTML = data.lines.map(line => {
        const confClass = line.confidence === 'High' ? 'confidence-high' : 
                          line.confidence === 'Medium' ? 'confidence-medium' : 'confidence-low';
        return `
          <tr>
            <td><strong>#${line.lineNumber || 1}</strong></td>
            <td>${escapeHtml(line.text || '')}</td>
            <td><span class="badge" style="background: rgba(255,255,255,0.05);">${line.language || 'Detected'}</span></td>
            <td><span class="${confClass}">${line.confidence || 'High'}</span></td>
          </tr>
        `;
      }).join('');
    } else {
      linesTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No line breakdown array returned</td></tr>`;
    }

    // JSON View
    jsonDisplay.textContent = JSON.stringify(data, null, 2);
  }

  // --- Speech Synthesis (Text to Speech) ---
  btnTTS.addEventListener('click', () => {
    if (!currentOcrData || (!currentOcrData.fullText && !currentOcrData.translatedText)) {
      showToast('No text available to read out loud.');
      return;
    }

    const textToRead = currentOcrData.translatedText || currentOcrData.fullText;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      showToast('Playing audio reading...');
    } else {
      showToast('Text-To-Speech is not supported in this browser.');
    }
  });

  // --- Copy & Export Handlers ---
  btnCopyText.addEventListener('click', () => {
    if (!extractedTextDisplay.textContent) return;
    navigator.clipboard.writeText(extractedTextDisplay.textContent);
    showToast('Extracted text copied to clipboard!');
  });

  btnCopyJson.addEventListener('click', () => {
    if (!jsonDisplay.textContent) return;
    navigator.clipboard.writeText(jsonDisplay.textContent);
    showToast('JSON output copied to clipboard!');
  });

  btnDownloadTxt.addEventListener('click', () => {
    if (!extractedTextDisplay.textContent) return;
    const blob = new Blob([extractedTextDisplay.textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handwriting_ocr_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded .txt file!');
  });

  // Modal Controls
  apiKeyModalBtn.addEventListener('click', () => keyModal.classList.remove('hidden'));
  closeModalBtn.addEventListener('click', () => keyModal.classList.add('hidden'));
  
  saveKeyBtn.addEventListener('click', () => {
    customApiKey = customApiKeyInput.value.trim();
    localStorage.setItem('gemini_custom_key', customApiKey);
    keyModal.classList.add('hidden');
    showToast(customApiKey ? 'Custom API key saved!' : 'Custom API key cleared (using server .env key)');
  });

  // Global Snippet Copy Helper
  window.copySnippet = (id) => {
    const el = document.getElementById(id);
    if (el) {
      navigator.clipboard.writeText(el.textContent);
      showToast('Code snippet copied to clipboard!');
    }
  };

  // Toast Helper
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
});
