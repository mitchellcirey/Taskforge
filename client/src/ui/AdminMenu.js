import { getItemTypeRegistry, getItemType } from '../game/ItemTypeRegistry.js';
import { BuildingTypes, getBuildingType } from '../game/BuildingTypes.js';
import { ItemType } from '../game/items/ItemType.js';
import * as THREE from 'three';

// Resource item types (items that can be spawned as resources)
const RESOURCE_ITEM_TYPES = ['wood', 'stone', 'stick'];

export class AdminMenu {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.adminMode = false;
    this.placementMode = false;
    this.selectedCategory = null;
    this.selectedType = null;
    this.previewMesh = null;
    this.scene = null;
    this.tileGrid = null;
    this.cancelButton = null;
    this.timeUpdateInterval = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'admin-menu';
    this.element.innerHTML = `
      <div class="admin-background"></div>
      <div class="admin-content">
        <h2 class="admin-title">Admin Menu</h2>
        <div class="admin-options">
          <div class="admin-option">
            <label class="admin-label">
              <span class="toggle-label">Bypass Build/Craft Requirements</span>
              <div class="toggle-switch">
                <input type="checkbox" id="admin-bypass-toggle" ${this.adminMode ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
          <div class="admin-option time-control">
            <div class="time-control-header">
              <span class="admin-label">Game Time</span>
              <span class="game-time-clock" id="game-time-clock">Day 00:00</span>
            </div>
            <div class="time-slider-container">
              <input type="range" class="time-slider" id="time-slider" min="0" max="100" value="25" step="0.1">
              <div class="time-slider-labels">
                <span>Dawn</span>
                <span>Noon</span>
                <span>Dusk</span>
                <span>Midnight</span>
              </div>
            </div>
          </div>
          <div class="admin-option weather-control">
            <div class="weather-control-header">
              <span class="admin-label">Weather</span>
              <span class="current-weather" id="current-weather">Clear</span>
            </div>
            <div class="weather-selector-container">
              <select class="weather-select" id="weather-select">
                <option value="clear">Clear</option>
                <option value="rain">Rain</option>
              </select>
            </div>
          </div>
        </div>
        <div class="admin-tabs">
          <button class="admin-tab active" data-tab="resources">Resources</button>
          <button class="admin-tab" data-tab="items">Items</button>
          <button class="admin-tab" data-tab="objects">Objects</button>
          <button class="admin-tab" data-tab="buildings">Buildings</button>
        </div>
        <div class="admin-tab-content">
          <div class="admin-tab-panel active" data-panel="resources">
            <div class="admin-list" id="resources-list"></div>
          </div>
          <div class="admin-tab-panel" data-panel="items">
            <div class="admin-list" id="items-list"></div>
          </div>
          <div class="admin-tab-panel" data-panel="objects">
            <div class="admin-list" id="objects-list"></div>
          </div>
          <div class="admin-tab-panel" data-panel="buildings">
            <div class="admin-list" id="buildings-list"></div>
          </div>
        </div>
        <div class="admin-placement-indicator" id="placement-indicator" style="display: none;">
          <span>Click on terrain to place: <strong id="placement-type-name"></strong></span>
          <button class="admin-button-small" id="cancel-placement">Cancel</button>
        </div>
        <div class="admin-buttons">
          <button class="admin-button" id="close-admin-button">Close</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #admin-menu {
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
        pointer-events: none;
      }

      #admin-menu.visible {
        display: flex;
        pointer-events: auto;
      }

      .admin-background {
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

      .admin-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 50px 60px;
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
        pointer-events: auto;
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

      .admin-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 30px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .admin-options {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 30px;
        align-items: flex-start;
        width: 100%;
      }

      .admin-option {
        width: 100%;
      }

      .admin-option.time-control,
      .admin-option.weather-control {
        padding: 15px;
        background: rgba(52, 73, 94, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(52, 73, 94, 0.2);
      }

      .time-control-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .game-time-clock {
        font-size: 18px;
        font-weight: 600;
        color: #34495e;
        font-family: 'Courier New', monospace;
        background: rgba(255, 255, 255, 0.8);
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid rgba(52, 73, 94, 0.3);
      }

      .time-slider-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .time-slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(to right, 
          #FF6B47 0%, 
          #87CEEB 25%, 
          #87CEEB 50%, 
          #FF6B47 75%, 
          #0A0E27 100%);
        outline: none;
        -webkit-appearance: none;
        cursor: pointer;
      }

      .time-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #34495e;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }

      .time-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #34495e;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }

      .time-slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
        font-family: 'Arial', sans-serif;
        font-weight: 500;
      }

      .weather-control-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .current-weather {
        font-size: 18px;
        font-weight: 600;
        color: #34495e;
        font-family: 'Courier New', monospace;
        background: rgba(255, 255, 255, 0.8);
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid rgba(52, 73, 94, 0.3);
        text-transform: capitalize;
      }

      .weather-selector-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .weather-select {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #34495e;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.95);
        color: #1a1a1a;
        font-size: 16px;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
      }

      .weather-select:hover {
        border-color: #2c3e50;
        background: rgba(255, 255, 255, 1);
      }

      .weather-select:focus {
        box-shadow: 0 0 0 3px rgba(52, 73, 94, 0.2);
      }

      .admin-label {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #1a1a1a !important;
        font-size: 18px;
        cursor: pointer;
        user-select: none;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
      }

      .admin-label * {
        color: #1a1a1a !important;
      }

      .toggle-label {
        color: #1a1a1a !important;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 30px;
        margin-left: 12px;
      }

      .toggle-switch input[type="checkbox"] {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.3s;
        border-radius: 30px;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 22px;
        width: 22px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .toggle-switch input:checked + .toggle-slider {
        background-color: #34495e;
      }

      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(30px);
      }

      .toggle-switch input:focus + .toggle-slider {
        box-shadow: 0 0 1px #34495e, 0 0 0 3px rgba(52, 73, 94, 0.2);
      }

      .admin-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #34495e;
      }

      .admin-tab {
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        color: #1a1a1a;
        font-size: 16px;
        padding: 12px 20px;
        cursor: pointer;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.2s ease;
        margin-bottom: -2px;
      }

      .admin-tab:hover {
        background: rgba(52, 73, 94, 0.1);
        border-bottom-color: rgba(52, 73, 94, 0.3);
      }

      .admin-tab.active {
        border-bottom-color: #34495e;
        color: #34495e;
      }

      .admin-tab-content {
        min-height: 300px;
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 20px;
      }

      .admin-tab-panel {
        display: none;
      }

      .admin-tab-panel.active {
        display: block;
      }

      .admin-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
        padding: 10px;
      }

      .admin-list-item {
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid #34495e;
        border-radius: 8px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        color: #1a1a1a;
        text-transform: capitalize;
      }

      .admin-list-item:hover {
        background: rgba(52, 73, 94, 0.1);
        border-color: #2c3e50;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .admin-list-item:active {
        transform: translateY(0);
      }

      .admin-placement-indicator {
        background: rgba(52, 73, 94, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Arial', sans-serif;
        font-size: 16px;
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 6000;
        pointer-events: auto;
      }

      .admin-placement-indicator strong {
        text-transform: capitalize;
      }

      .admin-button-small {
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        padding: 8px 16px;
        cursor: pointer;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .admin-button-small:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .admin-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 20px;
      }

      .admin-button {
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

      .admin-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
        transition: left 0.4s ease;
      }

      .admin-button:hover::before {
        left: 100%;
      }

      .admin-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .admin-button:active {
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
      // Check for backtick/tilde key (`)
      if (e.key === '`' || e.key === '~') {
        if (this.element.classList.contains('visible')) {
          this.hide();
        } else {
          this.show();
        }
      }
      if (e.key === 'Escape') {
        if (this.placementMode) {
          this.exitPlacementMode();
        } else if (this.element.classList.contains('visible')) {
          this.hide();
        }
      }
    });
  }

  setupEventListeners() {
    const bypassToggle = this.element.querySelector('#admin-bypass-toggle');
    const closeButton = this.element.querySelector('#close-admin-button');
    const cancelPlacementButton = this.element.querySelector('#cancel-placement');
    const tabs = this.element.querySelectorAll('.admin-tab');
    const timeSlider = this.element.querySelector('#time-slider');
    const weatherSelect = this.element.querySelector('#weather-select');

    bypassToggle.addEventListener('change', (e) => {
      this.adminMode = e.target.checked;
      window.adminMode = this.adminMode;
    });

    closeButton.addEventListener('click', () => {
      this.hide();
    });

    cancelPlacementButton.addEventListener('click', () => {
      this.exitPlacementMode();
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Weather selector
    if (weatherSelect) {
      weatherSelect.addEventListener('change', (e) => {
        const weatherType = e.target.value;
        this.setWeather(weatherType);
      });
    }

    // Time slider
    if (timeSlider) {
      // Pause cycle when user starts dragging
      timeSlider.addEventListener('mousedown', () => {
        this.pauseCycle();
      });
      
      timeSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        // Convert slider value (0-100) to cycle time (0-1)
        const cycleTime = value / 100;
        this.setTimeOfDay(cycleTime);
      });
      
      // Resume cycle when user releases slider
      timeSlider.addEventListener('mouseup', () => {
        this.resumeCycle();
      });
      
      // Also handle touch events for mobile
      timeSlider.addEventListener('touchstart', () => {
        this.pauseCycle();
      });
      
      timeSlider.addEventListener('touchend', () => {
        this.resumeCycle();
      });
    }
  }


  switchTab(tabName) {
    // Update tab buttons
    const tabs = this.element.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update tab panels
    const panels = this.element.querySelectorAll('.admin-tab-panel');
    panels.forEach(panel => {
      if (panel.dataset.panel === tabName) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Regenerate list for active tab
    this.generateLists();
  }

  generateLists() {
    const activeTab = this.element.querySelector('.admin-tab.active');
    if (!activeTab) return;

    const tabName = activeTab.dataset.tab;
    
    switch (tabName) {
      case 'resources':
        this.generateResourcesList();
        break;
      case 'items':
        this.generateItemsList();
        break;
      case 'objects':
        this.generateObjectsList();
        break;
      case 'buildings':
        this.generateBuildingsList();
        break;
    }
  }

  generateResourcesList() {
    const list = this.element.querySelector('#resources-list');
    list.innerHTML = '';

    const registry = getItemTypeRegistry();
    const allItems = registry.getAll();
    
    // Filter to only resource types
    const resourceItems = allItems.filter(item => RESOURCE_ITEM_TYPES.includes(item.getId()));

    resourceItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'admin-list-item';
      itemElement.textContent = item.getDisplayName();
      itemElement.addEventListener('click', () => {
        this.enterPlacementMode('resources', item.getId(), item.getDisplayName());
      });
      list.appendChild(itemElement);
    });

    if (resourceItems.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No resources available</div>';
    }
  }

  generateItemsList() {
    const list = this.element.querySelector('#items-list');
    list.innerHTML = '';

    const registry = getItemTypeRegistry();
    const allItems = registry.getAll();

    allItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'admin-list-item';
      itemElement.textContent = item.getDisplayName();
      itemElement.addEventListener('click', () => {
        this.enterPlacementMode('items', item.getId(), item.getDisplayName());
      });
      list.appendChild(itemElement);
    });

    if (allItems.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No items available</div>';
    }
  }

  generateObjectsList() {
    const list = this.element.querySelector('#objects-list');
    list.innerHTML = '';

    // Currently only Tree is a harvestable object
    // This can be extended in the future
    const harvestableObjects = [
      { id: 'tree', name: 'Tree' }
    ];

    harvestableObjects.forEach(obj => {
      const itemElement = document.createElement('div');
      itemElement.className = 'admin-list-item';
      itemElement.textContent = obj.name;
      itemElement.addEventListener('click', () => {
        this.enterPlacementMode('objects', obj.id, obj.name);
      });
      list.appendChild(itemElement);
    });

    if (harvestableObjects.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No objects available</div>';
    }
  }

  generateBuildingsList() {
    const list = this.element.querySelector('#buildings-list');
    list.innerHTML = '';

    const buildingTypes = Object.values(BuildingTypes);

    buildingTypes.forEach(buildingType => {
      const itemElement = document.createElement('div');
      itemElement.className = 'admin-list-item';
      itemElement.textContent = buildingType.name;
      itemElement.addEventListener('click', () => {
        this.enterPlacementMode('buildings', buildingType.id, buildingType.name);
      });
      list.appendChild(itemElement);
    });

    if (buildingTypes.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No buildings available</div>';
    }
  }

  enterPlacementMode(category, type, displayName) {
    this.placementMode = true;
    this.selectedCategory = category;
    this.selectedType = type;

    const indicator = this.element.querySelector('#placement-indicator');
    const typeName = this.element.querySelector('#placement-type-name');
    typeName.textContent = displayName;
    indicator.style.display = 'flex';

    // Hide menu but keep placement mode active
    this.element.classList.remove('visible');

    // Change cursor to indicate placement mode
    document.body.style.cursor = 'crosshair';

    // Get scene and tileGrid from game instance
    const gameInstance = window.gameInstance;
    if (gameInstance && gameInstance.sceneManager) {
      this.scene = gameInstance.sceneManager.scene;
      this.tileGrid = gameInstance.sceneManager.tileGrid;
    }

    // Show cancel button
    this.showCancelButton();
  }

  exitPlacementMode() {
    this.placementMode = false;
    this.selectedCategory = null;
    this.selectedType = null;

    const indicator = this.element.querySelector('#placement-indicator');
    indicator.style.display = 'none';

    // Remove preview mesh
    this.removePreview();

    // Restore cursor
    document.body.style.cursor = 'default';

    // Hide cancel button
    this.hideCancelButton();

    // Show menu again if it was visible
    if (this.element.parentNode) {
      this.element.classList.add('visible');
    }
  }

  showCancelButton() {
    if (this.cancelButton) {
      this.cancelButton.style.display = 'block';
      return;
    }

    // Create cancel button
    this.cancelButton = document.createElement('button');
    this.cancelButton.id = 'admin-cancel-placement-button';
    this.cancelButton.textContent = 'Cancel Placing';
    this.cancelButton.className = 'admin-cancel-button';

    // Add styles if not already added
    if (!document.getElementById('admin-cancel-button-styles')) {
      const style = document.createElement('style');
      style.id = 'admin-cancel-button-styles';
      style.textContent = `
        #admin-cancel-placement-button {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1001;
          background: rgba(220, 53, 69, 0.9);
          border: 2px solid #dc3545;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          padding: 12px 24px;
          cursor: pointer;
          font-family: 'Arial', sans-serif;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        #admin-cancel-placement-button:hover {
          background: rgba(220, 53, 69, 1);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
          transform: translateX(-50%) translateY(-2px);
        }

        #admin-cancel-placement-button:active {
          transform: translateX(-50%) translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `;
      document.head.appendChild(style);
    }

    // Add click handler
    this.cancelButton.addEventListener('click', () => {
      this.exitPlacementMode();
    });

    // Add to container
    this.container.appendChild(this.cancelButton);
  }

  hideCancelButton() {
    if (this.cancelButton) {
      this.cancelButton.style.display = 'none';
    }
  }

  updatePreview(worldX, worldZ) {
    if (!this.placementMode) {
      return;
    }

    // Get scene and tileGrid if not already set
    if (!this.scene || !this.tileGrid) {
      const gameInstance = window.gameInstance;
      if (gameInstance && gameInstance.sceneManager) {
        this.scene = gameInstance.sceneManager.scene;
        this.tileGrid = gameInstance.sceneManager.tileGrid;
      }
    }

    if (!this.scene || !this.tileGrid) {
      return;
    }

    // Remove old preview
    this.removePreview();

    // Snap to nearest tile
    const { tileX, tileZ } = this.tileGrid.worldToTile(worldX, worldZ);
    const tile = this.tileGrid.getTile(tileX, tileZ);
    
    if (!tile) return;

    try {
      switch (this.selectedCategory) {
        case 'resources':
        case 'items':
          this.createResourcePreview(tile.worldX, tile.worldZ);
          break;

        case 'objects':
          if (this.selectedType === 'tree') {
            this.createTreePreview(tile.worldX, tile.worldZ);
          }
          break;

        case 'buildings':
          this.createBuildingPreview(tileX, tileZ);
          break;
      }
    } catch (error) {
      console.error('Error creating preview:', error);
    }
  }

  createResourcePreview(worldX, worldZ) {
    const itemType = getItemType(this.selectedType);
    if (!itemType) {
      console.log('No item type found for:', this.selectedType);
      return;
    }

    // Get the world model
    const model = itemType.getWorldModel();
    if (!model) {
      console.log('No world model for item type:', this.selectedType);
      return;
    }

    // Clone the model for preview
    const loader = new THREE.ObjectLoader();
    const json = model.toJSON();
    const previewModel = loader.parse(json);

    // Reset position and rotation to ensure clean placement
    previewModel.position.set(0, 0, 0);
    previewModel.rotation.set(0, 0, 0);
    previewModel.scale.set(1, 1, 1);

    // Make it a hologram (semi-transparent, glowing)
    previewModel.traverse((child) => {
      if (child.isMesh) {
        // Store original position relative to parent
        const originalPos = child.position.clone();
        
        child.material = new THREE.MeshStandardMaterial({
          color: 0x00FF00, // Green hologram color
          opacity: 0.5,
          transparent: true,
          emissive: 0x00FF00,
          emissiveIntensity: 0.3,
          side: THREE.DoubleSide
        });
        child.castShadow = false;
        child.receiveShadow = false;
        
        // Restore original relative position
        child.position.copy(originalPos);
      }
    });

    // Position it - use the same positioning logic as Resource
    const yPos = this.selectedType === 'stick' ? 
      ItemType.STICK_WORLD_Y_POSITION : 
      ItemType.DEFAULT_WORLD_Y_POSITION;
    
    previewModel.position.set(worldX, yPos, worldZ);

    this.previewMesh = previewModel;
    this.scene.add(this.previewMesh);
    console.log('Resource preview created at:', worldX, yPos, worldZ);
  }

  createTreePreview(worldX, worldZ) {
    // Create a simple tree preview (green cone with low opacity)
    const geometry = new THREE.ConeGeometry(0.5, 1.5, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      opacity: 0.5,
      transparent: true,
      emissive: 0x00FF00,
      emissiveIntensity: 0.3
    });
    const preview = new THREE.Mesh(geometry, material);
    preview.position.set(worldX, 0.75, worldZ);
    
    this.previewMesh = preview;
    this.scene.add(this.previewMesh);
    console.log('Tree preview created at:', worldX, 0.75, worldZ);
  }

  createBuildingPreview(tileX, tileZ) {
    const buildingType = getBuildingType(this.selectedType);
    if (!buildingType) return;

    const canPlace = this.canPlaceBuilding(tileX, tileZ);
    const tile = this.tileGrid.getTile(tileX, tileZ);
    if (!tile) return;

    // Create preview geometry matching building size
    const geometry = new THREE.BoxGeometry(
      buildingType.size.width * this.tileGrid.tileSize * 0.9,
      1,
      buildingType.size.height * this.tileGrid.tileSize * 0.9
    );
    const material = new THREE.MeshStandardMaterial({ 
      color: canPlace ? 0x00FF00 : 0xFF0000,
      opacity: 0.5,
      transparent: true,
      emissive: canPlace ? 0x00FF00 : 0xFF0000,
      emissiveIntensity: 0.3
    });
    this.previewMesh = new THREE.Mesh(geometry, material);
    
    // Position at tile center
    const centerX = tile.worldX;
    const centerZ = tile.worldZ;
    
    this.previewMesh.position.set(centerX, 0.5, centerZ);
    this.scene.add(this.previewMesh);
    console.log('Building preview created at:', centerX, 0.5, centerZ, 'canPlace:', canPlace);
  }

  canPlaceBuilding(tileX, tileZ) {
    const gameInstance = window.gameInstance;
    if (!gameInstance || !gameInstance.sceneManager || !gameInstance.sceneManager.buildingManager) {
      return true; // Default to true if we can't check
    }
    return gameInstance.sceneManager.buildingManager.canPlaceBuilding(tileX, tileZ, this.selectedType);
  }

  removePreview() {
    if (this.previewMesh && this.scene) {
      this.scene.remove(this.previewMesh);
      // Dispose of geometry and materials
      if (this.previewMesh.geometry) {
        this.previewMesh.geometry.dispose();
      }
      if (this.previewMesh.material) {
        if (Array.isArray(this.previewMesh.material)) {
          this.previewMesh.material.forEach(mat => mat.dispose());
        } else {
          this.previewMesh.material.dispose();
        }
      }
      // If it's a group, dispose of children
      if (this.previewMesh instanceof THREE.Group) {
        this.previewMesh.traverse((child) => {
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
      this.previewMesh = null;
    }
  }


  pauseCycle() {
    const gameInstance = window.gameInstance;
    if (gameInstance && gameInstance.sceneManager) {
      gameInstance.sceneManager.setDayNightCyclePaused(true);
    }
  }

  resumeCycle() {
    const gameInstance = window.gameInstance;
    if (gameInstance && gameInstance.sceneManager) {
      gameInstance.sceneManager.setDayNightCyclePaused(false);
    }
  }

  setTimeOfDay(cycleTime) {
    // Set time of day in DayNightCycle
    const gameInstance = window.gameInstance;
    if (gameInstance && gameInstance.sceneManager && gameInstance.sceneManager.dayNightCycle) {
      gameInstance.sceneManager.dayNightCycle.setTimeOfDay(cycleTime);
      this.updateTimeDisplay();
    }
  }

  updateTimeDisplay() {
    const gameInstance = window.gameInstance;
    const clockElement = this.element.querySelector('#game-time-clock');
    const timeSlider = this.element.querySelector('#time-slider');
    
    if (!gameInstance || !gameInstance.sceneManager || !gameInstance.sceneManager.dayNightCycle) {
      if (clockElement) clockElement.textContent = 'N/A';
      return;
    }

    const dayNightCycle = gameInstance.sceneManager.dayNightCycle;
    const cycleTime = dayNightCycle.getCycleTime();
    const formattedTime = dayNightCycle.getFormattedTime();
    
    if (clockElement) {
      clockElement.textContent = formattedTime;
    }
    
    if (timeSlider) {
      // Update slider position (convert cycleTime 0-1 to slider 0-100)
      timeSlider.value = cycleTime * 100;
    }
  }

  setWeather(weatherType) {
    const gameInstance = window.gameInstance;
    if (gameInstance && gameInstance.sceneManager && gameInstance.sceneManager.weatherManager) {
      gameInstance.sceneManager.weatherManager.setWeather(weatherType);
      this.updateWeatherDisplay();
    }
  }

  updateWeatherDisplay() {
    const gameInstance = window.gameInstance;
    const weatherElement = this.element.querySelector('#current-weather');
    const weatherSelect = this.element.querySelector('#weather-select');
    
    if (!gameInstance || !gameInstance.sceneManager || !gameInstance.sceneManager.weatherManager) {
      if (weatherElement) weatherElement.textContent = 'N/A';
      return;
    }

    const weatherManager = gameInstance.sceneManager.weatherManager;
    const currentWeather = weatherManager.getCurrentWeather();
    const weatherName = currentWeather === 'rain' ? 'Rain' : 'Clear';
    
    if (weatherElement) {
      weatherElement.textContent = weatherName;
    }
    
    if (weatherSelect) {
      weatherSelect.value = currentWeather;
    }
  }

  startTimeUpdate() {
    // Update time display every second
    this.timeUpdateInterval = setInterval(() => {
      if (this.element.classList.contains('visible')) {
        this.updateTimeDisplay();
      }
    }, 1000);
  }

  stopTimeUpdate() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.classList.add('visible');
    this.generateLists(); // Regenerate lists when shown
    this.updateTimeDisplay(); // Update time display when shown
    this.updateWeatherDisplay(); // Update weather display when shown
    this.startTimeUpdate(); // Start updating time display
  }

  hide() {
    this.element.classList.remove('visible');
    this.stopTimeUpdate(); // Stop updating time display
    if (this.placementMode) {
      this.exitPlacementMode();
    }
  }

  isAdminMode() {
    return this.adminMode;
  }

  isPlacementMode() {
    return this.placementMode;
  }

  destroy() {
    this.stopTimeUpdate(); // Stop time updates
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    if (this.cancelButton && this.cancelButton.parentNode) {
      this.cancelButton.parentNode.removeChild(this.cancelButton);
      this.cancelButton = null;
    }
    this.removePreview();
  }
}
