import * as THREE from 'three';

export class WorldObject {
  constructor(scene, tileGrid, tileX, tileZ) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.tileX = tileX;
    this.tileZ = tileZ;
    this.mesh = null;
    this.isInteractable = true;
    this.interactionRange = 1.5; // Tile-based interaction range (in tiles)
    
    // Get tile and position object at tile center
    const tile = this.tileGrid.getTile(tileX, tileZ);
    if (tile) {
      this.worldX = tile.worldX; // Always use tile center
      this.worldZ = tile.worldZ;
      // Only mark as occupied if this object blocks the tile
      // (Resources don't block, trees do)
      // This will be overridden by subclasses if needed
      tile.occupied = false;
    } else {
      // Fallback: calculate world position
      const worldPos = this.tileGrid.getWorldPosition(tileX, tileZ);
      this.worldX = worldPos.x;
      this.worldZ = worldPos.z;
    }
  }

  create() {
    // Override in subclasses
  }

  getPosition() {
    return {
      x: this.worldX,
      z: this.worldZ
    };
  }

  // Get tile coordinates
  getTilePosition() {
    return {
      tileX: this.tileX,
      tileZ: this.tileZ
    };
  }

  canInteract(playerPosition) {
    if (!this.isInteractable) return false;
    if (!this.tileGrid || !playerPosition) return false;
    
    try {
      // Tile-based distance check
      const playerTile = this.tileGrid.getTileAtWorldPosition(playerPosition.x, playerPosition.z);
      if (!playerTile) return false;
      
      const dx = this.tileX - playerTile.tileX;
      const dz = this.tileZ - playerTile.tileZ;
      const tileDistance = Math.sqrt(dx * dx + dz * dz);
      
      return tileDistance <= this.interactionRange;
    } catch (error) {
      console.error('Error in canInteract:', error);
      return false;
    }
  }

  interact(player) {
    // Override in subclasses
  }

  /**
   * Harvests this resource and returns what should be dropped.
   * Override in subclasses to define harvest behavior.
   * @returns {HarvestResult[]|null} Array of harvest results, or null if not harvestable
   */
  harvest() {
    // Default: not harvestable
    return null;
  }

  remove() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    const tile = this.tileGrid.getTile(this.tileX, this.tileZ);
    if (tile) {
      tile.occupied = false;
      tile.content = null; // Clear tile content
    }
  }
}
