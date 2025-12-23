export class NewGameDialog {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onStartCallback = null;
    this.onCancelCallback = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'new-game-dialog';
    this.element.innerHTML = `
      <div class="dialog-background"></div>
      <div class="dialog-content">
        <h2 class="dialog-title">New Game</h2>
        <div class="dialog-form">
          <div class="dialog-input-container">
            <label class="dialog-label" for="world-name-input">World Name</label>
            <div class="seed-input-group">
              <input 
                type="text" 
                id="world-name-input" 
                class="dialog-input seed-input" 
                placeholder="My World"
                maxlength="50"
                autofocus
              >
              <button class="dialog-button-small" id="generate-name-button">
                <span class="button-text">Random</span>
              </button>
            </div>
          </div>
          <div class="dialog-input-container">
            <label class="dialog-label" for="seed-input">Seed (Optional)</label>
            <div class="seed-input-group">
              <input 
                type="text" 
                id="seed-input" 
                class="dialog-input seed-input" 
                placeholder="Leave blank for random"
                maxlength="20"
              >
              <button class="dialog-button-small" id="generate-seed-button">
                <span class="button-text">Random</span>
              </button>
            </div>
            <div class="dialog-hint">Enter a seed number to generate the same world again</div>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button primary" id="start-game-button">
            <span class="button-text">Start Game</span>
          </button>
          <button class="dialog-button" id="cancel-button">
            <span class="button-text">Cancel</span>
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    if (!document.getElementById('new-game-dialog-styles')) {
      style.id = 'new-game-dialog-styles';
      style.textContent = `
        #new-game-dialog {
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

        #new-game-dialog.visible {
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
          min-width: 450px;
          max-width: 600px;
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

        .dialog-form {
          margin: 0 40px 30px 40px;
        }

        .dialog-input-container {
          margin-bottom: 25px;
        }

        .dialog-input-container:last-child {
          margin-bottom: 0;
        }

        .dialog-label {
          display: block;
          color: #2c3e50;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          font-family: 'Arial', sans-serif;
        }

        .dialog-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #bdc3c7;
          border-radius: 8px;
          font-size: 16px;
          font-family: 'Arial', sans-serif;
          color: #2c3e50;
          background: rgba(255, 255, 255, 0.95);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .dialog-input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .seed-input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .seed-input {
          flex: 1;
        }

        .dialog-button-small {
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid #34495e;
          border-radius: 8px;
          color: #1a1a1a;
          font-size: 14px;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Arial', sans-serif;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .dialog-button-small:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
          border-color: #2c3e50;
        }

        .dialog-button-small:active {
          transform: translateY(0);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }

        .dialog-hint {
          color: #7f8c8d;
          font-size: 12px;
          margin-top: 6px;
          font-family: 'Arial', sans-serif;
          font-style: italic;
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

        .dialog-button.primary {
          background: rgba(52, 152, 219, 0.1);
          border-color: #3498db;
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

        .dialog-button.primary:hover {
          background: rgba(52, 152, 219, 0.2);
          border-color: #2980b9;
        }

        .dialog-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .button-text {
          position: relative;
          z-index: 1;
        }
      `;
      document.head.appendChild(style);
    }

    this.setupEventListeners();
  }

  generateRandomWorldName() {
    const adjectives = [
      'Ancient', 'Mystic', 'Golden', 'Crystal', 'Emerald', 'Sapphire', 'Ruby', 'Diamond',
      'Frozen', 'Burning', 'Ethereal', 'Cosmic', 'Stellar', 'Lunar', 'Solar', 'Nebula',
      'Forest', 'Ocean', 'Mountain', 'Valley', 'Desert', 'Island', 'River', 'Lake',
      'Peaceful', 'Serene', 'Majestic', 'Grand', 'Noble', 'Royal', 'Epic', 'Legendary',
      'Hidden', 'Secret', 'Lost', 'Forgotten', 'Abandoned', 'Ruined', 'Old', 'Eternal',
      'New', 'Fresh', 'Bright', 'Shining', 'Glorious', 'Wonderful', 'Amazing', 'Incredible',
      'Dark', 'Light', 'Shadow', 'Dawn', 'Dusk', 'Twilight', 'Midnight', 'Noon'
    ];
    
    const nouns = [
      'Realm', 'Kingdom', 'Empire', 'Domain', 'Land', 'World', 'Dimension', 'Universe',
      'Sanctuary', 'Haven', 'Refuge', 'Shelter', 'Fortress', 'Castle', 'Palace', 'Tower',
      'Grove', 'Garden', 'Meadow', 'Field', 'Plains', 'Forest', 'Jungle', 'Wilderness',
      'Island', 'Archipelago', 'Continent', 'Nation', 'Territory', 'Region', 'Province', 'State',
      'Peak', 'Summit', 'Valley', 'Canyon', 'Cavern', 'Cave', 'Abyss', 'Depths',
      'Shore', 'Beach', 'Coast', 'Harbor', 'Bay', 'Strait', 'Channel', 'Waterway'
    ];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective} ${noun}`;
  }

  setupEventListeners() {
    const worldNameInput = this.element.querySelector('#world-name-input');
    const seedInput = this.element.querySelector('#seed-input');
    const generateNameButton = this.element.querySelector('#generate-name-button');
    const generateSeedButton = this.element.querySelector('#generate-seed-button');
    const startButton = this.element.querySelector('#start-game-button');
    const cancelButton = this.element.querySelector('#cancel-button');

    // Generate random world name button
    generateNameButton.addEventListener('click', () => {
      const randomName = this.generateRandomWorldName();
      worldNameInput.value = randomName;
      worldNameInput.focus();
    });

    // Generate random seed button
    generateSeedButton.addEventListener('click', () => {
      const randomSeed = Math.floor(Math.random() * 2147483647);
      seedInput.value = randomSeed.toString();
      seedInput.focus();
    });

    // Validate seed input (only numbers)
    seedInput.addEventListener('input', (e) => {
      const value = e.target.value;
      // Allow empty or numeric values only
      if (value && !/^\d+$/.test(value)) {
        e.target.value = value.replace(/\D/g, '');
      }
    });

    // Start game button
    startButton.addEventListener('click', () => {
      const worldName = worldNameInput.value.trim();
      const seedValue = seedInput.value.trim();

      // Validate world name
      if (!worldName) {
        // Show alert and restore focus after it's dismissed
        alert('Please enter a world name.');
        // Use requestAnimationFrame to ensure the dialog is still interactive
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            worldNameInput.focus();
            worldNameInput.select();
            // Ensure dialog is still visible and interactive
            this.element.classList.add('visible');
          });
        });
        return;
      }

      // Parse seed (generate random if empty)
      let seed = null;
      if (seedValue) {
        const parsedSeed = parseInt(seedValue, 10);
        if (isNaN(parsedSeed) || parsedSeed < 0 || parsedSeed > 2147483647) {
          // Show alert and restore focus after it's dismissed
          alert('Seed must be a number between 0 and 2147483647.');
          // Use requestAnimationFrame to ensure the dialog is still interactive
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              seedInput.focus();
              seedInput.select();
              // Ensure dialog is still visible and interactive
              this.element.classList.add('visible');
            });
          });
          return;
        }
        seed = parsedSeed;
      } else {
        // Generate random seed if not provided
        seed = Math.floor(Math.random() * 2147483647);
      }

      this.hide();
      if (this.onStartCallback) {
        this.onStartCallback(worldName, seed);
      }
    });

    // Cancel button
    cancelButton.addEventListener('click', () => {
      this.hide();
      if (this.onCancelCallback) {
        this.onCancelCallback();
      }
    });

    // Allow Enter key to submit
    worldNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        startButton.click();
      }
    });

    seedInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        startButton.click();
      }
    });
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.classList.add('visible');
    
    // Reset form
    const worldNameInput = this.element.querySelector('#world-name-input');
    const seedInput = this.element.querySelector('#seed-input');
    worldNameInput.value = '';
    seedInput.value = '';
    worldNameInput.focus();
  }

  hide() {
    this.element.classList.remove('visible');
  }

  onStart(callback) {
    this.onStartCallback = callback;
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

