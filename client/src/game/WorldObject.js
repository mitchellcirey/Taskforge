import * as THREE from 'three';

export class WorldObject {
  constructor(scene, tileGrid, tileX, tileZ) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.tileX = tileX;
    this.tileZ = tileZ;
    this.mesh = null;
    this.isInteractable = true;
    this.interactionRange = 3.0; // Scaled for tile size 2.0 (was 1.5 for tile size 1.0)
    
    const tile = this.tileGrid.tiles[tileX]?.[tileZ];
    if (tile) {
      this.worldX = tile.worldX;
      this.worldZ = tile.worldZ;
      tile.occupied = true;
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

  canInteract(playerPosition) {
    if (!this.isInteractable) return false;
    
    const dx = this.worldX - playerPosition.x;
    const dz = this.worldZ - playerPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    return distance <= this.interactionRange;
  }

  interact(player) {
    // Override in subclasses
  }

  remove() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    const tile = this.tileGrid.tiles[this.tileX]?.[this.tileZ];
    if (tile) {
      tile.occupied = false;
    }
  }
}


