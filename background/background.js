/**
 * Background script for Blockd
 * Handles time tracking, tab monitoring, and website blocking
 */

class WebsiteBlockingManager {
  constructor() {
    this.blockedSites = new Set();
    this.focusModeSites = new Set([
      'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
      'youtube.com', 'netflix.com', 'reddit.com', 'twitch.tv'
    ]);
    this.focusModeActive = false;
    this.focusEndTime = null;
    this.activeUnblockChallenges = new Map();
    this.activeFocusDeactivationChallenges = new Map();
    this.tempAccessSites = new Map(); // Map<domain, expiryTime>
    this.tempAccessTimers = new Map(); // Map<domain, timeoutId>
  }

  // ADDED: Grant temporary access to a domain
async grantTemporaryAccess(domain, minutes = 15) {
  try {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
    const expiryTime = Date.now() + (minutes * 60 * 1000);
    
    console.log(`🔓 Granting ${minutes} minutes of access to ${cleanDomain}`);
    
    // Store in memory
    this.tempAccessSites.set(cleanDomain, expiryTime);
    this.tempAccessSites.set('www.' + cleanDomain, expiryTime);
    
    // Store in chrome storage for persistence
    const data = await chrome.storage.local.get(['tempAccess']);
    const tempAccess = data.tempAccess || {};
    tempAccess[cleanDomain] = expiryTime;
    tempAccess['www.' + cleanDomain] = expiryTime;
    await chrome.storage.local.set({ tempAccess });
    
    // Clear any existing timer
    if (this.tempAccessTimers.has(cleanDomain)) {
      clearTimeout(this.tempAccessTimers.get(cleanDomain));
    }
    
    // Set timer to revoke access
    const timerId = setTimeout(() => {
      this.revokeTemporaryAccess(cleanDomain);
    }, minutes * 60 * 1000);
    
    this.tempAccessTimers.set(cleanDomain, timerId);
    
    // Update blocking rules to allow this domain temporarily
    await this.updateBlockingRules();
    
    // Redirect any blocker tabs to the actual site
    await this.redirectBlockerTabsToSite(cleanDomain);
    
    console.log(`✅ Successfully granted ${minutes} minutes of access to ${cleanDomain}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error granting temporary access:', error);
    throw error;
  }
}

// ADDED: Check if domain has temporary access
hasTemporaryAccess(domain) {
  const cleanDomainInput = domain.toLowerCase().replace(/^www\./, '');
  const now = Date.now();
  console.log(`[TempAccessCheck] Checking for domain: '${domain}' (cleaned to '${cleanDomainInput}'). Current tempAccessSites:`, JSON.stringify(Array.from(this.tempAccessSites.entries())));
  
  const accessTime = this.tempAccessSites.get(cleanDomainInput) || this.tempAccessSites.get('www.' + cleanDomainInput);
  
  if (accessTime && now < accessTime) {
    console.log(`[TempAccessCheck] SUCCESS: Found active temporary access for '${domain}'. Expiry: ${new Date(accessTime).toISOString()}`);
    return true;
  }
  console.log(`[TempAccessCheck] FAIL: No active temporary access for '${domain}'.`);
  return false;
}

// ADDED: Redirect blocker tabs to actual site
async redirectBlockerTabsToSite(domain) {
  try {
    const tabs = await chrome.tabs.query({});
    const blockerUrlPattern = chrome.runtime.getURL('blocked-redirect.html');
    
    for (const tab of tabs) {
      if (tab.url && tab.url.startsWith(blockerUrlPattern)) {
        const urlParams = new URLSearchParams(tab.url.split('?')[1]);
        const blockedSite = urlParams.get('site');
        
        if (blockedSite && (blockedSite === domain || blockedSite === 'www.' + domain)) {
          console.log(`🔓 Redirecting blocker tab ${tab.id} to: ${domain}`);
          await chrome.tabs.update(tab.id, { url: `https://${domain}` });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error redirecting blocker tabs:', error);
  }
}

// ADDED: Revoke temporary access
async revokeTemporaryAccess(domain) {
  try {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
    console.log(`⏰ Revoking temporary access for: ${cleanDomain}`);
    
    // Remove from memory
    this.tempAccessSites.delete(cleanDomain);
    this.tempAccessSites.delete('www.' + cleanDomain);
    
    // Clear timer
    if (this.tempAccessTimers.has(cleanDomain)) {
      clearTimeout(this.tempAccessTimers.get(cleanDomain));
      this.tempAccessTimers.delete(cleanDomain);
    }
    
    // Remove from storage
    const data = await chrome.storage.local.get(['tempAccess']);
    const tempAccess = data.tempAccess || {};
    delete tempAccess[cleanDomain];
    delete tempAccess['www.' + cleanDomain];
    await chrome.storage.local.set({ tempAccess });
    
    // Update blocking rules
    await this.updateBlockingRules();
    
  } catch (error) {
    console.error('❌ Error revoking temporary access:', error);
  }
}

// ADDED: Extend temporary access
async extendTemporaryAccess(domain, additionalMinutes = 5) {
  try {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
    const now = Date.now();
    
    console.log(`🔄 Extending temporary access for ${cleanDomain} by ${additionalMinutes} minutes`);
    
    // Check if domain currently has temporary access
    const currentExpiry = this.tempAccessSites.get(cleanDomain) || this.tempAccessSites.get('www.' + cleanDomain);
    
    if (!currentExpiry || now >= currentExpiry) {
      console.log(`❌ Cannot extend: ${cleanDomain} does not have active temporary access`);
      return { success: false, error: 'No active temporary access to extend' };
    }
    
    // Extend the expiry time
    const newExpiry = currentExpiry + (additionalMinutes * 60 * 1000);
    
    // Update in memory
    this.tempAccessSites.set(cleanDomain, newExpiry);
    this.tempAccessSites.set('www.' + cleanDomain, newExpiry);
    
    // Update in storage
    const data = await chrome.storage.local.get(['tempAccess']);
    const tempAccess = data.tempAccess || {};
    tempAccess[cleanDomain] = newExpiry;
    tempAccess['www.' + cleanDomain] = newExpiry;
    await chrome.storage.local.set({ tempAccess });
    
    // Clear existing timer and set new one
    if (this.tempAccessTimers.has(cleanDomain)) {
      clearTimeout(this.tempAccessTimers.get(cleanDomain));
    }
    
    const remainingTime = newExpiry - now;
    const timerId = setTimeout(() => {
      this.revokeTemporaryAccess(cleanDomain);
    }, remainingTime);
    
    this.tempAccessTimers.set(cleanDomain, timerId);
    
    console.log(`✅ Extended temporary access for ${cleanDomain}. New expiry: ${new Date(newExpiry).toISOString()}`);
    
    return { 
      success: true, 
      message: `Extended access for ${cleanDomain} by ${additionalMinutes} minutes`,
      newExpiry: newExpiry
    };
    
  } catch (error) {
    console.error('❌ Error extending temporary access:', error);
    return { success: false, error: error.message };
  }
}


  async initialize() {
    try {
      // Load blocked sites from storage
      const result = await chrome.storage.local.get(['blockedSites', 'focusModeStatus', 'tempAccess']);
      
      if (result.blockedSites) {
        this.blockedSites = new Set(result.blockedSites);
      }
      
      if (result.focusModeStatus) {
        this.focusModeActive = result.focusModeStatus.active || false;
        this.focusEndTime = result.focusModeStatus.endTime || null;
        
        // Check if focus mode should still be active
        if (this.focusModeActive && this.focusEndTime) {
          if (Date.now() > this.focusEndTime) {
            await this.deactivateFocusMode();
          }
        }
      }

      // ADDED: Load temporary access from storage
      if (result.tempAccess) {
        const now = Date.now();
        const cleanedTempAccess = {};
        
        for (const [domain, expiry] of Object.entries(result.tempAccess)) {
          if (now < expiry) {
            // Still valid - keep it
            this.tempAccessSites.set(domain, expiry);
            cleanedTempAccess[domain] = expiry;
            
            // Set timer to revoke access when it expires
            const remaining = expiry - now;
            const cleanDomain = domain.replace(/^www\./, '');
            const timerId = setTimeout(() => {
              this.revokeTemporaryAccess(cleanDomain);
            }, remaining);
            this.tempAccessTimers.set(cleanDomain, timerId);
            
            console.log(`⏱️ Restored temporary access for ${domain} (${Math.floor(remaining/1000)}s remaining)`);
          } else {
            console.log(`🗑️ Removing expired temporary access for ${domain}`);
          }
        }
        
        // Update storage to remove expired entries
        if (Object.keys(cleanedTempAccess).length !== Object.keys(result.tempAccess).length) {
          await chrome.storage.local.set({ tempAccess: cleanedTempAccess });
          console.log('🧹 Cleaned up expired temporary access entries');
        }
      }

      // Set up declarative net request rules
      await this.updateBlockingRules();
      
      console.log('🚫 Website blocking manager initialized');
    } catch (error) {
      console.error('❌ Error initializing blocking manager:', error);
    }
  }

  async blockWebsite(domain) {
    try {
      this.blockedSites.add(domain);
      await this.saveBlockedSites();
      await this.updateBlockingRules();
      
      console.log(`🚫 Blocked website: ${domain}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error blocking website:', error);
      return { success: false, error: error.message };
    }
  }

  async unblockWebsite(domain) {
    try {
      this.blockedSites.delete(domain);
      await this.saveBlockedSites();
      await this.updateBlockingRules();
      
      console.log(`✅ Unblocked website: ${domain}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error unblocking website:', error);
      return { success: false, error: error.message };
    }
  }

  async removeSite(domain) {
    return await this.unblockWebsite(domain);
  }

  generateMathChallenge(numProblems = 3) {
    const problems = [];
    
    for (let i = 0; i < numProblems; i++) {
      const num1 = Math.floor(Math.random() * 50) + 10;
      const num2 = Math.floor(Math.random() * 30) + 5;
      const operation = Math.random() > 0.5 ? '+' : '-';
      
      let question, answer;
      if (operation === '+') {
        question = `${num1} + ${num2}`;
        answer = num1 + num2;
      } else {
        question = `${num1} - ${num2}`;
        answer = num1 - num2;
      }
      
      problems.push({ question, answer });
    }
    
    return problems;
  }

  async startUnblockChallenge(domain) {
    try {
      const challengeId = Date.now().toString();
      const problems = this.generateMathChallenge(2);
      
      this.activeUnblockChallenges.set(challengeId, {
        domain,
        problems,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        data: {
          challengeId,
          problems,
          domain
        }
      };
    } catch (error) {
      console.error('❌ Error starting unblock challenge:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start focus deactivation challenge (math required to turn OFF focus mode)
   */
  async startFocusDeactivationChallenge() {
    try {
      const challengeId = Date.now().toString();
      const problems = this.generateMathChallenge(3); // 3 problems to turn off focus
      
      this.activeFocusDeactivationChallenges.set(challengeId, {
        problems,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        data: {
          challengeId,
          problems
        }
      };
    } catch (error) {
      console.error('❌ Error starting focus deactivation challenge:', error);
      return { success: false, error: error.message };
    }
  }

  async submitMathChallenge(challengeId, answers, problems) {
    try {
      // Check unblock challenges first
      if (this.activeUnblockChallenges.has(challengeId)) {
        const challenge = this.activeUnblockChallenges.get(challengeId);
        const isCorrect = this.validateAnswers(answers, challenge.problems);
        
        if (isCorrect) {
          await this.grantTemporaryAccess(challenge.domain);
          this.activeUnblockChallenges.delete(challengeId);
          
          return {
            success: true,
            data: {
              message: `${challenge.domain} has been unblocked!`,
              type: 'unblock'
            }
          };
        } else {
          return {
            success: false,
            data: {
              message: 'Incorrect answers. Please try again.',
              type: 'unblock'
            }
          };
        }
      }
      
      return {
        success: false,
        data: {
          message: 'Challenge not found or expired.',
          type: 'error'
        }
      };
      
    } catch (error) {
      console.error('❌ Error submitting challenge:', error);
      return {
        success: false,
        data: {
          message: 'Error processing challenge.',
          type: 'error'
        }
      };
    }
  }

  /**
   * Submit focus deactivation challenge
   */
  async submitFocusDeactivationChallenge(challengeId, answers, problems) {
    try {
      if (!this.activeFocusDeactivationChallenges.has(challengeId)) {
        return {
          success: false,
          data: {
            message: 'Challenge not found or expired.',
            type: 'error'
          }
        };
      }

      const challenge = this.activeFocusDeactivationChallenges.get(challengeId);
      const isCorrect = this.validateAnswers(answers, challenge.problems);
      
      if (isCorrect) {
        await this.deactivateFocusMode();
        this.activeFocusDeactivationChallenges.delete(challengeId);
        
        return {
          success: true,
          data: {
            message: 'Focus mode deactivated successfully!',
            type: 'deactivation'
          }
        };
      } else {
        return {
          success: false,
          data: {
            message: 'Incorrect answers. Focus mode remains active.',
            type: 'deactivation'
          }
        };
      }
    } catch (error) {
      console.error('❌ Error submitting focus deactivation challenge:', error);
      return {
        success: false,
        data: {
          message: 'Error processing challenge.',
          type: 'error'
        }
      };
    }
  }

  validateAnswers(userAnswers, problems) {
    if (userAnswers.length !== problems.length) {
      return false;
    }
    
    for (let i = 0; i < problems.length; i++) {
      const userAnswer = parseInt(userAnswers[i]);
      const correctAnswer = problems[i].answer;
      
      if (userAnswer !== correctAnswer) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Activate focus mode immediately (no math required)
   */
  async activateFocusMode(durationMinutes = 30) {
    try {
      this.focusModeActive = true;
      this.focusEndTime = Date.now() + (durationMinutes * 60 * 1000);
      
      await this.saveFocusModeStatus();
      await this.updateBlockingRules();
      
      // Set timeout to auto-deactivate
      setTimeout(() => {
        this.deactivateFocusMode();
      }, durationMinutes * 60 * 1000);
      
      console.log(`🎯 Focus mode activated for ${durationMinutes} minutes`);
      return { success: true, message: `Focus mode activated for ${durationMinutes} minutes!` };
    } catch (error) {
      console.error('❌ Error activating focus mode:', error);
      return { success: false, error: error.message };
    }
  }

  async deactivateFocusMode() {
    try {
      this.focusModeActive = false;
      this.focusEndTime = null;
      
      await this.saveFocusModeStatus();
      await this.updateBlockingRules();
      
      console.log('🎯 Focus mode deactivated');
      return { success: true, message: 'Focus mode deactivated!' };
    } catch (error) {
      console.error('❌ Error deactivating focus mode:', error);
      return { success: false, error: error.message };
    }
  }

  getBlockingStats() {
    const remainingTime = this.focusModeActive && this.focusEndTime 
      ? Math.max(0, this.focusEndTime - Date.now())
      : 0;
      
    return {
      individuallyBlockedSites: Array.from(this.blockedSites),
      focusModeSites: Array.from(this.focusModeSites),
      focusModeStatus: {
        active: this.focusModeActive,
        endTime: this.focusEndTime,
        remainingTime: remainingTime
      }
    };
  }

  async saveBlockedSites() {
    try {
      await chrome.storage.local.set({
        blockedSites: Array.from(this.blockedSites)
      });
    } catch (error) {
      console.error('❌ Error saving blocked sites:', error);
    }
  }

  async saveFocusModeStatus() {
    try {
      await chrome.storage.local.set({
        focusModeStatus: {
          active: this.focusModeActive,
          endTime: this.focusEndTime
        }
      });
    } catch (error) {
      console.error('❌ Error saving focus mode status:', error);
    }
  }

  async updateBlockingRules() {
    try {
      // Get current rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map(rule => rule.id);
      
      // Remove old rules
      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds
        });
      }
      
      // Create new rules
      const newRules = [];
      let ruleId = 1;
      
      // Block individually blocked sites
      for (const domain of this.blockedSites) {
        console.log(`[UpdateRules] Processing blockedSite: '${domain}'`);
        // ADDED: Check for temporary access before blocking
        if (this.hasTemporaryAccess(domain)) {
          console.log(`[UpdateRules] SKIPPING rule for ${domain} due to temporary access`);
          continue;
        }
        
        console.log(`[UpdateRules] ADDING rule for blockedSite: '${domain}'`);
        newRules.push({
          id: ruleId++,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              url: chrome.runtime.getURL("blocked-redirect.html") + "?site=" + encodeURIComponent(domain)
            }
          },
          condition: {
            urlFilter: `*://*.${domain}/*`,
            resourceTypes: ["main_frame"]
          }
        });
      }
      
      // Block focus mode sites if active
      if (this.focusModeActive) {
        for (const domain of this.focusModeSites) {
          console.log(`[UpdateRules] Processing focusModeSite: '${domain}'`);
          // ADDED: Check for temporary access before blocking
          if (this.hasTemporaryAccess(domain)) {
            console.log(`[UpdateRules] SKIPPING focus mode rule for ${domain} due to temporary access`);
            continue;
          }

          console.log(`[UpdateRules] ADDING rule for focusModeSite: '${domain}'`);
          newRules.push({
            id: ruleId++,
            priority: 2,
            action: {
              type: "redirect",
              redirect: {
                url: chrome.runtime.getURL("blocked-redirect.html") + "?site=" + encodeURIComponent(domain) + "&focus=true"
              }
            },
            condition: {
              urlFilter: `*://*.${domain}/*`,
              resourceTypes: ["main_frame"]
            }
          });
        }
      }
      
      // Add new rules
      if (newRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: newRules
        });
      }
      
      console.log(`🔄 Updated blocking rules: ${newRules.length} active`);
    } catch (error) {
      console.error('❌ Error updating blocking rules:', error);
    }
  }
}

class StorageManager {
  constructor() {
    this.storageKeys = {
      TIME_DATA: 'focusTracker_timeData',
      BLOCKED_SITES: 'focusTracker_blockedSites',
      SETTINGS: 'focusTracker_settings',
      BREAK_TIMERS: 'focusTracker_breakTimers'
    };
  }

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

      // Clean up old data (older than 30 days)
      await this.cleanupOldData();

      console.log('✅ Storage initialized successfully');
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
    }
  }

  async getTimeData() {
    try {
      const result = await chrome.storage.local.get([this.storageKeys.TIME_DATA]);
      return result[this.storageKeys.TIME_DATA] || {};
    } catch (error) {
      console.error('❌ Error getting time data:', error);
      return {};
    }
  }

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

  async updateWebsiteTime(domain, timeSpent, isNewSession = false) {
    try {
      const timeData = await this.getTimeData();
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
      
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
      
      timeData[today][domain].totalTime += timeSpent;
      
      // Only create a new session entry if this is actually a new session
      if (isNewSession) {
      timeData[today][domain].sessions.push({
        timestamp: Date.now(),
        duration: timeSpent
      });
        console.log(`📍 New session started for ${domain}`);
      } else {
        // Update the current session's duration
        const sessions = timeData[today][domain].sessions;
        if (sessions.length > 0) {
          sessions[sessions.length - 1].duration += timeSpent;
        } else {
          // Fallback: create a session if none exist
          sessions.push({
            timestamp: Date.now(),
            duration: timeSpent
          });
        }
      }
      
      await this.setTimeData(timeData);
      console.log(`⏱️  Updated ${domain}: +${timeSpent}s (Total: ${timeData[today][domain].totalTime}s, Sessions: ${timeData[today][domain].sessions.length})`);
    } catch (error) {
      console.error('❌ Error updating website time:', error);
    }
  }

  async getTodayData() {
    try {
      const timeData = await this.getTimeData();
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
      return timeData[today] || {};
    } catch (error) {
      console.error('❌ Error getting today data:', error);
      return {};
    }
  }

  async cleanupOldData() {
    try {
      const timeData = await this.getTimeData();
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const cutoffDate = thirtyDaysAgo.toLocaleDateString('en-CA');
      
      let cleaned = false;
      for (const date in timeData) {
        if (date < cutoffDate) {
          delete timeData[date];
          cleaned = true;
        }
      }
      
      if (cleaned) {
        await this.setTimeData(timeData);
        console.log('🧹 Cleaned up old tracking data older than 30 days');
      }
    } catch (error) {
      console.error('❌ Error cleaning up old data:', error);
    }
  }

  async clearAllData() {
    try {
      await chrome.storage.local.clear();
      console.log('🗑️  All data cleared');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
    }
  }
}

class TimeTracker {
  constructor() {
    this.currentDomain = null;
    this.sessionStartTime = null;
    this.isTracking = false;
    this.isNewSession = false; // Track if current session is new
    this.storageManager = new StorageManager();
    
    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
  }

  async initialize() {
    try {
      await this.storageManager.initialize();
      
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url) {
          console.log(`🎯 Found active tab on startup: ${activeTab.url}`);
          await this.startTracking(activeTab.url);
        }
      } catch (error) {
        console.warn('⚠️  Could not get active tab on startup:', error);
      }
      
      console.log('⏱️  TimeTracker initialized');
    } catch (error) {
      console.error('❌ TimeTracker initialization failed:', error);
    }
  }

  extractDomain(url) {
    try {
      if (!url) return null;
      
      if (url.startsWith('chrome://') || 
          url.startsWith('chrome-extension://') || 
          url.startsWith('edge://') || 
          url.startsWith('about:')) {
        return null;
      }
      
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      
      console.log(`🌐 Extracted domain: ${domain} from ${url}`);
      return domain;
    } catch (error) {
      console.warn('⚠️  Invalid URL:', url, error);
      return null;
    }
  }

  async startTracking(url) {
    const domain = this.extractDomain(url);
    
    // Check if this is a new session (different domain)
    const isNewSession = domain && domain !== this.currentDomain;
    
    await this.stopTracking();
    
    if (domain) {
      this.currentDomain = domain;
      this.sessionStartTime = Date.now();
      this.isTracking = true;
      this.isNewSession = isNewSession; // Track if this is a new session
      
      console.log(`🟢 Started tracking: ${domain} at ${new Date().toLocaleTimeString()}${isNewSession ? ' (NEW SESSION)' : ' (CONTINUING)'}`);
    } else {
      console.log(`⏭️  Skipping tracking for: ${url}`);
    }
  }

  async stopTracking() {
    if (this.isTracking && this.currentDomain && this.sessionStartTime) {
      const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      
      if (sessionDuration > 0) {
        // Pass isNewSession flag to updateWebsiteTime
        await this.storageManager.updateWebsiteTime(this.currentDomain, sessionDuration, this.isNewSession || false);
        console.log(`🔴 Stopped tracking: ${this.currentDomain} (${sessionDuration}s)${this.isNewSession ? ' - Session recorded' : ' - Time added to current session'}`);
      }
    }
    
    this.currentDomain = null;
    this.sessionStartTime = null;
    this.isTracking = false;
    this.isNewSession = false;
  }

  async handleTabChange(tabId, changeInfo, tab) {
    if (changeInfo.url && tab.active) {
      this.startTracking(changeInfo.url);
    }
  }

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

  handleWindowFocus() {
    if (this.currentDomain && !this.isTracking) {
      this.sessionStartTime = Date.now();
      this.isTracking = true;
      console.log(`🟢 Resumed tracking: ${this.currentDomain}`);
    }
  }

  async handleWindowBlur() {
    if (!this.isInitialized) return;
    
    try {
      console.log('👁️ Window blurred - saving current session');
      if (this.timeTracker.isTracking && this.timeTracker.currentDomain && this.timeTracker.sessionStartTime) {
        const sessionDuration = Math.floor((Date.now() - this.timeTracker.sessionStartTime) / 1000);
        
        if (sessionDuration > 1) {
          // Don't create new session on blur, just save current progress
          await this.timeTracker.storageManager.updateWebsiteTime(this.timeTracker.currentDomain, sessionDuration, false);
          console.log(`💾 Saved session on blur: ${this.timeTracker.currentDomain} (${sessionDuration}s)`);
          
          this.timeTracker.sessionStartTime = Date.now();
        }
      }
    } catch (error) {
      console.error('❌ Error handling window blur:', error);
    }
  }

  getCurrentStatus() {
    const currentSessionDuration = this.isTracking && this.sessionStartTime 
      ? Math.floor((Date.now() - this.sessionStartTime) / 1000)
      : 0;
      
    return {
      isTracking: this.isTracking,
      currentDomain: this.currentDomain,
      sessionDuration: currentSessionDuration,
      sessionStartTime: this.sessionStartTime
    };
  }

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
      
      return websites
        .sort((a, b) => b.time - a.time)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting top websites:', error);
      return [];
    }
  }
}

class BackgroundService {
  constructor() {
    this.timeTracker = new TimeTracker();
    this.blockingManager = new WebsiteBlockingManager();
    this.isInitialized = false;
    
    this.handleTabUpdate = this.handleTabUpdate.bind(this);
    this.handleTabActivation = this.handleTabActivation.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
    this.handleExtensionStartup = this.handleExtensionStartup.bind(this);
  }

  async initialize() {
    try {
      console.log('🚀 Blockd Background Service starting...');
      
      await this.timeTracker.initialize();
      await this.blockingManager.initialize();
      
      this.setupEventListeners();
      this.startPeriodicSave();
      
      this.isInitialized = true;
      console.log('✅ Background service initialized successfully');
      
    } catch (error) {
      console.error('❌ Background service initialization failed:', error);
    }
  }

  startPeriodicSave() {
    this.saveInterval = setInterval(async () => {
      if (this.timeTracker.isTracking && this.timeTracker.currentDomain && this.timeTracker.sessionStartTime) {
        const sessionDuration = Math.floor((Date.now() - this.timeTracker.sessionStartTime) / 1000);
        
        if (sessionDuration > 5) {
          console.log(`💾 Periodic save: ${this.timeTracker.currentDomain} (${sessionDuration}s)`);
          // Don't create a new session during periodic save (isNewSession = false)
          await this.timeTracker.storageManager.updateWebsiteTime(this.timeTracker.currentDomain, sessionDuration, false);
          
          this.timeTracker.sessionStartTime = Date.now();
        }
      }
    }, 30000);
    
    console.log('💾 Periodic save started (30s interval)');
  }

  setupEventListeners() {
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate);
    chrome.tabs.onActivated.addListener(this.handleTabActivation);
    
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        this.handleWindowBlur();
      } else {
        this.handleWindowFocus();
      }
    });
    
    chrome.runtime.onStartup.addListener(this.handleExtensionStartup);
    chrome.runtime.onInstalled.addListener(this.handleExtensionStartup);
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    console.log('🔗 Event listeners registered');
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    if (!this.isInitialized) return;
    
    try {
      if (changeInfo.url && tab.active) {
        console.log(`🔄 Tab URL changed: ${changeInfo.url}`);
        await this.timeTracker.handleTabChange(tabId, changeInfo, tab);
      }
      
      if (changeInfo.status === 'complete' && tab.active && tab.url) {
        console.log(`✅ Tab loaded: ${tab.url}`);
        await this.timeTracker.startTracking(tab.url);
      }
      
      if (changeInfo.title && tab.active && tab.url) {
        console.log(`📝 Tab title changed: ${changeInfo.title} on ${tab.url}`);
        await this.timeTracker.startTracking(tab.url);
      }
    } catch (error) {
      console.error('❌ Error handling tab update:', error);
    }
  }

  async handleTabActivation(activeInfo) {
    if (!this.isInitialized) return;
    
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      console.log(`🎯 Tab activated: ${tab.url}`);
      if (tab.url) {
        this.timeTracker.startTracking(tab.url);
      }
    } catch (error) {
      console.warn('⚠️  Could not get tab info:', error);
    }
  }

  async handleWindowFocus() {
    if (!this.isInitialized) return;
    
    try {
      console.log('🔍 Window focused - resuming tracking');
      
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.url) {
        await this.timeTracker.startTracking(activeTab.url);
      }
    } catch (error) {
      console.error('❌ Error handling window focus:', error);
    }
  }

  async handleWindowBlur() {
    if (!this.isInitialized) return;
    
    try {
      console.log('👁️ Window blurred - saving current session');
      if (this.timeTracker.isTracking && this.timeTracker.currentDomain && this.timeTracker.sessionStartTime) {
        const sessionDuration = Math.floor((Date.now() - this.timeTracker.sessionStartTime) / 1000);
        
        if (sessionDuration > 1) {
          // Don't create new session on blur, just save current progress
          await this.timeTracker.storageManager.updateWebsiteTime(this.timeTracker.currentDomain, sessionDuration, false);
          console.log(`💾 Saved session on blur: ${this.timeTracker.currentDomain} (${sessionDuration}s)`);
          
          this.timeTracker.sessionStartTime = Date.now();
        }
      }
    } catch (error) {
      console.error('❌ Error handling window blur:', error);
    }
  }

  async handleExtensionStartup() {
    console.log('🔄 Extension startup detected');
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  handleMessage(request, sender, sendResponse) {
    console.log('📨 Received message:', request.action);
    
    try {
      switch (request.action) {
        // Time tracking messages
        case 'PING':
          sendResponse({ success: true, message: 'Background script is running' });
          return false;
          
        case 'GET_CURRENT_STATUS':
          const status = this.timeTracker.getCurrentStatus();
          sendResponse({ success: true, data: status });
          return false;
          
        case 'GET_TODAY_DATA':
          this.timeTracker.storageManager.getTodayData()
            .then(todayData => {
              sendResponse({ success: true, data: todayData });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
          return true;
          
        case 'GET_TOP_WEBSITES':
          this.timeTracker.getTopWebsites(request.limit || 5)
            .then(topWebsites => {
              sendResponse({ success: true, data: topWebsites });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
          return true;
          
        case 'GET_TODAY_TOTAL':
          this.timeTracker.getTodayTotal()
            .then(todayTotal => {
              const currentStatus = this.timeTracker.getCurrentStatus();
              const totalWithCurrent = todayTotal + (currentStatus.sessionDuration || 0);
              sendResponse({ success: true, data: totalWithCurrent });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
          return true;
          
        case 'GET_LIVE_SESSION':
          const liveSession = this.timeTracker.getCurrentStatus();
          sendResponse({ success: true, data: liveSession });
          return false;
          
        case 'FORCE_SAVE':
          this.timeTracker.stopTracking()
            .then(() => {
              sendResponse({ success: true, message: 'Data saved' });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
          return true;
          
        case 'CLEAR_DATA':
          this.timeTracker.storageManager.clearAllData()
            .then(() => {
              sendResponse({ success: true, message: 'All data cleared' });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
          return true;

        // Blocking messages
        case 'GET_BLOCKING_STATS':
          const stats = this.blockingManager.getBlockingStats();
          sendResponse({ success: true, data: stats });
          return false;

        case 'BLOCK_WEBSITE':
          this.blockingManager.blockWebsite(request.domain)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'REMOVE_BLOCKED_SITE':
          this.blockingManager.removeSite(request.domain)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'START_UNBLOCK_CHALLENGE':
          this.blockingManager.startUnblockChallenge(request.domain)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'SUBMIT_MATH_CHALLENGE':
          this.blockingManager.submitMathChallenge(request.challengeId, request.answers, request.problems)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        // NEW FOCUS MODE HANDLERS
        case 'ACTIVATE_FOCUS_MODE':
          // Direct activation without math challenge
          this.blockingManager.activateFocusMode(request.duration || 30)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'START_FOCUS_DEACTIVATION_CHALLENGE':
          // Create math challenge for turning OFF focus mode
          this.blockingManager.startFocusDeactivationChallenge()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'SUBMIT_FOCUS_DEACTIVATION_CHALLENGE':
          // Submit answers for deactivation challenge
          this.blockingManager.submitFocusDeactivationChallenge(
            request.challengeId, 
            request.answers, 
            request.problems
          )
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'grantTempAccess':
          this.blockingManager.grantTemporaryAccess(request.site, request.minutes)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'EXTEND_TEMP_ACCESS':
          this.blockingManager.extendTemporaryAccess(request.site, request.minutes)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;

        case 'DEACTIVATE_FOCUS_MODE':
          this.blockingManager.deactivateFocusMode()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;
          
        case 'DEBUG_STATUS':
          const debugInfo = {
            isInitialized: this.isInitialized,
            currentStatus: this.timeTracker.getCurrentStatus(),
            blockingStats: this.blockingManager.getBlockingStats(),
            timestamp: new Date().toISOString()
          };
          console.log('🐛 Debug status:', debugInfo);
          sendResponse({ success: true, data: debugInfo });
          return false;
          
        default:
          console.warn('⚠️  Unknown message action:', request.action);
          sendResponse({ success: false, error: 'Unknown action' });
          return false;
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
      return false;
    }
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Start initialization when script loads
backgroundService.initialize().catch(error => {
  console.error('💥 Critical error in background service:', error);
});

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('🔧 Extension installed/updated');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🔧 Extension startup');
});

// Periodic keep-alive (every 25 seconds)
setInterval(() => {
  console.log('💓 Service worker heartbeat');
}, 25000);

// Export for debugging
self.backgroundService = backgroundService;