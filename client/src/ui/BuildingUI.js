// Static flag to ensure styles are only added once
let stylesAdded = false;

export class BuildingUI {
  constructor(container, building, buildingManager) {
    this.container = container;
    this.building = building;
    this.buildingManager = buildingManager;
    this.element = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'building-ui';
    const buildingType = (this.building && this.building.buildingType) ? this.building.buildingType : 'Unknown';
    const buildingName = buildingType.charAt(0).toUpperCase() + buildingType.slice(1).replace(/-/g, ' ');
    
    // Check if building can be destroyed/moved
    const canDestroy = this.building ? this.building.canDestroy() : true;
    const canMove = this.building ? this.building.canMove() : true;
    const isEmpty = this.building && this.building.buildingType === 'storage' && this.building.inventory 
      ? this.building.inventory.isEmpty() 
      : true;
    
    this.element.innerHTML = `
      <div class="building-info-panel">
        <h3 class="building-info-title">${buildingName}</h3>
        ${!isEmpty ? '<p class="storage-warning">Storage must be empty to destroy or move</p>' : ''}
        <div class="building-actions">
          <button class="action-button destroy-button" ${!canDestroy ? 'disabled' : ''} id="destroy-building">
            Destroy
          </button>
          <button class="action-button move-button" ${!canMove ? 'disabled' : ''} id="move-building">
            Move
          </button>
        </div>
        <button class="close-button" id="close-building-info">Close</button>
      </div>
    `;

    // Add styles only once
    if (!stylesAdded) {
      const style = document.createElement('style');
      style.id = 'building-ui-styles';
      style.textContent = `
      #building-ui {
        position: fixed;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 2000;
      }

      .building-info-panel {
        background: rgba(26, 26, 26, 0.95);
        border: 3px solid #6FD6FF;
        border-radius: 12px;
        padding: 20px;
        min-width: 250px;
        max-width: 350px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }

      .building-info-title {
        color: #6FD6FF;
        margin: 0 0 15px 0;
        font-size: 24px;
        text-align: center;
        border-bottom: 2px solid #6FD6FF;
        padding-bottom: 10px;
        text-transform: capitalize;
      }

      .storage-warning {
        color: #FF6B6B;
        text-align: center;
        font-size: 14px;
        margin: 10px 0;
        padding: 8px;
        background: rgba(255, 107, 107, 0.1);
        border-radius: 4px;
        border-left: 3px solid #FF6B6B;
      }

      .building-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 15px;
      }

      .action-button {
        width: 100%;
        padding: 12px;
        border: 2px solid;
        border-radius: 6px;
        color: #FFFFFF;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.2s ease;
        text-transform: uppercase;
      }

      .destroy-button {
        background: rgba(255, 107, 107, 0.2);
        border-color: #FF6B6B;
        color: #FF6B6B;
      }

      .destroy-button:hover:not(:disabled) {
        background: rgba(255, 107, 107, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
      }

      .move-button {
        background: rgba(111, 214, 255, 0.2);
        border-color: #6FD6FF;
        color: #6FD6FF;
      }

      .move-button:hover:not(:disabled) {
        background: rgba(111, 214, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(111, 214, 255, 0.3);
      }

      .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: rgba(128, 128, 128, 0.2);
        border-color: #666;
        color: #999;
      }

      .close-button {
        width: 100%;
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
      stylesAdded = true;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeButton = this.element.querySelector('#close-building-info');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide();
      });
    }

    const destroyButton = this.element.querySelector('#destroy-building');
    if (destroyButton) {
      destroyButton.addEventListener('click', () => {
        if (this.building && this.buildingManager) {
          if (this.building.canDestroy()) {
            this.buildingManager.destroyBuilding(this.building);
            this.hide();
          }
        }
      });
    }

    const moveButton = this.element.querySelector('#move-building');
    if (moveButton) {
      moveButton.addEventListener('click', () => {
        if (this.building && this.buildingManager) {
          if (this.building.canMove()) {
            // Enter move mode - this will be handled by BuildingManager
            this.buildingManager.startMoveMode(this.building);
            this.hide();
          }
        }
      });
    }
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.style.display = 'block';
    // Update button states in case storage status changed
    this.updateButtonStates();
  }

  updateButtonStates() {
    if (!this.building) return;
    
    const canDestroy = this.building.canDestroy();
    const canMove = this.building.canMove();
    const isEmpty = this.building.buildingType === 'storage' && this.building.inventory 
      ? this.building.inventory.isEmpty() 
      : true;

    const destroyButton = this.element.querySelector('#destroy-building');
    const moveButton = this.element.querySelector('#move-building');
    const warningElement = this.element.querySelector('.storage-warning');

    if (destroyButton) {
      destroyButton.disabled = !canDestroy;
    }
    if (moveButton) {
      moveButton.disabled = !canMove;
    }
    if (warningElement) {
      warningElement.style.display = !isEmpty ? 'block' : 'none';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
