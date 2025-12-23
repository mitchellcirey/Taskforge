import { Resource } from '../game/Resource.js';

export class AdminMenu {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.adminMode = false;
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
              <input type="checkbox" id="admin-bypass-toggle" ${this.adminMode ? 'checked' : ''}>
              <span class="checkbox-label">Bypass Build/Craft Requirements</span>
            </label>
          </div>
        </div>
        <div class="admin-buttons">
          <button class="admin-button" id="move-to-nearest-resource-button">Move to Nearest Resource</button>
          <button class="admin-button" id="move-to-nearest-stick-button">Move to Nearest Stick</button>
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
      }

      #admin-menu.visible {
        display: flex;
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
        max-width: 600px;
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

      .admin-title {
        color: #1a1a1a;
        font-size: 42px;
        margin: 0 0 40px 0;
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

      .admin-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #34495e;
      }

      .checkbox-label {
        color: #1a1a1a !important;
        font-family: 'Arial', sans-serif;
        font-weight: 600;
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
      if (e.key === 'Escape' && this.element.classList.contains('visible')) {
        this.hide();
      }
    });
  }

  setupEventListeners() {
    const bypassToggle = this.element.querySelector('#admin-bypass-toggle');
    const closeButton = this.element.querySelector('#close-admin-button');
    const moveToNearestResourceButton = this.element.querySelector('#move-to-nearest-resource-button');
    const moveToNearestStickButton = this.element.querySelector('#move-to-nearest-stick-button');

    bypassToggle.addEventListener('change', (e) => {
      this.adminMode = e.target.checked;
      // Store in window for global access
      window.adminMode = this.adminMode;
    });

    closeButton.addEventListener('click', () => {
      this.hide();
    });

    moveToNearestResourceButton.addEventListener('click', () => {
      this.moveToNearestResource();
    });

    moveToNearestStickButton.addEventListener('click', () => {
      this.moveToNearestStick();
    });
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

  isAdminMode() {
    return this.adminMode;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  // Find nearest resource of any type and move player to it
  moveToNearestResource() {
    const gameInstance = window.gameInstance;
    if (!gameInstance || !gameInstance.sceneManager || !gameInstance.sceneManager.player) {
      console.warn('Game instance or player not available');
      return;
    }

    const sceneManager = gameInstance.sceneManager;
    const player = sceneManager.player;
    const worldObjects = sceneManager.worldObjects;

    // Find all resources
    const resources = worldObjects.filter(obj => obj instanceof Resource);

    if (resources.length === 0) {
      console.log('No resources found in the world');
      return;
    }

    // Get player's current tile position
    const playerTilePos = player.getTilePosition();
    if (!playerTilePos) {
      console.warn('Could not get player tile position');
      return;
    }

    // Find nearest resource
    let nearestResource = null;
    let nearestDistance = Infinity;

    for (const resource of resources) {
      const resourceTilePos = resource.getTilePosition();
      const dx = resourceTilePos.tileX - playerTilePos.tileX;
      const dz = resourceTilePos.tileZ - playerTilePos.tileZ;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestResource = resource;
      }
    }

    if (nearestResource) {
      const targetTilePos = nearestResource.getTilePosition();
      player.moveTo(targetTilePos.tileX, targetTilePos.tileZ);
      this.hide(); // Close admin menu after moving
    }
  }

  // Find nearest stick and move player to it
  moveToNearestStick() {
    const gameInstance = window.gameInstance;
    if (!gameInstance || !gameInstance.sceneManager || !gameInstance.sceneManager.player) {
      console.warn('Game instance or player not available');
      return;
    }

    const sceneManager = gameInstance.sceneManager;
    const player = sceneManager.player;
    const worldObjects = sceneManager.worldObjects;

    // Find all stick resources
    const sticks = worldObjects.filter(obj => 
      obj instanceof Resource && obj.type === 'stick'
    );

    if (sticks.length === 0) {
      console.log('No sticks found in the world');
      return;
    }

    // Get player's current tile position
    const playerTilePos = player.getTilePosition();
    if (!playerTilePos) {
      console.warn('Could not get player tile position');
      return;
    }

    // Find nearest stick
    let nearestStick = null;
    let nearestDistance = Infinity;

    for (const stick of sticks) {
      const stickTilePos = stick.getTilePosition();
      const dx = stickTilePos.tileX - playerTilePos.tileX;
      const dz = stickTilePos.tileZ - playerTilePos.tileZ;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestStick = stick;
      }
    }

    if (nearestStick) {
      const targetTilePos = nearestStick.getTilePosition();
      player.moveTo(targetTilePos.tileX, targetTilePos.tileZ);
      this.hide(); // Close admin menu after moving
    }
  }
}
