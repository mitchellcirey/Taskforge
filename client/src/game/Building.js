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
    // Campfire animation properties
    this.flames = [];
    this.smokeParticles = null;
    this.smokeGeometry = null;
    this.smokeMaterial = null;
    this.fireLight = null;
    this.animationTime = 0;
    this.create();
  }

  create() {
    if (this.buildingType === 'storage') {
      this.createStorageContainer();
    } else if (this.buildingType === 'campfire') {
      this.createCampfire();
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

  createCampfire() {
    const campfireGroup = new THREE.Group();
    
    // Scale factor: 2x larger
    const scale = 2.0;
    
    // Fire pit base - stones arranged in a circle
    const stoneColor = 0x696969; // Dim gray
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: stoneColor,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Create 8 stones arranged in a circle (doubled size)
    const stoneCount = 8;
    const pitRadius = 0.35 * scale; // 0.7
    for (let i = 0; i < stoneCount; i++) {
      const angle = (i / stoneCount) * Math.PI * 2;
      const stoneSize = (0.08 + Math.random() * 0.04) * scale; // Vary stone sizes
      const stoneGeometry = new THREE.BoxGeometry(stoneSize, 0.12 * scale, stoneSize);
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      const x = Math.cos(angle) * pitRadius;
      const z = Math.sin(angle) * pitRadius;
      stone.position.set(x, 0.06 * scale, z);
      stone.rotation.y = Math.random() * Math.PI * 2; // Random rotation
      stone.castShadow = true;
      stone.receiveShadow = true;
      campfireGroup.add(stone);
    }
    
    // Logs arranged in the center (doubled size)
    const logColor = 0x4A2C2A; // Dark brown
    const logMaterial = new THREE.MeshStandardMaterial({
      color: logColor,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const logCount = 4;
    const logPositions = [
      { x: -0.1 * scale, z: 0, angle: 0 },
      { x: 0.1 * scale, z: 0, angle: Math.PI / 2 },
      { x: 0, z: -0.1 * scale, angle: Math.PI / 4 },
      { x: 0, z: 0.1 * scale, angle: -Math.PI / 4 }
    ];
    
    for (let i = 0; i < logCount; i++) {
      const logGeometry = new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.15 * scale, 8);
      const log = new THREE.Mesh(logGeometry, logMaterial);
      const pos = logPositions[i];
      log.position.set(pos.x, 0.075 * scale, pos.z);
      log.rotation.z = pos.angle;
      log.rotation.x = Math.PI / 2;
      log.castShadow = true;
      log.receiveShadow = true;
      campfireGroup.add(log);
    }
    
    // Create animated flames (doubled size, positioned higher for visible rising)
    this.flames = [];
    const flameCount = 5;
    const flameBasePositions = [
      { x: -0.08 * scale, z: -0.05 * scale },
      { x: 0.08 * scale, z: -0.05 * scale },
      { x: 0, z: 0 },
      { x: -0.05 * scale, z: 0.08 * scale },
      { x: 0.05 * scale, z: 0.08 * scale }
    ];
    
    for (let i = 0; i < flameCount; i++) {
      // Create flame using a cone geometry (doubled size)
      const flameGeometry = new THREE.ConeGeometry(0.04 * scale, 0.15 * scale, 8);
      const flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6600, // Orange
        emissive: 0xFF4400,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9
      });
      
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      const basePos = flameBasePositions[i] || { x: 0, z: 0 };
      // Start flames higher and make them rise more visibly
      const baseY = 0.3 * scale; // Doubled from 0.15, now 0.6
      flame.position.set(basePos.x, baseY, basePos.z);
      flame.castShadow = false; // Flames don't cast shadows
      flame.receiveShadow = false;
      
      // Store animation properties
      flame.userData = {
        baseY: baseY,
        baseX: basePos.x,
        baseZ: basePos.z,
        phase: Math.random() * Math.PI * 2, // Random phase for variation
        speed: 2 + Math.random() * 2 // Random speed
      };
      
      campfireGroup.add(flame);
      this.flames.push(flame);
    }
    
    // Create smoke particle system (doubled size)
    const smokeParticleCount = 25;
    this.smokeGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(smokeParticleCount * 3);
    const velocities = new Float32Array(smokeParticleCount * 3);
    const lifetimes = new Float32Array(smokeParticleCount);
    const sizes = new Float32Array(smokeParticleCount);
    
    // Initialize particles (doubled positions and velocities)
    for (let i = 0; i < smokeParticleCount; i++) {
      const i3 = i * 3;
      // Start at random positions near fire center (doubled)
      positions[i3] = (Math.random() - 0.5) * 0.2 * scale;
      positions[i3 + 1] = (0.2 + Math.random() * 0.1) * scale;
      positions[i3 + 2] = (Math.random() - 0.5) * 0.2 * scale;
      
      // Random velocities (rising with slight drift, doubled)
      velocities[i3] = (Math.random() - 0.5) * 0.02 * scale;
      velocities[i3 + 1] = (0.3 + Math.random() * 0.2) * scale;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02 * scale;
      
      // Random lifetimes
      lifetimes[i] = Math.random();
      
      // Random sizes (doubled)
      sizes[i] = (0.05 + Math.random() * 0.05) * scale;
    }
    
    this.smokeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.smokeGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    this.smokeGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    this.smokeGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create smoke material (doubled size)
    this.smokeMaterial = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.1 * scale,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });
    
    this.smokeParticles = new THREE.Points(this.smokeGeometry, this.smokeMaterial);
    campfireGroup.add(this.smokeParticles);
    
    // Add flickering point light for fire glow (doubled range)
    this.fireLight = new THREE.PointLight(0xFF6600, 1.5, 5 * scale);
    this.fireLight.position.set(0, 0.2 * scale, 0);
    this.fireLight.castShadow = false; // Point lights can be expensive for shadows
    campfireGroup.add(this.fireLight);
    
    // Set main mesh
    this.mesh = campfireGroup;
    this.mesh.position.set(this.worldX, 0, this.worldZ);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
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

  update(deltaTime) {
    // Only update campfire animations
    if (this.buildingType !== 'campfire') return;
    
    this.animationTime += deltaTime;
    
    // Animate flames
    if (this.flames && this.flames.length > 0) {
      this.flames.forEach((flame, index) => {
        const userData = flame.userData;
        if (!userData) return;
        
        // Oscillate scale (pulsing effect)
        const scaleVariation = 0.2 + 0.1 * Math.sin(this.animationTime * userData.speed + userData.phase);
        flame.scale.set(1 + scaleVariation, 1 + scaleVariation * 1.5, 1 + scaleVariation);
        
        // Flicker position (slight horizontal movement)
        const flickerX = (Math.random() - 0.5) * 0.02;
        const flickerZ = (Math.random() - 0.5) * 0.02;
        // Make flames visibly rise - increased vertical movement
        const riseAmount = 0.15; // Increased from 0.05 to make rising more visible
        const flickerY = riseAmount * Math.sin(this.animationTime * userData.speed * 0.5 + userData.phase);
        // Add a slight upward bias so flames are always rising slightly
        const upwardBias = 0.05 * (1 + Math.sin(this.animationTime * userData.speed * 0.3 + userData.phase));
        flame.position.set(
          userData.baseX + flickerX,
          userData.baseY + flickerY + upwardBias,
          userData.baseZ + flickerZ
        );
        
        // Animate emissive intensity
        const intensity = 0.8 + 0.3 * Math.sin(this.animationTime * userData.speed * 1.5 + userData.phase);
        flame.material.emissiveIntensity = Math.max(0.5, intensity);
      });
    }
    
    // Animate smoke particles
    if (this.smokeParticles && this.smokeGeometry) {
      const positions = this.smokeGeometry.attributes.position;
      const velocities = this.smokeGeometry.attributes.velocity;
      const lifetimes = this.smokeGeometry.attributes.lifetime;
      const sizes = this.smokeGeometry.attributes.size;
      
      if (positions && velocities && lifetimes && sizes) {
        const maxHeight = 3.0 * 2.0; // Max height before recycling (doubled for 2x scale)
        
        for (let i = 0; i < positions.count; i++) {
          const i3 = i * 3;
          
          // Update position based on velocity
          positions.array[i3] += velocities.array[i3] * deltaTime;
          positions.array[i3 + 1] += velocities.array[i3 + 1] * deltaTime;
          positions.array[i3 + 2] += velocities.array[i3 + 2] * deltaTime;
          
          // Update lifetime
          lifetimes.array[i] += deltaTime * 0.5;
          
          // Add slight drift (wind effect)
          positions.array[i3] += (Math.random() - 0.5) * 0.01 * deltaTime;
          positions.array[i3 + 2] += (Math.random() - 0.5) * 0.01 * deltaTime;
          
          // Recycle particles that have risen too high
          if (positions.array[i3 + 1] > maxHeight || lifetimes.array[i] > 1.0) {
            // Reset particle to base position
            positions.array[i3] = (Math.random() - 0.5) * 0.2;
            positions.array[i3 + 1] = 0.2 + Math.random() * 0.1;
            positions.array[i3 + 2] = (Math.random() - 0.5) * 0.2;
            
            // Reset velocity
            velocities.array[i3] = (Math.random() - 0.5) * 0.02;
            velocities.array[i3 + 1] = 0.3 + Math.random() * 0.2;
            velocities.array[i3 + 2] = (Math.random() - 0.5) * 0.02;
            
            // Reset lifetime
            lifetimes.array[i] = 0;
          }
          
          // Update size based on height (grow as it rises)
          const heightRatio = positions.array[i3 + 1] / maxHeight;
          sizes.array[i] = (0.05 + Math.random() * 0.05) * (1 + heightRatio * 2);
        }
        
        // Mark attributes as needing update
        positions.needsUpdate = true;
        sizes.needsUpdate = true;
      }
    }
    
    // Animate fire light intensity (flickering)
    if (this.fireLight) {
      const baseIntensity = 1.5;
      const flicker = 0.3 * Math.sin(this.animationTime * 8) + 0.2 * Math.sin(this.animationTime * 13);
      this.fireLight.intensity = baseIntensity + flicker;
      
      // Slight color variation
      const colorVariation = 0.1 * Math.sin(this.animationTime * 5);
      this.fireLight.color.setRGB(
        Math.min(1, 1.0 + colorVariation),
        Math.min(1, 0.4 + colorVariation * 0.5),
        Math.max(0, 0.0 + colorVariation * 0.3)
      );
    }
  }

  remove() {
    // Clean up flashing animation
    this.stopFlashing();
    
    // Clean up campfire resources
    if (this.buildingType === 'campfire') {
      if (this.smokeGeometry) {
        this.smokeGeometry.dispose();
      }
      if (this.smokeMaterial) {
        this.smokeMaterial.dispose();
      }
      if (this.fireLight) {
        this.scene.remove(this.fireLight);
      }
    }
    
    super.remove();
  }
}


