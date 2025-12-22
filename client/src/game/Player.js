import * as THREE from 'three';
import { Resource } from './Resource.js';
import { Pathfinder } from './Pathfinder.js';

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

  create() {
    // Create a blocky character matching the design
    const characterGroup = new THREE.Group();
    
    // Colors
    const skinColor = 0xD2B48C; // Light brown/tan
    const hatColor = 0xFF69B4; // Bright pink
    const overallColor = 0x4169E1; // Blue
    const shirtColor = 0x808080; // Grey
    
    // Head (light brown cube)
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: skinColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.0, 0);
    head.castShadow = true;
    characterGroup.add(head);
    
    // Face details (using simple geometry)
    // Eyes
    const eyeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 1.05, 0.26);
    characterGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 1.05, 0.26);
    characterGroup.add(rightEye);
    
    // Mouth (simple U shape using a small box)
    const mouthGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.02);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 0.92, 0.26);
    characterGroup.add(mouth);
    
    // Blush (pink circles)
    const blushGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.01);
    const blushMaterial = new THREE.MeshStandardMaterial({ color: 0xFFB6C1 });
    const leftBlush = new THREE.Mesh(blushGeometry, blushMaterial);
    leftBlush.position.set(-0.18, 0.98, 0.25);
    characterGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeometry, blushMaterial);
    rightBlush.position.set(0.18, 0.98, 0.25);
    characterGroup.add(rightBlush);
    
    // Hat (bright pink, mushroom-cap like)
    const hatGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.7);
    const hatMaterial = new THREE.MeshStandardMaterial({ 
      color: hatColor,
      roughness: 0.7,
      metalness: 0.1
    });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.set(0, 1.25, 0);
    hat.castShadow = true;
    characterGroup.add(hat);
    
    // Hat brim (wider part)
    const hatBrimGeometry = new THREE.BoxGeometry(0.85, 0.15, 0.85);
    const hatBrim = new THREE.Mesh(hatBrimGeometry, hatMaterial);
    hatBrim.position.set(0, 1.15, 0);
    hatBrim.castShadow = true;
    characterGroup.add(hatBrim);
    
    // Body/Torso (light brown)
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: skinColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.5, 0);
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
    
    // Overalls (blue)
    const overallGeometry = new THREE.BoxGeometry(0.55, 0.7, 0.45);
    const overallMaterial = new THREE.MeshStandardMaterial({ 
      color: overallColor,
      roughness: 0.9,
      metalness: 0.1
    });
    const overalls = new THREE.Mesh(overallGeometry, overallMaterial);
    overalls.position.set(0, 0.45, 0);
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
    
    // Arms (light brown, positioned at sides)
    const armGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    const armMaterial = new THREE.MeshStandardMaterial({ 
      color: skinColor,
      roughness: 0.8
    });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.35, 0.5, 0);
    leftArm.castShadow = true;
    characterGroup.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.35, 0.5, 0);
    rightArm.castShadow = true;
    characterGroup.add(rightArm);
    
    // Legs (part of overalls, blocky) - connect to bottom of overalls
    // Overalls bottom is at Y=0.45 - 0.35 = 0.1, so leg center should be at 0.1 - 0.2 = -0.1
    const legGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
    const leftLeg = new THREE.Mesh(legGeometry, overallMaterial);
    leftLeg.position.set(-0.15, -0.1, 0); // Connected to overalls bottom
    leftLeg.castShadow = true;
    characterGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeometry, overallMaterial);
    rightLeg.position.set(0.15, -0.1, 0); // Connected to overalls bottom
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

    const startTileX = this.currentTile ? this.currentTile.tileX : 0;
    const startTileZ = this.currentTile ? this.currentTile.tileZ : 0;
    
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
    // Logs slow down movement significantly
    if (this.inventory && this.inventory.hasItem('wood')) {
      this.speed = this.baseSpeed * 0.5; // 50% speed when carrying a log
    } else {
      this.speed = this.baseSpeed; // Normal speed
    }
    
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
    // Create full-size items for the hand (same size as when on ground)
    const scale = 1.0; // Full size items - no scaling
    
    switch (itemType) {
      case 'wood':
        // Create full-size log for the hand (matching the Resource design exactly)
        const logGroup = new THREE.Group();
        const logLength = 2.3; // Full size - slightly longer than tile size (2.0)
        const logRadius = 0.25; // Full size radius
        
        // Log body - faceted cylinder (octagonal, 8 sides)
        const logBodyGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
        const logBodyMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x8B6F47, // Medium desaturated brown
          roughness: 0.9,
          metalness: 0.1,
          flatShading: true
        });
        const logBody = new THREE.Mesh(logBodyGeometry, logBodyMaterial);
        logBody.rotation.z = Math.PI / 2; // Rotate to be horizontal
        logGroup.add(logBody);
        
        // End caps (beige)
        const endCapMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD4C4A8, // Light beige/grayish-tan
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true
        });
        
        // Front end cap
        const frontEndCapGeometry = new THREE.CylinderGeometry(logRadius, logRadius, 0.05, 8);
        const frontEndCap = new THREE.Mesh(frontEndCapGeometry, endCapMaterial);
        frontEndCap.rotation.z = Math.PI / 2;
        frontEndCap.position.set(logLength / 2, 0, 0);
        logGroup.add(frontEndCap);
        
        // Back end cap
        const backEndCapGeometry = new THREE.CylinderGeometry(logRadius, logRadius, 0.05, 8);
        const backEndCap = new THREE.Mesh(backEndCapGeometry, endCapMaterial);
        backEndCap.rotation.z = Math.PI / 2;
        backEndCap.position.set(-logLength / 2, 0, 0);
        logGroup.add(backEndCap);
        
        // Add concentric rings on end caps
        const ringMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xC4B498, // Slightly darker beige for rings
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true
        });
        
        // Front end rings
        for (let i = 1; i <= 2; i++) {
          const ringRadius = logRadius * (1 - i * 0.3);
          if (ringRadius > 0.05) {
            const ringGeometry = new THREE.RingGeometry(ringRadius * 0.7, ringRadius, 8);
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(logLength / 2 + 0.026, 0, 0);
            logGroup.add(ring);
          }
        }
        
        // Back end rings
        for (let i = 1; i <= 2; i++) {
          const ringRadius = logRadius * (1 - i * 0.3);
          if (ringRadius > 0.05) {
            const ringGeometry = new THREE.RingGeometry(ringRadius * 0.7, ringRadius, 8);
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(-logLength / 2 - 0.026, 0, 0);
            logGroup.add(ring);
          }
        }
        
        // Log body is already horizontal along X axis (from rotation.z = Math.PI/2)
        // No additional rotation needed - log extends left-right (along X axis)
        // This allows it to be gripped by left and right arms
        return logGroup;
        
      case 'stone':
        // Full size stone
        const stoneGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
        const stoneMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x808080,
          roughness: 0.7,
          metalness: 0.2
        });
        return new THREE.Mesh(stoneGeometry, stoneMaterial);
        
      case 'stick':
        // Full size stick (matching Resource design)
        const stickGroup = new THREE.Group();
        const stickBodyGeometry = new THREE.CylinderGeometry(0.0875, 0.0875, 1.05, 6);
        const stickMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD2B48C,
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true
        });
        const stickBody = new THREE.Mesh(stickBodyGeometry, stickMaterial);
        stickBody.rotation.z = Math.PI / 2;
        stickGroup.add(stickBody);
        
        const branchGeometry = new THREE.CylinderGeometry(0.0525, 0.0525, 0.35, 6);
        const branch = new THREE.Mesh(branchGeometry, stickMaterial);
        branch.rotation.z = Math.PI / 4;
        branch.position.set(-0.2625, 0.14, 0);
        stickGroup.add(branch);
        return stickGroup;
        
      case 'axe':
        // Full size axe (matching Resource design)
        const axeGroup = new THREE.Group();
        const handleGeometry = new THREE.BoxGeometry(0.08, 0.6, 0.08);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD2B48C,
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0, 0.3, 0);
        handle.rotation.z = Math.PI / 12;
        axeGroup.add(handle);
        
        const headMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x808080,
          roughness: 0.4,
          metalness: 0.6,
          flatShading: true
        });
        
        const bladeGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.08);
        const blade = new THREE.Mesh(bladeGeometry, headMaterial);
        blade.position.set(0.1, 0.45, 0);
        axeGroup.add(blade);
        
        const pollGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const poll = new THREE.Mesh(pollGeometry, headMaterial);
        poll.position.set(-0.05, 0.45, 0);
        axeGroup.add(poll);
        
        const eyeGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.1);
        const eye = new THREE.Mesh(eyeGeometry, headMaterial);
        eye.position.set(0, 0.45, 0);
        axeGroup.add(eye);
        
        axeGroup.rotation.x = Math.PI / 6; // Tilt the axe
        return axeGroup;
        
      default:
        // Full size default item
        const defaultGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const defaultMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xFFFFFF,
          roughness: 0.7,
          metalness: 0.2
        });
        return new THREE.Mesh(defaultGeometry, defaultMaterial);
    }
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
      const itemType = itemToShow.type;
      const handItemMesh = this.createHandItemModel(itemType);
      if (handItemMesh) {
        handItemMesh.castShadow = true;
        handItemMesh.receiveShadow = true;
        this.handItemGroup.add(handItemMesh);
        this.handItemGroup.visible = true;
        this.currentHandItem = itemType;
        
        // Position hand item based on type
        // Logs are held with 2 hands (centered horizontally, at arm level, slightly forward)
        if (itemType === 'wood') {
          // Position at arm level (Y=0.5), centered horizontally (X=0), slightly forward (Z=0.15)
          // This places it where the character's hands can grip it (arms are at Y=0.5, X=-0.35 and 0.35)
          this.handItemGroup.position.set(0, 0.5, 0.15);
        } else {
          // Other items held in right hand
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

