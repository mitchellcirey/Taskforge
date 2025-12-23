export class CharacterMenu {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onCloseCallback = null;
    this.characterName = '';
    this.hatColor = '#FF69B4'; // Default pink
    this.overallsColor = '#4169E1'; // Default blue
    this.skinColor = '#D2B48C'; // Default tan
    this.loadCharacterData();
    this.create();
  }

  loadCharacterData() {
    try {
      const savedName = localStorage.getItem('taskforge_characterName');
      if (savedName !== null) {
        this.characterName = savedName;
      }
      
      const savedHatColor = localStorage.getItem('taskforge_characterHatColor');
      if (savedHatColor !== null) {
        this.hatColor = savedHatColor;
      }
      
      const savedOverallsColor = localStorage.getItem('taskforge_characterOverallsColor');
      if (savedOverallsColor !== null) {
        this.overallsColor = savedOverallsColor;
      }
      
      const savedSkinColor = localStorage.getItem('taskforge_characterSkinColor');
      if (savedSkinColor !== null) {
        this.skinColor = savedSkinColor;
      }
    } catch (error) {
      console.warn('Failed to load character data:', error);
    }
  }

  saveCharacterData() {
    try {
      localStorage.setItem('taskforge_characterName', this.characterName);
      localStorage.setItem('taskforge_characterHatColor', this.hatColor);
      localStorage.setItem('taskforge_characterOverallsColor', this.overallsColor);
      localStorage.setItem('taskforge_characterSkinColor', this.skinColor);
    } catch (error) {
      console.warn('Failed to save character data:', error);
    }
  }

  getCharacterName() {
    return this.characterName && this.characterName.trim() !== '' ? this.characterName : null;
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'character-menu';
    this.element.innerHTML = `
      <div class="character-background"></div>
      <div class="character-content">
        <h2 class="character-title">Character</h2>
        <div class="character-options">
          <div class="character-option">
            <label class="character-label" for="character-name-input">Character Name</label>
            <input 
              type="text" 
              id="character-name-input" 
              class="character-input" 
              placeholder="Enter your character name"
              value="${this.characterName}"
              maxlength="20"
            >
            <p class="character-hint">Required to join games</p>
          </div>
          
          <div class="character-option">
            <label class="character-label" for="hat-color-picker">Hat Color</label>
            <div class="color-picker-container">
              <input 
                type="color" 
                id="hat-color-picker" 
                class="color-picker" 
                value="${this.hatColor}"
              >
              <span class="color-preview" style="background-color: ${this.hatColor}"></span>
            </div>
          </div>
          
          <div class="character-option">
            <label class="character-label" for="overalls-color-picker">Overalls Color</label>
            <div class="color-picker-container">
              <input 
                type="color" 
                id="overalls-color-picker" 
                class="color-picker" 
                value="${this.overallsColor}"
              >
              <span class="color-preview" style="background-color: ${this.overallsColor}"></span>
            </div>
          </div>
          
          <div class="character-option">
            <label class="character-label" for="skin-color-picker">Skin Color</label>
            <div class="color-picker-container">
              <input 
                type="color" 
                id="skin-color-picker" 
                class="color-picker" 
                value="${this.skinColor}"
              >
              <span class="color-preview" style="background-color: ${this.skinColor}"></span>
            </div>
          </div>
        </div>
        <div class="character-buttons">
          <button class="character-button" id="save-character-button">Save</button>
          <button class="character-button" id="close-character-button">Close</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #character-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 4500;
        backdrop-filter: blur(8px);
      }

      #character-menu.visible {
        display: flex;
      }

      .character-background {
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

      .character-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 50px 60px;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        min-width: 400px;
        max-width: 500px;
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

      .character-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 40px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .character-options {
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-bottom: 30px;
        text-align: left;
      }

      .character-option {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .character-label {
        color: #1a1a1a;
        font-size: 16px;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .character-input {
        padding: 12px 16px;
        border: 2px solid #34495e;
        border-radius: 6px;
        font-size: 16px;
        font-family: 'Arial', sans-serif;
        color: #1a1a1a;
        background: rgba(255, 255, 255, 0.95);
        transition: all 0.2s ease;
      }

      .character-input:focus {
        outline: none;
        border-color: #2c3e50;
        box-shadow: 0 0 0 3px rgba(52, 73, 94, 0.1);
      }

      .character-hint {
        color: #7f8c8d;
        font-size: 12px;
        font-family: 'Arial', sans-serif;
        margin: 0;
        font-style: italic;
      }

      .color-picker-container {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .color-picker {
        width: 60px;
        height: 40px;
        border: 2px solid #34495e;
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
        background: none;
      }

      .color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
      }

      .color-picker::-webkit-color-swatch {
        border: none;
        border-radius: 4px;
      }

      .color-preview {
        width: 40px;
        height: 40px;
        border: 2px solid #34495e;
        border-radius: 6px;
        display: inline-block;
      }

      .character-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 30px;
      }

      .character-button {
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 8px;
        color: #1a1a1a;
        font-size: 18px;
        padding: 12px 40px;
        min-width: 120px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .character-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .character-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .character-button:first-child {
        background: rgba(52, 73, 94, 0.95);
        color: white;
      }

      .character-button:first-child:hover {
        background: rgba(52, 73, 94, 1);
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
    const nameInput = this.element.querySelector('#character-name-input');
    const hatColorPicker = this.element.querySelector('#hat-color-picker');
    const overallsColorPicker = this.element.querySelector('#overalls-color-picker');
    const skinColorPicker = this.element.querySelector('#skin-color-picker');
    const saveButton = this.element.querySelector('#save-character-button');
    const closeButton = this.element.querySelector('#close-character-button');

    // Update character name
    nameInput.addEventListener('input', (e) => {
      this.characterName = e.target.value.trim();
    });

    // Update hat color
    hatColorPicker.addEventListener('input', (e) => {
      this.hatColor = e.target.value;
      const preview = this.element.querySelector('#hat-color-picker').nextElementSibling;
      if (preview) {
        preview.style.backgroundColor = this.hatColor;
      }
    });

    // Update overalls color
    overallsColorPicker.addEventListener('input', (e) => {
      this.overallsColor = e.target.value;
      const preview = this.element.querySelector('#overalls-color-picker').nextElementSibling;
      if (preview) {
        preview.style.backgroundColor = this.overallsColor;
      }
    });

    // Update skin color
    skinColorPicker.addEventListener('input', (e) => {
      this.skinColor = e.target.value;
      const preview = this.element.querySelector('#skin-color-picker').nextElementSibling;
      if (preview) {
        preview.style.backgroundColor = this.skinColor;
      }
    });

    // Save button
    saveButton.addEventListener('click', () => {
      this.saveCharacterData();
      // Show confirmation
      const originalText = saveButton.textContent;
      saveButton.textContent = 'Saved!';
      setTimeout(() => {
        saveButton.textContent = originalText;
      }, 1000);
    });

    // Close button
    closeButton.addEventListener('click', () => {
      // Save before closing
      this.saveCharacterData();
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
    // Reload data in case it was changed elsewhere
    this.loadCharacterData();
    // Update UI with loaded data
    const nameInput = this.element.querySelector('#character-name-input');
    const hatColorPicker = this.element.querySelector('#hat-color-picker');
    const overallsColorPicker = this.element.querySelector('#overalls-color-picker');
    const skinColorPicker = this.element.querySelector('#skin-color-picker');
    
    if (nameInput) nameInput.value = this.characterName;
    if (hatColorPicker) {
      hatColorPicker.value = this.hatColor;
      const hatPreview = hatColorPicker.nextElementSibling;
      if (hatPreview) hatPreview.style.backgroundColor = this.hatColor;
    }
    if (overallsColorPicker) {
      overallsColorPicker.value = this.overallsColor;
      const overallsPreview = overallsColorPicker.nextElementSibling;
      if (overallsPreview) overallsPreview.style.backgroundColor = this.overallsColor;
    }
    if (skinColorPicker) {
      skinColorPicker.value = this.skinColor;
      const skinPreview = skinColorPicker.nextElementSibling;
      if (skinPreview) skinPreview.style.backgroundColor = this.skinColor;
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

