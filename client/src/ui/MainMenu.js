export class MainMenu {
  constructor(container, gameState, audioManager) {
    this.container = container;
    this.gameState = gameState;
    this.audioManager = audioManager;
    this.element = null;
    this.onPlayCallback = null;
    this.onLoadGameCallback = null;
    this.onMultiplayerCallback = null;
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
          <p class="logo-subtitle">Automation</p>
        </div>
        <div class="menu-buttons-container">
          <div class="menu-button-group primary-actions">
            <button class="menu-button primary" id="play-button">
              <span class="button-icon">▶</span>
              <span class="button-text">Play</span>
            </button>
            <button class="menu-button primary" id="load-game-button">
              <span class="button-icon">📂</span>
              <span class="button-text">Load Game</span>
            </button>
            <button class="menu-button primary" id="multiplayer-button">
              <span class="button-icon">🌐</span>
              <span class="button-text">Multiplayer</span>
            </button>
          </div>
          <div class="menu-button-group secondary-actions">
            <button class="menu-button secondary" id="achievements-button">
              <span class="button-icon">🏆</span>
              <span class="button-text">Achievements</span>
            </button>
            <button class="menu-button secondary" id="settings-button">
              <span class="button-icon">⚙️</span>
              <span class="button-text">Settings</span>
            </button>
            <button class="menu-button secondary" id="credits-button">
              <span class="button-icon">ℹ️</span>
              <span class="button-text">Credits</span>
            </button>
          </div>
          <div class="menu-button-group exit-actions">
            <button class="menu-button exit" id="quit-button">
              <span class="button-icon">✕</span>
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
        width: 100%;
        height: 100%;
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
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0a0a0a 100%);
        background-size: 400% 400%;
        animation: gradientShift 15s ease infinite;
      }

      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .menu-background::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 50% 50%, rgba(111, 214, 255, 0.05) 0%, transparent 70%);
        animation: pulse 4s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.8; }
      }

      .menu-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 40px;
        text-align: center;
      }

      .menu-logo {
        margin-bottom: 80px;
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
        max-width: 450px;
        max-height: 220px;
        margin-bottom: 20px;
        filter: drop-shadow(0 0 30px rgba(111, 214, 255, 0.4));
        animation: logoGlow 3s ease-in-out infinite;
      }

      @keyframes logoGlow {
        0%, 100% { filter: drop-shadow(0 0 30px rgba(111, 214, 255, 0.4)); }
        50% { filter: drop-shadow(0 0 50px rgba(111, 214, 255, 0.7)); }
      }

      .logo-text {
        color: #6FD6FF;
        font-size: 72px;
        margin: 0 0 15px 0;
        text-shadow: 0 0 40px rgba(111, 214, 255, 0.8), 0 0 80px rgba(111, 214, 255, 0.4);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 4px;
      }

      .logo-subtitle {
        color: #6FD6FF;
        font-size: 36px;
        margin: 0;
        text-shadow: 0 0 25px rgba(111, 214, 255, 0.6), 0 0 50px rgba(111, 214, 255, 0.3);
        font-family: 'Arial', sans-serif;
        letter-spacing: 2px;
        opacity: 0.9;
      }

      .menu-buttons-container {
        display: flex;
        flex-direction: column;
        gap: 30px;
        align-items: center;
        width: 100%;
        max-width: 600px;
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
        gap: 18px;
        width: 100%;
        align-items: center;
      }

      .menu-button-group.primary-actions {
        margin-bottom: 10px;
      }

      .menu-button-group.secondary-actions {
        margin-bottom: 10px;
      }

      .menu-button-group.exit-actions {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(111, 214, 255, 0.2);
      }

      .menu-button {
        position: relative;
        background: rgba(26, 26, 26, 0.85);
        border: 2px solid #6FD6FF;
        border-radius: 10px;
        color: #6FD6FF;
        font-size: 22px;
        padding: 18px 50px;
        min-width: 280px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Arial', sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(111, 214, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        overflow: hidden;
      }

      .menu-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(111, 214, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }

      .menu-button:hover::before {
        left: 100%;
      }

      .menu-button:hover {
        background: rgba(111, 214, 255, 0.15);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(111, 214, 255, 0.6);
        transform: translateY(-3px) scale(1.02);
        border-color: #8FE5FF;
      }

      .menu-button:active {
        transform: translateY(-1px) scale(1.01);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4), 0 0 20px rgba(111, 214, 255, 0.4);
      }

      .menu-button.primary {
        font-size: 24px;
        padding: 20px 55px;
        min-width: 300px;
        border-width: 3px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5), 0 0 25px rgba(111, 214, 255, 0.15);
      }

      .menu-button.primary:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6), 0 0 40px rgba(111, 214, 255, 0.7);
      }

      .menu-button.secondary {
        font-size: 20px;
        padding: 15px 45px;
        min-width: 260px;
        opacity: 0.95;
      }

      .menu-button.exit {
        font-size: 18px;
        padding: 12px 40px;
        min-width: 220px;
        opacity: 0.9;
        border-color: rgba(111, 214, 255, 0.6);
      }

      .menu-button.exit:hover {
        background: rgba(255, 80, 80, 0.15);
        border-color: rgba(255, 120, 120, 0.8);
        color: #ff8888;
      }

      .button-icon {
        font-size: 1.2em;
        filter: drop-shadow(0 0 8px rgba(111, 214, 255, 0.6));
        transition: transform 0.3s ease;
      }

      .menu-button:hover .button-icon {
        transform: scale(1.2) rotate(5deg);
      }

      .menu-button.exit:hover .button-icon {
        transform: scale(1.2) rotate(-5deg);
      }

      .button-text {
        text-shadow: 0 0 12px rgba(111, 214, 255, 0.6);
        font-weight: 500;
        letter-spacing: 1px;
      }

      .menu-button.exit .button-text {
        text-shadow: 0 0 10px rgba(255, 120, 120, 0.5);
      }
    `;
    document.head.appendChild(style);

    this.setupEventListeners();
  }

  setupEventListeners() {
    const playButton = this.element.querySelector('#play-button');
    const loadGameButton = this.element.querySelector('#load-game-button');
    const multiplayerButton = this.element.querySelector('#multiplayer-button');
    const achievementsButton = this.element.querySelector('#achievements-button');
    const settingsButton = this.element.querySelector('#settings-button');
    const creditsButton = this.element.querySelector('#credits-button');
    const quitButton = this.element.querySelector('#quit-button');

    playButton.addEventListener('click', () => {
      if (this.onPlayCallback) {
        this.onPlayCallback();
      }
    });

    loadGameButton.addEventListener('click', () => {
      if (this.onLoadGameCallback) {
        this.onLoadGameCallback();
      }
    });

    multiplayerButton.addEventListener('click', () => {
      if (this.onMultiplayerCallback) {
        this.onMultiplayerCallback();
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

  onLoadGame(callback) {
    this.onLoadGameCallback = callback;
  }

  onMultiplayer(callback) {
    this.onMultiplayerCallback = callback;
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
