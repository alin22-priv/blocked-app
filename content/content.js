/**
 * Content script for FocusTracker
 * Handles page-level interactions and communication with background script
 */

class ContentManager {
    constructor() {
      this.domain = this.extractDomain(window.location.href);
      this.isVisible = !document.hidden;
      this.lastActivityTime = Date.now();
      
      // Bind event handlers
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this.handleUserActivity = this.handleUserActivity.bind(this);
      this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    }
  
    /**
     * Initialize content script
     */
    initialize() {
      try {
        // Only track valid domains
        if (!this.domain) {
          return;
        }
  
        console.log(`📄 FocusTracker content script loaded for: ${this.domain}`);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Notify background script of page load
        this.notifyPageLoad();
        
      } catch (error) {
        console.error('❌ Content script initialization failed:', error);
      }
    }
  
    /**
     * Extract domain from URL
     */
    extractDomain(url) {
      try {
        if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
          return null;
        }
        
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
      } catch (error) {
        return null;
      }
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Page visibility changes (tab switching, minimizing)
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      
      // User activity detection
      document.addEventListener('mousedown', this.handleUserActivity);
      document.addEventListener('keydown', this.handleUserActivity);
      document.addEventListener('scroll', this.handleUserActivity);
      document.addEventListener('touchstart', this.handleUserActivity);
      
      // Page unload
      window.addEventListener('beforeunload', this.handleBeforeUnload);
      
      console.log('🔗 Content script event listeners registered');
    }
  
    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
      const isNowVisible = !document.hidden;
      
      if (isNowVisible !== this.isVisible) {
        this.isVisible = isNowVisible;
        
        if (isNowVisible) {
          console.log(`👁️  Page became visible: ${this.domain}`);
          this.sendMessage({
            action: 'PAGE_VISIBLE',
            domain: this.domain,
            timestamp: Date.now()
          });
        } else {
          console.log(`👁️‍🗨️  Page became hidden: ${this.domain}`);
          this.sendMessage({
            action: 'PAGE_HIDDEN',
            domain: this.domain,
            timestamp: Date.now()
          });
        }
      }
    }
  
    /**
     * Handle user activity
     */
    handleUserActivity() {
      const now = Date.now();
      
      // Throttle activity notifications to once per second
      if (now - this.lastActivityTime > 1000) {
        this.lastActivityTime = now;
        
        this.sendMessage({
          action: 'USER_ACTIVITY',
          domain: this.domain,
          timestamp: now
        });
      }
    }
  
    /**
     * Handle page unload
     */
    handleBeforeUnload() {
      this.sendMessage({
        action: 'PAGE_UNLOAD',
        domain: this.domain,
        timestamp: Date.now()
      });
    }
  
    /**
     * Notify background script of page load
     */
    notifyPageLoad() {
      this.sendMessage({
        action: 'PAGE_LOAD',
        domain: this.domain,
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
      });
    }
  
    /**
     * Send message to background script
     */
    sendMessage(message) {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            // Silently handle errors (extension might be reloading)
            return;
          }
          
          // Handle response if needed
          if (response && !response.success) {
            console.warn('⚠️  Background script responded with error:', response.error);
          }
        });
      } catch (error) {
        // Silently handle errors
        console.warn('⚠️  Could not send message to background:', error.message);
      }
    }
  
    /**
     * Get page metadata for enhanced tracking
     */
    getPageMetadata() {
      return {
        title: document.title,
        url: window.location.href,
        domain: this.domain,
        favicon: this.getFaviconUrl(),
        timestamp: Date.now()
      };
    }
  
    /**
     * Get favicon URL for the current page
     */
    getFaviconUrl() {
      try {
        // Try to find favicon link in head
        const faviconLink = document.querySelector('link[rel*="icon"]');
        if (faviconLink && faviconLink.href) {
          return faviconLink.href;
        }
        
        // Fallback to default favicon location
        const urlObj = new URL(window.location.href);
        return `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
      } catch (error) {
        return null;
      }
    }
  
    /**
     * Check if current page should be tracked
     */
    shouldTrackPage() {
      // Don't track certain types of pages
      const excludedProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:', 'about:'];
      const excludedDomains = ['localhost', '127.0.0.1'];
      
      const url = window.location.href.toLowerCase();
      const domain = this.domain?.toLowerCase();
      
      // Check protocol exclusions
      for (const protocol of excludedProtocols) {
        if (url.startsWith(protocol)) {
          return false;
        }
      }
      
      // Check domain exclusions
      if (domain && excludedDomains.includes(domain)) {
        return false;
      }
      
      return true;
    }
  
    /**
     * Handle URL changes in single-page applications
     */
    observeUrlChanges() {
      let lastUrl = window.location.href;
      
      // Override history methods to detect navigation
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(() => this.handleUrlChange(lastUrl), 0);
        lastUrl = window.location.href;
      }.bind(this);
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        setTimeout(() => this.handleUrlChange(lastUrl), 0);
        lastUrl = window.location.href;
      }.bind(this);
      
      // Listen for popstate events (back/forward buttons)
      window.addEventListener('popstate', () => {
        setTimeout(() => this.handleUrlChange(lastUrl), 0);
        lastUrl = window.location.href;
      });
    }
  
    /**
     * Handle URL changes within the same page
     */
    handleUrlChange(previousUrl) {
      const newDomain = this.extractDomain(window.location.href);
      
      if (newDomain !== this.domain) {
        // Domain changed - notify background script
        console.log(`🔄 URL changed: ${this.domain} → ${newDomain}`);
        
        this.sendMessage({
          action: 'URL_CHANGED',
          previousDomain: this.domain,
          newDomain: newDomain,
          previousUrl: previousUrl,
          newUrl: window.location.href,
          timestamp: Date.now()
        });
        
        this.domain = newDomain;
      }
    }
  
    /**
     * Monitor for dynamic content changes
     */
    observeContentChanges() {
      // Only observe if title changes (indicates new content)
      let lastTitle = document.title;
      
      const titleObserver = new MutationObserver(() => {
        if (document.title !== lastTitle) {
          console.log(`📝 Title changed: "${lastTitle}" → "${document.title}"`);
          
          this.sendMessage({
            action: 'TITLE_CHANGED',
            domain: this.domain,
            previousTitle: lastTitle,
            newTitle: document.title,
            timestamp: Date.now()
          });
          
          lastTitle = document.title;
        }
      });
      
      // Observe title element changes
      const titleElement = document.querySelector('title');
      if (titleElement) {
        titleObserver.observe(titleElement, {
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }
  
    /**
     * Clean up event listeners and observers
     */
    cleanup() {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      document.removeEventListener('mousedown', this.handleUserActivity);
      document.removeEventListener('keydown', this.handleUserActivity);
      document.removeEventListener('scroll', this.handleUserActivity);
      document.removeEventListener('touchstart', this.handleUserActivity);
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      
      console.log('🧹 Content script cleaned up');
    }
  }
  
  // Initialize content manager
  const contentManager = new ContentManager();
  
  // Only initialize if we should track this page
  if (contentManager.shouldTrackPage()) {
    contentManager.initialize();
    contentManager.observeUrlChanges();
    contentManager.observeContentChanges();
  } else {
    console.log('⏭️  Skipping tracking for this page');
  }
  
  // Export for debugging
  window.focusTrackerContent = contentManager;