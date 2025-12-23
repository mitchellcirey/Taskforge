export class PauseMenu {
  constructor(container, gameState) {
    this.container = container;
    this.gameState = gameState;
    this.element = null;
    this.onResumeCallback = null;
    this.onQuitToMenuCallback = null;
    this.onSettingsCallback = null;
    this.onAchievementsCallback = null;
    this.onSaveWorldCallback = null;
    this.onLoadWorldCallback = null;
    this.create();
    this.setupKeyboardListener();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'pause-menu';
    this.element.innerHTML = `
      <div class="pause-background"></div>
      <div class="pause-content">
        <h2 class="pause-title">Paused</h2>
        <div class="pause-buttons">
          <button class="pause-button" id="resume-button">
            <span class="button-text">Resume</span>
          </button>
          <button class="pause-button" id="save-world-button">
            <span class="button-text">Save World</span>
          </button>
          <button class="pause-button" id="load-world-button">
            <span class="button-text">Load World</span>
          </button>
          <button class="pause-button" id="settings-button">
            <span class="button-text">Settings</span>
          </button>
          <button class="pause-button" id="achievements-button">
            <span class="button-text">Achievements</span>
          </button>
          <button class="pause-button" id="quit-to-menu-button">
            <span class="button-text">Quit to Menu</span>
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #pause-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        backdrop-filter: blur(8px);
      }

      #pause-menu.visible {
        display: flex;
      }

      .pause-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #87CEEB 100%);
        background-size: 100% 200%;
        animation: skyShift 20s ease infinite;
        opacity: 0.85;
      }

      @keyframes skyShift {
        0%, 100% { background-position: 0% 0%; }
        50% { background-position: 0% 100%; }
      }

      .pause-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 50px 60px;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        min-width: 350px;
        animation: fadeInScale 0.3s ease-out;
      }

      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .pause-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 40px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .pause-buttons {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        width: 100%;
      }

      .pause-button {
        position: relative;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 8px;
        color: #1a1a1a;
        font-size: 20px;
        padding: 14px 40px;
        width: 100%;
        min-width: 200px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-transform: uppercase;
        letter-spacing: 1px;
        overflow: hidden;
      }

      .pause-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
        transition: left 0.4s ease;
      }

      .pause-button:hover::before {
        left: 100%;
      }

      .pause-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .pause-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .button-text {
        position: relative;
        z-index: 1;
      }
    `;
    document.head.appendChild(style);

    this.setupEventListeners();
  }

  setupEventListeners() {
    const resumeButton = this.element.querySelector('#resume-button');
    const saveWorldButton = this.element.querySelector('#save-world-button');
    const loadWorldButton = this.element.querySelector('#load-world-button');
    const settingsButton = this.element.querySelector('#settings-button');
    const achievementsButton = this.element.querySelector('#achievements-button');
    const quitToMenuButton = this.element.querySelector('#quit-to-menu-button');

    resumeButton.addEventListener('click', () => {
      this.hide();
      if (this.onResumeCallback) {
        this.onResumeCallback();
      }
    });

    saveWorldButton.addEventListener('click', () => {
      if (this.onSaveWorldCallback) {
        this.onSaveWorldCallback();
      }
    });

    loadWorldButton.addEventListener('click', () => {
      this.hide(); // Hide pause menu when opening load dialog
      if (this.onLoadWorldCallback) {
        this.onLoadWorldCallback();
      }
    });

    settingsButton.addEventListener('click', () => {
      this.hide(); // Hide pause menu when opening settings
      if (this.onSettingsCallback) {
        this.onSettingsCallback();
      }
    });

    achievementsButton.addEventListener('click', () => {
      this.hide(); // Hide pause menu when opening achievements
      if (this.onAchievementsCallback) {
        this.onAchievementsCallback();
      }
    });

    quitToMenuButton.addEventListener('click', () => {
      this.hide();
      if (this.onQuitToMenuCallback) {
        this.onQuitToMenuCallback();
      }
    });
  }

  setupKeyboardListener() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.gameState.getState() === 'playing') {
          this.show();
          this.gameState.setState('paused');
        } else if (this.gameState.getState() === 'paused') {
          this.hide();
          this.gameState.setState('playing');
        }
      }
    });
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.classList.add('visible');
  }

  hide() {
    this.element.classList.remove('visible');
  }

  onResume(callback) {
    this.onResumeCallback = callback;
  }

  onQuitToMenu(callback) {
    this.onQuitToMenuCallback = callback;
  }

  onSettings(callback) {
    this.onSettingsCallback = callback;
  }

  onAchievements(callback) {
    this.onAchievementsCallback = callback;
  }

  onSaveWorld(callback) {
    this.onSaveWorldCallback = callback;
  }

  onLoadWorld(callback) {
    this.onLoadWorldCallback = callback;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

