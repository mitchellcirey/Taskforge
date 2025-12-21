import { getItemType } from './ItemTypeRegistry.js';

// Tool types that can only be placed in tool slots (1-2)
const TOOL_TYPES = ['axe', 'pickaxe'];

export class Inventory {
  constructor(maxSize = 4) {
    // Slot-based inventory system
    this.toolSlots = [null, null]; // Slots 1-2, store tool type strings
    this.itemSlots = [null, null, null, null]; // Slots 3-6, store item type strings (no stacking - 1 per slot)
    this.selectedSlot = 1; // Currently selected slot (1-6)
    this.maxSize = maxSize; // Max items in slots 3-6 (not including tools)
    
    // Legacy support - maintain items Map for backward compatibility
    this.items = new Map();
    this.currentSize = 0;
  }

  isTool(itemType) {
    return TOOL_TYPES.includes(itemType);
  }

  getToolSlot(index) {
    // index is 0-based for array, but 1-based for slot number
    if (index >= 1 && index <= 2) {
      return this.toolSlots[index - 1];
    }
    return null;
  }

  setToolSlot(index, toolType) {
    // index is 1-based (slot 1 or 2)
    if (index >= 1 && index <= 2) {
      if (toolType === null || this.isTool(toolType)) {
        this.toolSlots[index - 1] = toolType;
        this.updateLegacyMap();
        return true;
      }
    }
    return false;
  }

  getItemSlot(index) {
    // index is 1-based (slot 3-6)
    if (index >= 3 && index <= 6) {
      const itemType = this.itemSlots[index - 3];
      return itemType ? { type: itemType, count: 1 } : null;
    }
    return null;
  }

  setItemSlot(index, itemType, count = 1) {
    // index is 1-based (slot 3-6)
    // Note: count is ignored - each slot holds exactly 1 item
    if (index >= 3 && index <= 6) {
      if (itemType === null) {
        this.itemSlots[index - 3] = null;
      } else if (!this.isTool(itemType)) {
        this.itemSlots[index - 3] = itemType; // Store just the type, no count
      } else {
        return false; // Tools cannot go in item slots
      }
      this.updateLegacyMap();
      return true;
    }
    return false;
  }

  addItemToSlot(itemType, count = 1) {
    // Auto-assign to first available slot in slots 3-6
    // Note: count is ignored - each slot holds exactly 1 item (no stacking)
    if (this.isTool(itemType)) {
      return false; // Tools must be manually assigned to tool slots
    }

    // Check item type-specific restrictions
    const itemTypeObj = getItemType(itemType);
    if (itemTypeObj) {
      const inventoryInfo = {
        hasItem: (type, cnt) => this.hasItem(type, cnt),
        getFirstItemType: () => this.getFirstItemType()
      };
      if (!itemTypeObj.canAddToInventory(inventoryInfo)) {
        return false; // Item type has restrictions that prevent adding
      }
    }

    // Check if inventory already has items - if so, only allow same type
    const existingItemType = this.getFirstItemType();
    if (existingItemType !== null && existingItemType !== itemType) {
      return false; // Can only pick up same resource type
    }

    // Find first empty slot (no stacking - each item takes its own slot)
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] === null) {
        this.itemSlots[i] = itemType; // Store just the type
        this.updateLegacyMap();
        return true;
      }
    }

    return false; // All slots full
  }

  getFirstItemType() {
    // Get the first item type in inventory (slots 3-6 only, not tools)
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] !== null) {
        return this.itemSlots[i];
      }
    }
    return null;
  }

  // Legacy methods for backward compatibility
  addItem(itemType, count = 1) {
    if (this.isTool(itemType)) {
      // Try to add tool to first empty tool slot
      for (let i = 0; i < this.toolSlots.length; i++) {
        if (this.toolSlots[i] === null) {
          this.toolSlots[i] = itemType;
          this.updateLegacyMap();
          return true;
        }
      }
      return false; // Tool slots full
    } else {
      return this.addItemToSlot(itemType, count);
    }
  }

  removeItem(itemType, count = 1) {
    // Note: count is ignored - each slot holds exactly 1 item
    // First check tool slots
    for (let i = 0; i < this.toolSlots.length; i++) {
      if (this.toolSlots[i] === itemType) {
        this.toolSlots[i] = null;
        this.updateLegacyMap();
        return true;
      }
    }

    // Check item slots (no stacking - just remove the item)
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] === itemType) {
        this.itemSlots[i] = null;
        this.updateLegacyMap();
        return true;
      }
    }

    return false; // Item not found
  }

  hasItem(itemType, count = 1) {
    // Check tool slots
    for (let i = 0; i < this.toolSlots.length; i++) {
      if (this.toolSlots[i] === itemType) {
        return true; // Tools are single items
      }
    }

    // Check item slots (no stacking - count how many slots have this item)
    let totalCount = 0;
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] === itemType) {
        totalCount += 1; // Each slot holds exactly 1 item
      }
    }

    return totalCount >= count;
  }

  getItemCount(itemType) {
    // Check tool slots
    for (let i = 0; i < this.toolSlots.length; i++) {
      if (this.toolSlots[i] === itemType) {
        return 1; // Tools are single items
      }
    }

    // Check item slots (no stacking - count how many slots have this item)
    let totalCount = 0;
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] === itemType) {
        totalCount += 1; // Each slot holds exactly 1 item
      }
    }

    return totalCount;
  }

  isFull() {
    // Check if all item slots are full
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] === null) {
        return false;
      }
    }
    return true;
  }

  isEmpty() {
    // Check if all slots are empty
    for (let i = 0; i < this.toolSlots.length; i++) {
      if (this.toolSlots[i] !== null) {
        return false;
      }
    }
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] !== null) {
        return false;
      }
    }
    return true;
  }

  getAllItems() {
    // Return all items from both tool and item slots
    const items = [];
    
    // Add tools
    for (let i = 0; i < this.toolSlots.length; i++) {
      if (this.toolSlots[i] !== null) {
        items.push({ type: this.toolSlots[i], count: 1 });
      }
    }

    // Add regular items (each slot holds exactly 1 item)
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] !== null) {
        items.push({ type: this.itemSlots[i], count: 1 });
      }
    }

    return items;
  }

  // Get selected slot content
  getSelectedSlot() {
    if (this.selectedSlot >= 1 && this.selectedSlot <= 2) {
      const tool = this.getToolSlot(this.selectedSlot);
      return tool ? { type: tool, count: 1, isTool: true } : null;
    } else if (this.selectedSlot >= 3 && this.selectedSlot <= 6) {
      return this.getItemSlot(this.selectedSlot);
    }
    return null;
  }

  // Set selected slot
  setSelectedSlot(slotNumber) {
    if (slotNumber >= 1 && slotNumber <= 6) {
      this.selectedSlot = slotNumber;
    }
  }

  // Update legacy items Map for backward compatibility
  updateLegacyMap() {
    this.items.clear();
    this.currentSize = 0;

    // Add tools
    for (let i = 0; i < this.toolSlots.length; i++) {
      if (this.toolSlots[i] !== null) {
        const currentCount = this.items.get(this.toolSlots[i]) || 0;
        this.items.set(this.toolSlots[i], currentCount + 1);
        this.currentSize += 1;
      }
    }

    // Add items (each slot holds exactly 1 item)
    for (let i = 0; i < this.itemSlots.length; i++) {
      if (this.itemSlots[i] !== null) {
        const currentCount = this.items.get(this.itemSlots[i]) || 0;
        this.items.set(this.itemSlots[i], currentCount + 1);
        this.currentSize += 1;
      }
    }
  }

  clear() {
    this.toolSlots = [null, null];
    this.itemSlots = [null, null, null, null];
    this.selectedSlot = 1;
    this.items.clear();
    this.currentSize = 0;
  }
}


