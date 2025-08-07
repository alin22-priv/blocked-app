/**
 * Blocked Sites Management JavaScript
 * Handles blocking/unblocking websites with math challenges
 */

class BlockedSitesManager {
    constructor() {
      this.blockedSites = new Set();
      
      // FOCUS MODE PROPERTIES - COMMENTED OUT FOR FUTURE USE
      /*
      this.focusModeSites = new Set([
        'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
        'youtube.com', 'netflix.com', 'reddit.com', 'twitch.tv'
      ]);
      this.focusModeActive = false;
      */
      
      this.currentChallenge = null;
      
      // Site favicon mapping
      this.faviconMap = {
        'facebook.com': '📘',
        'youtube.com': '📺',
        'twitter.com': '🐦',
        'instagram.com': '📷',
        'reddit.com': '🤖',
        'tiktok.com': '🎵',
        'netflix.com': '🎬',
        'twitch.tv': '🎮',
        'linkedin.com': '💼',
        'github.com': '🐙',
        'stackoverflow.com': '📚',
        'gmail.com': '📧',
        'google.com': '🔍'
      };
      
      this.initialize();
    }
  
    /**
     * Initialize the blocked sites manager
     */
    async initialize() {
      try {
        console.log('🚀 Initializing blocked sites manager...');
        
        this.setupEventListeners();
        await this.loadBlockedSites();
        this.updateUI();
        
        console.log('✅ Blocked sites manager initialized');
      } catch (error) {
        console.error('❌ Initialization failed:', error);
      }
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Add site button
      document.getElementById('addSiteBtn')?.addEventListener('click', () => {
        this.addSiteFromInput();
      });
  
      // Website input enter key
      document.getElementById('websiteInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addSiteFromInput();
        }
      });
  
      // Quick block tabs
      document.querySelectorAll('.quick-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          const domain = btn.dataset.domain;
          if (domain && !this.blockedSites.has(domain)) {
            this.blockSite(domain);
          }
        });
      });
  
      // FOCUS MODE EVENT LISTENERS - COMMENTED OUT FOR FUTURE USE
      /*
      document.getElementById('focusModeToggle')?.addEventListener('change', (e) => {
        if (e.target.checked && !this.focusModeActive) {
          // TURNING ON - No math required, instant activation
          this.activateFocusModeInstantly();
        } else if (!e.target.checked && this.focusModeActive) {
          // TURNING OFF - Require math challenge
          this.startFocusDeactivationChallenge(e);
        }
      });
      
      // Start focus button - FIXED LOGIC
      document.getElementById('startFocusBtn')?.addEventListener('click', () => {
        // Instantly activate focus mode
        this.activateFocusModeInstantly();
      });
      */
  
      // Modal controls
      document.getElementById('closeMathModal')?.addEventListener('click', () => {
        this.hideModal();
      });
  
      document.getElementById('cancelChallenge')?.addEventListener('click', () => {
        this.hideModal();
      });
  
      document.getElementById('submitAnswers')?.addEventListener('click', () => {
        this.submitMathChallenge();
      });
  
      console.log('🔗 Event listeners registered');
    }
  
    /**
     * Load blocked sites from storage
     */
    async loadBlockedSites() {
      try {
        const response = await this.sendMessage({ action: 'GET_BLOCKING_STATS' });
        
        if (response.success) {
          const stats = response.data;
          this.blockedSites = new Set(stats.individuallyBlockedSites || []);
          
          // FOCUS MODE LOADING - COMMENTED OUT FOR FUTURE USE
          /*
          this.focusModeSites = new Set(stats.focusModeSites || this.focusModeSites);
          
          const focusStatus = stats.focusModeStatus || {};
          this.focusModeActive = focusStatus.active || false;
          */
          
          console.log('📋 Loaded blocking data:', {
            blocked: Array.from(this.blockedSites)
            // focusMode: this.focusModeActive
          });
        }
      } catch (error) {
        console.error('❌ Error loading blocked sites:', error);
      }
    }
  
    /**
     * Update the entire UI
     */
    updateUI() {
      this.updateBlockedSitesList();
      this.updateQuickBlockTabs();
      // this.updateFocusModeSection(); // COMMENTED OUT
      this.updateStats();
    }
  
    /**
     * Update blocked sites list
     */
    updateBlockedSitesList() {
      const container = document.getElementById('blockedSitesList');
      const emptyState = document.getElementById('emptyState');
      
      if (!container || !emptyState) return;
  
      container.innerHTML = '';
  
      if (this.blockedSites.size === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }
  
      container.style.display = 'block';
      emptyState.style.display = 'none';
  
      Array.from(this.blockedSites).forEach(domain => {
        const item = document.createElement('div');
        item.className = 'blocked-site-item';
        
        const favicon = this.faviconMap[domain] || '🌐';
        // const isInFocusMode = this.focusModeSites.has(domain); // COMMENTED OUT
        
        item.innerHTML = `
          <div class="site-info">
            <div class="site-favicon">${favicon}</div>
            <div class="site-details">
              <div class="site-domain">${domain}</div>
              <div class="site-status">
                Blocked individually
              </div>
            </div>
          </div>
          <div class="site-actions">
            <button class="unblock-btn" data-domain="${domain}">
              Unblock
            </button>
            <button class="remove-btn" data-domain="${domain}">
              Remove
            </button>
          </div>
        `;
  
        // Add event listeners to the buttons
        const unblockBtn = item.querySelector('.unblock-btn');
        const removeBtn = item.querySelector('.remove-btn');
  
        unblockBtn?.addEventListener('click', () => {
          this.startUnblockChallenge(domain);
        });
  
        removeBtn?.addEventListener('click', () => {
          this.removeSite(domain);
        });
  
        container.appendChild(item);
      });
    }
  
    /**
     * Update quick block tabs
     */
    updateQuickBlockTabs() {
      document.querySelectorAll('.quick-tab').forEach(btn => {
        const domain = btn.dataset.domain;
        if (this.blockedSites.has(domain)) {
          btn.classList.add('blocked');
          btn.disabled = true;
        } else {
          btn.classList.remove('blocked');
          btn.disabled = false;
        }
      });
    }
  
    // FOCUS MODE UI UPDATE - COMMENTED OUT FOR FUTURE USE
    /*
    updateFocusModeSection() {
      const toggle = document.getElementById('focusModeToggle');
      const startBtn = document.getElementById('startFocusBtn');
      const focusSitesList = document.getElementById('focusSitesList');
  
      if (toggle) {
        toggle.checked = this.focusModeActive;
      }
  
      if (startBtn) {
        startBtn.disabled = this.focusModeActive;
        startBtn.innerHTML = this.focusModeActive ? 
          '<span class="btn-icon">✅</span>Focus Mode Active' : 
          '<span class="btn-icon">🎯</span>Start Focus Session';
      }
  
      if (focusSitesList) {
        focusSitesList.innerHTML = '';
        Array.from(this.focusModeSites).forEach(domain => {
          const tag = document.createElement('div');
          tag.className = 'focus-site-tag';
          tag.textContent = domain;
          focusSitesList.appendChild(tag);
        });
      }
    }
    */
  
    /**
     * Update statistics
     */
    updateStats() {
      const blockedCount = document.getElementById('blockedCount');
      if (blockedCount) {
        blockedCount.textContent = this.blockedSites.size;
      }
    }
  
    /**
     * Add site from input field
     */
    async addSiteFromInput() {
      const input = document.getElementById('websiteInput');
      if (!input) return;
  
      const domain = this.cleanDomain(input.value.trim());
      
      if (!domain) {
        this.showToast('Please enter a valid domain name', 'error');
        return;
      }
  
      if (this.blockedSites.has(domain)) {
        this.showToast('This site is already blocked', 'warning');
        return;
      }
  
      await this.blockSite(domain);
      input.value = '';
    }
  
    /**
     * Clean and validate domain input
     */
    cleanDomain(input) {
      if (!input) return null;
  
      // Remove protocol and www
      let domain = input.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, ''); // Remove path
  
      // Basic validation
      if (!domain.includes('.') || domain.length < 4) {
        return null;
      }
  
      return domain;
    }
  
    /**
     * Block a website
     */
    async blockSite(domain) {
      try {
        this.showLoading(true);
        
        const response = await this.sendMessage({
          action: 'BLOCK_WEBSITE',
          domain: domain
        });
  
        if (response.success) {
          this.blockedSites.add(domain);
          this.updateUI();
          this.showToast(`${domain} has been blocked`, 'success');
        } else {
          this.showToast('Failed to block website', 'error');
        }
      } catch (error) {
        console.error('❌ Error blocking site:', error);
        this.showToast('Error blocking website', 'error');
      } finally {
        this.showLoading(false);
      }
    }
  
    /**
     * Remove a site from blocked list (no challenge required)
     */
    async removeSite(domain) {
      try {
        this.showLoading(true);
        
        const response = await this.sendMessage({
          action: 'REMOVE_BLOCKED_SITE',
          domain: domain
        });
  
        if (response.success) {
          this.blockedSites.delete(domain);
          this.updateUI();
          this.showToast(`${domain} removed from blocked list`, 'success');
        } else {
          this.showToast('Failed to remove website', 'error');
        }
      } catch (error) {
        console.error('❌ Error removing site:', error);
        this.showToast('Error removing website', 'error');
      } finally {
        this.showLoading(false);
      }
    }
  
    /**
     * Start unblock challenge for a specific site
     */
    async startUnblockChallenge(domain) {
      try {
        this.showLoading(true);
        
        const response = await this.sendMessage({
          action: 'START_UNBLOCK_CHALLENGE',
          domain: domain
        });
  
        if (response.success) {
          this.currentChallenge = response.data;
          this.showMathChallenge(
            `Solve these problems to unblock ${domain}:`,
            this.currentChallenge.problems
          );
        } else {
          this.showToast('Failed to create unblock challenge', 'error');
        }
      } catch (error) {
        console.error('❌ Error starting unblock challenge:', error);
        this.showToast('Error starting challenge', 'error');
      } finally {
        this.showLoading(false);
      }
    }
  
    // FOCUS MODE CHALLENGE FUNCTIONS - COMMENTED OUT FOR FUTURE USE
    /*
    async startFocusModeChallenge() {
      try {
        const duration = parseInt(document.getElementById('durationSelect')?.value || '30');
        
        this.showLoading(true);
        
        const response = await this.sendMessage({
          action: 'START_FOCUS_MODE_CHALLENGE',
          duration: duration
        });
  
        if (response.success) {
          this.currentChallenge = response.data;
          this.showMathChallenge(
            `Solve these problems to activate ${duration}-minute focus mode:`,
            this.currentChallenge.problems
          );
        } else {
          this.showToast('Failed to create focus mode challenge', 'error');
        }
      } catch (error) {
        console.error('❌ Error starting focus mode challenge:', error);
        this.showToast('Error starting focus mode', 'error');
      } finally {
        this.showLoading(false);
      }
    }
    
    async activateFocusModeInstantly() {
      try {
        const duration = parseInt(document.getElementById('durationSelect')?.value || '30');
        
        this.showLoading(true);
        
        const response = await this.sendMessage({
          action: 'ACTIVATE_FOCUS_MODE',
          duration: duration
        });
  
        if (response.success) {
          this.focusModeActive = true;
          this.updateUI();
          this.showToast(`Focus mode activated for ${duration} minutes!`, 'success');
        } else {
          this.showToast('Failed to activate focus mode', 'error');
        }
      } catch (error) {
        console.error('❌ Error activating focus mode:', error);
        this.showToast('Error activating focus mode', 'error');
      } finally {
        this.showLoading(false);
      }
    }
    
    async startFocusDeactivationChallenge(toggleEvent) {
      // Prevent the toggle from changing until challenge is complete
      toggleEvent.target.checked = true;
      
      try {
        this.showLoading(true);
        
        const response = await this.sendMessage({
          action: 'START_FOCUS_DEACTIVATION_CHALLENGE'
        });
  
        if (response.success) {
          this.currentChallenge = response.data;
          this.showMathChallenge(
            'Solve these problems to deactivate focus mode:',
            this.currentChallenge.problems
          );
        } else {
          this.showToast('Failed to create deactivation challenge', 'error');
        }
      } catch (error) {
        console.error('❌ Error starting deactivation challenge:', error);
        this.showToast('Error starting challenge', 'error');
      } finally {
        this.showLoading(false);
      }
    }
    
    async deactivateFocusMode() {
      try {
        const response = await this.sendMessage({
          action: 'DEACTIVATE_FOCUS_MODE'
        });
  
        if (response.success) {
          this.focusModeActive = false;
          this.updateUI();
          this.showToast('Focus mode deactivated', 'success');
        }
      } catch (error) {
        console.error('❌ Error deactivating focus mode:', error);
      }
    }
    */
  
    /**
     * Show math challenge modal
     */
    showMathChallenge(description, problems) {
      const modal = document.getElementById('mathModal');
      const descriptionEl = document.getElementById('challengeDescription');
      const problemsContainer = document.getElementById('mathProblems');
      const resultContainer = document.getElementById('challengeResult');
  
      if (!modal || !descriptionEl || !problemsContainer) return;
  
      // Set description
      descriptionEl.textContent = description;
  
      // Clear previous results
      resultContainer.innerHTML = '';
      resultContainer.classList.add('hidden');
  
      // Generate problem inputs
      problemsContainer.innerHTML = '';
      problems.forEach((problem, index) => {
        const problemDiv = document.createElement('div');
        problemDiv.className = 'math-problem';
        problemDiv.innerHTML = `
          <div class="problem-question">${index + 1}. ${problem.question}</div>
          <input 
            type="number" 
            class="problem-input" 
            placeholder="Your answer"
            data-index="${index}"
          >
        `;
        problemsContainer.appendChild(problemDiv);
      });
  
      // Show modal
      modal.classList.remove('hidden');
  
      // Focus first input
      const firstInput = problemsContainer.querySelector('.problem-input');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  
    /**
     * Submit math challenge answers
     */
    async submitMathChallenge() {
      if (!this.currentChallenge) return;
  
      try {
        // Collect answers
        const inputs = document.querySelectorAll('.problem-input');
        const answers = Array.from(inputs).map(input => input.value.trim());
  
        // Validate all fields are filled
        if (answers.some(answer => !answer)) {
          this.showChallengeResult('Please answer all questions', 'error');
          return;
        }
  
        this.showLoading(true);
  
        // Submit to background script
        const response = await this.sendMessage({
          action: 'SUBMIT_MATH_CHALLENGE',
          challengeId: this.currentChallenge.challengeId,
          answers: answers,
          problems: this.currentChallenge.problems
        });
  
        if (response.success) {
          this.showChallengeResult(response.data.message, 'success');
          
          // Update UI after successful challenge
          setTimeout(async () => {
            await this.loadBlockedSites();
            this.updateUI();
            this.hideModal();
          }, 2000);
        } else {
          this.showChallengeResult(response.data.message, 'error');
        }
      } catch (error) {
        console.error('❌ Error submitting challenge:', error);
        this.showChallengeResult('Error submitting answers', 'error');
      } finally {
        this.showLoading(false);
      }
    }
  
    /**
     * Show challenge result in modal
     */
    showChallengeResult(message, type) {
      const resultContainer = document.getElementById('challengeResult');
      if (!resultContainer) return;
  
      resultContainer.innerHTML = message;
      resultContainer.className = `challenge-result ${type}`;
      resultContainer.classList.remove('hidden');
    }
  
    /**
     * Show/hide modal
     */
    hideModal() {
      const modal = document.getElementById('mathModal');
      if (modal) {
        modal.classList.add('hidden');
      }
      this.currentChallenge = null;
    }
  
    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) {
        overlay.classList.toggle('hidden', !show);
      }
    }
  
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
      // Create toast element
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #4CAF50;' : ''}
        ${type === 'error' ? 'background: #F44336;' : ''}
        ${type === 'warning' ? 'background: #FF9800;' : ''}
        ${type === 'info' ? 'background: #2196F3;' : ''}
      `;
      toast.textContent = message;
  
      document.body.appendChild(toast);
  
      // Remove after 3 seconds
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }
  
    /**
     * Send message to background script
     */
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
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const blockedSitesManager = new BlockedSitesManager();
    
    // Export for debugging
    window.blockedSitesManager = blockedSitesManager;
  });