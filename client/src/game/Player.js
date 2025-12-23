import * as THREE from 'three';
import { Resource } from './Resource.js';
import { Pathfinder } from './Pathfinder.js';
import { getItemType } from './ItemTypeRegistry.js';

export class Player {
  constructor(scene, tileGrid) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.mesh = null;
    this.currentTile = null;
    this.targetPosition = null;
    this.path = [];
    this.baseSpeed = 6.0; // Base movement speed
    this.speed = 6.0; // Current movement speed (can be modified by carrying items)
    this.walkAnimationTime = 0; // For walk animation
    this.pendingDropAction = null; // Store drop action when traveling to drop location
    this.isMoving = false;
    this.pickupAnimationTime = 0; // For pickup animation
    this.dropAnimationTime = 0; // For drop animation
    this.isPickingUp = false; // Animation state
    this.isDropping = false; // Animation state
    this.originalY = 0.3; // Store original Y position
    this.originalBodyRotation = 0; // Store original body rotation
    this.pathfinder = new Pathfinder(tileGrid); // Tile-based pathfinder
    this.create();
  }

  loadCharacterColors() {
    // Helper function to convert hex string to number
    const hexToNumber = (hexString) => {
      if (!hexString || typeof hexString !== 'string') return null;
      // Remove # if present
      const hex = hexString.replace('#', '');
      return parseInt(hex, 16);
    };

    // Load colors from localStorage with defaults
    let skinColor = 0xD2B48C; // Light brown/tan (default)
    let hatColor = 0xFF69B4; // Bright pink (default)
    let overallColor = 0x4169E1; // Blue (default)
    let gender = 'male';
    let hatVisible = true;
    let hairstyle = 'none';

    try {
      const savedSkinColor = localStorage.getItem('taskforge_characterSkinColor');
      if (savedSkinColor) {
        const parsed = hexToNumber(savedSkinColor);
        if (parsed !== null) skinColor = parsed;
      }

      const savedHatColor = localStorage.getItem('taskforge_characterHatColor');
      if (savedHatColor) {
        const parsed = hexToNumber(savedHatColor);
        if (parsed !== null) hatColor = parsed;
      }

      const savedOverallsColor = localStorage.getItem('taskforge_characterOverallsColor');
      if (savedOverallsColor) {
        const parsed = hexToNumber(savedOverallsColor);
        if (parsed !== null) overallColor = parsed;
      }

      const savedGender = localStorage.getItem('taskforge_characterGender');
      if (savedGender) {
        gender = savedGender;
      }

      const savedHatVisible = localStorage.getItem('taskforge_characterHatVisible');
      if (savedHatVisible !== null) {
        hatVisible = savedHatVisible === 'true';
      }

      const savedHairstyle = localStorage.getItem('taskforge_characterHairstyle');
      if (savedHairstyle) {
        hairstyle = savedHairstyle;
      }
    } catch (error) {
      console.warn('Failed to load character colors:', error);
    }

    return { skinColor, hatColor, overallColor, gender, hatVisible, hairstyle };
  }

  create() {
    // Create a blocky character matching the design
    const characterGroup = new THREE.Group();
    
    // Load character customization data
    const { skinColor, hatColor, overallColor, gender, hatVisible, hairstyle } = this.loadCharacterColors();
    const shirtColor = 0x808080; // Grey (not customizable)
    
    // Store customization data
    this.gender = gender;
    this.hatVisible = hatVisible;
    this.hairstyle = hairstyle;
    
    // Gender-based body proportions
    const bodyScale = gender === 'female' ? 0.9 : 1.0;
    const shoulderWidth = gender === 'female' ? 0.45 : 0.5;
    const hipWidth = gender === 'female' ? 0.5 : 0.45;
    
    // Head (light brown cube) - gender-based scale
    const headGeometry = new THREE.BoxGeometry(0.5 * bodyScale, 0.5 * bodyScale, 0.5 * bodyScale);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: skinColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.0 * bodyScale, 0);
    head.castShadow = true;
    characterGroup.add(head);
    
    // Face details (using simple geometry) - scaled for gender
    const faceScale = bodyScale;
    // Eyes
    const eyeGeometry = new THREE.BoxGeometry(0.08 * faceScale, 0.08 * faceScale, 0.02);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12 * faceScale, 1.05 * bodyScale, 0.26 * faceScale);
    characterGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12 * faceScale, 1.05 * bodyScale, 0.26 * faceScale);
    characterGroup.add(rightEye);
    
    // Mouth (simple U shape using a small box)
    const mouthGeometry = new THREE.BoxGeometry(0.15 * faceScale, 0.08 * faceScale, 0.02);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 0.92 * bodyScale, 0.26 * faceScale);
    characterGroup.add(mouth);
    
    // Blush (pink circles)
    const blushGeometry = new THREE.BoxGeometry(0.1 * faceScale, 0.1 * faceScale, 0.01);
    const blushMaterial = new THREE.MeshStandardMaterial({ color: 0xFFB6C1 });
    const leftBlush = new THREE.Mesh(blushGeometry, blushMaterial);
    leftBlush.position.set(-0.18 * faceScale, 0.98 * bodyScale, 0.25 * faceScale);
    characterGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeometry, blushMaterial);
    rightBlush.position.set(0.18 * faceScale, 0.98 * bodyScale, 0.25 * faceScale);
    characterGroup.add(rightBlush);
    
    // Hair (create before hat so it's below hat if hat is visible)
    this.hairMesh = null;
    if (hairstyle !== 'none') {
      this.hairMesh = this.createHair(gender, hairstyle, hatColor, bodyScale);
      if (this.hairMesh) {
        characterGroup.add(this.hairMesh);
      }
    }
    
    // Hat (bright pink, mushroom-cap like) - only if hatVisible is true
    let hat = null;
    let hatBrim = null;
    const hatMaterial = new THREE.MeshStandardMaterial({ 
      color: hatColor,
      roughness: 0.7,
      metalness: 0.1
    });
    
    if (hatVisible) {
      const hatGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.7);
      hat = new THREE.Mesh(hatGeometry, hatMaterial);
      hat.position.set(0, 1.25, 0);
      hat.castShadow = true;
      characterGroup.add(hat);
      
      // Hat brim (wider part)
      const hatBrimGeometry = new THREE.BoxGeometry(0.85, 0.15, 0.85);
      hatBrim = new THREE.Mesh(hatBrimGeometry, hatMaterial);
      hatBrim.position.set(0, 1.15, 0);
      hatBrim.castShadow = true;
      characterGroup.add(hatBrim);
    }
    
    // Body/Torso (light brown) - gender-based proportions
    const bodyGeometry = new THREE.BoxGeometry(shoulderWidth, 0.6 * bodyScale, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: skinColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.5 * bodyScale, 0);
    body.castShadow = true;
    characterGroup.add(body);
    
    // Shirt (grey, visible under overalls)
    const shirtGeometry = new THREE.BoxGeometry(0.45, 0.3, 0.35);
    const shirtMaterial = new THREE.MeshStandardMaterial({ 
      color: shirtColor,
      roughness: 0.8
    });
    const shirt = new THREE.Mesh(shirtGeometry, shirtMaterial);
    shirt.position.set(0, 0.65, 0);
    characterGroup.add(shirt);
    
    // Overalls (blue) - gender-based proportions
    const overallGeometry = new THREE.BoxGeometry(hipWidth, 0.7 * bodyScale, 0.45);
    const overallMaterial = new THREE.MeshStandardMaterial({ 
      color: overallColor,
      roughness: 0.9,
      metalness: 0.1
    });
    const overalls = new THREE.Mesh(overallGeometry, overallMaterial);
    overalls.position.set(0, 0.45 * bodyScale, 0);
    overalls.castShadow = true;
    characterGroup.add(overalls);
    
    // Overall straps
    const strapGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.05);
    const leftStrap = new THREE.Mesh(strapGeometry, overallMaterial);
    leftStrap.position.set(-0.2, 0.7, 0.2);
    characterGroup.add(leftStrap);
    const rightStrap = new THREE.Mesh(strapGeometry, overallMaterial);
    rightStrap.position.set(0.2, 0.7, 0.2);
    characterGroup.add(rightStrap);
    
    // Buttons on overalls
    const buttonGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
    const leftButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
    leftButton.position.set(-0.15, 0.75, 0.23);
    characterGroup.add(leftButton);
    const rightButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
    rightButton.position.set(0.15, 0.75, 0.23);
    characterGroup.add(rightButton);
    
    // Arms (light brown, positioned at sides) - gender-based positioning
    const armGeometry = new THREE.BoxGeometry(0.15, 0.4 * bodyScale, 0.15);
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: skinColor,
      roughness: 0.8
    });
    const armOffsetX = gender === 'female' ? 0.32 : 0.35;
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-armOffsetX, 0.5 * bodyScale, 0);
    leftArm.castShadow = true;
    characterGroup.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(armOffsetX, 0.5 * bodyScale, 0);
    rightArm.castShadow = true;
    characterGroup.add(rightArm);
    
    // Legs (part of overalls, blocky) - gender-based proportions
    // Overalls bottom is at Y=0.45 * bodyScale - 0.35 * bodyScale = 0.1 * bodyScale
    const legGeometry = new THREE.BoxGeometry(0.2, 0.4 * bodyScale, 0.2);
    const legOffsetX = gender === 'female' ? 0.12 : 0.15;
    const leftLeg = new THREE.Mesh(legGeometry, overallMaterial);
    leftLeg.position.set(-legOffsetX, -0.1 * bodyScale, 0);
    leftLeg.castShadow = true;
    characterGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeometry, overallMaterial);
    rightLeg.position.set(legOffsetX, -0.1 * bodyScale, 0);
    rightLeg.castShadow = true;
    characterGroup.add(rightLeg);
    
    // Store leg and arm references for animation
    this.leftLeg = leftLeg;
    this.rightLeg = rightLeg;
    this.leftArm = leftArm;
    this.rightArm = rightArm;
    this.body = body; // Store body reference for bending animation
    this.head = head; // Store head reference for bending animation
    this.overalls = overalls; // Store overalls reference for bending animation
    
    // Store mesh references for dynamic updates
    this.hat = hat;
    this.hatBrim = hatBrim;
    this.leftStrap = leftStrap;
    this.rightStrap = rightStrap;
    this.leftButton = leftButton;
    this.rightButton = rightButton;
    
    // Store material references for potential dynamic updates
    this.hatMaterial = hat ? hatMaterial : new THREE.MeshStandardMaterial({ 
      color: hatColor,
      roughness: 0.7,
      metalness: 0.1
    });
    this.overallMaterial = overallMaterial;
    this.skinMaterial = headMaterial; // Head and body use same skin material
    this.bodyMaterial = bodyMaterial;
    this.armMaterial = armMaterial;
    this.buttonMaterial = buttonMaterial;
    
    // Create hand item group (will hold the item the player is carrying)
    this.handItemGroup = new THREE.Group();
    this.handItemGroup.position.set(0.4, 0.4, 0.1); // Position in right hand
    this.handItemGroup.visible = false; // Hidden by default
    characterGroup.add(this.handItemGroup);
    this.currentHandItem = null; // Track what item is in hand
    
    this.mesh = characterGroup;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Position at center of starting tile
    // Character's legs bottom is at Y=-0.3 (leg center at -0.1, leg height 0.4)
    // To put feet on ground (Y=0), position character group at Y=0.3
    const startTile = this.tileGrid.getTile(Math.floor(this.tileGrid.width / 2), Math.floor(this.tileGrid.height / 2));
    if (startTile) {
      this.mesh.position.set(startTile.worldX, 0.3, startTile.worldZ);
      this.currentTile = startTile;
    } else {
      this.mesh.position.set(0, 0.3, 0);
      // Fallback: get tile at origin
      const { tileX, tileZ } = this.tileGrid.worldToTile(0, 0);
      this.currentTile = this.tileGrid.getTile(tileX, tileZ);
    }

    this.scene.add(this.mesh);
  }

  createHair(gender, hairstyle, hairColor, bodyScale = 1.0) {
    if (!hairstyle || hairstyle === 'none') return null;
    
    const hairGroup = new THREE.Group();
    const hairMaterial = new THREE.MeshStandardMaterial({ 
      color: hairColor,
      roughness: 0.8,
      metalness: 0.1
    });
    
    if (gender === 'male') {
      switch (hairstyle) {
        case 'short':
          // Short hair - simple box on top of head
          const shortHair = new THREE.Mesh(
            new THREE.BoxGeometry(0.55 * bodyScale, 0.15 * bodyScale, 0.55 * bodyScale),
            hairMaterial
          );
          shortHair.position.set(0, 1.15 * bodyScale, 0);
          hairGroup.add(shortHair);
          break;
        case 'spiky':
          // Spiky hair - multiple small boxes
          for (let i = 0; i < 5; i++) {
            const spike = new THREE.Mesh(
              new THREE.BoxGeometry(0.08 * bodyScale, 0.2 * bodyScale, 0.08 * bodyScale),
              hairMaterial
            );
            const angle = (i / 5) * Math.PI * 2;
            spike.position.set(
              Math.cos(angle) * 0.15 * bodyScale,
              1.2 * bodyScale,
              Math.sin(angle) * 0.15 * bodyScale
            );
            hairGroup.add(spike);
          }
          break;
        case 'curly':
          // Curly hair - wavy box
          const curlyHair = new THREE.Mesh(
            new THREE.BoxGeometry(0.6 * bodyScale, 0.2 * bodyScale, 0.6 * bodyScale),
            hairMaterial
          );
          curlyHair.position.set(0, 1.15 * bodyScale, 0);
          hairGroup.add(curlyHair);
          break;
      }
    } else {
      // Female hairstyles
      switch (hairstyle) {
        case 'long':
          // Long hair - boxes on sides
          const leftLong = new THREE.Mesh(
            new THREE.BoxGeometry(0.15 * bodyScale, 0.5 * bodyScale, 0.15 * bodyScale),
            hairMaterial
          );
          leftLong.position.set(-0.2 * bodyScale, 0.9 * bodyScale, 0);
          hairGroup.add(leftLong);
          const rightLong = new THREE.Mesh(
            new THREE.BoxGeometry(0.15 * bodyScale, 0.5 * bodyScale, 0.15 * bodyScale),
            hairMaterial
          );
          rightLong.position.set(0.2 * bodyScale, 0.9 * bodyScale, 0);
          hairGroup.add(rightLong);
          const topLong = new THREE.Mesh(
            new THREE.BoxGeometry(0.5 * bodyScale, 0.15 * bodyScale, 0.5 * bodyScale),
            hairMaterial
          );
          topLong.position.set(0, 1.15 * bodyScale, 0);
          hairGroup.add(topLong);
          break;
        case 'ponytail':
          // Ponytail - hair on top and ponytail in back
          const topPony = new THREE.Mesh(
            new THREE.BoxGeometry(0.5 * bodyScale, 0.15 * bodyScale, 0.5 * bodyScale),
            hairMaterial
          );
          topPony.position.set(0, 1.15 * bodyScale, 0);
          hairGroup.add(topPony);
          const ponytail = new THREE.Mesh(
            new THREE.BoxGeometry(0.12 * bodyScale, 0.4 * bodyScale, 0.12 * bodyScale),
            hairMaterial
          );
          ponytail.position.set(0, 0.85 * bodyScale, -0.2 * bodyScale);
          hairGroup.add(ponytail);
          break;
        case 'bob':
          // Bob cut - short rounded hair
          const bobHair = new THREE.Mesh(
            new THREE.BoxGeometry(0.55 * bodyScale, 0.25 * bodyScale, 0.55 * bodyScale),
            hairMaterial
          );
          bobHair.position.set(0, 1.1 * bodyScale, 0);
          hairGroup.add(bobHair);
          break;
      }
    }
    
    hairGroup.castShadow = true;
    return hairGroup;
  }

  updateColors() {
    // Load current colors from localStorage
    const { skinColor, hatColor, overallColor } = this.loadCharacterColors();
    
    // Update hat color (hat and hatBrim)
    if (this.hatMaterial) {
      this.hatMaterial.color.setHex(hatColor);
    }
    
    // Update hair color if hair exists
    if (this.hairMesh && this.hairMesh.children.length > 0) {
      this.hairMesh.children.forEach(child => {
        if (child.material) {
          child.material.color.setHex(hatColor);
        }
      });
    }
    
    // Update overalls color (overalls, straps, legs)
    if (this.overallMaterial) {
      this.overallMaterial.color.setHex(overallColor);
    }
    
    // Update skin color (head, body, arms, buttons)
    if (this.skinMaterial) {
      this.skinMaterial.color.setHex(skinColor);
    }
    if (this.bodyMaterial) {
      this.bodyMaterial.color.setHex(skinColor);
    }
    if (this.armMaterial) {
      this.armMaterial.color.setHex(skinColor);
    }
    if (this.buttonMaterial) {
      this.buttonMaterial.color.setHex(skinColor);
    }
  }

  updateHatVisibility(visible) {
    this.hatVisible = visible;
    if (visible) {
      // Create hat if it doesn't exist
      if (!this.hat || !this.hatBrim) {
        const { hatColor } = this.loadCharacterColors();
        const hatGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.7);
        this.hat = new THREE.Mesh(hatGeometry, this.hatMaterial);
        this.hat.position.set(0, 1.25, 0);
        this.hat.castShadow = true;
        this.mesh.add(this.hat);
        
        const hatBrimGeometry = new THREE.BoxGeometry(0.85, 0.15, 0.85);
        this.hatBrim = new THREE.Mesh(hatBrimGeometry, this.hatMaterial);
        this.hatBrim.position.set(0, 1.15, 0);
        this.hatBrim.castShadow = true;
        this.mesh.add(this.hatBrim);
      } else {
        this.hat.visible = true;
        this.hatBrim.visible = true;
      }
    } else {
      // Hide hat if it exists
      if (this.hat) {
        this.hat.visible = false;
      }
      if (this.hatBrim) {
        this.hatBrim.visible = false;
      }
    }
  }

  updateHair(gender, hairstyle) {
    // Remove existing hair
    if (this.hairMesh && this.mesh) {
      this.mesh.remove(this.hairMesh);
      this.hairMesh = null;
    }
    
    // Create new hair if needed
    if (hairstyle && hairstyle !== 'none') {
      const { hatColor, gender: currentGender } = this.loadCharacterColors();
      const bodyScale = currentGender === 'female' ? 0.9 : 1.0;
      this.hairMesh = this.createHair(gender, hairstyle, hatColor, bodyScale);
      if (this.hairMesh && this.mesh) {
        this.mesh.add(this.hairMesh);
      }
    }
    
    this.hairstyle = hairstyle;
    this.gender = gender;
  }

  updateGender(gender) {
    // Gender change requires full recreation, but for now just update stored value
    // Full recreation would be complex, so we'll just update the stored value
    this.gender = gender;
    // Note: Full body recreation would require recreating the entire model
    // For now, this is a placeholder that could be enhanced later
  }

  // Move to tile coordinates (strict tile-based movement)
  moveTo(tileX, tileZ) {
    const targetTile = this.tileGrid.getTile(tileX, tileZ);
    if (!targetTile || !targetTile.walkable) {
      // Hide destination indicator if invalid target
      if (this.destinationIndicator) {
        this.destinationIndicator.hide();
      }
      return false;
    }

    // If player is already moving, use the next tile in the current path as starting point
    // This prevents backwards movement when spam-clicking
    let startTileX, startTileZ;
    if (this.path.length > 0) {
      // Player is moving - use the next destination tile as starting point
      const nextTile = this.path[0];
      startTileX = nextTile.tileX;
      startTileZ = nextTile.tileZ;
    } else {
      // Player is stationary - use current tile
      startTileX = this.currentTile ? this.currentTile.tileX : 0;
      startTileZ = this.currentTile ? this.currentTile.tileZ : 0;
    }
    
    this.path = this.pathfinder.findPath(startTileX, startTileZ, tileX, tileZ);

    if (this.path.length > 0) {
      this.isMoving = true;
      // Show destination indicator
      if (this.destinationIndicator) {
        this.destinationIndicator.setDestination(targetTile);
      }
      return true;
    } else {
      // Hide destination indicator if no path found
      if (this.destinationIndicator) {
        this.destinationIndicator.hide();
      }
    }
    return false;
  }

  // Legacy method for world coordinates - converts to tile coordinates
  moveToWorld(worldX, worldZ) {
    const { tileX, tileZ } = this.tileGrid.worldToTile(worldX, worldZ);
    return this.moveTo(tileX, tileZ);
  }

  // Legacy calculatePath - kept for backward compatibility but uses Pathfinder
  calculatePath(startX, startZ, endX, endZ) {
    // Convert world coordinates to tile coordinates
    const startTile = this.tileGrid.getTileAtWorldPosition(startX, startZ);
    const endTile = this.tileGrid.getTileAtWorldPosition(endX, endZ);
    
    if (!startTile || !endTile || !endTile.walkable) return [];
    
    return this.pathfinder.findPath(startTile.tileX, startTile.tileZ, endTile.tileX, endTile.tileZ);
  }

  // Legacy getNeighbors - now handled by Pathfinder
  getNeighbors(tile) {
    return this.pathfinder.getNeighbors(tile.tileX, tile.tileZ);
  }

  // Legacy heuristic - now handled by Pathfinder
  heuristic(a, b) {
    const dx = Math.abs(a.tileX - b.tileX);
    const dz = Math.abs(a.tileZ - b.tileZ);
    return Math.max(dx, dz) + (Math.sqrt(2) - 1) * Math.min(dx, dz);
  }

  update(deltaTime) {
    // Update movement speed based on what player is carrying
    // Each item type can modify movement speed
    let speedModifier = 1.0; // Default: no speed change
    
    if (this.inventory) {
      const allItems = this.inventory.getAllItems();
      // Find the minimum speed modifier (worst case - heaviest item slows you down)
      for (const item of allItems) {
        const itemType = getItemType(item.type);
        if (itemType) {
          const modifier = itemType.getSpeedModifier();
          speedModifier = Math.min(speedModifier, modifier);
        }
      }
    }
    
    this.speed = this.baseSpeed * speedModifier;
    
    if (this.path.length > 0 && this.isMoving) {
      const targetTile = this.path[0];
      const targetX = targetTile.worldX;
      const targetZ = targetTile.worldZ;
      const currentX = this.mesh.position.x;
      const currentZ = this.mesh.position.z;

      const dx = targetX - currentX;
      const dz = targetZ - currentZ;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 0.1) {
        // Reached current waypoint - snap to tile center
        this.mesh.position.x = targetX;
        this.mesh.position.z = targetZ;
        this.mesh.position.y = 0.3; // Reset to base position when stopped
        this.walkAnimationTime = 0; // Reset animation
        
        // Update current tile
        this.currentTile = targetTile;
        this.path.shift();
        
        if (this.path.length === 0) {
          this.isMoving = false;
          // Hide destination indicator when reached
          if (this.destinationIndicator) {
            this.destinationIndicator.hide();
          }
          
          // Check for resources on this tile and pick them up
          this.pickupResourcesOnTile();
          
          // Execute pending drop action if player traveled to drop location
          if (this.pendingDropAction) {
            const dropAction = this.pendingDropAction;
            this.pendingDropAction = null;
            // Use interaction manager to drop the item
            if (this.sceneManager && this.sceneManager.interactionManager) {
              this.sceneManager.interactionManager.dropItemAt(dropAction.x, dropAction.z, dropAction.itemType);
            }
          }
        }
      } else {
        // Move towards waypoint with visual smoothing
        const moveDistance = this.speed * deltaTime;
        if (moveDistance >= distance) {
          // Snap to tile center if close enough
          this.mesh.position.x = targetX;
          this.mesh.position.z = targetZ;
          this.mesh.position.y = 0.3; // Base position (feet at Y=0)
          this.currentTile = targetTile;
          this.path.shift();
          
          if (this.path.length === 0) {
            this.isMoving = false;
            // Hide destination indicator when reached
            if (this.destinationIndicator) {
              this.destinationIndicator.hide();
            }
            
            // Check for resources on this tile and pick them up
            this.pickupResourcesOnTile();
            
            // Execute pending drop action if player traveled to drop location
            if (this.pendingDropAction) {
              const dropAction = this.pendingDropAction;
              this.pendingDropAction = null;
              // Use interaction manager to drop the item
              if (this.sceneManager && this.sceneManager.interactionManager) {
                this.sceneManager.interactionManager.dropItemAt(dropAction.x, dropAction.z, dropAction.itemType);
              }
            }
          }
        } else {
          // Smooth movement between tiles
          this.mesh.position.x += (dx / distance) * moveDistance;
          this.mesh.position.z += (dz / distance) * moveDistance;
          
          // Walk animation - bounce up and down
          this.walkAnimationTime += deltaTime * 10; // Fast bounce animation
          const bounceHeight = Math.abs(Math.sin(this.walkAnimationTime)) * 0.1; // Bounce 0.1 units
          this.mesh.position.y = 0.3 + bounceHeight; // Base Y=0.3, add bounce
        }

        // Rotate entire character group to face movement direction
        if (distance > 0.01) {
          const angle = Math.atan2(dx, dz);
          this.mesh.rotation.y = angle;
        }
      }
    }
    
    // Handle pickup animation
    if (this.isPickingUp) {
      this.pickupAnimationTime += deltaTime * 6; // Slower, more realistic speed
      const duration = 0.6; // Total animation duration in seconds
      const progress = Math.min(this.pickupAnimationTime / duration, 1.0);
      
      if (progress >= 1.0) {
        // Animation complete
        this.isPickingUp = false;
        this.pickupAnimationTime = 0;
        // Reset positions
        if (this.leftArm) {
          this.leftArm.rotation.x = 0;
          this.leftArm.rotation.z = 0;
        }
        if (this.rightArm) {
          this.rightArm.rotation.x = 0;
          this.rightArm.rotation.z = 0;
        }
        if (this.body) this.body.rotation.x = 0;
        if (this.head) this.head.rotation.x = 0;
        if (this.overalls) this.overalls.rotation.x = 0;
        this.mesh.position.y = this.originalY;
        // Update hand item after pickup
        this.updateHandItem();
      } else {
        // Realistic pickup animation: bend down, reach, grab, stand up
        // Use easing functions for more natural movement
        const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easeOut = (t) => t * (2 - t);
        
        // Phase 1: Bend down (0-0.4)
        // Phase 2: Reach and grab (0.4-0.6)
        // Phase 3: Stand up (0.6-1.0)
        let bendProgress, reachProgress;
        
        if (progress < 0.4) {
          // Bending down phase
          bendProgress = progress / 0.4;
          reachProgress = 0;
        } else if (progress < 0.6) {
          // Reaching and grabbing phase
          bendProgress = 1.0;
          reachProgress = (progress - 0.4) / 0.2;
        } else {
          // Standing up phase
          bendProgress = 1.0 - ((progress - 0.6) / 0.4);
          reachProgress = 1.0 - ((progress - 0.6) / 0.4);
        }
        
        const easedBend = easeInOut(bendProgress);
        const easedReach = easeOut(reachProgress);
        
        // Bend body forward (up to 0.7 radians / ~40 degrees)
        const bendAngle = easedBend * 0.7;
        if (this.body) {
          this.body.rotation.x = bendAngle;
        }
        if (this.overalls) {
          this.overalls.rotation.x = bendAngle;
        }
        // Head follows body but less
        if (this.head) {
          this.head.rotation.x = bendAngle * 0.7;
        }
        
        // Arms reach down and forward
        const armReachX = easedReach * 1.2; // Reach forward
        const armReachZ = easedReach * 0.3; // Reach slightly outward
        if (this.leftArm) {
          this.leftArm.rotation.x = armReachX;
          this.leftArm.rotation.z = -armReachZ;
        }
        if (this.rightArm) {
          this.rightArm.rotation.x = armReachX;
          this.rightArm.rotation.z = armReachZ;
        }
        
        // Lower character as they bend (more realistic)
        this.mesh.position.y = this.originalY - easedBend * 0.2;
      }
    }
    
    // Handle drop animation
    if (this.isDropping) {
      this.dropAnimationTime += deltaTime * 6; // Slower, more realistic speed
      const duration = 0.5; // Total animation duration in seconds
      const progress = Math.min(this.dropAnimationTime / duration, 1.0);
      
      if (progress >= 1.0) {
        // Animation complete
        this.isDropping = false;
        this.dropAnimationTime = 0;
        this.dropSoundPlayed = false;
        // Reset positions
        if (this.leftArm) {
          this.leftArm.rotation.x = 0;
          this.leftArm.rotation.z = 0;
        }
        if (this.rightArm) {
          this.rightArm.rotation.x = 0;
          this.rightArm.rotation.z = 0;
        }
        if (this.body) this.body.rotation.x = 0;
        if (this.head) this.head.rotation.x = 0;
        if (this.overalls) this.overalls.rotation.x = 0;
        this.mesh.position.y = this.originalY;
        // Update hand item after drop
        this.updateHandItem();
      } else {
        // Realistic drop animation: bend down, place item, stand up
        const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easeOut = (t) => t * (2 - t);
        
        // Phase 1: Bend down (0-0.35)
        // Phase 2: Place item (0.35-0.55) - sound plays here
        // Phase 3: Stand up (0.55-1.0)
        let bendProgress, placeProgress;
        
        if (progress < 0.35) {
          // Bending down phase
          bendProgress = progress / 0.35;
          placeProgress = 0;
        } else if (progress < 0.55) {
          // Placing item phase
          bendProgress = 1.0;
          placeProgress = (progress - 0.35) / 0.2;
          // Play drop sound when placing (around 0.4 progress)
          if (!this.dropSoundPlayed && progress >= 0.4) {
            if (this.audioManager && this.audioManager.playDropSound) {
              this.audioManager.playDropSound();
            }
            this.dropSoundPlayed = true;
          }
        } else {
          // Standing up phase
          bendProgress = 1.0 - ((progress - 0.55) / 0.45);
          placeProgress = 1.0 - ((progress - 0.55) / 0.45);
        }
        
        const easedBend = easeInOut(bendProgress);
        const easedPlace = easeOut(placeProgress);
        
        // Bend body forward (up to 0.6 radians / ~34 degrees)
        const bendAngle = easedBend * 0.6;
        if (this.body) {
          this.body.rotation.x = bendAngle;
        }
        if (this.overalls) {
          this.overalls.rotation.x = bendAngle;
        }
        // Head follows body but less
        if (this.head) {
          this.head.rotation.x = bendAngle * 0.7;
        }
        
        // Arms reach down to place item
        const armReachX = easedPlace * 1.0; // Reach forward
        const armReachZ = easedPlace * 0.2; // Reach slightly outward
        if (this.leftArm) {
          this.leftArm.rotation.x = armReachX;
          this.leftArm.rotation.z = -armReachZ;
        }
        if (this.rightArm) {
          this.rightArm.rotation.x = armReachX;
          this.rightArm.rotation.z = armReachZ;
        }
        
        // Lower character as they bend
        this.mesh.position.y = this.originalY - easedBend * 0.18;
      }
    }
  }
  
  triggerPickupAnimation() {
    if (!this.isPickingUp && !this.isDropping) {
      this.isPickingUp = true;
      this.pickupAnimationTime = 0;
      this.originalY = this.mesh.position.y;
      // Play pickup sound
      if (this.audioManager && this.audioManager.playPickupSound) {
        this.audioManager.playPickupSound();
      }
    }
  }
  
  triggerDropAnimation() {
    if (!this.isPickingUp && !this.isDropping) {
      this.isDropping = true;
      this.dropAnimationTime = 0;
      this.originalY = this.mesh.position.y;
      // Play drop sound (will play when item is placed)
      // We'll trigger it at the right moment in the animation
      this.dropSoundPlayed = false;
    }
  }
  
  createHandItemModel(itemType) {
    // Get the item type from the registry
    const itemTypeObj = getItemType(itemType);
    if (itemTypeObj) {
      // Use the item type's getHandModel method
      return itemTypeObj.getHandModel(1.0);
    }
    
    // Fallback for unknown item types
    const scale = 1.0;
    const defaultGeometry = new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 0.3 * scale);
    const defaultMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      roughness: 0.7,
      metalness: 0.2
    });
    return new THREE.Mesh(defaultGeometry, defaultMaterial);
  }
  
  updateHandItem() {
    if (!this.handItemGroup || !this.inventory) return;
    
    // Clear existing hand item
    while (this.handItemGroup.children.length > 0) {
      this.handItemGroup.remove(this.handItemGroup.children[0]);
    }
    
    // Resources take priority over tools - check for resources first (slots 3-6)
    let itemToShow = null;
    for (let slot = 3; slot <= 6; slot++) {
      const itemSlot = this.inventory.getItemSlot(slot);
      if (itemSlot && itemSlot.type) {
        itemToShow = itemSlot;
        break; // Found first resource, use it
      }
    }
    
    // If no resource found, check selected slot (which might be a tool)
    if (!itemToShow) {
      itemToShow = this.inventory.getSelectedSlot();
    }
    
    if (itemToShow && itemToShow.type) {
      const itemTypeId = itemToShow.type;
      const handItemMesh = this.createHandItemModel(itemTypeId);
      if (handItemMesh) {
        handItemMesh.castShadow = true;
        handItemMesh.receiveShadow = true;
        this.handItemGroup.add(handItemMesh);
        this.handItemGroup.visible = true;
        this.currentHandItem = itemTypeId;
        
        // Position hand item - let the ItemType handle its own positioning
        const itemType = getItemType(itemTypeId);
        if (itemType) {
          itemType.positionHandItem(this.handItemGroup);
        } else {
          // Fallback to default right hand position
          this.handItemGroup.position.set(0.4, 0.4, 0.1);
        }
      }
    } else {
      // No item to show, hide hand item
      this.handItemGroup.visible = false;
      this.currentHandItem = null;
    }
  }

  getPosition() {
    return {
      x: this.mesh.position.x,
      z: this.mesh.position.z
    };
  }

  // Get tile coordinates of current position
  getTilePosition() {
    if (this.currentTile) {
      return {
        tileX: this.currentTile.tileX,
        tileZ: this.currentTile.tileZ
      };
    }
    // Fallback: convert world position to tile coordinates
    const { tileX, tileZ } = this.tileGrid.worldToTile(this.mesh.position.x, this.mesh.position.z);
    return { tileX, tileZ };
  }

  getCurrentTile() {
    return this.currentTile;
  }

  pickupResourcesOnTile() {
    if (!this.currentTile || !this.inventory) return;
    
    // Find resources on the current tile
    const sceneManager = this.sceneManager || (window.gameInstance && window.gameInstance.sceneManager);
    if (!sceneManager || !sceneManager.worldObjects) return;
    
    const playerPos = this.getPosition();
    
    const resourcesOnTile = sceneManager.worldObjects.filter(obj => {
      // Check if it's a resource using instanceof
      if (obj instanceof Resource) {
        // Check if resource is on the same tile (tile-based interaction)
        const resourceTilePos = obj.getTilePosition();
        const sameTile = resourceTilePos.tileX === this.currentTile.tileX && 
                         resourceTilePos.tileZ === this.currentTile.tileZ;
        
        return sameTile;
      }
      return false;
    });

    // Pick up 1 item from the first resource on this tile (one click = one item)
    if (resourcesOnTile.length > 0) {
      const resource = resourcesOnTile[0]; // Only pick up from first resource
      if (resource.interact && resource.interact(this)) {
        // Trigger pickup animation
        this.triggerPickupAnimation();
        
        // Update hand item immediately to show what was picked up
        this.updateHandItem();
        
        // Resource was picked up (1 item)
        if (resource.shouldRemove && resource.shouldRemove()) {
          // Stack is empty, remove the resource
          resource.remove();
          const index = sceneManager.worldObjects.indexOf(resource);
          if (index > -1) {
            sceneManager.worldObjects.splice(index, 1);
          }
        }
        // If stack still has items, the resource remains
      }
    }
  }
}

