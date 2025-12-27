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
    
    // Texture loader and texture references
    this.textureLoader = new THREE.TextureLoader();
    this.grassTexture = null;
    this.grassTexture2 = null;
    this.dirtTexture = null;
    this.dirtTexture2 = null;
    
    // Load textures
    this.loadTextures();
    
    // Materials for each biome type (Autonauts colors)
    this.materials = this.createBiomeMaterials();
    
    // Cliff and water groups
    this.cliffGroup = null;
    this.waterMesh = null;
    
    // Cliff configuration
    this.cliffHeight = 8; // Height of cliff in units
    this.cliffLayers = 6; // Number of horizontal layers for terraced effect
  }

  /**
   * Load terrain textures
   */
  loadTextures() {
    // Load grass texture variant 1
    this.grassTexture = this.textureLoader.load(
      'public/images/textures/grasstexture.png',
      (texture) => {
        // Texture loaded successfully - update material if it exists
        if (this.materials && this.materials.grass) {
          this.materials.grass.map = texture;
          this.materials.grass.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.warn('Failed to load grass texture:', error);
      }
    );
    // Configure texture properties immediately (texture object exists even while loading)
    if (this.grassTexture) {
      this.grassTexture.wrapS = THREE.RepeatWrapping;
      this.grassTexture.wrapT = THREE.RepeatWrapping;
      this.grassTexture.repeat.set(1, 1); // One texture per tile
    }
    
    // Load grass texture variant 2
    this.grassTexture2 = this.textureLoader.load(
      'public/images/textures/grasstexture2.png',
      (texture) => {
        // Texture loaded successfully - update material if it exists
        if (this.materials && this.materials.grass2) {
          this.materials.grass2.map = texture;
          this.materials.grass2.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.warn('Failed to load grass texture 2:', error);
      }
    );
    // Configure texture properties immediately (texture object exists even while loading)
    if (this.grassTexture2) {
      this.grassTexture2.wrapS = THREE.RepeatWrapping;
      this.grassTexture2.wrapT = THREE.RepeatWrapping;
      this.grassTexture2.repeat.set(1, 1); // One texture per tile
    }
    
    // Load dirt texture variant 1
    this.dirtTexture = this.textureLoader.load(
      'public/images/textures/dirttexture.png',
      (texture) => {
        // Texture loaded successfully - update material if it exists
        if (this.materials && this.materials.dirt) {
          this.materials.dirt.map = texture;
          this.materials.dirt.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.warn('Failed to load dirt texture:', error);
      }
    );
    // Configure texture properties immediately (texture object exists even while loading)
    if (this.dirtTexture) {
      this.dirtTexture.wrapS = THREE.RepeatWrapping;
      this.dirtTexture.wrapT = THREE.RepeatWrapping;
      this.dirtTexture.repeat.set(1, 1); // One texture per tile
    }
    
    // Load dirt texture variant 2
    this.dirtTexture2 = this.textureLoader.load(
      'public/images/textures/dirttexture2.png',
      (texture) => {
        // Texture loaded successfully - update material if it exists
        if (this.materials && this.materials.dirt2) {
          this.materials.dirt2.map = texture;
          this.materials.dirt2.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.warn('Failed to load dirt texture 2:', error);
      }
    );
    // Configure texture properties immediately (texture object exists even while loading)
    if (this.dirtTexture2) {
      this.dirtTexture2.wrapS = THREE.RepeatWrapping;
      this.dirtTexture2.wrapT = THREE.RepeatWrapping;
      this.dirtTexture2.repeat.set(1, 1); // One texture per tile
    }
  }

  /**
   * Create materials for each biome type matching Autonauts' visual style
   */
  createBiomeMaterials() {
    return {
      // Grass - vibrant green (Autonauts style) with texture variant 1
      grass: new THREE.MeshStandardMaterial({
        map: this.grassTexture || null,
        color: 0x5A9A4A, // Autonauts grass green (used as tint if texture exists)
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      
      // Grass variant 2
      grass2: new THREE.MeshStandardMaterial({
        map: this.grassTexture2 || null,
        color: 0x5A9A4A, // Autonauts grass green (used as tint if texture exists)
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      
      // Soil/Dirt - brown earth tone with texture variant 1
      dirt: new THREE.MeshStandardMaterial({
        map: this.dirtTexture || null,
        color: 0x8B6F47, // Autonauts soil brown (used as tint if texture exists)
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      
      // Dirt variant 2
      dirt2: new THREE.MeshStandardMaterial({
        map: this.dirtTexture2 || null,
        color: 0x8B6F47, // Autonauts soil brown (used as tint if texture exists)
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
      
      // Cliff materials - layered gradient from brown-orange to light grey/white
      cliffTop: new THREE.MeshStandardMaterial({
        color: 0xD4A574, // Brownish-orange at top
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      cliffMid: new THREE.MeshStandardMaterial({
        color: 0xB89A7A, // Medium brown
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      cliffMidLight: new THREE.MeshStandardMaterial({
        color: 0x9A8A7A, // Light brown-grey
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      cliffBottom: new THREE.MeshStandardMaterial({
        color: 0xD4D4D4, // Light grey/white at bottom
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
      }),
      
      // Water material for the water plane
      waterPlane: new THREE.MeshStandardMaterial({
        color: 0x4A7C9E, // Vibrant blue water
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide
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
    // Separate groups for texture variants to support random texture assignment
    const tilePositions = {
      grass: [],
      grass2: [],
      dirt: [],
      dirt2: [],
      sand: [],
      water: [],
      treeSoil: []
    };
    
    // Simple seeded random function for deterministic texture assignment
    // Uses tile coordinates as seed for consistent results
    const seededRandom = (x, z) => {
      const hash = ((x * 374761393) + (z * 668265263)) % 2147483647;
      return hash / 2147483647.0;
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
        
        // For grass and dirt, randomly assign to variant 1 or 2
        if (biomeType === 'grass') {
          const variant = seededRandom(tileX, tileZ) < 0.5 ? 'grass' : 'grass2';
          tilePositions[variant].push({
            x: worldPos.x,
            z: worldPos.z
          });
        } else if (biomeType === 'dirt') {
          const variant = seededRandom(tileX, tileZ) < 0.5 ? 'dirt' : 'dirt2';
          tilePositions[variant].push({
            x: worldPos.x,
            z: worldPos.z
          });
        } else if (tilePositions[biomeType]) {
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
    
    // Create cliff faces at map edges
    this.createCliffFaces();
    
    // Create water plane below the map
    this.createWaterPlane();
    
    console.log('Terrain created (Autonauts style):', {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      totalTiles: this.width * this.height,
      instancedMeshes: Array.from(this.instancedMeshes.keys())
    });
  }
  
  /**
   * Create 3D layered cliff faces at the edges of the map
   * Matching Autonauts' terraced cliff appearance
   */
  createCliffFaces() {
    // Remove existing cliff if it exists
    if (this.cliffGroup) {
      this.scene.remove(this.cliffGroup);
      this.cliffGroup.traverse((child) => {
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
    
    this.cliffGroup = new THREE.Group();
    this.cliffGroup.name = 'CliffFaces';
    
    const layerHeight = this.cliffHeight / this.cliffLayers;
    const mapWidth = this.width * this.tileSize;
    const mapHeight = this.height * this.tileSize;
    
    // Helper function to get cliff material based on layer (gradient effect)
    const getCliffMaterial = (layerIndex) => {
      const progress = layerIndex / this.cliffLayers; // 0 to 1
      if (progress < 0.25) {
        return this.materials.cliffTop; // Top layers: brownish-orange
      } else if (progress < 0.5) {
        return this.materials.cliffMid; // Mid-top: medium brown
      } else if (progress < 0.75) {
        return this.materials.cliffMidLight; // Mid-bottom: light brown-grey
      } else {
        return this.materials.cliffBottom; // Bottom layers: light grey/white
      }
    };
    
    const halfTile = this.tileSize / 2;
    
    // Create cliff faces for each edge
    // North edge (z = 0, facing north) - negative Z direction
    for (let tileX = 0; tileX < this.width; tileX++) {
      const worldPos = this.tileGrid.getWorldPosition(tileX, 0);
      for (let layer = 0; layer < this.cliffLayers; layer++) {
        const y = -layer * layerHeight - layerHeight / 2;
        const geometry = new THREE.PlaneGeometry(this.tileSize, layerHeight);
        geometry.rotateY(Math.PI); // Face outward (north, negative Z)
        const material = getCliffMaterial(layer);
        const mesh = new THREE.Mesh(geometry, material);
        // Position at the north edge of the tile (offset by half tile in -Z direction)
        mesh.position.set(worldPos.x, y, worldPos.z - halfTile);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        this.cliffGroup.add(mesh);
      }
    }
    
    // South edge (z = height-1, facing south) - positive Z direction
    for (let tileX = 0; tileX < this.width; tileX++) {
      const worldPos = this.tileGrid.getWorldPosition(tileX, this.height - 1);
      for (let layer = 0; layer < this.cliffLayers; layer++) {
        const y = -layer * layerHeight - layerHeight / 2;
        const geometry = new THREE.PlaneGeometry(this.tileSize, layerHeight);
        // Face outward (south, positive Z) - default plane faces +Z
        const material = getCliffMaterial(layer);
        const mesh = new THREE.Mesh(geometry, material);
        // Position at the south edge of the tile (offset by half tile in +Z direction)
        mesh.position.set(worldPos.x, y, worldPos.z + halfTile);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        this.cliffGroup.add(mesh);
      }
    }
    
    // West edge (x = 0, facing west) - negative X direction
    for (let tileZ = 0; tileZ < this.height; tileZ++) {
      const worldPos = this.tileGrid.getWorldPosition(0, tileZ);
      for (let layer = 0; layer < this.cliffLayers; layer++) {
        const y = -layer * layerHeight - layerHeight / 2;
        const geometry = new THREE.PlaneGeometry(this.tileSize, layerHeight);
        geometry.rotateY(Math.PI / 2); // Face outward (west, negative X)
        const material = getCliffMaterial(layer);
        const mesh = new THREE.Mesh(geometry, material);
        // Position at the west edge of the tile (offset by half tile in -X direction)
        mesh.position.set(worldPos.x - halfTile, y, worldPos.z);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        this.cliffGroup.add(mesh);
      }
    }
    
    // East edge (x = width-1, facing east) - positive X direction
    for (let tileZ = 0; tileZ < this.height; tileZ++) {
      const worldPos = this.tileGrid.getWorldPosition(this.width - 1, tileZ);
      for (let layer = 0; layer < this.cliffLayers; layer++) {
        const y = -layer * layerHeight - layerHeight / 2;
        const geometry = new THREE.PlaneGeometry(this.tileSize, layerHeight);
        geometry.rotateY(-Math.PI / 2); // Face outward (east, positive X)
        const material = getCliffMaterial(layer);
        const mesh = new THREE.Mesh(geometry, material);
        // Position at the east edge of the tile (offset by half tile in +X direction)
        mesh.position.set(worldPos.x + halfTile, y, worldPos.z);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        this.cliffGroup.add(mesh);
      }
    }
    
    this.scene.add(this.cliffGroup);
  }
  
  /**
   * Create water plane below the map
   * Matching Autonauts' water appearance
   */
  createWaterPlane() {
    // Remove existing water if it exists
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      if (this.waterMesh.geometry) this.waterMesh.geometry.dispose();
      if (this.waterMesh.material) this.waterMesh.material.dispose();
    }
    
    // Calculate map bounds
    const mapWidth = this.width * this.tileSize;
    const mapHeight = this.height * this.tileSize;
    
    // Make water plane larger than the map to extend beyond edges
    const waterSize = Math.max(mapWidth, mapHeight) * 1.5;
    const waterGeometry = new THREE.PlaneGeometry(waterSize, waterSize);
    waterGeometry.rotateX(-Math.PI / 2); // Rotate to lie flat
    
    // Position water below the cliff
    const waterY = -this.cliffHeight - 0.5; // Slightly below the cliff bottom
    
    // Map center is at (0, 0) in world coordinates (TileGrid centers the map)
    this.waterMesh = new THREE.Mesh(waterGeometry, this.materials.waterPlane);
    this.waterMesh.position.set(0, waterY, 0);
    this.waterMesh.receiveShadow = true;
    this.waterMesh.name = 'WaterPlane';
    
    this.scene.add(this.waterMesh);
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
    
    // Dispose cliff group
    if (this.cliffGroup) {
      this.scene.remove(this.cliffGroup);
      this.cliffGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.cliffGroup = null;
    }
    
    // Dispose water mesh
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      if (this.waterMesh.geometry) this.waterMesh.geometry.dispose();
      if (this.waterMesh.material) this.waterMesh.material.dispose();
      this.waterMesh = null;
    }
    
    // Dispose materials
    Object.values(this.materials).forEach(material => {
      material.dispose();
    });
    
    // Dispose textures
    if (this.grassTexture) {
      this.grassTexture.dispose();
      this.grassTexture = null;
    }
    if (this.grassTexture2) {
      this.grassTexture2.dispose();
      this.grassTexture2 = null;
    }
    if (this.dirtTexture) {
      this.dirtTexture.dispose();
      this.dirtTexture = null;
    }
    if (this.dirtTexture2) {
      this.dirtTexture2.dispose();
      this.dirtTexture2 = null;
    }
    
    this.instancedMeshes.clear();
  }
}
