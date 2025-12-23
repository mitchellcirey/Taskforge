import * as THREE from 'three';
import { WorldObject } from './WorldObject.js';
import { getItemType } from './ItemTypeRegistry.js';

export class Building extends WorldObject {
  constructor(scene, tileGrid, tileX, tileZ, buildingType) {
    super(scene, tileGrid, tileX, tileZ);
    this.buildingType = buildingType;
    this.isComplete = true;
    this.inventory = null; // For storage buildings
    this.itemIconMesh = null; // For storage item icon display
    this.flashAnimation = null; // For red flashing when full
    this.create();
  }

  create() {
    if (this.buildingType === 'storage') {
      this.createStorageContainer();
    } else {
      // Default building creation
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x8B7355, // Brown
        roughness: 0.8,
        metalness: 0.2
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(this.worldX, 0.5, this.worldZ);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.scene.add(this.mesh);
    }
  }

  createStorageContainer() {
    const containerGroup = new THREE.Group();
    
    // Create isometric wooden crate matching the provided model exactly
    // Warm light tan/yellowish-brown for planks (burlywood/tan color)
    const plankColor = 0xDEB887; // Burlywood - light yellowish-brown
    const plankMaterial = new THREE.MeshStandardMaterial({ 
      color: plankColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    // Darker brown for framing/edges (saddlebrown - rich dark wood)
    const frameColor = 0x8B4513; // Saddlebrown - darker brown
    const frameMaterial = new THREE.MeshStandardMaterial({ 
      color: frameColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    // Crate dimensions - taller container with open top
    const crateWidth = 1.0;  // X dimension
    const crateDepth = 1.0;  // Z dimension
    const crateHeight = 1.2; // Y dimension - taller container (no top lid)
    
    // Plank dimensions
    const plankThickness = 0.02; // Thin gaps between planks
    const plankDepth = 0.08; // How far planks extend from the frame
    
    // Create vertical planks on front face (4 distinct planks)
    const frontPlankCount = 4;
    const totalPlankWidth = crateWidth - 0.12; // Leave space for corner beams
    const plankWidth = (totalPlankWidth - (frontPlankCount - 1) * plankThickness) / frontPlankCount;
    const startX = -totalPlankWidth / 2;
    
    for (let i = 0; i < frontPlankCount; i++) {
      const plankGeometry = new THREE.BoxGeometry(plankWidth, crateHeight, plankDepth);
      const plank = new THREE.Mesh(plankGeometry, plankMaterial);
      const plankX = startX + i * (plankWidth + plankThickness) + plankWidth / 2;
      plank.position.set(plankX, crateHeight / 2, crateDepth / 2 - plankDepth / 2);
      plank.castShadow = true;
      plank.receiveShadow = true;
      containerGroup.add(plank);
    }
    
    // Create vertical planks on back face
    for (let i = 0; i < frontPlankCount; i++) {
      const plankGeometry = new THREE.BoxGeometry(plankWidth, crateHeight, plankDepth);
      const plank = new THREE.Mesh(plankGeometry, plankMaterial);
      const plankX = startX + i * (plankWidth + plankThickness) + plankWidth / 2;
      plank.position.set(plankX, crateHeight / 2, -crateDepth / 2 + plankDepth / 2);
      plank.castShadow = true;
      plank.receiveShadow = true;
      containerGroup.add(plank);
    }
    
    // Create vertical planks on right side (4 distinct planks)
    const sidePlankCount = 4;
    const totalSidePlankWidth = crateDepth - 0.12; // Leave space for corner beams
    const sidePlankWidth = (totalSidePlankWidth - (sidePlankCount - 1) * plankThickness) / sidePlankCount;
    const startZ = -totalSidePlankWidth / 2;
    
    for (let i = 0; i < sidePlankCount; i++) {
      const plankGeometry = new THREE.BoxGeometry(plankDepth, crateHeight, sidePlankWidth);
      const plank = new THREE.Mesh(plankGeometry, plankMaterial);
      const plankZ = startZ + i * (sidePlankWidth + plankThickness) + sidePlankWidth / 2;
      plank.position.set(crateWidth / 2 - plankDepth / 2, crateHeight / 2, plankZ);
      plank.castShadow = true;
      plank.receiveShadow = true;
      containerGroup.add(plank);
    }
    
    // Create vertical planks on left side
    for (let i = 0; i < sidePlankCount; i++) {
      const plankGeometry = new THREE.BoxGeometry(plankDepth, crateHeight, sidePlankWidth);
      const plank = new THREE.Mesh(plankGeometry, plankMaterial);
      const plankZ = startZ + i * (sidePlankWidth + plankThickness) + sidePlankWidth / 2;
      plank.position.set(-crateWidth / 2 + plankDepth / 2, crateHeight / 2, plankZ);
      plank.castShadow = true;
      plank.receiveShadow = true;
      containerGroup.add(plank);
    }
    
    // Vertical corner beams (darker brown framing) - prominent and thick
    const cornerBeamSize = 0.06; // Thick corner beams
    const cornerBeamHeight = crateHeight;
    const cornerPositions = [
      [-crateWidth / 2, crateHeight / 2, -crateDepth / 2],
      [crateWidth / 2, crateHeight / 2, -crateDepth / 2],
      [-crateWidth / 2, crateHeight / 2, crateDepth / 2],
      [crateWidth / 2, crateHeight / 2, crateDepth / 2]
    ];
    
    cornerPositions.forEach(pos => {
      const cornerGeometry = new THREE.BoxGeometry(cornerBeamSize, cornerBeamHeight, cornerBeamSize);
      const corner = new THREE.Mesh(cornerGeometry, frameMaterial);
      corner.position.set(pos[0], pos[1], pos[2]);
      corner.castShadow = true;
      corner.receiveShadow = true;
      containerGroup.add(corner);
    });
    
    // Top frame - continuous dark brown border around top panel (larger for visibility)
    const topFrameThickness = 0.06; // Substantial frame thickness
    const topFrameOuterSize = 0.6; // Outer size of frame - bigger for visibility
    const topFrameInnerSize = 0.5; // Inner size (where panel goes) - bigger for visibility
    const frameWidth = (topFrameOuterSize - topFrameInnerSize) / 2;
    
    // Create frame as a hollow square (4 sides)
    // Top frame - front
    const frameFront = new THREE.Mesh(
      new THREE.BoxGeometry(topFrameOuterSize, topFrameThickness, frameWidth),
      frameMaterial
    );
    frameFront.position.set(0, crateHeight + topFrameThickness / 2, topFrameOuterSize / 2 - frameWidth / 2);
    containerGroup.add(frameFront);
    
    // Top frame - back
    const frameBack = new THREE.Mesh(
      new THREE.BoxGeometry(topFrameOuterSize, topFrameThickness, frameWidth),
      frameMaterial
    );
    frameBack.position.set(0, crateHeight + topFrameThickness / 2, -topFrameOuterSize / 2 + frameWidth / 2);
    containerGroup.add(frameBack);
    
    // Top frame - left
    const frameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth, topFrameThickness, topFrameInnerSize),
      frameMaterial
    );
    frameLeft.position.set(-topFrameOuterSize / 2 + frameWidth / 2, crateHeight + topFrameThickness / 2, 0);
    containerGroup.add(frameLeft);
    
    // Top frame - right
    const frameRight = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth, topFrameThickness, topFrameInnerSize),
      frameMaterial
    );
    frameRight.position.set(topFrameOuterSize / 2 - frameWidth / 2, crateHeight + topFrameThickness / 2, 0);
    containerGroup.add(frameRight);
    
    // Top panel (light-colored square for item icon) - RECESSED (flush or slightly below frame)
    const panelSize = topFrameInnerSize;
    const panelGeometry = new THREE.PlaneGeometry(panelSize, panelSize);
    const panelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xF0F8FF, // Alice blue - very light blue/white
      roughness: 0.5,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const topPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    topPanel.rotation.x = -Math.PI / 2; // Face upward
    // Position panel flush with or slightly below frame level (recessed)
    topPanel.position.set(0, crateHeight + topFrameThickness - 0.001, 0);
    topPanel.receiveShadow = true;
    containerGroup.add(topPanel);
    this.topPanel = topPanel; // Store reference for flashing
    
    this.mesh = containerGroup;
    this.mesh.position.set(this.worldX, 0, this.worldZ);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
    
    // Question mark placeholder (will be replaced by item icon)
    // Create after mesh is set
    this.createQuestionMark();
  }

  createQuestionMark() {
    // Remove existing icon if any
    if (this.itemIconMesh) {
      this.mesh.remove(this.itemIconMesh);
      if (this.itemIconMesh instanceof THREE.Group) {
        this.itemIconMesh.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      } else {
        if (this.itemIconMesh.geometry) this.itemIconMesh.geometry.dispose();
        if (this.itemIconMesh.material) this.itemIconMesh.material.dispose();
      }
    }
    
    // Create a bold, blocky question mark using geometry (pixelated style) - larger for visibility
    const questionGroup = new THREE.Group();
    
    // Add dark background panel behind question mark for contrast (same as item icons)
    const bgSize = 0.25;
    const bgGeometry = new THREE.PlaneGeometry(bgSize, bgSize);
    const bgMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2A2A2A, // Dark gray background for contrast
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.rotation.x = -Math.PI / 2; // Face upward
    background.position.set(0, 0, -0.01); // Slightly below question mark
    questionGroup.add(background);
    
    const questionMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF, // White for high contrast on dark background
      roughness: 0.5,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.3
    });
    
    // Question mark top curve (blocky, composed of segments) - larger
    // Top horizontal segment
    const topSeg1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.01),
      questionMaterial
    );
    topSeg1.position.set(0.03, 0.12, 0.01);
    questionGroup.add(topSeg1);
    
    // Top diagonal segment
    const topSeg2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.06, 0.01),
      questionMaterial
    );
    topSeg2.position.set(0.02, 0.08, 0.01);
    topSeg2.rotation.z = Math.PI / 6;
    questionGroup.add(topSeg2);
    
    // Question mark stem (vertical line) - bold and larger
    const stemGeometry = new THREE.BoxGeometry(0.08, 0.16, 0.01);
    const stem = new THREE.Mesh(stemGeometry, questionMaterial);
    stem.position.set(0, 0.03, 0.01);
    questionGroup.add(stem);
    
    // Question mark dot (bottom) - bold and square, larger
    const dotGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.01);
    const dot = new THREE.Mesh(dotGeometry, questionMaterial);
    dot.position.set(0, -0.06, 0.01);
    questionGroup.add(dot);
    
    // Position question mark on top panel (crate height 1.2 + frame 0.06 - recess 0.001 = 1.259)
    // Make it stand up more like the item icons
    questionGroup.position.set(0, 1.26, 0.02);
    questionGroup.rotation.x = -Math.PI / 3; // Tilt up more for visibility
    
    this.itemIconMesh = questionGroup;
    this.mesh.add(questionGroup);
  }

  createItemIcon(itemType) {
    // Stop flashing if active (will be restarted if needed)
    this.stopFlashing();
    
    // Remove existing icon
    if (this.itemIconMesh) {
      this.mesh.remove(this.itemIconMesh);
      if (this.itemIconMesh instanceof THREE.Group) {
        this.itemIconMesh.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      } else {
        if (this.itemIconMesh.geometry) this.itemIconMesh.geometry.dispose();
        if (this.itemIconMesh.material) this.itemIconMesh.material.dispose();
      }
    }
    
    // Create item icon model (much larger scale for clear visibility)
    const iconGroup = new THREE.Group();
    const scale = 0.5; // Much larger scale for clear visibility
    
    // Add dark background panel behind icon for contrast
    const bgSize = 0.25;
    const bgGeometry = new THREE.PlaneGeometry(bgSize, bgSize);
    const bgMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2A2A2A, // Dark gray background for contrast
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.rotation.x = -Math.PI / 2; // Face upward
    background.position.set(0, 0, -0.01); // Slightly below icon
    iconGroup.add(background);
    
    // Get the item type from the registry
    const itemTypeObj = getItemType(itemType);
    if (itemTypeObj) {
      // Use the item type's getIconModel method
      const iconModel = itemTypeObj.getIconModel(scale);
      iconGroup.add(iconModel);
    } else {
      // Fallback for unknown item types
      const defaultGeometry = new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 0.3 * scale);
      const defaultMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        roughness: 0.7,
        metalness: 0.2
      });
      const defaultIcon = new THREE.Mesh(defaultGeometry, defaultMaterial);
      iconGroup.add(defaultIcon);
    }
    
    // Position icon on top panel (crate height 1.2 + frame 0.06 - recess 0.001 = 1.259)
    // Make icon stand up more vertically for better visibility (not flat)
    iconGroup.position.set(0, 1.26, 0.02);
    iconGroup.rotation.x = -Math.PI / 3; // Tilt up more (60 degrees instead of flat)
    iconGroup.rotation.y = Math.PI / 4; // Slight rotation for better view
    
    this.itemIconMesh = iconGroup;
    this.mesh.add(iconGroup);
  }

  updateItemIcon() {
    if (this.buildingType !== 'storage' || !this.inventory) return;
    
    const storedItemType = this.inventory.getStoredItemType();
    if (storedItemType) {
      this.createItemIcon(storedItemType);
    } else {
      // Show question mark if empty
      this.createQuestionMark();
    }
    
    // Update flashing animation
    this.updateFlashing();
  }

  updateFlashing() {
    if (this.buildingType !== 'storage' || !this.inventory) return;
    
    const isFull = this.inventory.isFull();
    
    if (isFull && !this.flashAnimation) {
      // Start flashing animation
      this.startFlashing();
    } else if (!isFull && this.flashAnimation) {
      // Stop flashing animation
      this.stopFlashing();
    }
  }

  startFlashing() {
    if (this.flashAnimation) return; // Already flashing
    
    // Store original colors if not already stored
    if (!this.originalColors) {
      this.originalColors = new Map();
      if (this.itemIconMesh) {
        if (this.itemIconMesh instanceof THREE.Group) {
          this.itemIconMesh.children.forEach((child, index) => {
            if (child.material) {
              this.originalColors.set(index, {
                color: child.material.color.getHex(),
                emissive: child.material.emissive.getHex()
              });
            }
          });
        } else if (this.itemIconMesh.material) {
          this.originalColors.set(0, {
            color: this.itemIconMesh.material.color.getHex(),
            emissive: this.itemIconMesh.material.emissive.getHex()
          });
        }
      }
    }
    
    let flashState = false;
    this.flashAnimation = setInterval(() => {
      flashState = !flashState;
      
      if (this.itemIconMesh) {
        // Flash the item icon red - change both color and emissive for visibility
        if (this.itemIconMesh instanceof THREE.Group) {
          this.itemIconMesh.children.forEach((child, index) => {
            if (child.material) {
              if (flashState) {
                // Flash red - change color to red and add strong emissive
                child.material.color.setHex(0xFF0000);
                child.material.emissive.setHex(0xFF0000);
                child.material.emissiveIntensity = 1.0;
              } else {
                // Restore original
                const original = this.originalColors.get(index);
                if (original) {
                  child.material.color.setHex(original.color);
                  child.material.emissive.setHex(original.emissive);
                  child.material.emissiveIntensity = 0.0;
                }
              }
            }
          });
        } else if (this.itemIconMesh.material) {
          if (flashState) {
            // Flash red - change color to red and add strong emissive
            this.itemIconMesh.material.color.setHex(0xFF0000);
            this.itemIconMesh.material.emissive.setHex(0xFF0000);
            this.itemIconMesh.material.emissiveIntensity = 1.0;
          } else {
            const original = this.originalColors.get(0);
            if (original) {
              this.itemIconMesh.material.color.setHex(original.color);
              this.itemIconMesh.material.emissive.setHex(original.emissive);
              this.itemIconMesh.material.emissiveIntensity = 0.0;
            }
          }
        }
      }
    }, 500); // Flash every 500ms
  }

  stopFlashing() {
    if (this.flashAnimation) {
      clearInterval(this.flashAnimation);
      this.flashAnimation = null;
      
      // Reset item icon to original colors
      if (this.itemIconMesh && this.originalColors) {
        if (this.itemIconMesh instanceof THREE.Group) {
          this.itemIconMesh.children.forEach((child, index) => {
            if (child.material) {
              const original = this.originalColors.get(index);
              if (original) {
                child.material.color.setHex(original.color);
                child.material.emissive.setHex(original.emissive);
                child.material.emissiveIntensity = 0.0;
              }
            }
          });
        } else if (this.itemIconMesh.material) {
          const original = this.originalColors.get(0);
          if (original) {
            this.itemIconMesh.material.color.setHex(original.color);
            this.itemIconMesh.material.emissive.setHex(original.emissive);
            this.itemIconMesh.material.emissiveIntensity = 0.0;
          }
        }
      }
      this.originalColors = null; // Clear stored colors
    }
  }

  interact(player) {
    // For storage containers, left click withdraws items
    if (this.buildingType === 'storage' && this.inventory && player && player.inventory) {
      const storedItemType = this.inventory.getStoredItemType();
      if (storedItemType) {
        // Withdraw 1 item
        if (this.inventory.removeItem(storedItemType, 1)) {
          player.inventory.addItem(storedItemType, 1);
          this.updateItemIcon();
          return true;
        }
      }
    }
    return false;
  }

  depositItem(itemType, count = 1) {
    // Right click deposits items
    if (this.buildingType === 'storage' && this.inventory) {
      if (this.inventory.addItem(itemType, count)) {
        this.updateItemIcon();
        return true;
      }
    }
    return false;
  }

  getType() {
    return this.buildingType;
  }

  remove() {
    // Clean up flashing animation
    this.stopFlashing();
    super.remove();
  }
}


