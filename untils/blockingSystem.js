/**
 * Phase 3: Website Blocking System for Blockd
 * Includes math problem generation and blocking logic
 */

/**
 * Math Problem Generator
 * Creates various types of math challenges for website unblocking
 */
class MathProblemGenerator {
    constructor() {
      this.problemTypes = {
        ALGEBRA: 'algebra',
        GEOMETRY: 'geometry',
        LOGIC: 'logic',
        ARITHMETIC: 'arithmetic',
        SEQUENCES: 'sequences'
      };
    }
  
    /**
     * Generate a problem based on difficulty level
     * @param {string} difficulty - 'medium' or 'hard'
     * @returns {Object} Problem object with question, answer, and type
     */
    generateProblem(difficulty = 'medium') {
      const types = Object.values(this.problemTypes);
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      switch (randomType) {
        case this.problemTypes.ALGEBRA:
          return this.generateAlgebraProblem(difficulty);
        case this.problemTypes.GEOMETRY:
          return this.generateGeometryProblem(difficulty);
        case this.problemTypes.LOGIC:
          return this.generateLogicProblem(difficulty);
        case this.problemTypes.ARITHMETIC:
          return this.generateArithmeticProblem(difficulty);
        case this.problemTypes.SEQUENCES:
          return this.generateSequenceProblem(difficulty);
        default:
          return this.generateAlgebraProblem(difficulty);
      }
    }
  
    /**
     * Generate algebra problems
     */
    generateAlgebraProblem(difficulty) {
      if (difficulty === 'hard') {
        // Complex algebra for focus mode
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 15) + 5;
        const c = Math.floor(Math.random() * 20) + 10;
        const x = Math.floor(Math.random() * 12) + 3;
        const result = a * x + b;
        
        return {
          question: `If ${a}x + ${b} = ${result}, what is x?`,
          answer: x,
          type: 'algebra',
          explanation: `${a}x = ${result} - ${b} = ${result - b}, so x = ${result - b}/${a} = ${x}`
        };
      } else {
        // Medium algebra for individual blocking
        const a = Math.floor(Math.random() * 5) + 2;
        const b = Math.floor(Math.random() * 10) + 3;
        const x = Math.floor(Math.random() * 8) + 2;
        const result = a * x + b;
        
        return {
          question: `If ${a}x + ${b} = ${result}, what is x?`,
          answer: x,
          type: 'algebra',
          explanation: `${a}x = ${result - b}, so x = ${x}`
        };
      }
    }
  
    /**
     * Generate geometry problems
     */
    generateGeometryProblem(difficulty) {
      const problems = difficulty === 'hard' ? [
        // Hard geometry problems
        () => {
          const radius = Math.floor(Math.random() * 8) + 3;
          const area = Math.round(Math.PI * radius * radius);
          return {
            question: `What is the area of a circle with radius ${radius}? (Round to nearest whole number, π ≈ 3.14)`,
            answer: area,
            type: 'geometry'
          };
        },
        () => {
          const base = Math.floor(Math.random() * 12) + 4;
          const height = Math.floor(Math.random() * 10) + 3;
          const area = 0.5 * base * height;
          return {
            question: `What is the area of a triangle with base ${base} and height ${height}?`,
            answer: area,
            type: 'geometry'
          };
        }
      ] : [
        // Medium geometry problems
        () => {
          const length = Math.floor(Math.random() * 8) + 3;
          const width = Math.floor(Math.random() * 6) + 2;
          const area = length * width;
          return {
            question: `What is the area of a rectangle with length ${length} and width ${width}?`,
            answer: area,
            type: 'geometry'
          };
        },
        () => {
          const side = Math.floor(Math.random() * 8) + 3;
          const perimeter = side * 4;
          return {
            question: `What is the perimeter of a square with side length ${side}?`,
            answer: perimeter,
            type: 'geometry'
          };
        }
      ];
  
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];
      return randomProblem();
    }
  
    /**
     * Generate logic problems
     */
    generateLogicProblem(difficulty) {
      const problems = difficulty === 'hard' ? [
        // Hard logic problems
        () => {
          const start = Math.floor(Math.random() * 5) + 2;
          const multiplier = Math.floor(Math.random() * 3) + 2;
          const sequence = [start];
          for (let i = 1; i < 4; i++) {
            sequence.push(sequence[i-1] * multiplier);
          }
          const next = sequence[3] * multiplier;
          
          return {
            question: `Complete the sequence: ${sequence.join(', ')}, ___`,
            answer: next,
            type: 'logic'
          };
        },
        () => {
          const ages = [25, 30, 35];
          const totalAge = ages.reduce((sum, age) => sum + age, 0);
          const avgAge = totalAge / ages.length;
          
          return {
            question: `Three people are ${ages.join(', ')} years old. What is their average age?`,
            answer: avgAge,
            type: 'logic'
          };
        }
      ] : [
        // Medium logic problems
        () => {
          const numbers = [3, 6, 9, 12];
          const next = numbers[numbers.length - 1] + 3;
          
          return {
            question: `Complete the sequence: ${numbers.join(', ')}, ___`,
            answer: next,
            type: 'logic'
          };
        },
        () => {
          const apples = Math.floor(Math.random() * 8) + 5;
          const eaten = Math.floor(Math.random() * 3) + 2;
          const remaining = apples - eaten;
          
          return {
            question: `You have ${apples} apples and eat ${eaten}. How many are left?`,
            answer: remaining,
            type: 'logic'
          };
        }
      ];
  
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];
      return randomProblem();
    }
  
    /**
     * Generate arithmetic problems
     */
    generateArithmeticProblem(difficulty) {
      if (difficulty === 'hard') {
        const a = Math.floor(Math.random() * 25) + 15;
        const b = Math.floor(Math.random() * 18) + 8;
        const c = Math.floor(Math.random() * 12) + 5;
        const result = a * b + c;
        
        return {
          question: `Calculate: ${a} × ${b} + ${c}`,
          answer: result,
          type: 'arithmetic'
        };
      } else {
        const a = Math.floor(Math.random() * 12) + 8;
        const b = Math.floor(Math.random() * 8) + 4;
        const result = a * b;
        
        return {
          question: `Calculate: ${a} × ${b}`,
          answer: result,
          type: 'arithmetic'
        };
      }
    }
  
    /**
     * Generate sequence problems
     */
    generateSequenceProblem(difficulty) {
      const problems = difficulty === 'hard' ? [
        // Hard sequences
        () => {
          // Fibonacci-like
          const a = Math.floor(Math.random() * 3) + 1;
          const b = Math.floor(Math.random() * 3) + 2;
          const sequence = [a, b];
          for (let i = 2; i < 5; i++) {
            sequence.push(sequence[i-1] + sequence[i-2]);
          }
          const next = sequence[4] + sequence[3];
          
          return {
            question: `Complete the sequence: ${sequence.join(', ')}, ___`,
            answer: next,
            type: 'sequences'
          };
        }
      ] : [
        // Medium sequences
        () => {
          const start = Math.floor(Math.random() * 5) + 2;
          const diff = Math.floor(Math.random() * 4) + 2;
          const sequence = [start, start + diff, start + diff * 2, start + diff * 3];
          const next = start + diff * 4;
          
          return {
            question: `Complete the sequence: ${sequence.join(', ')}, ___`,
            answer: next,
            type: 'sequences'
          };
        }
      ];
  
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];
      return randomProblem();
    }
  
    /**
     * Generate a set of problems for challenges
     * @param {number} count - Number of problems to generate
     * @param {string} difficulty - Difficulty level
     * @returns {Array} Array of problem objects
     */
    generateProblemSet(count, difficulty = 'medium') {
      const problems = [];
      for (let i = 0; i < count; i++) {
        problems.push(this.generateProblem(difficulty));
      }
      return problems;
    }
  }
  
  /**
   * Website Blocking Manager
   * Handles blocking logic and math challenges
   */
  class BlockingManager {
    constructor() {
      this.mathGenerator = new MathProblemGenerator();
      this.blockedSites = new Set();
      this.focusModeActive = false;
      this.focusModeEndTime = null;
      this.focusModeSites = new Set([
        'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
        'youtube.com', 'netflix.com', 'reddit.com', 'twitch.tv'
      ]);
      
      this.storageKey = 'blockd_blocking_data';
      this.loadBlockingData();
    }
  
    /**
     * Load blocking data from storage
     */
    async loadBlockingData() {
      try {
        const result = await chrome.storage.local.get([this.storageKey]);
        const data = result[this.storageKey] || {};
        
        this.blockedSites = new Set(data.blockedSites || []);
        this.focusModeActive = data.focusModeActive || false;
        this.focusModeEndTime = data.focusModeEndTime || null;
        this.focusModeSites = new Set(data.focusModeSites || this.focusModeSites);
        
        // Check if focus mode should be expired
        if (this.focusModeActive && this.focusModeEndTime && Date.now() > this.focusModeEndTime) {
          this.deactivateFocusMode();
        }
        
        console.log('📋 Blocking data loaded:', {
          blockedSites: Array.from(this.blockedSites),
          focusModeActive: this.focusModeActive,
          focusModeEndTime: this.focusModeEndTime
        });
      } catch (error) {
        console.error('❌ Error loading blocking data:', error);
      }
    }
  
    /**
     * Save blocking data to storage
     */
    async saveBlockingData() {
      try {
        const data = {
          blockedSites: Array.from(this.blockedSites),
          focusModeActive: this.focusModeActive,
          focusModeEndTime: this.focusModeEndTime,
          focusModeSites: Array.from(this.focusModeSites)
        };
        
        await chrome.storage.local.set({ [this.storageKey]: data });
        console.log('💾 Blocking data saved');
      } catch (error) {
        console.error('❌ Error saving blocking data:', error);
      }
    }
  
    /**
     * Check if a domain should be blocked
     * @param {string} domain - Domain to check
     * @returns {boolean} True if blocked
     */
    isDomainBlocked(domain) {
      if (this.focusModeActive && this.focusModeSites.has(domain)) {
        return true;
      }
      return this.blockedSites.has(domain);
    }
  
    /**
     * Block a specific website (individual blocking)
     * @param {string} domain - Domain to block
     */
    async blockWebsite(domain) {
      this.blockedSites.add(domain);
      await this.saveBlockingData();
      console.log(`🚫 Blocked website: ${domain}`);
    }
  
    /**
     * Unblock a website after solving math problems
     * @param {string} domain - Domain to unblock
     * @returns {Object} Challenge object with problems
     */
    async createUnblockChallenge(domain) {
      const problems = this.mathGenerator.generateProblemSet(3, 'medium');
      
      return {
        type: 'individual_unblock',
        domain: domain,
        problems: problems,
        challengeId: `unblock_${Date.now()}`,
        attempts: 0,
        maxAttempts: 3
      };
    }
  
    /**
     * Verify answers for unblock challenge
     * @param {string} challengeId - Challenge identifier
     * @param {Array} answers - User's answers
     * @param {Array} problems - Original problems
     * @returns {Object} Result object
     */
    async verifyUnblockChallenge(challengeId, answers, problems) {
      const correct = answers.every((answer, index) => {
        return parseInt(answer) === problems[index].answer;
      });
  
      if (correct) {
        // Extract domain from challenge ID or pass it separately
        const domain = challengeId.split('_')[1] || 'unknown';
        this.blockedSites.delete(domain);
        await this.saveBlockingData();
        
        return {
          success: true,
          message: 'Website unblocked successfully!',
          domain: domain
        };
      } else {
        return {
          success: false,
          message: 'Incorrect answers. Try again in 30 seconds.',
          penaltyTime: 30000 // 30 seconds
        };
      }
    }
  
    /**
     * Activate focus mode
     * @param {number} duration - Duration in minutes
     * @returns {Object} Challenge object for focus mode activation
     */
    async createFocusModeChallenge(duration) {
      const problems = this.mathGenerator.generateProblemSet(5, 'hard');
      
      return {
        type: 'focus_mode_activation',
        duration: duration,
        problems: problems,
        challengeId: `focus_${Date.now()}`,
        attempts: 0,
        maxAttempts: 2
      };
    }
  
    /**
     * Verify focus mode challenge and activate if successful
     * @param {Array} answers - User's answers
     * @param {Array} problems - Original problems
     * @param {number} duration - Duration in minutes
     * @returns {Object} Result object
     */
    async verifyFocusModeChallenge(answers, problems, duration) {
      const correct = answers.every((answer, index) => {
        return parseInt(answer) === problems[index].answer;
      });
  
      if (correct) {
        this.focusModeActive = true;
        this.focusModeEndTime = Date.now() + (duration * 60 * 1000);
        await this.saveBlockingData();
        
        return {
          success: true,
          message: `Focus mode activated for ${duration} minutes!`,
          endTime: this.focusModeEndTime
        };
      } else {
        return {
          success: false,
          message: 'Incorrect answers. Focus mode not activated.',
          penaltyTime: 60000 // 1 minute penalty
        };
      }
    }
  
    /**
     * Create emergency override challenge for focus mode
     * @returns {Object} Emergency challenge
     */
    async createEmergencyOverride() {
      const problems = this.mathGenerator.generateProblemSet(7, 'hard');
      
      return {
        type: 'emergency_override',
        problems: problems,
        challengeId: `emergency_${Date.now()}`,
        warning: 'Emergency override will end your focus session early.',
        attempts: 0,
        maxAttempts: 1
      };
    }
  
    /**
     * Deactivate focus mode
     */
    async deactivateFocusMode() {
      this.focusModeActive = false;
      this.focusModeEndTime = null;
      await this.saveBlockingData();
      console.log('🔓 Focus mode deactivated');
    }
  
    /**
     * Get current focus mode status
     * @returns {Object} Focus mode status
     */
    getFocusModeStatus() {
      if (!this.focusModeActive) {
        return { active: false };
      }
      
      const remaining = this.focusModeEndTime - Date.now();
      if (remaining <= 0) {
        this.deactivateFocusMode();
        return { active: false };
      }
      
      return {
        active: true,
        endTime: this.focusModeEndTime,
        remainingMinutes: Math.ceil(remaining / (60 * 1000)),
        remainingMs: remaining
      };
    }
  
    /**
     * Add or remove sites from focus mode blocking list
     * @param {string} domain - Domain to toggle
     */
    async toggleFocusModeSite(domain) {
      if (this.focusModeSites.has(domain)) {
        this.focusModeSites.delete(domain);
      } else {
        this.focusModeSites.add(domain);
      }
      await this.saveBlockingData();
    }
  
    /**
     * Get all blocking statistics
     * @returns {Object} Blocking statistics
     */
    getBlockingStats() {
      return {
        individuallyBlockedSites: Array.from(this.blockedSites),
        focusModeSites: Array.from(this.focusModeSites),
        focusModeStatus: this.getFocusModeStatus()
      };
    }
  }
  
  // Export for use in background script
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MathProblemGenerator, BlockingManager };
  } else {
    window.MathProblemGenerator = MathProblemGenerator;
    window.BlockingManager = BlockingManager;
  }