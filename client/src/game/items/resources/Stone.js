import * as THREE from 'three';
import { ItemType } from '../ItemType.js';

/**
 * Stone item type (resource)
 */
export class Stone extends ItemType {
  constructor() {
    super('stone', 'Stone');
    this.color = 0x808080; // Gray
  }

  getHandModel(scale = 1.0) {
    const geometry = new THREE.BoxGeometry(0.4 * scale, 0.3 * scale, 0.4 * scale);
    const material = new THREE.MeshStandardMaterial({ 
      color: this.color,
      roughness: 0.7,
      metalness: 0.2
    });
    return new THREE.Mesh(geometry, material);
  }

  _buildWorldModel() {
    const geometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    const material = new THREE.MeshStandardMaterial({ 
      color: this.color,
      roughness: 0.7,
      metalness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

