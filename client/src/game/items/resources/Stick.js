import * as THREE from 'three';
import { ItemType } from '../ItemType.js';

/**
 * Stick item type (resource)
 */
export class Stick extends ItemType {
  constructor() {
    super('stick', 'Stick');
    this.color = 0xD2B48C; // Light brown/beige
  }

  getHandModel(scale = 1.0) {
    const stickGroup = new THREE.Group();
    
    // Main stick body (cylindrical, low-poly) - 75% bigger
    const stickBodyGeometry = new THREE.CylinderGeometry(0.0875 * scale, 0.0875 * scale, 1.05 * scale, 6);
    const stickMaterial = new THREE.MeshStandardMaterial({ 
      color: this.color,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const stickBody = new THREE.Mesh(stickBodyGeometry, stickMaterial);
    stickBody.rotation.x = Math.PI / 2;
    stickGroup.add(stickBody);
    
    // Small branch
    const branchGeometry = new THREE.CylinderGeometry(0.0525 * scale, 0.0525 * scale, 0.35 * scale, 6);
    const branch = new THREE.Mesh(branchGeometry, stickMaterial);
    branch.rotation.x = Math.PI / 2 + Math.PI / 6;
    branch.position.set(-0.2625 * scale, 0.14 * scale, 0);
    stickGroup.add(branch);
    
    return stickGroup;
  }

  _buildWorldModel() {
    const stickGroup = new THREE.Group();
    
    // Main stick body (cylindrical, low-poly) - 75% bigger
    const mainBodyGeometry = new THREE.CylinderGeometry(0.0875, 0.0875, 1.05, 6);
    const stickMaterial = new THREE.MeshStandardMaterial({ 
      color: this.color,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const mainBody = new THREE.Mesh(mainBodyGeometry, stickMaterial);
    mainBody.rotation.z = Math.PI / 2; // Rotate to be horizontal (lie flat along X axis)
    mainBody.position.y = 0.0875;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    stickGroup.add(mainBody);
    
    // Small branch - 75% bigger
    const branchGeometry = new THREE.CylinderGeometry(0.0525, 0.0525, 0.35, 6);
    const branch = new THREE.Mesh(branchGeometry, stickMaterial);
    branch.rotation.z = Math.PI / 2 + Math.PI / 6; // Horizontal with slight angle
    branch.position.set(-0.2625, 0.14, 0);
    branch.castShadow = true;
    branch.receiveShadow = true;
    stickGroup.add(branch);
    
    stickGroup.castShadow = true;
    stickGroup.receiveShadow = true;
    return stickGroup;
  }

  positionWorldModel(mesh, worldX, worldZ) {
    // Sticks are positioned lower to sit on the ground
    super.positionWorldModel(mesh, worldX, worldZ, ItemType.STICK_WORLD_Y_POSITION);
  }

  getIconModel(scale = 0.5) {
    const stickGroup = new THREE.Group();
    
    // For icons, use a darker brown for better visibility
    const stickMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513, // Darker brown for better visibility
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    // 75% bigger sticks
    const stickBodyGeometry = new THREE.CylinderGeometry(0.0875 * scale, 0.0875 * scale, 1.05 * scale, 6);
    const stickBody = new THREE.Mesh(stickBodyGeometry, stickMaterial);
    stickBody.rotation.z = Math.PI / 2;
    stickGroup.add(stickBody);
    
    const branchGeometry = new THREE.CylinderGeometry(0.0525 * scale, 0.0525 * scale, 0.35 * scale, 6);
    const branch = new THREE.Mesh(branchGeometry, stickMaterial);
    branch.rotation.z = Math.PI / 2 + Math.PI / 6;
    branch.position.set(-0.2625 * scale, 0.14 * scale, 0);
    stickGroup.add(branch);
    
    return stickGroup;
  }
}

