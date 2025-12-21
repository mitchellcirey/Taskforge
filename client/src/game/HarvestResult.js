import { ItemType } from './items/ItemType.js';

/**
 * Represents the result of harvesting a resource.
 * Defines what items are dropped and how they should be handled.
 */
export class HarvestResult {
  /**
   * @param {ItemType|string} itemType - The ItemType instance or item type ID string (e.g., 'wood', 'stone')
   * @param {number} count - The quantity of items to drop
   * @param {boolean} dropToWorld - If true, drops to world. If false, goes to inventory.
   */
  constructor(itemType, count, dropToWorld = true) {
    // Extract ID from ItemType instance or use string directly
    if (itemType instanceof ItemType) {
      this.itemType = itemType.getId();
      this.itemTypeInstance = itemType; // Store reference for potential future use
    } else if (typeof itemType === 'string') {
      this.itemType = itemType;
      this.itemTypeInstance = null;
    } else {
      throw new Error('itemType must be an ItemType instance or a string');
    }
    this.count = count;
    this.dropToWorld = dropToWorld;
  }
}

