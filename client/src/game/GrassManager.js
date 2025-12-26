import * as THREE from 'three';

/**
 * GrassManager - Creates and manages low-poly 3D grass patches with wind animation
 * Similar to Autonauts' grass style: dense patches of grass blades that sway in the wind
 * Each patch is roughly 10x15 tiles, with 16 blades per tile
 */
export class GrassManager {
  constructor(scene, tileGrid) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.grassGroup = null;
    this.grassPatches = []; // Array of grass patch data (all blades in each patch)
    this.allBlades = []; // Flat array of all blades for efficient animation
    this.time = 0; // Accumulated time for wind animation
    
    // Wind animation parameters
    this.windSpeed = 0.8; // Speed of wind animation
    this.windStrength = 0.2; // Maximum rotation angle in radians
    
    // Grass material (vibrant green matching Autonauts style)
    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x5A9A4A, // Autonauts grass green
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    
    // Create grass group
    this.grassGroup = new THREE.Group();
    this.grassGroup.name = 'Grass';
    this.scene.add(this.grassGroup);
  }

  /**
   * Create a single low-poly 3D grass blade (tapered: thick at base, thin at top)
   * Single shape that tapers from base to top
   * Returns a mesh with a pivot group for wind animation (only top portion bends)
   */
  createGrassBlade() {
    const totalHeight = 0.4 + Math.random() * 0.3; // Vary height between 0.4 and 0.7
    
    // Create a tapered blade - wider at bottom, narrower at top
    const baseWidth = 0.15; // Thick at base
    const baseDepth = 0.12;
    const topWidth = 0.08; // Thin at top
    const topDepth = 0.06;
    
    // Create a box geometry with height segments for smooth taper
    const geometry = new THREE.BoxGeometry(
      baseWidth, // width at base
      totalHeight, // height
      baseDepth, // depth at base
      1, // width segments
      4, // height segments (for smooth taper)
      1  // depth segments
    );
    
    // Modify vertices to create taper (wider at bottom, narrower at top)
    const positions = geometry.attributes.position;
    const vertexCount = positions.count;
    
    for (let i = 0; i < vertexCount; i++) {
      const y = positions.getY(i);
      // Normalize y from -height/2 to height/2 to 0 to 1
      const normalizedY = (y + totalHeight / 2) / totalHeight;
      
      // Interpolate width and depth based on height
      const currentWidth = baseWidth + (topWidth - baseWidth) * normalizedY;
      const currentDepth = baseDepth + (topDepth - baseDepth) * normalizedY;
      
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Scale x and z based on height to create taper
      positions.setX(i, x * (currentWidth / baseWidth));
      positions.setZ(i, z * (currentDepth / baseDepth));
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Create a single tapered blade as one continuous shape
    // But split into base (doesn't bend) and top (bends) for animation
    const baseHeight = totalHeight * 0.4; // Bottom 40% doesn't bend
    const topHeight = totalHeight * 0.6; // Top 60% bends
    
    // Base section - bottom portion (thicker, doesn't bend)
    const baseGeometry = new THREE.BoxGeometry(
      baseWidth, baseHeight, baseDepth,
      1, 1, 1
    );
    const baseMesh = new THREE.Mesh(baseGeometry, this.grassMaterial);
    baseMesh.position.y = baseHeight / 2; // Position at bottom
    baseMesh.castShadow = false;
    baseMesh.receiveShadow = false;
    
    // Top section - upper portion (tapers, bends with wind)
    // Create tapered top portion
    const midWidth = baseWidth + (topWidth - baseWidth) * 0.3; // Width at connection point
    const midDepth = baseDepth + (topDepth - baseDepth) * 0.3; // Depth at connection point
    
    const topGeometry = new THREE.BoxGeometry(
      midWidth, // width at connection (slightly tapered from base)
      topHeight, // height of top section
      midDepth, // depth at connection
      1, 2, 1 // segments for smooth taper
    );
    
    // Taper the top geometry vertices
    const topPositions = topGeometry.attributes.position;
    for (let i = 0; i < topPositions.count; i++) {
      const y = topPositions.getY(i);
      const normalizedY = (y + topHeight / 2) / topHeight; // 0 to 1
      
      const currentWidth = midWidth + (topWidth - midWidth) * normalizedY;
      const currentDepth = midDepth + (topDepth - midDepth) * normalizedY;
      
      const x = topPositions.getX(i);
      const z = topPositions.getZ(i);
      
      topPositions.setX(i, x * (currentWidth / midWidth));
      topPositions.setZ(i, z * (currentDepth / midDepth));
    }
    topPositions.needsUpdate = true;
    topGeometry.computeVertexNormals();
    
    const topMesh = new THREE.Mesh(topGeometry, this.grassMaterial);
    topMesh.castShadow = false;
    topMesh.receiveShadow = false;
    
    // Create pivot group for top section (bends from connection point)
    const topPivotGroup = new THREE.Group();
    topPivotGroup.position.y = baseHeight; // Pivot at connection point
    topMesh.position.y = topHeight / 2; // Center of top section
    topPivotGroup.add(topMesh);
    
    // Create group to hold both parts (visually one continuous tapered blade)
    const bladeGroup = new THREE.Group();
    bladeGroup.add(baseMesh);
    bladeGroup.add(topPivotGroup);
    
    // Store animation properties
    bladeGroup.userData.height = totalHeight;
    bladeGroup.userData.baseRotation = (Math.random() - 0.5) * 0.1;
    bladeGroup.userData.phaseOffset = Math.random() * Math.PI * 2;
    bladeGroup.userData.windStrength = 0.15 + Math.random() * 0.1;
    bladeGroup.userData.topPivotGroup = topPivotGroup; // Reference for wind animation
    
    return bladeGroup;
  }

  /**
   * Create grass for a single tile (16 blades per tile)
   * Each tile is divided into a 4x4 grid (16 sub-tiles), with one blade at the center of each sub-tile
   */
  createTileGrass(worldX, worldZ) {
    const tileGroup = new THREE.Group();
    const tileSize = this.tileGrid.tileSize;
    const halfTile = tileSize / 2;
    const gridSize = 4; // 4x4 grid = 16 sub-tiles
    const subTileSize = tileSize / gridSize; // Size of each sub-tile
    
    // Create 16 blades, one at the center of each sub-tile in a 4x4 grid
    for (let gridZ = 0; gridZ < gridSize; gridZ++) {
      for (let gridX = 0; gridX < gridSize; gridX++) {
        const blade = this.createGrassBlade();
        const bladeHeight = blade.userData.height;
        
        // Calculate position: center of each sub-tile
        // Sub-tile center = worldX/Z + (gridX/Z * subTileSize) - halfTile + (subTileSize / 2)
        const subTileCenterX = worldX - halfTile + (gridX * subTileSize) + (subTileSize / 2);
        const subTileCenterZ = worldZ - halfTile + (gridZ * subTileSize) + (subTileSize / 2);
        
        blade.position.set(
          subTileCenterX,
          bladeHeight / 2, // Position so bottom is at ground (y=0)
          subTileCenterZ
        );
        
        // Random rotation around Y axis for natural look
        blade.rotation.y = Math.random() * Math.PI * 2;
        
        tileGroup.add(blade);
        this.allBlades.push(blade);
      }
    }
    
    return tileGroup;
  }

  /**
   * Generate random grass patches across the map
   * Each patch is roughly 10x15 tiles, with 16 blades per tile
   */
  spawnGrassPatches() {
    const mapWidth = this.tileGrid.width;
    const mapHeight = this.tileGrid.height;
    
    // Number of patches to generate (adjust based on map size)
    // For a 200x200 map, generate roughly 15-25 patches
    const numPatches = 15 + Math.floor(Math.random() * 11);
    
    // Base patch size (roughly 10x15 tiles)
    const basePatchWidth = 10;
    const basePatchHeight = 15;
    
    // Track which tiles already have grass to avoid overlaps
    const grassTiles = new Set();
    
    for (let patchIndex = 0; patchIndex < numPatches; patchIndex++) {
      // Random patch center
      const centerX = Math.floor(Math.random() * mapWidth);
      const centerZ = Math.floor(Math.random() * mapHeight);
      
      // Random patch size (vary around 10x15)
      const patchWidth = basePatchWidth + Math.floor((Math.random() - 0.5) * 6); // 7-13
      const patchHeight = basePatchHeight + Math.floor((Math.random() - 0.5) * 8); // 11-19
      
      // Calculate patch bounds
      const startX = Math.max(0, centerX - Math.floor(patchWidth / 2));
      const endX = Math.min(mapWidth - 1, centerX + Math.floor(patchWidth / 2));
      const startZ = Math.max(0, centerZ - Math.floor(patchHeight / 2));
      const endZ = Math.min(mapHeight - 1, centerZ + Math.floor(patchHeight / 2));
      
      // Create patch group for this grass patch
      const patchGroup = new THREE.Group();
      patchGroup.name = `GrassPatch_${patchIndex}`;
      
      let tilesInPatch = 0;
      
      // Fill the patch with grass
      for (let tileX = startX; tileX <= endX; tileX++) {
        for (let tileZ = startZ; tileZ <= endZ; tileZ++) {
          // Skip if this tile already has grass
          const tileKey = `${tileX},${tileZ}`;
          if (grassTiles.has(tileKey)) continue;
          
          const tile = this.tileGrid.getTile(tileX, tileZ);
          
          // Check if tile qualifies for grass:
          // - Must be walkable
          // - Must be dirt type
          // - Must not be occupied (no buildings or trees)
          // - Must have no content (no trees, sticks, stones, or other resources)
          // This ensures grass patches don't spawn where trees, sticks, or stones are
          if (tile && 
              tile.walkable && 
              tile.type === 'dirt' && 
              !tile.occupied && 
              !tile.content) {
            
            // Create 16 blades for this tile
            const tileGrass = this.createTileGrass(tile.worldX, tile.worldZ);
            patchGroup.add(tileGrass);
            grassTiles.add(tileKey);
            
            // Mark tile as having grass so trees/sticks/stones don't spawn here
            tile.content = 'grass';
            
            tilesInPatch++;
          }
        }
      }
      
      // Only add patch if it has at least some grass
      if (tilesInPatch > 0) {
        this.grassGroup.add(patchGroup);
        this.grassPatches.push({
          group: patchGroup,
          tiles: tilesInPatch
        });
      }
    }
    
    console.log(`Spawned ${this.grassPatches.length} grass patches with ${this.allBlades.length} total blades`);
  }

  /**
   * Update wind animation for all grass blades
   * Only the top portion of each blade bends with the wind
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    this.time += deltaTime;
    
    // Update all blades directly (more efficient than nested loops)
    for (const blade of this.allBlades) {
      // Get the top pivot group (the part that bends)
      const topPivotGroup = blade.userData.topPivotGroup;
      if (!topPivotGroup) continue;
      
      // Calculate wind rotation using sine wave
      // Rotation around Z axis creates side-to-side swaying motion (like wind)
      // Base rotation provides slight natural variation, wind adds animated sway
      const windRotation = blade.userData.baseRotation + 
        blade.userData.windStrength * 
        Math.sin(this.time * this.windSpeed + blade.userData.phaseOffset);
      
      // Only rotate the top pivot group (upper portion of blade)
      // The base stays straight, only the top bends from the connection point
      topPivotGroup.rotation.z = windRotation;
    }
  }

  /**
   * Dispose of all grass resources
   */
  dispose() {
    // Remove all patches from scene
    if (this.grassGroup) {
      this.scene.remove(this.grassGroup);
      
      // Dispose of geometries
      this.allBlades.forEach(blade => {
        if (blade.geometry) blade.geometry.dispose();
      });
      
      this.grassPatches = [];
      this.allBlades = [];
    }
    
    // Dispose material
    if (this.grassMaterial) {
      this.grassMaterial.dispose();
    }
    
    this.grassGroup = null;
  }
}

