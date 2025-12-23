export class SaveManager {
  constructor() {
    this.CURRENT_VERSION = '1.2.0'; // Current save format version (added worldName and seed)
    this.version = this.CURRENT_VERSION; // For backwards compatibility
  }

  serialize(sceneManager, cameraController, worldName = null, seed = null) {
    const saveData = {
      version: this.CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      worldName: worldName || null,
      seed: seed !== null ? seed : (sceneManager.tileGrid?.seed || null),
      player: this.serializePlayer(sceneManager.player),
      buildings: this.serializeBuildings(sceneManager.buildingManager?.buildings || []),
      worldObjects: this.serializeWorldObjects(sceneManager.worldObjects || []),
      villagers: this.serializeVillagers(sceneManager.villagerManager?.villagers || []),
      camera: this.serializeCamera(cameraController)
    };
    return saveData;
  }

  serializePlayer(player) {
    if (!player) return null;
    
    const tilePos = player.getTilePosition ? player.getTilePosition() : 
                    (player.currentTile ? { tileX: player.currentTile.tileX, tileZ: player.currentTile.tileZ } : 
                     { tileX: 0, tileZ: 0 });
    
    return {
      tileX: tilePos.tileX,
      tileZ: tilePos.tileZ,
      inventory: player.inventory ? this.serializeInventory(player.inventory) : null
    };
  }

  serializeInventory(inventory) {
    return {
      toolSlots: [...(inventory.toolSlots || [])],
      itemSlots: [...(inventory.itemSlots || [])],
      selectedSlot: inventory.selectedSlot || 1
    };
  }

  serializeBuildings(buildings) {
    return buildings.map(building => {
      const data = {
        buildingType: building.buildingType,
        tileX: building.tileX,
        tileZ: building.tileZ,
        rotation: building.mesh ? building.mesh.rotation.y : 0
      };
      
      // Add inventory for storage buildings
      if (building.buildingType === 'storage' && building.inventory) {
        data.inventory = {
          storedItemType: building.inventory.storedItemType,
          count: building.inventory.count
        };
      }
      
      return data;
    });
  }

  serializeWorldObjects(worldObjects) {
    const trees = [];
    const resources = [];
    
    worldObjects.forEach(obj => {
      // Use getSaveType() method for robust type identification
      const saveType = obj.getSaveType ? obj.getSaveType() : null;
      
      if (saveType === 'tree') {
        // Don't save chopped trees - they should be removed from the world
        if (!obj.isChopped) {
          trees.push({
            tileX: obj.tileX,
            tileZ: obj.tileZ,
            sizeVariation: obj.sizeVariation || 1.0
          });
        }
      } else if (saveType === 'resource') {
        resources.push({
          tileX: obj.tileX,
          tileZ: obj.tileZ,
          type: obj.type,
          count: obj.count || 1
        });
      }
    });
    
    return { trees, resources };
  }

  serializeVillagers(villagers) {
    return villagers.map(villager => {
      const tilePos = villager.getTilePosition ? villager.getTilePosition() :
                      { tileX: villager.tileX, tileZ: villager.tileZ };
      
      const data = {
        tileX: tilePos.tileX,
        tileZ: tilePos.tileZ,
        inventory: this.serializeInventory(villager.inventory)
      };
      
      // Add program if exists
      if (villager.program) {
        data.program = villager.program.serialize ? villager.program.serialize() : null;
      }
      
      return data;
    });
  }

  serializeCamera(cameraController) {
    if (!cameraController) return null;
    
    return {
      focusPoint: {
        x: cameraController.focusPoint.x,
        y: cameraController.focusPoint.y,
        z: cameraController.focusPoint.z
      },
      yaw: cameraController.yaw,
      pitch: cameraController.pitch,
      distance: cameraController.distance
    };
  }

  /**
   * Migrates save data from older versions to the current version
   * @param {Object} data - The save data to migrate
   * @returns {Object} - Migrated save data
   */
  migrateSaveData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid save data: not an object');
    }

    // If no version, assume it's version 1.0.0 (oldest)
    const saveVersion = data.version || '1.0.0';
    
    // If already at current version, no migration needed
    if (saveVersion === this.CURRENT_VERSION) {
      return data;
    }

    console.log(`Migrating save data from version ${saveVersion} to ${this.CURRENT_VERSION}`);

    // Start with a copy of the data
    let migratedData = JSON.parse(JSON.stringify(data));

    // Version 1.0.0 -> 1.1.0 migration
    // Changes:
    // - No structural changes, just ensuring compatibility with getSaveType() system
    // - Old saves using constructor.name will still work due to backward compatibility in restoreFromSave
    if (this.compareVersions(saveVersion, '1.1.0') < 0) {
      // Ensure all required fields exist with defaults
      if (!migratedData.player) {
        migratedData.player = { tileX: 0, tileZ: 0, inventory: null };
      }
      if (!migratedData.buildings) {
        migratedData.buildings = [];
      }
      if (!migratedData.worldObjects) {
        migratedData.worldObjects = { trees: [], resources: [] };
      }
      if (!migratedData.villagers) {
        migratedData.villagers = [];
      }
      if (!migratedData.camera) {
        migratedData.camera = null;
      }
      
      migratedData.version = '1.1.0';
    }

    // Version 1.1.0 -> 1.2.0 migration
    // Changes:
    // - Added worldName and seed fields for world generation
    if (this.compareVersions(saveVersion, '1.2.0') < 0) {
      if (!('worldName' in migratedData)) {
        migratedData.worldName = null;
      }
      if (!('seed' in migratedData)) {
        migratedData.seed = null;
      }
      migratedData.version = '1.2.0';
    }

    // Update to current version
    migratedData.version = this.CURRENT_VERSION;
    
    return migratedData;
  }

  /**
   * Compares two version strings (e.g., '1.0.0' vs '1.1.0')
   * @param {string} version1 - First version string
   * @param {string} version2 - Second version string
   * @returns {number} - Negative if version1 < version2, positive if version1 > version2, 0 if equal
   */
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1parts.length, v2parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  // Validation
  validateSaveData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid save data: not an object');
    }
    
    // Version is optional (will be set by migration)
    // But if present, it should be valid
    if (data.version && typeof data.version !== 'string') {
      throw new Error('Invalid save data: version must be a string');
    }
    
    // Check for required top-level fields (with more lenient checking)
    const requiredFields = ['player', 'buildings', 'worldObjects', 'villagers'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        // Provide defaults for missing fields rather than throwing
        console.warn(`Save data missing field '${field}', using default`);
        if (field === 'player') {
          data.player = { tileX: 0, tileZ: 0, inventory: null };
        } else if (field === 'buildings') {
          data.buildings = [];
        } else if (field === 'worldObjects') {
          data.worldObjects = { trees: [], resources: [] };
        } else if (field === 'villagers') {
          data.villagers = [];
        }
      }
    }
    
    return true;
  }
}

