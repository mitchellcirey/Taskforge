import { BuildingTypes } from '../game/BuildingTypes.js';

export class BuildingMenu {
  constructor(container, buildingManager, player, craftingSystem, villagerManager) {
    this.container = container;
    this.buildingManager = buildingManager;
    this.player = player;
    this.craftingSystem = craftingSystem;
    this.villagerManager = villagerManager;
    this.element = null;
    this.activeTab = 'buildings';
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'building-menu';
    this.element.innerHTML = `
      <div class="building-background"></div>
      <div class="building-content">
        <h2 class="building-title">Build Menu</h2>
        <div class="building-tabs">
          <button class="building-tab ${this.activeTab === 'buildings' ? 'active' : ''}" data-tab="buildings">Buildings</button>
          <button class="building-tab ${this.activeTab === 'tools' ? 'active' : ''}" data-tab="tools">Tools</button>
          <button class="building-tab ${this.activeTab === 'villagers' ? 'active' : ''}" data-tab="villagers">Villagers</button>
        </div>
        <div class="building-tab-content">
          <div class="building-tab-panel ${this.activeTab === 'buildings' ? 'active' : ''}" id="buildings-tab">
            <div class="building-list" id="buildings-list"></div>
          </div>
          <div class="building-tab-panel ${this.activeTab === 'tools' ? 'active' : ''}" id="tools-tab">
            <div class="building-list" id="tools-list"></div>
          </div>
          <div class="building-tab-panel ${this.activeTab === 'villagers' ? 'active' : ''}" id="villagers-tab">
            <div class="building-list" id="villagers-list"></div>
          </div>
        </div>
        <div class="building-buttons">
          <button class="building-button" id="close-building-menu">Close</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #building-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        backdrop-filter: blur(8px);
        pointer-events: none;
      }

      #building-menu.visible {
        display: flex;
        pointer-events: auto;
      }

      .building-background {
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

      .building-content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 50px 60px;
        background: rgba(255, 255, 255, 0.95);
        border: 3px solid #34495e;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        min-width: 500px;
        max-width: 800px;
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

      .building-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 30px 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .building-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #34495e;
      }

      .building-tab {
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

      .building-tab:hover {
        background: rgba(52, 73, 94, 0.1);
        border-bottom-color: rgba(52, 73, 94, 0.3);
      }

      .building-tab.active {
        border-bottom-color: #34495e;
        color: #34495e;
      }

      .building-tab-content {
        min-height: 300px;
        max-height: 500px;
        overflow-y: auto;
        margin-bottom: 20px;
      }

      .building-tab-panel {
        display: none;
      }

      .building-tab-panel.active {
        display: block;
      }

      .building-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        padding: 10px;
      }

      .building-item {
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid #34495e;
        border-radius: 8px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        font-family: 'Arial', sans-serif;
      }

      .building-item:hover {
        background: rgba(52, 73, 94, 0.1);
        border-color: #2c3e50;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .building-item:active {
        transform: translateY(0);
      }

      .building-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .building-item.disabled:hover {
        transform: none;
        box-shadow: none;
      }

      .building-item-name {
        color: #1a1a1a;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        text-transform: capitalize;
      }

      .building-item-description {
        color: #666;
        font-size: 14px;
        margin-bottom: 10px;
      }

      .building-item-cost {
        color: #34495e;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 5px;
      }

      .building-item-status {
        color: #7f8c8d;
        font-size: 12px;
        font-style: italic;
      }

      .villager-item {
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid #34495e;
        border-radius: 8px;
        padding: 15px;
        text-align: left;
        font-family: 'Arial', sans-serif;
      }

      .villager-item-name {
        color: #1a1a1a;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .villager-item-info {
        color: #666;
        font-size: 14px;
        margin-bottom: 5px;
      }

      .building-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 20px;
      }

      .building-button {
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

      .building-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
        transition: left 0.4s ease;
      }

      .building-button:hover::before {
        left: 100%;
      }

      .building-button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
        border-color: #2c3e50;
      }

      .building-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(style);

    this.populateBuildings();
    this.populateTools();
    this.populateVillagers();
    this.setupEventListeners();
  }

  populateBuildings() {
    const list = this.element.querySelector('#buildings-list');
    if (!list) return;
    list.innerHTML = '';

    Object.values(BuildingTypes).forEach(buildingType => {
      const item = document.createElement('div');
      item.className = 'building-item';
      
      // Check if workshop level is unlocked
      const isUnlocked = this.buildingManager.isWorkshopLevelUnlocked(buildingType.id);
      if (!isUnlocked) {
        item.classList.add('disabled');
      }

      const costText = Object.entries(buildingType.cost)
        .map(([resource, amount]) => `${amount} ${resource}`)
        .join(', ');

      item.innerHTML = `
        <div class="building-item-name">${buildingType.name}</div>
        <div class="building-item-description">${buildingType.description}</div>
        <div class="building-item-cost">Cost: ${costText}</div>
        ${!isUnlocked ? '<div class="building-item-status">Locked - Build previous workshop level first</div>' : ''}
      `;

      if (isUnlocked) {
        item.addEventListener('click', () => {
          this.buildingManager.enterPlacementMode(buildingType.id);
          this.hide();
        });
      }

      list.appendChild(item);
    });
  }

  populateTools() {
    const list = this.element.querySelector('#tools-list');
    if (!list) return;
    list.innerHTML = '';

    const blueprintManager = this.craftingSystem.getBlueprintManager();
    const toolBlueprints = blueprintManager.getAllBlueprints().filter(bp => {
      // Filter to only show tools (axe, pickaxe)
      return bp.result.type === 'axe' || bp.result.type === 'pickaxe';
    });

    if (toolBlueprints.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No tools available</div>';
      return;
    }

    toolBlueprints.forEach(blueprint => {
      const item = document.createElement('div');
      item.className = `building-item ${blueprint.unlocked ? '' : 'disabled'}`;

      const requirementsText = Object.entries(blueprint.requirements)
        .map(([resource, amount]) => `${amount} ${resource}`)
        .join(', ');

      const canCraft = blueprint.unlocked && (window.adminMode || blueprint.canCraft(this.player.inventory));

      item.innerHTML = `
        <div class="building-item-name">${blueprint.name} ${blueprint.unlocked ? '' : '(Locked)'}</div>
        <div class="building-item-description">${blueprint.description}</div>
        <div class="building-item-cost">Requires: ${requirementsText}</div>
        <div class="building-item-cost">Result: ${blueprint.result.count}x ${blueprint.result.type}</div>
        ${!blueprint.unlocked ? '<div class="building-item-status">Blueprint locked</div>' : ''}
        ${blueprint.unlocked && !canCraft ? '<div class="building-item-status">Insufficient resources</div>' : ''}
      `;

      if (blueprint.unlocked && canCraft) {
        item.addEventListener('click', () => {
          if (this.craftingSystem.craft(blueprint.id, this.player.inventory)) {
            this.populateTools(); // Refresh
          }
        });
      }

      list.appendChild(item);
    });
  }

  populateVillagers() {
    const list = this.element.querySelector('#villagers-list');
    if (!list) return;
    list.innerHTML = '';

    const villagers = this.villagerManager ? this.villagerManager.getVillagers() : [];
    
    if (villagers.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No villagers available</div>';
      return;
    }

    villagers.forEach((villager, index) => {
      const item = document.createElement('div');
      item.className = 'villager-item';

      const tileX = villager.tileX !== undefined ? villager.tileX : '?';
      const tileZ = villager.tileZ !== undefined ? villager.tileZ : '?';
      const status = villager.isMoving ? 'Moving' : 'Idle';
      const hasProgram = villager.program ? 'Yes' : 'No';

      item.innerHTML = `
        <div class="villager-item-name">Villager ${index + 1}</div>
        <div class="villager-item-info">Position: (${tileX}, ${tileZ})</div>
        <div class="villager-item-info">Status: ${status}</div>
        <div class="villager-item-info">Program: ${hasProgram}</div>
      `;

      list.appendChild(item);
    });
  }

  // Removed canAfford() - buildings are blueprints and don't require resources upfront

  setupEventListeners() {
    // Tab switching
    const tabs = this.element.querySelectorAll('.building-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Close button
    const closeButton = this.element.querySelector('#close-building-menu');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide();
      });
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.element.classList.contains('visible')) {
        this.hide();
      }
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    const tabs = this.element.querySelectorAll('.building-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update tab panels
    const panels = this.element.querySelectorAll('.building-tab-panel');
    panels.forEach(panel => {
      if (panel.id === `${tabName}-tab`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Refresh content when switching tabs
    if (tabName === 'buildings') {
      this.populateBuildings();
    } else if (tabName === 'tools') {
      this.populateTools();
    } else if (tabName === 'villagers') {
      this.populateVillagers();
    }
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.classList.add('visible');
    // Refresh all tabs when showing
    this.populateBuildings();
    this.populateTools();
    this.populateVillagers();
  }

  hide() {
    this.element.classList.remove('visible');
    // Exit placement mode if active
    if (this.buildingManager && this.buildingManager.placementMode) {
      this.buildingManager.exitPlacementMode();
    }
  }

  update() {
    // Refresh all tabs
    this.populateBuildings();
    this.populateTools();
    this.populateVillagers();
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

