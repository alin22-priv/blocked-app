/**
 * Enhanced FocusTracker Dashboard JavaScript
 * Improved visualizations with accurate pie charts and proper bar graphs
 */

/**
 * Storage utility functions (inlined for dashboard)
 */
class DashboardStorageManager {
    constructor() {
      this.storageKeys = {
        TIME_DATA: 'focusTracker_timeData',
        BLOCKED_SITES: 'focusTracker_blockedSites',
        SETTINGS: 'focusTracker_settings',
        BREAK_TIMERS: 'focusTracker_breakTimers'
      };
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
  }
  
  class DashboardManager {
    constructor() {
      this.storageManager = new DashboardStorageManager();
      this.charts = {};
      this.currentTimeRange = 'today';
      this.isInitialized = false;
      
      // Earth-tone color palette
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
      
      // Website categories
      this.categories = {
        'work': ['github.com', 'linkedin.com', 'slack.com', 'notion.so', 'figma.com', 'docs.google.com', 'claude.ai'],
        'social': ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com'],
        'entertainment': ['youtube.com', 'netflix.com', 'twitch.tv', 'spotify.com', 'hulu.com'],
        'other': []
      };
      
      // Bind methods
      this.handleTimeRangeChange = this.handleTimeRangeChange.bind(this);
      this.handleRefresh = this.handleRefresh.bind(this);
    }
  
    /**
     * Initialize the dashboard
     */
    async initialize() {
      try {
        console.log('🚀 Initializing FocusTracker dashboard...');
        
        this.showLoading(true);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Data loading timeout')), 5000)
        );
        
        try {
          await Promise.race([this.loadData(), timeoutPromise]);
        } catch (error) {
          console.warn('⚠️ Data loading failed, using fallback data:', error);
          this.data = { websites: [], totalTime: 0, sessions: [] };
          this.processAnalyticsData();
        }
        
        // Create enhanced charts
        this.createEnhancedCharts();
        
        // Update UI
        this.updateUI();
        
        // Start auto-refresh for live updates
        this.startAutoRefresh();
        
        this.isInitialized = true;
        this.showLoading(false);
        
        console.log('✅ Dashboard initialized successfully');
        
      } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
        this.showLoading(false);
        this.showFallbackUI();
      }
    }

    /**
     * Create enhanced charts with better visualization
     */
    createEnhancedCharts() {
      console.log('📊 Creating enhanced charts with data:', this.data);
      
      // Always create bar chart for activity breakdown
      this.createTodayBarChart();
      
      this.createEnhancedBarChart();
    }

    /**
     * Create enhanced pie chart similar to popup
     */
    createEnhancedPieChart() {
      const container = document.getElementById('todayChart');
      
      if (!this.data.websites || this.data.websites.length === 0) {
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #6B5B47;">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">📊</div>
              <div>Start browsing to see your activity breakdown</div>
            </div>
          </div>
        `;
        return;
      }
      
      // Take top 6 websites for better visibility
      const websites = this.data.websites.slice(0, 6);
      const total = websites.reduce((sum, w) => sum + w.time, 0);
      
      if (total === 0) {
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #6B5B47;">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">⏱️</div>
              <div>No time tracked yet</div>
            </div>
          </div>
        `;
        return;
      }
      
      console.log('📊 Creating enhanced pie chart for websites:', websites.map(w => `${w.domain}: ${this.formatTime(w.time)}`));
      
      // Create responsive layout with chart and minimal legend side by side
      let chartContent = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 20px; width: 100%; height: 100%; gap: 40px;">
          <!-- Pie Chart Section -->
          <div style="flex-shrink: 0; position: relative;">
            <svg width="220" height="220" viewBox="0 0 220 220" style="max-width: 100%; height: auto;">
      `;
      
      let currentAngle = 0;
      const radius = 85;
      const centerX = 110;
      const centerY = 110;
      
      websites.forEach((website, index) => {
        const percentage = website.time / total;
        const angle = percentage * 360;
        const color = this.colors[index % this.colors.length];
        
        // Create pie slice using path
        const startAngle = (currentAngle - 90) * (Math.PI / 180);
        const endAngle = (currentAngle + angle - 90) * (Math.PI / 180);
        
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        chartContent += `
          <path d="${pathData}" 
                fill="${color}" 
                stroke="#fff" 
                stroke-width="2"
                style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.1)); cursor: pointer;"
                data-website="${website.domain}"
                data-time="${this.formatTime(website.time)}"
                data-percentage="${(percentage * 100).toFixed(1)}%">
            <title>${website.domain}: ${this.formatTime(website.time)} (${(percentage * 100).toFixed(1)}%)</title>
          </path>
        `;
        
        currentAngle += angle;
      });
      
      // Add center circle for total time (like popup)
      chartContent += `
        <circle cx="${centerX}" cy="${centerY}" r="40" fill="white" stroke="#E5E0D8" stroke-width="2"/>
        <foreignObject x="${centerX-40}" y="${centerY-28}" width="80" height="40">
          <div xmlns="http://www.w3.org/1999/xhtml" class="piechart-center-mono" style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:80px;height:40px;">
            <span class="piechart-center-value">${this.formatTime(total)}</span>
            <span class="piechart-center-label">Total Time</span>
          </div>
        </foreignObject>
      `;
      
      chartContent += `</svg></div>
        <!-- Minimal Legend Section -->
        <div style="flex: 1; max-width: 200px;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
      `;
      
      // Create minimal legend items
      websites.forEach((website, index) => {
        const timeFormatted = this.formatTime(website.time);
        const percentage = ((website.time / total) * 100).toFixed(1);
        const color = this.colors[index % this.colors.length];
        const favicon = this.getFavicon(website.domain);
        
        chartContent += `
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
            <div style="width: 10px; height: 10px; background: ${color}; border-radius: 50%; flex-shrink: 0;"></div>
            <span style="font-size: 14px;">${favicon}</span>
            <div style="flex: 1; color: #2C2C2C; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${website.domain}</div>
            <div style="color: #6B5B47; font-size: 11px; font-family: 'SF Mono', Monaco, monospace;">${timeFormatted}</div>
          </div>
        `;
      });
      
      chartContent += `</div></div></div>`;
      
      container.innerHTML = chartContent;
      console.log('✅ Minimal pie chart with legend created successfully');
    }

    /**
     * Create enhanced bar chart with proper axes and scaling
     */
    createEnhancedBarChart() {
      const container = document.getElementById('weeklyChart');
      const websites = this.data.websites.slice(0, 5); // Top 5 for clarity
      
      if (websites.length === 0) {
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #6B5B47;">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">📈</div>
              <div>Bar chart will appear here</div>
            </div>
          </div>
        `;
        return;
      }
      
      console.log('📈 Creating enhanced bar chart for sites:', websites.map(w => `${w.domain}: ${this.formatTime(w.time)}`));
      
      // Calculate max time for scaling (no cap)
      const maxTime = Math.max(...websites.map(w => w.time));
      const chartMaxTime = Math.max(maxTime, 3600); // At least 1 hour on chart
      // Round up to the next hour for a clean axis
      const nextHour = Math.ceil(chartMaxTime / 3600) * 3600;
      const scaleMaxTime = Math.max(nextHour, chartMaxTime * 1.2);
      
      // Create SVG bar chart with proper axes
      let chartContent = `
        <div style="padding: 20px; width: 100%; height: 100%;">
          <div style="margin-bottom: 15px; text-align: center;">
            <h4 style="color: #2C2C2C; margin: 0; font-size: 16px;">Time Spent by Website</h4>
          </div>
          <div style="position: relative; width: 100%; height: 280px;">
            <svg width="100%" height="280" viewBox="0 0 500 280" style="border: 1px solid #E5E0D8; border-radius: 8px; background: white;">
      `;
      
      // Draw Y-axis labels and grid lines
      const yAxisSteps = 5;
      for (let i = 0; i <= yAxisSteps; i++) {
        const timeValue = (scaleMaxTime / yAxisSteps) * i;
        const yPos = 250 - (i * (220 / yAxisSteps));
        const timeLabel = this.formatTimeAxis(timeValue);
        
        // Grid line
        chartContent += `<line x1="60" y1="${yPos}" x2="480" y2="${yPos}" stroke="#E5E0D8" stroke-width="1" opacity="0.5"/>`;
        // Y-axis label
        chartContent += `<text x="50" y="${yPos + 4}" text-anchor="end" font-size="10" fill="#6B5B47">${timeLabel}</text>`;
      }
      
      // Draw X and Y axes
      chartContent += `<line x1="60" y1="250" x2="480" y2="250" stroke="#2C2C2C" stroke-width="2"/>`;
      chartContent += `<line x1="60" y1="30" x2="60" y2="250" stroke="#2C2C2C" stroke-width="2"/>`;
      
      // Calculate bar dimensions
      const chartWidth = 420; // 480 - 60 (left margin)
      const barWidth = Math.min(60, chartWidth / (websites.length * 1.5));
      const barSpacing = (chartWidth - (barWidth * websites.length)) / (websites.length + 1);
      
      // Draw bars
      websites.forEach((website, index) => {
        const barHeight = (website.time / scaleMaxTime) * 220;
        const xPos = 60 + barSpacing + (index * (barWidth + barSpacing));
        const yPos = 250 - barHeight;
        const color = this.colors[index % this.colors.length];
        
        // Bar with gradient effect
        chartContent += `
          <defs>
            <linearGradient id="grad${index}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${color};stop-opacity:0.7" />
            </linearGradient>
          </defs>
          <rect x="${xPos}" y="${yPos}" width="${barWidth}" height="${barHeight}" 
                fill="url(#grad${index})" 
                stroke="${color}" 
                stroke-width="1"
                rx="4" ry="4"
                style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
            <title>${website.domain}: ${this.formatTime(website.time)}</title>
          </rect>
        `;
        
        // Value label on top of bar
        if (barHeight > 20) {
          chartContent += `
            <text x="${xPos + barWidth/2}" y="${yPos - 5}" text-anchor="middle" 
                  font-size="10" font-weight="bold" fill="#2C2C2C">
              ${this.formatTime(website.time)}
            </text>
          `;
        }
        
        // X-axis label (rotated for better fit)
        const labelX = xPos + barWidth/2;
        const labelY = 265;
        const domain = website.domain.length > 12 ? website.domain.substring(0, 12) + '...' : website.domain;
        chartContent += `
          <text x="${labelX}" y="${labelY}" text-anchor="middle" 
                font-size="9" fill="#6B5B47" 
                transform="rotate(-15 ${labelX} ${labelY})">
            ${domain}
          </text>
        `;
      });
      
      // Axis labels
      chartContent += `
        <text x="250" y="295" text-anchor="middle" font-size="12" font-weight="bold" fill="#2C2C2C">Websites</text>
        <text x="25" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#2C2C2C" transform="rotate(-90 25 140)">Time Spent</text>
      `;
      
      chartContent += '</svg></div>';
      
      // Add summary statistics
      chartContent += `
        <div style="margin-top: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; font-size: 11px;">
          <div style="text-align: center; padding: 8px; background: #F5F2ED; border-radius: 6px;">
            <div style="font-weight: bold; color: #D4735A;">${this.formatTime(maxTime)}</div>
            <div style="color: #6B5B47;">Highest</div>
          </div>
          <div style="text-align: center; padding: 8px; background: #F5F2ED; border-radius: 6px;">
            <div style="font-weight: bold; color: #A8B5A0;">${this.formatTime(this.data.totalTime / websites.length)}</div>
            <div style="color: #6B5B47;">Average</div>
          </div>
          <div style="text-align: center; padding: 8px; background: #F5F2ED; border-radius: 6px;">
            <div style="font-weight: bold; color: #E89B3F;">${websites.length}</div>
            <div style="color: #6B5B47;">Websites</div>
          </div>
        </div>
      `;
      
      chartContent += '</div>';
      
      container.innerHTML = chartContent;
      console.log('✅ Enhanced bar chart created successfully');
    }

    /**
     * Format time for axis labels (more compact)
     */
    formatTimeAxis(seconds) {
      if (seconds === 0) return '0';
      if (seconds < 60) return `${Math.round(seconds)}s`;
      if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
      return `${(seconds / 3600).toFixed(1)}h`;
    }

    /**
     * Start auto-refresh for live updates
     */
    startAutoRefresh() {
      // Refresh every 10 seconds to show live tracking
      this.refreshInterval = setInterval(async () => {
        if (this.isInitialized) {
          console.log('🔄 Auto-refreshing dashboard...');
          await this.loadData();
          // Preserve the current chart type when refreshing
          this.createEnhancedCharts();
          this.updateUI();
        }
      }, 10000); // 10 seconds
      
      console.log('⏰ Auto-refresh started (10s interval)');
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
        console.log('⏹️ Auto-refresh stopped');
      }
    }

    /**
     * Show fallback UI when data loading fails
     */
    showFallbackUI() {
      // Show empty state with helpful message
      document.querySelector('.dashboard-main').innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #6B5B47;">
          <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
          <h2 style="margin-bottom: 12px; color: #2C2C2C;">No Data Available</h2>
          <p style="margin-bottom: 20px;">Start browsing to see your analytics here!</p>
          <button onclick="window.location.reload()" style="
            background: #D4735A; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer;
            font-weight: 600;
          ">Try Again</button>
        </div>
      `;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Time range selector
      document.getElementById('timeRangeSelect').addEventListener('change', this.handleTimeRangeChange);
      
      // Control buttons
      document.getElementById('refreshBtn').addEventListener('click', this.handleRefresh);
      
      console.log('🔗 Dashboard event listeners registered');
    }

    /**
     * Load data based on current time range
     */
    async loadData() {
      try {
        console.log('📡 Loading dashboard data...');
        
        const allData = await this.storageManager.getTimeData();
        console.log('📊 Raw storage data:', allData);
        
        switch (this.currentTimeRange) {
          case 'today':
            this.data = await this.getTodayData(allData);
            break;
          case 'week':
            this.data = await this.getWeekData(allData);
            break;
          case 'month':
            this.data = await this.getMonthData(allData);
            break;
          default:
            this.data = await this.getTodayData(allData);
        }
        
        console.log('📈 Processed data:', this.data);
        
        // Process data for analytics
        this.processAnalyticsData();
        
        console.log('✅ Data loaded for range:', this.currentTimeRange);
        
      } catch (error) {
        console.error('❌ Error loading data:', error);
        throw error;
      }
    }

    /**
     * Get today's data
     */
    async getTodayData(allData) {
      const today = new Date().toLocaleDateString('en-CA');
      const todayData = allData[today] || {};
      
      console.log('📅 Today data raw:', todayData);
      
      const websites = Object.entries(todayData).map(([domain, data]) => ({
        domain,
        time: data.totalTime || 0,
        sessions: data.sessions || [],
        category: this.categorizeWebsite(domain)
      }));
      
      const totalTime = websites.reduce((sum, site) => sum + site.time, 0);
      const allSessions = websites.flatMap(site => 
        site.sessions.map(session => ({
          ...session,
          domain: site.domain,
          category: site.category
        }))
      );
      
      console.log('📊 Processed websites:', websites);
      console.log('⏱️ Total time:', totalTime);
      
      // If still no data, create some sample data to show the dashboard working
      if (websites.length === 0 || totalTime === 0) {
        console.log('🎭 Creating sample data for demo');
        return this.createSampleData();
      }
      
      return { websites, totalTime, sessions: allSessions };
    }

    /**
     * Create sample data when no real data exists
     */
    createSampleData() {
      const sampleWebsites = [
        {
          domain: 'claude.ai',
          time: 30, // 30 seconds
          sessions: [{ timestamp: Date.now() - 30000, duration: 30 }],
          category: 'work'
        }
      ];
      
      const totalTime = sampleWebsites.reduce((sum, site) => sum + site.time, 0);
      const allSessions = sampleWebsites.flatMap(site => 
        site.sessions.map(session => ({
          ...session,
          domain: site.domain,
          category: site.category
        }))
      );
      
      return { websites: sampleWebsites, totalTime, sessions: allSessions };
    }

    /**
     * Get week's data
     */
    async getWeekData(allData) {
      const dates = this.getLastNDays(7);
      const weekData = {};
      let totalTime = 0;
      const allSessions = [];
      
      dates.forEach(date => {
        const dayData = allData[date] || {};
        weekData[date] = dayData;
        
        Object.entries(dayData).forEach(([domain, data]) => {
          totalTime += data.totalTime || 0;
          if (data.sessions) {
            allSessions.push(...data.sessions.map(session => ({
              ...session,
              domain,
              date,
              category: this.categorizeWebsite(domain)
            })));
          }
        });
      });
      
      // Aggregate websites
      const websiteMap = {};
      Object.entries(weekData).forEach(([date, dayData]) => {
        Object.entries(dayData).forEach(([domain, data]) => {
          if (!websiteMap[domain]) {
            websiteMap[domain] = {
              domain,
              time: 0,
              sessions: [],
              category: this.categorizeWebsite(domain)
            };
          }
          websiteMap[domain].time += data.totalTime || 0;
          websiteMap[domain].sessions.push(...(data.sessions || []));
        });
      });
      
      const websites = Object.values(websiteMap);
      
      return { websites, totalTime, sessions: allSessions, weekData };
    }

    /**
     * Get month's data
     */
    async getMonthData(allData) {
      const dates = this.getLastNDays(30);
      const monthData = {};
      let totalTime = 0;
      const allSessions = [];
      
      dates.forEach(date => {
        const dayData = allData[date] || {};
        monthData[date] = dayData;
        
        Object.entries(dayData).forEach(([domain, data]) => {
          totalTime += data.totalTime || 0;
          if (data.sessions) {
            allSessions.push(...data.sessions.map(session => ({
              ...session,
              domain,
              date,
              category: this.categorizeWebsite(domain)
            })));
          }
        });
      });
      
      // Aggregate websites
      const websiteMap = {};
      Object.entries(monthData).forEach(([date, dayData]) => {
        Object.entries(dayData).forEach(([domain, data]) => {
          if (!websiteMap[domain]) {
            websiteMap[domain] = {
              domain,
              time: 0,
              sessions: [],
              category: this.categorizeWebsite(domain)
            };
          }
          websiteMap[domain].time += data.totalTime || 0;
          websiteMap[domain].sessions.push(...(data.sessions || []));
        });
      });
      
      const websites = Object.values(websiteMap);
      
      return { websites, totalTime, sessions: allSessions, monthData };
    }

    /**
     * Process data for analytics
     */
    processAnalyticsData() {
      // Sort websites by time
      this.data.websites.sort((a, b) => b.time - a.time);
      
      // Calculate category totals
      this.categoryData = {};
      this.data.websites.forEach(website => {
        if (!this.categoryData[website.category]) {
          this.categoryData[website.category] = 0;
        }
        this.categoryData[website.category] += website.time;
      });
      
      // Calculate stats
      this.stats = this.calculateStats();
    }

    /**
     * Calculate various statistics
     */
    calculateStats() {
      const { websites, totalTime, sessions } = this.data;
      
      const websitesCount = websites.length;
      const averageSession = sessions.length > 0 
        ? sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length 
        : 0;
      
      // Calculate focus score (work category percentage)
      const workTime = this.categoryData.work || 0;
      const focusScore = totalTime > 0 ? (workTime / totalTime) * 100 : 0;
      
      return {
        totalTime,
        websitesCount,
        averageSession,
        focusScore: focusScore.toFixed(1), // 1 decimal place
        todayChange: 0, // TODO: Calculate from yesterday's data
        websitesChange: 0, // TODO: Calculate new websites
        sessionChange: 0, // TODO: Calculate session improvement
        focusChange: 'Based on productivity'
      };
    }

    /**
     * Categorize website by domain
     */
    categorizeWebsite(domain) {
      for (const [category, domains] of Object.entries(this.categories)) {
        if (domains.includes(domain)) {
          return category;
        }
      }
      return 'other';
    }

    /**
     * Get last N days as date strings
     */
    getLastNDays(n) {
      const dates = [];
      for (let i = n - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-CA'));
      }
      return dates;
    }

    /**
     * Update the entire UI
     */
    updateUI() {
      this.updateStats();
      this.updateTables();
      this.updateCharts();
    }

    /**
     * Update statistics cards
     */
    updateStats() {
      // Get the appropriate time range label
      const timeRangeLabels = {
        'today': 'Today',
        'week': 'This Week', 
        'month': 'This Month'
      };
      const timeRangeLabel = timeRangeLabels[this.currentTimeRange] || 'Today';
      
      document.getElementById('totalTimeToday').textContent = this.formatTime(this.stats.totalTime);
      document.getElementById('websitesVisited').textContent = this.stats.websitesCount;
      document.getElementById('averageSession').textContent = this.formatTime(this.stats.averageSession);
      document.getElementById('focusScore').textContent = `${this.stats.focusScore}%`;
      
      // Update the stat labels to reflect the current time range
      const statLabels = document.querySelectorAll('.stat-label');
      statLabels[0].textContent = `Total Time ${timeRangeLabel}`;
      statLabels[1].textContent = `Websites Visited`;
      statLabels[2].textContent = `Avg Session Length`;
      statLabels[3].textContent = `Focus Score`;
      
      document.getElementById('todayChange').textContent = this.stats.todayChange;
      document.getElementById('websitesChange').textContent = this.stats.websitesChange;
      document.getElementById('sessionChange').textContent = this.stats.sessionChange;
      document.getElementById('focusChange').textContent = this.stats.focusChange;
    }

    /**
     * Update data tables
     */
    updateTables() {
      this.updateWebsitesTable();
      this.updateSessionsTable();
    }

    /**
     * Update websites table
     */
    updateWebsitesTable() {
      const tbody = document.querySelector('#websitesTable tbody');
      tbody.innerHTML = '';
      
      this.data.websites.slice(0, 10).forEach(website => {
        const row = document.createElement('tr');
        
        const categoryBadge = `<span class="category-badge category-${website.category}">${website.category}</span>`;
        
        row.innerHTML = `
          <td>
            <div class="website-cell">
              <span class="website-favicon">${this.getFavicon(website.domain)}</span>
              ${website.domain}
            </div>
          </td>
          <td>${this.formatTime(website.time)}</td>
          <td>${website.sessions.length}</td>
          <td>${categoryBadge}</td>
        `;
        
        tbody.appendChild(row);
      });
    }

    /**
     * Update sessions table
     */
    updateSessionsTable() {
      const tbody = document.querySelector('#sessionsTable tbody');
      tbody.innerHTML = '';
      
      const recentSessions = this.data.sessions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      recentSessions.forEach(session => {
        const row = document.createElement('tr');
        const time = new Date(session.timestamp).toLocaleTimeString();
        const categoryBadge = `<span class="category-badge category-${session.category}">${session.category}</span>`;
        
        row.innerHTML = `
          <td>${time}</td>
          <td>${session.domain}</td>
          <td>${this.formatTime(session.duration)}</td>
          <td>${categoryBadge}</td>
        `;
        
        tbody.appendChild(row);
      });
    }

    /**
     * Update all charts
     */
    updateCharts() {
      // Charts are recreated in createEnhancedCharts(), no need to update existing ones
      console.log('🔄 Charts updated');
    }

    /**
     * Format time duration with appropriate precision
     */
    formatTime(seconds) {
      if (seconds < 60) {
        return `${Math.round(seconds)}s`;
      } else if (seconds < 3600) {
        const minutes = Math.round(seconds / 60);
        return `${minutes}m`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    }

    /**
     * Get favicon for domain
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
     * Show/hide loading overlay
     */
    showLoading(show) {
      const overlay = document.getElementById('loadingOverlay');
      overlay.style.display = show ? 'flex' : 'none';
    }

    // Event Handlers
    async handleTimeRangeChange(event) {
      try {
        this.currentTimeRange = event.target.value;
        this.showLoading(true);
        await this.loadData();
        // Preserve the current chart type when changing time range
        this.createEnhancedCharts();
        this.updateUI();
        this.showLoading(false);
      } catch (error) {
        console.error('❌ Error changing time range:', error);
        this.showLoading(false);
      }
    }

    async handleRefresh() {
      try {
        this.showLoading(true);
        await this.loadData();
        // Preserve the current chart type when refreshing
        this.createEnhancedCharts();
        this.updateUI();
        this.showLoading(false);
      } catch (error) {
        console.error('❌ Error refreshing:', error);
        this.showLoading(false);
      }
    }

    handleChartToggle(event) {
      const button = event.target;
      const chartType = button.dataset.chart;
      const chartContainer = button.closest('.chart-card');
      
      // Update active state
      chartContainer.querySelectorAll('.chart-toggle').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      
      // Switch between pie and bar chart view for today's data
      if (chartType === 'pie') {
        this.createEnhancedPieChart();
      } else if (chartType === 'bar') {
        // Create a bar version of today's data
        this.createTodayBarChart();
      }
    }

    /**
     * Create today's data as a bar chart (alternative view)
     */
    createTodayBarChart() {
      const container = document.getElementById('todayChart');
      
      if (!this.data.websites || this.data.websites.length === 0) {
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #6B5B47;">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">📊</div>
              <div>Start browsing to see your activity breakdown</div>
            </div>
          </div>
        `;
        return;
      }

      const websites = this.data.websites.slice(0, 6);
      const maxTime = Math.max(...websites.map(w => w.time));
      // Use the total time from all websites, not just the top 6
      const total = this.data.totalTime;
      
      let chartContent = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 20px; width: 100%; height: 100%;">
          <!-- Expanded Bar Chart Section -->
          <div style="width: 100%; max-width: 400px;">
            <div style="margin-bottom: 20px; text-align: center;">
              <h4 style="color: #2C2C2C; margin: 0; font-size: 16px; font-weight: 600;">Activity Breakdown</h4>
              <div style="color: #6B5B47; font-size: 12px; margin-top: 4px;">Total: ${this.formatTime(total)}</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px; padding: 0 20px;">
      `;

      websites.forEach((website, index) => {
        const barWidth = maxTime > 0 ? Math.max((website.time / maxTime) * 280, 30) : 30;
        const color = this.colors[index % this.colors.length];
        const domain = website.domain.length > 15 ? website.domain.substring(0, 15) + '...' : website.domain;
        const favicon = this.getFavicon(website.domain);
        const timeFormatted = this.formatTime(website.time);
        
        chartContent += `
          <div style="display: flex; align-items: center; gap: 12px;">
            <!-- Website Info -->
            <div style="width: 120px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #2C2C2C;">
              <span style="font-size: 14px;">${favicon}</span>
              <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${domain}</span>
            </div>
            
            <!-- Bar Container -->
            <div style="flex: 1; position: relative; height: 24px; background: #F5F2ED; border-radius: 12px; overflow: hidden; border: 1px solid #E5E0D8;">
              <div style="
                width: ${barWidth}px; 
                height: 100%; 
                background: linear-gradient(to right, ${color}, ${color}dd);
                border-radius: 12px;
                transition: all 0.3s ease;
                position: relative;
              " title="${website.domain}: ${timeFormatted}">
              </div>
            </div>
            
            <!-- Time Label -->
            <div style="width: 60px; text-align: right; font-size: 11px; color: #6B5B47; font-family: 'SF Mono', Monaco, monospace; font-weight: 600;">
              ${timeFormatted}
            </div>
          </div>
        `;
      });

      chartContent += `
            </div>
          </div>
        </div>
      `;

      container.innerHTML = chartContent;
      console.log('✅ Clean bar chart created successfully');
    }
  }

  // Initialize dashboard when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const dashboardManager = new DashboardManager();
    dashboardManager.initialize();
    
    // Export for debugging
    window.dashboardManager = dashboardManager;
  });