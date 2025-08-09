/**
 * Storage utility functions for FocusTracker
 * Handles all data persistence and retrieval operations
 */

class StorageManager {
    constructor() {
      this.storageKeys = {
        TIME_DATA: 'focusTracker_timeData',
        BLOCKED_SITES: 'focusTracker_blockedSites',
        SETTINGS: 'focusTracker_settings',
        BREAK_TIMERS: 'focusTracker_breakTimers'
      };
    }
  
    /**
     * Initialize storage with default values
     */
    async initialize() {
      try {
        const timeData = await this.getTimeData();
        if (!timeData) {
          await this.setTimeData({});
        }
  
        const settings = await this.getSettings();
        if (!settings) {
          await this.setSettings({
            trackingEnabled: true,
            focusModeEnabled: false
          });
        }
  
        console.log('✅ Storage initialized successfully');
      } catch (error) {
        console.error('❌ Storage initialization failed:', error);
      }
    }
  
    /**
     * Get time tracking data
     * @returns {Promise<Object>} Time data object
     */
    async getTimeData() {
      try {
        const result = await chrome.storage.local.get([this.storageKeys.TIME_DATA]);
        return result[this.storageKeys.TIME_DATA] || {};
      } catch (error) {
        console.error('❌ Error getting time data:', error);
        return {};
      }
    }
  
    /**
     * Set time tracking data
     * @param {Object} timeData - Time data to store
     */
    async setTimeData(timeData) {
      try {
        await chrome.storage.local.set({
          [this.storageKeys.TIME_DATA]: timeData
        });
        console.log('✅ Time data saved');
      } catch (error) {
        console.error('❌ Error saving time data:', error);
      }
    }
  
    /**
     * Update time for a specific website
     * @param {string} domain - Website domain
     * @param {number} timeSpent - Time in seconds
     */
    async updateWebsiteTime(domain, timeSpent) {
      try {
        const timeData = await this.getTimeData();
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        
        // Initialize structure if it doesn't exist
        if (!timeData[today]) {
          timeData[today] = {};
        }
        
        if (!timeData[today][domain]) {
          timeData[today][domain] = {
            totalTime: 0,
            sessions: [],
            favicon: null
          };
        }
        
        // Add time to total
        timeData[today][domain].totalTime += timeSpent;
        
        // Add session data
        timeData[today][domain].sessions.push({
          timestamp: Date.now(),
          duration: timeSpent
        });
        
        await this.setTimeData(timeData);
        console.log(`⏱️  Updated ${domain}: +${timeSpent}s (Total: ${timeData[today][domain].totalTime}s)`);
      } catch (error) {
        console.error('❌ Error updating website time:', error);
      }
    }
  
    /**
     * Get today's website usage data
     * @returns {Promise<Object>} Today's usage data
     */
    async getTodayData() {
      try {
        const timeData = await this.getTimeData();
        const today = new Date().toLocaleDateString('en-CA');
        return timeData[today] || {};
      } catch (error) {
        console.error('❌ Error getting today data:', error);
        return {};
      }
    }
  
    /**
     * Get blocked websites list
     * @returns {Promise<Array>} Array of blocked domains
     */
    async getBlockedSites() {
      try {
        const result = await chrome.storage.local.get([this.storageKeys.BLOCKED_SITES]);
        return result[this.storageKeys.BLOCKED_SITES] || [];
      } catch (error) {
        console.error('❌ Error getting blocked sites:', error);
        return [];
      }
    }
  
    /**
     * Set blocked websites list
     * @param {Array} blockedSites - Array of domains to block
     */
    async setBlockedSites(blockedSites) {
      try {
        await chrome.storage.local.set({
          [this.storageKeys.BLOCKED_SITES]: blockedSites
        });
        console.log('✅ Blocked sites updated');
      } catch (error) {
        console.error('❌ Error saving blocked sites:', error);
      }
    }
  
    /**
     * Get user settings
     * @returns {Promise<Object>} Settings object
     */
    async getSettings() {
      try {
        const result = await chrome.storage.local.get([this.storageKeys.SETTINGS]);
        return result[this.storageKeys.SETTINGS];
      } catch (error) {
        console.error('❌ Error getting settings:', error);
        return null;
      }
    }
  
    /**
     * Set user settings
     * @param {Object} settings - Settings object
     */
    async setSettings(settings) {
      try {
        await chrome.storage.local.set({
          [this.storageKeys.SETTINGS]: settings
        });
        console.log('✅ Settings saved');
      } catch (error) {
        console.error('❌ Error saving settings:', error);
      }
    }
  
    /**
     * Clear all data (for debugging/reset)
     */
    async clearAllData() {
      try {
        await chrome.storage.local.clear();
        console.log('🗑️  All data cleared');
      } catch (error) {
        console.error('❌ Error clearing data:', error);
      }
    }
  
    /**
     * Get storage usage statistics
     * @returns {Promise<Object>} Storage stats
     */
    async getStorageStats() {
      try {
        const result = await chrome.storage.local.getBytesInUse();
        return {
          bytesUsed: result,
          megabytesUsed: (result / (1024 * 1024)).toFixed(2)
        };
      } catch (error) {
        console.error('❌ Error getting storage stats:', error);
        return { bytesUsed: 0, megabytesUsed: '0.00' };
      }
    }
  }
  
  // Export for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
  } else {
    window.StorageManager = StorageManager;
  }