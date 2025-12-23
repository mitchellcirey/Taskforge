export class SaveDialog {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onOverwriteCallback = null;
    this.onSaveAsNewCallback = null;
    this.onCancelCallback = null;
    this.existingSaveName = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'save-dialog';
    this.element.innerHTML = `
      <div class="dialog-background"></div>
      <div class="dialog-content">
        <h2 class="dialog-title">Save World</h2>
        <div class="dialog-message" id="save-dialog-message"></div>
        <div class="dialog-buttons">
          <button class="dialog-button" id="overwrite-button">
            <span class="button-text">Overwrite</span>
          </button>
          <button class="dialog-button" id="save-as-new-button">
            <span class="button-text">Save as New</span>
          </button>
          <button class="dialog-button" id="cancel-save-button">
            <span class="button-text">Cancel</span>
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #save-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 4000;
        backdrop-filter: blur(8px);
      }

      #save-dialog.visible {
        display: flex;
      }

      .dialog-background {
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

      .dialog-content {
        position: relative;
        z-index: 1;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        min-width: 500px;
        max-width: 600px;
        padding: 40px;
        display: flex;
        flex-direction: column;
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

      .dialog-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 20px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
        text-align: center;
      }

      .dialog-message {
        color: #2c3e50;
        font-size: 18px;
        margin: 0 0 30px 0;
        text-align: center;
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
      }

      .dialog-message .save-name {
        font-weight: bold;
        color: #3498db;
      }

      .dialog-buttons {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
      }

      .dialog-button {
        position: relative;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 8px;
        color: #1a1a1a;
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

      .dialog-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
        transition: left 0.4s ease;
      }

      .dialog-button:hover::before {
        left: 100%;
      }

      .dialog-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .dialog-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .dialog-button.warning {
        border-color: #e74c3c;
        color: #e74c3c;
      }

      .dialog-button.warning:hover {
        background: rgba(231, 76, 60, 0.1);
        border-color: #c0392b;
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
    const overwriteButton = this.element.querySelector('#overwrite-button');
    const saveAsNewButton = this.element.querySelector('#save-as-new-button');
    const cancelButton = this.element.querySelector('#cancel-save-button');

    overwriteButton.addEventListener('click', () => {
      if (this.onOverwriteCallback) {
        this.onOverwriteCallback();
      }
      this.hide();
    });

    saveAsNewButton.addEventListener('click', () => {
      if (this.onSaveAsNewCallback) {
        this.onSaveAsNewCallback();
      }
      this.hide();
    });

    cancelButton.addEventListener('click', () => {
      this.hide();
      if (this.onCancelCallback) {
        this.onCancelCallback();
      }
    });
  }

  show(existingSaveName = null) {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.classList.add('visible');
    this.existingSaveName = existingSaveName;

    const messageElement = this.element.querySelector('#save-dialog-message');
    if (existingSaveName) {
      // Parse the save name to show a readable date
      const dateMatch = existingSaveName.match(/save_(.+)/);
      let displayName = existingSaveName;
      if (dateMatch) {
        try {
          const timestampStr = dateMatch[1].replace(/-/g, ':').replace('T', ' ');
          const date = new Date(timestampStr);
          if (!isNaN(date.getTime())) {
            displayName = date.toLocaleString();
          }
        } catch (e) {
          // Keep original name
        }
      }
      messageElement.innerHTML = `This world has already been saved.<br/><br/>Save: <span class="save-name">${displayName}</span><br/><br/>Would you like to overwrite the existing save or create a new save?`;
    } else {
      messageElement.textContent = 'Save this world?';
    }
  }

  hide() {
    this.element.classList.remove('visible');
  }

  onOverwrite(callback) {
    this.onOverwriteCallback = callback;
  }

  onSaveAsNew(callback) {
    this.onSaveAsNewCallback = callback;
  }

  onCancel(callback) {
    this.onCancelCallback = callback;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

