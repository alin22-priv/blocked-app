/**
 * Blocking Content Script for Blockd
 * Detects blocked sites and redirects to zen blocking page
 */

class BlockingContentScript {
    constructor() {
      this.currentDomain = this.extractDomain(window.location.href);
      this.isBlocked = false;
      this.checkInterval = null;
      
      this.initialize();
    }
  
    /**
     * Initialize blocking detection
     */
    async initialize() {
      try {
        // Don't run on extension pages
        if (this.isExtensionPage()) {
          return;
        }
  
        console.log('🔒 Blocking content script loaded for:', this.currentDomain);
        
        // Check if current site should be blocked
        await this.checkIfBlocked();
        
        // Set up periodic checks (every 5 seconds)
        this.startPeriodicCheck();
        
        // Listen for blocking status changes
        this.setupMessageListener();
        
      } catch (error) {
        console.error('❌ Error initializing blocking content script:', error);
      }
    }
  
    /**
     * Extract domain from URL
     */
    extractDomain(url) {
      try {
        if (!url) return null;
        
        // Skip chrome internal pages
        if (url.startsWith('chrome://') || 
            url.startsWith('chrome-extension://') || 
            url.startsWith('edge://') || 
            url.startsWith('about:')) {
          return null;
        }
        
        const urlObj = new URL(url);
        let domain = urlObj.hostname;
        
        // Remove www. prefix
        if (domain.startsWith('www.')) {
          domain = domain.substring(4);
        }
        
        return domain;
      } catch (error) {
        console.warn('⚠️  Invalid URL:', url);
        return null;
      }
    }
  
    /**
     * Check if current URL is an extension page
     */
    isExtensionPage() {
      const url = window.location.href;
      return url.startsWith('chrome-extension://') || 
             url.startsWith('moz-extension://') ||
             url.includes('blocked.html');
    }
  
    /**
     * Check if current site should be blocked
     */
    async checkIfBlocked() {
      if (!this.currentDomain) return;
  
      try {
        const response = await this.sendMessage({
          action: 'CHECK_IF_BLOCKED',
          domain: this.currentDomain
        });
  
        if (response.success && response.data.isBlocked) {
          this.blockSite(response.data);
        }
      } catch (error) {
        console.error('❌ Error checking if blocked:', error);
      }
    }
  
    /**
     * Block the current site by redirecting to zen page
     */
    blockSite(blockData) {
      if (this.isBlocked) return; // Prevent multiple redirections
      
      this.isBlocked = true;
      
      // Create parameters for the blocking page
      const params = new URLSearchParams({
        site: this.currentDomain,
        type: blockData.type || 'individual', // 'individual' or 'focus'
        time: new Date().toLocaleTimeString(),
        original: window.location.href
      });
  
      // Get the extension URL for the blocking page
      const blockingPageUrl = chrome.runtime.getURL(`blocked/blocked.html?${params.toString()}`);
      
      console.log('🚫 Redirecting to blocking page:', blockingPageUrl);
      
      // Redirect to blocking page
      window.location.replace(blockingPageUrl);
    }
  
    /**
     * Start periodic checking for blocking status
     */
    startPeriodicCheck() {
      this.checkInterval = setInterval(() => {
        if (!this.isBlocked) {
          this.checkIfBlocked();
        }
      }, 5000); // Check every 5 seconds
  
      console.log('⏰ Periodic blocking check started');
    }
  
    /**
     * Stop periodic checking
     */
    stopPeriodicCheck() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
        console.log('⏹️ Periodic blocking check stopped');
      }
    }
  
    /**
     * Set up message listener for real-time updates
     */
    setupMessageListener() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
          switch (request.action) {
            case 'SITE_BLOCKED':
              if (request.domain === this.currentDomain) {
                this.blockSite(request.data);
              }
              break;
              
            case 'SITE_UNBLOCKED':
              if (request.domain === this.currentDomain) {
                this.unblockSite();
              }
              break;
              
            case 'FOCUS_MODE_ACTIVATED':
              // Check if current site is in focus mode block list
              this.checkIfBlocked();
              break;
              
            case 'FOCUS_MODE_DEACTIVATED':
              // Site might be unblocked now
              this.checkIfBlocked();
              break;
          }
          
          sendResponse({ success: true });
        } catch (error) {
          console.error('❌ Error handling message:', error);
          sendResponse({ success: false, error: error.message });
        }
      });
  
      console.log('📨 Message listener set up');
    }
  
    /**
     * Unblock the current site (reload to original)
     */
    unblockSite() {
      console.log('✅ Site unblocked, reloading...');
      
      // Get original URL from parameters if available
      const urlParams = new URLSearchParams(window.location.search);
      const originalUrl = urlParams.get('original');
      
      if (originalUrl) {
        window.location.href = originalUrl;
      } else {
        // Fallback: construct URL
        window.location.href = `https://${this.currentDomain}`;
      }
    }
  
    /**
     * Send message to background script
     */
    async sendMessage(message) {
      return new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(response || { success: false, error: 'No response' });
            }
          });
        } catch (error) {
          resolve({ success: false, error: error.message });
        }
      });
    }
  
    /**
     * Clean up when page unloads
     */
    cleanup() {
      this.stopPeriodicCheck();
      console.log('🧹 Blocking content script cleaned up');
    }
  }
  
  // Initialize only if not already blocked
  if (!window.location.href.includes('blocked.html')) {
    const blockingScript = new BlockingContentScript();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      blockingScript.cleanup();
    });
    
    // Export for debugging
    window.blockingScript = blockingScript;
  }