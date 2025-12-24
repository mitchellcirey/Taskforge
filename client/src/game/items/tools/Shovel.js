import * as THREE from 'three';
import { ItemType } from '../ItemType.js';

/**
 * Shovel item type (tool)
 */
export class Shovel extends ItemType {
  constructor() {
    super('shovel', 'Shovel');
    this.handleColor = 0xD2B48C; // Warm light brown
    this.headColor = 0x708090; // Slate gray (iron)
  }

  getHandModel(scale = 1.0) {
    const shovelGroup = new THREE.Group();
    
    // Wooden handle
    const handleGeometry = new THREE.BoxGeometry(0.08 * scale, 0.7 * scale, 0.08 * scale);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.35 * scale, 0);
    shovelGroup.add(handle);
    
    // Iron shovel head (blade)
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true
    });
    
    // Shovel blade (flat, curved)
    const bladeGeometry = new THREE.BoxGeometry(0.2 * scale, 0.15 * scale, 0.05 * scale);
    const blade = new THREE.Mesh(bladeGeometry, headMaterial);
    blade.position.set(0, 0.55 * scale, 0);
    blade.rotation.x = Math.PI / 8; // Slight angle
    shovelGroup.add(blade);
    
    // Socket (where handle connects)
    const socketGeometry = new THREE.BoxGeometry(0.1 * scale, 0.12 * scale, 0.1 * scale);
    const socket = new THREE.Mesh(socketGeometry, headMaterial);
    socket.position.set(0, 0.5 * scale, 0);
    shovelGroup.add(socket);
    
    shovelGroup.rotation.x = Math.PI / 4; // Tilt the shovel
    return shovelGroup;
  }

  _buildWorldModel() {
    const shovelGroup = new THREE.Group();
    
    // Wooden handle
    const handleGeometry = new THREE.BoxGeometry(0.08, 0.7, 0.08);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.35, 0);
    handle.castShadow = true;
    handle.receiveShadow = true;
    shovelGroup.add(handle);
    
    // Iron shovel head
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true
    });
    
    // Shovel blade
    const bladeGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.05);
    const blade = new THREE.Mesh(bladeGeometry, headMaterial);
    blade.position.set(0, 0.55, 0);
    blade.rotation.x = Math.PI / 8;
    blade.castShadow = true;
    blade.receiveShadow = true;
    shovelGroup.add(blade);
    
    // Socket
    const socketGeometry = new THREE.BoxGeometry(0.1, 0.12, 0.1);
    const socket = new THREE.Mesh(socketGeometry, headMaterial);
    socket.position.set(0, 0.5, 0);
    socket.castShadow = true;
    socket.receiveShadow = true;
    shovelGroup.add(socket);
    
    shovelGroup.castShadow = true;
    shovelGroup.receiveShadow = true;
    return shovelGroup;
  }

  positionWorldModel(mesh, worldX, worldZ) {
    // Shovels are positioned and tilted
    super.positionWorldModel(mesh, worldX, worldZ, ItemType.DEFAULT_WORLD_Y_POSITION, Math.PI / 4);
  }

  getIconModel(scale = 0.5) {
    const shovelGroup = new THREE.Group();
    
    const handleGeometry = new THREE.BoxGeometry(0.08 * scale, 0.7 * scale, 0.08 * scale);
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: this.handleColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.35 * scale, 0);
    shovelGroup.add(handle);
    
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: this.headColor,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: true
    });
    
    const bladeGeometry = new THREE.BoxGeometry(0.2 * scale, 0.15 * scale, 0.05 * scale);
    const blade = new THREE.Mesh(bladeGeometry, headMaterial);
    blade.position.set(0, 0.55 * scale, 0);
    blade.rotation.x = Math.PI / 8;
    shovelGroup.add(blade);
    
    const socketGeometry = new THREE.BoxGeometry(0.1 * scale, 0.12 * scale, 0.1 * scale);
    const socket = new THREE.Mesh(socketGeometry, headMaterial);
    socket.position.set(0, 0.5 * scale, 0);
    shovelGroup.add(socket);
    
    return shovelGroup;
  }
}

