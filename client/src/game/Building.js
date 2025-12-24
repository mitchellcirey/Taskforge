import * as THREE from 'three';
import { WorldObject } from './WorldObject.js';
import { getItemType } from './ItemTypeRegistry.js';
import { BuildingTypes, getBuildingType } from './BuildingTypes.js';
import { StorageInventory } from './StorageInventory.js';

export class Building extends WorldObject {
  constructor(scene, tileGrid, tileX, tileZ, buildingType, isBlueprint = false) {
    super(scene, tileGrid, tileX, tileZ);
    this.buildingType = buildingType;
    this.isBlueprint = isBlueprint;
    this.isComplete = !isBlueprint; // Blueprints are not complete until resources are added
    this.inventory = null; // For storage buildings
    this.itemIconMesh = null; // For storage item icon display
    this.flashAnimation = null; // For red flashing when full
    
    // Blueprint resource tracking
    this.requiredResources = null; // Will be set from BuildingTypes
    this.addedResources = {}; // Tracks progress: { stick: 0, stone: 0, ... }
    this.progressText = null; // THREE.Sprite for progress display
    this.progressCanvas = null; // Canvas for progress text
    this.blueprintAnimationTime = 0; // For pulsing animation
    
    this.create();
  }

  create() {
    if (this.isBlueprint) {
      this.createBlueprintVisual();
    } else {
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
  }

  createBlueprintVisual() {
    // Get building type info
    const type = getBuildingType(this.buildingType);
    
    if (!type) {
      console.error(`Unknown building type: ${this.buildingType}`);
      return;
    }
    
    // Store required resources
    this.requiredResources = { ...type.cost };
    
    // Initialize added resources
    for (const resourceType of Object.keys(this.requiredResources)) {
      this.addedResources[resourceType] = 0;
    }
    
    // Create glowing outline/holographic effect
    const blueprintGroup = new THREE.Group();
    
    // Get building size
    const width = type.size.width;
    const height = type.size.height;
    const tileSize = this.tileGrid.tileSize;
    
    // Create wireframe outline box
    const geometry = new THREE.BoxGeometry(
      width * tileSize * 0.95,
      1.0,
      height * tileSize * 0.95
    );
    
    // Create glowing material with pulse effect
    const material = new THREE.MeshStandardMaterial({
      color: 0x00FFFF, // Cyan for holographic look
      emissive: 0x00FFFF,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
      wireframe: false,
      side: THREE.DoubleSide
    });
    
    // Main outline box
    const outline = new THREE.Mesh(geometry, material);
    outline.position.y = 0.5;
    blueprintGroup.add(outline);
    
    // Add edge lines for better visibility
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00FFFF,
      linewidth: 2
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    edgeLines.position.y = 0.5;
    blueprintGroup.add(edgeLines);
    
    // Position at tile center
    blueprintGroup.position.set(this.worldX, 0, this.worldZ);
    this.mesh = blueprintGroup;
    this.scene.add(this.mesh);
    
    // Create progress text display
    this.createProgressDisplay();
  }

  createProgressDisplay() {
    // Create a simple text display using canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    this.progressCanvas = canvas;
    const context = canvas.getContext('2d');
    
    this.updateProgressText(context);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);
    sprite.position.set(0, 2, 0);
    
    this.progressText = sprite;
    this.mesh.add(sprite);
  }

  updateProgressText(context) {
    if (!context || !this.requiredResources) return;
    
    // Clear canvas
    context.clearRect(0, 0, 256, 128);
    
    // White background with transparency
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, 256, 128);
    
    // White text
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 20px Arial';
    context.textAlign = 'center';
    
    // Display progress for each resource
    let y = 25;
    const lines = [];
    for (const [resourceType, required] of Object.entries(this.requiredResources)) {
      const added = this.addedResources[resourceType] || 0;
      lines.push(`${added}/${required} ${resourceType}`);
    }
    
    // Draw all lines
    lines.forEach((line, index) => {
      context.fillText(line, 128, 25 + index * 25);
    });
    
    // Update texture if sprite exists
    if (this.progressText && this.progressText.material.map) {
      this.progressText.material.map.needsUpdate = true;
    }
  }

  addResource(itemType, count = 1) {
    if (!this.isBlueprint || !this.requiredResources) {
      return false;
    }
    
    // Check if this resource type is needed
    if (!this.requiredResources.hasOwnProperty(itemType)) {
      return false;
    }
    
    // Check if we already have enough
    const current = this.addedResources[itemType] || 0;
    const required = this.requiredResources[itemType];
    
    if (current >= required) {
      return false; // Already have enough
    }
    
    // Add resource
    this.addedResources[itemType] = Math.min(current + count, required);
    
    // Update progress display
    if (this.progressCanvas) {
      const context = this.progressCanvas.getContext('2d');
      this.updateProgressText(context);
    }
    
    // Check if complete
    this.checkCompletion();
    
    return true;
  }

  checkCompletion() {
    if (!this.isBlueprint || !this.requiredResources) {
      return false;
    }
    
    // Check if all resources are added
    for (const [resourceType, required] of Object.entries(this.requiredResources)) {
      const added = this.addedResources[resourceType] || 0;
      if (added < required) {
        return false; // Still missing resources
      }
    }
    
    // All resources added - complete the building
    this.complete();
    return true;
  }

  updateBlueprintAnimation(deltaTime) {
    if (!this.isBlueprint || !this.mesh) return;
    
    // Safety check for deltaTime
    if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0) {
      return;
    }
    
    // Accumulate animation time
    this.blueprintAnimationTime += deltaTime;
    
    // Pulse effect - animate emissive intensity
    const pulseSpeed = 2.0; // Pulses per second
    const pulsePhase = this.blueprintAnimationTime * pulseSpeed * Math.PI * 2;
    const intensity = 0.6 + Math.sin(pulsePhase) * 0.3; // Pulse between 0.3 and 0.9
    
    // Update materials in the blueprint mesh
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        if (child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = intensity;
        }
        // Also pulse opacity slightly
        if (child.material.opacity !== undefined) {
          child.material.opacity = 0.5 + Math.sin(pulsePhase) * 0.2;
        }
      }
    });
  }

  complete() {
    if (!this.isBlueprint) {
      return;
    }
    
    // Clean up blueprint visual
    if (this.mesh) {
      // Dispose of progress text texture
      if (this.progressText && this.progressText.material) {
        if (this.progressText.material.map) {
          this.progressText.material.map.dispose();
        }
        this.progressText.material.dispose();
      }
      this.scene.remove(this.mesh);
    }
    
    // Clear blueprint references
    this.progressText = null;
    this.progressCanvas = null;
    
    // Mark as complete
    this.isBlueprint = false;
    this.isComplete = true;
    
    // Create the actual building
    this.create();
    
    // Customize based on type
    if (this.buildingType === 'storage') {
      this.inventory = new StorageInventory(16);
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
    
    // Stone material - grey with flat shading for low-poly look
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080, // Grey
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    
    // Wood material - brown for logs and sticks
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Saddlebrown
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    // Create stone ring - 8-10 irregular rounded stones
    const stoneCount = 9;
    const stoneRingRadius = 0.35; // Radius of the stone circle
    for (let i = 0; i < stoneCount; i++) {
      const angle = (i / stoneCount) * Math.PI * 2;
      // Vary stone sizes for irregularity
      const sizeVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const stoneRadius = 0.08 * sizeVariation;
      const stoneHeight = 0.12 * sizeVariation;
      
      // Create rounded stone using cylinder with fewer segments for low-poly look
      const stoneGeometry = new THREE.CylinderGeometry(
        stoneRadius * 0.9, // Slight taper
        stoneRadius,
        stoneHeight,
        6 // Low poly
      );
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      
      // Position in circle with slight random offset for irregularity
      const offset = (Math.random() - 0.5) * 0.05;
      const x = Math.cos(angle) * (stoneRingRadius + offset);
      const z = Math.sin(angle) * (stoneRingRadius + offset);
      stone.position.set(x, stoneHeight / 2, z);
      
      // Slight random rotation for more natural look
      stone.rotation.y = Math.random() * Math.PI * 2;
      stone.rotation.x = (Math.random() - 0.5) * 0.3;
      stone.rotation.z = (Math.random() - 0.5) * 0.3;
      
      stone.castShadow = true;
      stone.receiveShadow = true;
      campfireGroup.add(stone);
    }
    
    // Create horizontal logs - 3-4 cylindrical logs
    const logCount = 4;
    const logRadius = 0.06;
    const logLength = 0.5;
    const logBaseHeight = 0.08; // Base height for logs
    
    for (let i = 0; i < logCount; i++) {
      const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 6);
      const log = new THREE.Mesh(logGeometry, woodMaterial);
      
      // Stack logs with slight offset and rotation
      const angle = (i / logCount) * Math.PI * 2;
      const offsetX = (Math.random() - 0.5) * 0.15;
      const offsetZ = (Math.random() - 0.5) * 0.15;
      const logY = logBaseHeight + (i * 0.03); // Slight stacking
      
      log.position.set(offsetX, logY, offsetZ);
      // Rotate to be horizontal
      log.rotation.z = Math.PI / 2;
      // Add some random rotation for natural placement
      log.rotation.y = angle + (Math.random() - 0.5) * 0.5;
      log.rotation.x = (Math.random() - 0.5) * 0.3;
      
      log.castShadow = true;
      log.receiveShadow = true;
      campfireGroup.add(log);
    }
    
    // Create flames - multiple animated flame meshes
    const flameGroup = new THREE.Group();
    const flameCount = 5;
    this.flameMeshes = [];
    
    for (let i = 0; i < flameCount; i++) {
      // Create irregular flame shape using cone geometry
      const flameHeight = (0.15 + Math.random() * 0.1) * 2; // Doubled
      const flameBaseRadius = (0.03 + Math.random() * 0.02) * 2; // Doubled
      const flameTopRadius = (0.01 + Math.random() * 0.01) * 2; // Doubled
      
      const flameGeometry = new THREE.ConeGeometry(
        flameBaseRadius,
        flameHeight,
        6 // Low poly
      );
      
      // Flame material with emissive glow - yellow to orange gradient
      const flameColor = new THREE.Color().lerpColors(
        new THREE.Color(0xFFFF00), // Yellow
        new THREE.Color(0xFF6600), // Orange
        i / flameCount
      );
      
      const flameMaterial = new THREE.MeshStandardMaterial({
        color: flameColor,
        emissive: flameColor,
        emissiveIntensity: 1.5,
        roughness: 0.5,
        metalness: 0.0
      });
      
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      
      // Position flames at center with slight variation
      const offsetX = (Math.random() - 0.5) * 0.1;
      const offsetZ = (Math.random() - 0.5) * 0.1;
      const baseY = 0.15;
      flame.position.set(offsetX, baseY + flameHeight / 2, offsetZ);
      
      // Store for animation
      this.flameMeshes.push({
        mesh: flame,
        baseY: baseY,
        height: flameHeight,
        offsetX: offsetX,
        offsetZ: offsetZ,
        material: flameMaterial,
        originalColor: flameColor.clone()
      });
      
      flameGroup.add(flame);
    }
    campfireGroup.add(flameGroup);
    this.flameGroup = flameGroup;
    
    // Add point light for warm glow
    const fireLight = new THREE.PointLight(0xFF6600, 1.5, 3);
    fireLight.position.set(0, 0.3, 0);
    fireLight.castShadow = false;
    campfireGroup.add(fireLight);
    this.fireLight = fireLight;
    
    // Create smoke particles - 4 smoke particles
    const smokeGroup = new THREE.Group();
    const smokeCount = 4;
    this.smokeParticles = [];
    
    for (let i = 0; i < smokeCount; i++) {
      // Create smoke using transparent cylinder/billboard
      const smokeSize = 0.08;
      const smokeGeometry = new THREE.CylinderGeometry(
        smokeSize * 0.6,
        smokeSize,
        0.2,
        6
      );
      
      const smokeMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666, // Grey
        emissive: 0x333333,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.6,
        roughness: 0.8,
        metalness: 0.0
      });
      
      const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      
      // Position at flame center initially
      smoke.position.set(0, 0.4, 0);
      
      // Initialize first particle as visible, others start hidden
      const startVisible = i === 0;
      smoke.visible = startVisible;
      
      // Store for animation
      this.smokeParticles.push({
        mesh: smoke,
        material: smokeMaterial,
        startY: 0.4,
        currentY: 0.4,
        age: startVisible ? Math.random() * 2 : 0, // First particle starts at random age
        lifetime: 3 + Math.random() * 2, // 3-5 second lifetime
        driftX: (Math.random() - 0.5) * 0.05,
        driftZ: (Math.random() - 0.5) * 0.05
      });
      
      smokeGroup.add(smoke);
    }
    campfireGroup.add(smokeGroup);
    this.smokeGroup = smokeGroup;
    
    // Initialize animation state
    this.animationTime = 0;
    this.smokeSpawnTimer = 0;
    this.smokeSpawnInterval = 0.8; // Spawn new smoke every 0.8 seconds
    
    // Position campfire group at tile center, ground level
    campfireGroup.position.set(this.worldX, 0, this.worldZ);
    this.mesh = campfireGroup;
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
    // Update blueprint animations
    if (this.isBlueprint) {
      this.updateBlueprintAnimation(deltaTime);
      return;
    }
    
    // Only update campfire animations
    if (this.buildingType !== 'campfire') return;
    
    // Safety check for deltaTime
    if (!deltaTime || isNaN(deltaTime) || deltaTime <= 0) {
      return;
    }
    
    if (!this.flameMeshes || !this.smokeParticles) return;
    
    // Initialize animation state if not already initialized
    if (this.animationTime === undefined) {
      this.animationTime = 0;
    }
    if (this.smokeSpawnTimer === undefined) {
      this.smokeSpawnTimer = 0;
    }
    if (this.smokeSpawnInterval === undefined) {
      this.smokeSpawnInterval = 0.8;
    }
    
    // Accumulate animation time
    this.animationTime += deltaTime;
    this.smokeSpawnTimer += deltaTime;
    
    // Animate flames - flickering and movement
    const flickerRate = 2.5; // Hz (flickers per second)
    const flickerPhase = this.animationTime * flickerRate * Math.PI * 2;
    
    this.flameMeshes.forEach((flameData, index) => {
      if (!flameData || !flameData.mesh || !flameData.material) return;
      
      const flame = flameData.mesh;
      const material = flameData.material;
      const phaseOffset = index * 0.5; // Offset each flame slightly
      const phase = flickerPhase + phaseOffset;
      
      // Vertical oscillation (rising/falling)
      const verticalOffset = Math.sin(phase) * 0.03;
      if (flameData.baseY !== undefined && flameData.height !== undefined) {
        flame.position.y = flameData.baseY + flameData.height / 2 + verticalOffset;
      }
      
      // Scale variation (flickering)
      const scaleVariation = 0.85 + Math.sin(phase * 1.3) * 0.15;
      flame.scale.set(scaleVariation, 1.0 + Math.sin(phase * 0.7) * 0.2, scaleVariation);
      
      // Slight horizontal drift
      const driftPhase = this.animationTime * 0.5 + phaseOffset;
      if (flameData.offsetX !== undefined && flameData.offsetZ !== undefined) {
        flame.position.x = flameData.offsetX + Math.sin(driftPhase) * 0.02;
        flame.position.z = flameData.offsetZ + Math.cos(driftPhase) * 0.02;
      }
      
      // Emissive intensity pulsing
      const intensityVariation = 1.2 + Math.sin(phase * 1.5) * 0.3;
      material.emissiveIntensity = intensityVariation;
      
      // Slight color variation
      if (flameData.originalColor) {
        const colorIntensity = 0.9 + Math.sin(phase * 1.1) * 0.1;
        material.emissive.copy(flameData.originalColor).multiplyScalar(colorIntensity);
      }
    });
    
    // Animate fire light intensity
    if (this.fireLight) {
      const lightIntensity = 1.2 + Math.sin(flickerPhase) * 0.3;
      this.fireLight.intensity = lightIntensity;
    }
    
    // Spawn new smoke when timer reaches interval (check once per frame)
    if (this.smokeSpawnTimer >= this.smokeSpawnInterval) {
      // Find an inactive particle to activate
      const inactiveParticles = this.smokeParticles.filter(p => !p.mesh.visible);
      if (inactiveParticles.length > 0) {
        const particle = inactiveParticles[0];
        particle.age = 0;
        particle.currentY = particle.startY;
        particle.mesh.position.set(
          (Math.random() - 0.5) * 0.1,
          particle.startY,
          (Math.random() - 0.5) * 0.1
        );
        particle.mesh.visible = true;
        particle.material.opacity = 0.6;
        particle.mesh.scale.set(1, 1, 1);
        particle.driftX = (Math.random() - 0.5) * 0.05;
        particle.driftZ = (Math.random() - 0.5) * 0.05;
        this.smokeSpawnTimer = 0; // Reset timer after spawning
      }
    }
    
    // Update smoke particles
    this.smokeParticles.forEach((smokeData) => {
      if (!smokeData || !smokeData.mesh || !smokeData.material) return;
      
      if (smokeData.age === undefined) smokeData.age = 0;
      if (smokeData.lifetime === undefined) smokeData.lifetime = 3;
      
      smokeData.age += deltaTime;
      
      // Check if particle should be active
      if (smokeData.age >= smokeData.lifetime) {
        // Reset particle
        smokeData.age = 0;
        if (smokeData.startY !== undefined) {
          smokeData.currentY = smokeData.startY;
        }
        smokeData.material.opacity = 0.6;
        smokeData.mesh.scale.set(1, 1, 1);
        smokeData.mesh.visible = false;
        return; // Skip animation for this particle
      }
      
      // Animate active smoke particles
      if (smokeData.mesh.visible && smokeData.age < smokeData.lifetime) {
        const lifeProgress = smokeData.age / smokeData.lifetime;
        
        // Continuous upward movement
        if (smokeData.currentY === undefined) smokeData.currentY = smokeData.startY || 0.4;
        smokeData.currentY += deltaTime * 0.4; // Rise speed
        smokeData.mesh.position.y = smokeData.currentY;
        
        // Horizontal drift
        if (smokeData.driftX !== undefined) {
          smokeData.mesh.position.x += smokeData.driftX * deltaTime;
        }
        if (smokeData.driftZ !== undefined) {
          smokeData.mesh.position.z += smokeData.driftZ * deltaTime;
        }
        
        // Scale increase (expansion)
        const scaleMultiplier = 1 + lifeProgress * 2.5; // Expand up to 3.5x
        smokeData.mesh.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
        
        // Opacity fade-out
        smokeData.material.opacity = 0.6 * (1 - lifeProgress);
        
        // Slight rotation
        smokeData.mesh.rotation.y += deltaTime * 0.5;
      }
    });
  }

  remove() {
    // Clean up flashing animation
    this.stopFlashing();
    super.remove();
  }
}


