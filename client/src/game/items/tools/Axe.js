import * as THREE from 'three';
import { ItemType } from '../ItemType.js';

/**
 * Axe item type (tool)
 */
export class Axe extends ItemType {
  constructor() {
    super('axe', 'Axe');
    this.handleColor = 0xD2B48C; // Warm light brown
    this.headColor = 0x808080; // Medium grey
  }

  getHandModel(scale = 1.0) {
    const axeGroup = new THREE.Group();
    
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
    axeGroup.add(handle);
    
    // Axe head
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.6,
      flatShading: true
    });
    
    // Blade
    const bladeGeometry = new THREE.BoxGeometry(0.25 * scale, 0.15 * scale, 0.08 * scale);
    const blade = new THREE.Mesh(bladeGeometry, headMaterial);
    blade.position.set(0, 0.45 * scale, 0.1 * scale);
    blade.rotation.y = Math.PI / 2; // Rotate 90 degrees so blade edge faces forward
    axeGroup.add(blade);
    
    // Poll (blunt end)
    const pollGeometry = new THREE.BoxGeometry(0.12 * scale, 0.12 * scale, 0.12 * scale);
    const poll = new THREE.Mesh(pollGeometry, headMaterial);
    poll.position.set(-0.05 * scale, 0.45 * scale, 0);
    axeGroup.add(poll);
    
    // Eye (connection point)
    const eyeGeometry = new THREE.BoxGeometry(0.1 * scale, 0.15 * scale, 0.1 * scale);
    const eye = new THREE.Mesh(eyeGeometry, headMaterial);
    eye.position.set(0, 0.45 * scale, 0);
    axeGroup.add(eye);
    
    axeGroup.rotation.x = Math.PI / 6; // Tilt the axe
    return axeGroup;
  }

  _buildWorldModel() {
    const axeGroup = new THREE.Group();
    
    // Wooden handle (warm light brown, elongated and slightly curved)
    const handleGeometry = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
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
      color: this.headColor,
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
    
    axeGroup.castShadow = true;
    axeGroup.receiveShadow = true;
    return axeGroup;
  }

  positionWorldModel(mesh, worldX, worldZ) {
    // Axes are positioned and tilted
    super.positionWorldModel(mesh, worldX, worldZ, ItemType.DEFAULT_WORLD_Y_POSITION, Math.PI / 6);
  }

  getIconModel(scale = 0.5) {
    const axeGroup = new THREE.Group();
    
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
    axeGroup.add(handle);
    
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.6,
      flatShading: true
    });
    
    const bladeGeometry = new THREE.BoxGeometry(0.25 * scale, 0.15 * scale, 0.08 * scale);
    const blade = new THREE.Mesh(bladeGeometry, headMaterial);
    blade.position.set(0.1 * scale, 0.45 * scale, 0);
    axeGroup.add(blade);
    
    const pollGeometry = new THREE.BoxGeometry(0.12 * scale, 0.12 * scale, 0.12 * scale);
    const poll = new THREE.Mesh(pollGeometry, headMaterial);
    poll.position.set(-0.05 * scale, 0.45 * scale, 0);
    axeGroup.add(poll);
    
    const eyeGeometry = new THREE.BoxGeometry(0.1 * scale, 0.15 * scale, 0.1 * scale);
    const eye = new THREE.Mesh(eyeGeometry, headMaterial);
    eye.position.set(0, 0.45 * scale, 0);
    axeGroup.add(eye);
    
    return axeGroup;
  }
}

