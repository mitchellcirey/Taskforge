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
    // Use the same low-poly rock model but scaled for hand
    const worldModel = this._buildWorldModel();
    worldModel.scale.set(scale, scale, scale);
    return worldModel;
  }

  _buildWorldModel() {
    // Create a low-poly rock with irregular polygonal shape
    // Based on the image: irregular, chunky rock with flat facets
    // Start with DodecahedronGeometry and convert to BufferGeometry with modified vertices
    const baseGeometry = new THREE.DodecahedronGeometry(0.2, 0);
    
    // Get original positions
    const originalPositions = baseGeometry.attributes.position;
    const vertexCount = originalPositions.count;
    
    // Simple hash function for deterministic "randomness"
    const hash = (x, y, z) => {
      return Math.sin(x * 12.9898 + y * 78.233 + z * 43.1234) * 43758.5453;
    };
    
    // Create new BufferGeometry with modified vertices
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(vertexCount * 3);
    
    // Modify vertices to make it more irregular
    for (let i = 0; i < vertexCount; i++) {
      const x = originalPositions.getX(i);
      const y = originalPositions.getY(i);
      const z = originalPositions.getZ(i);
      
      // Make it slightly irregular - more variation on top, less on bottom
      const irregularity = y > 0 ? 0.15 : 0.08; // More irregular on top
      const hashVal = hash(x, y, z);
      const offsetX = ((hashVal % 100) / 100 - 0.5) * irregularity;
      const offsetY = y > 0 ? ((hashVal % 73) / 73 - 0.3) * irregularity * 0.5 : ((hashVal % 47) / 47 - 0.5) * irregularity * 0.3;
      const offsetZ = ((hashVal % 89) / 89 - 0.5) * irregularity;
      
      // Apply scale (flatten vertically) and offsets
      positions[i * 3] = (x + offsetX) * 1.0;
      positions[i * 3 + 1] = (y + offsetY) * 0.75; // Flatten vertically
      positions[i * 3 + 2] = (z + offsetZ) * 1.0;
    }
    
    // Copy indices from base geometry
    const indices = baseGeometry.index ? baseGeometry.index.array : null;
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (indices) {
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }
    
    // Compute normals and bounding volumes
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    // Create material with gray colors - lighter on top, darker on sides
    // Using flat shading to emphasize the polygonal look
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x808080, // Base gray
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true // Important for low-poly look
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

