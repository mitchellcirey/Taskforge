import * as THREE from 'three';
import { ItemType } from '../ItemType.js';

/**
 * Wood item type (resource)
 */
export class Wood extends ItemType {
  constructor() {
    super('wood', 'Wood');
    this.color = 0x8B4513; // Brown
  }

  getSpeedModifier() {
    return 0.5; // Logs slow down movement to 50% speed
  }

  getHandPosition() {
    return [0, 0.5, 0.15]; // Logs are held with 2 hands (centered, in front of player)
  }

  canAddToInventory(inventoryInfo) {
    // Logs can only be carried one at a time
    if (inventoryInfo.hasItem('wood', 1)) {
      return false; // Already carrying a log
    }
    return true;
  }

  getHandModel(scale = 1.0) {
    // Create full-size log for the hand (matching the Resource design exactly)
    const logGroup = new THREE.Group();
    const logLength = 2.3; // Full size - slightly longer than tile size (2.0)
    const logRadius = 0.25; // Full size radius
    
    // Log body - faceted cylinder (octagonal, 8 sides)
    const logBodyGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
    const logBodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B6F47, // Medium desaturated brown
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    const logBody = new THREE.Mesh(logBodyGeometry, logBodyMaterial);
    logBody.rotation.z = Math.PI / 2; // Rotate to be horizontal
    logGroup.add(logBody);
    
    // End caps (beige)
    const endCapMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xD4C4A8, // Light beige/grayish-tan
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    // Front end cap
    const frontEndCapGeometry = new THREE.CylinderGeometry(logRadius, logRadius, 0.05, 8);
    const frontEndCap = new THREE.Mesh(frontEndCapGeometry, endCapMaterial);
    frontEndCap.rotation.z = Math.PI / 2;
    frontEndCap.position.set(logLength / 2, 0, 0);
    logGroup.add(frontEndCap);
    
    // Back end cap
    const backEndCapGeometry = new THREE.CylinderGeometry(logRadius, logRadius, 0.05, 8);
    const backEndCap = new THREE.Mesh(backEndCapGeometry, endCapMaterial);
    backEndCap.rotation.z = Math.PI / 2;
    backEndCap.position.set(-logLength / 2, 0, 0);
    logGroup.add(backEndCap);
    
    // Add concentric rings on end caps
    const ringMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xC4B498, // Slightly darker beige for rings
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    // Front end rings
    for (let i = 1; i <= 2; i++) {
      const ringRadius = logRadius * (1 - i * 0.3);
      if (ringRadius > 0.05) {
        const ringGeometry = new THREE.RingGeometry(ringRadius * 0.7, ringRadius, 8);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(logLength / 2 + 0.026, 0, 0);
        logGroup.add(ring);
      }
    }
    
    // Back end rings
    for (let i = 1; i <= 2; i++) {
      const ringRadius = logRadius * (1 - i * 0.3);
      if (ringRadius > 0.05) {
        const ringGeometry = new THREE.RingGeometry(ringRadius * 0.7, ringRadius, 8);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(-logLength / 2 - 0.026, 0, 0);
        logGroup.add(ring);
      }
    }
    
    // Rotate log to be held horizontally (perpendicular to player, for 2-hand carry)
    // Log body is already horizontal (pointing along X axis from rotation.z = Math.PI/2)
    // Just rotate around Y to make it perpendicular to player (pointing along Z axis)
    logGroup.rotation.y = Math.PI / 2;
    
    return logGroup;
  }

  _buildWorldModel() {
    // Create a low-poly faceted log (like the image)
    const logGroup = new THREE.Group();
    
    // Log body - faceted cylinder (octagonal, 8 sides) slightly longer than 1 tile (2.0 -> 2.3 units)
    const logLength = 2.3; // Slightly longer than tile size (2.0)
    const logRadius = 0.25; // Radius of the log
    const logBodyGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8); // 8 sides for faceted look
    const logBodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B6F47, // Medium desaturated brown (similar to tree trunk)
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true // Low-poly faceted look
    });
    const logBody = new THREE.Mesh(logBodyGeometry, logBodyMaterial);
    logBody.rotation.z = Math.PI / 2; // Rotate to be horizontal
    logBody.position.y = logRadius; // Position so bottom touches ground
    logBody.castShadow = true;
    logBody.receiveShadow = true;
    logGroup.add(logBody);
    
    // End caps (beige with concentric ring pattern)
    const endCapMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xD4C4A8, // Light beige/grayish-tan
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    // Front end cap
    const frontEndCapGeometry = new THREE.CylinderGeometry(logRadius, logRadius, 0.05, 8);
    const frontEndCap = new THREE.Mesh(frontEndCapGeometry, endCapMaterial);
    frontEndCap.rotation.z = Math.PI / 2;
    frontEndCap.position.set(logLength / 2, logRadius, 0);
    frontEndCap.castShadow = true;
    frontEndCap.receiveShadow = true;
    logGroup.add(frontEndCap);
    
    // Back end cap
    const backEndCapGeometry = new THREE.CylinderGeometry(logRadius, logRadius, 0.05, 8);
    const backEndCap = new THREE.Mesh(backEndCapGeometry, endCapMaterial);
    backEndCap.rotation.z = Math.PI / 2;
    backEndCap.position.set(-logLength / 2, logRadius, 0);
    backEndCap.castShadow = true;
    backEndCap.receiveShadow = true;
    logGroup.add(backEndCap);
    
    // Add concentric rings on end caps (simple rings for wood grain effect)
    const ringMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xC4B498, // Slightly darker beige for rings
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    // Front end rings
    for (let i = 1; i <= 2; i++) {
      const ringRadius = logRadius * (1 - i * 0.3);
      if (ringRadius > 0.05) {
        const ringGeometry = new THREE.RingGeometry(ringRadius * 0.7, ringRadius, 8);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(logLength / 2 + 0.026, logRadius, 0);
        logGroup.add(ring);
      }
    }
    
    // Back end rings
    for (let i = 1; i <= 2; i++) {
      const ringRadius = logRadius * (1 - i * 0.3);
      if (ringRadius > 0.05) {
        const ringGeometry = new THREE.RingGeometry(ringRadius * 0.7, ringRadius, 8);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(-logLength / 2 - 0.026, logRadius, 0);
        logGroup.add(ring);
      }
    }
    
    return logGroup;
  }
}

