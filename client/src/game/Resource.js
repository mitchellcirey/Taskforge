import * as THREE from 'three';
import { WorldObject } from './WorldObject.js';
import { getItemType } from './ItemTypeRegistry.js';
import { ItemType } from './items/ItemType.js';

export class Resource extends WorldObject {
  constructor(scene, tileGrid, worldX, worldZ, type = 'wood', count = 1) {
    // Snap to nearest tile
    const { tileX, tileZ } = tileGrid.worldToTile(worldX, worldZ);
    
    super(scene, tileGrid, tileX, tileZ);
    this.type = type;
    // Use centered tile position instead of passed worldX/worldZ
    // this.worldX and this.worldZ are already set by super() from tile.worldX/worldZ
    this.count = count; // Number of items in this resource stack
    this.interactionRange = 1.2; // Larger range for easier pickup (scaled for tile size 2.0)
    
    // Resources don't block tiles - allow player to walk on them
    const tile = this.tileGrid.getTile(this.tileX, this.tileZ);
    if (tile) {
      tile.occupied = false;
      tile.content = type; // Set tile content
    }
    
    this.create();
  }

  create() {
    // Get the item type from the registry
    const itemType = getItemType(this.type);
    
    if (itemType) {
      // Use the item type's getWorldModel method
      this.mesh = itemType.getWorldModel();
      
      // Use the item type's positionWorldModel method to position it
      itemType.positionWorldModel(this.mesh, this.worldX, this.worldZ);
      
      // Ensure shadow properties are set
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      
      this.scene.add(this.mesh);
    } else {
      // Fallback for unknown item types
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        roughness: 0.7,
        metalness: 0.2
      });
      
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(this.worldX, ItemType.DEFAULT_WORLD_Y_POSITION, this.worldZ);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.mesh.rotation.y = Math.random() * Math.PI * 2;
      
      this.scene.add(this.mesh);
    }
  }

  interact(player) {
    // Pick up 1 item from the stack
    if (player && player.inventory) {
      if (player.inventory.addItem(this.type, 1)) {
        this.count -= 1;
        if (this.count <= 0) {
          // Stack is empty, remove the resource
          this.remove();
          return true;
        }
        // Stack still has items, keep the resource
        return true;
      }
    }
    return false;
  }

  shouldRemove() {
    return this.count <= 0; // Only remove when stack is empty
  }
  
  addToStack(amount = 1) {
    this.count += amount;
  }
  
  getCount() {
    return this.count;
  }

  getType() {
    return this.type;
  }
}

