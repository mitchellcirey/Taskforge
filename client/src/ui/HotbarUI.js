export class HotbarUI {
  constructor(container, inventory) {
    this.container = container;
    this.inventory = inventory;
    this.element = null;
    this.slotElements = [];
    this.selectedSlot = inventory ? (inventory.selectedSlot || 1) : 1;
    this.create();
    this.setupKeyboardListeners();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'hotbar-ui';
    this.element.innerHTML = `
      <div class="hotbar-container">
        <div class="hotbar-slot" data-slot="1">
          <div class="slot-indicator"></div>
          <div class="slot-content">
            <div class="slot-label">TOOL</div>
            <div class="slot-item"></div>
          </div>
        </div>
        <div class="hotbar-slot" data-slot="2">
          <div class="slot-indicator"></div>
          <div class="slot-content">
            <div class="slot-label">TOOL</div>
            <div class="slot-item"></div>
          </div>
        </div>
        <div class="hotbar-slot" data-slot="3">
          <div class="slot-indicator"></div>
          <div class="slot-content">
            <div class="slot-item"></div>
            <div class="slot-count"></div>
          </div>
        </div>
        <div class="hotbar-slot" data-slot="4">
          <div class="slot-indicator"></div>
          <div class="slot-content">
            <div class="slot-item"></div>
            <div class="slot-count"></div>
          </div>
        </div>
        <div class="hotbar-slot" data-slot="5">
          <div class="slot-indicator"></div>
          <div class="slot-content">
            <div class="slot-item"></div>
            <div class="slot-count"></div>
          </div>
        </div>
        <div class="hotbar-slot" data-slot="6">
          <div class="slot-indicator"></div>
          <div class="slot-content">
            <div class="slot-item"></div>
            <div class="slot-count"></div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #hotbar-ui {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
      }

      .hotbar-container {
        display: flex;
        gap: 8px;
        align-items: center;
        background: transparent;
      }

      .hotbar-slot {
        position: relative;
        width: 60px;
        height: 60px;
        border: 2px solid rgba(111, 214, 255, 0.6);
        border-radius: 4px;
        background: rgba(26, 26, 26, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .hotbar-slot:hover {
        border-color: rgba(111, 214, 255, 0.9);
        background: rgba(26, 26, 26, 0.5);
      }

      .hotbar-slot[data-slot="1"],
      .hotbar-slot[data-slot="2"] {
        border-color: rgba(255, 165, 0, 0.6);
      }

      .hotbar-slot[data-slot="1"]:hover,
      .hotbar-slot[data-slot="2"]:hover {
        border-color: rgba(255, 165, 0, 0.9);
      }

      .slot-indicator {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: transparent;
        transition: background 0.2s ease;
      }

      .hotbar-slot.selected .slot-indicator {
        background: #9ACD32;
      }

      .slot-content {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .slot-label {
        position: absolute;
        top: 2px;
        left: 2px;
        font-size: 8px;
        color: rgba(255, 165, 0, 0.7);
        font-weight: bold;
        text-transform: uppercase;
      }

      .slot-item {
        font-size: 12px;
        color: #ffffff;
        text-align: center;
        text-transform: capitalize;
        word-break: break-word;
        padding: 2px;
      }

      .slot-count {
        position: absolute;
        bottom: 2px;
        right: 4px;
        font-size: 10px;
        color: #6FD6FF;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);

    if (!this.container.contains(this.element)) {
      this.container.appendChild(this.element);
    }

    // Store references to slot elements
    this.slotElements = Array.from(this.element.querySelectorAll('.hotbar-slot'));
    
    // Add click handlers
    this.slotElements.forEach((slotEl, index) => {
      slotEl.addEventListener('click', () => {
        this.selectSlot(index + 1);
      });
    });

    this.update();
  }

  setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Only handle number keys 1-6
      const key = e.key;
      if (key >= '1' && key <= '6') {
        const slotNumber = parseInt(key);
        this.selectSlot(slotNumber);
        // Prevent default behavior if needed
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }
    });
  }

  selectSlot(slotNumber) {
    if (slotNumber >= 1 && slotNumber <= 6) {
      this.selectedSlot = slotNumber;
      if (this.inventory) {
        this.inventory.setSelectedSlot(slotNumber);
      }
      this.updateSelection();
    }
  }

  updateSelection() {
    this.slotElements.forEach((slotEl, index) => {
      if (index + 1 === this.selectedSlot) {
        slotEl.classList.add('selected');
      } else {
        slotEl.classList.remove('selected');
      }
    });
  }

  update() {
    if (!this.element || !this.inventory) return;

    // Update selected slot
    this.selectedSlot = this.inventory.selectedSlot || 1;
    this.updateSelection();

    // Update slot contents
    for (let i = 1; i <= 6; i++) {
      const slotEl = this.slotElements[i - 1];
      if (!slotEl) continue;

      const slotContent = slotEl.querySelector('.slot-content');
      const slotItem = slotEl.querySelector('.slot-item');
      const slotCount = slotEl.querySelector('.slot-count');
      const slotLabel = slotEl.querySelector('.slot-label');

      let itemData = null;
      if (i >= 1 && i <= 2) {
        // Tool slots
        const toolType = this.inventory.getToolSlot(i);
        if (toolType) {
          itemData = { type: toolType, count: 1, isTool: true };
        }
      } else {
        // Item slots
        itemData = this.inventory.getItemSlot(i);
      }

      if (itemData) {
        slotItem.textContent = itemData.type;
        // No counts displayed - items don't stack (1 per slot)
        if (slotCount) {
          slotCount.style.display = 'none';
        }
        if (slotLabel && i <= 2) {
          slotLabel.style.display = 'block';
        }
      } else {
        slotItem.textContent = '';
        if (slotCount) {
          slotCount.style.display = 'none';
        }
        if (slotLabel && i <= 2) {
          slotLabel.style.display = 'block';
        }
      }
    }
  }

  show() {
    if (this.element) {
      this.element.style.display = 'block';
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

