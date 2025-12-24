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
}
