import * as THREE from 'three';

export class WorldObject {
  constructor(scene, tileGrid, tileX, tileZ) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.tileX = tileX;
    this.tileZ = tileZ;
    this.mesh = null;
    this.isInteractable = true;
    this.interactionRange = 1.5; // Tile-based interaction range (in tiles)
    
    // Get tile and position object at tile center
    const tile = this.tileGrid.getTile(tileX, tileZ);
    if (tile) {
      this.worldX = tile.worldX; // Always use tile center
      this.worldZ = tile.worldZ;
      // Only mark as occupied if this object blocks the tile
      // (Resources don't block, trees do)
      // This will be overridden by subclasses if needed
      tile.occupied = false;
    } else {
      // Fallback: calculate world position
      const worldPos = this.tileGrid.getWorldPosition(tileX, tileZ);
      this.worldX = worldPos.x;
      this.worldZ = worldPos.z;
    }
  }

  create() {
    // Override in subclasses
  }

  getPosition() {
    return {
      x: this.worldX,
      z: this.worldZ
    };
  }

  // Get tile coordinates
  getTilePosition() {
    return {
      tileX: this.tileX,
      tileZ: this.tileZ
    };
  }

  canInteract(playerPosition) {
    if (!this.isInteractable) return false;
    if (!this.tileGrid || !playerPosition) return false;
    
    try {
      // Tile-based distance check
      const playerTile = this.tileGrid.getTileAtWorldPosition(playerPosition.x, playerPosition.z);
      if (!playerTile) return false;
      
      const dx = this.tileX - playerTile.tileX;
      const dz = this.tileZ - playerTile.tileZ;
      const tileDistance = Math.sqrt(dx * dx + dz * dz);
      
      return tileDistance <= this.interactionRange;
    } catch (error) {
      console.error('Error in canInteract:', error);
      return false;
    }
  }

  interact(player) {
    // Override in subclasses
  }

  remove() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    const tile = this.tileGrid.getTile(this.tileX, this.tileZ);
    if (tile) {
      tile.occupied = false;
      tile.content = null; // Clear tile content
    }
  }

  // Highlight object in red when obstructed
  highlightObstructed() {
    if (!this.mesh) return;
    
    // Store original colors if not already stored
    if (!this.originalColors) {
      this.originalColors = new Map();
      this.storeOriginalColors(this.mesh, 0);
    }
    
    // Apply red tint
    this.applyRedTint(this.mesh);
    
    // Clear highlight after 2.5 seconds
    if (this.obstructedTimeout) {
      clearTimeout(this.obstructedTimeout);
    }
    this.obstructedTimeout = setTimeout(() => {
      this.clearObstructedHighlight();
    }, 2500);
  }

  // Clear red highlight
  clearObstructedHighlight() {
    if (!this.mesh || !this.originalColors) return;
    
    this.restoreOriginalColors(this.mesh, 0);
    
    if (this.obstructedTimeout) {
      clearTimeout(this.obstructedTimeout);
      this.obstructedTimeout = null;
    }
  }

  // Helper to store original colors recursively
  storeOriginalColors(mesh, index) {
    if (mesh instanceof THREE.Group) {
      mesh.children.forEach((child, i) => {
        if (child.material) {
          this.originalColors.set(index + i, {
            color: child.material.color.getHex(),
            emissive: child.material.emissive ? child.material.emissive.getHex() : 0x000000,
            emissiveIntensity: child.material.emissiveIntensity || 0
          });
        }
        if (child instanceof THREE.Group) {
          this.storeOriginalColors(child, index + i + 1);
        }
      });
    } else if (mesh.material) {
      this.originalColors.set(index, {
        color: mesh.material.color.getHex(),
        emissive: mesh.material.emissive ? mesh.material.emissive.getHex() : 0x000000,
        emissiveIntensity: mesh.material.emissiveIntensity || 0
      });
    }
  }

  // Helper to apply red tint recursively
  applyRedTint(mesh) {
    if (mesh instanceof THREE.Group) {
      mesh.children.forEach(child => {
        if (child.material) {
          child.material.color.setHex(0xFF0000);
          if (child.material.emissive !== undefined) {
            child.material.emissive.setHex(0xFF0000);
            child.material.emissiveIntensity = 1.0;
          }
        }
        if (child instanceof THREE.Group) {
          this.applyRedTint(child);
        }
      });
    } else if (mesh.material) {
      mesh.material.color.setHex(0xFF0000);
      if (mesh.material.emissive !== undefined) {
        mesh.material.emissive.setHex(0xFF0000);
        mesh.material.emissiveIntensity = 1.0;
      }
    }
  }

  // Helper to restore original colors recursively
  restoreOriginalColors(mesh, index) {
    if (mesh instanceof THREE.Group) {
      mesh.children.forEach((child, i) => {
        if (child.material) {
          const original = this.originalColors.get(index + i);
          if (original) {
            child.material.color.setHex(original.color);
            if (child.material.emissive !== undefined) {
              child.material.emissive.setHex(original.emissive);
              child.material.emissiveIntensity = original.emissiveIntensity;
            }
          }
        }
        if (child instanceof THREE.Group) {
          this.restoreOriginalColors(child, index + i + 1);
        }
      });
    } else if (mesh.material) {
      const original = this.originalColors.get(index);
      if (original) {
        mesh.material.color.setHex(original.color);
        if (mesh.material.emissive !== undefined) {
          mesh.material.emissive.setHex(original.emissive);
          mesh.material.emissiveIntensity = original.emissiveIntensity;
        }
      }
    }
  }

  // Create hover highlight (border + transparent fill)
  createHoverHighlight() {
    if (this.hoverHighlightMesh || !this.scene || !this.tileGrid) return;

    const tileSize = this.tileGrid.tileSize;
    
    // Create transparent fill plane
    const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      opacity: 0.18,
      transparent: true,
      side: THREE.DoubleSide
    });
    this.hoverHighlightMesh = new THREE.Mesh(geometry, material);
    this.hoverHighlightMesh.rotation.x = -Math.PI / 2;
    this.hoverHighlightMesh.position.set(this.worldX, 0.02, this.worldZ);
    this.hoverHighlightMesh.visible = false;
    this.scene.add(this.hoverHighlightMesh);

    // Create border outline
    const halfSize = tileSize / 2;
    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfSize, 0.021, -halfSize),
      new THREE.Vector3(halfSize, 0.021, -halfSize),
      new THREE.Vector3(halfSize, 0.021, halfSize),
      new THREE.Vector3(-halfSize, 0.021, halfSize),
      new THREE.Vector3(-halfSize, 0.021, -halfSize) // Close the loop
    ]);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0xFFFFFF,
      linewidth: 2
    });
    this.hoverBorderLines = new THREE.Line(borderGeometry, edgeMaterial);
    this.hoverBorderLines.position.set(this.worldX, 0, this.worldZ);
    this.hoverBorderLines.visible = false;
    this.scene.add(this.hoverBorderLines);
  }

  // Show hover highlight with specified color (green for available, red for obstructed)
  showHoverHighlight(color) {
    // Create highlight if it doesn't exist
    if (!this.hoverHighlightMesh) {
      this.createHoverHighlight();
    }

    if (this.hoverHighlightMesh && this.hoverBorderLines) {
      // Update fill color
      if (this.hoverHighlightMesh.material) {
        this.hoverHighlightMesh.material.color.setHex(color);
      }
      
      // Update border color
      if (this.hoverBorderLines.material) {
        this.hoverBorderLines.material.color.setHex(color);
      }
      
      // Show both
      this.hoverHighlightMesh.visible = true;
      this.hoverBorderLines.visible = true;
    }
  }

  // Hide hover highlight
  hideHoverHighlight() {
    if (this.hoverHighlightMesh) {
      this.hoverHighlightMesh.visible = false;
    }
    if (this.hoverBorderLines) {
      this.hoverBorderLines.visible = false;
    }
  }

  // Clean up highlight when object is removed
  remove() {
    // Remove highlight meshes
    if (this.hoverHighlightMesh) {
      this.scene.remove(this.hoverHighlightMesh);
      if (this.hoverHighlightMesh.geometry) this.hoverHighlightMesh.geometry.dispose();
      if (this.hoverHighlightMesh.material) this.hoverHighlightMesh.material.dispose();
      this.hoverHighlightMesh = null;
    }
    if (this.hoverBorderLines) {
      this.scene.remove(this.hoverBorderLines);
      if (this.hoverBorderLines.geometry) this.hoverBorderLines.geometry.dispose();
      if (this.hoverBorderLines.material) this.hoverBorderLines.material.dispose();
      this.hoverBorderLines = null;
    }
    
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    const tile = this.tileGrid.getTile(this.tileX, this.tileZ);
    if (tile) {
      tile.occupied = false;
      tile.content = null; // Clear tile content
    }
  }
}
