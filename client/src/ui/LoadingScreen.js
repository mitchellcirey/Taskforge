export class LoadingScreen {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.currentHintIndex = 0;
    this.hintInterval = null;
    this.hints = [
      "Program villagers to automate tasks",
      "Press B to open building placement",
      "Press C to view blueprints and crafting",
      "Chop trees to gather wood resources",
      "Build storage buildings to organize resources",
      "Use 'Repeat Forever' to create automated loops",
      "Villagers can work independently once programmed",
      "Combine resources in crafting stations",
      "Create efficient production chains with multiple villagers",
      "Use the blueprint system to discover new recipes"
    ];
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'loading-screen';
    
    // Create gear SVG icon - simplified gear shape
    const gearIcon = `
      <svg class="gear-icon" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Gear teeth (8 teeth) -->
        <g fill="#6FD6FF" opacity="0.95">
          <!-- Top tooth -->
          <rect x="45" y="5" width="10" height="15" rx="2"/>
          <!-- Right tooth -->
          <rect x="80" y="45" width="15" height="10" rx="2"/>
          <!-- Bottom tooth -->
          <rect x="45" y="80" width="10" height="15" rx="2"/>
          <!-- Left tooth -->
          <rect x="5" y="45" width="15" height="10" rx="2"/>
          <!-- Top-right tooth -->
          <rect x="70" y="15" width="10" height="12" rx="2" transform="rotate(45 75 21)"/>
          <!-- Bottom-right tooth -->
          <rect x="70" y="73" width="10" height="12" rx="2" transform="rotate(-45 75 79)"/>
          <!-- Bottom-left tooth -->
          <rect x="20" y="73" width="10" height="12" rx="2" transform="rotate(45 25 79)"/>
          <!-- Top-left tooth -->
          <rect x="20" y="15" width="10" height="12" rx="2" transform="rotate(-45 25 21)"/>
        </g>
        <!-- Outer ring -->
        <circle cx="50" cy="50" r="35" fill="none" stroke="#6FD6FF" stroke-width="3" opacity="0.6"/>
        <!-- Inner circle -->
        <circle cx="50" cy="50" r="20" fill="#1a1a1a"/>
        <!-- Center hole -->
        <circle cx="50" cy="50" r="8" fill="#0a0a0a"/>
        <!-- Inner ring highlight -->
        <circle cx="50" cy="50" r="20" fill="none" stroke="#6FD6FF" stroke-width="2" opacity="0.4"/>
      </svg>
    `;
    
    this.element.innerHTML = `
      <div class="loading-logo-top-right">
        <img src="public/images/taskforge_logo.png" alt="Taskforge" class="logo-image">
      </div>
      <div class="loading-content">
        <div class="loading-gear">
          ${gearIcon}
        </div>
        <div class="loading-progress">
          <div class="loading-percentage">0%</div>
          <p class="loading-text">Loading...</p>
        </div>
      </div>
      <div class="loading-hints">
        <div class="hints-label">Helpful Hints:</div>
        <div class="hint-text"></div>
      </div>
      <div class="loading-background-animation"></div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('public/images/bgmenu.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        transition: opacity 0.5s ease-out;
        overflow: hidden;
        animation: kenBurns 25s ease-in-out infinite;
      }

      #loading-screen::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(10, 10, 10, 0.7) 0%, rgba(26, 26, 46, 0.6) 50%, rgba(22, 33, 62, 0.7) 100%);
        z-index: 1;
      }

      @keyframes kenBurns {
        0% {
          background-size: 100%;
          background-position: center center;
        }
        50% {
          background-size: 110%;
          background-position: 60% 40%;
        }
        100% {
          background-size: 100%;
          background-position: center center;
        }
      }

      #loading-screen.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .loading-background-animation {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
          radial-gradient(circle at 20% 50%, rgba(111, 214, 255, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(111, 214, 255, 0.03) 0%, transparent 50%);
        animation: backgroundPulse 8s ease-in-out infinite;
        pointer-events: none;
        z-index: 2;
      }

      @keyframes backgroundPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.1); }
      }

      .loading-logo-top-right {
        position: fixed;
        top: 30px;
        right: 30px;
        z-index: 100000;
      }

      .logo-image {
        width: 180px;
        height: auto;
        filter: drop-shadow(0 0 10px rgba(111, 214, 255, 0.3));
        animation: logoGlow 3s ease-in-out infinite;
      }

      @keyframes logoGlow {
        0%, 100% { filter: drop-shadow(0 0 10px rgba(111, 214, 255, 0.3)); }
        50% { filter: drop-shadow(0 0 20px rgba(111, 214, 255, 0.6)); }
      }

      .loading-content {
        text-align: center;
        position: relative;
        z-index: 100001;
      }

      .loading-gear {
        margin: 20px 0;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .gear-icon {
        animation: gearRotate 2s linear infinite;
        filter: drop-shadow(0 0 15px rgba(111, 214, 255, 0.6));
      }

      @keyframes gearRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-progress {
        margin-top: 30px;
      }

      .loading-percentage {
        color: #6FD6FF;
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 15px;
        font-family: 'Arial', sans-serif;
        text-shadow: 0 0 20px rgba(111, 214, 255, 0.8), 0 0 40px rgba(111, 214, 255, 0.4);
        animation: percentagePulse 2s ease-in-out infinite;
      }

      @keyframes percentagePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .loading-text {
        color: #6FD6FF;
        font-size: 20px;
        font-family: 'Arial', sans-serif;
        min-height: 28px;
        text-shadow: 0 0 10px rgba(111, 214, 255, 0.5);
        letter-spacing: 1px;
      }

      .loading-hints {
        position: fixed;
        bottom: 40px;
        left: 40px;
        z-index: 100000;
        max-width: 400px;
      }

      .hints-label {
        color: #6FD6FF;
        font-size: 16px;
        font-weight: bold;
        font-family: 'Arial', sans-serif;
        margin-bottom: 12px;
        text-shadow: 0 0 10px rgba(111, 214, 255, 0.5);
        letter-spacing: 1px;
        opacity: 0.9;
      }

      .hint-text {
        color: #6FD6FF;
        font-size: 18px;
        font-family: 'Arial', sans-serif;
        line-height: 1.5;
        text-shadow: 0 0 8px rgba(111, 214, 255, 0.4);
        min-height: 54px;
        opacity: 0;
        animation: hintFadeIn 0.5s ease-in forwards;
      }

      @keyframes hintFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .hint-text.fade-out {
        animation: hintFadeOut 0.5s ease-out forwards;
      }

      @keyframes hintFadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  show() {
    if (!this.element) {
      this.create();
    }
    // Append to body to ensure it's on top of everything
    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    } else if (this.element.parentNode !== document.body) {
      // If it's in a different parent, move it to body
      this.element.parentNode.removeChild(this.element);
      document.body.appendChild(this.element);
    }
    this.element.classList.remove('hidden');
    // Force display to ensure visibility
    this.element.style.display = 'flex';
    this.element.style.opacity = '1';
    
    // Start cycling through hints
    this.startHintCycle();
  }

  hide() {
    // Stop hint cycling
    this.stopHintCycle();
    
    this.element.classList.add('hidden');
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 500);
    // Also set display to none after transition
    setTimeout(() => {
      if (this.element) {
        this.element.style.display = 'none';
      }
    }, 500);
  }

  startHintCycle() {
    // Clear any existing interval
    this.stopHintCycle();
    
    // Show first hint immediately
    this.updateHint();
    
    // Cycle through hints every 2.5 seconds
    this.hintInterval = setInterval(() => {
      this.updateHint();
    }, 2500);
  }

  stopHintCycle() {
    if (this.hintInterval) {
      clearInterval(this.hintInterval);
      this.hintInterval = null;
    }
  }

  updateHint() {
    if (!this.element) return;
    
    const hintTextElement = this.element.querySelector('.hint-text');
    if (!hintTextElement) return;
    
    // Fade out current hint
    hintTextElement.classList.add('fade-out');
    
    setTimeout(() => {
      // Update to next hint
      this.currentHintIndex = (this.currentHintIndex + 1) % this.hints.length;
      hintTextElement.textContent = this.hints[this.currentHintIndex];
      
      // Remove fade-out class and trigger fade-in
      hintTextElement.classList.remove('fade-out');
      // Force reflow to restart animation
      void hintTextElement.offsetWidth;
    }, 500);
  }

  setLoadingMessage(message) {
    if (!this.element) return;
    const loadingText = this.element.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
    }
  }

  setProgress(percentage) {
    if (!this.element) return;
    const percentageElement = this.element.querySelector('.loading-percentage');
    if (percentageElement) {
      percentageElement.textContent = `${Math.round(percentage)}%`;
    }
  }
}


