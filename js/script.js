// Function to get query parameters from the URL
function getQueryParam(param) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
    return null;
  }
}

// Function to safely update URL without causing reload issues
function updateURLParameter(param, value) {
  try {
    const url = new URL(window.location);
    if (value) {
      url.searchParams.set(param, value);
    } else {
      url.searchParams.delete(param);
    }
    window.history.pushState({}, '', url);
  } catch (error) {
    console.error('Error updating URL:', error);
  }
}

// Function to validate if input contains only numbers
function isValidNumber(input) {
  return /^\d+$/.test(input);
}

// Function to add typing effect
function addTypingEffect() {
  const title = document.querySelector('.hero h1');
  const text = title.textContent;
  title.textContent = '';
  title.style.opacity = '1';

  let i = 0;
  const typeWriter = () => {
    if (i < text.length) {
      title.textContent += text.charAt(i);
      i++;
      setTimeout(typeWriter, 100);
    }
  };

  setTimeout(typeWriter, 500);
}

// Function to create particle effect
function createParticles() {
  const hero = document.querySelector('.hero');
  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'particles';
  hero.appendChild(particlesContainer);

  // Create fewer particles for better performance (30 instead of 50)
  for (let i = 0; i < 300; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
    particlesContainer.appendChild(particle);
  }
}

// Function to clear search and show default image
function clearSearch() {
  const searchInput = document.getElementById('agentSearch');
  const agentImage = document.getElementById("agentImage");
  const searchBtn = document.getElementById('searchBtn');

  // Clear the search input
  searchInput.value = '';

  // Remove any existing error message
  const existingError = document.querySelector('.agent-not-found');
  if (existingError) {
    existingError.remove();
  }

  // Show default image
  agentImage.style.display = 'block';
  agentImage.src = "Housekeeping-Employee-ID-Card-Template-edit-online.webp";

  // Clear URL parameters
  updateURLParameter('AuthCode', null);

  // Reset button
  searchBtn.innerHTML = 'Search';
  searchBtn.disabled = false;

  // Focus on search input
  searchInput.focus();

  // Show a subtle notification that search was cleared
  showNotification('Search cleared', 'info');
}

// Function to try loading image with different extensions
function loadImageWithFallback(agentCode, agentImage, loadingSpinner, searchBtn) {
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  let currentIndex = 0;

  // Store the original error handler
  const originalOnError = agentImage.onerror;

  function tryNextExtension() {
    if (currentIndex >= extensions.length) {
      // All extensions failed, restore original error handler and trigger it
      agentImage.onerror = originalOnError;
      agentImage.onerror();
      return;
    }

    const extension = extensions[currentIndex];
    agentImage.src = `../idcards/${agentCode}.${extension}`;
    currentIndex++;
  }

  // Set up temporary error handler for this attempt
  agentImage.onerror = function () {
    // Try next extension
    tryNextExtension();
  };

  // Set up success handler
  agentImage.onload = function () {
    // Restore original error handler
    agentImage.onerror = originalOnError;

    loadingSpinner.style.display = "none";

    // Remove any existing error message
    const existingError = document.querySelector('.agent-not-found');
    if (existingError) {
      existingError.remove();
    }

    // Show the image
    this.style.display = 'block';
    this.classList.add('success-bounce');
    setTimeout(() => this.classList.remove('success-bounce'), 600);

    // Reset button
    searchBtn.innerHTML = 'Search';
    searchBtn.disabled = false;
    console.log("agentCode", agentCode);
    // Show success notification
    if (agentCode) {
      showNotification('Agent found successfully!', 'success');
    }
  };

  // Start with first extension
  tryNextExtension();
}

// Function to search for agent with enhanced animations
function searchAgent() {
  const searchInput = document.getElementById('agentSearch');
  const agentCode = searchInput.value.trim();
  const agentImage = document.getElementById("agentImage");
  const loadingSpinner = document.getElementById("loading");
  const searchBtn = document.getElementById('searchBtn');

  if (!agentCode) {
    showNotification('Please enter an agent code', 'error');
    searchInput.classList.add('error-shake');
    setTimeout(() => searchInput.classList.remove('error-shake'), 500);
    return;
  }

  if (!isValidNumber(agentCode)) {
    showNotification('Please enter only numbers', 'error');
    searchInput.value = '';
    searchInput.focus();
    searchInput.classList.add('error-shake');
    setTimeout(() => searchInput.classList.remove('error-shake'), 500);
    return;
  }

  // Update URL parameters
  updateURLParameter('AuthCode', agentCode);

  // Add loading animation to button
  searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
  searchBtn.disabled = true;

  // Show loading spinner with enhanced animation
  loadingSpinner.style.display = "block";
  loadingSpinner.style.animation = "spin 1s linear infinite, pulse 2s ease-in-out infinite";

  // Update image source
  loadImageWithFallback(agentCode, agentImage, loadingSpinner, searchBtn);
}

// Function to show notifications
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' : 'linear-gradient(45deg, #2ecc71, #27ae60)'};
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 1000;
    transform: translateX(400px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 3000);
  }, 3000);
}

// Dynamic content and loading spinner
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on the wrong page (file explorer)
  if (document.title === "" || document.title.includes("Explorer") || document.querySelector('body').innerHTML.includes('Explorer')) {
    console.log("Detected file explorer, redirecting to index.html");
    window.location.href = window.location.origin + '/index.html' + window.location.search;
    return;
  }

  const agentImage = document.getElementById("agentImage");
  const loadingSpinner = document.getElementById("loading");
  const searchInput = document.getElementById('agentSearch');
  const searchBtn = document.getElementById('searchBtn');
  const clearBtn = document.getElementById('clearBtn');

  // Initialize animations
  addTypingEffect();
  createParticles();

  // Check for URL parameter first
  const agentCode = getQueryParam("AuthCode");

  if (agentCode) {
    searchInput.value = agentCode;
    loadingSpinner.style.display = "block";
    loadImageWithFallback(agentCode, agentImage, loadingSpinner, searchBtn);
  } else {
    // Set default image directly to the working image
    agentImage.style.display = 'block';
  }

  // Image load event handlers with enhanced animations
  agentImage.onload = function () {
    loadingSpinner.style.display = "none";

    // Remove any existing error message
    const existingError = document.querySelector('.agent-not-found');
    if (existingError) {
      existingError.remove();
    }

    // Show the image
    this.style.display = 'block';
    this.classList.add('success-bounce');
    setTimeout(() => this.classList.remove('success-bounce'), 600);

    // Reset button
    searchBtn.innerHTML = 'Search';
    searchBtn.disabled = false;

    // Only show success notification if there's an actual agent code being searched
    const currentAgentCode = searchInput.value.trim();
    if (currentAgentCode && this.src.includes('/idcards/')) {
      showNotification('Agent found successfully!', 'success');
    }
  };

  agentImage.onerror = function () {
    loadingSpinner.style.display = "none";

    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'agent-not-found';
    errorMessage.innerHTML = `
      <div class="error-content">
        <i class="fas fa-user-slash"></i>
        <h3>Agent Not Found</h3>
        <p>No agent exists with ID: <strong>${searchInput.value.trim()}</strong></p>
        <p class="error-subtitle">Please verify the agent code and try again.</p>
      </div>
    `;

    // Style the error message
    errorMessage.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 2px dashed #dee2e6;
      border-radius: 15px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    `;

    // Style the error content
    const errorContent = errorMessage.querySelector('.error-content');
    errorContent.style.cssText = `
      text-align: center;
      color: #6c757d;
    `;

    // Style the icon
    const icon = errorMessage.querySelector('i');
    icon.style.cssText = `
      font-size: 4rem;
      color: #dc3545;
      margin-bottom: 1rem;
      display: block;
    `;

    // Style the heading
    const heading = errorMessage.querySelector('h3');
    heading.style.cssText = `
      color: #dc3545;
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    // Style the main text
    const mainText = errorMessage.querySelector('p');
    mainText.style.cssText = `
      margin: 0.5rem 0;
      font-size: 1.1rem;
      color: #495057;
    `;

    // Style the subtitle
    const subtitle = errorMessage.querySelector('.error-subtitle');
    subtitle.style.cssText = `
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
      color: #6c757d;
      font-style: italic;
    `;

    // Replace the image with the error message
    this.style.display = 'none';
    this.parentNode.insertBefore(errorMessage, this.nextSibling);

    // Add animation
    errorMessage.style.opacity = '0';
    errorMessage.style.transform = 'translateY(20px)';
    errorMessage.style.transition = 'all 0.3s ease-out';

    setTimeout(() => {
      errorMessage.style.opacity = '1';
      errorMessage.style.transform = 'translateY(0)';
    }, 100);

    // Reset button
    searchBtn.innerHTML = 'Search';
    searchBtn.disabled = false;

    // Show error notification
    showNotification('Agent not found. Please check the agent code.', 'error');
  };

  // Search button click event with ripple effect
  searchBtn.addEventListener('click', function (e) {
    // Create ripple effect
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);

    // Call the search function
    searchAgent();
  });

  // Clear button click event
  clearBtn.addEventListener('click', function (e) {
    // Create ripple effect
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);

    // Call the clear function
    clearSearch();
  });

  // Enter key press event for search input
  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      searchAgent();
    }
  });

  // Input validation - only allow numbers with enhanced feedback
  searchInput.addEventListener('input', function (e) {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    if (value !== numericValue) {
      e.target.value = numericValue;
      e.target.classList.add('error-shake');
      setTimeout(() => e.target.classList.remove('error-shake'), 500);
    }
  });

  // Prevent paste of non-numeric content
  searchInput.addEventListener('paste', function (e) {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const numericText = pastedText.replace(/[^0-9]/g, '');
    if (numericText) {
      const currentValue = e.target.value;
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = currentValue.substring(0, start) + numericText + currentValue.substring(end);
      e.target.setSelectionRange(start + numericText.length, start + numericText.length);
    } else {
      showNotification('Only numbers are allowed', 'error');
    }
  });

  // Add focus effects
  searchInput.addEventListener('focus', function () {
    this.parentElement.style.transform = 'scale(1.02)';
  });

  searchInput.addEventListener('blur', function () {
    this.parentElement.style.transform = 'scale(1)';
  });

  // Add parallax effect to hero section
  window.addEventListener('scroll', function () {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;
    hero.style.transform = `translateY(${rate}px)`;
  });

  // Add smooth reveal animation for social icons
  const socialIcons = document.querySelectorAll('.social-icons a');
  socialIcons.forEach((icon, index) => {
    icon.style.animationDelay = `${1.8 + index * 0.1}s`;
    icon.style.animation = 'fadeInUp 0.6s ease-out both';
  });

  // Image Upload Functionality with PHP
  const imageUpload = document.getElementById('imageUpload');
  const uploadForm = document.getElementById('uploadForm');
  const uploadPreview = document.getElementById('uploadPreview');
  const uploadStatus = document.getElementById('uploadStatus');
  const dragDropZone = document.getElementById('dragDropZone');

  // Drag and Drop Functionality
  function setupDragAndDrop() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dragDropZone.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      dragDropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dragDropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dragDropZone.addEventListener('drop', handleDrop, false);

    // Handle click on drag drop zone
    dragDropZone.addEventListener('click', () => {
      imageUpload.click();
    });
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight(e) {
    dragDropZone.classList.add('drag-over');
  }

  function unhighlight(e) {
    dragDropZone.classList.remove('drag-over');
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
      }

      // Set the file to the input
      imageUpload.files = files;

      // Trigger the change event to show preview
      const event = new Event('change', { bubbles: true });
      imageUpload.dispatchEvent(event);

      showNotification('Image selected successfully!', 'success');
    }
  }

  // Initialize drag and drop
  setupDragAndDrop();

  // Handle file selection for preview
  imageUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        uploadStatus.textContent = `Selected: ${file.name}`;
        uploadStatus.className = 'upload-status info';
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle form submission
  uploadForm.addEventListener('submit', function (e) {
    const file = imageUpload.files[0];
    if (!file) {
      e.preventDefault();
      showNotification('Please select an image first', 'error');
      return;
    }

    // Show uploading status
    uploadStatus.textContent = 'Uploading...';
    uploadStatus.className = 'upload-status info';
  });

  // Check for upload status messages from PHP redirects
  const urlParams = new URLSearchParams(window.location.search);
  const uploadStatusParam = urlParams.get('upload');
  const message = urlParams.get('message');
  const filename = urlParams.get('filename');

  if (uploadStatusParam === 'success') {
    showNotification(`File "${filename}" uploaded successfully to idcards directory!`, 'success');
    uploadStatus.textContent = `Successfully uploaded: ${filename}`;
    uploadStatus.className = 'upload-status success';
    uploadPreview.innerHTML = '';
    imageUpload.value = '';

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (uploadStatusParam === 'error') {
    showNotification(message || 'Upload failed', 'error');
    uploadStatus.textContent = message || 'Upload failed';
    uploadStatus.className = 'upload-status error';

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

// Add ripple animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style); 