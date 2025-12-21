import * as THREE from 'three';
import { loadModel } from '../models/ModelLoader.js';

/**
 * Base class for all item types in the game.
 * Each item type (wood, stone, stick, axe, etc.) should extend this class
 * and implement methods for creating different visual representations.
 */
export class ItemType {
  // Positioning constants (in world units, where Y=0 is ground level)
  static DEFAULT_WORLD_Y_POSITION = 0.15; // Default height above ground for most items
  static STICK_WORLD_Y_POSITION = 0.0875;  // Lower height for sticks to sit on ground
  
  // Cache for loaded models (populated after preload)
  static _modelCache = new Map();
  
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  /**
   * Creates a model for when the item is held in the player's hand.
   * @param {number} scale - Scale factor for the model (default: 1.0)
   * @returns {THREE.Object3D} The 3D model for the hand
   */
  getHandModel(scale = 1.0) {
    // Override in subclasses
    throw new Error(`getHandModel() not implemented for ${this.id}`);
  }

  /**
   * Creates a model for when the item is placed in the world.
   * Loads from pre-compiled models for better performance.
   * Subclasses should implement _buildWorldModel() instead of overriding this.
   * @returns {THREE.Object3D} The 3D model for the world
   */
  getWorldModel() {
    // Try to load from compiled model cache first
    const cached = ItemType._modelCache.get(this.id);
    if (cached) {
      // Clone the cached model
      return this._cloneModel(cached);
    }
    
    // Fallback: call subclass build method (for compilation script and development)
    if (this._buildWorldModel && typeof this._buildWorldModel === 'function') {
      return this._buildWorldModel();
    }
    
    // Final fallback: throw error
    throw new Error(`Model not found for ${this.id} and no build method available. Make sure models are compiled or implement _buildWorldModel().`);
  }
  
  /**
   * Builds the world model (override in subclasses).
   * This method is used by the compilation script and as a fallback.
   * @protected
   * @returns {THREE.Object3D} The 3D model for the world
   */
  _buildWorldModel() {
    throw new Error(`_buildWorldModel() not implemented for ${this.id}`);
  }
  
  /**
   * Clone a THREE.js model (deep clone to avoid sharing geometries/materials)
   * @private
   */
  _cloneModel(model) {
    const loader = new THREE.ObjectLoader();
    const json = model.toJSON();
    const cloned = loader.parse(json);
    // Ensure shadow properties are preserved
    cloned.traverse((child) => {
      if (child.isMesh || child.isGroup) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }
  
  /**
   * Preload model for this item type (called at game startup)
   * @param {string} itemId - The item type ID to preload
   * @returns {Promise<void>}
   */
  static async preloadModel(itemId) {
    try {
      const model = await loadModel(itemId);
      ItemType._modelCache.set(itemId, model);
    } catch (error) {
      console.warn(`Failed to preload model for ${itemId}, will use legacy build method:`, error);
    }
  }
  
  /**
   * Preload all models for registered item types
   * @param {string[]} itemIds - Array of item type IDs to preload
   * @returns {Promise<void>}
   */
  static async preloadAllModels(itemIds) {
    const promises = itemIds.map(id => ItemType.preloadModel(id));
    await Promise.all(promises);
    console.log(`Preloaded ${itemIds.length} item models`);
  }

  /**
   * Creates a model for UI icons (e.g., in inventory, building UI).
   * @param {number} scale - Scale factor for the model (default: 0.5)
   * @returns {THREE.Object3D} The 3D model for the icon
   */
  getIconModel(scale = 0.5) {
    // Default to hand model with different scale
    return this.getHandModel(scale);
  }

  /**
   * Gets the display name of the item.
   * @returns {string} The display name
   */
  getDisplayName() {
    return this.name;
  }

  /**
   * Gets the item type ID.
   * @returns {string} The item type ID
   */
  getId() {
    return this.id;
  }

  /**
   * Gets the speed modifier when carrying this item.
   * Returns a multiplier for the base speed (1.0 = no change, 0.5 = 50% speed, etc.)
   * @returns {number} Speed modifier (default: 1.0, no effect)
   */
  getSpeedModifier() {
    return 1.0; // Default: no speed change
  }

  /**
   * Gets the position offset for when this item is held in the player's hand.
   * Returns [x, y, z] offset relative to the player's hand position.
   * @returns {[number, number, number]} Position offset [x, y, z]
   */
  getHandPosition() {
    return [0.4, 0.4, 0.1]; // Default: right hand position
  }

  /**
   * Positions the hand item group when this item is held by the player.
   * @param {THREE.Group} handItemGroup - The hand item group to position
   */
  positionHandItem(handItemGroup) {
    const [x, y, z] = this.getHandPosition();
    handItemGroup.position.set(x, y, z);
  }

  /**
   * Checks if this item can be added to the inventory given the current inventory state.
   * @param {Object} inventoryInfo - Information about the current inventory state
   * @param {Function} inventoryInfo.hasItem - Function to check if inventory has an item: (itemType, count) => boolean
   * @param {Function} inventoryInfo.getFirstItemType - Function to get the first item type in inventory: () => string|null
   * @returns {boolean} True if the item can be added, false otherwise
   */
  canAddToInventory(inventoryInfo) {
    // Default: no restrictions
    return true;
  }

  /**
   * Positions and configures a world model mesh in the scene.
   * @param {THREE.Object3D} mesh - The mesh to position
   * @param {number} worldX - World X coordinate
   * @param {number} worldZ - World Z coordinate
   * @param {number} yPosition - Y position (default: DEFAULT_WORLD_Y_POSITION)
   * @param {number} xRotation - X rotation in radians (default: 0)
   */
  positionWorldModel(mesh, worldX, worldZ, yPosition = ItemType.DEFAULT_WORLD_Y_POSITION, xRotation = 0) {
    mesh.position.set(worldX, yPosition, worldZ);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    if (xRotation !== 0) {
      mesh.rotation.x = xRotation;
    }
  }
}

