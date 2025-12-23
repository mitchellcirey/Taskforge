import * as THREE from 'three';
import { ItemType } from '../ItemType.js';

/**
 * Pickaxe item type (tool)
 */
export class Pickaxe extends ItemType {
  constructor() {
    super('pickaxe', 'Pickaxe');
    this.handleColor = 0xD2B48C; // Warm light brown
    this.headColor = 0x808080; // Medium grey
  }

  getHandModel(scale = 1.0) {
    // Similar to axe but with pickaxe head
    const pickaxeGroup = new THREE.Group();
    
    // Wooden handle
    const handleGeometry = new THREE.BoxGeometry(0.08 * scale, 0.6 * scale, 0.08 * scale);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.3 * scale, 0);
    handle.rotation.z = Math.PI / 12;
    pickaxeGroup.add(handle);
    
    // Pickaxe head
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.6,
      flatShading: true
    });
    
    // Pick end (pointed)
    const pickGeometry = new THREE.BoxGeometry(0.15 * scale, 0.2 * scale, 0.08 * scale);
    const pick = new THREE.Mesh(pickGeometry, headMaterial);
    pick.position.set(0.1 * scale, 0.5 * scale, 0);
    pick.rotation.z = Math.PI / 4;
    pickaxeGroup.add(pick);
    
    // Hammer end (blunt)
    const hammerGeometry = new THREE.BoxGeometry(0.12 * scale, 0.12 * scale, 0.12 * scale);
    const hammer = new THREE.Mesh(hammerGeometry, headMaterial);
    hammer.position.set(-0.05 * scale, 0.45 * scale, 0);
    pickaxeGroup.add(hammer);
    
    // Eye (connection point)
    const eyeGeometry = new THREE.BoxGeometry(0.1 * scale, 0.15 * scale, 0.1 * scale);
    const eye = new THREE.Mesh(eyeGeometry, headMaterial);
    eye.position.set(0, 0.45 * scale, 0);
    pickaxeGroup.add(eye);
    
    pickaxeGroup.rotation.x = Math.PI / 6; // Tilt the pickaxe
    return pickaxeGroup;
  }

  _buildWorldModel() {
    const pickaxeGroup = new THREE.Group();
    
    // Wooden handle
    const handleGeometry = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.3, 0);
    handle.rotation.z = Math.PI / 12;
    handle.castShadow = true;
    handle.receiveShadow = true;
    pickaxeGroup.add(handle);
    
    // Pickaxe head
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.6,
      flatShading: true
    });
    
    // Pick end
    const pickGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.08);
    const pick = new THREE.Mesh(pickGeometry, headMaterial);
    pick.position.set(0.1, 0.5, 0);
    pick.rotation.z = Math.PI / 4;
    pick.castShadow = true;
    pick.receiveShadow = true;
    pickaxeGroup.add(pick);
    
    // Hammer end
    const hammerGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const hammer = new THREE.Mesh(hammerGeometry, headMaterial);
    hammer.position.set(-0.05, 0.45, 0);
    hammer.castShadow = true;
    hammer.receiveShadow = true;
    pickaxeGroup.add(hammer);
    
    // Eye
    const eyeGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.1);
    const eye = new THREE.Mesh(eyeGeometry, headMaterial);
    eye.position.set(0, 0.45, 0);
    eye.castShadow = true;
    eye.receiveShadow = true;
    pickaxeGroup.add(eye);
    
    pickaxeGroup.castShadow = true;
    pickaxeGroup.receiveShadow = true;
    return pickaxeGroup;
  }

  positionWorldModel(mesh, worldX, worldZ) {
    // Pickaxes are positioned and tilted similar to axes
    super.positionWorldModel(mesh, worldX, worldZ, ItemType.DEFAULT_WORLD_Y_POSITION, Math.PI / 6);
  }
}

