import * as THREE from 'three';

export class Terrain {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileSize = 2;
    this.mesh = null;
  }

  create() {
    // Create terrain with two biomes: forest (brown) on left, grass (green) on right
    const terrainGroup = new THREE.Group();
    
    // Optimize rendering by grouping tiles by biome and using merged geometry
    const forestTiles = [];
    const grassTiles = [];
    const blendTiles = [];
    
    // Collect tiles by biome type
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.height; z++) {
        const worldX = (x - this.width / 2) * this.tileSize;
        const worldZ = (z - this.height / 2) * this.tileSize;
        
        // Determine biome based on position (left = forest, right = grass)
        // Create diagonal boundary with blending
        const normalizedX = x / this.width;
        const normalizedZ = z / this.height;
        const diagonalValue = normalizedX + normalizedZ; // Creates diagonal split
        
        let color;
        let biomeType;
        
        if (diagonalValue < 0.8) {
          // Forest biome (brown)
          color = 0x8B7355; // Warm brown
          biomeType = 'forest';
        } else if (diagonalValue > 1.2) {
          // Grass biome (green)
          color = 0x90EE90; // Light green
          biomeType = 'grass';
        } else {
          // Blending zone - mix colors
          const blendFactor = (diagonalValue - 0.8) / 0.4; // 0 to 1
          const brown = new THREE.Color(0x8B7355);
          const green = new THREE.Color(0x90EE90);
          color = brown.lerp(green, blendFactor).getHex();
          biomeType = 'blend';
        }
        
        // Apply checkerboard pattern for grass area
        const isGrass = diagonalValue > 1.0;
        if (isGrass && (x + z) % 2 === 0) {
          // Alternate checkerboard pattern
          const lighterGreen = new THREE.Color(color).lerp(new THREE.Color(0xFFFFFF), 0.1);
          color = lighterGreen.getHex();
        }
        
        // Store tile data for batch creation
        const tileData = {
          worldX,
          worldZ,
          color,
          biomeType
        };
        
        if (biomeType === 'forest') {
          forestTiles.push(tileData);
        } else if (biomeType === 'grass') {
          grassTiles.push(tileData);
        } else {
          blendTiles.push(tileData);
        }
      }
    }
    
    // Create merged geometry for each biome type for better performance
    this.createMergedTerrain(terrainGroup, forestTiles, 'forest');
    this.createMergedTerrain(terrainGroup, grassTiles, 'grass');
    this.createMergedTerrain(terrainGroup, blendTiles, 'blend');
    
    // Add small decorative flowers on grass tiles
    this.addFlowers(terrainGroup);
    
    terrainGroup.position.y = 0;
    this.scene.add(terrainGroup);
    this.mesh = terrainGroup;
  }

  createMergedTerrain(terrainGroup, tiles, biomeType) {
    if (tiles.length === 0) return;
    
    // Group tiles by color to reduce draw calls and material switches
    const tilesByColor = new Map();
    tiles.forEach(tile => {
      if (!tilesByColor.has(tile.color)) {
        tilesByColor.set(tile.color, []);
      }
      tilesByColor.get(tile.color).push(tile);
    });
    
    // Create a single geometry that we'll reuse
    const tileGeometry = new THREE.PlaneGeometry(this.tileSize, this.tileSize);
    tileGeometry.rotateX(-Math.PI / 2); // Rotate to lie flat
    
    // Create meshes grouped by color for better performance
    tilesByColor.forEach((colorTiles, color) => {
      // Create material for this color group
      const material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.8,
        metalness: 0.1
      });
      
      // Create individual meshes for each tile (simple and reliable)
      // For very large grids, could optimize further with InstancedMesh
      colorTiles.forEach(tile => {
        const mesh = new THREE.Mesh(tileGeometry.clone(), material);
        mesh.position.set(tile.worldX, 0, tile.worldZ);
        mesh.receiveShadow = true;
        terrainGroup.add(mesh);
      });
    });
    
    tileGeometry.dispose();
  }

  addFlowers(terrainGroup) {
    // Add small decorative flowers on grass tiles
    const flowerCount = Math.min(100, Math.floor(this.width * this.height * 0.02)); // 2% of tiles, max 100
    
    for (let i = 0; i < flowerCount; i++) {
      const x = Math.random() * this.width;
      const z = Math.random() * this.height;
      const normalizedX = x / this.width;
      const normalizedZ = z / this.height;
      const diagonalValue = normalizedX + normalizedZ;
      
      // Only place flowers on grass side
      if (diagonalValue > 1.0) {
        const worldX = (x - this.width / 2) * this.tileSize;
        const worldZ = (z - this.height / 2) * this.tileSize;
        
        const flowerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const flowerMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xFFFACD, // Light yellow/off-white
          roughness: 0.7
        });
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.set(worldX, 0.05, worldZ);
        terrainGroup.add(flower);
      }
    }
  }
}
