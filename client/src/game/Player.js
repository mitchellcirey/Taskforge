import * as THREE from 'three';
import { Resource } from './Resource.js';

export class Player {
  constructor(scene, tileGrid) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.mesh = null;
    this.currentTile = null;
    this.targetPosition = null;
    this.path = [];
    this.speed = 6.0; // Increased movement speed
    this.walkAnimationTime = 0; // For walk animation
    this.pendingDropAction = null; // Store drop action when traveling to drop location
    this.isMoving = false;
    this.pickupAnimationTime = 0; // For pickup animation
    this.dropAnimationTime = 0; // For drop animation
    this.isPickingUp = false; // Animation state
    this.isDropping = false; // Animation state
    this.originalY = 0.3; // Store original Y position
    this.originalBodyRotation = 0; // Store original body rotation
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
    const startTile = this.tileGrid.getTileAt(0, 0);
    if (startTile) {
      this.mesh.position.set(startTile.worldX, 0.3, startTile.worldZ);
      this.currentTile = startTile;
    } else {
      this.mesh.position.set(0, 0.3, 0);
    }

    this.scene.add(this.mesh);
  }

  moveTo(worldX, worldZ) {
    const targetTile = this.tileGrid.getTileAt(worldX, worldZ);
    if (!targetTile || !targetTile.walkable) {
      // Hide destination indicator if invalid target
      if (this.destinationIndicator) {
        this.destinationIndicator.hide();
      }
      return false;
    }

    this.targetPosition = { x: worldX, z: worldZ };
    this.path = this.calculatePath(
      this.currentTile.worldX,
      this.currentTile.worldZ,
      worldX,
      worldZ
    );

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

  calculatePath(startX, startZ, endX, endZ) {
    // Simple A* pathfinding
    const startTile = this.tileGrid.getTileAt(startX, startZ);
    const endTile = this.tileGrid.getTileAt(endX, endZ);
    
    if (!startTile || !endTile || !endTile.walkable) return [];

    const openSet = [startTile];
    const closedSet = [];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(startTile, 0);
    fScore.set(startTile, this.heuristic(startTile, endTile));

    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet[0];
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        const score = fScore.get(openSet[i]) || Infinity;
        const currentScore = fScore.get(current) || Infinity;
        if (score < currentScore) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      if (current === endTile) {
        // Reconstruct path
        const path = [];
        let node = endTile;
        while (node) {
          path.unshift(node);
          node = cameFrom.get(node);
        }
        return path;
      }

      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      // Check neighbors
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (closedSet.includes(neighbor) || !neighbor.walkable || neighbor.occupied) {
          continue;
        }

        const currentGScore = gScore.get(current) || Infinity;
        const moveCost = neighbor.moveCost || 1; // Use move cost (1 for cardinal, 1.414 for diagonal)
        const tentativeGScore = currentGScore + moveCost;
        const neighborGScore = gScore.get(neighbor) || Infinity;
        
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= neighborGScore) {
          continue;
        }

        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, endTile));
      }
    }

    return []; // No path found
  }

  getNeighbors(tile) {
    const neighbors = [];
    // 8-directional movement (including diagonals for faster paths)
    const directions = [
      { x: 0, z: -1, cost: 1 },   // North
      { x: 1, z: -1, cost: 1.414 }, // Northeast (diagonal)
      { x: 1, z: 0, cost: 1 },    // East
      { x: 1, z: 1, cost: 1.414 }, // Southeast (diagonal)
      { x: 0, z: 1, cost: 1 },    // South
      { x: -1, z: 1, cost: 1.414 }, // Southwest (diagonal)
      { x: -1, z: 0, cost: 1 },   // West
      { x: -1, z: -1, cost: 1.414 } // Northwest (diagonal)
    ];

    for (const dir of directions) {
      const neighborX = tile.x + dir.x;
      const neighborZ = tile.z + dir.z;
      if (neighborX >= 0 && neighborX < this.tileGrid.width &&
          neighborZ >= 0 && neighborZ < this.tileGrid.height) {
        const neighbor = this.tileGrid.tiles[neighborX][neighborZ];
        if (neighbor && neighbor.walkable && !neighbor.occupied) {
          // For diagonal movement, check that both adjacent cardinal tiles are walkable
          if (dir.cost > 1) {
            // Check the two cardinal directions that form this diagonal
            const card1X = tile.x + dir.x;
            const card1Z = tile.z;
            const card2X = tile.x;
            const card2Z = tile.z + dir.z;
            
            const card1 = this.tileGrid.tiles[card1X]?.[card1Z];
            const card2 = this.tileGrid.tiles[card2X]?.[card2Z];
            
            if (card1 && card1.walkable && !card1.occupied &&
                card2 && card2.walkable && !card2.occupied) {
              neighbor.moveCost = dir.cost;
              neighbors.push(neighbor);
            }
          } else {
            neighbor.moveCost = dir.cost;
            neighbors.push(neighbor);
          }
        }
      }
    }

    return neighbors;
  }

  heuristic(a, b) {
    // Euclidean distance for better diagonal pathfinding
    const dx = Math.abs(a.x - b.x);
    const dz = Math.abs(a.z - b.z);
    // Use diagonal distance (optimal for 8-directional movement)
    return Math.max(dx, dz) + (Math.sqrt(2) - 1) * Math.min(dx, dz);
  }

  update(deltaTime) {
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
        // Reached current waypoint
        this.path.shift();
        if (this.path.length === 0) {
          this.isMoving = false;
          this.currentTile = targetTile;
          this.mesh.position.y = 0.3; // Reset to base position when stopped
          this.walkAnimationTime = 0; // Reset animation
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
        // Move towards waypoint
        const moveDistance = this.speed * deltaTime;
        if (moveDistance >= distance) {
          this.mesh.position.x = targetX;
          this.mesh.position.z = targetZ;
          this.mesh.position.y = 0.3; // Base position (feet at Y=0)
          this.path.shift();
          if (this.path.length === 0) {
            this.isMoving = false;
            this.currentTile = targetTile;
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
    // Create actual size item for the hand
    const scale = 1.0; // Full size items
    
    switch (itemType) {
      case 'wood':
        const woodGeometry = new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 0.5 * scale);
        const woodMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x8B4513,
          roughness: 0.7,
          metalness: 0.2
        });
        return new THREE.Mesh(woodGeometry, woodMaterial);
        
      case 'stone':
        const stoneGeometry = new THREE.BoxGeometry(0.4 * scale, 0.3 * scale, 0.4 * scale);
        const stoneMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x808080,
          roughness: 0.7,
          metalness: 0.2
        });
        return new THREE.Mesh(stoneGeometry, stoneMaterial);
        
      case 'stick':
        const stickGroup = new THREE.Group();
        // 75% bigger sticks
        const stickBodyGeometry = new THREE.CylinderGeometry(0.0875 * scale, 0.0875 * scale, 1.05 * scale, 6);
        const stickMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD2B48C,
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true
        });
        const stickBody = new THREE.Mesh(stickBodyGeometry, stickMaterial);
        stickBody.rotation.z = Math.PI / 2;
        stickGroup.add(stickBody);
        
        const branchGeometry = new THREE.CylinderGeometry(0.0525 * scale, 0.0525 * scale, 0.35 * scale, 6);
        const branch = new THREE.Mesh(branchGeometry, stickMaterial);
        branch.rotation.z = Math.PI / 4;
        branch.position.set(-0.2625 * scale, 0.14 * scale, 0);
        stickGroup.add(branch);
        return stickGroup;
        
      case 'axe':
        const axeGroup = new THREE.Group();
        const handleGeometry = new THREE.BoxGeometry(0.08 * scale, 0.6 * scale, 0.08 * scale);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD2B48C,
          roughness: 0.8,
          metalness: 0.1,
          flatShading: true
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0, 0.3 * scale, 0);
        handle.rotation.z = Math.PI / 12;
        axeGroup.add(handle);
        
        const headMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x808080,
          roughness: 0.4,
          metalness: 0.6,
          flatShading: true
        });
        
        const bladeGeometry = new THREE.BoxGeometry(0.25 * scale, 0.15 * scale, 0.08 * scale);
        const blade = new THREE.Mesh(bladeGeometry, headMaterial);
        blade.position.set(0.1 * scale, 0.45 * scale, 0);
        axeGroup.add(blade);
        
        const pollGeometry = new THREE.BoxGeometry(0.12 * scale, 0.12 * scale, 0.12 * scale);
        const poll = new THREE.Mesh(pollGeometry, headMaterial);
        poll.position.set(-0.05 * scale, 0.45 * scale, 0);
        axeGroup.add(poll);
        
        const eyeGeometry = new THREE.BoxGeometry(0.1 * scale, 0.15 * scale, 0.1 * scale);
        const eye = new THREE.Mesh(eyeGeometry, headMaterial);
        eye.position.set(0, 0.45 * scale, 0);
        axeGroup.add(eye);
        
        axeGroup.rotation.x = Math.PI / 6; // Tilt the axe
        return axeGroup;
        
      default:
        const defaultGeometry = new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 0.3 * scale);
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
    
    // Get the first item in inventory
    const items = this.inventory.getAllItems();
    if (items.length > 0 && items[0].count > 0) {
      const itemType = items[0].type;
      const handItemMesh = this.createHandItemModel(itemType);
      if (handItemMesh) {
        handItemMesh.castShadow = true;
        handItemMesh.receiveShadow = true;
        this.handItemGroup.add(handItemMesh);
        this.handItemGroup.visible = true;
        this.currentHandItem = itemType;
      }
    } else {
      // No items in inventory, hide hand item
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
        // Check if resource is on the same tile OR within interaction range
        const resourceTile = this.tileGrid.getTileAtWorldPosition(obj.worldX, obj.worldZ);
        const sameTile = resourceTile && resourceTile.x === this.currentTile.x && resourceTile.z === this.currentTile.z;
        
        // Also check distance for nearby resources
        const dx = obj.worldX - playerPos.x;
        const dz = obj.worldZ - playerPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const inRange = distance <= (obj.interactionRange || 1.2);
        
        return sameTile || inRange;
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

