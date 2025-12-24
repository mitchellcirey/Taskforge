import { BuildingTypes } from '../game/BuildingTypes.js';

export class BuildingPlacementUI {
  constructor(container, buildingManager, player) {
    this.container = container;
    this.buildingManager = buildingManager;
    this.player = player;
    this.element = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'building-placement-ui';
    this.element.innerHTML = `
      <div class="building-panel">
        <h3 class="building-title">Buildings</h3>
        <div class="building-list" id="building-list"></div>
        <button class="close-button" id="close-building-ui">Close</button>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #building-placement-ui {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 1000;
      }

      .building-panel {
        background: rgba(26, 26, 26, 0.9);
        border: 2px solid #6FD6FF;
        border-radius: 8px;
        padding: 15px;
        min-width: 250px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }

      .building-title {
        color: #6FD6FF;
        margin: 0 0 15px 0;
        font-size: 20px;
        text-align: center;
        border-bottom: 1px solid #6FD6FF;
        padding-bottom: 8px;
      }

      .building-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .building-item {
        background: rgba(111, 214, 255, 0.1);
        border: 1px solid #6FD6FF;
        border-radius: 6px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .building-item:hover {
        background: rgba(111, 214, 255, 0.2);
        transform: translateX(5px);
      }

      .building-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .building-item-name {
        color: #ffffff;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .building-item-description {
        color: #aaaaaa;
        font-size: 12px;
        margin-bottom: 8px;
      }

      .building-item-cost {
        color: #6FD6FF;
        font-size: 12px;
      }

      .close-button {
        width: 100%;
        margin-top: 15px;
        padding: 10px;
        background: rgba(111, 214, 255, 0.2);
        border: 1px solid #6FD6FF;
        border-radius: 6px;
        color: #6FD6FF;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }

      .close-button:hover {
        background: rgba(111, 214, 255, 0.3);
      }
    `;
    document.head.appendChild(style);

    this.populateBuildings();
    this.setupEventListeners();
  }

  populateBuildings() {
    const list = this.element.querySelector('#building-list');
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
        ${!isUnlocked ? '<div style="color: #ff6b6b; font-size: 11px; margin-top: 5px;">Locked</div>' : ''}
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

  // Removed canAfford() - buildings are blueprints and don't require resources upfront

  setupEventListeners() {
    const closeButton = this.element.querySelector('#close-building-ui');
    closeButton.addEventListener('click', () => {
      this.hide();
    });
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.style.display = 'block';
    this.populateBuildings(); // Refresh unlock status
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  update() {
    this.populateBuildings();
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

