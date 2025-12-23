import { ItemType, Wood, Stone, Stick, Axe, Pickaxe } from './items/index.js';

/**
 * Registry for all item types in the game.
 * Provides a centralized way to get item types by their string ID.
 */
export class ItemTypeRegistry {
  constructor() {
    this.itemTypes = new Map();
    this.initializeDefaultTypes();
  }

  /**
   * Initialize default item types
   */
  initializeDefaultTypes() {
    this.register(new Wood());
    this.register(new Stone());
    this.register(new Stick());
    this.register(new Axe());
    this.register(new Pickaxe());
  }

  /**
   * Register an item type
   * @param {ItemType} itemType - The item type to register
   */
  register(itemType) {
    if (!(itemType instanceof ItemType)) {
      throw new Error('Item type must be an instance of ItemType');
    }
    this.itemTypes.set(itemType.getId(), itemType);
  }

  /**
   * Get an item type by its ID
   * @param {string} id - The item type ID
   * @returns {ItemType|null} The item type, or null if not found
   */
  get(id) {
    return this.itemTypes.get(id) || null;
  }

  /**
   * Check if an item type exists
   * @param {string} id - The item type ID
   * @returns {boolean} True if the item type exists
   */
  has(id) {
    return this.itemTypes.has(id);
  }

  /**
   * Get all registered item types
   * @returns {ItemType[]} Array of all item types
   */
  getAll() {
    return Array.from(this.itemTypes.values());
  }
}

// Create a singleton instance
const itemTypeRegistry = new ItemTypeRegistry();

/**
 * Get the global item type registry instance
 * @returns {ItemTypeRegistry} The global registry
 */
export function getItemTypeRegistry() {
  return itemTypeRegistry;
}

/**
 * Convenience function to get an item type by ID
 * @param {string} id - The item type ID
 * @returns {ItemType|null} The item type, or null if not found
 */
export function getItemType(id) {
  return itemTypeRegistry.get(id);
}

