import * as THREE from 'three';
import { WorldObject } from './WorldObject.js';
import { Resource } from './Resource.js';
import { HarvestResult } from './HarvestResult.js';
import { Wood } from './items/resources/Wood.js';

export class Tree extends WorldObject {
  static leafTexture = null;
  static leafTexturePromise = null;
  static leafTextureLoader = new THREE.TextureLoader();

  static preloadTextures() {
    if (Tree.leafTexturePromise) {
      return Tree.leafTexturePromise;
    }

    Tree.leafTexturePromise = new Promise((resolve) => {
      if (Tree.leafTexture) {
        resolve(Tree.leafTexture);
        return;
      }
      const texture = Tree.leafTextureLoader.load(
        'public/images/textures/leaftexture.png',
        (loaded) => {
          loaded.wrapS = THREE.RepeatWrapping;
          loaded.wrapT = THREE.RepeatWrapping;
          Tree.leafTexture = loaded;
          resolve(loaded);
        },
        undefined,
        (error) => {
          console.warn('Failed to load leaf texture:', error);
          resolve(null);
        }
      );
      if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
      }
      Tree.leafTexture = texture;
    });

    return Tree.leafTexturePromise;
  }

  static getLeafTexture() {
    if (Tree.leafTexture) {
      return Tree.leafTexture;
    }
    if (!Tree.leafTexturePromise) {
      Tree.preloadTextures();
    }
    return Tree.leafTexture;
  }

  constructor(scene, tileGrid, tileX, tileZ, sizeVariation = 1.0) {
    super(scene, tileGrid, tileX, tileZ);
    this.health = 3;
    this.maxHealth = 3;
    this.isChopped = false;
    this.sizeVariation = sizeVariation; // 0.7 to 1.3 for size variation
    
    // Set tile content
    const tile = this.tileGrid.getTile(tileX, tileZ);
    if (tile) {
      tile.content = 'tree';
      tile.occupied = true; // Trees block tiles
    }
    
    this.create();
  }

  getSaveType() {
    return 'tree';
  }

  shouldRemove() {
    return this.isChopped; // Remove tree when it's been chopped
  }

  create() {
    // Create multi-tiered low-poly evergreen tree matching the image style
    const group = new THREE.Group();
    const baseScale = 1.2; // Base scale multiplier to make trees slightly bigger
    const scale = this.sizeVariation * baseScale;

    // Load leaf texture for overlay (shared across trees)
    const baseLeafTexture = Tree.getLeafTexture();
    // Configure base texture properties
    if (baseLeafTexture) {
      baseLeafTexture.wrapS = THREE.RepeatWrapping;
      baseLeafTexture.wrapT = THREE.RepeatWrapping;
    }

    // Trunk base flare (lighter grayish-tan brown, wider at bottom)
    const flareHeight = 0.1 * scale;
    const flareRadius = 0.3 * scale;
    const flareGeometry = new THREE.CylinderGeometry(flareRadius, flareRadius, flareHeight, 6);
    const flareMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xD4C4A8, // Light grayish-tan brown for base flare
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    const flare = new THREE.Mesh(flareGeometry, flareMaterial);
    flare.position.y = flareHeight / 2;
    flare.castShadow = true;
    flare.receiveShadow = true;
    group.add(flare);

    // Trunk (medium brown, cylindrical, low-poly, slightly wider at base)
    const trunkHeight = 1.8 * scale;
    const trunkTopRadius = 0.25 * scale;
    const trunkBottomRadius = 0.3 * scale;
    const trunkGeometry = new THREE.CylinderGeometry(trunkTopRadius, trunkBottomRadius, trunkHeight, 6); // Low poly with 6 sides
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B6F47, // Medium desaturated brown
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true // Low-poly faceted look
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = flareHeight + trunkHeight / 2; // Position on top of flare
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Multi-tiered canopy - bottom tier (largest, medium emerald green)
    const bottomTierHeight = 1.4 * scale;
    const bottomTierRadius = 1.2 * scale;
    const bottomTierGeometry = new THREE.ConeGeometry(bottomTierRadius, bottomTierHeight, 6);
    const bottomTierMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3CB371, // Medium emerald green (darker/shadow areas)
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });
    const bottomTier = new THREE.Mesh(bottomTierGeometry, bottomTierMaterial);
    bottomTier.position.y = flareHeight + trunkHeight + bottomTierHeight / 2;
    bottomTier.castShadow = true;
    bottomTier.receiveShadow = true;
    group.add(bottomTier);

    // Bottom tier texture overlay (50% opacity)
    const bottomTierOverlayGeometry = new THREE.ConeGeometry(bottomTierRadius, bottomTierHeight, 6);
    // Create texture clone for bottom tier with appropriate repeat values
    const bottomTierTexture = baseLeafTexture ? baseLeafTexture.clone() : null;
    if (bottomTierTexture) {
      // Repeat texture around circumference (6 sides) and along height
      bottomTierTexture.repeat.set(6, Math.ceil(bottomTierHeight / 0.3)); // Repeat 6 times around, scale height repeats
    }
    const bottomTierOverlayMaterial = new THREE.MeshStandardMaterial({
      map: bottomTierTexture,
      transparent: true,
      opacity: 0.5,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });
    const bottomTierOverlay = new THREE.Mesh(bottomTierOverlayGeometry, bottomTierOverlayMaterial);
    bottomTierOverlay.position.y = flareHeight + trunkHeight + bottomTierHeight / 2;
    bottomTierOverlay.castShadow = true;
    bottomTierOverlay.receiveShadow = true;
    group.add(bottomTierOverlay);

    // Middle tier (medium, emerald green)
    const middleTierHeight = 1.1 * scale;
    const middleTierRadius = 0.85 * scale;
    const middleTierGeometry = new THREE.ConeGeometry(middleTierRadius, middleTierHeight, 6);
    const middleTierMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x50C878, // Medium emerald green (main color)
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });
    const middleTier = new THREE.Mesh(middleTierGeometry, middleTierMaterial);
    // Position middle tier to overlap with bottom tier (moved down by 40% of bottom tier height)
    middleTier.position.y = flareHeight + trunkHeight + 0.6 * bottomTierHeight + middleTierHeight / 2;
    middleTier.castShadow = true;
    middleTier.receiveShadow = true;
    group.add(middleTier);

    // Middle tier texture overlay (50% opacity)
    const middleTierOverlayGeometry = new THREE.ConeGeometry(middleTierRadius, middleTierHeight, 6);
    // Create texture clone for middle tier with appropriate repeat values
    const middleTierTexture = baseLeafTexture ? baseLeafTexture.clone() : null;
    if (middleTierTexture) {
      // Repeat texture around circumference (6 sides) and along height
      middleTierTexture.repeat.set(6, Math.ceil(middleTierHeight / 0.3)); // Repeat 6 times around, scale height repeats
    }
    const middleTierOverlayMaterial = new THREE.MeshStandardMaterial({
      map: middleTierTexture,
      transparent: true,
      opacity: 0.5,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });
    const middleTierOverlay = new THREE.Mesh(middleTierOverlayGeometry, middleTierOverlayMaterial);
    // Position middle tier overlay to match middle tier position
    middleTierOverlay.position.y = flareHeight + trunkHeight + 0.6 * bottomTierHeight + middleTierHeight / 2;
    middleTierOverlay.castShadow = true;
    middleTierOverlay.receiveShadow = true;
    group.add(middleTierOverlay);

    // Top tier (smallest, lighter emerald green with flattened apex)
    const topTierHeight = 0.7 * scale;
    const topTierRadius = 0.5 * scale;
    const topTierGeometry = new THREE.ConeGeometry(topTierRadius, topTierHeight, 6);
    const topTierMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x66DDAE, // Lighter emerald green (highlight areas)
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });
    const topTier = new THREE.Mesh(topTierGeometry, topTierMaterial);
    // Position top tier to overlap with middle tier (overlaps by ~30% of middle tier height, but still extends above)
    // Middle tier top is at: flareHeight + trunkHeight + 0.6 * bottomTierHeight + middleTierHeight
    // Top tier bottom starts at: middle tier top - 0.3 * middleTierHeight = 0.6 * bottomTierHeight + 0.7 * middleTierHeight
    topTier.position.y = flareHeight + trunkHeight + 0.6 * bottomTierHeight + 0.7 * middleTierHeight + topTierHeight / 2;
    topTier.castShadow = true;
    topTier.receiveShadow = true;
    group.add(topTier);

    // Top tier texture overlay (50% opacity)
    const topTierOverlayGeometry = new THREE.ConeGeometry(topTierRadius, topTierHeight, 6);
    // Create texture clone for top tier with appropriate repeat values
    const topTierTexture = baseLeafTexture ? baseLeafTexture.clone() : null;
    if (topTierTexture) {
      // Repeat texture around circumference (6 sides) and along height
      topTierTexture.repeat.set(6, Math.ceil(topTierHeight / 0.3)); // Repeat 6 times around, scale height repeats
    }
    const topTierOverlayMaterial = new THREE.MeshStandardMaterial({
      map: topTierTexture,
      transparent: true,
      opacity: 0.5,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });
    const topTierOverlay = new THREE.Mesh(topTierOverlayGeometry, topTierOverlayMaterial);
    // Position top tier overlay to match top tier position
    topTierOverlay.position.y = flareHeight + trunkHeight + 0.6 * bottomTierHeight + 0.7 * middleTierHeight + topTierHeight / 2;
    topTierOverlay.castShadow = true;
    topTierOverlay.receiveShadow = true;
    group.add(topTierOverlay);

    // Position tree so bottom of trunk is on ground
    group.position.set(this.worldX, 0, this.worldZ);
    this.mesh = group;
    this.scene.add(this.mesh);
  }

  interact(player) {
    if (this.isChopped) return false;

    this.health--;
    
    // Visual feedback - shake tree
    if (this.mesh) {
      const originalX = this.mesh.position.x;
      const originalZ = this.mesh.position.z;
      this.mesh.position.x = originalX + (Math.random() - 0.5) * 0.1;
      this.mesh.position.z = originalZ + (Math.random() - 0.5) * 0.1;
      setTimeout(() => {
        if (this.mesh) {
          this.mesh.position.x = originalX;
          this.mesh.position.z = originalZ;
        }
      }, 100);
    }

    if (this.health <= 0) {
      this.harvest();
      return true;
    }

    return false;
  }

  harvest() {
    this.isChopped = true;
    
    // Remove tree mesh
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }

    // Free tile
    const tile = this.tileGrid.getTile(this.tileX, this.tileZ);
    if (tile) {
      tile.occupied = false;
      tile.content = null; // Clear tile content
    }

    // Return harvest results - trees drop 1 wood log to the world
    return [
      new HarvestResult(new Wood(), 1, true) // dropToWorld = true
    ];
  }
}

