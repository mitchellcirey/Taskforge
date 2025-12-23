import * as THREE from 'three';

export class CharacterMenu {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onCloseCallback = null;
    this.characterName = '';
    this.gender = 'male'; // Default male
    this.hatVisible = true; // Default show hat
    this.hairstyle = 'none'; // Default no hair
    this.hatColor = '#FF69B4'; // Default pink
    this.overallsColor = '#4169E1'; // Default blue
    this.skinColor = '#D2B48C'; // Default tan
    
    // Preview scene properties
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewCharacter = null;
    this.animationId = null;
    
    this.loadCharacterData();
    this.create();
  }

  loadCharacterData() {
    try {
      const savedName = localStorage.getItem('taskforge_characterName');
      if (savedName !== null) {
        this.characterName = savedName;
      }
      
      const savedGender = localStorage.getItem('taskforge_characterGender');
      if (savedGender !== null) {
        this.gender = savedGender;
      }
      
      const savedHatVisible = localStorage.getItem('taskforge_characterHatVisible');
      if (savedHatVisible !== null) {
        this.hatVisible = savedHatVisible === 'true';
      }
      
      const savedHairstyle = localStorage.getItem('taskforge_characterHairstyle');
      if (savedHairstyle !== null) {
        this.hairstyle = savedHairstyle;
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
      localStorage.setItem('taskforge_characterGender', this.gender);
      localStorage.setItem('taskforge_characterHatVisible', this.hatVisible.toString());
      localStorage.setItem('taskforge_characterHairstyle', this.hairstyle);
      localStorage.setItem('taskforge_characterHatColor', this.hatColor);
      localStorage.setItem('taskforge_characterOverallsColor', this.overallsColor);
      localStorage.setItem('taskforge_characterSkinColor', this.skinColor);
      
      // Update player model in real-time if game is running
      if (window.gameInstance && window.gameInstance.sceneManager && window.gameInstance.sceneManager.player) {
        const player = window.gameInstance.sceneManager.player;
        if (player.updateColors) {
          player.updateColors();
        }
        if (player.updateHatVisibility) {
          player.updateHatVisibility(this.hatVisible);
        }
        if (player.updateHair) {
          player.updateHair(this.gender, this.hairstyle);
        }
        if (player.updateGender) {
          player.updateGender(this.gender);
        }
      }
    } catch (error) {
      console.warn('Failed to save character data:', error);
    }
  }

  getCharacterName() {
    return this.characterName && this.characterName.trim() !== '' ? this.characterName : null;
  }

  getHairstyleOptions() {
    const maleOptions = [
      { value: 'none', label: 'None' },
      { value: 'short', label: 'Short' },
      { value: 'spiky', label: 'Spiky' },
      { value: 'curly', label: 'Curly' }
    ];
    const femaleOptions = [
      { value: 'none', label: 'None' },
      { value: 'long', label: 'Long' },
      { value: 'ponytail', label: 'Ponytail' },
      { value: 'bob', label: 'Bob' }
    ];
    
    const options = this.gender === 'male' ? maleOptions : femaleOptions;
    return options.map(opt => 
      `<option value="${opt.value}" ${this.hairstyle === opt.value ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'character-menu';
    this.element.innerHTML = `
      <div class="character-background"></div>
      <div class="character-content">
        <h2 class="character-title">Character</h2>
        <div class="character-layout">
          <div class="character-options-container">
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
            <label class="character-label">Gender</label>
            <div class="gender-selector">
              <label class="gender-option">
                <input type="radio" name="gender" value="male" ${this.gender === 'male' ? 'checked' : ''}>
                <span>Male</span>
              </label>
              <label class="gender-option">
                <input type="radio" name="gender" value="female" ${this.gender === 'female' ? 'checked' : ''}>
                <span>Female</span>
              </label>
            </div>
          </div>
          
          <div class="character-option">
            <label class="character-label">
              <input type="checkbox" id="hat-visible-checkbox" ${this.hatVisible ? 'checked' : ''}>
              <span>Show Hat</span>
            </label>
          </div>
          
          <div class="character-option">
            <label class="character-label" for="hairstyle-select">Hairstyle</label>
            <select id="hairstyle-select" class="character-select">
              ${this.getHairstyleOptions()}
            </select>
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
          </div>
          <div class="character-preview-container">
            <div class="character-preview-label">Preview</div>
            <div id="character-preview-canvas"></div>
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
        min-width: 800px;
        max-width: 1000px;
        max-height: 90vh;
        overflow: hidden;
        animation: fadeInScale 0.3s ease-out;
      }

      .character-layout {
        display: flex;
        gap: 40px;
        align-items: flex-start;
        justify-content: space-between;
      }

      .character-options-container {
        flex: 1;
        min-width: 0;
        overflow-y: auto;
        max-height: calc(90vh - 200px);
        padding-right: 10px;
      }

      .character-preview-container {
        flex: 0 0 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .character-preview-label {
        color: #1a1a1a;
        font-size: 18px;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      #character-preview-canvas {
        width: 300px;
        height: 400px;
        border: 2px solid #34495e;
        border-radius: 8px;
        background: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 100%);
        overflow: hidden;
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

      .gender-selector {
        display: flex;
        gap: 20px;
      }

      .gender-option {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-family: 'Arial', sans-serif;
        font-size: 16px;
        color: #1a1a1a;
      }

      .gender-option input[type="radio"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .character-option input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin-right: 8px;
        cursor: pointer;
      }

      .character-select {
        padding: 12px 16px;
        border: 2px solid #34495e;
        border-radius: 6px;
        font-size: 16px;
        font-family: 'Arial', sans-serif;
        color: #1a1a1a;
        background: rgba(255, 255, 255, 0.95);
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
      }

      .character-select:focus {
        outline: none;
        border-color: #2c3e50;
        box-shadow: 0 0 0 3px rgba(52, 73, 94, 0.1);
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
    this.initPreview();
  }

  initPreview() {
    // Wait for DOM to be ready
    const init = () => {
      const canvasContainer = this.element.querySelector('#character-preview-canvas');
      if (!canvasContainer) {
        setTimeout(init, 50);
        return;
      }
      
      // Don't reinitialize if already done
      if (this.previewRenderer) return;

      // Create scene
      this.previewScene = new THREE.Scene();
      this.previewScene.background = new THREE.Color(0x87CEEB);

      // Create camera
      this.previewCamera = new THREE.PerspectiveCamera(45, 300 / 400, 0.1, 100);
      this.previewCamera.position.set(3, 2, 3);
      this.previewCamera.lookAt(0, 1, 0);

      // Create renderer
      this.previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.previewRenderer.setSize(300, 400);
      this.previewRenderer.shadowMap.enabled = true;
      this.previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      canvasContainer.appendChild(this.previewRenderer.domElement);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.previewScene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      this.previewScene.add(directionalLight);

      // Add ground plane
      const groundGeometry = new THREE.PlaneGeometry(10, 10);
      const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      this.previewScene.add(ground);

      // Create initial character preview
      this.updatePreview();

      // Start animation loop
      this.animatePreview();
    };
    
    // Try immediately, then retry if needed
    init();
    setTimeout(init, 100);
  }

  hexToNumber(hexString) {
    if (!hexString || typeof hexString !== 'string') return null;
    const hex = hexString.replace('#', '');
    return parseInt(hex, 16);
  }

  createPreviewCharacter() {
    const characterGroup = new THREE.Group();

    // Convert colors
    const skinColor = this.hexToNumber(this.skinColor) || 0xD2B48C;
    const hatColor = this.hexToNumber(this.hatColor) || 0xFF69B4;
    const overallColor = this.hexToNumber(this.overallsColor) || 0x4169E1;
    const shirtColor = 0x808080;

    // Gender-based proportions
    const bodyScale = this.gender === 'female' ? 0.9 : 1.0;
    const shoulderWidth = this.gender === 'female' ? 0.45 : 0.5;
    const hipWidth = this.gender === 'female' ? 0.5 : 0.45;

    // Head
    const headGeometry = new THREE.BoxGeometry(0.5 * bodyScale, 0.5 * bodyScale, 0.5 * bodyScale);
    const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8, metalness: 0.1 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.0 * bodyScale, 0);
    head.castShadow = true;
    characterGroup.add(head);

    // Face details
    const faceScale = bodyScale;
    const eyeGeometry = new THREE.BoxGeometry(0.08 * faceScale, 0.08 * faceScale, 0.02);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12 * faceScale, 1.05 * bodyScale, 0.26 * faceScale);
    characterGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12 * faceScale, 1.05 * bodyScale, 0.26 * faceScale);
    characterGroup.add(rightEye);

    const mouthGeometry = new THREE.BoxGeometry(0.15 * faceScale, 0.08 * faceScale, 0.02);
    const mouth = new THREE.Mesh(mouthGeometry, eyeMaterial);
    mouth.position.set(0, 0.92 * bodyScale, 0.26 * faceScale);
    characterGroup.add(mouth);

    const blushGeometry = new THREE.BoxGeometry(0.1 * faceScale, 0.1 * faceScale, 0.01);
    const blushMaterial = new THREE.MeshStandardMaterial({ color: 0xFFB6C1 });
    const leftBlush = new THREE.Mesh(blushGeometry, blushMaterial);
    leftBlush.position.set(-0.18 * faceScale, 0.98 * bodyScale, 0.25 * faceScale);
    characterGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeometry, blushMaterial);
    rightBlush.position.set(0.18 * faceScale, 0.98 * bodyScale, 0.25 * faceScale);
    characterGroup.add(rightBlush);

    // Hair
    if (this.hairstyle !== 'none') {
      const hairMesh = this.createPreviewHair(this.gender, this.hairstyle, hatColor, bodyScale);
      if (hairMesh) {
        characterGroup.add(hairMesh);
      }
    }

    // Hat
    if (this.hatVisible) {
      const hatMaterial = new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.7, metalness: 0.1 });
      const hatGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.7);
      const hat = new THREE.Mesh(hatGeometry, hatMaterial);
      hat.position.set(0, 1.25, 0);
      hat.castShadow = true;
      characterGroup.add(hat);

      const hatBrimGeometry = new THREE.BoxGeometry(0.85, 0.15, 0.85);
      const hatBrim = new THREE.Mesh(hatBrimGeometry, hatMaterial);
      hatBrim.position.set(0, 1.15, 0);
      hatBrim.castShadow = true;
      characterGroup.add(hatBrim);
    }

    // Body
    const bodyGeometry = new THREE.BoxGeometry(shoulderWidth, 0.6 * bodyScale, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8, metalness: 0.1 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.5 * bodyScale, 0);
    body.castShadow = true;
    characterGroup.add(body);

    // Shirt
    const shirtGeometry = new THREE.BoxGeometry(0.45, 0.3, 0.35);
    const shirtMaterial = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
    const shirt = new THREE.Mesh(shirtGeometry, shirtMaterial);
    shirt.position.set(0, 0.65, 0);
    characterGroup.add(shirt);

    // Overalls
    const overallGeometry = new THREE.BoxGeometry(hipWidth, 0.7 * bodyScale, 0.45);
    const overallMaterial = new THREE.MeshStandardMaterial({ color: overallColor, roughness: 0.9, metalness: 0.1 });
    const overalls = new THREE.Mesh(overallGeometry, overallMaterial);
    overalls.position.set(0, 0.45 * bodyScale, 0);
    overalls.castShadow = true;
    characterGroup.add(overalls);

    // Straps
    const strapGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.05);
    const leftStrap = new THREE.Mesh(strapGeometry, overallMaterial);
    leftStrap.position.set(-0.2, 0.7, 0.2);
    characterGroup.add(leftStrap);
    const rightStrap = new THREE.Mesh(strapGeometry, overallMaterial);
    rightStrap.position.set(0.2, 0.7, 0.2);
    characterGroup.add(rightStrap);

    // Buttons
    const buttonGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
    const leftButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
    leftButton.position.set(-0.15, 0.75, 0.23);
    characterGroup.add(leftButton);
    const rightButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
    rightButton.position.set(0.15, 0.75, 0.23);
    characterGroup.add(rightButton);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.15, 0.4 * bodyScale, 0.15);
    const armMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
    const armOffsetX = this.gender === 'female' ? 0.32 : 0.35;
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-armOffsetX, 0.5 * bodyScale, 0);
    leftArm.castShadow = true;
    characterGroup.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(armOffsetX, 0.5 * bodyScale, 0);
    rightArm.castShadow = true;
    characterGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.2, 0.4 * bodyScale, 0.2);
    const legOffsetX = this.gender === 'female' ? 0.12 : 0.15;
    const leftLeg = new THREE.Mesh(legGeometry, overallMaterial);
    leftLeg.position.set(-legOffsetX, -0.1 * bodyScale, 0);
    leftLeg.castShadow = true;
    characterGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeometry, overallMaterial);
    rightLeg.position.set(legOffsetX, -0.1 * bodyScale, 0);
    rightLeg.castShadow = true;
    characterGroup.add(rightLeg);

    characterGroup.position.set(0, 0.3, 0);
    return characterGroup;
  }

  createPreviewHair(gender, hairstyle, hairColor, bodyScale) {
    if (!hairstyle || hairstyle === 'none') return null;

    const hairGroup = new THREE.Group();
    const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8, metalness: 0.1 });

    if (gender === 'male') {
      switch (hairstyle) {
        case 'short':
          const shortHair = new THREE.Mesh(new THREE.BoxGeometry(0.55 * bodyScale, 0.15 * bodyScale, 0.55 * bodyScale), hairMaterial);
          shortHair.position.set(0, 1.15 * bodyScale, 0);
          hairGroup.add(shortHair);
          break;
        case 'spiky':
          for (let i = 0; i < 5; i++) {
            const spike = new THREE.Mesh(new THREE.BoxGeometry(0.08 * bodyScale, 0.2 * bodyScale, 0.08 * bodyScale), hairMaterial);
            const angle = (i / 5) * Math.PI * 2;
            spike.position.set(Math.cos(angle) * 0.15 * bodyScale, 1.2 * bodyScale, Math.sin(angle) * 0.15 * bodyScale);
            hairGroup.add(spike);
          }
          break;
        case 'curly':
          const curlyHair = new THREE.Mesh(new THREE.BoxGeometry(0.6 * bodyScale, 0.2 * bodyScale, 0.6 * bodyScale), hairMaterial);
          curlyHair.position.set(0, 1.15 * bodyScale, 0);
          hairGroup.add(curlyHair);
          break;
      }
    } else {
      switch (hairstyle) {
        case 'long':
          const leftLong = new THREE.Mesh(new THREE.BoxGeometry(0.15 * bodyScale, 0.5 * bodyScale, 0.15 * bodyScale), hairMaterial);
          leftLong.position.set(-0.2 * bodyScale, 0.9 * bodyScale, 0);
          hairGroup.add(leftLong);
          const rightLong = new THREE.Mesh(new THREE.BoxGeometry(0.15 * bodyScale, 0.5 * bodyScale, 0.15 * bodyScale), hairMaterial);
          rightLong.position.set(0.2 * bodyScale, 0.9 * bodyScale, 0);
          hairGroup.add(rightLong);
          const topLong = new THREE.Mesh(new THREE.BoxGeometry(0.5 * bodyScale, 0.15 * bodyScale, 0.5 * bodyScale), hairMaterial);
          topLong.position.set(0, 1.15 * bodyScale, 0);
          hairGroup.add(topLong);
          break;
        case 'ponytail':
          const topPony = new THREE.Mesh(new THREE.BoxGeometry(0.5 * bodyScale, 0.15 * bodyScale, 0.5 * bodyScale), hairMaterial);
          topPony.position.set(0, 1.15 * bodyScale, 0);
          hairGroup.add(topPony);
          const ponytail = new THREE.Mesh(new THREE.BoxGeometry(0.12 * bodyScale, 0.4 * bodyScale, 0.12 * bodyScale), hairMaterial);
          ponytail.position.set(0, 0.85 * bodyScale, -0.2 * bodyScale);
          hairGroup.add(ponytail);
          break;
        case 'bob':
          const bobHair = new THREE.Mesh(new THREE.BoxGeometry(0.55 * bodyScale, 0.25 * bodyScale, 0.55 * bodyScale), hairMaterial);
          bobHair.position.set(0, 1.1 * bodyScale, 0);
          hairGroup.add(bobHair);
          break;
      }
    }

    hairGroup.castShadow = true;
    return hairGroup;
  }

  updatePreview() {
    if (!this.previewScene) return;

    // Remove old character
    if (this.previewCharacter) {
      this.previewScene.remove(this.previewCharacter);
      // Dispose of geometries and materials
      this.previewCharacter.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Create new character
    this.previewCharacter = this.createPreviewCharacter();
    this.previewScene.add(this.previewCharacter);
  }

  animatePreview() {
    if (!this.previewRenderer || !this.previewScene || !this.previewCamera) return;

    // Rotate character slowly
    if (this.previewCharacter) {
      this.previewCharacter.rotation.y += 0.01;
    }

    this.previewRenderer.render(this.previewScene, this.previewCamera);
    this.animationId = requestAnimationFrame(() => this.animatePreview());
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
    const genderRadios = this.element.querySelectorAll('input[name="gender"]');
    const hatVisibleCheckbox = this.element.querySelector('#hat-visible-checkbox');
    const hairstyleSelect = this.element.querySelector('#hairstyle-select');
    const hatColorPicker = this.element.querySelector('#hat-color-picker');
    const overallsColorPicker = this.element.querySelector('#overalls-color-picker');
    const skinColorPicker = this.element.querySelector('#skin-color-picker');
    const saveButton = this.element.querySelector('#save-character-button');
    const closeButton = this.element.querySelector('#close-character-button');

    // Update character name
    nameInput.addEventListener('input', (e) => {
      this.characterName = e.target.value.trim();
    });

    // Update gender
    genderRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.gender = e.target.value;
        // Update hairstyle options when gender changes
        const hairstyleSelect = this.element.querySelector('#hairstyle-select');
        if (hairstyleSelect) {
          hairstyleSelect.innerHTML = this.getHairstyleOptions();
          // Reset to 'none' if current hairstyle doesn't exist for new gender
          const currentValue = hairstyleSelect.value;
          if (!this.getHairstyleOptions().includes(`value="${currentValue}"`)) {
            this.hairstyle = 'none';
            hairstyleSelect.value = 'none';
          } else {
            hairstyleSelect.value = this.hairstyle;
          }
        }
        this.updatePreview();
      });
    });

    // Update hat visibility
    hatVisibleCheckbox.addEventListener('change', (e) => {
      this.hatVisible = e.target.checked;
      this.updatePreview();
    });

    // Update hairstyle
    hairstyleSelect.addEventListener('change', (e) => {
      this.hairstyle = e.target.value;
      this.updatePreview();
    });

    // Update hat color
    hatColorPicker.addEventListener('input', (e) => {
      this.hatColor = e.target.value;
      const preview = this.element.querySelector('#hat-color-picker').nextElementSibling;
      if (preview) {
        preview.style.backgroundColor = this.hatColor;
      }
      this.updatePreview();
    });

    // Update overalls color
    overallsColorPicker.addEventListener('input', (e) => {
      this.overallsColor = e.target.value;
      const preview = this.element.querySelector('#overalls-color-picker').nextElementSibling;
      if (preview) {
        preview.style.backgroundColor = this.overallsColor;
      }
      this.updatePreview();
    });

    // Update skin color
    skinColorPicker.addEventListener('input', (e) => {
      this.skinColor = e.target.value;
      const preview = this.element.querySelector('#skin-color-picker').nextElementSibling;
      if (preview) {
        preview.style.backgroundColor = this.skinColor;
      }
      this.updatePreview();
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
    const genderRadios = this.element.querySelectorAll('input[name="gender"]');
    const hatVisibleCheckbox = this.element.querySelector('#hat-visible-checkbox');
    const hairstyleSelect = this.element.querySelector('#hairstyle-select');
    const hatColorPicker = this.element.querySelector('#hat-color-picker');
    const overallsColorPicker = this.element.querySelector('#overalls-color-picker');
    const skinColorPicker = this.element.querySelector('#skin-color-picker');
    
    if (nameInput) nameInput.value = this.characterName;
    if (genderRadios) {
      genderRadios.forEach(radio => {
        radio.checked = radio.value === this.gender;
      });
    }
    if (hatVisibleCheckbox) hatVisibleCheckbox.checked = this.hatVisible;
    if (hairstyleSelect) {
      hairstyleSelect.innerHTML = this.getHairstyleOptions();
      hairstyleSelect.value = this.hairstyle;
    }
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
    
    // Restart animation if it was stopped
    if (!this.animationId && this.previewRenderer) {
      this.animatePreview();
    }
    
    // Update preview to reflect current settings
    this.updatePreview();
  }

  hide() {
    this.element.classList.remove('visible');
    // Stop animation when hidden
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  onClose(callback) {
    this.onCloseCallback = callback;
  }

  destroy() {
    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clean up Three.js resources
    if (this.previewCharacter) {
      this.previewCharacter.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    if (this.previewRenderer) {
      this.previewRenderer.dispose();
      const canvas = this.previewRenderer.domElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

