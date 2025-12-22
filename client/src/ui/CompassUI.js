import * as THREE from 'three';

export class CompassUI {
  constructor(container, camera) {
    this.container = container;
    this.camera = camera;
    this.element = null;
    this.scaleContainer = null;
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'compass-ui';
    
    // Create horizontal scale compass
    const scaleHTML = this.generateScaleHTML();
    this.element.innerHTML = `
      <div class="compass-diamond"></div>
      <div class="compass-scale" id="compass-scale">
        ${scaleHTML}
      </div>
    `;
    
    // Get reference to scale container
    this.scaleContainer = this.element.querySelector('#compass-scale');

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #compass-ui {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        width: 720px;
        height: 60px;
        background: transparent;
        pointer-events: none;
        overflow: hidden;
      }

      .compass-diamond {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        background: #87CEEB;
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        filter: drop-shadow(0 0 3px rgba(135, 206, 235, 0.8));
        z-index: 1001;
        pointer-events: none;
      }

      .compass-scale {
        position: relative;
        width: 2880px;
        height: 100%;
        left: 50%;
        margin-left: -1440px;
        transform: translateX(0px);
        will-change: transform;
      }

      .compass-tick {
        position: absolute;
        top: 0;
        background: #ffffff;
        pointer-events: none;
      }

      .compass-tick.major {
        width: 2px;
        height: 20px;
        left: calc(50% + var(--tick-offset));
        transform: translateX(-50%);
      }

      .compass-tick.minor {
        width: 1px;
        height: 12px;
        left: calc(50% + var(--tick-offset));
        transform: translateX(-50%);
        top: 4px;
      }

      .compass-tick-label {
        position: absolute;
        top: 24px;
        left: calc(50% + var(--tick-offset));
        transform: translateX(-50%);
        color: #ffffff;
        font-size: 12px;
        font-weight: bold;
        font-family: Arial, sans-serif;
        text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        pointer-events: none;
      }

      .compass-direction-label {
        position: absolute;
        top: 24px;
        left: calc(50% + var(--tick-offset));
        transform: translateX(-50%);
        color: #ffffff;
        font-size: 14px;
        font-weight: bold;
        font-family: Arial, sans-serif;
        text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
        white-space: nowrap;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    if (!this.container.contains(this.element)) {
      this.container.appendChild(this.element);
    }
  }

  getDirectionLabel(degrees) {
    // Normalize to 0-360
    const normalized = ((degrees % 360) + 360) % 360;
    
    // Cardinal and intercardinal directions
    if (normalized === 0 || normalized === 360) return 'N';
    if (normalized === 45) return 'NE';
    if (normalized === 90) return 'E';
    if (normalized === 135) return 'SE';
    if (normalized === 180) return 'S';
    if (normalized === 225) return 'SW';
    if (normalized === 270) return 'W';
    if (normalized === 315) return 'NW';
    return null;
  }

  generateScaleHTML() {
    let html = '';
    const pixelsPerDegree = 2; // 2 pixels per degree for scale spacing
    
    // Generate ticks from -720 to +720 degrees (4 full rotations)
    // This ensures continuous wrapping without gaps
    for (let deg = -720; deg <= 720; deg += 10) {
      const normalizedDeg = ((deg % 360) + 360) % 360; // Normalize to 0-360
      const offset = deg * pixelsPerDegree;
      const directionLabel = this.getDirectionLabel(deg);
      
      if (deg % 30 === 0) {
        // Major tick
        html += `<div class="compass-tick major" style="--tick-offset: ${offset}px;"></div>`;
        
        // Add direction label if applicable, otherwise show degree number
        if (directionLabel) {
          html += `<div class="compass-direction-label" style="--tick-offset: ${offset}px;">${directionLabel}</div>`;
        } else {
          html += `<div class="compass-tick-label" style="--tick-offset: ${offset}px;">${normalizedDeg}</div>`;
        }
      } else {
        // Minor tick
        html += `<div class="compass-tick minor" style="--tick-offset: ${offset}px;"></div>`;
      }
    }
    
    return html;
  }

  update() {
    if (!this.camera || !this.scaleContainer) return;

    // Calculate camera heading (direction it's facing on XZ plane)
    // Get the camera's forward direction (in Three.js, forward is -Z in local space)
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    
    // Project onto XZ plane (ignore Y component for horizontal heading)
    const forwardXZ = new THREE.Vector3(forward.x, 0, forward.z);
    const length = Math.sqrt(forwardXZ.x * forwardXZ.x + forwardXZ.z * forwardXZ.z);
    if (length > 0) {
      forwardXZ.divideScalar(length);
    } else {
      // Fallback if length is 0
      forwardXZ.set(0, 0, 1);
    }
    
    // Calculate angle from north (positive Z direction)
    // In Three.js world space: North = +Z, East = +X, South = -Z, West = -X
    // atan2(x, z) gives angle: 0 = north (+Z), PI/2 = east (+X), PI = south (-Z), -PI/2 = west (-X)
    let angle = Math.atan2(forwardXZ.x, forwardXZ.z);
    
    // Convert to degrees (0-360)
    let degrees = (angle * 180 / Math.PI);
    if (degrees < 0) degrees += 360;
    
    // Translate the scale container horizontally so current heading appears at center
    // When camera faces North (0°), scale should show 0° at center (translateX(0))
    // When camera faces East (90°), we need to translate left by 180px to show 90° at center
    // pixelsPerDegree = 2, so offset = -degrees * 2
    const pixelsPerDegree = 2;
    const baseOffset = -degrees * pixelsPerDegree;
    
    // Wrap the offset to stay within the scale bounds for seamless continuous movement
    // Scale goes from -1440px to +1440px (center at 0), representing -720° to +720°
    // Wrap to keep offset in range [-720, 720] to match one full rotation range
    // This ensures the scale pattern repeats seamlessly
    const oneRotationPixels = 360 * pixelsPerDegree; // 720px per full rotation
    let wrappedOffset = baseOffset % oneRotationPixels;
    if (wrappedOffset > oneRotationPixels / 2) wrappedOffset -= oneRotationPixels;
    if (wrappedOffset < -oneRotationPixels / 2) wrappedOffset += oneRotationPixels;
    
    this.scaleContainer.style.transform = `translateX(${wrappedOffset}px)`;
  }
}
