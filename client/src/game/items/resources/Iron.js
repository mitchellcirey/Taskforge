import * as THREE from 'three';
import { ItemType } from '../ItemType.js';

/**
 * Iron item type (resource)
 */
export class Iron extends ItemType {
  constructor() {
    super('iron', 'Iron');
    this.color = 0x708090; // Slate gray
  }

  getHandModel(scale = 1.0) {
    const ironGroup = new THREE.Group();
    
    // Iron ore chunk - irregular blocky shape
    const chunkGeometry = new THREE.BoxGeometry(0.15 * scale, 0.15 * scale, 0.15 * scale);
    const ironMaterial = new THREE.MeshStandardMaterial({ 
      color: this.color,
      roughness: 0.6,
      metalness: 0.7,
      flatShading: true
    });
    const mainChunk = new THREE.Mesh(chunkGeometry, ironMaterial);
    ironGroup.add(mainChunk);
    
    // Add smaller chunks for irregularity
    const smallChunk1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * scale, 0.08 * scale, 0.08 * scale),
      ironMaterial
    );
    smallChunk1.position.set(0.1 * scale, 0.05 * scale, 0.05 * scale);
    ironGroup.add(smallChunk1);
    
    const smallChunk2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 * scale, 0.06 * scale, 0.06 * scale),
      ironMaterial
    );
    smallChunk2.position.set(-0.08 * scale, -0.05 * scale, 0.08 * scale);
    ironGroup.add(smallChunk2);
    
    return ironGroup;
  }

  _buildWorldModel() {
    const ironGroup = new THREE.Group();
    
    // Main iron ore chunk
    const chunkGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const ironMaterial = new THREE.MeshStandardMaterial({ 
      color: this.color,
      roughness: 0.6,
      metalness: 0.7,
      flatShading: true
    });
    const mainChunk = new THREE.Mesh(chunkGeometry, ironMaterial);
    mainChunk.position.y = 0.075;
    mainChunk.castShadow = true;
    mainChunk.receiveShadow = true;
    ironGroup.add(mainChunk);
    
    // Add smaller chunks for irregularity
    const smallChunk1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.08),
      ironMaterial
    );
    smallChunk1.position.set(0.1, 0.04, 0.05);
    smallChunk1.castShadow = true;
    smallChunk1.receiveShadow = true;
    ironGroup.add(smallChunk1);
    
    const smallChunk2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.06),
      ironMaterial
    );
    smallChunk2.position.set(-0.08, 0.03, 0.08);
    smallChunk2.castShadow = true;
    smallChunk2.receiveShadow = true;
    ironGroup.add(smallChunk2);
    
    ironGroup.castShadow = true;
    ironGroup.receiveShadow = true;
    return ironGroup;
  }

  positionWorldModel(mesh, worldX, worldZ) {
    super.positionWorldModel(mesh, worldX, worldZ, ItemType.DEFAULT_WORLD_Y_POSITION);
  }

  getIconModel(scale = 0.5) {
    const ironGroup = new THREE.Group();
    
    const chunkGeometry = new THREE.BoxGeometry(0.15 * scale, 0.15 * scale, 0.15 * scale);
    const ironMaterial = new THREE.MeshStandardMaterial({ 
      color: this.color,
      roughness: 0.6,
      metalness: 0.7,
      flatShading: true
    });
    const mainChunk = new THREE.Mesh(chunkGeometry, ironMaterial);
    ironGroup.add(mainChunk);
    
    const smallChunk1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * scale, 0.08 * scale, 0.08 * scale),
      ironMaterial
    );
    smallChunk1.position.set(0.1 * scale, 0.05 * scale, 0.05 * scale);
    ironGroup.add(smallChunk1);
    
    const smallChunk2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 * scale, 0.06 * scale, 0.06 * scale),
      ironMaterial
    );
    smallChunk2.position.set(-0.08 * scale, -0.05 * scale, 0.08 * scale);
    ironGroup.add(smallChunk2);
    
    return ironGroup;
  }
}

