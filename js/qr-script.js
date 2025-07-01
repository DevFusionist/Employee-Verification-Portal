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

  async handleQRResult(data) {
    this.stopScanner();
    this.showStatus('QR code detected!', 'success');

    // Add success animation
    this.video.classList.add('qr-success');
    setTimeout(() => this.video.classList.remove('qr-success'), 600);

    // Process the QR data
    await this.processQRData(data);
  }

  async verifyManualInput() {
    const data = this.manualInput.value.trim();

    if (!data) {
      this.showStatus('Please enter QR code data.', 'error');
      return;
    }

    await this.processQRData(data);
  }

  async processQRData(data) {
    try {
      console.log("data", data);
      // Store the original raw data for display
      this.rawQRData = data;

      // Check if the data is a URL
      if (this.isValidUrl(data)) {
        this.showStatus('Detected URL in QR code. Extracting AuthCode...', 'info');

        // Extract AuthCode from URL using regex
        const authCode = this.extractAuthCodeFromUrl(data);

        if (authCode) {
          this.showStatus('AuthCode extracted successfully.', 'info');
          this.processParsedData({ agentCode: authCode });
        } else {
          // If no AuthCode found in URL, show error
          this.showStatus('Invalid QR code data. URL does not contain valid AuthCode.', 'error');
          this.showInvalidQRData(data);
        }
      } else {
        // Process direct data (not a URL)
        this.processDirectData(data);
      }

    } catch (error) {
      console.error('Error processing QR data:', error);
      this.showStatus('Error processing QR code data.', 'error');
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  extractAuthCodeFromUrl(urlString) {
    try {
      // Use regex to extract AuthCode from URL parameters
      const authCodeMatch = urlString.match(/[?&]AuthCode=([^&]+)/);
      if (authCodeMatch && authCodeMatch[1]) {
        const authCode = authCodeMatch[1];

        // Validate that it looks like an agent code (alphanumeric, reasonable length)
        if (authCode && /^[a-zA-Z0-9]{4,20}$/.test(authCode)) {
          return authCode;
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting AuthCode from URL:', error);
      return null;
    }
  }

  extractAgentCodeFromUrl(urlString) {
    try {
      const url = new URL(urlString);
      const pathname = url.pathname;

      // Extract the last part of the path (after the last slash)
      const pathParts = pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];

        // Validate that it looks like an agent code (alphanumeric, reasonable length)
        if (lastPart && /^[a-zA-Z0-9]{4,20}$/.test(lastPart)) {
          return lastPart;
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting agent code from URL:', error);
      return null;
    }
  }



  showInvalidQRData(originalData) {
    // Create a display for invalid QR data
    let infoHTML = `
      <div class="scanned-data-section">
        <h3><i class="fas fa-exclamation-triangle"></i> Invalid QR Code Data</h3>
        <div class="scanned-data-display">
          <div class="data-type-badge error">
            <i class="fas fa-exclamation-circle"></i> Invalid Data
          </div>
          <div class="scanned-content">
            <p><strong>QR Code Content:</strong></p>
            <pre>${originalData}</pre>
          </div>
          <div class="error-info">
            <i class="fas fa-info-circle"></i>
            <strong>Issue:</strong> This QR code contains a URL that doesn't provide valid agent information.
            Please ensure the QR code contains a valid agent code or agent data.
          </div>
        </div>
      </div>
    `;

    this.agentInfo.innerHTML = infoHTML;
    this.resultsContainer.style.display = 'block';
    this.currentAgentCode = null;
  }

  processDirectData(data) {
    // Try to parse as JSON first
    let qrData;
    try {
      qrData = JSON.parse(data);
    } catch {
      // If not JSON, treat as plain text (agent code)
      qrData = { agentCode: data };
    }

    console.log("qrData", qrData);
    this.processParsedData(qrData);
  }

  processParsedData(qrData) {
    // Extract agent code
    const agentCode = qrData.agentCode || qrData.code || qrData.id || this.rawQRData;

    if (!agentCode) {
      this.showStatus('Invalid QR code data. No agent code found.', 'error');
      return;
    }

    // Validate agent code format (should be reasonable length and format)
    if (typeof agentCode === 'string' && agentCode.length > 50) {
      this.showStatus('Invalid agent code format. Code is too long.', 'error');
      this.showInvalidQRData(this.rawQRData, agentCode);
      return;
    }

    // Check if agent code contains HTML tags (indicating it's HTML content)
    if (typeof agentCode === 'string' && (agentCode.includes('<') && agentCode.includes('>'))) {
      this.showStatus('Invalid agent code. Contains HTML content.', 'error');
      this.showInvalidQRData(this.rawQRData, agentCode);
      return;
    }

    this.showAgentInfo(agentCode, qrData);
  }

  async showAgentInfo(agentCode, qrData) {
    console.log("qrData", qrData, "agentCode", agentCode);

    // Check if agent image exists
    const imageExists = await this.checkAgentImage(agentCode);

    // Create agent info display
    let infoHTML = '';

    // Add agent image or error message
    if (imageExists) {
      infoHTML += `
            <div class="agent-image-section">
                <h3><i class="fas fa-user"></i> Agent ID Card</h3>
                <div class="agent-image-container">
                    <img id="agentImage" src="" alt="Agent ID Card" style="width: 400px; height: auto; max-width: 95%; object-fit: cover; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: block; margin: 0 auto;">
                </div>
            </div>
        `;
    } else {
      infoHTML += `
            <div class="agent-not-found-section">
                <div class="error-content">
                    <i class="fas fa-user-slash"></i>
                    <h3>Agent Not Found</h3>
                    <p>Agent with ID <strong>${agentCode}</strong> is not found.</p>
                </div>
            </div>
        `;
    }

    this.agentInfo.innerHTML = infoHTML;
    this.resultsContainer.style.display = 'block';

    // Store agent code for verification
    this.currentAgentCode = agentCode;

    // Load agent image if it exists
    if (imageExists) {
      this.loadAgentImage(agentCode);
      this.showStatus('Agent found successfully!', 'success');
    } else {
      this.showStatus('Agent with this ID is not found.', 'error');
    }
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

  loadAgentImage(agentCode) {
    const agentImage = document.getElementById('agentImage');
    if (!agentImage) return;

    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    let currentIndex = 0;

    function tryNextExtension() {
      if (currentIndex >= extensions.length) {
        // All extensions failed
        console.error('Failed to load agent image with any extension');
        return;
      }

      const extension = extensions[currentIndex];
      agentImage.src = `idcards/${agentCode}.${extension}`;
      currentIndex++;
    }

    // Set up error handler
    agentImage.onerror = function () {
      // Try next extension
      tryNextExtension();
    };

    // Set up success handler
    agentImage.onload = function () {
      // Add success animation
      this.classList.add('success-bounce');
      setTimeout(() => this.classList.remove('success-bounce'), 600);
    };

    // Start with first extension
    tryNextExtension();
  }

  clearResults() {
    this.resultsContainer.style.display = 'none';
    this.agentInfo.innerHTML = '';
    this.currentAgentCode = null;
    this.rawQRData = null;
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