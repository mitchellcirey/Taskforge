import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement, mapBounds = null, player = null) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Map bounds (if provided) - { minX, maxX, minZ, maxZ }
    this.mapBounds = mapBounds;
    
    // Player reference for centering camera
    this.player = player;
    
    // Focus point on ground plane (y=0)
    this.focusPoint = new THREE.Vector3(0, 0, 0);
    
    // Yaw angle (rotation around Y-axis, 0-2π)
    this.yaw = Math.PI / 4; // 45 degrees initial
    
    // Pitch angle (45 degrees minimum, can go higher but not lower)
    this.pitch = Math.PI / 4; // 45 degrees default
    this.minPitch = Math.PI / 4; // 45 degrees minimum
    this.maxPitch = Math.PI / 2.2; // ~82 degrees maximum (prevent going too vertical)
    
    // Distance from focus point (controls zoom)
    this.distance = 40;
    this.minDistance = 10;
    this.maxDistance = 75; // Max zoom distance
    
    // Movement speeds (constant, no acceleration)
    this.panSpeed = 40.0; // units per second (increased for faster WASD movement)
    this.rotateSpeed = 0.005; // radians per pixel for mouse drag
    this.zoomSpeed = 0.15; // zoom factor per scroll step
    
    // Mouse state
    this.isDragging = false;
    this.isRotating = false; // Track if we're rotating (SHIFT+MMB)
    this.previousMousePosition = { x: 0, y: 0 };
    
    // Keyboard state
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      arrowup: false,
      arrowdown: false,
      arrowleft: false,
      arrowright: false
    };
    
    // Raycaster for cursor-to-ground calculations
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    
    // Initialize camera position
    this.updateCameraPosition();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse wheel for zoom
    this.domElement.addEventListener('wheel', (e) => this.onWheel(e), false);

    // Mouse drag for panning
    this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e), false);
    this.domElement.addEventListener('mouseleave', (e) => this.onMouseUp(e), false);
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
  }

  /**
   * Updates camera position based on focus point, yaw, distance, and pitch
   */
  updateCameraPosition() {
    // Calculate camera position using spherical coordinates
    // x = focus.x + distance * sin(yaw) * cos(pitch)
    // y = distance * sin(pitch)
    // z = focus.z + distance * cos(yaw) * cos(pitch)
    
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);
    
    this.camera.position.x = this.focusPoint.x + this.distance * sinYaw * cosPitch;
    this.camera.position.y = this.distance * sinPitch;
    this.camera.position.z = this.focusPoint.z + this.distance * cosYaw * cosPitch;
    
    // Camera always looks at focus point
    this.camera.lookAt(this.focusPoint);
    this.camera.up.set(0, 1, 0);
  }

  /**
   * Gets the world position on ground plane from screen coordinates
   */
  getWorldPositionFromScreen(x, y) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectionPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersectionPoint);
    return intersectionPoint;
  }

  /**
   * Zoom centered on cursor position
   */
  onWheel(event) {
    event.preventDefault();
    
    // Get cursor position on ground plane before zoom (target point to keep fixed)
    const targetPointBefore = this.getWorldPositionFromScreen(event.clientX, event.clientY);
    
    // Calculate zoom factor
    const delta = event.deltaY;
    const zoomFactor = delta > 0 ? (1 + this.zoomSpeed) : (1 - this.zoomSpeed);
    
    // Store old distance
    const oldDistance = this.distance;
    
    // Adjust distance (clamp to min/max)
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance * zoomFactor));
    
    // Only adjust focus if distance actually changed
    if (Math.abs(this.distance - oldDistance) > 0.001) {
      // Temporarily update camera position to see where cursor points after zoom
      this.updateCameraPosition();
      
      // Get cursor position on ground plane after zoom
      const targetPointAfter = this.getWorldPositionFromScreen(event.clientX, event.clientY);
      
      // Calculate the offset needed to keep the target point fixed
      const offsetX = targetPointBefore.x - targetPointAfter.x;
      const offsetZ = targetPointBefore.z - targetPointAfter.z;
      
      // Adjust focus point to compensate for the shift
      this.focusPoint.x += offsetX;
      this.focusPoint.z += offsetZ;
      
      // Clamp to bounds before final update
      this.clampFocusToBounds();
      
      // Update camera position again with corrected focus
      this.updateCameraPosition();
    }
  }

  onMouseDown(event) {
    // Middle mouse button
    if (event.button === 1) {
      // SHIFT+MMB for rotation, MMB alone for panning
      if (event.shiftKey) {
        this.isRotating = true;
      } else {
        this.isDragging = true;
      }
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    }
  }

  onMouseMove(event) {
    if (event.buttons === 4) { // Middle mouse button pressed
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;
      
      if (event.shiftKey || this.isRotating) {
        // SHIFT+MMB: Rotate camera (yaw with deltaX, pitch with deltaY)
        this.yaw -= deltaX * this.rotateSpeed;
        // Wrap yaw to [0, 2π)
        if (this.yaw < 0) this.yaw += Math.PI * 2;
        if (this.yaw >= Math.PI * 2) this.yaw -= Math.PI * 2;
        
        // Adjust pitch with deltaY, but clamp to minimum of 45 degrees
        this.pitch += deltaY * this.rotateSpeed;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        
        this.updateCameraPosition();
      } else if (this.isDragging) {
        // MMB alone: Pan camera (horizontal only, no vertical)
        this.panCamera(deltaX, deltaY, false);
      }
      
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    }
  }

  onMouseUp(event) {
    this.isDragging = false;
    this.isRotating = false;
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = true;
      event.preventDefault();
    }
    
    // Handle 'C' key to center camera on player
    if (key === 'c' && this.player && this.player.mesh) {
      this.centerOnPlayer();
      event.preventDefault();
    }
  }

  onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = false;
      event.preventDefault();
    }
  }

  /**
   * Pan camera by moving focus point on XZ plane
   * @param {number} deltaX - Mouse delta X or keyboard input X
   * @param {number} deltaY - Mouse delta Y or keyboard input Y
   * @param {boolean} isKeyboard - Whether input is from keyboard (affects direction mapping)
   */
  panCamera(deltaX, deltaY, isKeyboard = false) {
    if (isKeyboard) {
      // Keyboard panning: Use camera's forward/right vectors
      // Forward is the direction from camera to focus point (normalized to XZ plane)
      const forward = new THREE.Vector3()
        .subVectors(this.focusPoint, this.camera.position)
        .normalize();
      forward.y = 0; // Project to XZ plane
      forward.normalize();
      
      // Right is perpendicular to forward (rotate 90 degrees around Y axis)
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      
      // deltaX/deltaY are already scaled by panSpeed * deltaTime
      this.focusPoint.add(right.clone().multiplyScalar(deltaX));
      this.focusPoint.add(forward.clone().multiplyScalar(deltaY));
    } else {
      // Mouse panning: Use same forward/right vectors but with screen-space mapping
      // Forward is the direction from camera to focus point (normalized to XZ plane)
      const forward = new THREE.Vector3()
        .subVectors(this.focusPoint, this.camera.position)
        .normalize();
      forward.y = 0; // Project to XZ plane
      forward.normalize();
      
      // Right is perpendicular to forward (rotate 90 degrees around Y axis)
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      
      // For mouse drag: drag right moves view right (focus moves left), drag up moves view up (focus moves backward)
      const panScale = 0.04; // Scale pixels to world units (increased for faster MMB movement)
      this.focusPoint.sub(right.clone().multiplyScalar(deltaX * panScale)); // drag right = focus moves left = view moves right
      this.focusPoint.add(forward.clone().multiplyScalar(deltaY * panScale)); // drag up (negative deltaY) = focus moves backward = view moves up
    }
    
    // Ensure focus point stays on ground plane
    this.focusPoint.y = 0;
    
    // Clamp focus point to map bounds if provided
    this.clampFocusToBounds();
    
    this.updateCameraPosition();
  }

  /**
   * Clamp focus point to map bounds
   */
  clampFocusToBounds() {
    if (this.mapBounds) {
      this.focusPoint.x = Math.max(this.mapBounds.minX, Math.min(this.mapBounds.maxX, this.focusPoint.x));
      this.focusPoint.z = Math.max(this.mapBounds.minZ, Math.min(this.mapBounds.maxZ, this.focusPoint.z));
    }
  }

  /**
   * Center camera on player
   */
  centerOnPlayer() {
    if (this.player && this.player.mesh) {
      // Set focus point to player's position on the ground plane
      this.focusPoint.x = this.player.mesh.position.x;
      this.focusPoint.z = this.player.mesh.position.z;
      this.focusPoint.y = 0; // Ensure focus is on ground plane
      
      // Clamp to bounds if provided
      this.clampFocusToBounds();
      
      // Update camera position
      this.updateCameraPosition();
    }
  }

  update(deltaTime) {
    // Handle WASD/Arrow key panning (fixed inverted controls)
    let panX = 0;
    let panY = 0;
    
    if (this.keys.w || this.keys.arrowup) panY += 1; // Forward
    if (this.keys.s || this.keys.arrowdown) panY -= 1; // Backward
    if (this.keys.a || this.keys.arrowleft) panX -= 1; // Left
    if (this.keys.d || this.keys.arrowright) panX += 1; // Right
    
    // Normalize diagonal movement for constant speed
    if (panX !== 0 || panY !== 0) {
      const length = Math.sqrt(panX * panX + panY * panY);
      if (length > 0) {
        panX /= length;
        panY /= length;
      }
      
      // Convert to world units per frame
      const panSpeedThisFrame = this.panSpeed * deltaTime;
      this.panCamera(panX * panSpeedThisFrame, panY * panSpeedThisFrame, true);
    }
  }
}
