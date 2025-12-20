import * as THREE from 'three';
import { Resource } from './Resource.js';

export class InteractionManager {
  constructor(camera, renderer, scene, player, worldObjects, buildingManager, sceneManager, tileHighlighter) {
    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
    this.player = player;
    this.worldObjects = worldObjects;
    this.buildingManager = buildingManager;
    this.sceneManager = sceneManager;
    this.tileHighlighter = tileHighlighter;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // LMB - Only for clicking (no drag)
    this.renderer.domElement.addEventListener('click', (e) => {
      if (e.button === 0) { // Left mouse button only
        this.onClick(e);
      }
    }, false);
    
    // RMB - Drop items
    this.renderer.domElement.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Prevent context menu
      this.onRightClick(e);
    }, false);
    
    this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'b' || e.key === 'B') {
        // Toggle building placement UI
        if (this.sceneManager && this.sceneManager.buildingPlacementUI) {
          if (this.sceneManager.buildingPlacementUI.element.style.display === 'none' || 
              !this.sceneManager.buildingPlacementUI.element.parentNode) {
            this.sceneManager.buildingPlacementUI.show();
          } else {
            this.sceneManager.buildingPlacementUI.hide();
            if (this.buildingManager) {
              this.buildingManager.exitPlacementMode();
            }
          }
        }
      }
      if (e.key === 'c' || e.key === 'C') {
        // Toggle blueprint/crafting UI
        if (this.sceneManager && this.sceneManager.blueprintUI) {
          if (this.sceneManager.blueprintUI.element.style.display === 'none' || 
              !this.sceneManager.blueprintUI.element.parentNode) {
            this.sceneManager.blueprintUI.show();
          } else {
            this.sceneManager.blueprintUI.hide();
          }
        }
      }
      if (e.key === 'Escape' && this.buildingManager && this.buildingManager.placementMode) {
        this.buildingManager.exitPlacementMode();
        if (this.sceneManager && this.sceneManager.buildingPlacementUI) {
          this.sceneManager.buildingPlacementUI.hide();
        }
      }
    });
  }

  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update tile highlight - use accurate world position
    if (this.tileHighlighter && this.sceneManager && this.sceneManager.tileGrid) {
      const worldPos = this.getMouseWorldPosition();
      this.tileHighlighter.update(worldPos.x, worldPos.z);
    }

    // Update building preview if in placement mode
    if (this.buildingManager && this.buildingManager.placementMode) {
      const worldPos = this.getMouseWorldPosition();
      this.buildingManager.updatePreview(worldPos.x, worldPos.z);
    }

    // Check for hover on objects (including resources)
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Collect all meshes including groups
    const allMeshes = [];
    this.worldObjects.forEach(obj => {
      if (obj.mesh) {
        if (obj.mesh instanceof THREE.Group) {
          obj.mesh.children.forEach(child => allMeshes.push(child));
        } else {
          allMeshes.push(obj.mesh);
        }
      }
    });

    const intersects = this.raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      // Find which object was hovered
      let hoveredObject = null;
      for (const obj of this.worldObjects) {
        if (obj.mesh instanceof THREE.Group) {
          if (obj.mesh.children.includes(intersects[0].object)) {
            hoveredObject = obj;
            break;
          }
        } else if (obj.mesh === intersects[0].object) {
          hoveredObject = obj;
          break;
        }
      }

      if (hoveredObject && hoveredObject !== this.hoveredObject) {
        // Remove highlight from previous object
        if (this.hoveredObject && this.hoveredObject.mesh) {
          this.hoveredObject.mesh.scale.set(1, 1, 1);
        }
        
        this.hoveredObject = hoveredObject;
        
        // Add visual feedback for resources
        if (hoveredObject.mesh) {
          hoveredObject.mesh.scale.set(1.1, 1.1, 1.1);
        }
      }
    } else {
      // Remove highlight from previous object
      if (this.hoveredObject && this.hoveredObject.mesh) {
        this.hoveredObject.mesh.scale.set(1, 1, 1);
      }
      this.hoveredObject = null;
    }
  }

  getMouseWorldPosition() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectionPoint);
    return intersectionPoint;
  }

  async onClick(event) {
    // Check if in building placement mode
    if (this.buildingManager && this.buildingManager.placementMode) {
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.raycaster.ray.intersectPlane(plane, intersectionPoint);

      // Snap to tile grid
      const { tileX, tileZ } = this.sceneManager.tileGrid.worldToTile(intersectionPoint.x, intersectionPoint.z);

      const building = this.buildingManager.placeBuilding(tileX, tileZ, this.buildingManager.selectedBuildingType);
      if (building) {
        this.worldObjects.push(building);
        this.buildingManager.exitPlacementMode();
        this.sceneManager.buildingPlacementUI.update();
      }
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check for building clicks first
    if (this.buildingManager && this.buildingManager.buildings) {
      try {
        const buildingMeshes = this.buildingManager.buildings.map(b => b.mesh).filter(m => m !== null);
        if (buildingMeshes.length === 0) {
          // No buildings to check, continue to other checks
        } else {
          const buildingIntersects = this.raycaster.intersectObjects(buildingMeshes, true); // true = recursive for groups
          
          if (buildingIntersects.length > 0) {
            const clickedMesh = buildingIntersects[0].object;
            let clickedBuilding = null;
            
            // Find which building this mesh belongs to (handle groups recursively)
            for (const building of this.buildingManager.buildings) {
              if (!building.mesh) continue;
              
              if (building.mesh === clickedMesh) {
                clickedBuilding = building;
                break;
              }
              
              if (building.mesh instanceof THREE.Group) {
                // Check if clicked mesh is a child of this group (recursively)
                const isChild = this.isMeshInGroup(clickedMesh, building.mesh);
                if (isChild) {
                  clickedBuilding = building;
                  break;
                }
              }
            }
            
            if (clickedBuilding) {
              // Handle storage container withdraw (left click)
              if (clickedBuilding.buildingType === 'storage' && this.player) {
                try {
                  if (!this.player.getPosition) {
                    return; // Player doesn't have getPosition method
                  }
                  
                  const playerPos = this.player.getPosition();
                  if (!playerPos) {
                    return; // Invalid player position
                  }
                  
                  // Check if can interact
                  let canInteract = false;
                  if (clickedBuilding.canInteract && typeof clickedBuilding.canInteract === 'function') {
                    try {
                      canInteract = clickedBuilding.canInteract(playerPos);
                    } catch (err) {
                      console.error('Error in canInteract:', err);
                      canInteract = false;
                    }
                  }
                  
                  if (canInteract) {
                    // Player is in range, interact
                    if (clickedBuilding.interact && typeof clickedBuilding.interact === 'function') {
                      try {
                        clickedBuilding.interact(this.player);
                      } catch (err) {
                        console.error('Error in interact:', err);
                      }
                    }
                    // Update hand item display
                    if (this.player.updateHandItem && typeof this.player.updateHandItem === 'function') {
                      try {
                        this.player.updateHandItem();
                      } catch (err) {
                        console.error('Error updating hand item:', err);
                      }
                    }
                    return;
                  } else {
                    // Move player to storage container (use tile coordinates)
                    try {
                      const tilePos = clickedBuilding.getTilePosition();
                      if (!tilePos) {
                        return; // Invalid tile position
                      }
                      
                      const { tileX, tileZ } = tilePos;
                      const targetTile = this.sceneManager?.tileGrid?.getTile(tileX, tileZ);
                      
                      // If target tile is occupied, find adjacent walkable tile
                      if (targetTile && (targetTile.occupied || !targetTile.walkable)) {
                        // Try to find an adjacent walkable tile
                        const directions = [
                          { x: 0, z: -1 },   // North
                          { x: 1, z: 0 },    // East
                          { x: 0, z: 1 },    // South
                          { x: -1, z: 0 },   // West
                          { x: 1, z: -1 },   // Northeast
                          { x: 1, z: 1 },    // Southeast
                          { x: -1, z: 1 },   // Southwest
                          { x: -1, z: -1 }   // Northwest
                        ];
                        
                        let foundAdjacent = false;
                        for (const dir of directions) {
                          const adjTile = this.sceneManager?.tileGrid?.getTile(tileX + dir.x, tileZ + dir.z);
                          if (adjTile && adjTile.walkable && !adjTile.occupied) {
                            if (this.player.moveTo && typeof this.player.moveTo === 'function') {
                              this.player.moveTo(tileX + dir.x, tileZ + dir.z);
                            }
                            foundAdjacent = true;
                            break;
                          }
                        }
                        
                        // If no adjacent tile found, just return (can't reach)
                        if (!foundAdjacent) {
                          return;
                        }
                      } else {
                        // Target tile is walkable, move there
                        if (this.player.moveTo && typeof this.player.moveTo === 'function') {
                          this.player.moveTo(tileX, tileZ);
                        }
                      }
                    } catch (err) {
                      console.error('Error moving to storage:', err);
                    }
                    return;
                  }
                } catch (error) {
                  console.error('Error handling storage interaction:', error);
                  // Don't freeze the game on error
                  return;
                }
              } else {
                // For other buildings, show building UI
                if (this.sceneManager) {
                  try {
                    if (this.sceneManager.currentBuildingUI) {
                      this.sceneManager.currentBuildingUI.destroy();
                    }
                    const { BuildingUI } = await import('../ui/BuildingUI.js');
                    this.sceneManager.currentBuildingUI = new BuildingUI(
                      this.sceneManager.container,
                      clickedBuilding
                    );
                    this.sceneManager.currentBuildingUI.show();
                  } catch (error) {
                    console.error('Error showing building UI:', error);
                    // Don't freeze the game on error
                  }
                }
              }
            }
            // If we found and handled a building, we already returned above
            // If clickedBuilding is null, continue to other checks
          }
        }
      } catch (err) {
        console.error('Error in building click detection:', err);
        // Continue to other checks if building detection fails
      }
    }
    
    // Check for object clicks (including resources which might be in a group)
    const allMeshes = [];
    this.worldObjects.forEach(obj => {
      if (obj.mesh) {
        if (obj.mesh instanceof THREE.Group) {
          obj.mesh.children.forEach(child => allMeshes.push(child));
        } else {
          allMeshes.push(obj.mesh);
        }
      }
    });

    const intersects = this.raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      // Find which object was clicked
      let clickedObject = null;
      for (const obj of this.worldObjects) {
        if (obj.mesh instanceof THREE.Group) {
          if (obj.mesh.children.includes(intersects[0].object)) {
            clickedObject = obj;
            break;
          }
        } else if (obj.mesh === intersects[0].object) {
          clickedObject = obj;
          break;
        }
      }

      // Only handle object clicks if we found a valid worldObject
      if (clickedObject && this.player) {
        try {
          const playerPos = this.player.getPosition();
          if (clickedObject.canInteract && clickedObject.canInteract(playerPos)) {
            // For resources, pick up 1 item at a time
            if (clickedObject instanceof Resource) {
              clickedObject.interact(this.player);
              // Trigger pickup animation
              if (this.player.triggerPickupAnimation) {
                this.player.triggerPickupAnimation();
              }
              // Update hand item immediately
              if (this.player.updateHandItem) {
                this.player.updateHandItem();
              }
              // Remove object only if stack is empty
              if (clickedObject.shouldRemove && clickedObject.shouldRemove()) {
                this.removeObject(clickedObject);
                clickedObject.remove();
              }
            } else {
              // For other objects, use normal interaction
              clickedObject.interact(this.player);
              if (clickedObject.shouldRemove && clickedObject.shouldRemove()) {
                this.removeObject(clickedObject);
                clickedObject.remove();
              }
            }
          } else {
            // Move player to object if not in range (use tile coordinates)
            const { tileX, tileZ } = clickedObject.getTilePosition();
            const targetTile = this.sceneManager?.tileGrid?.getTile(tileX, tileZ);
            
            // If target tile is occupied (e.g., tree), find adjacent walkable tile
            if (targetTile && (targetTile.occupied || !targetTile.walkable)) {
              // Try to find an adjacent walkable tile
              const directions = [
                { x: 0, z: -1 },   // North
                { x: 1, z: 0 },    // East
                { x: 0, z: 1 },    // South
                { x: -1, z: 0 },   // West
                { x: 1, z: -1 },   // Northeast
                { x: 1, z: 1 },    // Southeast
                { x: -1, z: 1 },   // Southwest
                { x: -1, z: -1 }   // Northwest
              ];
              
              let foundAdjacent = false;
              for (const dir of directions) {
                const adjTile = this.sceneManager?.tileGrid?.getTile(tileX + dir.x, tileZ + dir.z);
                if (adjTile && adjTile.walkable && !adjTile.occupied) {
                  this.player.moveTo(tileX + dir.x, tileZ + dir.z);
                  foundAdjacent = true;
                  break;
                }
              }
              
              // If no adjacent tile found, just return (can't reach)
              if (!foundAdjacent) {
                return;
              }
            } else {
              // Target tile is walkable, move there
              this.player.moveTo(tileX, tileZ);
            }
          }
        } catch (error) {
          console.error('Error handling object interaction:', error);
          // Don't freeze the game on error
        }
        return; // Only return if we actually handled an object click
      }
      // If intersection didn't match a worldObject, fall through to ground movement
    }

    // Otherwise, move to clicked tile (snap to grid)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectionPoint);

    if (this.player && this.sceneManager && this.sceneManager.tileGrid) {
      // Snap to tile grid
      const { tileX, tileZ } = this.sceneManager.tileGrid.worldToTile(intersectionPoint.x, intersectionPoint.z);
      
      // Check if there's a resource on this tile
      const tile = this.sceneManager.tileGrid.getTile(tileX, tileZ);
      if (tile) {
        // Find resources on this tile
        const resourceOnTile = this.worldObjects.find(obj => {
          if (obj instanceof Resource || (obj.constructor && obj.constructor.name === 'Resource')) {
            const objTilePos = obj.getTilePosition();
            return objTilePos.tileX === tileX && objTilePos.tileZ === tileZ;
          }
          return false;
        });

        if (resourceOnTile) {
          // Move to the resource's tile
          const resourceTilePos = resourceOnTile.getTilePosition();
          this.player.moveTo(resourceTilePos.tileX, resourceTilePos.tileZ);
        } else {
          // Move to clicked tile
          this.player.moveTo(tileX, tileZ);
        }
      } else {
        // Fallback: try to move to tile coordinates anyway
        this.player.moveTo(tileX, tileZ);
      }
    }
  }

  addObject(object) {
    this.worldObjects.push(object);
  }

  removeObject(object) {
    const index = this.worldObjects.indexOf(object);
    if (index > -1) {
      this.worldObjects.splice(index, 1);
    }
  }

  // Helper method to recursively check if a mesh is in a group
  isMeshInGroup(mesh, group) {
    if (!group || !mesh) return false;
    if (group === mesh) return true;
    if (group instanceof THREE.Group) {
      for (const child of group.children) {
        if (child === mesh) return true;
        if (child instanceof THREE.Group) {
          if (this.isMeshInGroup(mesh, child)) return true;
        }
      }
    }
    return false;
  }

  onRightClick(event) {
    // Right mouse button - Deposit items to storage or drop on ground
    if (!this.player || !this.player.inventory) return;

    const selectedSlot = this.player.inventory.selectedSlot;
    
    // Get item from selected slot
    const selectedSlotItem = this.player.inventory.getSelectedSlot();
    if (!selectedSlotItem || !selectedSlotItem.type) return;

    const itemType = selectedSlotItem.type;

    // Enforce slot restrictions:
    // - Tools (slots 1-2) can only drop if that specific tool slot is selected
    // - Items (slots 3-6) can drop if any item slot (3-6) is selected
    if (selectedSlot >= 1 && selectedSlot <= 2) {
      // Tool slot selected - verify it's actually a tool
      if (!this.player.inventory.isTool(itemType)) {
        return; // Don't drop if tool slot doesn't contain a tool
      }
    } else if (selectedSlot >= 3 && selectedSlot <= 6) {
      // Item slot selected - verify it's not a tool
      if (this.player.inventory.isTool(itemType)) {
        return; // Don't drop tools from item slots
      }
    }

    // Get mouse position
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);

    // First check if clicking on a storage container
    if (this.buildingManager) {
      const buildingMeshes = this.buildingManager.buildings.map(b => b.mesh).filter(m => m !== null);
      const buildingIntersects = this.raycaster.intersectObjects(buildingMeshes);
      
      if (buildingIntersects.length > 0) {
        const clickedBuilding = this.buildingManager.buildings.find(b => {
          // Check if the clicked mesh belongs to this building (handle groups)
          if (b.mesh instanceof THREE.Group) {
            return b.mesh.children.includes(buildingIntersects[0].object) || b.mesh === buildingIntersects[0].object;
          }
          return b.mesh === buildingIntersects[0].object;
        });
        
        // Handle storage container deposit (right click)
        if (clickedBuilding && clickedBuilding.buildingType === 'storage' && this.player) {
          const playerPos = this.player.getPosition();
          if (clickedBuilding.canInteract && clickedBuilding.canInteract(playerPos)) {
            // Try to deposit the item from selected slot
            if (clickedBuilding.depositItem(itemType, 1)) {
              this.player.inventory.removeItem(itemType, 1);
              // Update hand item display
              if (this.player.updateHandItem) {
                this.player.updateHandItem();
              }
              return;
            }
          } else {
            // Move player to storage container (use tile coordinates)
            const { tileX, tileZ } = clickedBuilding.getTilePosition();
            this.player.moveTo(tileX, tileZ);
            return;
          }
        }
      }
    }

    // If not clicking on storage, drop item on ground
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectionPoint);

    // Snap to tile grid
    const { tileX, tileZ } = this.sceneManager?.tileGrid?.worldToTile(intersectionPoint.x, intersectionPoint.z) || { tileX: 0, tileZ: 0 };
    const tile = this.sceneManager?.tileGrid?.getTile(tileX, tileZ);
    
    if (tile) {
      // Check if player is already on this tile
      const playerTile = this.player.getCurrentTile();
      const playerTilePos = this.player.getTilePosition();
      
      if (playerTilePos.tileX === tileX && playerTilePos.tileZ === tileZ) {
        // Player is on the tile, drop immediately
        this.dropItemAt(tile.worldX, tile.worldZ, itemType);
      } else {
        // Player needs to travel to the tile first
        // Store drop action to execute when player arrives
        this.player.pendingDropAction = {
          x: tile.worldX,
          z: tile.worldZ,
          itemType: itemType
        };
        this.player.moveTo(tileX, tileZ);
      }
    }
  }
  
  dropItemAt(worldX, worldZ, itemType) {
    if (!this.player || !this.player.inventory) return;
    
    // Try to remove 1 item from inventory
    if (!this.player.inventory.removeItem(itemType, 1)) {
      return; // Couldn't remove item
    }
    
    // Update hand item immediately (before animation) to reflect inventory change
    if (this.player.updateHandItem) {
      this.player.updateHandItem();
    }
    
    // Trigger drop animation
    if (this.player.triggerDropAnimation) {
      this.player.triggerDropAnimation();
    }
    
    // Snap to tile grid
    const { tileX, tileZ } = this.sceneManager?.tileGrid?.worldToTile(worldX, worldZ) || { tileX: 0, tileZ: 0 };
    const tile = this.sceneManager?.tileGrid?.getTile(tileX, tileZ);
    
    if (tile) {
      // Check if there's already a resource of this type on this tile
      const existingResource = this.worldObjects.find(obj => {
        if (obj instanceof Resource && obj.type === itemType) {
          const objTilePos = obj.getTilePosition();
          return objTilePos.tileX === tileX && objTilePos.tileZ === tileZ;
        }
        return false;
      });
      
      if (existingResource) {
        // Add to existing stack
        existingResource.addToStack(1);
      } else {
        // Create new resource at tile center
        if (this.sceneManager) {
          this.sceneManager.spawnResource(tile.worldX, tile.worldZ, itemType);
        }
      }
    }
  }
}

