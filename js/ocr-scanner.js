/**
 * ShopSahayak - AI Multilingual Handwriting OCR Scanner Frontend Controller
 */

class OcrScannerController {
  constructor() {
    this.selectedFile = null;
    this.currentOcrData = null;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindElements();
      this.bindEvents();
      this.fetchScanHistory();
    });
  }

  bindElements() {
    this.dropzone = document.getElementById('mainOcrDropzone');
    this.fileInput = document.getElementById('mainOcrFileInput');
    this.dropzoneContent = document.getElementById('mainOcrDropzoneContent');
    this.previewBox = document.getElementById('mainOcrPreviewBox');
    this.imagePreview = document.getElementById('mainOcrImagePreview');
    this.removeImgBtn = document.getElementById('mainOcrRemoveBtn');

    // Controls
    this.modelSelect = document.getElementById('mainOcrModelSelect');
    this.domainSelect = document.getElementById('mainOcrDomainSelect');
    this.translateSelect = document.getElementById('mainOcrTranslateSelect');
    this.deepScanToggle = document.getElementById('mainOcrDeepScanToggle');
    this.btnSubmit = document.getElementById('mainOcrSubmitBtn');

    // Outputs
    this.extractedTextDisplay = document.getElementById('mainOcrTextDisplay');
    this.emptyState = document.getElementById('mainOcrEmptyState');
    this.summaryBox = document.getElementById('mainOcrSummaryBox');
    this.summaryText = document.getElementById('mainOcrSummaryText');
    this.langBadge = document.getElementById('mainOcrLangBadge');
    this.linesTableBody = document.getElementById('mainOcrLinesTableBody');
    this.jsonDisplay = document.getElementById('mainOcrJsonDisplay');
    this.historyTableBody = document.getElementById('mainOcrHistoryTableBody');

    // Actions
    this.btnCopy = document.getElementById('mainOcrCopyBtn');
    this.btnTTS = document.getElementById('mainOcrTtsBtn');
    this.btnDownload = document.getElementById('mainOcrDownloadBtn');
  }

  bindEvents() {
    if (!this.dropzone) return;

    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleImageSelection(e.dataTransfer.files[0]);
      }
    });

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageSelection(e.target.files[0]);
        }
      });
    }

    if (this.removeImgBtn) {
      this.removeImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetImage();
      });
    }

    if (this.btnSubmit) {
      this.btnSubmit.addEventListener('click', () => this.runRecognition());
    }

    if (this.btnCopy) {
      this.btnCopy.addEventListener('click', () => this.copyText());
    }

    if (this.btnTTS) {
      this.btnTTS.addEventListener('click', () => this.speakText());
    }

    if (this.btnDownload) {
      this.btnDownload.addEventListener('click', () => this.downloadText());
    }
  }

  handleImageSelection(file) {
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview.src = e.target.result;
      this.dropzoneContent.style.display = 'none';
      this.previewBox.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  loadSample(url, label) {
    if (window.shopUI) window.shopUI.showToast(`Loading sample: ${label}...`, 'info');
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `sample_${label.toLowerCase().replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
        this.handleImageSelection(file);
      })
      .catch((err) => {
        if (window.shopUI) window.shopUI.showToast('Error loading sample: ' + err.message, 'alert');
      });
  }

  resetImage() {
    this.selectedFile = null;
    this.imagePreview.src = '';
    if (this.fileInput) this.fileInput.value = '';
    this.dropzoneContent.style.display = 'block';
    this.previewBox.style.display = 'none';
  }

  toggleContrast() {
    this.imagePreview.classList.toggle('ocr-filter-contrast');
  }

  toggleGrayscale() {
    this.imagePreview.classList.toggle('ocr-filter-grayscale');
  }

  resetFilters() {
    this.imagePreview.classList.remove('ocr-filter-contrast', 'ocr-filter-grayscale');
  }

  async runRecognition() {
    if (!this.selectedFile && (!this.imagePreview || !this.imagePreview.src)) {
      if (window.shopUI) window.shopUI.showToast('Please upload or select a handwritten image first!', 'warning');
      return;
    }

    this.setLoading(true);

    try {
      const formData = new FormData();
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      } else if (this.imagePreview.src.startsWith('data:')) {
        formData.append('imageBase64', this.imagePreview.src);
      } else {
        const res = await fetch(this.imagePreview.src);
        const blob = await res.blob();
        formData.append('image', blob, 'sample.jpg');
      }

      if (this.modelSelect) formData.append('modelName', this.modelSelect.value);
      if (this.domainSelect) formData.append('domainHint', this.domainSelect.value);
      if (this.deepScanToggle) formData.append('deepScan', this.deepScanToggle.checked);
      if (this.translateSelect && this.translateSelect.value) {
        formData.append('targetLanguage', this.translateSelect.value);
      }

      const response = await fetch('/api/ocr/recognize', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.details || 'OCR recognition failed');
      }

      this.currentOcrData = data;
      this.renderResults(data);
      this.fetchScanHistory();
      if (window.shopUI) window.shopUI.showToast('Handwriting extracted & saved to MongoDB Atlas!', 'success');
    } catch (err) {
      console.error('OCR Error:', err);
      if (window.shopUI) window.shopUI.showToast(`Error: ${err.message}`, 'alert');
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(isLoading) {
    if (!this.btnSubmit) return;
    this.btnSubmit.disabled = isLoading;
    if (isLoading) {
      this.btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Scanning Handwriting...`;
    } else {
      this.btnSubmit.innerHTML = `<i class="fa-solid fa-bolt"></i> Recognize & Extract Text`;
    }
  }

  renderResults(data) {
    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.extractedTextDisplay) {
      this.extractedTextDisplay.style.display = 'block';
      this.extractedTextDisplay.textContent = data.translatedText || data.fullText || 'No text detected.';
    }

    if (this.langBadge) {
      this.langBadge.innerHTML = `<i class="fa-solid fa-language"></i> ${data.detectedLanguage || 'Auto-Detected'}`;
    }

    if (this.summaryBox && data.summary) {
      this.summaryBox.style.display = 'block';
      if (this.summaryText) this.summaryText.textContent = data.summary;
    }

    if (this.linesTableBody && data.lines && data.lines.length > 0) {
      this.linesTableBody.innerHTML = data.lines.map(line => `
        <tr>
          <td><strong>#${line.lineNumber || 1}</strong></td>
          <td>${this.escapeHtml(line.text || '')}</td>
          <td><span class="badge badge-subtle">${line.language || 'Detected'}</span></td>
          <td><span class="badge ${line.confidence === 'High' ? 'badge-success' : 'badge-warning'}">${line.confidence || 'High'}</span></td>
        </tr>
      `).join('');
    }

    if (this.jsonDisplay) {
      this.jsonDisplay.textContent = JSON.stringify(data, null, 2);
    }
  }

  async fetchScanHistory() {
    try {
      const res = await fetch('/api/ocr/history');
      const data = await res.json();
      if (data.scans && this.historyTableBody) {
        if (data.scans.length === 0) {
          this.historyTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No OCR scans saved in MongoDB Atlas yet</td></tr>`;
          return;
        }

        this.historyTableBody.innerHTML = data.scans.map(scan => `
          <tr>
            <td><strong>${scan.scanId || 'OCR'}</strong></td>
            <td>${scan.fileName || 'handwriting.jpg'}</td>
            <td><span class="badge badge-info">${scan.detectedLanguage || 'Telugu/English'}</span></td>
            <td>${new Date(scan.createdAt).toLocaleString()}</td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.warn('Scan history fetch error:', e);
    }
  }

  copyText() {
    if (this.extractedTextDisplay && this.extractedTextDisplay.textContent) {
      navigator.clipboard.writeText(this.extractedTextDisplay.textContent);
      if (window.shopUI) window.shopUI.showToast('Extracted text copied to clipboard!', 'success');
    }
  }

  speakText() {
    const text = this.extractedTextDisplay ? this.extractedTextDisplay.textContent : '';
    if (!text) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      if (window.shopUI) window.shopUI.showToast('Playing speech audio...', 'info');
    }
  }

  downloadText() {
    const text = this.extractedTextDisplay ? this.extractedTextDisplay.textContent : '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handwriting_scan_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

window.ocrController = new OcrScannerController();
