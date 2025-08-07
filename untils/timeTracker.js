/**
 * Time tracking utility for FocusTracker
 * Handles active tab monitoring and time calculation
 */

class TimeTracker {
    constructor() {
      this.currentDomain = null;
      this.sessionStartTime = null;
      this.isTracking = false;
      this.storageManager = new StorageManager();
      
      // Bind methods to maintain context
      this.handleTabChange = this.handleTabChange.bind(this);
      this.handleWindowFocus = this.handleWindowFocus.bind(this);
      this.handleWindowBlur = this.handleWindowBlur.bind(this);
    }
  
    /**
     * Initialize time tracking
     */
    async initialize() {
      try {
        await this.storageManager.initialize();
        
        // Get current active tab and start tracking
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
          this.startTracking(activeTab.url);
        }
        
        console.log('⏱️  TimeTracker initialized');
      } catch (error) {
        console.error('❌ TimeTracker initialization failed:', error);
      }
    }
  
    /**
     * Extract domain from URL
     * @param {string} url - Full URL
     * @returns {string} Domain name
     */
    extractDomain(url) {
      try {
        if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
          return null;
        }
        
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
      } catch (error) {
        console.warn('⚠️  Invalid URL:', url);
        return null;
      }
    }
  
    /**
     * Start tracking time for a domain
     * @param {string} url - Current tab URL
     */
    startTracking(url) {
      const domain = this.extractDomain(url);
      
      // Stop current tracking session
      this.stopTracking();
      
      if (domain) {
        this.currentDomain = domain;
        this.sessionStartTime = Date.now();
        this.isTracking = true;
        
        console.log(`🟢 Started tracking: ${domain}`);
      }
    }
  
    /**
     * Stop current tracking session and save data
     */
    async stopTracking() {
      if (this.isTracking && this.currentDomain && this.sessionStartTime) {
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        
        // Only save if session was longer than 1 second
        if (sessionDuration > 1) {
          await this.storageManager.updateWebsiteTime(this.currentDomain, sessionDuration);
          console.log(`🔴 Stopped tracking: ${this.currentDomain} (${sessionDuration}s)`);
        }
      }
      
      this.currentDomain = null;
      this.sessionStartTime = null;
      this.isTracking = false;
    }
  
    /**
     * Handle tab change events
     * @param {number} tabId - Changed tab ID
     * @param {Object} changeInfo - Change information
     * @param {Object} tab - Tab object
     */
    async handleTabChange(tabId, changeInfo, tab) {
      // Only process if URL changed and tab is active
      if (changeInfo.url && tab.active) {
        this.startTracking(changeInfo.url);
      }
    }
  
    /**
     * Handle tab activation (switching between tabs)
     * @param {Object} activeInfo - Active tab info
     */
    async handleTabActivation(activeInfo) {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url) {
          this.startTracking(tab.url);
        }
      } catch (error) {
        console.warn('⚠️  Could not get tab info:', error);
      }
    }
  
    /**
     * Handle window focus events
     */
    handleWindowFocus() {
      // Resume tracking when window gets focus
      if (this.currentDomain && !this.isTracking) {
        this.sessionStartTime = Date.now();
        this.isTracking = true;
        console.log(`🟢 Resumed tracking: ${this.currentDomain}`);
      }
    }
  
    /**
     * Handle window blur events
     */
    async handleWindowBlur() {
      // Pause tracking when window loses focus
      if (this.isTracking) {
        await this.stopTracking();
        console.log('⏸️  Paused tracking (window blur)');
      }
    }
  
    /**
     * Get current tracking status
     * @returns {Object} Current tracking info
     */
    getCurrentStatus() {
      return {
        isTracking: this.isTracking,
        currentDomain: this.currentDomain,
        sessionDuration: this.isTracking && this.sessionStartTime 
          ? Math.floor((Date.now() - this.sessionStartTime) / 1000)
          : 0
      };
    }
  
    /**
     * Format time duration for display
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
      if (seconds < 60) {
        return `${seconds}s`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    }
  
    /**
     * Get today's total tracking time
     * @returns {Promise<number>} Total seconds tracked today
     */
    async getTodayTotal() {
      try {
        const todayData = await this.storageManager.getTodayData();
        let total = 0;
        
        for (const domain in todayData) {
          total += todayData[domain].totalTime || 0;
        }
        
        return total;
      } catch (error) {
        console.error('❌ Error getting today total:', error);
        return 0;
      }
    }
  
    /**
     * Get top websites for today
     * @param {number} limit - Number of top sites to return
     * @returns {Promise<Array>} Array of top websites
     */
    async getTopWebsites(limit = 5) {
      try {
        const todayData = await this.storageManager.getTodayData();
        const websites = [];
        
        for (const domain in todayData) {
          websites.push({
            domain,
            time: todayData[domain].totalTime || 0,
            sessions: todayData[domain].sessions?.length || 0
          });
        }
        
        // Sort by time spent (descending) and limit results
        return websites
          .sort((a, b) => b.time - a.time)
          .slice(0, limit);
      } catch (error) {
        console.error('❌ Error getting top websites:', error);
        return [];
      }
    }
  }
  
  // Export for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeTracker;
  } else {
    window.TimeTracker = TimeTracker;
  }