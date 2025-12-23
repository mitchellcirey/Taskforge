export class SettingsMenu {
  constructor(container, tileGrid = null) {
    this.container = container;
    this.tileGrid = tileGrid;
    this.element = null;
    this.gridVisible = true; // Default to visible
    this.onCloseCallback = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'settings-menu';
    this.element.innerHTML = `
      <div class="settings-content">
        <h2 class="settings-title">Settings</h2>
        <div class="settings-options">
          ${this.tileGrid ? `
          <div class="settings-option">
            <label class="settings-label">
              <input type="checkbox" id="grid-toggle" ${this.gridVisible ? 'checked' : ''}>
              <span class="checkbox-label">Show Grid</span>
            </label>
          </div>
          ` : `
          <div class="settings-option">
            <p class="settings-info">Game settings will be available after starting a game.</p>
          </div>
          `}
        </div>
        <div class="settings-buttons">
          <button class="settings-button" id="close-settings-button">Close</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #settings-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 4000;
        backdrop-filter: blur(5px);
      }

      #settings-menu.visible {
        display: flex;
      }

      .settings-content {
        text-align: center;
        padding: 40px;
        background: rgba(26, 26, 26, 0.95);
        border: 3px solid #6FD6FF;
        border-radius: 12px;
        box-shadow: 0 0 30px rgba(111, 214, 255, 0.5);
        min-width: 400px;
      }

      .settings-title {
        color: #6FD6FF;
        font-size: 36px;
        margin: 0 0 30px 0;
        text-shadow: 0 0 20px rgba(111, 214, 255, 0.6);
        font-family: 'Arial', sans-serif;
      }

      .settings-options {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 30px;
        align-items: flex-start;
      }

      .settings-option {
        width: 100%;
      }

      .settings-label {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #ffffff;
        font-size: 18px;
        cursor: pointer;
        user-select: none;
      }

      .settings-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #6FD6FF;
      }

      .checkbox-label {
        color: #ffffff;
        font-family: 'Arial', sans-serif;
      }

      .settings-info {
        color: rgba(255, 255, 255, 0.7);
        font-size: 16px;
        font-family: 'Arial', sans-serif;
        font-style: italic;
        text-align: center;
        margin: 0;
      }

      .settings-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
      }

      .settings-button {
        background: rgba(26, 26, 26, 0.8);
        border: 2px solid #6FD6FF;
        border-radius: 8px;
        color: #6FD6FF;
        font-size: 18px;
        padding: 12px 30px;
        min-width: 150px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Arial', sans-serif;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }

      .settings-button:hover {
        background: rgba(111, 214, 255, 0.2);
        box-shadow: 0 0 20px rgba(111, 214, 255, 0.5);
        transform: translateY(-2px);
      }

      .settings-button:active {
        transform: translateY(0);
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
    const gridToggle = this.element.querySelector('#grid-toggle');
    const closeButton = this.element.querySelector('#close-settings-button');

    if (gridToggle) {
      gridToggle.addEventListener('change', (e) => {
        this.gridVisible = e.target.checked;
        this.updateGridVisibility();
      });
    }

    closeButton.addEventListener('click', () => {
      this.hide();
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    });
  }

  setTileGrid(tileGrid) {
    this.tileGrid = tileGrid;
    // Update the UI if settings menu is already created
    if (this.element && tileGrid) {
      const settingsOptions = this.element.querySelector('.settings-options');
      if (settingsOptions && !settingsOptions.querySelector('#grid-toggle')) {
        settingsOptions.innerHTML = `
          <div class="settings-option">
            <label class="settings-label">
              <input type="checkbox" id="grid-toggle" ${this.gridVisible ? 'checked' : ''}>
              <span class="checkbox-label">Show Grid</span>
            </label>
          </div>
        `;
        const gridToggle = this.element.querySelector('#grid-toggle');
        if (gridToggle) {
          gridToggle.addEventListener('change', (e) => {
            this.gridVisible = e.target.checked;
            this.updateGridVisibility();
          });
        }
      }
    }
  }

  updateGridVisibility() {
    if (this.tileGrid && this.tileGrid.gridHelper) {
      this.tileGrid.gridHelper.visible = this.gridVisible;
    }
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

