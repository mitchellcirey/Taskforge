import * as THREE from 'three';
import { WorldObject } from './WorldObject.js';

export class Resource extends WorldObject {
  constructor(scene, tileGrid, worldX, worldZ, type = 'wood', count = 1) {
    // Find nearest tile
    const tileX = Math.floor(worldX / tileGrid.tileSize + tileGrid.width / 2);
    const tileZ = Math.floor(worldZ / tileGrid.tileSize + tileGrid.height / 2);
    
    super(scene, tileGrid, tileX, tileZ);
    this.type = type;
    // Use centered tile position instead of passed worldX/worldZ
    // this.worldX and this.worldZ are already set by super() from tile.worldX/worldZ
    this.count = count; // Number of items in this resource stack
    this.interactionRange = 1.2; // Larger range for easier pickup (scaled for tile size 2.0)
    
    // Resources don't block tiles - allow player to walk on them
    const tile = this.tileGrid.tiles[this.tileX]?.[this.tileZ];
    if (tile) {
      tile.occupied = false;
    }
    
    this.create();
  }

  create() {
    let geometry, material, color;

    switch (this.type) {
      case 'wood':
        geometry = new THREE.BoxGeometry(0.3, 0.3, 0.5);
        color = 0x8B4513; // Brown
        break;
      case 'stone':
        geometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
        color = 0x808080; // Gray
        break;
      case 'stick':
        // Create a low-poly stick with a branch
        const stickGroup = new THREE.Group();
        
        // Main stick body (cylindrical, low-poly) - 75% bigger
        const mainBodyGeometry = new THREE.CylinderGeometry(0.0875, 0.0875, 1.05, 6);
        const stickMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD2B48C, // Light brown/beige
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true
        });
        const mainBody = new THREE.Mesh(mainBodyGeometry, stickMaterial);
        mainBody.rotation.z = Math.PI / 2; // Rotate to be horizontal
        mainBody.position.y = 0.0875;
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        stickGroup.add(mainBody);
        
        // Small branch - 75% bigger
        const branchGeometry = new THREE.CylinderGeometry(0.0525, 0.0525, 0.35, 6);
        const branch = new THREE.Mesh(branchGeometry, stickMaterial);
        branch.rotation.z = Math.PI / 4; // Angle the branch
        branch.position.set(-0.2625, 0.14, 0);
        branch.castShadow = true;
        branch.receiveShadow = true;
        stickGroup.add(branch);
        
        this.mesh = stickGroup;
        this.mesh.position.set(this.worldX, 0.0875, this.worldZ);
        this.mesh.rotation.y = Math.random() * Math.PI * 2; // Random rotation
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        return; // Early return since we created the mesh already
      case 'axe':
        // Create a low-poly axe model
        const axeGroup = new THREE.Group();
        
        // Wooden handle (warm light brown, elongated and slightly curved)
        const handleGeometry = new THREE.BoxGeometry(0.08, 0.6, 0.08);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD2B48C, // Warm light brown
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0, 0.3, 0);
        handle.rotation.z = Math.PI / 12; // Slight angle for visual interest
        handle.castShadow = true;
        handle.receiveShadow = true;
        axeGroup.add(handle);
        
        // Axe head (metallic, medium grey)
        const headMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x808080, // Medium grey
          roughness: 0.4,
          metalness: 0.6,
          flatShading: true
        });
        
        // Blade (broad, sharp-looking)
        const bladeGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.08);
        const blade = new THREE.Mesh(bladeGeometry, headMaterial);
        blade.position.set(0.1, 0.45, 0);
        blade.castShadow = true;
        blade.receiveShadow = true;
        axeGroup.add(blade);
        
        // Poll (blunt end opposite the blade, blockier)
        const pollGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const poll = new THREE.Mesh(pollGeometry, headMaterial);
        poll.position.set(-0.05, 0.45, 0);
        poll.castShadow = true;
        poll.receiveShadow = true;
        axeGroup.add(poll);
        
        // Eye (connection point where handle goes through)
        const eyeGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.1);
        const eye = new THREE.Mesh(eyeGeometry, headMaterial);
        eye.position.set(0, 0.45, 0);
        eye.castShadow = true;
        eye.receiveShadow = true;
        axeGroup.add(eye);
        
        this.mesh = axeGroup;
        this.mesh.position.set(this.worldX, 0.15, this.worldZ);
        this.mesh.rotation.y = Math.random() * Math.PI * 2; // Random rotation
        this.mesh.rotation.x = Math.PI / 6; // Tilt the axe slightly
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        return; // Early return since we created the mesh already
      default:
        geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        color = 0xFFFFFF;
    }

    material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.7,
      metalness: 0.2
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.worldX, 0.15, this.worldZ);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Add slight rotation for visual interest
    this.mesh.rotation.y = Math.random() * Math.PI * 2;

    this.scene.add(this.mesh);
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

