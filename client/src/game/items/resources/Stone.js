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
    // Create a low-poly rock matching the image: triangular/trapezoidal shape
    // Wider at base, tapering to a more pointed top with distinct angular facets
    const geometry = new THREE.BufferGeometry();
    
    // Define vertices for a low-poly rock shape
    // Base vertices (wider, forming a rough pentagon/hexagon)
    const baseRadius = 0.15;
    const baseVertices = 6;
    const baseY = 0;
    
    // Top vertices (narrower, forming a smaller shape)
    const topRadius = 0.08;
    const topY = 0.25;
    
    // Peak point (slightly offset for irregularity)
    const peakY = 0.28;
    const peakOffsetX = 0.02;
    const peakOffsetZ = 0.01;
    
    const vertices = [];
    const indices = [];
    
    // Deterministic variation function
    const variation = (i, seed = 0) => {
      return Math.sin(i * 2.3 + seed * 1.7) * 0.1 + 1.0;
    };
    
    // Create base vertices (wider hexagon)
    const baseVtxIndices = [];
    for (let i = 0; i < baseVertices; i++) {
      const angle = (i / baseVertices) * Math.PI * 2;
      const radius = baseRadius * variation(i, 0); // Deterministic variation
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      vertices.push(x, baseY, z);
      baseVtxIndices.push(vertices.length / 3 - 1);
    }
    
    // Create top vertices (narrower, rotated slightly)
    const topVtxIndices = [];
    const topRotation = Math.PI / 6; // 30 degree rotation
    for (let i = 0; i < baseVertices; i++) {
      const angle = (i / baseVertices) * Math.PI * 2 + topRotation;
      const radius = topRadius * variation(i, 1); // Deterministic variation
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      vertices.push(x, topY, z);
      topVtxIndices.push(vertices.length / 3 - 1);
    }
    
    // Add peak point
    const peakIndex = vertices.length / 3;
    vertices.push(peakOffsetX, peakY, peakOffsetZ);
    
    // Create faces: base sides (connect base vertices)
    for (let i = 0; i < baseVertices; i++) {
      const next = (i + 1) % baseVertices;
      // Base face (bottom)
      indices.push(baseVtxIndices[i], baseVtxIndices[next], baseVtxIndices[0]);
    }
    
    // Create side faces (connect base to top)
    for (let i = 0; i < baseVertices; i++) {
      const next = (i + 1) % baseVertices;
      const baseCurr = baseVtxIndices[i];
      const baseNext = baseVtxIndices[next];
      const topCurr = topVtxIndices[i];
      const topNext = topVtxIndices[next];
      
      // Create two triangles per side face
      indices.push(baseCurr, topCurr, baseNext);
      indices.push(baseNext, topCurr, topNext);
    }
    
    // Create top faces (connect top vertices to peak)
    for (let i = 0; i < baseVertices; i++) {
      const next = (i + 1) % baseVertices;
      indices.push(topVtxIndices[i], peakIndex, topVtxIndices[next]);
    }
    
    // For flat shading with per-face colors, we need to duplicate vertices
    // Build geometry with duplicated vertices per face
    const flatVertices = [];
    const flatIndices = [];
    const flatColors = [];
    
    // Gray shades for different facets
    const grayShades = [
      0x9a9a9a, // Light gray
      0x808080, // Medium gray
      0x6a6a6a, // Dark gray
      0x8a8a8a, // Medium-light gray
      0x707070, // Medium-dark gray
      0x757575, // Another medium gray
    ];
    
    const getGrayColor = (shade) => {
      const r = ((shade >> 16) & 0xff) / 255;
      const g = ((shade >> 8) & 0xff) / 255;
      const b = (shade & 0xff) / 255;
      return [r, g, b];
    };
    
    // Helper to add a triangle face with a specific color
    const addFace = (v1, v2, v3, colorIndex) => {
      const baseIndex = flatVertices.length / 3;
      const color = getGrayColor(grayShades[colorIndex % grayShades.length]);
      
      // Add vertices (duplicated for flat shading)
      flatVertices.push(...v1, ...v2, ...v3);
      flatColors.push(...color, ...color, ...color);
      
      // Add indices
      flatIndices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    };
    
    // Add base faces (bottom - won't be visible but needed for geometry)
    for (let i = 0; i < baseVertices; i++) {
      const next = (i + 1) % baseVertices;
      const v1 = [vertices[baseVtxIndices[i] * 3], vertices[baseVtxIndices[i] * 3 + 1], vertices[baseVtxIndices[i] * 3 + 2]];
      const v2 = [vertices[baseVtxIndices[next] * 3], vertices[baseVtxIndices[next] * 3 + 1], vertices[baseVtxIndices[next] * 3 + 2]];
      const v3 = [vertices[baseVtxIndices[0] * 3], vertices[baseVtxIndices[0] * 3 + 1], vertices[baseVtxIndices[0] * 3 + 2]];
      addFace(v1, v2, v3, 4); // Darker gray for bottom
    }
    
    // Add side faces
    for (let i = 0; i < baseVertices; i++) {
      const next = (i + 1) % baseVertices;
      const baseCurr = [vertices[baseVtxIndices[i] * 3], vertices[baseVtxIndices[i] * 3 + 1], vertices[baseVtxIndices[i] * 3 + 2]];
      const baseNext = [vertices[baseVtxIndices[next] * 3], vertices[baseVtxIndices[next] * 3 + 1], vertices[baseVtxIndices[next] * 3 + 2]];
      const topCurr = [vertices[topVtxIndices[i] * 3], vertices[topVtxIndices[i] * 3 + 1], vertices[topVtxIndices[i] * 3 + 2]];
      const topNext = [vertices[topVtxIndices[next] * 3], vertices[topVtxIndices[next] * 3 + 1], vertices[topVtxIndices[next] * 3 + 2]];
      
      // Two triangles per side face with different shades
      addFace(baseCurr, topCurr, baseNext, i);
      addFace(baseNext, topCurr, topNext, i + 1);
    }
    
    // Add top faces (connecting to peak)
    const peakVtx = [vertices[peakIndex * 3], vertices[peakIndex * 3 + 1], vertices[peakIndex * 3 + 2]];
    for (let i = 0; i < baseVertices; i++) {
      const next = (i + 1) % baseVertices;
      const topCurr = [vertices[topVtxIndices[i] * 3], vertices[topVtxIndices[i] * 3 + 1], vertices[topVtxIndices[i] * 3 + 2]];
      const topNext = [vertices[topVtxIndices[next] * 3], vertices[topVtxIndices[next] * 3 + 1], vertices[topVtxIndices[next] * 3 + 2]];
      addFace(topCurr, peakVtx, topNext, 0); // Lighter gray for top
    }
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(flatVertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(flatColors, 3));
    geometry.setIndex(flatIndices);
    
    // Compute normals for flat shading
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x808080, // Base gray
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true, // Critical for low-poly faceted look
      vertexColors: true // Use vertex colors for variation
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

