export class SaveLoadDialog {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.selectedSave = null;
    this.onLoadCallback = null;
    this.onCancelCallback = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'save-load-dialog';
    this.element.innerHTML = `
      <div class="dialog-background"></div>
      <div class="dialog-content">
        <h2 class="dialog-title">Load Game</h2>
        <div class="save-list-container" id="save-list-container">
          <div class="save-list-loading">Loading saves...</div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button" id="load-button" disabled>
            <span class="button-text">Load</span>
          </button>
          <button class="dialog-button" id="cancel-button">
            <span class="button-text">Cancel</span>
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #save-load-dialog {
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

      #save-load-dialog.visible {
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
        max-width: 700px;
        max-height: 80vh;
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
        margin: 30px 40px 20px 40px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
        text-align: center;
      }

      .save-list-container {
        flex: 1;
        overflow-y: auto;
        margin: 0 40px 20px 40px;
        min-height: 300px;
        max-height: 50vh;
        border: 2px solid #34495e;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.8);
        padding: 10px;
      }

      .save-list-loading {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 18px;
        font-family: 'Arial', sans-serif;
      }

      .save-list-empty {
        text-align: center;
        padding: 60px 40px;
        color: #666;
        font-size: 18px;
        font-family: 'Arial', sans-serif;
      }

      .save-item {
        padding: 15px;
        margin-bottom: 10px;
        border: 2px solid #bdc3c7;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
      }

      .save-item:hover {
        background: rgba(255, 255, 255, 1);
        border-color: #3498db;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .save-item.selected {
        background: rgba(52, 152, 219, 0.1);
        border-color: #3498db;
        border-width: 3px;
        box-shadow: 0 4px 16px rgba(52, 152, 219, 0.3);
      }

      .save-item-content {
        display: flex;
        gap: 15px;
        align-items: center;
      }

      .save-item-screenshot {
        width: 120px;
        height: 80px;
        border: 2px solid #bdc3c7;
        border-radius: 6px;
        background: #ecf0f1;
        object-fit: cover;
        flex-shrink: 0;
      }

      .save-item-info {
        flex: 1;
        min-width: 0;
      }

      .save-item-name {
        font-size: 18px;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 5px;
      }

      .save-item-date {
        font-size: 14px;
        color: #7f8c8d;
      }

      .dialog-buttons {
        display: flex;
        gap: 16px;
        justify-content: center;
        padding: 20px 40px 30px 40px;
      }

      .dialog-button {
        position: relative;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 8px;
        color: #1a1a1a;
        font-size: 20px;
        padding: 14px 40px;
        min-width: 150px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-transform: uppercase;
        letter-spacing: 1px;
        overflow: hidden;
      }

      .dialog-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
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

      .dialog-button:hover:not(:disabled)::before {
        left: 100%;
      }

      .dialog-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .dialog-button:active:not(:disabled) {
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

  parseDateFromFilename(fileName) {
    const timestampMatch = fileName.match(/save_(.+)\.json/);
    if (timestampMatch) {
      try {
        // Parse the timestamp (format: 2024-01-15T14-30-25)
        const timestampStr = timestampMatch[1].replace(/-/g, ':').replace('T', ' ');
        const date = new Date(timestampStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      } catch (e) {
        // Fallback to filename
        return fileName;
      }
    }
    return fileName;
  }

  setupEventListeners() {
    const loadButton = this.element.querySelector('#load-button');
    const cancelButton = this.element.querySelector('#cancel-button');

    loadButton.addEventListener('click', () => {
      if (this.selectedSave && this.onLoadCallback) {
        this.onLoadCallback(this.selectedSave);
      }
    });

    cancelButton.addEventListener('click', () => {
      this.hide();
      if (this.onCancelCallback) {
        this.onCancelCallback();
      }
    });
  }

  async loadSaveFiles() {
    const container = this.element.querySelector('#save-list-container');
    container.innerHTML = '<div class="save-list-loading">Loading saves...</div>';

    try {
      if (!window.electronAPI || !window.electronAPI.listSaveFiles) {
        container.innerHTML = '<div class="save-list-empty">Save functionality not available.</div>';
        return;
      }

      const saveFiles = await window.electronAPI.listSaveFiles();
      
      if (saveFiles.length === 0) {
        container.innerHTML = '<div class="save-list-empty">No save files found.<br/>Start playing and save your game to create a save file.</div>';
        return;
      }

      // Clear loading message
      container.innerHTML = '';

      // Create save item for each file
      for (const [index, saveFile] of saveFiles.entries()) {
        const saveItem = document.createElement('div');
        saveItem.className = 'save-item';
        saveItem.dataset.index = index;
        saveItem.dataset.path = saveFile.path;

        const fileName = saveFile.name;
        
        // Use modifiedDate from metadata if available, otherwise parse filename
        let displayDate = 'Unknown date';
        if (saveFile.modifiedDate) {
          try {
            const date = new Date(saveFile.modifiedDate);
            if (!isNaN(date.getTime())) {
              displayDate = date.toLocaleString();
            }
          } catch (e) {
            // Fallback to parsing filename
            displayDate = this.parseDateFromFilename(fileName);
          }
        } else {
          displayDate = this.parseDateFromFilename(fileName);
        }

        // Create screenshot element
        const screenshotImg = document.createElement('img');
        screenshotImg.className = 'save-item-screenshot';
        screenshotImg.alt = 'Screenshot';
        
        // Load screenshot if available
        if (saveFile.screenshotPath && window.electronAPI && window.electronAPI.getScreenshot) {
          // Always show the screenshot area (will show placeholder if loading fails)
          screenshotImg.style.display = 'block';
          
          window.electronAPI.getScreenshot(saveFile.screenshotPath).then(result => {
            if (result.success && result.dataURL) {
              screenshotImg.src = result.dataURL;
              screenshotImg.onerror = () => {
                console.warn('Failed to load screenshot image');
                screenshotImg.style.display = 'none';
              };
            } else {
              // Screenshot doesn't exist or failed to load
              screenshotImg.style.display = 'none';
            }
          }).catch(err => {
            console.warn('Failed to load screenshot:', err);
            screenshotImg.style.display = 'none';
          });
        } else {
          // No screenshot path available, hide the image element
          screenshotImg.style.display = 'none';
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'save-item-info';
        infoDiv.innerHTML = `
          <div class="save-item-name">${displayDate}</div>
          <div class="save-item-date">${fileName}</div>
        `;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'save-item-content';
        contentDiv.appendChild(screenshotImg);
        contentDiv.appendChild(infoDiv);
        saveItem.appendChild(contentDiv);

        saveItem.addEventListener('click', () => {
          // Remove selected class from all items
          container.querySelectorAll('.save-item').forEach(item => {
            item.classList.remove('selected');
          });
          
          // Add selected class to clicked item
          saveItem.classList.add('selected');
          
          // Update selected save
          this.selectedSave = saveFile.path;
          
          // Enable load button
          const loadButton = this.element.querySelector('#load-button');
          loadButton.disabled = false;
        });

        container.appendChild(saveItem);
      }
    } catch (error) {
      console.error('Error loading save files:', error);
      container.innerHTML = `<div class="save-list-empty">Error loading save files: ${error.message}</div>`;
    }
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.classList.add('visible');
    this.selectedSave = null;
    
    // Reset load button state
    const loadButton = this.element.querySelector('#load-button');
    loadButton.disabled = true;
    
    // Load save files
    this.loadSaveFiles();
  }

  hide() {
    this.element.classList.remove('visible');
    this.selectedSave = null;
  }

  onLoad(callback) {
    this.onLoadCallback = callback;
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

