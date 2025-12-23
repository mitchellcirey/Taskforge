export class SaveManager {
  constructor() {
    this.version = '1.0.0'; // Save format version
  }

  serialize(sceneManager, cameraController) {
    const saveData = {
      version: this.version,
      timestamp: new Date().toISOString(),
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
      if (obj.constructor.name === 'Tree') {
        trees.push({
          tileX: obj.tileX,
          tileZ: obj.tileZ,
          sizeVariation: obj.sizeVariation || 1.0
        });
      } else if (obj.constructor.name === 'Resource') {
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

  // Validation
  validateSaveData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid save data: not an object');
    }
    
    if (!data.version) {
      throw new Error('Invalid save data: missing version');
    }
    
    // Check for required top-level fields
    const requiredFields = ['player', 'buildings', 'worldObjects', 'villagers'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Invalid save data: missing field '${field}'`);
      }
    }
    
    return true;
  }
}

