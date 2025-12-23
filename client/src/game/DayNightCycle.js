import * as THREE from 'three';

export class DayNightCycle {
  constructor(scene, ambientLight, directionalLight) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.directionalLight = directionalLight;
    
    // Cycle timing: 15 min day, 5 min night = 20 min total
    this.dayDuration = 15 * 60; // 15 minutes in seconds
    this.nightDuration = 5 * 60; // 5 minutes in seconds
    this.totalCycleDuration = this.dayDuration + this.nightDuration;
    
    // Normalized time (0-1): 0 = dawn, 0.75 = dusk, 1 = dawn again
    this.cycleTime = 0;
    
    // Enable/disable flag
    this.enabled = true;
    
    // Pause flag (for manual time adjustment)
    this.paused = false;
    
    // Sky objects
    this.skySphere = null;
    this.sun = null;
    this.moon = null;
    this.stars = null;
    
    // Store references to lights
    this.ambientLight = ambientLight;
    this.directionalLight = directionalLight;
    
    this.createSkySphere();
    this.createSun();
    this.createMoon();
    this.createStars();
  }

  createSkySphere() {
    // Create a large sphere for the sky
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    
    // Create gradient material using shader
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87CEEB) }, // Sky blue
        bottomColor: { value: new THREE.Color(0xE0F6FF) }, // Light blue
        offset: { value: 0.0 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float f = pow(max(0.0, h), exponent);
          gl_FragColor = vec4(mix(bottomColor, topColor, f), 1.0);
        }
      `,
      side: THREE.BackSide // Render inside the sphere
    });
    
    this.skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skySphere);
  }

  createSun() {
    // Create sun as a bright glowing sphere
    const sunGeometry = new THREE.SphereGeometry(15, 16, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFAA,
      emissive: 0xFFFFAA,
      emissiveIntensity: 1.5
    });
    
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sun);
  }

  createMoon() {
    // Create moon as a gray sphere
    const moonGeometry = new THREE.SphereGeometry(12, 16, 16);
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xCCCCCC,
      emissive: 0x888888,
      emissiveIntensity: 0.3
    });
    
    this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
    this.scene.add(this.moon);
  }

  createStars() {
    // Create stars using a particle system
    const starCount = 2000;
    const starsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      // Random position on sphere surface
      const radius = 450 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Random star color (white to slightly blue)
      const brightness = 0.7 + Math.random() * 0.3;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness + 0.1;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0
    });
    
    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }

  update(deltaTime) {
    if (!this.enabled) {
      // When disabled, keep it at day time
      this.setTimeOfDay(0.25); // Mid-day
      return;
    }
    
    // Don't update cycle time if paused
    if (this.paused) {
      // Still update visuals in case time was manually changed
      this.updateSky();
      this.updateSunPosition();
      this.updateMoonPosition();
      this.updateStars();
      this.updateLighting();
      return;
    }
    
    // Update cycle time
    this.cycleTime += deltaTime / this.totalCycleDuration;
    if (this.cycleTime >= 1.0) {
      this.cycleTime -= 1.0;
    }
    
    this.updateSky();
    this.updateSunPosition();
    this.updateMoonPosition();
    this.updateStars();
    this.updateLighting();
  }

  setTimeOfDay(normalizedTime) {
    // Set time directly (0-1, where 0.25 is mid-day, 0.875 is mid-night)
    this.cycleTime = normalizedTime % 1.0;
    this.updateSky();
    this.updateSunPosition();
    this.updateMoonPosition();
    this.updateStars();
    this.updateLighting();
  }

  updateSky() {
    if (!this.skySphere || !this.skySphere.material.uniforms) return;
    
    const uniforms = this.skySphere.material.uniforms;
    
    // Determine if it's day or night
    const isDay = this.cycleTime < 0.75;
    
    if (isDay) {
      // Day time: bright blue sky
      const dayProgress = this.cycleTime / 0.75; // 0-1 during day
      
      // Morning to afternoon transition
      if (dayProgress < 0.5) {
        // Dawn to noon
        const t = dayProgress * 2; // 0-1
        uniforms.topColor.value.lerpColors(
          new THREE.Color(0xFF6B47), // Dawn orange
          new THREE.Color(0x87CEEB), // Sky blue
          t
        );
        uniforms.bottomColor.value.lerpColors(
          new THREE.Color(0xFFB347), // Dawn light orange
          new THREE.Color(0xE0F6FF), // Light blue
          t
        );
      } else {
        // Noon to dusk
        const t = (dayProgress - 0.5) * 2; // 0-1
        uniforms.topColor.value.lerpColors(
          new THREE.Color(0x87CEEB), // Sky blue
          new THREE.Color(0xFF6B47), // Dusk orange
          t
        );
        uniforms.bottomColor.value.lerpColors(
          new THREE.Color(0xE0F6FF), // Light blue
          new THREE.Color(0xFFB347), // Dusk light orange
          t
        );
      }
    } else {
      // Night time: dark blue/purple sky
      const nightProgress = (this.cycleTime - 0.75) / 0.25; // 0-1 during night
      
      uniforms.topColor.value.lerpColors(
        new THREE.Color(0xFF6B47), // Dusk orange
        new THREE.Color(0x0A0E27), // Dark blue/purple
        nightProgress
      );
      uniforms.bottomColor.value.lerpColors(
        new THREE.Color(0xFFB347), // Dusk light orange
        new THREE.Color(0x1A1A2E), // Darker blue
        nightProgress
      );
    }
  }

  updateSunPosition() {
    if (!this.sun) return;
    
    // Sun moves from east (left) to west (right) across the sky
    // At cycleTime 0 (dawn): sun at horizon, east
    // At cycleTime 0.5 (noon): sun at zenith
    // At cycleTime 0.75 (dusk): sun at horizon, west
    
    const radius = 400;
    const angle = this.cycleTime * Math.PI * 2; // Full rotation
    
    // Sun position: moves in a semicircle
    const sunAngle = this.cycleTime * Math.PI; // 0 to PI (dawn to dusk)
    const x = Math.cos(sunAngle) * radius;
    const y = Math.sin(sunAngle) * radius;
    const z = 0; // Sun moves in X-Y plane
    
    this.sun.position.set(x, y, z);
    
    // Make sun face the center
    this.sun.lookAt(0, 0, 0);
    
    // Adjust sun visibility and intensity based on time
    const isDay = this.cycleTime < 0.75;
    if (isDay) {
      this.sun.visible = true;
      const dayProgress = this.cycleTime / 0.75;
      // Brightest at noon (0.5), dimmer at dawn/dusk
      const intensity = 1.0 - Math.abs(dayProgress - 0.5) * 0.4;
      this.sun.material.emissiveIntensity = 1.5 * intensity;
    } else {
      // Hide sun during night
      this.sun.visible = false;
    }
  }

  updateMoonPosition() {
    if (!this.moon) return;
    
    // Moon moves opposite to sun
    // During night (0.75-1.0): moon moves from horizon east to horizon west
    // At cycleTime 0.75 (dusk): moon at horizon, east
    // At cycleTime 0.875 (mid-night): moon at zenith
    // At cycleTime 1.0 (dawn): moon at horizon, west
    
    const radius = 400;
    
    // Moon angle: during night, goes from PI (east horizon) to 2*PI (west horizon)
    // We want it to be visible during night phase (0.75-1.0)
    let moonAngle;
    if (this.cycleTime >= 0.75) {
      // Night phase: moon moves from PI to 2*PI
      const nightProgress = (this.cycleTime - 0.75) / 0.25;
      moonAngle = Math.PI + nightProgress * Math.PI; // PI to 2*PI
    } else {
      // Day phase: moon is below horizon (not visible), but we'll position it anyway
      // Position it opposite to sun
      moonAngle = this.cycleTime * Math.PI + Math.PI; // Sun angle + 180 degrees
    }
    
    const x = Math.cos(moonAngle) * radius;
    const y = Math.sin(moonAngle) * radius;
    const z = 0;
    
    this.moon.position.set(x, y, z);
    
    // Make moon face the center
    this.moon.lookAt(0, 0, 0);
    
    // Show moon during night, hide during day
    const isNight = this.cycleTime >= 0.75;
    this.moon.visible = isNight;
    
    if (isNight) {
      // Moon is brightest at mid-night (0.875)
      const nightProgress = (this.cycleTime - 0.75) / 0.25;
      const intensity = 0.3 + Math.abs(nightProgress - 0.5) * 0.2;
      this.moon.material.emissiveIntensity = intensity;
    }
  }

  updateStars() {
    if (!this.stars) return;
    
    const isNight = this.cycleTime >= 0.75;
    
    if (isNight) {
      // Fade in stars during night
      const nightProgress = (this.cycleTime - 0.75) / 0.25;
      // Stars fade in quickly at dusk, stay visible, fade out at dawn
      let opacity = 1.0;
      if (nightProgress < 0.1) {
        // Fade in
        opacity = nightProgress / 0.1;
      } else if (nightProgress > 0.9) {
        // Fade out
        opacity = (1.0 - nightProgress) / 0.1;
      }
      this.stars.material.opacity = opacity;
      this.stars.visible = true;
    } else {
      this.stars.visible = false;
    }
  }

  updateLighting() {
    if (!this.ambientLight || !this.directionalLight) return;
    
    const isDay = this.cycleTime < 0.75;
    
    if (isDay) {
      const dayProgress = this.cycleTime / 0.75;
      
      // Ambient light: brighter during day
      const ambientIntensity = 0.4 + Math.sin(dayProgress * Math.PI) * 0.3;
      this.ambientLight.intensity = ambientIntensity;
      this.ambientLight.color.setHex(0xffffff);
      
      // Directional light (sun): follows sun position
      const sunAngle = this.cycleTime * Math.PI;
      const radius = 200;
      const x = Math.cos(sunAngle) * radius;
      const y = Math.sin(sunAngle) * radius;
      this.directionalLight.position.set(x, y, 0);
      
      // Light intensity: brightest at noon
      const lightIntensity = 0.5 + Math.sin(dayProgress * Math.PI) * 0.4;
      this.directionalLight.intensity = lightIntensity;
      this.directionalLight.color.setHex(0xffffff);
    } else {
      // Night time: dim lighting
      const nightProgress = (this.cycleTime - 0.75) / 0.25;
      
      // Ambient light: very dim, slightly blue
      this.ambientLight.intensity = 0.1;
      this.ambientLight.color.setHex(0x4A5A7A); // Dark blue-gray
      
      // Directional light: follow moon position, very dim
      // Moon angle during night: PI to 2*PI
      const moonAngle = Math.PI + nightProgress * Math.PI;
      const radius = 200;
      const x = Math.cos(moonAngle) * radius;
      const y = Math.sin(moonAngle) * radius;
      this.directionalLight.position.set(x, y, 0);
      
      this.directionalLight.intensity = 0.1;
      this.directionalLight.color.setHex(0x6A7A9A); // Dim blue-gray
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      // Reset to day time when disabled
      this.setTimeOfDay(0.25);
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getCycleTime() {
    return this.cycleTime;
  }

  getFormattedTime() {
    // Format time as "Day HH:MM" or "Night HH:MM"
    const isDay = this.cycleTime < 0.75;
    let timeInPhase;
    let phaseName;
    
    if (isDay) {
      phaseName = 'Day';
      // Day phase: 0.0 - 0.75 (15 minutes)
      const dayProgress = this.cycleTime / 0.75;
      timeInPhase = dayProgress * this.dayDuration; // seconds into day phase
    } else {
      phaseName = 'Night';
      // Night phase: 0.75 - 1.0 (5 minutes)
      const nightProgress = (this.cycleTime - 0.75) / 0.25;
      timeInPhase = nightProgress * this.nightDuration; // seconds into night phase
    }
    
    const minutes = Math.floor(timeInPhase / 60);
    const seconds = Math.floor(timeInPhase % 60);
    
    return `${phaseName} ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  setPaused(paused) {
    this.paused = paused;
  }

  isPaused() {
    return this.paused;
  }
}

