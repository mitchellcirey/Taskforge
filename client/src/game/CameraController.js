import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.zoomSpeed = 0.1;
    this.panSpeed = 0.02;
    this.rotateSpeed = 0.005;
    
    // Track pressed keys for WASD panning
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse wheel for zoom
    this.domElement.addEventListener('wheel', (e) => this.onWheel(e), false);

    // Mouse drag for pan/rotate
    this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    this.domElement.addEventListener('mouseleave', (e) => this.onMouseUp(e), false);
    
    // Keyboard controls for WASD panning
    document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
  }

  onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY;
    // Inverted: scroll up zooms in, scroll down zooms out
    const zoomFactor = delta > 0 ? 1 - this.zoomSpeed : 1 + this.zoomSpeed;
    
    // Adjust orthographic camera zoom
    this.camera.zoom *= zoomFactor;
    this.camera.zoom = Math.max(0.5, Math.min(5, this.camera.zoom));
    this.camera.updateProjectionMatrix();
  }

  onMouseDown(event) {
    // Only start dragging with MMB (middle mouse button)
    if (event.button === 1) { // Middle mouse button
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    }
  }

  onMouseMove(event) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    // MMB (middle mouse button) - Pan camera back and forth
    if (event.buttons === 4) { // Middle mouse button
      if (event.shiftKey) {
        // Shift + MMB - Rotate camera around center
        const center = new THREE.Vector3(0, 0, 0);
        const radius = this.camera.position.distanceTo(center);
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position.clone().sub(center));
        
        spherical.theta -= deltaX * this.rotateSpeed;
        spherical.phi += deltaY * this.rotateSpeed;
        // Constrain phi to prevent camera from going below terrain
        // phi = 0 is straight up, phi = PI/2 is horizontal, phi = PI is straight down
        // Limit to prevent going below horizontal (keep camera above ground)
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, spherical.phi));
        
        this.camera.position.setFromSpherical(spherical);
        this.camera.position.add(center);
        
        // Ensure camera Y position is always above ground (Y >= 0)
        if (this.camera.position.y < 0.5) {
          this.camera.position.y = 0.5;
        }
        
        this.camera.lookAt(center);
      } else {
        // MMB alone - Pan camera horizontally and vertically (same as WASD)
        this.panCamera(deltaX, deltaY);
      }
    }

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  onMouseUp(event) {
    this.isDragging = false;
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      this.keys[key] = true;
    }
  }

  onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      this.keys[key] = false;
    }
  }

  panCamera(deltaX, deltaY, includeVertical = true) {
    // Calculate pan direction in camera's local space (same as MMB panning)
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);
    
    // Pan horizontally (XZ plane)
    const horizontalPanX = right.clone().multiplyScalar(-deltaX * this.panSpeed);
    const horizontalPanZ = forward.clone().multiplyScalar(-deltaY * this.panSpeed);
    
    // Combine horizontal movements
    this.camera.position.add(horizontalPanX);
    this.camera.position.add(horizontalPanZ);
    
    // Pan vertically (Y axis) - only if includeVertical is true (for MMB)
    if (includeVertical) {
      const verticalPan = up.clone().multiplyScalar(deltaY * this.panSpeed * 0.5);
      this.camera.position.add(verticalPan);
    }
    
    // Prevent camera from going below ground level
    if (this.camera.position.y < 0.5) {
      this.camera.position.y = 0.5;
    }
  }

  update(deltaTime) {
    // WASD keyboard panning (same behavior as MMB panning)
    let panX = 0;
    let panY = 0;
    
    if (this.keys.w) panY -= 1; // Forward
    if (this.keys.s) panY += 1; // Backward
    if (this.keys.a) panX += 1; // Left
    if (this.keys.d) panX -= 1; // Right
    
    if (panX !== 0 || panY !== 0) {
      // Normalize diagonal movement
      const length = Math.sqrt(panX * panX + panY * panY);
      if (length > 0) {
        panX /= length;
        panY /= length;
      }
      
      // Apply panning - simulate pixel-like movement for smooth WASD
      // Use a speed that feels similar to MMB dragging (pixels per second)
      // MMB typically moves at ~1-2 pixels per frame, so we simulate that
      const pixelsPerSecond = 60; // Reasonable speed for keyboard input
      const deltaX = panX * pixelsPerSecond * deltaTime;
      const deltaY = panY * pixelsPerSecond * deltaTime;
      
      // Call panCamera with same signature as MMB (includeVertical = false for horizontal-only panning)
      this.panCamera(deltaX, deltaY, false);
    }
    
    // Constrain camera position to prevent going below terrain
    if (this.camera.position.y < 0.5) {
      this.camera.position.y = 0.5;
    }
  }
}

