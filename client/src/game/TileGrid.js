import * as THREE from 'three';

export class TileGrid {
  constructor(scene, width = 100, height = 100) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileSize = 2;
    this.tiles = [];
    this.gridHelper = null;
  }

  create() {
    // Create custom grid that aligns with tile edges
    // Tiles are centered at (x - width/2) * tileSize
    // So tile edges are at (x - width/2) * tileSize ± tileSize/2
    const gridGroup = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0xFFFFFF,
      opacity: 0.5,
      transparent: true
    });
    
    // Calculate grid bounds
    // Grid lines should be drawn at tile boundaries
    // Tile boundaries are at: (x - width/2) * tileSize ± tileSize/2
    const minX = (-this.width / 2) * this.tileSize - this.tileSize / 2;
    const maxX = (this.width / 2) * this.tileSize + this.tileSize / 2;
    const minZ = (-this.height / 2) * this.tileSize - this.tileSize / 2;
    const maxZ = (this.height / 2) * this.tileSize + this.tileSize / 2;
    
    // Draw grid lines at every tile boundary to match the actual tiles
    // Draw vertical lines (along Z axis) - one line per tile column + one for the edge
    for (let x = 0; x <= this.width; x++) {
      const worldX = (x - this.width / 2) * this.tileSize - this.tileSize / 2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldX, 0, minZ),
        new THREE.Vector3(worldX, 0, maxZ)
      ]);
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
    }
    
    // Draw horizontal lines (along X axis) - one line per tile row + one for the edge
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

    // Initialize tile data structure
    // Use a more efficient 2D array structure
    for (let x = 0; x < this.width; x++) {
      this.tiles[x] = [];
      for (let z = 0; z < this.height; z++) {
        this.tiles[x][z] = {
          x: x,
          z: z,
          walkable: true,
          occupied: false,
          worldX: (x - this.width / 2) * this.tileSize,
          worldZ: (z - this.height / 2) * this.tileSize,
          moveCost: 1 // Default move cost
        };
      }
    }
  }

  getTileAtWorldPosition(worldX, worldZ) {
    // Convert world coordinates to grid coordinates
    const gridX = Math.floor(worldX / this.tileSize + this.width / 2);
    const gridZ = Math.floor(worldZ / this.tileSize + this.height / 2);
    
    // Bounds checking
    if (gridX >= 0 && gridX < this.width && gridZ >= 0 && gridZ < this.height) {
      return this.tiles[gridX][gridZ];
    }
    return null;
  }

  getTileAt(worldX, worldZ) {
    // Alias for getTileAtWorldPosition for backward compatibility
    return this.getTileAtWorldPosition(worldX, worldZ);
  }

  getWorldPosition(tileX, tileZ) {
    // Convert grid coordinates to world coordinates
    return {
      x: (tileX - this.width / 2) * this.tileSize,
      z: (tileZ - this.height / 2) * this.tileSize
    };
  }

  isWalkable(tileX, tileZ) {
    // Bounds checking
    if (tileX < 0 || tileX >= this.width || tileZ < 0 || tileZ >= this.height) {
      return false;
    }
    
    const tile = this.tiles[tileX]?.[tileZ];
    return tile ? tile.walkable && !tile.occupied : false;
  }

  getTile(tileX, tileZ) {
    // Get tile by grid coordinates
    if (tileX >= 0 && tileX < this.width && tileZ >= 0 && tileZ < this.height) {
      return this.tiles[tileX][tileZ];
    }
    return null;
  }

  setTileOccupied(tileX, tileZ, occupied) {
    // Set tile occupied state
    const tile = this.getTile(tileX, tileZ);
    if (tile) {
      tile.occupied = occupied;
      return true;
    }
    return false;
  }

  setTileWalkable(tileX, tileZ, walkable) {
    // Set tile walkable state
    const tile = this.getTile(tileX, tileZ);
    if (tile) {
      tile.walkable = walkable;
      return true;
    }
    return false;
  }
}
