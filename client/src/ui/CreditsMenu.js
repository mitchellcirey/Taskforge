export class CreditsMenu {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onCloseCallback = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'credits-menu';
    this.element.innerHTML = `
      <div class="credits-background"></div>
      <div class="credits-content">
        <h2 class="credits-title">Credits</h2>
        <div class="credits-section">
          <h3 class="credits-section-title">Game Developer</h3>
          <p class="credits-name">mitchellcirey</p>
        </div>
        <div class="credits-section">
          <h3 class="credits-section-title">Repository</h3>
          <a href="https://github.com/mitchellcirey/Taskforge" target="_blank" rel="noopener noreferrer" class="credits-link">github.com/mitchellcirey/Taskforge</a>
        </div>
        <div class="credits-section">
          <h3 class="credits-section-title">Development Tools</h3>
          <p class="credits-text">Cursor AI</p>
        </div>
        <div class="credits-buttons">
          <button class="credits-button" id="close-credits-button">Close</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #credits-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 5000;
        backdrop-filter: blur(8px);
      }

      #credits-menu.visible {
        display: flex;
      }

      .credits-background {
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

      .credits-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 50px 60px;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        min-width: 400px;
        max-width: 600px;
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

      .credits-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 40px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .credits-section {
        margin-bottom: 30px;
      }

      .credits-section-title {
        color: #1a1a1a;
        font-size: 18px;
        margin: 0 0 12px 0;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.8;
      }

      .credits-name {
        color: #1a1a1a;
        font-size: 28px;
        margin: 0;
        font-family: 'Arial', sans-serif;
        font-weight: bold;
      }

      .credits-text {
        color: #1a1a1a;
        font-size: 22px;
        margin: 0;
        font-family: 'Arial', sans-serif;
      }

      .credits-link {
        color: #1a1a1a;
        font-size: 20px;
        margin: 0;
        font-family: 'Arial', sans-serif;
        text-decoration: underline;
        display: inline-block;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
        font-weight: 600;
      }

      .credits-link:hover {
        color: #34495e;
        border-bottom-color: #34495e;
        transform: translateY(-1px);
      }

      .credits-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 40px;
      }

      .credits-button {
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 8px;
        color: #1a1a1a;
        font-size: 18px;
        padding: 12px 40px;
        min-width: 150px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .credits-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .credits-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(style);

    this.setupEventListeners();
    this.setupKeyboardListener();
  }

  setupKeyboardListener() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.element.classList.contains('visible')) {
        this.hide();
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      }
    });
  }

  setupEventListeners() {
    const closeButton = this.element.querySelector('#close-credits-button');

    closeButton.addEventListener('click', () => {
      this.hide();
      if (this.onCloseCallback) {
        this.onCloseCallback();
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

  onClose(callback) {
    this.onCloseCallback = callback;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

