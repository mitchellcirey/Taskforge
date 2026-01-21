import * as THREE from 'three';
import { TileGrid } from './TileGrid.js';
import { CameraController } from './CameraController.js';
import { Player } from './Player.js';
import { InteractionManager } from './InteractionManager.js';
import { Tree } from './Tree.js';
import { Resource } from './Resource.js';
import { Inventory } from './Inventory.js';
import { HarvestResult } from './HarvestResult.js';
import { HotbarUI } from '../ui/HotbarUI.js';
import { BuildingManager } from './BuildingManager.js';
import { BuildingMenu } from '../ui/BuildingMenu.js';
import { BuildingUI } from '../ui/BuildingUI.js';
import { CraftingSystem } from './CraftingSystem.js';
import { VillagerManager } from './VillagerManager.js';
import { Terrain } from './Terrain.js';
import { TileHighlighter } from './TileHighlighter.js';
import { DestinationIndicator } from './DestinationIndicator.js';
import { CompassUI } from '../ui/CompassUI.js';
import { Program } from './programming/Program.js';
import { DayNightCycle } from './DayNightCycle.js';
import { GrassManager } from './GrassManager.js';
import { WeatherManager } from './WeatherManager.js';

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
    this.hotbarUI = null;
    this.buildingManager = null;
    this.buildingMenu = null;
    this.currentBuildingUI = null;
    this.craftingSystem = null;
    this.villagerManager = null;
    this.tileHighlighter = null;
    this.destinationIndicator = null;
    this.compassUI = null;
    this.dayNightCycle = null;
    this.ambientLight = null;
    this.directionalLight = null;
    this.grassManager = null;
    this.weatherManager = null;
  }

  async init(progressCallback = null, seed = null) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const reportProgress = async (message, percentage, waitMs = 400) => {
      if (progressCallback) {
        progressCallback(message, percentage);
      }
      // Allow UI to update before continuing
      await new Promise(resolve => requestAnimationFrame(resolve));
      await delay(waitMs);
    };

    // Step 1: Creating scene and camera (5%)
    await reportProgress('Initializing scene...', 5, 300);
    this.scene = new THREE.Scene();
    // Background will be handled by DayNightCycle sky sphere

    // Create camera (perspective for 3D view)
    await reportProgress('Setting up camera...', 10, 300);
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

    // Step 2: Creating renderer (15%)
    await reportProgress('Creating renderer...', 15, 350);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Step 3: Setting up lighting (15%)
    await reportProgress('Setting up lighting...', 20, 300);
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500; // For 200x200 tile world
    this.directionalLight.shadow.camera.left = -200; // For 200x200 tile world
    this.directionalLight.shadow.camera.right = 200;
    this.directionalLight.shadow.camera.top = 200;
    this.directionalLight.shadow.camera.bottom = -200;
    this.scene.add(this.directionalLight);

    // Initialize day/night cycle system
    await reportProgress('Setting up day/night cycle...', 22, 300);
    this.dayNightCycle = new DayNightCycle(this.scene, this.ambientLight, this.directionalLight);
    
    // Initialize weather system
    await reportProgress('Setting up weather system...', 23, 300);
    this.weatherManager = new WeatherManager(this.scene, this.audioManager);

    // Step 4: Creating tile grid (20%)
    await reportProgress('Creating tile grid...', 30, 400);
    // Map size - 200x200 tiles
    // Use provided seed or generate random one
    this.tileGrid = new TileGrid(this.scene, 200, 200, seed);
    this.tileGrid.create();
    
    await reportProgress('Preloading tile chunks...', 35, 300);
    if (this.tileGrid.preloadAllChunks) {
      this.tileGrid.preloadAllChunks();
    }

    // Step 5: Creating terrain (30%)
    await reportProgress('Generating terrain...', 40, 500);
    this.terrain = new Terrain(this.scene, this.tileGrid, 200, 200);
    this.terrain.create();

    // Create grass manager and spawn grass patches
    // DISABLED: Grass patches temporarily disabled
    // this.grassManager = new GrassManager(this.scene, this.tileGrid);
    // this.grassManager.spawnGrassPatches();

    // Create tile highlighter
    this.tileHighlighter = new TileHighlighter(this.scene, this.tileGrid);

    // Step 6: Creating player (40%)
    await reportProgress('Creating player...', 50, 400);
    // Create player inventory (max 4 items in slots 3-6)
    this.inventory = new Inventory(4);
    
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

    // Step 7: Creating UI elements (50%)
    await reportProgress('Setting up UI...', 60, 400);
    // Create hotbar UI
    this.hotbarUI = new HotbarUI(this.container, this.inventory);

    // Step 8: Creating managers (60%)
    await reportProgress('Initializing systems...', 70, 450);
    // Create building manager
    this.buildingManager = new BuildingManager(this.scene, this.tileGrid, this.player);

    // Create crafting system
    this.craftingSystem = new CraftingSystem();

    // Create villager manager
    this.villagerManager = new VillagerManager(this.scene, this.tileGrid);

    // Create unified building menu (replaces BuildingPlacementUI and BlueprintUI)
    this.buildingMenu = new BuildingMenu(
      this.container,
      this.buildingManager,
      this.player,
      this.craftingSystem,
      this.villagerManager
    );

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

    // Initialize camera controller with map bounds
    // Map bounds: 200x200 tiles, each tile is 2 units, centered at origin
    // World coordinates range from -200 to +200 (200 tiles * 2 units = 400 units total)
    const mapBounds = {
      minX: -200,
      maxX: 200,
      minZ: -200,
      maxZ: 200
    };
    this.cameraController = new CameraController(this.camera, this.renderer.domElement, mapBounds, this.player);
    
    // Create compass UI
    this.compassUI = new CompassUI(this.container, this.camera);

    // Step 9: Spawning world objects (80%)
    await reportProgress('Spawning world objects...', 80, 500);
    // Spawn trees (more for larger 500x500 map - denser distribution)
    this.spawnTrees(400);
    
    // Spawn sticks around the map (doubled amount)
    this.spawnSticks(300);
    
    // Spawn stones around the map (on any walkable tile)
    this.spawnStones(300);

    // Hook harvestable objects to process harvest results
    this.worldObjects.forEach(obj => {
      if (obj.harvest && typeof obj.harvest === 'function') {
        const originalHarvest = obj.harvest.bind(obj);
        obj.harvest = () => {
          const results = originalHarvest();
          if (results && Array.isArray(results)) {
            this.processHarvestResults(obj, results);
          }
          return results;
        };
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Step 10: Finalizing setup (100%)
    await reportProgress('Finalizing...', 90, 300);
    // Initial render to ensure scene is visible
    if (this.renderer && this.scene && this.camera) {
      // Update matrices before first render
      this.scene.updateMatrixWorld(true);
      this.renderer.render(this.scene, this.camera);
    }
    
    // Final progress update
    await reportProgress('Complete!', 100, 200);
  }

  spawnTrees(count) {
    const attempts = count * 30; // Try more times since we're only looking for dirt tiles
    let spawned = 0;

    for (let i = 0; i < attempts && spawned < count; i++) {
      const tileX = Math.floor(Math.random() * this.tileGrid.width);
      const tileZ = Math.floor(Math.random() * this.tileGrid.height);
      const tile = this.tileGrid.getTile(tileX, tileZ);

      // Trees ONLY spawn on dirt tiles (no conversion)
      if (tile && tile.walkable && !tile.occupied && tile.type === 'dirt') {
        // Vary tree size between 0.7 and 1.3 scale
        const sizeVariation = 0.7 + Math.random() * 0.6;
        const tree = new Tree(this.scene, this.tileGrid, tileX, tileZ, sizeVariation);
        this.worldObjects.push(tree);
        if (this.interactionManager) {
          this.interactionManager.addObject(tree);
        }
        spawned++;
      }
    }
    
    console.log(`Spawned ${spawned} trees out of ${count} requested`);
  }

  spawnResource(worldX, worldZ, type, count = 1) {
    // Check if tile already has content to prevent duplicates
    const { tileX, tileZ } = this.tileGrid.worldToTile(worldX, worldZ);
    const tile = this.tileGrid.getTile(tileX, tileZ);
    
    if (tile && tile.content) {
      // Tile already has content, don't spawn another resource
      return null;
    }
    
    const resource = new Resource(this.scene, this.tileGrid, worldX, worldZ, type, count);
    this.worldObjects.push(resource);
    if (this.interactionManager) {
      this.interactionManager.addObject(resource);
    }
    return resource;
  }

  /**
   * Processes harvest results from a harvested object.
   * Handles both world drops and inventory additions.
   * @param {WorldObject} harvestedObject - The object that was harvested
   * @param {HarvestResult[]} results - Array of harvest results
   */
  processHarvestResults(harvestedObject, results) {
    if (!results || !Array.isArray(results)) return;

    const objectTilePos = harvestedObject.getTilePosition();
    if (!objectTilePos) return;

    for (const result of results) {
      if (!(result instanceof HarvestResult)) continue;

      if (result.dropToWorld) {
        // Drop to world - spawn resources on nearby tiles
        for (let i = 0; i < result.count; i++) {
          // Find a nearby tile (within 1 tile radius)
          const offsetX = Math.floor((Math.random() - 0.5) * 3); // -1, 0, or 1
          const offsetZ = Math.floor((Math.random() - 0.5) * 3); // -1, 0, or 1
          const nearbyTile = this.tileGrid.getTile(objectTilePos.tileX + offsetX, objectTilePos.tileZ + offsetZ);
          if (nearbyTile && nearbyTile.walkable && !nearbyTile.content) {
            // Spawn at tile center - Resource constructor will center it on the tile
            this.spawnResource(nearbyTile.worldX, nearbyTile.worldZ, result.itemType);
          } else {
            // Fallback to object's tile if nearby tile is invalid
            const objectTile = this.tileGrid.getTile(objectTilePos.tileX, objectTilePos.tileZ);
            if (objectTile && !objectTile.content) {
              this.spawnResource(objectTile.worldX, objectTile.worldZ, result.itemType);
            }
          }
        }
      } else {
        // Add to player inventory
        if (this.player && this.player.inventory) {
          const itemsNotAdded = [];
          for (let i = 0; i < result.count; i++) {
            if (!this.player.inventory.addItem(result.itemType, 1)) {
              // If item couldn't be added (inventory restrictions, full, etc.), drop to world instead
              itemsNotAdded.push(i);
            }
          }
          
          // Drop any items that couldn't be added to inventory
          if (itemsNotAdded.length > 0) {
            const objectTilePos = harvestedObject.getTilePosition();
            if (objectTilePos) {
              for (const _ of itemsNotAdded) {
                // Find a nearby tile (within 1 tile radius)
                const offsetX = Math.floor((Math.random() - 0.5) * 3); // -1, 0, or 1
                const offsetZ = Math.floor((Math.random() - 0.5) * 3); // -1, 0, or 1
                const nearbyTile = this.tileGrid.getTile(objectTilePos.tileX + offsetX, objectTilePos.tileZ + offsetZ);
                if (nearbyTile && nearbyTile.walkable && !nearbyTile.content) {
                  this.spawnResource(nearbyTile.worldX, nearbyTile.worldZ, result.itemType);
                } else {
                  // Fallback to object's tile if nearby tile is invalid
                  const objectTile = this.tileGrid.getTile(objectTilePos.tileX, objectTilePos.tileZ);
                  if (objectTile && !objectTile.content) {
                    this.spawnResource(objectTile.worldX, objectTile.worldZ, result.itemType);
                  }
                }
              }
            }
          }
          
          // Update hand item display
          if (this.player.updateHandItem) {
            this.player.updateHandItem();
          }
        }
      }
    }
  }

  spawnSticks(count) {
    const attempts = count * 25; // Try more times since we're only looking for dirt tiles
    let spawned = 0;

    for (let i = 0; i < attempts && spawned < count; i++) {
      const tileX = Math.floor(Math.random() * this.tileGrid.width);
      const tileZ = Math.floor(Math.random() * this.tileGrid.height);
      const tile = this.tileGrid.getTile(tileX, tileZ);

      // Sticks ONLY spawn on dirt tiles, and only if tile has no content
      if (tile && tile.walkable && !tile.occupied && !tile.content && tile.type === 'dirt') {
        const stick = new Resource(this.scene, this.tileGrid, tile.worldX, tile.worldZ, 'stick');
        this.worldObjects.push(stick);
        if (this.interactionManager) {
          this.interactionManager.addObject(stick);
        }
        spawned++;
      }
    }
    
    console.log(`Spawned ${spawned} sticks out of ${count} requested`);
  }

  spawnStones(count) {
    const attempts = count * 25; // Try more times to find available tiles
    let spawned = 0;

    for (let i = 0; i < attempts && spawned < count; i++) {
      const tileX = Math.floor(Math.random() * this.tileGrid.width);
      const tileZ = Math.floor(Math.random() * this.tileGrid.height);
      const tile = this.tileGrid.getTile(tileX, tileZ);

      // Stones spawn on any walkable tile (not restricted to dirt), and only if tile has no content
      if (tile && tile.walkable && !tile.occupied && !tile.content) {
        const stone = new Resource(this.scene, this.tileGrid, tile.worldX, tile.worldZ, 'stone');
        this.worldObjects.push(stone);
        if (this.interactionManager) {
          this.interactionManager.addObject(stone);
        }
        spawned++;
      }
    }
    
    console.log(`Spawned ${spawned} stones out of ${count} requested`);
  }

  onWindowResize() {
    // Update perspective camera aspect ratio
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  clearWorld() {
    // Clear world objects - use remove() method to properly clean up tile references
    this.worldObjects.forEach(obj => {
      // Always call remove() if available to properly clean up tile references
      if (obj.remove && typeof obj.remove === 'function') {
        obj.remove();
      } else if (obj.mesh && this.scene) {
        // Fallback: manual cleanup if remove() doesn't exist
        this.scene.remove(obj.mesh);
        // Dispose of geometry and materials
        if (obj.mesh.geometry) obj.mesh.geometry.dispose();
        if (obj.mesh.material) {
          if (Array.isArray(obj.mesh.material)) {
            obj.mesh.material.forEach(mat => mat.dispose());
          } else {
            obj.mesh.material.dispose();
          }
        }
        // Clear tile references if tileGrid exists
        if (obj.tileGrid && obj.tileX !== undefined && obj.tileZ !== undefined) {
          try {
            const tile = obj.tileGrid.getTile(obj.tileX, obj.tileZ);
            if (tile) {
              tile.occupied = false;
              tile.content = null;
            }
          } catch (e) {
            // TileGrid might have been disposed, ignore
          }
        }
      }
    });
    // Clear the array completely
    this.worldObjects.length = 0;

    // Clear buildings
    if (this.buildingManager) {
      this.buildingManager.buildings.forEach(building => {
        if (building.remove) {
          building.remove();
        }
      });
      this.buildingManager.buildings = [];
    }

    // Clear villagers
    if (this.villagerManager) {
      this.villagerManager.villagers.forEach(villager => {
        if (villager.mesh && this.scene) {
          this.scene.remove(villager.mesh);
          if (villager.mesh.geometry) villager.mesh.geometry.dispose();
          if (villager.mesh.material) villager.mesh.material.dispose();
        }
      });
      this.villagerManager.villagers = [];
    }

    // Clear grass
    if (this.grassManager) {
      this.grassManager.dispose();
      this.grassManager = null;
    }

    // Weather manager doesn't need to be cleared - it persists across world resets
    // (rain particles are scene-level, not world-level)

    // Reset player position (but keep player object)
    if (this.player) {
      // Player will be repositioned in restoreFromSave
      // Just clear any paths/movement
      this.player.path = [];
      this.player.isMoving = false;
      this.player.targetPosition = null;
    }
  }

  async regenerateWorld(seed = null) {
    // IMPORTANT: Clear world objects BEFORE disposing old tile grid
    // This ensures old objects don't try to access a disposed tile grid
    this.clearWorld();
    
    // Remove old terrain and tile grid
    if (this.terrain) {
      this.terrain.dispose();
      this.terrain = null;
    }
    
    if (this.tileGrid && this.tileGrid.gridHelper) {
      this.scene.remove(this.tileGrid.gridHelper);
    }
    
    // Create new tile grid with seed
    this.tileGrid = new TileGrid(this.scene, 200, 200, seed);
    this.tileGrid.create();
    if (this.tileGrid.preloadAllChunks) {
      this.tileGrid.preloadAllChunks();
    }
    
    // Create new terrain
    this.terrain = new Terrain(this.scene, this.tileGrid, 200, 200);
    this.terrain.create();

    // Create new grass manager and spawn grass patches
    // DISABLED: Grass patches temporarily disabled
    // this.grassManager = new GrassManager(this.scene, this.tileGrid);
    // this.grassManager.spawnGrassPatches();

    // Update tile highlighter if it exists
    if (this.tileHighlighter) {
      this.tileHighlighter.tileGrid = this.tileGrid;
    }
  }

  restoreFromSave(saveData) {
    // Note: clearWorld() is already called in regenerateWorld() if it was called
    // But we should ensure world objects are cleared before restoring
    // Clear any remaining world objects (in case regenerateWorld wasn't called)
    this.worldObjects.forEach(obj => {
      if (obj.remove && typeof obj.remove === 'function') {
        obj.remove();
      }
    });
    this.worldObjects.length = 0;

    // Restore player
    if (saveData.player && this.player) {
      const tile = this.tileGrid.getTile(saveData.player.tileX, saveData.player.tileZ);
      if (tile) {
        this.player.mesh.position.set(tile.worldX, this.player.mesh.position.y, tile.worldZ);
        this.player.currentTile = tile;
      }

      // Restore inventory
      if (saveData.player.inventory && this.player.inventory) {
        this.restoreInventory(this.player.inventory, saveData.player.inventory);
        if (this.player.updateHandItem) {
          this.player.updateHandItem();
        }
      }
    }

    // Restore buildings
    if (saveData.buildings && this.buildingManager) {
      // Temporarily enable admin mode to skip resource deduction when restoring buildings
      const wasAdminMode = window.adminMode;
      window.adminMode = true;
      
      saveData.buildings.forEach(buildingData => {
        // Set building rotation before placing (placeBuilding uses this.buildingRotation)
        const savedRotation = buildingData.rotation || 0;
        this.buildingManager.buildingRotation = (savedRotation * 180) / Math.PI; // Convert radians to degrees
        
        const building = this.buildingManager.placeBuilding(
          buildingData.tileX,
          buildingData.tileZ,
          buildingData.buildingType
        );
        
        if (building && building.mesh) {
          // Ensure rotation is set correctly (placeBuilding should have set it, but verify)
          building.mesh.rotation.y = savedRotation;

          // Restore inventory for storage buildings
          if (buildingData.buildingType === 'storage' && buildingData.inventory && building.inventory) {
            building.inventory.storedItemType = buildingData.inventory.storedItemType;
            building.inventory.count = buildingData.inventory.count || 0;
            if (building.updateItemIcon) {
              building.updateItemIcon();
            }
          }
        }
      });
      
      // Reset building rotation
      this.buildingManager.buildingRotation = 0;
      
      // Restore admin mode state
      window.adminMode = wasAdminMode;
    }

    // Restore world objects (trees and resources)
    if (saveData.worldObjects) {
      // Restore trees
      if (saveData.worldObjects.trees) {
        saveData.worldObjects.trees.forEach(treeData => {
          const tree = new Tree(this.scene, this.tileGrid, treeData.tileX, treeData.tileZ, treeData.sizeVariation || 1.0);
          this.worldObjects.push(tree);
          
          // Register with interaction manager
          if (this.interactionManager) {
            this.interactionManager.addObject(tree);
          }
        });
      }

      // Restore resources
      if (saveData.worldObjects.resources) {
        saveData.worldObjects.resources.forEach(resourceData => {
          // Get tile to get proper world coordinates
          const tile = this.tileGrid.getTile(resourceData.tileX, resourceData.tileZ);
          if (tile) {
            const resource = new Resource(
              this.scene,
              this.tileGrid,
              tile.worldX,
              tile.worldZ,
              resourceData.type,
              resourceData.count || 1
            );
            this.worldObjects.push(resource);
            if (this.interactionManager) {
              this.interactionManager.addObject(resource);
            }
          }
        });
      }
    }

    // Restore villagers
    if (saveData.villagers && this.villagerManager) {
      saveData.villagers.forEach(villagerData => {
        const villager = this.villagerManager.spawnVillager(villagerData.tileX, villagerData.tileZ);
        
        // Restore inventory
        if (villagerData.inventory) {
          this.restoreInventory(villager.inventory, villagerData.inventory);
        }

        // Restore program if exists
        if (villagerData.program) {
          try {
            const program = Program.deserialize(villagerData.program);
            if (program && villager.setProgram) {
              villager.setProgram(program);
            }
          } catch (e) {
            console.warn('Could not restore villager program:', e);
          }
        }
      });
    }

    // Restore camera
    if (saveData.camera && this.cameraController) {
      this.cameraController.focusPoint.set(
        saveData.camera.focusPoint.x,
        saveData.camera.focusPoint.y,
        saveData.camera.focusPoint.z
      );
      this.cameraController.yaw = saveData.camera.yaw || this.cameraController.yaw;
      this.cameraController.pitch = saveData.camera.pitch || this.cameraController.pitch;
      this.cameraController.distance = saveData.camera.distance || this.cameraController.distance;
      this.cameraController.updateCameraPosition();
    }

    // Hook harvestable objects to process harvest results (after all objects are restored)
    // This ensures all trees and other harvestable objects have their callbacks properly set up
    this.worldObjects.forEach(obj => {
      if (obj.harvest && typeof obj.harvest === 'function') {
        const originalHarvest = obj.harvest.bind(obj);
        const sceneManager = this; // Store reference for closure
        obj.harvest = function() {
          const results = originalHarvest();
          if (results && Array.isArray(results)) {
            sceneManager.processHarvestResults(obj, results);
          }
          return results;
        };
      }
    });
  }

  restoreInventory(inventory, inventoryData) {
    // Clear existing inventory
    inventory.clear();

    // Restore tool slots
    if (inventoryData.toolSlots) {
      inventoryData.toolSlots.forEach((tool, index) => {
        if (tool) {
          inventory.setToolSlot(index + 1, tool); // setToolSlot uses 1-based index
        }
      });
    }

    // Restore item slots
    if (inventoryData.itemSlots) {
      inventoryData.itemSlots.forEach((item, index) => {
        if (item) {
          inventory.setItemSlot(index + 3, item); // setItemSlot uses 3-6 (1-based)
        }
      });
    }

    // Restore selected slot
    if (inventoryData.selectedSlot) {
      inventory.setSelectedSlot(inventoryData.selectedSlot);
    }
  }

  setDayNightCycleEnabled(enabled) {
    if (this.dayNightCycle) {
      this.dayNightCycle.setEnabled(enabled);
    }
  }

  setDayNightCyclePaused(paused) {
    if (this.dayNightCycle) {
      this.dayNightCycle.setPaused(paused);
    }
  }

  setWeatherEnabled(enabled) {
    if (this.weatherManager) {
      this.weatherManager.setEnabled(enabled);
    }
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

    const cameraPos = this.cameraController ? this.cameraController.focusPoint : null;
    const cameraDistance = this.cameraController ? this.cameraController.distance : null;

    if (this.terrain && this.terrain.updateVisibleChunks) {
      this.terrain.updateVisibleChunks(this.camera, cameraPos, cameraDistance);
    }
    if (this.tileGrid && this.tileGrid.updateGridVisibility) {
      this.tileGrid.updateGridVisibility(cameraDistance);
    }
    
    // Update compass UI
    if (this.compassUI) {
      this.compassUI.update();
    }

    // Update hotbar UI
    if (this.hotbarUI) {
      this.hotbarUI.update();
    }

    // Update player hand item based on selected slot
    if (this.player && this.player.updateHandItem) {
      this.player.updateHandItem();
    }

    // Update building placement preview
    if (this.buildingManager && this.buildingManager.placementMode) {
      const mousePos = this.interactionManager?.getMouseWorldPosition();
      if (mousePos) {
        this.buildingManager.updatePreview(mousePos.x, mousePos.z);
      }
    }

    // Get camera focus point for distance-based culling
    // Use camera position as reference point for culling
    const maxUpdateDistance = 100; // Only update objects within 100 units of camera focus

    // Update villagers
    if (this.villagerManager) {
      this.villagerManager.update(deltaTime);
    }

    // Update buildings (for animated effects like campfire)
    // Buildings are always updated (they're important and usually few in number)
    if (this.buildingManager && this.buildingManager.buildings) {
      this.buildingManager.buildings.forEach(building => {
        if (building.update && typeof building.update === 'function') {
          building.update(deltaTime);
        }
      });
    }

    // Update world objects with distance-based culling
    // Only update objects within reasonable distance of camera
    if (cameraPos && this.worldObjects.length > 0) {
      for (const obj of this.worldObjects) {
        // Always update player-related objects and interactive objects
        if (obj === this.player || (obj.isInteractable && obj.isInteractable)) {
          if (obj.update && typeof obj.update === 'function') {
            obj.update(deltaTime);
          }
          continue;
        }
        
        // For other objects, check distance
        if (obj.getPosition && typeof obj.getPosition === 'function') {
          const objPos = obj.getPosition();
          if (objPos) {
            const dx = objPos.x - cameraPos.x;
            const dz = (objPos.z || 0) - cameraPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Only update if within range
            if (distance <= maxUpdateDistance) {
              if (obj.update && typeof obj.update === 'function') {
                obj.update(deltaTime);
              }
            }
          }
        } else if (obj.mesh && obj.mesh.position) {
          // Fallback: use mesh position if getPosition doesn't exist
          const dx = obj.mesh.position.x - cameraPos.x;
          const dz = obj.mesh.position.z - cameraPos.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance <= maxUpdateDistance) {
            if (obj.update && typeof obj.update === 'function') {
              obj.update(deltaTime);
            }
          }
        } else {
          // No position available, update anyway (shouldn't happen often)
          if (obj.update && typeof obj.update === 'function') {
            obj.update(deltaTime);
          }
        }
      }
    } else {
      // No camera position available, update all objects (fallback)
      for (const obj of this.worldObjects) {
        if (obj.update && typeof obj.update === 'function') {
          obj.update(deltaTime);
        }
      }
    }

    // Update day/night cycle
    if (this.dayNightCycle) {
      this.dayNightCycle.update(deltaTime);
    }

    // Update weather system
    if (this.weatherManager) {
      const cameraPos = this.cameraController ? this.cameraController.focusPoint : null;
      this.weatherManager.update(deltaTime, cameraPos);
    }

    // Update grass wind animation
    // DISABLED: Grass patches temporarily disabled
    // if (this.grassManager) {
    //   this.grassManager.update(deltaTime);
    // }

    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

