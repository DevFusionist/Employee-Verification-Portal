// QR Code Verification Script

class QRScanner {
  constructor() {
    this.video = document.getElementById('qrVideo');
    this.canvas = document.getElementById('qrCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.stream = null;
    this.isScanning = false;
    this.currentCamera = 'environment'; // Start with back camera
    this.scanInterval = null;

    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    // Tab functionality
    this.tabs = document.querySelectorAll('.qr-tab');
    this.tabContents = document.querySelectorAll('.qr-tab-content');

    // Buttons
    this.startBtn = document.getElementById('startScanner');
    this.stopBtn = document.getElementById('stopScanner');
    this.switchBtn = document.getElementById('switchCamera');
    this.verifyBtn = document.getElementById('verifyQrData');
    this.verifyAgentBtn = document.getElementById('verifyAgent');
    this.clearResultsBtn = document.getElementById('clearResults');

    // Input and status
    this.manualInput = document.getElementById('qrManualInput');
    this.qrStatus = document.getElementById('qrStatus');
    this.resultsContainer = document.getElementById('resultsContainer');
    this.agentInfo = document.getElementById('agentInfo');
  }

  bindEvents() {
    // Tab switching
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Scanner controls
    this.startBtn.addEventListener('click', () => this.startScanner());
    this.stopBtn.addEventListener('click', () => this.stopScanner());
    this.switchBtn.addEventListener('click', () => this.switchCamera());

    // Manual verification
    this.verifyBtn.addEventListener('click', () => this.verifyManualInput());

    // Results actions
    this.verifyAgentBtn.addEventListener('click', () => this.verifyAgent());
    this.clearResultsBtn.addEventListener('click', () => this.clearResults());
  }

  switchTab(tabName) {
    // Update active tab
    this.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update active content
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    // Stop scanner if switching away from scanner tab
    if (tabName !== 'scanner' && this.isScanning) {
      this.stopScanner();
    }
  }

  async startScanner() {
    try {
      this.showStatus('Initializing camera...', 'info');

      // Stop any existing stream
      if (this.stream) {
        this.stopScanner();
      }

      // Get camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.currentCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      this.video.srcObject = this.stream;
      this.video.play();

      // Wait for video to be ready
      this.video.addEventListener('loadedmetadata', () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.startScanning();
      });

      // Update UI
      this.startBtn.style.display = 'none';
      this.stopBtn.style.display = 'inline-flex';
      this.showStatus('Camera active. Position QR code within the frame.', 'info');

    } catch (error) {
      console.error('Error accessing camera:', error);
      this.showStatus('Error accessing camera. Please check permissions.', 'error');
    }
  }

  stopScanner() {
    this.isScanning = false;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.video.srcObject = null;

    // Update UI
    this.startBtn.style.display = 'inline-flex';
    this.stopBtn.style.display = 'none';
    this.showStatus('Scanner stopped.', 'info');
  }

  async switchCamera() {
    this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';

    if (this.isScanning) {
      this.stopScanner();
      await this.startScanner();
    }

    this.showStatus(`Switched to ${this.currentCamera === 'environment' ? 'back' : 'front'} camera.`, 'info');
  }

  startScanning() {
    this.isScanning = true;

    this.scanInterval = setInterval(() => {
      if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
        this.scanQRCode();
      }
    }, 100); // Scan every 100ms
  }

  scanQRCode() {
    try {
      // Draw video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Get image data
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        this.handleQRResult(code.data);
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
    }
  }

  handleQRResult(data) {
    this.stopScanner();
    this.showStatus('QR code detected!', 'success');

    // Add success animation
    this.video.classList.add('qr-success');
    setTimeout(() => this.video.classList.remove('qr-success'), 600);

    // Process the QR data
    this.processQRData(data);
  }

  verifyManualInput() {
    const data = this.manualInput.value.trim();

    if (!data) {
      this.showStatus('Please enter QR code data.', 'error');
      return;
    }

    this.processQRData(data);
  }

  processQRData(data) {
    try {
      // Try to parse as JSON first
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch {
        // If not JSON, treat as plain text (agent code)
        qrData = { agentCode: data };
      }

      // Extract agent code
      const agentCode = qrData.agentCode || qrData.code || qrData.id || data;

      if (!agentCode) {
        this.showStatus('Invalid QR code data. No agent code found.', 'error');
        return;
      }

      // Validate agent code (should be numbers only)
      if (!/^\d+$/.test(agentCode)) {
        this.showStatus('Invalid agent code. Please use numbers only.', 'error');
        return;
      }

      this.showAgentInfo(agentCode, qrData);

    } catch (error) {
      console.error('Error processing QR data:', error);
      this.showStatus('Error processing QR code data.', 'error');
    }
  }

  showAgentInfo(agentCode, qrData) {
    // Create agent info display
    const infoHTML = `
            <div class="agent-details">
                <div class="detail-row">
                    <strong>Agent Code:</strong> <span>${agentCode}</span>
                </div>
                ${qrData.name ? `<div class="detail-row"><strong>Name:</strong> <span>${qrData.name}</span></div>` : ''}
                ${qrData.department ? `<div class="detail-row"><strong>Department:</strong> <span>${qrData.department}</span></div>` : ''}
                ${qrData.location ? `<div class="detail-row"><strong>Location:</strong> <span>${qrData.location}</span></div>` : ''}
                ${qrData.validFrom ? `<div class="detail-row"><strong>Valid From:</strong> <span>${qrData.validFrom}</span></div>` : ''}
                ${qrData.validUntil ? `<div class="detail-row"><strong>Valid Until:</strong> <span>${qrData.validUntil}</span></div>` : ''}
            </div>
        `;

    this.agentInfo.innerHTML = infoHTML;
    this.resultsContainer.style.display = 'block';

    // Store agent code for verification
    this.currentAgentCode = agentCode;

    this.showStatus('Agent information extracted successfully!', 'success');
  }

  async verifyAgent() {
    if (!this.currentAgentCode) {
      this.showStatus('No agent code to verify.', 'error');
      return;
    }

    this.showStatus('Verifying agent...', 'info');

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if agent image exists
      const imageExists = await this.checkAgentImage(this.currentAgentCode);

      if (imageExists) {
        this.showStatus('Agent verified successfully! Redirecting to main portal...', 'success');

        // Redirect to main portal with agent code
        setTimeout(() => {
          window.location.href = `index.html?AuthCode=${this.currentAgentCode}`;
        }, 2000);
      } else {
        this.showStatus('Agent not found in database.', 'error');
      }

    } catch (error) {
      console.error('Error verifying agent:', error);
      this.showStatus('Error during verification.', 'error');
    }
  }

  async checkAgentImage(agentCode) {
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    for (const ext of extensions) {
      try {
        const response = await fetch(`idcards/${agentCode}.${ext}`, { method: 'HEAD' });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Continue to next extension
      }
    }

    return false;
  }

  clearResults() {
    this.resultsContainer.style.display = 'none';
    this.agentInfo.innerHTML = '';
    this.currentAgentCode = null;
    this.manualInput.value = '';
    this.showStatus('Results cleared.', 'info');
  }

  showStatus(message, type = 'info') {
    this.qrStatus.textContent = message;
    this.qrStatus.className = `qr-status ${type}`;

    // Auto-hide info messages after 3 seconds
    if (type === 'info') {
      setTimeout(() => {
        if (this.qrStatus.textContent === message) {
          this.qrStatus.textContent = '';
          this.qrStatus.className = 'qr-status';
        }
      }, 3000);
    }
  }
}

// Initialize QR Scanner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new QRScanner();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Stop scanner when page is hidden
    const scanner = window.qrScanner;
    if (scanner && scanner.isScanning) {
      scanner.stopScanner();
    }
  }
}); 