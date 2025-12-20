import * as THREE from 'three';
import { TileGrid } from './TileGrid.js';
import { CameraController } from './CameraController.js';
import { Player } from './Player.js';
import { InteractionManager } from './InteractionManager.js';
import { Tree } from './Tree.js';
import { Resource } from './Resource.js';
import { Inventory } from './Inventory.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { BuildingManager } from './BuildingManager.js';
import { BuildingPlacementUI } from '../ui/BuildingPlacementUI.js';
import { BuildingUI } from '../ui/BuildingUI.js';
import { CraftingSystem } from './CraftingSystem.js';
import { BlueprintUI } from '../ui/BlueprintUI.js';
import { VillagerManager } from './VillagerManager.js';
import { Terrain } from './Terrain.js';
import { TileHighlighter } from './TileHighlighter.js';
import { DestinationIndicator } from './DestinationIndicator.js';
import { CompassUI } from '../ui/CompassUI.js';

export class SceneManager {
  constructor(container, audioManager = null) {
    this.container = container;
    this.audioManager = audioManager;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.tileGrid = null;
    this.cameraController = null;
    this.player = null;
    this.interactionManager = null;
    this.worldObjects = [];
    this.inventory = null;
    this.inventoryUI = null;
    this.buildingManager = null;
    this.buildingPlacementUI = null;
    this.currentBuildingUI = null;
    this.craftingSystem = null;
    this.blueprintUI = null;
    this.villagerManager = null;
    this.tileHighlighter = null;
    this.destinationIndicator = null;
    this.compassUI = null;
  }

  async init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

    // Create camera (perspective for 3D view)
    const aspect = window.innerWidth / window.innerHeight;
    const fov = 60; // Field of view in degrees
    
    this.camera = new THREE.PerspectiveCamera(
      fov,
      aspect,
      0.1,
      1000
    );
    
    // Camera position will be set by CameraController
    // (which uses Autonauts-style fixed pitch, yaw rotation system)

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 150; // Increased for larger world
    directionalLight.shadow.camera.left = -50; // Increased for larger world
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    this.scene.add(directionalLight);

    // Create larger tile grid (100x100 default)
    this.tileGrid = new TileGrid(this.scene, 100, 100);
    this.tileGrid.create();

    // Create detailed terrain with biomes
    this.terrain = new Terrain(this.scene, 100, 100);
    this.terrain.create();

    // Create tile highlighter
    this.tileHighlighter = new TileHighlighter(this.scene, this.tileGrid);

    // Create player inventory
    this.inventory = new Inventory(20);
    
    // Create player
    this.player = new Player(this.scene, this.tileGrid);
    this.player.inventory = this.inventory;
    this.player.sceneManager = this; // Give player reference to scene manager
    this.player.audioManager = this.audioManager; // Give player reference to audio manager
    // Initialize hand item display
    if (this.player.updateHandItem) {
      this.player.updateHandItem();
    }
    
    // Create destination indicator
    this.destinationIndicator = new DestinationIndicator(this.scene, this.tileGrid);
    this.player.destinationIndicator = this.destinationIndicator;

    // Create inventory UI
    this.inventoryUI = new InventoryUI(this.container, this.inventory);

    // Create building manager
    this.buildingManager = new BuildingManager(this.scene, this.tileGrid, this.player);
    
    // Create building placement UI
    this.buildingPlacementUI = new BuildingPlacementUI(this.container, this.buildingManager, this.player);

    // Create crafting system
    this.craftingSystem = new CraftingSystem();
    this.blueprintUI = new BlueprintUI(this.container, this.craftingSystem, this.player);

    // Create villager manager
    this.villagerManager = new VillagerManager(this.scene, this.tileGrid);

    // Spawn trees (more for larger map, mostly on forest side)
    this.spawnTrees(30);
    
    // Spawn sticks around the map
    this.spawnSticks(20);

    // Initialize interaction manager (pass tileHighlighter reference)
    this.interactionManager = new InteractionManager(
      this.camera,
      this.renderer,
      this.scene,
      this.player,
      this.worldObjects,
      this.buildingManager,
      this,
      this.tileHighlighter
    );

    // Hook tree chop to spawn resources
    this.worldObjects.forEach(obj => {
      if (obj instanceof Tree) {
        const originalChop = obj.chop.bind(obj);
        obj.chop = () => {
          const result = originalChop();
          if (result && result.type) {
            // Spawn resources around tree position
            for (let i = 0; i < result.count; i++) {
              const offsetX = (Math.random() - 0.5) * 0.8;
              const offsetZ = (Math.random() - 0.5) * 0.8;
              this.spawnResource(obj.worldX + offsetX, obj.worldZ + offsetZ, result.type);
            }
          }
        };
      }
    });

    // Initialize camera controller with map bounds
    // Map bounds: 100x100 tiles, each tile is 1 unit, centered at origin
    // World coordinates range from -50 to +50 (approximately -50.5 to 50.5 with edge padding)
    const mapBounds = {
      minX: -50,
      maxX: 50,
      minZ: -50,
      maxZ: 50
    };
    this.cameraController = new CameraController(this.camera, this.renderer.domElement, mapBounds);
    
    // Create compass UI
    this.compassUI = new CompassUI(this.container, this.camera);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Initial render to ensure scene is visible
    if (this.renderer && this.scene && this.camera) {
      // Update matrices before first render
      this.scene.updateMatrixWorld(true);
      this.renderer.render(this.scene, this.camera);
    }
  }

  spawnTrees(count) {
    const attempts = count * 3; // Try more times to find valid positions
    let spawned = 0;

    for (let i = 0; i < attempts && spawned < count; i++) {
      const tileX = Math.floor(Math.random() * this.tileGrid.width);
      const tileZ = Math.floor(Math.random() * this.tileGrid.height);
      const tile = this.tileGrid.tiles[tileX]?.[tileZ];

      if (tile && tile.walkable && !tile.occupied) {
        // Prefer forest side (left side of map)
        const normalizedX = tileX / this.tileGrid.width;
        const normalizedZ = tileZ / this.tileGrid.height;
        const diagonalValue = normalizedX + normalizedZ;
        
        // 70% chance to spawn on forest side, 30% on grass side
        if (diagonalValue < 0.9 || (diagonalValue >= 0.9 && Math.random() < 0.3)) {
          // Vary tree size between 0.7 and 1.3 scale
          const sizeVariation = 0.7 + Math.random() * 0.6;
          const tree = new Tree(this.scene, this.tileGrid, tileX, tileZ, sizeVariation);
          this.worldObjects.push(tree);
          spawned++;
        }
      }
    }
  }

  spawnResource(worldX, worldZ, type, count = 1) {
    const resource = new Resource(this.scene, this.tileGrid, worldX, worldZ, type, count);
    this.worldObjects.push(resource);
    if (this.interactionManager) {
      this.interactionManager.addObject(resource);
    }
    return resource;
  }

  spawnSticks(count) {
    const attempts = count * 3;
    let spawned = 0;

    for (let i = 0; i < attempts && spawned < count; i++) {
      const tileX = Math.floor(Math.random() * this.tileGrid.width);
      const tileZ = Math.floor(Math.random() * this.tileGrid.height);
      const tile = this.tileGrid.tiles[tileX]?.[tileZ];

      if (tile && tile.walkable && !tile.occupied) {
        // Spawn sticks anywhere on the map
        const stick = new Resource(this.scene, this.tileGrid, tile.worldX, tile.worldZ, 'stick');
        this.worldObjects.push(stick);
        spawned++;
      }
    }
  }

  onWindowResize() {
    // Update perspective camera aspect ratio
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(deltaTime) {
    // Update player
    if (this.player) {
      this.player.update(deltaTime);
    }
    
    // Update destination indicator
    if (this.destinationIndicator) {
      this.destinationIndicator.update(deltaTime);
    }

    // Update camera controller
    if (this.cameraController) {
      this.cameraController.update(deltaTime);
    }
    
    // Update compass UI
    if (this.compassUI) {
      this.compassUI.update();
    }

    // Update inventory UI
    if (this.inventoryUI) {
      this.inventoryUI.update();
    }

    // Update building placement preview
    if (this.buildingManager && this.buildingManager.placementMode) {
      const mousePos = this.interactionManager?.getMouseWorldPosition();
      if (mousePos) {
        this.buildingManager.updatePreview(mousePos.x, mousePos.z);
      }
    }

    // Update villagers
    if (this.villagerManager) {
      this.villagerManager.update(deltaTime);
    }

    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

