import * as THREE from 'three';

/**
 * Terrain system matching Autonauts' style:
 * - Discrete, blocky tiles (no smooth blending)
 * - Each tile type has distinct visual appearance
 * - Tiles are rendered individually with clear boundaries
 * - Uses instanced geometry for performance
 */
export class Terrain {
  constructor(scene, tileGrid, width, height) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.width = width;
    this.height = height;
    this.tileSize = tileGrid.tileSize;
    
    // Terrain group to hold all tile meshes
    this.terrainGroup = null;
    
    // Instanced meshes for each tile type (for performance)
    this.instancedMeshes = new Map();
    
    // Materials for each biome type (Autonauts colors)
    this.materials = this.createBiomeMaterials();
  }

  /**
   * Create materials for each biome type matching Autonauts' visual style
   */
  createBiomeMaterials() {
    return {
      // Grass - vibrant green, slightly textured
      grass: new THREE.MeshStandardMaterial({
        color: 0x5A9A4A, // Autonauts grass green
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      
      // Soil/Dirt - brown earth tone
      dirt: new THREE.MeshStandardMaterial({
        color: 0x8B6F47, // Autonauts soil brown
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      
      // Sand - beige/yellow beach color
      sand: new THREE.MeshStandardMaterial({
        color: 0xD4C5A9, // Autonauts sand beige
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      
      // Water - blue water color
      water: new THREE.MeshStandardMaterial({
        color: 0x4A7C9E, // Autonauts water blue
        roughness: 0.1,
        metalness: 0.3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      }),
      
      // Tree Soil - darker brown for tree planting areas
      treeSoil: new THREE.MeshStandardMaterial({
        color: 0x6B5A3D, // Darker brown for tree soil
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide
      })
    };
  }

  /**
   * Create the terrain by rendering each tile as a discrete block
   * This matches Autonauts' blocky, tile-based visual style
   */
  create() {
    // Remove existing terrain if it exists
    if (this.terrainGroup) {
      this.scene.remove(this.terrainGroup);
      this.terrainGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Create terrain group
    this.terrainGroup = new THREE.Group();
    this.terrainGroup.name = 'Terrain';
    
    // Create a single plane geometry for tiles (reused for all instances)
    // This geometry will be shared across all instanced meshes
    const tileGeometry = new THREE.PlaneGeometry(this.tileSize, this.tileSize);
    tileGeometry.rotateX(-Math.PI / 2); // Rotate to lie flat
    
    // Group tiles by type for instanced rendering (Autonauts: discrete tiles)
    const tilePositions = {
      grass: [],
      dirt: [],
      sand: [],
      water: [],
      treeSoil: []
    };
    
    // Collect all tile positions by type
    // For large maps, we render all tiles (chunks are generated on-demand by TileGrid)
    for (let tileX = 0; tileX < this.width; tileX++) {
      for (let tileZ = 0; tileZ < this.height; tileZ++) {
        const tile = this.tileGrid.getTile(tileX, tileZ);
        if (!tile) continue; // Skip if tile doesn't exist (shouldn't happen with chunked system)
        
        const worldPos = this.tileGrid.getWorldPosition(tileX, tileZ);
        const tileType = tile.type || 'grass';
        
        // Map tile types to our biome types (Autonauts tile types)
        let biomeType = 'grass';
        if (tileType === 'dirt' || tileType === 'soil') {
          biomeType = 'dirt';
        } else if (tileType === 'sand') {
          biomeType = 'sand';
        } else if (tileType === 'water') {
          biomeType = 'water';
        } else if (tileType === 'treeSoil') {
          biomeType = 'treeSoil';
        } else {
          biomeType = 'grass';
        }
        
        if (tilePositions[biomeType]) {
          tilePositions[biomeType].push({
            x: worldPos.x,
            z: worldPos.z
          });
        }
      }
    }
    
    // Create instanced meshes for each biome type (Autonauts: blocky, distinct tiles)
    for (const [biomeType, positions] of Object.entries(tilePositions)) {
      if (positions.length === 0) continue;
      
      const material = this.materials[biomeType];
      if (!material) continue;
      
      // Use instanced mesh for better performance with many tiles
      // Each tile is a discrete block (Autonauts style)
      const instancedMesh = new THREE.InstancedMesh(
        tileGeometry,
        material,
        positions.length
      );
      
      // Set position for each instance (each tile is a separate block)
      const matrix = new THREE.Matrix4();
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        matrix.makeTranslation(pos.x, 0, pos.z);
        instancedMesh.setMatrixAt(i, matrix);
      }
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.receiveShadow = true;
      instancedMesh.castShadow = false;
      
      this.terrainGroup.add(instancedMesh);
      this.instancedMeshes.set(biomeType, instancedMesh);
    }
    
    // Add terrain group to scene
    this.scene.add(this.terrainGroup);
    
    console.log('Terrain created (Autonauts style):', {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      totalTiles: this.width * this.height,
      instancedMeshes: Array.from(this.instancedMeshes.keys())
    });
  }

  /**
   * Update a specific tile's appearance when its type changes
   * In Autonauts, tiles can change type (e.g., grass to soil when tilled)
   */
  updateTileType(tileX, tileZ, newType) {
    // For now, we'll need to recreate the terrain when tiles change
    // In a more optimized version, we could update individual instances
    // but for simplicity and to match Autonauts' behavior, we recreate
    this.create();
  }

  /**
   * Get the material for a specific biome type
   */
  getMaterial(biomeType) {
    return this.materials[biomeType] || this.materials.grass;
  }

  /**
   * Dispose of terrain resources
   */
  dispose() {
    if (this.terrainGroup) {
      this.scene.remove(this.terrainGroup);
      this.terrainGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.terrainGroup = null;
    }
    
    // Dispose materials
    Object.values(this.materials).forEach(material => {
      material.dispose();
    });
    
    this.instancedMeshes.clear();
  }
}
