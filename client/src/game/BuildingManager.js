import * as THREE from 'three';
import { Building } from './Building.js';
import { BuildingTypes, getBuildingType } from './BuildingTypes.js';
import { StorageInventory } from './StorageInventory.js';

export class BuildingManager {
  constructor(scene, tileGrid, player) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.player = player;
    this.buildings = [];
    this.placementMode = false;
    this.selectedBuildingType = null;
    this.previewBuilding = null;
    this.buildingRotation = 0; // Rotation in 90° increments (0, 90, 180, 270)
    this.buildingToMove = null; // Building being moved
  }

  canPlaceBuilding(tileX, tileZ, buildingType) {
    const type = getBuildingType(buildingType);
    if (!type) return false;

    // Get building size (accounting for rotation)
    let width = type.size.width;
    let height = type.size.height;
    
    // If rotated 90° or 270°, swap width and height
    if (this.buildingRotation === 90 || this.buildingRotation === 270) {
      [width, height] = [height, width];
    }

    // Check if all tiles in N×N area are available
    // Blueprints don't require resources upfront - resources are added via right-click
    if (!this.tileGrid.canPlaceBuilding(tileX, tileZ, { width, height })) {
      return false;
    }

    return true;
  }

  placeBuilding(tileX, tileZ, buildingType) {
    if (!this.canPlaceBuilding(tileX, tileZ, buildingType)) {
      return false;
    }

    const type = getBuildingType(buildingType);
    if (!type) return false;

    // Get building size (accounting for rotation)
    let width = type.size.width;
    let height = type.size.height;
    
    // If rotated 90° or 270°, swap width and height
    if (this.buildingRotation === 90 || this.buildingRotation === 270) {
      [width, height] = [height, width];
    }

    // Create blueprint (not complete building) - resources will be added via right-click
    const building = new Building(this.scene, this.tileGrid, tileX, tileZ, buildingType, true);
    
    // Apply rotation (locked to 90° increments)
    if (this.buildingRotation !== 0 && building.mesh) {
      building.mesh.rotation.y = (this.buildingRotation * Math.PI) / 180;
    }

    // Mark all tiles in N×N area as occupied (blueprints still occupy tiles)
    const tiles = this.tileGrid.getTilesInArea(tileX, tileZ, { width, height });
    tiles.forEach(tile => {
      tile.occupied = true;
    });

    this.buildings.push(building);
    return building;
  }

  enterPlacementMode(buildingType) {
    this.placementMode = true;
    this.selectedBuildingType = buildingType;
    this.buildingRotation = 0; // Reset rotation when entering placement mode
  }

  exitPlacementMode() {
    this.placementMode = false;
    this.selectedBuildingType = null;
    this.buildingRotation = 0;
    this.buildingToMove = null; // Clear move mode
    if (this.previewBuilding) {
      this.scene.remove(this.previewBuilding);
      this.previewBuilding = null;
    }
  }

  // Rotate building preview (90° increments)
  rotateBuilding() {
    this.buildingRotation = (this.buildingRotation + 90) % 360;
    // Update preview if in placement mode
    if (this.placementMode && this.selectedBuildingType) {
      const mousePos = this.getMouseWorldPosition?.();
      if (mousePos) {
        this.updatePreview(mousePos.x, mousePos.z);
      }
    }
  }

  // Update preview - snaps to tile grid
  updatePreview(worldX, worldZ) {
    if (!this.placementMode || !this.selectedBuildingType) return;

    // Snap to nearest tile
    const { tileX, tileZ } = this.tileGrid.worldToTile(worldX, worldZ);
    const tile = this.tileGrid.getTile(tileX, tileZ);
    
    if (!tile) return;

    // Remove old preview
    if (this.previewBuilding) {
      this.scene.remove(this.previewBuilding);
    }

    // Create preview
    const type = getBuildingType(this.selectedBuildingType);
    if (type) {
      const canPlace = this.canPlaceBuilding(tileX, tileZ, this.selectedBuildingType);
      
      // Get building size (accounting for rotation)
      let width = type.size.width;
      let height = type.size.height;
      
      // If rotated 90° or 270°, swap width and height
      if (this.buildingRotation === 90 || this.buildingRotation === 270) {
        [width, height] = [height, width];
      }
      
      // Create preview geometry matching building size
      const geometry = new THREE.BoxGeometry(
        width * this.tileGrid.tileSize * 0.9, // Slightly smaller to show grid
        1,
        height * this.tileGrid.tileSize * 0.9
      );
      const material = new THREE.MeshStandardMaterial({ 
        color: canPlace ? 0x00FF00 : 0xFF0000,
        opacity: 0.5,
        transparent: true
      });
      this.previewBuilding = new THREE.Mesh(geometry, material);
      
      // Position at tile center (for multi-tile buildings, center on the area)
      const centerX = tile.worldX + (width - 1) * this.tileGrid.tileSize / 2;
      const centerZ = tile.worldZ + (height - 1) * this.tileGrid.tileSize / 2;
      
      this.previewBuilding.position.set(centerX, 0.5, centerZ);
      
      // Apply rotation
      this.previewBuilding.rotation.y = (this.buildingRotation * Math.PI) / 180;
      
      this.scene.add(this.previewBuilding);
    }
  }

  getBuildings() {
    return this.buildings;
  }

  /**
   * Check if a building type has been completed (not just a blueprint)
   * @param {string} buildingTypeId - The building type ID to check
   * @returns {boolean} True if at least one completed building of this type exists
   */
  hasCompletedBuilding(buildingTypeId) {
    return this.buildings.some(building => 
      building.buildingType === buildingTypeId && 
      !building.isBlueprint && 
      building.isComplete
    );
  }

  /**
   * Check if a workshop level is unlocked based on completed buildings
   * @param {string} workshopLevelId - The workshop level ID (workshop-level-1, workshop-level-2, workshop-level-3)
   * @returns {boolean} True if the workshop level is unlocked
   */
  isWorkshopLevelUnlocked(workshopLevelId) {
    if (workshopLevelId === 'workshop-level-1') {
      // Level 1 is always unlocked
      return true;
    } else if (workshopLevelId === 'workshop-level-2') {
      // Level 2 requires Level 1 to be completed
      return this.hasCompletedBuilding('workshop-level-1');
    } else if (workshopLevelId === 'workshop-level-3') {
      // Level 3 requires both Level 1 and Level 2 to be completed
      return this.hasCompletedBuilding('workshop-level-1') && 
             this.hasCompletedBuilding('workshop-level-2');
    }
    // For non-workshop buildings, always return true (they're always unlocked)
    return true;
  }

  /**
   * Destroy a building
   * @param {Building} building - The building to destroy
   */
  destroyBuilding(building) {
    if (!building) return;

    // Validate that storage is empty if it's a storage building
    if (building.buildingType === 'storage' && !building.canDestroy()) {
      console.warn('Cannot destroy storage building: storage is not empty');
      return;
    }

    // Get building tile position and size
    const { tileX, tileZ } = building.getTilePosition();
    const type = getBuildingType(building.buildingType);
    if (!type) return;

    // Get building size
    let width = type.size.width;
    let height = type.size.height;
    
    // If rotated, swap width and height
    if (building.mesh && building.mesh.rotation) {
      const rotationY = (building.mesh.rotation.y * 180) / Math.PI;
      if (rotationY === 90 || rotationY === 270) {
        [width, height] = [height, width];
      }
    }

    // Clear tile occupation
    const tiles = this.tileGrid.getTilesInArea(tileX, tileZ, { width, height });
    tiles.forEach(tile => {
      tile.occupied = false;
    });

    // Remove building from list
    const index = this.buildings.indexOf(building);
    if (index > -1) {
      this.buildings.splice(index, 1);
    }

    // Remove mesh from scene
    if (building.mesh) {
      this.scene.remove(building.mesh);
    }

    // Clean up building
    if (building.remove) {
      building.remove();
    }
  }

  /**
   * Start move mode for a building
   * @param {Building} building - The building to move
   */
  startMoveMode(building) {
    if (!building) return;

    // Validate that storage is empty if it's a storage building
    if (building.buildingType === 'storage' && !building.canMove()) {
      console.warn('Cannot move storage building: storage is not empty');
      return;
    }

    // Store the building to move
    this.buildingToMove = building;
    
    // Enter placement mode with the same building type
    this.enterPlacementMode(building.buildingType);
    
    // Store original rotation
    if (building.mesh && building.mesh.rotation) {
      this.buildingRotation = (building.mesh.rotation.y * 180) / Math.PI;
    }
  }

  /**
   * Move a building to a new location
   * @param {Building} building - The building to move
   * @param {number} newTileX - New tile X coordinate
   * @param {number} newTileZ - New tile Z coordinate
   */
  moveBuilding(building, newTileX, newTileZ) {
    if (!building) return false;

    // Validate that storage is empty if it's a storage building
    if (building.buildingType === 'storage' && !building.canMove()) {
      console.warn('Cannot move storage building: storage is not empty');
      return false;
    }

    // Get building type info
    const type = getBuildingType(building.buildingType);
    if (!type) return false;

    // Get current position and size
    const { tileX: oldTileX, tileZ: oldTileZ } = building.getTilePosition();
    let width = type.size.width;
    let height = type.size.height;
    
    // If rotated, swap width and height
    if (building.mesh && building.mesh.rotation) {
      const rotationY = (building.mesh.rotation.y * 180) / Math.PI;
      if (rotationY === 90 || rotationY === 270) {
        [width, height] = [height, width];
      }
    }

    // Check if new location is valid
    if (!this.canPlaceBuilding(newTileX, newTileZ, building.buildingType)) {
      return false;
    }

    // Clear old tile occupation
    const oldTiles = this.tileGrid.getTilesInArea(oldTileX, oldTileZ, { width, height });
    oldTiles.forEach(tile => {
      tile.occupied = false;
    });

    // Update building position
    building.tileX = newTileX;
    building.tileZ = newTileZ;
    
    // Get new tile and update world position
    const newTile = this.tileGrid.getTile(newTileX, newTileZ);
    if (newTile) {
      building.worldX = newTile.worldX;
      building.worldZ = newTile.worldZ;
      
      // Update mesh position
      if (building.mesh) {
        building.mesh.position.set(building.worldX, building.mesh.position.y, building.worldZ);
      }
    }

    // Set new tile occupation
    const newTiles = this.tileGrid.getTilesInArea(newTileX, newTileZ, { width, height });
    newTiles.forEach(tile => {
      tile.occupied = true;
    });

    // Clear move mode
    this.buildingToMove = null;
    this.exitPlacementMode();

    return true;
  }
}
