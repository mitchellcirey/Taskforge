import * as THREE from 'three';

// Chunk size for chunked grid system
const CHUNK_SIZE = 32;

export class TileGrid {
  constructor(scene, width = 100, height = 100, seed = null) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileSize = 2;
    this.chunks = new Map(); // Map of chunk keys to chunk data
    this.gridHelper = null;
    
    // Seed for deterministic generation (Autonauts style)
    this.seed = seed || Math.floor(Math.random() * 1000000);
    
    // Generate biome patches (Autonauts style - distinct, blocky regions)
    this.biomePatches = this.generateBiomePatches();
    
    // Initialize chunks for the initial grid
    this.initializeChunks();
  }

  /**
   * Generate biome patches matching Autonauts' style:
   * - Random-shaped patches (not circular) with sharp boundaries
   * - Deterministic based on seed
   * - Soil patches randomly scattered (mostly grass)
   * - Only medium and large patches
   */
  generateBiomePatches() {
    const patches = {
      soil: []
    };
    
    // Use seed for deterministic generation
    const rng = this.seededRandom(this.seed);
    
    // Generate soil patches - mostly grass with random dirt patches
    // ~1 patch per 600 tiles for good distribution
    const numSoilPatches = Math.floor((this.width * this.height) / 600);
    for (let i = 0; i < numSoilPatches; i++) {
      // Random position anywhere on map
      const centerX = rng() * this.width;
      const centerZ = rng() * this.height;
      
      // Only medium and large patches (no small patches) - smaller sizes
      const sizeRoll = rng();
      let size;
      if (sizeRoll < 0.5) {
        size = 3 + rng() * 2; // Medium patches (3-5 tiles) - 50%
      } else {
        size = 5 + rng() * 3; // Large patches (5-8 tiles) - 50%
      }
      
      // Store patch with center and size for random shape generation
      patches.soil.push({
        x: centerX,
        z: centerZ,
        size: size, // Approximate size in tiles
        seed: Math.floor(rng() * 1000000) // Unique seed for this patch's shape
      });
    }
    
    return patches;
  }

  /**
   * Seeded random number generator for deterministic terrain
   */
  seededRandom(seed) {
    let value = seed;
    return function() {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  // Convert tile coordinates to chunk coordinates
  getChunkCoords(tileX, tileZ) {
    const chunkX = Math.floor(tileX / CHUNK_SIZE);
    const chunkZ = Math.floor(tileZ / CHUNK_SIZE);
    return { chunkX, chunkZ };
  }

  // Get chunk key for map lookup
  getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
  }

  // Get or create a chunk
  getChunk(chunkX, chunkZ) {
    const key = this.getChunkKey(chunkX, chunkZ);
    if (!this.chunks.has(key)) {
      this.chunks.set(key, this.createChunk(chunkX, chunkZ));
    }
    return this.chunks.get(key);
  }

  // Create a new chunk
  createChunk(chunkX, chunkZ) {
    const tiles = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      tiles[x] = [];
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const tileX = chunkX * CHUNK_SIZE + x;
        const tileZ = chunkZ * CHUNK_SIZE + z;
        tiles[x][z] = this.createTile(tileX, tileZ);
      }
    }
    return tiles;
  }

  // Simple hash function for deterministic random values
  hash(x, y) {
    let hash = x * 374761393 + y * 668265263;
    hash = ((hash << 13) ^ hash) >>> 0;
    hash = hash * 1274126177;
    return (hash % 2147483647) / 2147483647.0;
  }

  // 2D noise function for smooth biome generation
  noise(x, y, scale = 0.1) {
    const x0 = Math.floor(x * scale);
    const y0 = Math.floor(y * scale);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const fx = (x * scale) - x0;
    const fy = (y * scale) - y0;

    const n00 = this.hash(x0, y0);
    const n10 = this.hash(x1, y0);
    const n01 = this.hash(x0, y1);
    const n11 = this.hash(x1, y1);

    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);

    return (1.0 - uy) * ((1.0 - ux) * n00 + ux * n10) + uy * ((1.0 - ux) * n01 + ux * n11);
  }

  /**
   * Create a single tile with Autonauts-style biome assignment
   * Each tile has a discrete type with sharp boundaries (no blending)
   * - Mostly grass
   * - Random-shaped dirt/soil patches (not circular)
   */
  createTile(tileX, tileZ) {
    // Check soil patches (random-shaped dirt patches - Autonauts style)
    let isSoil = false;
    for (const soilPatch of this.biomePatches.soil) {
      // First check: tile must be within reasonable distance of patch center
      // This limits the area but doesn't create circles
      const dx = tileX - soilPatch.x;
      const dz = tileZ - soilPatch.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // Skip if tile is way too far from center (optimization)
      if (distance > soilPatch.size * 2.5) continue;
      
      // Use noise to create random, irregular shapes within the area
      // Multiple noise layers create organic, non-circular blob shapes
      const noise1 = this.noise(
        tileX * 0.25 + soilPatch.seed,
        tileZ * 0.25 + soilPatch.seed,
        0.1
      );
      const noise2 = this.noise(
        tileX * 0.4 + soilPatch.seed * 1.5,
        tileZ * 0.4 + soilPatch.seed * 1.5,
        0.15
      );
      
      // Combine noise with distance factor to create random blob shapes
      // Closer to center = more likely, but noise makes it random
      const normalizedDistance = Math.min(distance / (soilPatch.size * 1.5), 1.0);
      const distanceFactor = 1.0 - normalizedDistance;
      const combinedNoise = (noise1 * 0.6 + noise2 * 0.4);
      
      // Create random shape: combine distance factor with noise
      // Higher threshold ensures only some tiles become dirt (not all)
      const shapeFactor = distanceFactor * 0.4 + combinedNoise * 0.6;
      
      // High threshold ensures mostly grass with scattered dirt patches
      // Medium patches: threshold 0.75, Large patches: threshold 0.7
      const threshold = soilPatch.size < 4 ? 0.75 : 0.7;
      
      if (shapeFactor > threshold && distance < soilPatch.size * 2.0) {
        isSoil = true;
        break;
      }
    }
    
    // Default to grass (most common - Autonauts style)
    const tileType = isSoil ? 'dirt' : 'grass';

    return {
      tileX: tileX,
      tileZ: tileZ,
      type: tileType, // 'grass' or 'dirt' (soil)
      content: null, // Object on tile: 'tree', 'rock', null, etc.
      occupied: false, // Building occupies this tile
      walkable: true, // Can entities walk here
      moveCost: 1, // Default move cost for pathfinding
      worldX: (tileX - this.width / 2) * this.tileSize, // World position (tile center)
      worldZ: (tileZ - this.height / 2) * this.tileSize
    };
  }

  // Initialize chunks for the initial grid
  initializeChunks() {
    const startChunkX = Math.floor(-this.width / 2 / CHUNK_SIZE);
    const endChunkX = Math.floor((this.width / 2) / CHUNK_SIZE);
    const startChunkZ = Math.floor(-this.height / 2 / CHUNK_SIZE);
    const endChunkZ = Math.floor((this.height / 2) / CHUNK_SIZE);

    for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX++) {
      for (let chunkZ = startChunkZ; chunkZ <= endChunkZ; chunkZ++) {
        this.getChunk(chunkX, chunkZ);
      }
    }
  }

  create() {
    // Create custom grid that aligns with tile edges
    const gridGroup = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0xFFFFFF,
      opacity: 0.5,
      transparent: true
    });
    
    // Calculate grid bounds
    const minX = (-this.width / 2) * this.tileSize - this.tileSize / 2;
    const maxX = (this.width / 2) * this.tileSize + this.tileSize / 2;
    const minZ = (-this.height / 2) * this.tileSize - this.tileSize / 2;
    const maxZ = (this.height / 2) * this.tileSize + this.tileSize / 2;
    
    // Draw grid lines at every tile boundary
    for (let x = 0; x <= this.width; x++) {
      const worldX = (x - this.width / 2) * this.tileSize - this.tileSize / 2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldX, 0, minZ),
        new THREE.Vector3(worldX, 0, maxZ)
      ]);
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
    }
    
    for (let z = 0; z <= this.height; z++) {
      const worldZ = (z - this.height / 2) * this.tileSize - this.tileSize / 2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(minX, 0, worldZ),
        new THREE.Vector3(maxX, 0, worldZ)
      ]);
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
    }
    
    gridGroup.position.y = 0.01; // Slightly above ground
    this.scene.add(gridGroup);
    this.gridHelper = gridGroup;
    
    // Load saved grid visibility setting from localStorage
    try {
      const saved = localStorage.getItem('taskforge_gridVisible');
      if (saved !== null) {
        this.gridHelper.visible = saved === 'true';
      } else {
        // Default to visible if no saved setting
        this.gridHelper.visible = true;
      }
    } catch (error) {
      console.warn('Failed to load grid visibility setting:', error);
      // Default to visible on error
      this.gridHelper.visible = true;
    }
  }

  // Get tile by integer tile coordinates
  getTile(tileX, tileZ) {
    const { chunkX, chunkZ } = this.getChunkCoords(tileX, tileZ);
    const chunk = this.getChunk(chunkX, chunkZ);
    
    const localX = ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localZ = ((tileZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    
    return chunk[localX]?.[localZ] || null;
  }

  // Convert world coordinates to tile coordinates (snaps to nearest tile)
  worldToTile(worldX, worldZ) {
    // Convert to tile index space (can be fractional)
    const tileIndexX = worldX / this.tileSize + this.width / 2;
    const tileIndexZ = worldZ / this.tileSize + this.height / 2;
    // Round to nearest integer tile
    const tileX = Math.round(tileIndexX);
    const tileZ = Math.round(tileIndexZ);
    return { tileX, tileZ };
  }

  // Get tile at world position
  getTileAtWorldPosition(worldX, worldZ) {
    const { tileX, tileZ } = this.worldToTile(worldX, worldZ);
    return this.getTile(tileX, tileZ);
  }

  // Legacy alias for backward compatibility
  getTileAt(worldX, worldZ) {
    return this.getTileAtWorldPosition(worldX, worldZ);
  }

  // Convert tile coordinates to world position (always returns tile center)
  getWorldPosition(tileX, tileZ) {
    return {
      x: (tileX - this.width / 2) * this.tileSize,
      z: (tileZ - this.height / 2) * this.tileSize
    };
  }

  // Set tile type (base terrain type)
  setTileType(tileX, tileZ, type) {
    const tile = this.getTile(tileX, tileZ);
    if (tile) {
      tile.type = type;
      // Update walkability based on type
      if (type === 'water') {
        tile.walkable = false;
      } else {
        tile.walkable = true;
      }
      return true;
    }
    return false;
  }

  // Set tile content (object on tile)
  setTileContent(tileX, tileZ, content) {
    const tile = this.getTile(tileX, tileZ);
    if (tile) {
      tile.content = content;
      return true;
    }
    return false;
  }

  // Check if tile is walkable
  isWalkable(tileX, tileZ) {
    const tile = this.getTile(tileX, tileZ);
    if (!tile) return false;
    return tile.walkable && !tile.occupied;
  }

  // Set tile occupied state
  setTileOccupied(tileX, tileZ, occupied) {
    const tile = this.getTile(tileX, tileZ);
    if (tile) {
      tile.occupied = occupied;
      return true;
    }
    return false;
  }

  // Set tile walkable state
  setTileWalkable(tileX, tileZ, walkable) {
    const tile = this.getTile(tileX, tileZ);
    if (tile) {
      tile.walkable = walkable;
      return true;
    }
    return false;
  }

  // Check if N×N area is clear for building placement
  canPlaceBuilding(tileX, tileZ, size) {
    const width = size.width || size;
    const height = size.height || size;
    
    // Check all tiles in the N×N area
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        const checkX = tileX + x;
        const checkZ = tileZ + z;
        const tile = this.getTile(checkX, checkZ);
        
        if (!tile || !tile.walkable || tile.occupied) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Get all tiles in an N×N area
  getTilesInArea(tileX, tileZ, size) {
    const width = size.width || size;
    const height = size.height || size;
    const tiles = [];
    
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        const checkX = tileX + x;
        const checkZ = tileZ + z;
        const tile = this.getTile(checkX, checkZ);
        if (tile) {
          tiles.push(tile);
        }
      }
    }
    
    return tiles;
  }

  // Legacy property access for backward compatibility
  get tiles() {
    // Return a proxy that accesses chunks
    const self = this;
    return new Proxy({}, {
      get(target, prop) {
        if (typeof prop === 'string' && !isNaN(prop)) {
          const x = parseInt(prop);
          // Return a proxy for the row
          return new Proxy({}, {
            get(target, prop) {
              if (typeof prop === 'string' && !isNaN(prop)) {
                const z = parseInt(prop);
                return self.getTile(x, z);
              }
              return undefined;
            }
          });
        }
        return undefined;
      }
    });
  }
}
