console.log('🚫 Blocked page script loading...');

// Math challenge state
let mathChallenge = {
  currentProblem: null,
  correctAnswer: null,
  attempts: 3,
  correctAnswers: 0,
  requiredCorrect: 1,
  currentProblemIndex: 0
};

// Site information
let currentSite = '';

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, initializing blocked page...');
  
  // Add entrance animation
  setTimeout(() => {
    const container = document.querySelector('.blocked-container');
    if (container) {
      container.classList.add('loaded');
      console.log('✨ Entrance animation triggered');
    }
  }, 100);
  
  // Initialize the page
  initializeBlockedPage();
});

function initializeBlockedPage() {
  console.log('🚀 Initializing blocked page...');
  
  // Parse URL parameters to get the blocked site
  const urlParams = new URLSearchParams(window.location.search);
  currentSite = urlParams.get('site') || 'example.com';
  console.log('🌐 Current blocked site:', currentSite);
  console.log('🔍 Full URL:', window.location.href);
  console.log('🔍 URL params:', window.location.search);
  
  // Update domain display
  const domainElement = document.getElementById('blockedDomain');
  if (domainElement) {
    domainElement.textContent = currentSite;
  }
  
  // DEBUGGING: Test Chrome API availability
  console.log('🔧 Chrome API available:', typeof chrome !== 'undefined');
  console.log('🔧 Chrome runtime available:', typeof chrome !== 'undefined' && !!chrome.runtime);
  console.log('🔧 Chrome sendMessage available:', typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage);
  
  // Load stats and initialize components
  setTimeout(() => {
    updateSampleStats();
    showRandomQuote();
    initializeMathChallenge();
  }, 500);
}

function updateSampleStats() {
  const statsElements = {
    blockedToday: document.getElementById('blockedToday'),
    timeSaved: document.getElementById('timeSaved'),
    focusStreak: document.getElementById('focusStreak')
  };
  
  // Remove loading animation
  Object.values(statsElements).forEach(el => {
    if (el) el.classList.remove('loading');
  });
  
  // Set sample values (you can make this dynamic later)
  if (statsElements.blockedToday) {
    statsElements.blockedToday.textContent = Math.floor(Math.random() * 15) + 1;
  }
  if (statsElements.timeSaved) {
    const hours = Math.floor(Math.random() * 5) + 1;
    const minutes = Math.floor(Math.random() * 60);
    statsElements.timeSaved.textContent = `${hours}h ${minutes}m`;
  }
  if (statsElements.focusStreak) {
    statsElements.focusStreak.textContent = Math.floor(Math.random() * 20) + 1;
  }
  
  console.log('📊 Stats loaded');
}

function showRandomQuote() {
  const quotes = [
    {
      text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.",
      author: "Alexander Graham Bell"
    },
    {
      text: "The successful warrior is the average person with laser-like focus.",
      author: "Bruce Lee"
    },
    {
      text: "Focus on being productive instead of busy.",
      author: "Tim Ferriss"
    },
    {
      text: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney"
    },
    {
      text: "Success is the sum of small efforts repeated day in and day out.",
      author: "Robert Collier"
    },
    {
      text: "Lack of direction, not lack of time, is the problem. We all have twenty-four hour days.",
      author: "Zig Ziglar"
    },
    {
      text: "The ability to focus and to concentrate is among the most important of human skills.",
      author: "Robert Greene"
    },
    {
      text: "Where focus goes, energy flows.",
      author: "Tony Robbins"
    }
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  const quoteText = document.getElementById('motivationalQuote');
  const quoteAuthor = document.getElementById('quoteAuthor');
  
  if (quoteText && quoteAuthor) {
    quoteText.textContent = randomQuote.text;
    quoteAuthor.textContent = `— ${randomQuote.author}`;
    console.log('💭 Quote loaded');
  }
}

function initializeMathChallenge() {
  console.log('🧮 Initializing math challenge system...');
  
  // Generate first problem
  generateMathProblem();
  updateProgress();
  
  // Setup event listeners
  setupMathEventListeners();
  
  // Focus on input
  const answerInput = document.getElementById('answerInput');
  if (answerInput) {
    answerInput.focus();
  }
  
  console.log('✅ Math challenge system ready');
}

function setupMathEventListeners() {
  const solveBtn = document.getElementById('solveBtn');
  const giveUpBtn = document.getElementById('giveUpBtn');
  const answerInput = document.getElementById('answerInput');

  if (solveBtn) {
    solveBtn.addEventListener('click', () => checkAnswer());
  }

  if (giveUpBtn) {
    giveUpBtn.addEventListener('click', () => {
      console.log('👈 User chose to go back');
      window.history.back();
    });
  }
  
  if (answerInput) {
    answerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        checkAnswer();
      }
    });
  }

  // Break selection buttons (will be added dynamically)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('break-btn')) {
      const minutes = parseInt(e.target.dataset.minutes);
      console.log('🎯 Break button clicked:', minutes, 'minutes for site:', currentSite);
      grantBreakAccess(currentSite, minutes);
    }
  });
}

/**
 * Generate mix of basic arithmetic and algebra problems
 */
function generateMathProblem() {
  const problemTypes = [
    'addition',
    'subtraction', 
    'multiplication',
    'division',
    'linear_equation',
    'simple_fraction'
  ];
  
  const type = problemTypes[Math.floor(Math.random() * problemTypes.length)];
  let problem, answer;
  
  switch (type) {
    case 'addition':
      // Two or three number addition
      const add1 = Math.floor(Math.random() * 150) + 25; // 25-174
      const add2 = Math.floor(Math.random() * 150) + 25; // 25-174
      const add3 = Math.floor(Math.random() * 100) + 10; // 10-109
      if (Math.random() > 0.5) {
        problem = `${add1} + ${add2} + ${add3}`;
        answer = add1 + add2 + add3;
      } else {
        problem = `${add1} + ${add2}`;
        answer = add1 + add2;
      }
      break;
      
    case 'subtraction':
      // Subtraction ensuring positive result
      const sub1 = Math.floor(Math.random() * 200) + 100; // 100-299
      const sub2 = Math.floor(Math.random() * 90) + 10; // 10-99
      problem = `${sub1} - ${sub2}`;
      answer = sub1 - sub2;
      break;
      
    case 'multiplication':
      // Two digit multiplication
      const mult1 = Math.floor(Math.random() * 25) + 10; // 10-34
      const mult2 = Math.floor(Math.random() * 25) + 10; // 10-34
      problem = `${mult1} × ${mult2}`;
      answer = mult1 * mult2;
      break;
      
    case 'division':
      // Division with whole number result
      const div_divisor = Math.floor(Math.random() * 12) + 3; // 3-14
      const div_quotient = Math.floor(Math.random() * 20) + 5; // 5-24
      const div_dividend = div_divisor * div_quotient;
      problem = `${div_dividend} ÷ ${div_divisor}`;
      answer = div_quotient;
      break;
      
    case 'linear_equation':
      // Simple algebra: ax + b = c
      const eq_a = Math.floor(Math.random() * 8) + 2; // 2-9
      const eq_b = Math.floor(Math.random() * 20) - 10; // -10 to 9
      const eq_x = Math.floor(Math.random() * 10) + 1; // 1-10
      const eq_c = eq_a * eq_x + eq_b;
      problem = `${eq_a}x ${eq_b >= 0 ? '+' : ''} ${eq_b} = ${eq_c}`;
      answer = eq_x;
      break;
      
    case 'simple_fraction':
      // a/x = b, solve for x (ensuring integer result)
      const frac_denominator = Math.floor(Math.random() * 8) + 2; // 2-9
      const frac_result = Math.floor(Math.random() * 15) + 3; // 3-17 (integer result)
      const frac_numerator = frac_denominator * frac_result; // This ensures division results in integer
      problem = `${frac_numerator} ÷ x = ${frac_result}`;
      answer = frac_denominator;
      break;
      
    default:
      // Fallback to simple addition
      const fallback1 = Math.floor(Math.random() * 100) + 50;
      const fallback2 = Math.floor(Math.random() * 100) + 50;
      problem = `${fallback1} + ${fallback2}`;
      answer = fallback1 + fallback2;
      break;
  }
  
  mathChallenge.currentProblem = problem;
  mathChallenge.correctAnswer = answer;
  
  const mathProblemDiv = document.getElementById('mathProblem');
  if (mathProblemDiv) {
    mathProblemDiv.textContent = `${problem} = ?`;
  }
  
  console.log(`🧮 Generated problem: ${problem} = ${answer}`);
}

function updateProgress() {
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  
  if (progressText) {
    progressText.textContent = `${mathChallenge.correctAnswers}/${mathChallenge.requiredCorrect}`;
  }
  
  if (progressFill) {
    const percentage = (mathChallenge.correctAnswers / mathChallenge.requiredCorrect) * 100;
    progressFill.style.width = `${percentage}%`;
  }
}

function checkAnswer() {
  const answerInput = document.getElementById('answerInput');
  const userAnswer = parseFloat(answerInput.value);
  
  if (isNaN(userAnswer)) {
    showFeedback('Please enter a valid number', 'error');
    return;
  }
  
  // Allow small floating point tolerance
  const tolerance = 0.01;
  const isCorrect = Math.abs(userAnswer - mathChallenge.correctAnswer) < tolerance;
  
  if (isCorrect) {
    mathChallenge.correctAnswers++;
    updateProgress();
    
    if (mathChallenge.correctAnswers >= mathChallenge.requiredCorrect) {
      // All problems solved!
      showFeedback('🎉 All problems solved! Choose your break time...', 'success');
      setTimeout(() => {
        showBreakSelection();
      }, 2000);
    } else {
      // More problems to solve
      const remaining = mathChallenge.requiredCorrect - mathChallenge.correctAnswers;
      showFeedback(`✅ Correct! ${remaining} more to go...`, 'success');
      setTimeout(() => {
        nextProblem();
      }, 1500);
    }
  } else {
    mathChallenge.attempts--;
    
    if (mathChallenge.attempts > 0) {
      showFeedback(`❌ Incorrect. Try again! (${mathChallenge.attempts} attempts left)`, 'error');
      const attemptsLeft = document.getElementById('attemptsLeft');
      if (attemptsLeft) {
        attemptsLeft.textContent = `${mathChallenge.attempts} attempts remaining`;
      }
      shakeInput();
    } else {
      showFeedback(`No more attempts. Generating new problem...`, 'error');
      setTimeout(() => {
        resetCurrentProblem();
      }, 2000);
    }
  }
  
  answerInput.value = '';
}

function nextProblem() {
  mathChallenge.attempts = 3;
  const attemptsLeft = document.getElementById('attemptsLeft');
  if (attemptsLeft) {
    attemptsLeft.textContent = '3 attempts remaining';
  }
  
  generateMathProblem();
  
  const feedback = document.getElementById('feedback');
  if (feedback) feedback.classList.add('hidden');
  
  const answerInput = document.getElementById('answerInput');
  if (answerInput) answerInput.focus();
}

function resetCurrentProblem() {
  mathChallenge.attempts = 3;
  const attemptsLeft = document.getElementById('attemptsLeft');
  if (attemptsLeft) {
    attemptsLeft.textContent = '3 attempts remaining';
  }
  
  generateMathProblem();
  
  const feedback = document.getElementById('feedback');
  if (feedback) feedback.classList.add('hidden');
  
  const answerInput = document.getElementById('answerInput');
  if (answerInput) answerInput.focus();
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.className = `feedback-message ${type === 'error' ? 'error-message' : 'success-message'}`;
    feedback.textContent = message;
    feedback.classList.remove('hidden');
  }
}

function shakeInput() {
  const input = document.getElementById('answerInput');
  if (input) {
    input.classList.add('error');
    setTimeout(() => {
      input.classList.remove('error');
    }, 500);
  }
}

function showBreakSelection() {
  const mathSection = document.getElementById('mathChallengeSection');
  const breakSelection = document.getElementById('breakSelection');
  
  if (mathSection) mathSection.style.display = 'none';
  if (breakSelection) breakSelection.style.display = 'flex';
  
  console.log('🎉 All problems completed! Showing break selection...');
}

// FIXED: Improved break access granting with better redirect
function grantBreakAccess(site, minutes) {
  console.log(`🚀 Granting ${minutes} minute break for ${site}`);
  
  // Show success message immediately
  const breakSelection = document.getElementById('breakSelection');
  const successMessage = document.getElementById('successMessage');
  const successTitle = document.getElementById('successTitle');
  
  if (breakSelection) breakSelection.style.display = 'none';
  if (successMessage) successMessage.style.display = 'flex';
  if (successTitle) {
    successTitle.textContent = `You have ${minutes} minutes of access`;
  }
  
  // FIXED: Ensure domain is clean before sending
  const cleanSite = site.toLowerCase().replace(/^www\./, '');
  
  // Check if Chrome extension API is available
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    console.log('📤 Sending message to background script...');
    console.log('🔍 Site:', cleanSite, 'Minutes:', minutes);
    
    // Send message to background script to grant access
    chrome.runtime.sendMessage({
      action: 'grantTempAccess',
      site: cleanSite,
      minutes: minutes
    }, (response) => {
      console.log('📥 Background script response:', response);
      
      if (chrome.runtime.lastError) {
        console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
        console.log('⚠️ Continuing with redirect despite error...');
      }
      
      if (!response || !response.success) {
        console.log('⚠️ Background script issue, but proceeding with redirect...');
        // FIXED: Wait a moment for background script to process, then redirect
        setTimeout(() => {
          startRedirectCountdown(cleanSite, minutes);
        }, 1000); // 1 second delay to ensure temporary access is set
      } else {
        console.log('✅ Access granted successfully by background script');
        // DO NOT start redirect countdown here, background script will handle it.
      }
    });
  } else {
    console.log('🔄 Chrome extension API not available - starting redirect anyway');
    // Still start countdown even without API
    setTimeout(() => {
      startRedirectCountdown(cleanSite, minutes);
    }, 1000);
  }
}

// FIXED: Improved countdown and redirect system
function startRedirectCountdown(site, minutes) {
  console.log('⏰ Starting redirect countdown for:', site);
  
  let seconds = 3;
  const countdownElement = document.getElementById('countdown');
  
  const interval = setInterval(() => {
    if (countdownElement) {
      countdownElement.textContent = seconds;
    }
    
    console.log(`⏰ Countdown: ${seconds} seconds remaining`);
    seconds--;
    
    if (seconds < 0) {
      clearInterval(interval);
      console.log('🔗 Starting redirect process for:', site);
      
      // FIXED: Use current tab update instead of trying to redirect
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        // Try to get current tab and update it
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            const targetUrl = `https://${site}`;
            console.log('🎯 Redirecting current tab to:', targetUrl);
            chrome.tabs.update(tabs[0].id, {url: targetUrl}, (tab) => {
              if (chrome.runtime.lastError) {
                console.error('❌ Tab update failed:', chrome.runtime.lastError);
                // Fallback to window.location
                fallbackRedirect(site);
              } else {
                console.log('✅ Tab redirected successfully');
              }
            });
          } else {
            // Fallback to window.location
            fallbackRedirect(site);
          }
        });
      } else {
        // Fallback to window.location
        fallbackRedirect(site);
      }
    }
  }, 1000);
}

// FIXED: Fallback redirect method
function fallbackRedirect(site) {
  console.log('🔄 Using fallback redirect for:', site);
  
  // Build target URL
  const targetUrls = [
    `https://${site}`,
    `https://www.${site}`,
    `http://${site}`,
    `http://www.${site}`
  ];
  
  console.log('🎯 Trying fallback redirect URLs:', targetUrls);
  
  // Method 1: Direct window.location.href
  try {
    console.log('📍 Fallback Method 1: window.location.href');
    window.location.href = targetUrls[0];
  } catch (error) {
    console.error('❌ Fallback Method 1 failed:', error);
    
    // Method 2: window.location.replace
    setTimeout(() => {
      try {
        console.log('📍 Fallback Method 2: window.location.replace');
        window.location.replace(targetUrls[0]);
      } catch (error2) {
        console.error('❌ Fallback Method 2 failed:', error2);
        
        // Method 3: Show manual link
        setTimeout(() => {
          showManualRedirectOption(site);
        }, 500);
      }
    }, 300);
  }
}

// FIXED: Improved manual redirect fallback
function showManualRedirectOption(site) {
  console.log('🆘 All redirect methods failed, showing manual option');
  
  const successMessage = document.getElementById('successMessage');
  if (successMessage) {
    successMessage.innerHTML = `
      <div>
        <div class="challenge-title">🔗 Manual Redirect Required</div>
        <div class="success-content">
          <h3>Automatic redirect failed</h3>
          <p>Your temporary access has been granted!</p>
          <p>Please click the link below to visit your site:</p>
          <div style="margin: 20px 0;">
            <a href="https://${site}" target="_blank" style="
              display: inline-block;
              background: linear-gradient(135deg, #D4735A 0%, #E89B3F 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
            ">🚀 Go to ${site}</a>
          </div>
          <p style="font-size: 12px; opacity: 0.7;">
            You can also manually type the website address in a new tab.
          </p>
        </div>
      </div>
    `;
    
    // Add click handler for the manual link
    const manualLink = successMessage.querySelector('a');
    if (manualLink) {
      manualLink.addEventListener('click', (e) => {
        console.log('👆 Manual link clicked');
        // Open in new tab and close current tab
        setTimeout(() => {
          try {
            window.close();
          } catch (error) {
            console.log('Could not close tab automatically');
          }
        }, 1000);
      });
    }
  }
}

// DEBUGGING: Test function you can call from browser console
window.testRedirect = function(site = currentSite) {
  console.log('🧪 Testing redirect to:', site);
  fallbackRedirect(site);
};

// DEBUGGING: Test function to check background communication
window.testBackgroundComm = function() {
  console.log('🧪 Testing background communication...');
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      action: 'grantTempAccess',
      site: currentSite,
      minutes: 1
    }, (response) => {
      console.log('🧪 Test response:', response);
      if (chrome.runtime.lastError) {
        console.error('🧪 Test error:', chrome.runtime.lastError);
      }
    });
  } else {
    console.log('🧪 Chrome API not available');
  }
};

console.log('✅ Blocked page script loaded successfully');
console.log('🧪 Debug functions available: testRedirect(), testBackgroundComm()');