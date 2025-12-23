export class BuildingUI {
  constructor(container, building) {
    this.container = container;
    this.building = building;
    this.element = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'building-ui';
    const buildingType = (this.building && this.building.buildingType) ? this.building.buildingType : 'Unknown';
    this.element.innerHTML = `
      <div class="building-info-panel">
        <h3 class="building-info-title">${buildingType}</h3>
        <div id="building-content"></div>
        <button class="close-button" id="close-building-info">Close</button>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #building-ui {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2000;
      }

      .building-info-panel {
        background: rgba(26, 26, 26, 0.95);
        border: 3px solid #6FD6FF;
        border-radius: 12px;
        padding: 20px;
        min-width: 300px;
        max-width: 500px;
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

      #building-content {
        min-height: 100px;
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 15px;
      }

      .storage-inventory {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .storage-item {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background: rgba(111, 214, 255, 0.1);
        border-radius: 4px;
        border-left: 3px solid #6FD6FF;
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

    this.updateContent();
    this.setupEventListeners();
  }

  updateContent() {
    try {
      if (!this.element) return;
      const content = this.element.querySelector('#building-content');
      if (!content) return;
      if (!this.building) return;

      if (this.building.buildingType === 'storage' && this.building.inventory) {
        try {
          const items = this.building.inventory.getAllItems();
          content.innerHTML = `
            <div class="storage-inventory">
              <h4 style="color: #6FD6FF; margin-bottom: 10px;">Storage Contents</h4>
              ${items && items.length === 0 
                ? '<p style="color: #888; text-align: center; padding: 20px;">Storage is empty</p>'
                : (items || []).map(item => `
                    <div class="storage-item">
                      <span style="color: #ffffff; text-transform: capitalize;">${item.type || 'Unknown'}</span>
                      <span style="color: #6FD6FF; font-weight: bold;">x${item.count || 0}</span>
                    </div>
                  `).join('')
              }
            </div>
          `;
        } catch (err) {
          console.error('Error rendering storage inventory:', err);
          content.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Error loading storage contents</p>';
        }
      } else {
        content.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No information available</p>';
      }
    } catch (error) {
      console.error('Error in updateContent:', error);
      if (this.element) {
        const content = this.element.querySelector('#building-content');
        if (content) {
          content.innerHTML = '<p style="color: #ff0000; text-align: center; padding: 20px;">Error loading building information</p>';
        }
      }
    }
  }

  setupEventListeners() {
    const closeButton = this.element.querySelector('#close-building-info');
    closeButton.addEventListener('click', () => {
      this.hide();
    });
  }

  show() {
    if (!this.element.parentNode) {
      this.container.appendChild(this.element);
    }
    this.element.style.display = 'block';
    this.updateContent();
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


