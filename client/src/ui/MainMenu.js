export class MainMenu {
  constructor(container, gameState, audioManager) {
    this.container = container;
    this.gameState = gameState;
    this.audioManager = audioManager;
    this.element = null;
    this.onPlayCallback = null;
    this.onResumeLastSaveCallback = null;
    this.onAchievementsCallback = null;
    this.onSettingsCallback = null;
    this.onCreditsCallback = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'main-menu';
    this.element.innerHTML = `
      <div class="menu-background"></div>
      <div class="menu-content">
        <div class="menu-logo">
          <img src="public/images/taskforge_logo.png" alt="Taskforge" class="logo-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <h1 class="logo-text" style="display: none;">Taskforge</h1>
        </div>
        <div class="menu-buttons-container">
          <div class="menu-button-group primary-actions">
            <button class="menu-button primary" id="play-button">
              <span class="button-text">Play</span>
            </button>
            <button class="menu-button primary resume-button" id="resume-last-save-button">
              <span class="button-text">Resume Last Save</span>
            </button>
          </div>
          <div class="menu-button-group secondary-actions">
            <button class="menu-button secondary" id="achievements-button">
              <span class="button-text">Achievements</span>
            </button>
            <button class="menu-button secondary" id="settings-button">
              <span class="button-text">Settings</span>
            </button>
            <button class="menu-button secondary" id="credits-button">
              <span class="button-text">Credits</span>
            </button>
          </div>
          <div class="menu-button-group exit-actions">
            <button class="menu-button exit" id="quit-button">
              <span class="button-text">Quit</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #main-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2000;
        transition: opacity 0.3s ease-out;
        overflow: hidden;
      }

      #main-menu.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .menu-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #87CEEB 100%);
        background-size: 100% 200%;
        animation: skyShift 20s ease infinite;
      }

      @keyframes skyShift {
        0%, 100% { background-position: 0% 0%; }
        50% { background-position: 0% 100%; }
      }

      .menu-background::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: 
          radial-gradient(circle at 20% 30%, rgba(135, 206, 235, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(176, 224, 230, 0.3) 0%, transparent 50%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          );
        animation: cloudDrift 30s ease-in-out infinite;
      }

      @keyframes cloudDrift {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(20px); }
      }

      .menu-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        width: 100vw;
        min-height: 100vh;
        padding: clamp(20px, 3vh, 40px);
        padding-top: clamp(30px, 5vh, 60px);
        text-align: center;
        box-sizing: border-box;
        overflow-y: auto;
      }

      .menu-logo {
        margin-bottom: clamp(30px, 4vh, 60px);
        animation: fadeInDown 0.8s ease-out;
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .logo-image {
        max-width: min(500px, 35vw);
        max-height: min(250px, 18vh);
        filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3));
        animation: logoFloat 4s ease-in-out infinite;
      }

      @keyframes logoFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .logo-text {
        color: #2c3e50;
        font-size: clamp(36px, 5vw, 72px);
        margin: 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: clamp(2px, 0.3vw, 4px);
      }

      .menu-buttons-container {
        display: flex;
        flex-direction: column;
        gap: clamp(10px, 1.5vh, 16px);
        align-items: center;
        width: 100%;
        max-width: 320px;
        animation: fadeInUp 1s ease-out 0.3s both;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .menu-button-group {
        display: flex;
        flex-direction: column;
        gap: clamp(8px, 1vh, 12px);
        width: 100%;
        align-items: center;
      }

      .menu-button-group.primary-actions {
        margin-bottom: clamp(4px, 0.5vh, 8px);
      }

      .menu-button-group.secondary-actions {
        margin-bottom: clamp(4px, 0.5vh, 8px);
      }

      .menu-button-group.exit-actions {
        margin-top: clamp(10px, 1.5vh, 16px);
        padding-top: clamp(10px, 1.5vh, 16px);
        border-top: 2px solid rgba(44, 62, 80, 0.2);
      }

      .menu-button {
        position: relative;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 8px;
        color: #2c3e50;
        font-size: 20px;
        padding: 14px 40px;
        width: 100%;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-transform: uppercase;
        letter-spacing: 1px;
        overflow: hidden;
      }

      .menu-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
        transition: left 0.4s ease;
      }

      .menu-button:hover::before {
        left: 100%;
      }

      .menu-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .menu-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .menu-button.primary {
        font-size: 22px;
        padding: 16px 40px;
        border-width: 3px;
        background: rgba(255, 255, 255, 0.98);
      }

      .menu-button.primary.resume-button {
        font-size: 18px;
      }

      .menu-button.secondary {
        font-size: 18px;
        padding: 12px 40px;
        background: rgba(255, 255, 255, 0.9);
      }

      .menu-button.exit {
        font-size: 16px;
        padding: 10px 40px;
        background: rgba(255, 255, 255, 0.85);
        border-color: rgba(231, 76, 60, 0.6);
        color: #c0392b;
      }

      .menu-button.exit:hover {
        background: rgba(231, 76, 60, 0.1);
        border-color: #e74c3c;
        color: #e74c3c;
      }

      .button-text {
        position: relative;
        z-index: 1;
      }

      /* Media queries for very small viewports */
      @media (max-height: 600px) {
        .menu-logo {
          margin-bottom: clamp(15px, 2vh, 30px);
        }

        .logo-image {
          max-width: min(300px, 30vw);
          max-height: min(150px, 15vh);
        }

        .logo-text {
          font-size: clamp(28px, 4vw, 48px);
        }

        .menu-buttons-container {
          gap: clamp(6px, 1vh, 12px);
        }

        .menu-button {
          padding: clamp(8px, 1vh, 12px) clamp(20px, 3vw, 30px);
          font-size: clamp(14px, 2vw, 18px);
        }

        .menu-button.primary {
          font-size: clamp(16px, 2.2vw, 20px);
          padding: clamp(10px, 1.2vh, 14px) clamp(25px, 3.5vw, 35px);
        }

        .menu-button.primary.resume-button {
          font-size: clamp(14px, 2vw, 16px);
        }

        .menu-button.secondary {
          font-size: clamp(14px, 2vw, 16px);
          padding: clamp(8px, 1vh, 10px) clamp(20px, 3vw, 30px);
        }

        .menu-button.exit {
          font-size: clamp(12px, 1.8vw, 14px);
          padding: clamp(6px, 0.8vh, 8px) clamp(18px, 2.5vw, 25px);
        }
      }
    `;
    document.head.appendChild(style);

    this.setupEventListeners();
  }

  setupEventListeners() {
    const playButton = this.element.querySelector('#play-button');
    const resumeLastSaveButton = this.element.querySelector('#resume-last-save-button');
    const achievementsButton = this.element.querySelector('#achievements-button');
    const settingsButton = this.element.querySelector('#settings-button');
    const creditsButton = this.element.querySelector('#credits-button');
    const quitButton = this.element.querySelector('#quit-button');

    playButton.addEventListener('click', () => {
      if (this.onPlayCallback) {
        this.onPlayCallback();
      }
    });

    resumeLastSaveButton.addEventListener('click', () => {
      if (this.onResumeLastSaveCallback) {
        this.onResumeLastSaveCallback();
      }
    });

    achievementsButton.addEventListener('click', () => {
      if (this.onAchievementsCallback) {
        this.onAchievementsCallback();
      }
    });

    settingsButton.addEventListener('click', () => {
      if (this.onSettingsCallback) {
        this.onSettingsCallback();
      }
    });

    creditsButton.addEventListener('click', () => {
      if (this.onCreditsCallback) {
        this.onCreditsCallback();
      }
    });

    quitButton.addEventListener('click', () => {
      if (window.electronAPI && window.electronAPI.quit) {
        // Electron app
        window.electronAPI.quit();
      } else {
        // Web browser
        window.close();
      }
    });
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.classList.remove('hidden');
    
    // Play menu music
    if (this.audioManager) {
      this.audioManager.playMusic('main_menu');
    }
  }

  hide() {
    this.element.classList.add('hidden');
    
    // Stop menu music
    if (this.audioManager) {
      this.audioManager.stopMusic();
    }
  }

  onPlay(callback) {
    this.onPlayCallback = callback;
  }

  onResumeLastSave(callback) {
    this.onResumeLastSaveCallback = callback;
  }

  onAchievements(callback) {
    this.onAchievementsCallback = callback;
  }

  onSettings(callback) {
    this.onSettingsCallback = callback;
  }

  onCredits(callback) {
    this.onCreditsCallback = callback;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
