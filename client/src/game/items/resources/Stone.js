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

  getWorldModel() {
    // Override to remove texture from cached models and ensure plain gray color
    const model = super.getWorldModel();
    
    // Remove any texture and ensure material uses plain gray color
    if (typeof window !== 'undefined') {
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          const material = child.material;
          if (material) {
            // Remove texture and use plain gray color
            material.map = null;
            material.color.setHex(0x808080); // Gray
            material.needsUpdate = true;
          }
        }
      });
    }
    
    return model;
  }

  getHandModel(scale = 1.0) {
    // Use the same low-poly rock model but scaled for hand
    const worldModel = this._buildWorldModel();
    worldModel.scale.set(scale, scale, scale);
    return worldModel;
  }

  _buildWorldModel() {
    // Create a flat, low-poly rock that lies on the ground
    // Wider and flatter than the old upright pyramid shape
    const geometry = new THREE.BufferGeometry();
    
    // Define vertices for a flat rock shape
    // Bottom vertices (flat base that sits on ground)
    const bottomRadius = 0.28; // Larger base radius
    const bottomVertices = 8; // More vertices for smoother shape
    const bottomY = 0; // Bottom sits at ground level
    
    // Top vertices (slightly smaller, creating a flatter rock)
    const topRadius = 0.24; // Slightly smaller top
    const topY = 0.12; // Much shorter height (was 0.25-0.28)
    
    // Slight height variation across the top for natural look
    const heightVariation = 0.03;
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Deterministic variation function for irregularity
    const variation = (i, seed = 0) => {
      return Math.sin(i * 2.3 + seed * 1.7) * 0.15 + 1.0;
    };
    
    // Create bottom vertices (flat base)
    const bottomVtxIndices = [];
    for (let i = 0; i < bottomVertices; i++) {
      const angle = (i / bottomVertices) * Math.PI * 2;
      const radius = bottomRadius * variation(i, 0);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      vertices.push(x, bottomY, z);
      bottomVtxIndices.push(vertices.length / 3 - 1);
      // UV coordinates for bottom
      uvs.push((x / bottomRadius + 1) / 2, (z / bottomRadius + 1) / 2);
    }
    
    // Create top vertices (slightly smaller, with height variation)
    const topVtxIndices = [];
    const topRotation = Math.PI / 8; // Slight rotation for natural look
    for (let i = 0; i < bottomVertices; i++) {
      const angle = (i / bottomVertices) * Math.PI * 2 + topRotation;
      const radius = topRadius * variation(i, 1);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Add slight height variation for natural rock surface
      const yVariation = Math.sin(i * 1.5) * heightVariation;
      const y = topY + yVariation;
      vertices.push(x, y, z);
      topVtxIndices.push(vertices.length / 3 - 1);
      // UV coordinates for top
      uvs.push((x / topRadius + 1) / 2, (z / topRadius + 1) / 2);
    }
    
    // Build geometry with flat shading (duplicate vertices per face)
    const flatVertices = [];
    const flatIndices = [];
    const flatUVs = [];
    
    // Helper to add a triangle face
    const addFace = (v1, v2, v3, uv1, uv2, uv3) => {
      const baseIndex = flatVertices.length / 3;
      flatVertices.push(...v1, ...v2, ...v3);
      flatUVs.push(...uv1, ...uv2, ...uv3);
      flatIndices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    };
    
    // Add bottom face (flat base)
    for (let i = 0; i < bottomVertices; i++) {
      const next = (i + 1) % bottomVertices;
      const v1 = [vertices[bottomVtxIndices[i] * 3], vertices[bottomVtxIndices[i] * 3 + 1], vertices[bottomVtxIndices[i] * 3 + 2]];
      const v2 = [vertices[bottomVtxIndices[next] * 3], vertices[bottomVtxIndices[next] * 3 + 1], vertices[bottomVtxIndices[next] * 3 + 2]];
      const v3 = [0, bottomY, 0]; // Center point
      const uv1 = [uvs[bottomVtxIndices[i] * 2], uvs[bottomVtxIndices[i] * 2 + 1]];
      const uv2 = [uvs[bottomVtxIndices[next] * 2], uvs[bottomVtxIndices[next] * 2 + 1]];
      const uv3 = [0.5, 0.5]; // Center UV
      addFace(v1, v2, v3, uv1, uv2, uv3);
    }
    
    // Add side faces (connect bottom to top)
    for (let i = 0; i < bottomVertices; i++) {
      const next = (i + 1) % bottomVertices;
      const bottomCurr = [vertices[bottomVtxIndices[i] * 3], vertices[bottomVtxIndices[i] * 3 + 1], vertices[bottomVtxIndices[i] * 3 + 2]];
      const bottomNext = [vertices[bottomVtxIndices[next] * 3], vertices[bottomVtxIndices[next] * 3 + 1], vertices[bottomVtxIndices[next] * 3 + 2]];
      const topCurr = [vertices[topVtxIndices[i] * 3], vertices[topVtxIndices[i] * 3 + 1], vertices[topVtxIndices[i] * 3 + 2]];
      const topNext = [vertices[topVtxIndices[next] * 3], vertices[topVtxIndices[next] * 3 + 1], vertices[topVtxIndices[next] * 3 + 2]];
      
      const uvBottomCurr = [uvs[bottomVtxIndices[i] * 2], uvs[bottomVtxIndices[i] * 2 + 1]];
      const uvBottomNext = [uvs[bottomVtxIndices[next] * 2], uvs[bottomVtxIndices[next] * 2 + 1]];
      const uvTopCurr = [uvs[topVtxIndices[i] * 2 + bottomVertices * 2], uvs[topVtxIndices[i] * 2 + bottomVertices * 2 + 1]];
      const uvTopNext = [uvs[topVtxIndices[next] * 2 + bottomVertices * 2], uvs[topVtxIndices[next] * 2 + bottomVertices * 2 + 1]];
      
      // Two triangles per side face
      addFace(bottomCurr, topCurr, bottomNext, uvBottomCurr, uvTopCurr, uvBottomNext);
      addFace(bottomNext, topCurr, topNext, uvBottomNext, uvTopCurr, uvTopNext);
    }
    
    // Add top face (slightly irregular surface)
    for (let i = 0; i < bottomVertices; i++) {
      const next = (i + 1) % bottomVertices;
      const topCurr = [vertices[topVtxIndices[i] * 3], vertices[topVtxIndices[i] * 3 + 1], vertices[topVtxIndices[i] * 3 + 2]];
      const topNext = [vertices[topVtxIndices[next] * 3], vertices[topVtxIndices[next] * 3 + 1], vertices[topVtxIndices[next] * 3 + 2]];
      // Use average height for center point
      const centerY = topY;
      const v3 = [0, centerY, 0];
      const uvTopCurr = [uvs[topVtxIndices[i] * 2 + bottomVertices * 2], uvs[topVtxIndices[i] * 2 + bottomVertices * 2 + 1]];
      const uvTopNext = [uvs[topVtxIndices[next] * 2 + bottomVertices * 2], uvs[topVtxIndices[next] * 2 + bottomVertices * 2 + 1]];
      const uv3 = [0.5, 0.5];
      addFace(topCurr, v3, topNext, uvTopCurr, uv3, uvTopNext);
    }
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(flatVertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(flatUVs, 2));
    geometry.setIndex(flatIndices);
    
    // Compute normals for flat shading
    geometry.computeVertexNormals();
    
    // Create material with plain gray color (no texture)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x808080, // Gray
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true // Critical for low-poly faceted look
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  positionWorldModel(mesh, worldX, worldZ) {
    // Stones are positioned at ground level (bottom of model at Y=0)
    // The model's bottom is at Y=0, so we position it slightly above to account for any ground offset
    const stoneHeight = 0.12; // Height of the stone model
    super.positionWorldModel(mesh, worldX, worldZ, stoneHeight / 2);
    
    // Apply random rotation on Y axis (already done by super)
    // Also apply slight random rotation on Z axis for natural placement
    mesh.rotation.z = (Math.random() - 0.5) * 0.3; // Slight tilt
  }
}

