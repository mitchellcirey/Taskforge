import * as THREE from 'three';
import { ItemType } from '../ItemType.js';

/**
 * Hammer item type (tool)
 */
export class Hammer extends ItemType {
  constructor() {
    super('hammer', 'Hammer');
    this.handleColor = 0xD2B48C; // Warm light brown
    this.headColor = 0x708090; // Slate gray (iron)
  }

  getHandModel(scale = 1.0) {
    const hammerGroup = new THREE.Group();
    
    // Wooden handle (shorter than axe/pickaxe)
    const handleGeometry = new THREE.BoxGeometry(0.08 * scale, 0.5 * scale, 0.08 * scale);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.25 * scale, 0);
    hammerGroup.add(handle);
    
    // Iron hammer head
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true
    });
    
    // Hammer head (blocky, rectangular)
    const headGeometry = new THREE.BoxGeometry(0.15 * scale, 0.12 * scale, 0.2 * scale);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.45 * scale, 0);
    hammerGroup.add(head);
    
    // Eye (connection point where handle goes through)
    const eyeGeometry = new THREE.BoxGeometry(0.1 * scale, 0.15 * scale, 0.1 * scale);
    const eye = new THREE.Mesh(eyeGeometry, headMaterial);
    eye.position.set(0, 0.4 * scale, 0);
    hammerGroup.add(eye);
    
    hammerGroup.rotation.x = Math.PI / 6; // Tilt the hammer
    return hammerGroup;
  }

  _buildWorldModel() {
    const hammerGroup = new THREE.Group();
    
    // Wooden handle
    const handleGeometry = new THREE.BoxGeometry(0.08, 0.5, 0.08);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.25, 0);
    handle.castShadow = true;
    handle.receiveShadow = true;
    hammerGroup.add(handle);
    
    // Iron hammer head
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true
    });
    
    // Hammer head
    const headGeometry = new THREE.BoxGeometry(0.15, 0.12, 0.2);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.45, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    hammerGroup.add(head);
    
    // Eye
    const eyeGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.1);
    const eye = new THREE.Mesh(eyeGeometry, headMaterial);
    eye.position.set(0, 0.4, 0);
    eye.castShadow = true;
    eye.receiveShadow = true;
    hammerGroup.add(eye);
    
    hammerGroup.castShadow = true;
    hammerGroup.receiveShadow = true;
    return hammerGroup;
  }

  positionWorldModel(mesh, worldX, worldZ) {
    // Hammers are positioned and tilted
    super.positionWorldModel(mesh, worldX, worldZ, ItemType.DEFAULT_WORLD_Y_POSITION, Math.PI / 6);
  }

  getIconModel(scale = 0.5) {
    const hammerGroup = new THREE.Group();
    
    const handleGeometry = new THREE.BoxGeometry(0.08 * scale, 0.5 * scale, 0.08 * scale);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.25 * scale, 0);
    hammerGroup.add(handle);
    
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true
    });
    
    const headGeometry = new THREE.BoxGeometry(0.15 * scale, 0.12 * scale, 0.2 * scale);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.45 * scale, 0);
    hammerGroup.add(head);
    
    const eyeGeometry = new THREE.BoxGeometry(0.1 * scale, 0.15 * scale, 0.1 * scale);
    const eye = new THREE.Mesh(eyeGeometry, headMaterial);
    eye.position.set(0, 0.4 * scale, 0);
    hammerGroup.add(eye);
    
    return hammerGroup;
  }
}

