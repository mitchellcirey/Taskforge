export class PlaySubmenu {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onNewGameCallback = null;
    this.onLoadGameCallback = null;
    this.onMultiplayerCallback = null;
    this.onBackCallback = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'play-submenu';
    this.element.innerHTML = `
      <div class="submenu-background"></div>
      <div class="submenu-content">
        <h2 class="submenu-title">Play</h2>
        <div class="submenu-buttons">
          <button class="submenu-button" id="new-game-button">
            <span class="button-text">New Game</span>
          </button>
          <button class="submenu-button" id="load-game-button">
            <span class="button-text">Load Game</span>
          </button>
          <button class="submenu-button" id="multiplayer-button">
            <span class="button-text">Multiplayer</span>
          </button>
          <button class="submenu-button" id="back-button">
            <span class="button-text">Back</span>
          </button>
        </div>
      </div>
    `;

    // Add styles (similar to pause menu style)
    const style = document.createElement('style');
    style.textContent = `
      #play-submenu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2500;
        backdrop-filter: blur(8px);
      }

      #play-submenu.visible {
        display: flex;
      }

      .submenu-background {
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

      .submenu-content {
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

      .submenu-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 40px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .submenu-buttons {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        width: 100%;
      }

      .submenu-button {
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

      .submenu-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
        transition: left 0.4s ease;
      }

      .submenu-button:hover::before {
        left: 100%;
      }

      .submenu-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .submenu-button:active {
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
    const newGameButton = this.element.querySelector('#new-game-button');
    const loadGameButton = this.element.querySelector('#load-game-button');
    const multiplayerButton = this.element.querySelector('#multiplayer-button');
    const backButton = this.element.querySelector('#back-button');

    newGameButton.addEventListener('click', () => {
      this.hide();
      if (this.onNewGameCallback) {
        this.onNewGameCallback();
      }
    });

    loadGameButton.addEventListener('click', () => {
      this.hide();
      if (this.onLoadGameCallback) {
        this.onLoadGameCallback();
      }
    });

    multiplayerButton.addEventListener('click', () => {
      this.hide();
      if (this.onMultiplayerCallback) {
        this.onMultiplayerCallback();
      }
    });

    backButton.addEventListener('click', () => {
      this.hide();
      if (this.onBackCallback) {
        this.onBackCallback();
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

  onNewGame(callback) {
    this.onNewGameCallback = callback;
  }

  onLoadGame(callback) {
    this.onLoadGameCallback = callback;
  }

  onMultiplayer(callback) {
    this.onMultiplayerCallback = callback;
  }

  onBack(callback) {
    this.onBackCallback = callback;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

