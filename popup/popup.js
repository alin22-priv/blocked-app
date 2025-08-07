/**
 * Blockd Popup JavaScript - With Math Challenge for Focus Mode
 * Handles UI interactions, data visualization, and focus mode math challenges
 */

// Add this new class
class TempAccessManager {
    constructor() {
      this.tempAccessData = {};
      this.tempAccessInterval = null;
      this.init();
    }
  
    async init() {
      await this.loadTempAccessData();
      this.startTempAccessTimer();
    }
  
    async loadTempAccessData() {
      try {
        const data = await chrome.storage.local.get(['tempAccess']);
        this.tempAccessData = data.tempAccess || {};
        // Trigger website list update when temp access data changes
        if (window.popupManager && window.popupManager.isInitialized) {
          await window.popupManager.updateWebsiteList();
        }
      } catch (error) {
        console.error('Error loading temporary access data:', error);
      }
    }
  
    startTempAccessTimer() {
      if (this.tempAccessInterval) {
        clearInterval(this.tempAccessInterval);
      }
      
      this.tempAccessInterval = setInterval(async () => {
        // Just trigger website list update every second for live timers
        if (window.popupManager && window.popupManager.isInitialized) {
          await window.popupManager.updateWebsiteList();
        }
      }, 1000);
    }
  }
  
  // MODIFY your existing DOMContentLoaded to add this line:
  // Find this part in your popup.js and add the tempAccessManager line:
  document.addEventListener('DOMContentLoaded', () => {
    const popupManager = new PopupManager();
    const focusManager = new PopupFocusManager();
    const tempAccessManager = new TempAccessManager(); // ADD THIS LINE
    
    // ... rest of your existing code
  });

class PopupFocusManager {
    constructor() {
      this.focusToggle = null;
      
      // Math Challenge properties
      this.mathChallenge = {
        isActive: false,
        currentProblem: 1,
        totalProblems: 3,
        attempts: 3,
        maxAttempts: 3,
        problems: [],
        answers: [],
        cooldownActive: false,
        cooldownSeconds: 30
      };
      
      this.init();
    }
  
    async init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }
  
    async setup() {
      this.focusToggle = document.querySelector('#focusModeToggle');
      
      if (!this.focusToggle) {
        console.warn('⚠️ Focus toggle not found');
        return;
      }
  
      console.log('🎯 Focus toggle found:', this.focusToggle);
  
      // Load current focus mode state
      await this.loadFocusState();
  
      // Setup event listener for focus toggle
      this.focusToggle.addEventListener('change', (e) => this.handleToggleChange(e));
      
      // Setup math challenge event listeners
      this.setupMathChallengeListeners();
      
      console.log('✅ Focus mode manager initialized');
    }
    
    setupMathChallengeListeners() {
      const challengeSubmit = document.getElementById('challengeSubmit');
      const challengeCancel = document.getElementById('challengeCancel');
      const answerInput = document.getElementById('answerInput');

      if (challengeSubmit) {
        challengeSubmit.addEventListener('click', () => {
          if (!this.mathChallenge.cooldownActive) {
            this.submitAnswer();
          }
        });
      }

      if (challengeCancel) {
        challengeCancel.addEventListener('click', () => {
          this.cancelChallenge();
        });
      }

      if (answerInput) {
        answerInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !this.mathChallenge.cooldownActive) {
            this.submitAnswer();
          }
        });
      }
    }
  
    async loadFocusState() {
      try {
        const response = await this.sendMessage({ action: 'GET_BLOCKING_STATS' });
        
        if (response.success) {
          const isActive = response.data.focusModeStatus?.active || false;
          this.focusToggle.checked = isActive;
          console.log('📊 Loaded focus state:', isActive);
        }
      } catch (error) {
        console.error('❌ Error loading focus state:', error);
      }
    }
  
    async handleToggleChange(event) {
      const isChecked = event.target.checked;
      console.log('🔄 Focus toggle changed to:', isChecked);
  
      if (isChecked) {
        // TURNING ON - No math required
        await this.activateFocusMode();
      } else {
        // TURNING OFF - Show math challenge
        event.preventDefault(); // Prevent toggle from changing
        this.focusToggle.checked = true; // Keep it checked until math is solved
        this.startMathChallenge();
      }
    }
  
    async activateFocusMode() {
      try {
        console.log('🎯 Activating focus mode...');
        
        const response = await this.sendMessage({
          action: 'ACTIVATE_FOCUS_MODE',
          duration: 30 // Default 30 minutes
        });
  
        if (response.success) {
          console.log('✅ Focus mode activated');
          this.showToast('Focus mode activated! 🎯', 'success');
          this.focusToggle.checked = true;
        } else {
          console.error('❌ Failed to activate focus mode:', response.error);
          this.focusToggle.checked = false;
          this.showToast('Failed to activate focus mode', 'error');
        }
      } catch (error) {
        console.error('❌ Error activating focus mode:', error);
        this.focusToggle.checked = false;
        this.showToast('Error activating focus mode', 'error');
      }
    }
    
    // ========== MATH CHALLENGE SYSTEM ==========
    
    generateMathProblem() {
      const operations = ['+', '-', '*'];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      let num1, num2, answer;
      
      switch (operation) {
        case '+':
          num1 = Math.floor(Math.random() * 100) + 10;
          num2 = Math.floor(Math.random() * 100) + 10;
          answer = num1 + num2;
          break;
        case '-':
          num1 = Math.floor(Math.random() * 100) + 50;
          num2 = Math.floor(Math.random() * 50) + 10;
          answer = num1 - num2;
          break;
        case '*':
          num1 = Math.floor(Math.random() * 12) + 2;
          num2 = Math.floor(Math.random() * 12) + 2;
          answer = num1 * num2;
          break;
      }
      
      return {
        problem: `${num1} ${operation} ${num2}`,
        answer: answer
      };
    }

    startMathChallenge() {
      console.log('🧮 Starting math challenge to turn off focus mode...');
      
      // Reset challenge state
      this.mathChallenge = {
        isActive: true,
        currentProblem: 1,
        totalProblems: 3,
        attempts: 3,
        maxAttempts: 3,
        problems: [],
        answers: [],
        cooldownActive: false,
        cooldownSeconds: 30
      };
      
      // Generate all problems at once
      for (let i = 0; i < this.mathChallenge.totalProblems; i++) {
        const problemData = this.generateMathProblem();
        this.mathChallenge.problems.push(problemData.problem);
        this.mathChallenge.answers.push(problemData.answer);
      }
      
      // Show overlay and load first problem
      this.showMathChallengeOverlay();
      this.loadCurrentProblem();
    }

    showMathChallengeOverlay() {
      const overlay = document.getElementById('mathChallengeOverlay');
      const challengeTitle = document.getElementById('challengeTitle');
      const challengeSubtitle = document.getElementById('challengeSubtitle');
      const challengeSiteInfo = document.getElementById('challengeSiteInfo');
      
      if (overlay) {
        overlay.classList.add('active');
      }
      
      if (challengeTitle) {
        challengeTitle.textContent = 'Turn Off Focus Mode';
      }
      
      if (challengeSubtitle) {
        challengeSubtitle.textContent = 'Solve 3 math problems to disable focus mode';
      }
      
      if (challengeSiteInfo) {
        challengeSiteInfo.textContent = 'Focus Mode is currently blocking distracting sites';
      }
    }

    hideMathChallengeOverlay() {
      const overlay = document.getElementById('mathChallengeOverlay');
      if (overlay) {
        overlay.classList.remove('active');
      }
      this.mathChallenge.isActive = false;
    }

    loadCurrentProblem() {
      const problemElement = document.getElementById('mathProblem');
      const currentProblemElement = document.getElementById('currentProblem');
      const attemptsElement = document.getElementById('attemptsLeft');
      const answerInput = document.getElementById('answerInput');
      const feedbackElement = document.getElementById('feedbackMessage');
      
      if (problemElement) {
        problemElement.textContent = this.mathChallenge.problems[this.mathChallenge.currentProblem - 1] + ' = ?';
      }
      
      if (currentProblemElement) {
        currentProblemElement.textContent = this.mathChallenge.currentProblem;
      }
      
      if (attemptsElement) {
        attemptsElement.textContent = `${this.mathChallenge.attempts} attempts remaining`;
      }
      
      if (answerInput) {
        answerInput.value = '';
        answerInput.classList.remove('error');
        answerInput.focus();
      }
      
      if (feedbackElement) {
        feedbackElement.style.display = 'none';
      }
    }

    submitAnswer() {
      const answerInput = document.getElementById('answerInput');
      const userAnswer = parseInt(answerInput.value);
      const correctAnswer = this.mathChallenge.answers[this.mathChallenge.currentProblem - 1];
      
      if (isNaN(userAnswer)) {
        this.showFeedback('Please enter a valid number', 'error');
        return;
      }
      
      if (userAnswer === correctAnswer) {
        // Correct answer!
        this.showFeedback('✅ Correct! Moving to next problem...', 'success');
        
        setTimeout(() => {
          this.mathChallenge.currentProblem++;
          
          if (this.mathChallenge.currentProblem > this.mathChallenge.totalProblems) {
            // All problems solved!
            this.challengeCompleted();
          } else {
            // Reset attempts for next problem
            this.mathChallenge.attempts = this.mathChallenge.maxAttempts;
            this.loadCurrentProblem();
          }
        }, 1500);
        
      } else {
        // Wrong answer
        this.mathChallenge.attempts--;
        answerInput.classList.add('error');
        
        if (this.mathChallenge.attempts > 0) {
          this.showFeedback(`❌ Incorrect. ${this.mathChallenge.attempts} attempts left.`, 'error');
          
          // Update attempts display
          const attemptsElement = document.getElementById('attemptsLeft');
          if (attemptsElement) {
            attemptsElement.textContent = `${this.mathChallenge.attempts} attempts remaining`;
          }
        } else {
          // No attempts left - start cooldown
          this.startCooldown();
        }
      }
      
      // Clear input
      answerInput.value = '';
    }

    startCooldown() {
      this.mathChallenge.cooldownActive = true;
      this.mathChallenge.cooldownSeconds = 30;
      
      const submitBtn = document.getElementById('challengeSubmit');
      const answerInput = document.getElementById('answerInput');
      const cooldownTimer = document.getElementById('cooldownTimer');
      const cooldownSecondsSpan = document.getElementById('cooldownSeconds');
      
      // Disable inputs
      if (submitBtn) submitBtn.disabled = true;
      if (answerInput) answerInput.disabled = true;
      if (cooldownTimer) cooldownTimer.style.display = 'block';
      
      this.showFeedback('No attempts left. Wait 30 seconds...', 'error');
      
      const cooldownInterval = setInterval(() => {
        this.mathChallenge.cooldownSeconds--;
        
        if (cooldownSecondsSpan) {
          cooldownSecondsSpan.textContent = this.mathChallenge.cooldownSeconds;
        }
        
        if (this.mathChallenge.cooldownSeconds <= 0) {
          clearInterval(cooldownInterval);
          this.endCooldown();
        }
      }, 1000);
    }

    endCooldown() {
      this.mathChallenge.cooldownActive = false;
      this.mathChallenge.attempts = this.mathChallenge.maxAttempts;
      
      const submitBtn = document.getElementById('challengeSubmit');
      const answerInput = document.getElementById('answerInput');
      const cooldownTimer = document.getElementById('cooldownTimer');
      const feedbackElement = document.getElementById('feedbackMessage');
      
      // Re-enable inputs
      if (submitBtn) submitBtn.disabled = false;
      if (answerInput) {
        answerInput.disabled = false;
        answerInput.focus();
      }
      if (cooldownTimer) cooldownTimer.style.display = 'none';
      if (feedbackElement) feedbackElement.style.display = 'none';
      
      // Generate new problem for current question
      const newProblem = this.generateMathProblem();
      this.mathChallenge.problems[this.mathChallenge.currentProblem - 1] = newProblem.problem;
      this.mathChallenge.answers[this.mathChallenge.currentProblem - 1] = newProblem.answer;
      
      this.loadCurrentProblem();
    }

    showFeedback(message, type) {
      const feedbackElement = document.getElementById('feedbackMessage');
      if (feedbackElement) {
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback-message feedback-${type}`;
        feedbackElement.style.display = 'block';
      }
    }

    challengeCompleted() {
      console.log('Math challenge completed successfully!');
      
      this.showFeedback('🎉 All problems solved! Turning off focus mode...', 'success');
      
      setTimeout(() => {
        this.hideMathChallengeOverlay();
        this.deactivateFocusMode();
      }, 2000);
    }

    cancelChallenge() {
      console.log('Math challenge cancelled');
      this.hideMathChallengeOverlay();
      
      // Keep focus mode ON since user cancelled
      this.focusToggle.checked = true;
    }
    
    async deactivateFocusMode() {
      try {
        console.log('🔓 Deactivating focus mode...');
        
        const response = await this.sendMessage({
          action: 'DEACTIVATE_FOCUS_MODE'
        });
  
        if (response.success) {
          console.log('✅ Focus mode deactivated');
          this.showToast('Focus mode deactivated! ✨', 'success');
          this.focusToggle.checked = false;
        } else {
          console.error('❌ Failed to deactivate focus mode:', response.error);
          this.focusToggle.checked = true; // Keep it checked on failure
          this.showToast('Failed to deactivate focus mode', 'error');
        }
      } catch (error) {
        console.error('❌ Error deactivating focus mode:', error);
        this.focusToggle.checked = true;
        this.showToast('Error deactivating focus mode', 'error');
      }
    }
  
    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        color: white;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #4CAF50;' : ''}
        ${type === 'error' ? 'background: #F44336;' : ''}
        ${type === 'info' ? 'background: #2196F3;' : ''}
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
  
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => {
            if (document.body.contains(toast)) {
              document.body.removeChild(toast);
            }
          }, 300);
        }
      }, 3000);
    }
  
    async sendMessage(message) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Message timeout' });
        }, 5000);
  
        try {
          chrome.runtime.sendMessage(message, (response) => {
            clearTimeout(timeout);
            
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(response || { success: false, error: 'No response' });
            }
          });
        } catch (error) {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        }
      });
    }
  }

class PopupManager {
    constructor() {
      this.isInitialized = false;
      this.updateInterval = null;
      this.chartInstance = null;
      this.currentData = {};
      
      // Earth-tone color palette for charts
      this.colors = [
        '#D4735A', // Terracotta
        '#A8B5A0', // Sage green
        '#B8956A', // Clay brown
        '#E89B3F', // Warm orange
        '#8B7D6B', // Warm gray
        '#C4A47C', // Light brown
        '#9CAF88', // Olive green
        '#D4A574', // Sandy brown
        '#A67C5A', // Darker brown
        '#7A8471'  // Muted green
      ];
      
      // Bind methods
      this.handleRefresh = this.handleRefresh.bind(this);
      this.handleDashboard = this.handleDashboard.bind(this);
      this.handleBlockedSites = this.handleBlockedSites.bind(this);
      this.handleRetry = this.handleRetry.bind(this);
    }
  
    /**
     * Initialize the popup
     */
    async initialize() {
      try {
        console.log('🚀 Initializing Blockd popup...');
        
        this.showLoading(true);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        setTimeout(async () => {
          try {
            await this.loadData();
            this.showLoading(false);
          } catch (error) {
            console.error('❌ Data loading failed, showing empty state:', error);
            this.showLoading(false);
          }
        }, 100);
        
        // Start real-time updates
        this.startAutoUpdate();
        
        this.isInitialized = true;
        
        console.log('✅ Blockd popup initialized successfully');
        
      } catch (error) {
        console.error('❌ Popup initialization failed:', error);
        this.showLoading(false);
      }
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Button event listeners
      document.getElementById('refreshBtn')?.addEventListener('click', this.handleRefresh);
      document.getElementById('dashboardBtn')?.addEventListener('click', this.handleDashboard);
      document.getElementById('blockedSitesBtn')?.addEventListener('click', this.handleBlockedSites);
      document.getElementById('retryBtn')?.addEventListener('click', this.handleRetry);
      
      console.log('🔗 Event listeners registered');
    }
  
    /**
     * Load data from background script
     */
    async loadData() {
      try {
        console.log('📡 Loading data from background script...');
        
        // Test if background script is responding first
        const testResponse = await this.sendMessage({ action: 'PING' });
        console.log('🏓 Ping response:', testResponse);
        
        if (!testResponse.success) {
          throw new Error('Background script not responding');
        }
        
        // Load data with fallback values
        const [statusResponse, todayResponse, topWebsitesResponse, totalResponse] = await Promise.allSettled([
          this.sendMessage({ action: 'GET_CURRENT_STATUS' }),
          this.sendMessage({ action: 'GET_TODAY_DATA' }),
          this.sendMessage({ action: 'GET_TOP_WEBSITES', limit: 10 }),
          this.sendMessage({ action: 'GET_TODAY_TOTAL' })
        ]);
        
        console.log('📊 All responses:', { statusResponse, todayResponse, topWebsitesResponse, totalResponse });
        
        // Extract data with fallbacks
        this.currentData = {
          status: statusResponse.status === 'fulfilled' && statusResponse.value.success 
            ? statusResponse.value.data 
            : { isTracking: false, currentDomain: null, sessionDuration: 0 },
          todayData: todayResponse.status === 'fulfilled' && todayResponse.value.success 
            ? todayResponse.value.data 
            : {},
          topWebsites: topWebsitesResponse.status === 'fulfilled' && topWebsitesResponse.value.success 
            ? topWebsitesResponse.value.data 
            : [],
          todayTotal: totalResponse.status === 'fulfilled' && totalResponse.value.success 
            ? totalResponse.value.data 
            : 0
        };
        
        // If currently tracking but no data yet, add current session to display
        if (this.currentData.status.isTracking && this.currentData.status.currentDomain && 
            this.currentData.topWebsites.length === 0) {
          console.log('🎯 Adding current session to display');
          this.currentData.topWebsites = [{
            domain: this.currentData.status.currentDomain,
            time: this.currentData.status.sessionDuration || 0,
            sessions: 1
          }];
          this.currentData.todayTotal = this.currentData.status.sessionDuration || 0;
        }
        
        console.log('✅ Data loaded successfully:', this.currentData);
        await this.updateUI();
        
      } catch (error) {
        console.error('❌ Error loading data:', error);
        
        // Show basic UI with no data instead of error
        this.currentData = {
          status: { isTracking: false, currentDomain: null, sessionDuration: 0 },
          todayData: {},
          topWebsites: [],
          todayTotal: 0
        };
        
        await this.updateUI();
      }
    }
  
    /**
     * Update the entire UI with current data
     */
    async updateUI() {
      try {
        this.updateStats();
        this.updateChart();
        this.updateLegend();
        await this.updateWebsiteList();
        
        console.log('🔄 UI updated successfully');
      } catch (error) {
        console.error('❌ Error updating UI:', error);
      }
    }
  
    /**
     * Update stats overview section
     */
    updateStats() {
      const { todayTotal, status } = this.currentData;
      
      // Update today's total
      const todayTotalEl = document.getElementById('todayTotal');
      if (todayTotalEl) {
        todayTotalEl.textContent = this.formatTime(todayTotal);
      }
      
      // Update currently tracking
      const activeElement = document.getElementById('activeWebsite');
      if (activeElement) {
        if (status.isTracking && status.currentDomain) {
          activeElement.textContent = status.currentDomain;
          activeElement.style.color = '#E89B3F'; // Warm orange
          activeElement.style.fontWeight = '600';
        } else {
          activeElement.textContent = 'None';
          activeElement.style.color = '#6B5B47'; // Medium brown
          activeElement.style.fontWeight = 'normal';
        }
      }
    }
  
    /**
     * Update pie chart
     */
    updateChart() {
      const canvas = document.getElementById('pieChart');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      let { topWebsites, todayTotal, status } = this.currentData;
      
      // Add current session if not present in topWebsites
      if (status.isTracking && status.currentDomain) {
        const found = topWebsites.find(w => w.domain === status.currentDomain);
        if (!found && status.sessionDuration > 0) {
          topWebsites = [
            ...topWebsites,
            {
              domain: status.currentDomain,
              time: status.sessionDuration,
              sessions: 1
            }
          ];
        } else if (found && status.sessionDuration > 0) {
          found.time += status.sessionDuration;
        }
      }
      
      // Only include sites with time > 0
      const filteredWebsites = topWebsites.filter(w => w.time > 0);
      const filteredTotal = filteredWebsites.reduce((sum, w) => sum + w.time, 0);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (filteredWebsites.length === 0 || filteredTotal === 0) {
        this.drawEmptyChart(ctx, canvas);
        return;
      }
      
      // Calculate angles for each segment
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;
      let currentAngle = -Math.PI / 2; // Start from top
      
      filteredWebsites.forEach((website, index) => {
        const percentage = website.time / filteredTotal;
        const sliceAngle = percentage * 2 * Math.PI;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        
        ctx.fillStyle = this.colors[index % this.colors.length];
        ctx.fill();
        
        // Add subtle border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
      });
      
      // Update center text
      const centerValueEl = document.getElementById('chartCenterValue');
      if (centerValueEl) {
        centerValueEl.textContent = this.formatTime(filteredTotal);
      }
    }
  
    /**
     * Draw empty chart state
     */
    drawEmptyChart(ctx, canvas) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;
      
      // Draw empty circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#F5F2ED';
      ctx.fill();
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Update center text
      const centerValueEl = document.getElementById('chartCenterValue');
      if (centerValueEl) {
        centerValueEl.textContent = '0m';
      }
    }
  
    /**
     * Update legend section (simple color + name)
     */
    updateLegend() {
      const container = document.getElementById('legendContainer');
      if (!container) return;
      
      let { topWebsites, status } = this.currentData;
      // Add current session if not present in topWebsites
      if (status.isTracking && status.currentDomain) {
        const found = topWebsites.find(w => w.domain === status.currentDomain);
        if (!found && status.sessionDuration > 0) {
          topWebsites = [
            ...topWebsites,
            {
              domain: status.currentDomain,
              time: status.sessionDuration,
              sessions: 1
            }
          ];
        } else if (found && status.sessionDuration > 0) {
          found.time += status.sessionDuration;
        }
      }
      // Only include sites with time > 0
      const filteredWebsites = topWebsites.filter(w => w.time > 0);
      
      container.innerHTML = '';
      
      if (filteredWebsites.length === 0) {
        container.innerHTML = '<div class="legend-empty">No data available</div>';
        return;
      }
      
      // Create simple legend line
      const legendLine = document.createElement('div');
      legendLine.className = 'legend-line';
      
      filteredWebsites.forEach((website, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item-simple';
        
        legendItem.innerHTML = `
          <div class="legend-color-simple" style="background-color: ${this.colors[index % this.colors.length]}"></div>
          <span class="legend-name">${website.domain}</span>
        `;
        
        legendLine.appendChild(legendItem);
      });
      
      container.appendChild(legendLine);
    }
  
    /**
     * Update website list section
     */
    async updateWebsiteList() {
      const container = document.getElementById('websiteContainer');
      if (!container) return;
      
      const { topWebsites, status } = this.currentData;
      
      // Get temporary access data and blocked sites
      let tempAccessData = {};
      let blockedSites = [];
      try {
        const [tempData, blockingStats] = await Promise.all([
          chrome.storage.local.get(['tempAccess']),
          this.sendMessage({ action: 'GET_BLOCKING_STATS' })
        ]);
        tempAccessData = tempData.tempAccess || {};
        if (blockingStats.success) {
          blockedSites = blockingStats.data.individuallyBlockedSites || [];
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
      
      container.innerHTML = '';
      
      if (topWebsites.length === 0) {
        container.innerHTML = `
          <div class="website-item">
            <div class="website-favicon">📊</div>
            <div class="website-info">
              <div class="website-domain">No activity tracked yet</div>
              <div class="website-sessions">Start browsing to see your data</div>
            </div>
          </div>
        `;
        return;
      }
      
      // Sort websites: active site first, then by time
      const sortedWebsites = [...topWebsites].sort((a, b) => {
        // If one is the active site, put it first
        if (status.isTracking && status.currentDomain === a.domain) return -1;
        if (status.isTracking && status.currentDomain === b.domain) return 1;
        // Otherwise sort by time
        return b.time - a.time;
      });
      
      sortedWebsites.forEach((website, index) => {
        const isActive = status.isTracking && status.currentDomain === website.domain;
        
        // Check if this website has temporary access
        const now = Date.now();
        const domain = website.domain;
        const cleanDomain = domain.replace(/^www\./, '');
        const tempExpiry = tempAccessData[cleanDomain] || tempAccessData[`www.${cleanDomain}`];
        const hasTemporaryAccess = tempExpiry && now < tempExpiry;
        const remainingTime = hasTemporaryAccess ? tempExpiry - now : 0;
        
        // Check if this website is blocked
        const isBlocked = blockedSites.includes(cleanDomain) || blockedSites.includes(`www.${cleanDomain}`);
        
        const websiteItem = document.createElement('div');
        let itemClasses = `website-item ${isActive ? 'active' : ''}`;
        if (hasTemporaryAccess) {
          itemClasses += ' has-temp-access';
        } else if (isBlocked) {
          itemClasses += ' is-blocked';
        }
        websiteItem.className = itemClasses;
        
        const favicon = this.getFavicon(website.domain);
        const sessionText = website.sessions === 1 ? 'session' : 'sessions';
        
        // Find the color index from the original topWebsites array
        const originalIndex = topWebsites.findIndex(w => w.domain === website.domain);
        const colorIndex = originalIndex !== -1 ? originalIndex : index;
        
        // Format remaining time for temporary access
        const formatTempTime = (ms) => {
          const totalSeconds = Math.floor(ms / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        // Determine what to show under sessions
        let statusLine = '';
        if (hasTemporaryAccess) {
          statusLine = `<div class="website-temp-access">⏱️ ${formatTempTime(remainingTime)} break time</div>`;
        } else if (isBlocked) {
          statusLine = `<div class="website-blocked-status">blocked</div>`;
        }
        
        websiteItem.innerHTML = `
          <div class="website-color-indicator" style="background-color: ${this.colors[colorIndex % this.colors.length]}"></div>
          <div class="website-favicon">${favicon}</div>
          <div class="website-info">
            <div class="website-domain">${website.domain}</div>
            <div class="website-sessions">${website.sessions} ${sessionText}${isActive ? ' (Active)' : ''}</div>
            ${statusLine}
          </div>
          <div class="website-time">${this.formatTime(website.time)}</div>
        `;
        
        container.appendChild(websiteItem);
      });
    }
  
    /**
     * Get favicon or fallback for domain
     */
    getFavicon(domain) {
      const faviconMap = {
        'youtube.com': '📺',
        'facebook.com': '📘',
        'twitter.com': '🐦',
        'instagram.com': '📷',
        'linkedin.com': '💼',
        'reddit.com': '🤖',
        'github.com': '🐙',
        'stackoverflow.com': '📚',
        'gmail.com': '📧',
        'google.com': '🔍',
        'claude.ai': '🤖',
        'figma.com': '🎨'
      };
      
      return faviconMap[domain] || '🌐';
    }
  
    /**
     * Format time duration
     */
    formatTime(seconds) {
      if (seconds < 60) {
        return `${seconds}s`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    }
  
    /**
     * Send message to background script
     */
    async sendMessage(message) {
      return new Promise((resolve) => {
        // Set a timeout for the message
        const timeout = setTimeout(() => {
          console.warn('⚠️  Message timeout:', message);
          resolve({ success: false, error: 'Message timeout' });
        }, 5000); // 5 second timeout
        
        try {
          chrome.runtime.sendMessage(message, (response) => {
            clearTimeout(timeout);
            
            if (chrome.runtime.lastError) {
              console.error('Chrome runtime error:', chrome.runtime.lastError);
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else if (!response) {
              console.warn('⚠️  No response received for:', message);
              resolve({ success: false, error: 'No response received' });
            } else {
              resolve(response);
            }
          });
        } catch (error) {
          clearTimeout(timeout);
          console.error('❌ Error sending message:', error);
          resolve({ success: false, error: error.message });
        }
      });
    }
  
    /**
     * Start auto-update interval
     */
    startAutoUpdate() {
      // Update every 3 seconds for live tracking
      this.updateInterval = setInterval(async () => {
        if (this.isInitialized) {
          await this.loadData();
        }
      }, 3000);
      
      console.log('⏱️  Auto-update started (3s interval)');
    }
  
    /**
     * Stop auto-update interval
     */
    stopAutoUpdate() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
        console.log('⏹️  Auto-update stopped');
      }
    }
  
    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
      }
    }
  
    /**
     * Show/hide error state
     */
    showError(show) {
      const errorState = document.getElementById('errorState');
      if (errorState) {
        errorState.classList.toggle('hidden', !show);
      }
      
      if (show) {
        this.showLoading(false);
      }
    }
  
    // Event Handlers
    async handleRefresh() {
      try {
        this.showLoading(true);
        await this.loadData();
        this.showLoading(false);
        console.log('🔄 Data refreshed manually');
      } catch (error) {
        console.error('❌ Manual refresh failed:', error);
        this.showError(true);
      }
    }
  
    handleDashboard() {
      // Open dashboard in new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard/dashboard.html')
      });
      console.log('📊 Opening Blockd dashboard...');
    }
  
    handleBlockedSites() {
        console.log('🚫 Blocked Sites button clicked!'); // Debug log
        
        // Open blocked sites management page
        chrome.tabs.create({
          url: chrome.runtime.getURL('blocked/blocked.html')
        }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error opening blocked sites page:', chrome.runtime.lastError);
          } else {
            console.log('✅ Blocked sites page opened successfully');
          }
        });
        console.log('🚫 Opening blocked sites management...');
    }
  
    async handleRetry() {
      this.showError(false);
      await this.initialize();
    }
  }
  
  // Initialize popup when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize all managers
    const popupManager = new PopupManager();
    const focusManager = new PopupFocusManager();
    const tempAccessManager = new TempAccessManager(); // ADDED: Initialize temp access manager
    
    popupManager.initialize();
    
    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      popupManager.stopAutoUpdate();
      // ADDED: Cleanup temp access timer
      if (tempAccessManager.tempAccessInterval) {
        clearInterval(tempAccessManager.tempAccessInterval);
      }
    });
    
    // Export for debugging and global access
    window.popupManager = popupManager;
    window.focusManager = focusManager;
    window.tempAccessManager = tempAccessManager; // ADDED: Export temp access manager
  });

  // Add CSS for toast animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);