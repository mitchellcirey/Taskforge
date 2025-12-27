import * as THREE from 'three';

export class WeatherManager {
  constructor(scene, audioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    
    // Weather states
    this.WEATHER_CLEAR = 'clear';
    this.WEATHER_RAIN = 'rain';
    
    // Current weather state
    this.currentWeather = this.WEATHER_CLEAR;
    
    // Enable/disable flag
    this.enabled = true;
    
    // Rain particle system
    this.rainParticles = null;
    this.rainGeometry = null;
    this.rainMaterial = null;
    this.rainCount = 1500; // Number of rain particles
    this.rainSpeed = 15; // Speed of falling rain
    
    // Random weather transition timing
    this.timeUntilNextChange = 0;
    this.minWeatherDuration = 60; // Minimum 60 seconds between changes
    this.maxWeatherDuration = 180; // Maximum 180 seconds between changes
    
    // Rain area bounds (covers visible area around camera)
    this.rainAreaSize = 100; // Size of rain area (100x100 units)
    this.rainHeight = 50; // Height where rain starts falling
    
    // Initialize rain system
    this.createRainSystem();
    
    // Schedule first random weather change
    this.scheduleNextWeatherChange();
  }

  createRainSystem() {
    // Create geometry for rain particles
    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount * 3);
    
    // Initialize particle positions and velocities
    for (let i = 0; i < this.rainCount; i++) {
      const i3 = i * 3;
      // Random position in rain area
      positions[i3] = (Math.random() - 0.5) * this.rainAreaSize;
      positions[i3 + 1] = Math.random() * this.rainHeight;
      positions[i3 + 2] = (Math.random() - 0.5) * this.rainAreaSize;
      
      // Random velocity (falling speed varies slightly)
      velocities[i3] = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
      velocities[i3 + 1] = -(this.rainSpeed + Math.random() * 2); // Falling speed
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
    }
    
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    // Create material for rain
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0xAAAAAA,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle system
    this.rainParticles = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  update(deltaTime, cameraPosition = null) {
    // Update random weather transitions if enabled
    if (this.enabled) {
      this.timeUntilNextChange -= deltaTime;
      if (this.timeUntilNextChange <= 0) {
        this.changeWeatherRandomly();
        this.scheduleNextWeatherChange();
      }
    }
    
    // Update rain particles if raining
    if (this.currentWeather === this.WEATHER_RAIN && this.rainParticles) {
      this.updateRainParticles(deltaTime, cameraPosition);
    }
  }

  updateRainParticles(deltaTime, cameraPosition = null) {
    if (!this.rainParticles || !this.rainParticles.visible) return;
    
    const positions = this.rainGeometry.attributes.position;
    const velocities = this.rainGeometry.attributes.velocity;
    
    // Center rain system around camera if position provided
    const centerX = cameraPosition ? cameraPosition.x : 0;
    const centerZ = cameraPosition ? cameraPosition.z : 0;
    
    for (let i = 0; i < this.rainCount; i++) {
      const i3 = i * 3;
      
      // Update position based on velocity
      positions.array[i3] += velocities.array[i3] * deltaTime;
      positions.array[i3 + 1] += velocities.array[i3 + 1] * deltaTime;
      positions.array[i3 + 2] += velocities.array[i3 + 2] * deltaTime;
      
      // Reset particle if it falls below ground
      if (positions.array[i3 + 1] < -5) {
        positions.array[i3] = centerX + (Math.random() - 0.5) * this.rainAreaSize;
        positions.array[i3 + 1] = this.rainHeight + Math.random() * 10;
        positions.array[i3 + 2] = centerZ + (Math.random() - 0.5) * this.rainAreaSize;
      }
      
      // Keep particles within rain area bounds (wrap around horizontally)
      if (Math.abs(positions.array[i3] - centerX) > this.rainAreaSize / 2) {
        positions.array[i3] = centerX + (Math.random() - 0.5) * this.rainAreaSize;
      }
      if (Math.abs(positions.array[i3 + 2] - centerZ) > this.rainAreaSize / 2) {
        positions.array[i3 + 2] = centerZ + (Math.random() - 0.5) * this.rainAreaSize;
      }
    }
    
    positions.needsUpdate = true;
    
    // Update rain particle system position to follow camera
    if (cameraPosition) {
      this.rainParticles.position.set(0, 0, 0); // Particles are positioned relative to world
    }
  }

  scheduleNextWeatherChange() {
    // Schedule next weather change at random interval
    const duration = this.minWeatherDuration + 
                     Math.random() * (this.maxWeatherDuration - this.minWeatherDuration);
    this.timeUntilNextChange = duration;
  }

  changeWeatherRandomly() {
    if (!this.enabled) return;
    
    // Randomly choose between clear and rain
    const newWeather = Math.random() < 0.5 ? this.WEATHER_CLEAR : this.WEATHER_RAIN;
    this.setWeather(newWeather);
  }

  setWeather(weatherType) {
    if (weatherType !== this.WEATHER_CLEAR && weatherType !== this.WEATHER_RAIN) {
      console.warn('Invalid weather type:', weatherType);
      return;
    }
    
    const wasRaining = this.currentWeather === this.WEATHER_RAIN;
    this.currentWeather = weatherType;
    
    // Show/hide rain particles
    if (this.rainParticles) {
      this.rainParticles.visible = (weatherType === this.WEATHER_RAIN);
    }
    
    // Handle rain sound
    if (weatherType === this.WEATHER_RAIN && !wasRaining) {
      // Start raining - play rain sound
      if (this.audioManager && this.audioManager.sounds && this.audioManager.sounds.has('rain')) {
        const rainSound = this.audioManager.sounds.get('rain');
        if (rainSound) {
          rainSound.loop = true;
          rainSound.volume = this.audioManager.sfxVolume * 0.5; // Rain at 50% of SFX volume
          rainSound.muted = this.audioManager.sfxMuted;
          rainSound.play().catch(e => {
            console.warn('Could not play rain sound:', e);
          });
        }
      }
    } else if (weatherType === this.WEATHER_CLEAR && wasRaining) {
      // Stop raining - stop rain sound
      if (this.audioManager && this.audioManager.sounds && this.audioManager.sounds.has('rain')) {
        const rainSound = this.audioManager.sounds.get('rain');
        if (rainSound) {
          rainSound.pause();
          rainSound.currentTime = 0;
        }
      }
    }
  }

  isRaining() {
    return this.currentWeather === this.WEATHER_RAIN;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    
    // If disabling, stop rain if it's currently raining
    if (!enabled && this.currentWeather === this.WEATHER_RAIN) {
      this.setWeather(this.WEATHER_CLEAR);
    }
  }

  getCurrentWeather() {
    return this.currentWeather;
  }

  // Cleanup method for when scene is destroyed
  dispose() {
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainGeometry.dispose();
      this.rainMaterial.dispose();
      this.rainParticles = null;
      this.rainGeometry = null;
      this.rainMaterial = null;
    }
    
    // Stop rain sound
    if (this.audioManager && this.audioManager.sounds && this.audioManager.sounds.has('rain')) {
      const rainSound = this.audioManager.sounds.get('rain');
      if (rainSound) {
        rainSound.pause();
        rainSound.currentTime = 0;
      }
    }
  }
}

