export class SettingsMenu {
  constructor(container, tileGrid = null, audioManager = null) {
    this.container = container;
    this.tileGrid = tileGrid;
    this.audioManager = audioManager;
    this.element = null;
    this.gridVisible = true; // Default to visible
    this.musicVolume = 0.5;
    this.menuMusicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.musicMuted = false;
    this.menuMusicMuted = false;
    this.sfxMuted = false;
    this.activeTab = 'general';
    this.onCloseCallback = null;
    this.loadSettings(); // Load saved settings
    this.loadAudioSettings(); // Load audio settings
    this.create();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('taskforge_gridVisible');
      if (saved !== null) {
        this.gridVisible = saved === 'true';
      }
    } catch (error) {
      console.warn('Failed to load grid visibility setting:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('taskforge_gridVisible', this.gridVisible.toString());
    } catch (error) {
      console.warn('Failed to save grid visibility setting:', error);
    }
  }

  loadAudioSettings() {
    try {
      const savedMusicVolume = localStorage.getItem('taskforge_musicVolume');
      if (savedMusicVolume !== null) {
        this.musicVolume = parseFloat(savedMusicVolume);
      }
      
      const savedMenuMusicVolume = localStorage.getItem('taskforge_menuMusicVolume');
      if (savedMenuMusicVolume !== null) {
        this.menuMusicVolume = parseFloat(savedMenuMusicVolume);
      }
      
      const savedSfxVolume = localStorage.getItem('taskforge_sfxVolume');
      if (savedSfxVolume !== null) {
        this.sfxVolume = parseFloat(savedSfxVolume);
      }
      
      const savedMusicMuted = localStorage.getItem('taskforge_musicMuted');
      if (savedMusicMuted !== null) {
        this.musicMuted = savedMusicMuted === 'true';
      }
      
      const savedMenuMusicMuted = localStorage.getItem('taskforge_menuMusicMuted');
      if (savedMenuMusicMuted !== null) {
        this.menuMusicMuted = savedMenuMusicMuted === 'true';
      }
      
      const savedSfxMuted = localStorage.getItem('taskforge_sfxMuted');
      if (savedSfxMuted !== null) {
        this.sfxMuted = savedSfxMuted === 'true';
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  saveAudioSettings() {
    try {
      localStorage.setItem('taskforge_musicVolume', this.musicVolume.toString());
      localStorage.setItem('taskforge_menuMusicVolume', this.menuMusicVolume.toString());
      localStorage.setItem('taskforge_sfxVolume', this.sfxVolume.toString());
      localStorage.setItem('taskforge_musicMuted', this.musicMuted.toString());
      localStorage.setItem('taskforge_menuMusicMuted', this.menuMusicMuted.toString());
      localStorage.setItem('taskforge_sfxMuted', this.sfxMuted.toString());
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'settings-menu';
    this.element.innerHTML = `
      <div class="settings-background"></div>
      <div class="settings-content">
        <h2 class="settings-title">Settings</h2>
        <div class="settings-tabs">
          <button class="settings-tab ${this.activeTab === 'general' ? 'active' : ''}" data-tab="general">General</button>
          <button class="settings-tab ${this.activeTab === 'audio' ? 'active' : ''}" data-tab="audio">Audio</button>
          <button class="settings-tab ${this.activeTab === 'display' ? 'active' : ''}" data-tab="display">Display</button>
        </div>
        <div class="settings-tab-content">
          <div class="tab-panel ${this.activeTab === 'general' ? 'active' : ''}" id="general-tab">
            <div class="settings-options">
              ${this.tileGrid ? `
              <div class="settings-option">
                <span class="settings-label">Show Grid</span>
                <button class="grid-toggle-button ${this.gridVisible ? 'on' : 'off'}" id="grid-toggle">
                  ${this.gridVisible ? 'On' : 'Off'}
                </button>
              </div>
              ` : `
              <div class="settings-option">
                <p class="settings-info">Game settings will be available after starting a game.</p>
              </div>
              `}
            </div>
          </div>
          <div class="tab-panel ${this.activeTab === 'audio' ? 'active' : ''}" id="audio-tab">
            <div class="settings-options">
              <div class="settings-option audio-option">
                <div class="audio-control-row">
                  <span class="settings-label">Game Volume</span>
                  <div class="audio-controls">
                    <input type="range" class="volume-slider" id="sfx-volume-slider" min="0" max="100" value="${Math.round(this.sfxVolume * 100)}">
                    <label class="mute-checkbox-label">
                      <input type="checkbox" class="mute-checkbox" id="sfx-mute-checkbox" ${!this.sfxMuted ? 'checked' : ''}>
                      <span class="mute-checkbox-icon"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="settings-option audio-option">
                <div class="audio-control-row">
                  <span class="settings-label">Main Menu Music Volume</span>
                  <div class="audio-controls">
                    <input type="range" class="volume-slider" id="menu-music-volume-slider" min="0" max="100" value="${Math.round(this.menuMusicVolume * 100)}">
                    <label class="mute-checkbox-label">
                      <input type="checkbox" class="mute-checkbox" id="menu-music-mute-checkbox" ${!this.menuMusicMuted ? 'checked' : ''}>
                      <span class="mute-checkbox-icon"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="settings-option audio-option">
                <div class="audio-control-row">
                  <span class="settings-label">Music Volume</span>
                  <div class="audio-controls">
                    <input type="range" class="volume-slider" id="music-volume-slider" min="0" max="100" value="${Math.round(this.musicVolume * 100)}">
                    <label class="mute-checkbox-label">
                      <input type="checkbox" class="mute-checkbox" id="music-mute-checkbox" ${!this.musicMuted ? 'checked' : ''}>
                      <span class="mute-checkbox-icon"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="tab-panel ${this.activeTab === 'display' ? 'active' : ''}" id="display-tab">
            <div class="settings-options">
              <div class="settings-option">
                <p class="settings-info">Coming soon...</p>
              </div>
            </div>
          </div>
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
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 4000;
        backdrop-filter: blur(8px);
      }

      #settings-menu.visible {
        display: flex;
      }

      .settings-background {
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

      .settings-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 50px 60px;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        width: 650px;
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

      .settings-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 40px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .settings-tabs {
        display: flex;
        gap: 0;
        margin-bottom: 30px;
        border-bottom: 2px solid #34495e;
      }

      .settings-tab {
        flex: 1;
        padding: 12px 20px;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        color: #1a1a1a;
        font-size: 16px;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .settings-tab:hover {
        background: rgba(52, 73, 94, 0.1);
      }

      .settings-tab.active {
        border-bottom-color: #34495e;
        color: #34495e;
      }

      .settings-tab-content {
        min-height: 200px;
      }

      .tab-panel {
        display: none;
      }

      .tab-panel.active {
        display: block;
      }

      .settings-options {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 30px;
        align-items: flex-start;
        width: 100%;
      }

      .settings-option {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .settings-label {
        color: #1a1a1a !important;
        font-size: 18px;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        flex-shrink: 0;
        width: 200px;
        text-align: left;
      }

      .audio-option {
        flex-direction: column;
        align-items: stretch;
      }

      .audio-control-row {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
      }

      .audio-controls {
        display: flex;
        align-items: center;
        gap: 15px;
        flex: 1;
        justify-content: flex-start;
      }

      .volume-slider {
        width: 250px;
        height: 6px;
        border-radius: 3px;
        background: #e0e0e0;
        outline: none;
        -webkit-appearance: none;
        flex-shrink: 0;
      }

      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #34495e;
        cursor: pointer;
      }

      .volume-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #34495e;
        cursor: pointer;
        border: none;
      }

      .mute-checkbox-label {
        position: relative;
        display: inline-block;
        cursor: pointer;
        width: 24px;
        height: 24px;
      }

      .mute-checkbox {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        width: 24px;
        height: 24px;
        margin: 0;
      }

      .mute-checkbox-icon {
        position: absolute;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        border: 2px solid #1a1a1a;
        transform: rotate(45deg);
        transition: all 0.2s ease;
      }

      .mute-checkbox:checked + .mute-checkbox-icon {
        background: #6FD6FF;
        border-color: #6FD6FF;
      }

      .mute-checkbox:checked + .mute-checkbox-icon::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        color: white;
        font-size: 14px;
        font-weight: bold;
      }

      .grid-toggle-button {
        position: relative;
        background: rgba(231, 76, 60, 0.9);
        border: 2px solid #e74c3c;
        border-radius: 6px;
        color: #ffffff;
        font-size: 16px;
        padding: 6px 16px;
        min-width: 60px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        overflow: hidden;
      }

      .grid-toggle-button.on {
        background: rgba(46, 204, 113, 0.9);
        border-color: #2ecc71;
        color: #ffffff;
      }

      .grid-toggle-button.off {
        background: rgba(231, 76, 60, 0.9);
        border-color: #e74c3c;
        color: #ffffff;
      }

      .grid-toggle-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.4s ease;
      }

      .grid-toggle-button:hover::before {
        left: 100%;
      }

      .grid-toggle-button:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
      }

      .grid-toggle-button.on:hover {
        border-color: #27ae60;
        background: rgba(39, 174, 96, 1);
      }

      .grid-toggle-button.off:hover {
        border-color: #c0392b;
        background: rgba(192, 57, 43, 1);
      }

      .grid-toggle-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .settings-info {
        color: #1a1a1a;
        font-size: 16px;
        font-family: 'Arial', sans-serif;
        font-style: italic;
        text-align: center;
        margin: 0;
        opacity: 0.8;
      }

      .settings-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 20px;
      }

      .settings-button {
        position: relative;
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
        overflow: hidden;
      }

      .settings-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
        transition: left 0.4s ease;
      }

      .settings-button:hover::before {
        left: 100%;
      }

      .settings-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .settings-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(style);

    this.setupEventListeners();
    this.setupKeyboardListener();
    // Apply audio settings on creation
    if (this.audioManager) {
      this.applyAudioSettings();
    }
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
    const tabButtons = this.element.querySelectorAll('.settings-tab');
    const sfxVolumeSlider = this.element.querySelector('#sfx-volume-slider');
    const menuMusicVolumeSlider = this.element.querySelector('#menu-music-volume-slider');
    const musicVolumeSlider = this.element.querySelector('#music-volume-slider');
    const sfxMuteCheckbox = this.element.querySelector('#sfx-mute-checkbox');
    const menuMusicMuteCheckbox = this.element.querySelector('#menu-music-mute-checkbox');
    const musicMuteCheckbox = this.element.querySelector('#music-mute-checkbox');

    // Tab switching
    tabButtons.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Grid toggle
    if (gridToggle) {
      gridToggle.addEventListener('click', () => {
        this.gridVisible = !this.gridVisible;
        this.updateToggleButton();
        this.updateGridVisibility();
        this.saveSettings();
      });
    }

    // Audio volume sliders
    if (sfxVolumeSlider) {
      sfxVolumeSlider.addEventListener('input', (e) => {
        this.sfxVolume = parseFloat(e.target.value) / 100;
        if (this.audioManager) {
          this.audioManager.setSFXVolume(this.sfxVolume);
        }
        this.saveAudioSettings();
      });
    }

    if (menuMusicVolumeSlider) {
      menuMusicVolumeSlider.addEventListener('input', (e) => {
        this.menuMusicVolume = parseFloat(e.target.value) / 100;
        if (this.audioManager) {
          this.audioManager.setMenuMusicVolume(this.menuMusicVolume);
        }
        this.saveAudioSettings();
      });
    }

    if (musicVolumeSlider) {
      musicVolumeSlider.addEventListener('input', (e) => {
        this.musicVolume = parseFloat(e.target.value) / 100;
        if (this.audioManager) {
          this.audioManager.setMusicVolume(this.musicVolume);
        }
        this.saveAudioSettings();
      });
    }

    // Mute checkboxes (checked = unmuted, unchecked = muted)
    if (sfxMuteCheckbox) {
      sfxMuteCheckbox.addEventListener('change', (e) => {
        this.sfxMuted = !e.target.checked;
        this.applyAudioSettings();
        this.saveAudioSettings();
      });
    }

    if (menuMusicMuteCheckbox) {
      menuMusicMuteCheckbox.addEventListener('change', (e) => {
        this.menuMusicMuted = !e.target.checked;
        this.applyAudioSettings();
        this.saveAudioSettings();
      });
    }

    if (musicMuteCheckbox) {
      musicMuteCheckbox.addEventListener('change', (e) => {
        this.musicMuted = !e.target.checked;
        this.applyAudioSettings();
        this.saveAudioSettings();
      });
    }

    closeButton.addEventListener('click', () => {
      this.hide();
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Update tab buttons
    const tabButtons = this.element.querySelectorAll('.settings-tab');
    tabButtons.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update tab panels
    const tabPanels = this.element.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
      if (panel.id === `${tabName}-tab`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  }

  updateToggleButton() {
    const gridToggle = this.element.querySelector('#grid-toggle');
    if (gridToggle) {
      gridToggle.textContent = this.gridVisible ? 'On' : 'Off';
      gridToggle.className = `grid-toggle-button ${this.gridVisible ? 'on' : 'off'}`;
    }
  }

  setTileGrid(tileGrid) {
    this.tileGrid = tileGrid;
    // Update the UI if settings menu is already created
    if (this.element && tileGrid) {
      const generalTabPanel = this.element.querySelector('#general-tab .settings-options');
      if (generalTabPanel && !generalTabPanel.querySelector('#grid-toggle')) {
        generalTabPanel.innerHTML = `
          <div class="settings-option">
            <span class="settings-label">Show Grid</span>
            <button class="grid-toggle-button ${this.gridVisible ? 'on' : 'off'}" id="grid-toggle">
              ${this.gridVisible ? 'On' : 'Off'}
            </button>
          </div>
        `;
        const gridToggle = this.element.querySelector('#grid-toggle');
        if (gridToggle) {
          gridToggle.addEventListener('click', () => {
            this.gridVisible = !this.gridVisible;
            this.updateToggleButton();
            this.updateGridVisibility();
            this.saveSettings();
          });
        }
      }
    }
    // Apply the saved setting to the grid immediately
    this.updateGridVisibility();
  }

  updateGridVisibility() {
    if (this.tileGrid && this.tileGrid.gridHelper) {
      this.tileGrid.gridHelper.visible = this.gridVisible;
    }
  }

  getGridVisible() {
    return this.gridVisible;
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    // Reload settings in case they were changed elsewhere
    this.loadSettings();
    this.loadAudioSettings();
    // Update toggle button to reflect current state
    this.updateToggleButton();
    // Apply the setting to the grid
    this.updateGridVisibility();
    // Apply audio settings
    this.applyAudioSettings();
    this.element.classList.add('visible');
  }

  applyAudioSettings() {
    if (this.audioManager) {
      this.audioManager.setMusicVolume(this.musicVolume);
      this.audioManager.setMenuMusicVolume(this.menuMusicVolume);
      this.audioManager.setSFXVolume(this.sfxVolume);
      
      // Store mute states in AudioManager for reference when new sounds play
      if (this.audioManager) {
        this.audioManager.musicMuted = this.musicMuted;
        this.audioManager.menuMusicMuted = this.menuMusicMuted;
        this.audioManager.sfxMuted = this.sfxMuted;
      }
      
      // Apply mute states to all existing sounds
      if (this.audioManager.sounds) {
        this.audioManager.sounds.forEach((sound, name) => {
          // Check if it's a music track
          if (name === 'main_menu') {
            // Apply menu music mute state
            sound.muted = this.menuMusicMuted;
          } else if (this.audioManager.gameplayMusicTracks?.includes(name)) {
            // Apply gameplay music mute state
            sound.muted = this.musicMuted;
          } else {
            // Apply SFX mute state
            sound.muted = this.sfxMuted;
          }
        });
      }
      
      // Also apply to current music if it exists
      if (this.audioManager.currentMusic) {
        const currentMusicName = Array.from(this.audioManager.sounds.entries())
          .find(([name, sound]) => sound === this.audioManager.currentMusic)?.[0];
        if (currentMusicName === 'main_menu') {
          this.audioManager.currentMusic.muted = this.menuMusicMuted;
        } else {
          this.audioManager.currentMusic.muted = this.musicMuted;
        }
      }
    }
    
    // Update UI sliders and checkboxes
    const sfxVolumeSlider = this.element.querySelector('#sfx-volume-slider');
    const menuMusicVolumeSlider = this.element.querySelector('#menu-music-volume-slider');
    const musicVolumeSlider = this.element.querySelector('#music-volume-slider');
    const sfxMuteCheckbox = this.element.querySelector('#sfx-mute-checkbox');
    const menuMusicMuteCheckbox = this.element.querySelector('#menu-music-mute-checkbox');
    const musicMuteCheckbox = this.element.querySelector('#music-mute-checkbox');
    
    if (sfxVolumeSlider) {
      sfxVolumeSlider.value = Math.round(this.sfxVolume * 100);
    }
    if (menuMusicVolumeSlider) {
      menuMusicVolumeSlider.value = Math.round(this.menuMusicVolume * 100);
    }
    if (musicVolumeSlider) {
      musicVolumeSlider.value = Math.round(this.musicVolume * 100);
    }
    if (sfxMuteCheckbox) {
      sfxMuteCheckbox.checked = !this.sfxMuted;
    }
    if (menuMusicMuteCheckbox) {
      menuMusicMuteCheckbox.checked = !this.menuMusicMuted;
    }
    if (musicMuteCheckbox) {
      musicMuteCheckbox.checked = !this.musicMuted;
    }
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

