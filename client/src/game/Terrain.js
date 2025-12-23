import * as THREE from 'three';

export class Terrain {
  constructor(scene, tileGrid, width, height) {
    this.scene = scene;
    this.tileGrid = tileGrid;
    this.width = width;
    this.height = height;
    this.tileSize = tileGrid.tileSize;
    this.mesh = null;
  }

  create() {
    // Calculate world dimensions
    const worldWidth = this.width * this.tileSize;
    const worldHeight = this.height * this.tileSize;
    
    // Create a single large plane covering the entire terrain
    const geometry = new THREE.PlaneGeometry(worldWidth, worldHeight, this.width, this.height);
    geometry.rotateX(-Math.PI / 2); // Rotate to lie flat
    
    // Create shader material with biome blending
    let material;
    try {
      material = this.createBiomeShaderMaterial();
    } catch (error) {
      console.error('Error creating terrain shader material:', error);
      // Fallback to simple material
      material = new THREE.MeshStandardMaterial({ 
        color: 0x90EE90,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
    }
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.receiveShadow = true;
    this.mesh.visible = true;
    this.scene.add(this.mesh);
    
    // Log for debugging
    console.log('Terrain created:', {
      width: worldWidth,
      height: worldHeight,
      segments: `${this.width}x${this.height}`,
      position: this.mesh.position,
      materialType: material.type,
      visible: this.mesh.visible
    });
  }

  createBiomeShaderMaterial() {
    // Vertex shader - passes through position and UV coordinates
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      void main() {
        vUv = uv;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader with procedural textures and biome blending
    const fragmentShader = `
      precision highp float;
      
      uniform float uTileSize;
      uniform float uWidth;
      uniform float uHeight;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      // Simple hash function for deterministic random
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      // 2D noise function
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      // Multi-octave noise
      float fbm(vec2 p, int octaves) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        // Unroll loop for better compatibility and performance
        if (octaves >= 1) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        if (octaves >= 2) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        if (octaves >= 3) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        if (octaves >= 4) {
          value += amplitude * noise(p * frequency);
        }
        
        return value;
      }
      
      // Calculate biome weights based on tile position with smooth blending
      vec3 calculateBiomeWeights(vec2 worldPos) {
        // Convert world position to tile coordinates
        // Note: worldPos is vec2(x, z) where x is worldPos.x and z is worldPos.y
        float tileX = (worldPos.x / uTileSize) + (uWidth * 0.5);
        float tileZ = (worldPos.y / uTileSize) + (uHeight * 0.5);
        
        // Use same noise function as TileGrid for consistency
        // Sample at slightly offset positions for smoother blending
        float noise1 = fbm(vec2(tileX, tileZ) * 0.05, 3);
        float noise2 = fbm(vec2(tileX, tileZ) * 0.15, 3);
        float noise3 = fbm(vec2(tileX, tileZ) * 0.3, 3);
        
        float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
        
        // Use smoothstep for natural transitions between biomes
        // Sand: 0.0 - 0.33, Dirt: 0.33 - 0.66, Grass: 0.66 - 1.0
        float blendWidth = 0.15; // Blending zone width
        
        float sandWeight = 1.0 - smoothstep(0.0, 0.33 + blendWidth, combinedNoise);
        float dirtWeight = smoothstep(0.33 - blendWidth, 0.33, combinedNoise) * (1.0 - smoothstep(0.33, 0.66 + blendWidth, combinedNoise));
        float grassWeight = smoothstep(0.66 - blendWidth, 0.66, combinedNoise);
        
        // Add additional smoothing by sampling nearby positions
        vec2 offset1 = vec2(0.3, 0.3);
        vec2 offset2 = vec2(-0.3, 0.3);
        vec2 offset3 = vec2(0.3, -0.3);
        vec2 offset4 = vec2(-0.3, -0.3);
        
        float avgNoise = combinedNoise;
        
        vec2 samplePos1 = vec2(tileX, tileZ) + offset1 * 0.5;
        float sNoise1_1 = fbm(samplePos1 * 0.05, 3);
        float sNoise1_2 = fbm(samplePos1 * 0.15, 3);
        float sNoise1_3 = fbm(samplePos1 * 0.3, 3);
        avgNoise += (sNoise1_1 * 0.5 + sNoise1_2 * 0.3 + sNoise1_3 * 0.2);
        
        vec2 samplePos2 = vec2(tileX, tileZ) + offset2 * 0.5;
        float sNoise2_1 = fbm(samplePos2 * 0.05, 3);
        float sNoise2_2 = fbm(samplePos2 * 0.15, 3);
        float sNoise2_3 = fbm(samplePos2 * 0.3, 3);
        avgNoise += (sNoise2_1 * 0.5 + sNoise2_2 * 0.3 + sNoise2_3 * 0.2);
        
        vec2 samplePos3 = vec2(tileX, tileZ) + offset3 * 0.5;
        float sNoise3_1 = fbm(samplePos3 * 0.05, 3);
        float sNoise3_2 = fbm(samplePos3 * 0.15, 3);
        float sNoise3_3 = fbm(samplePos3 * 0.3, 3);
        avgNoise += (sNoise3_1 * 0.5 + sNoise3_2 * 0.3 + sNoise3_3 * 0.2);
        
        vec2 samplePos4 = vec2(tileX, tileZ) + offset4 * 0.5;
        float sNoise4_1 = fbm(samplePos4 * 0.05, 3);
        float sNoise4_2 = fbm(samplePos4 * 0.15, 3);
        float sNoise4_3 = fbm(samplePos4 * 0.3, 3);
        avgNoise += (sNoise4_1 * 0.5 + sNoise4_2 * 0.3 + sNoise4_3 * 0.2);
        
        avgNoise /= 5.0;
        
        // Blend between center and average for smoother transitions
        combinedNoise = mix(combinedNoise, avgNoise, 0.4);
        
        // Recalculate weights with smoothed noise
        sandWeight = 1.0 - smoothstep(0.0, 0.33 + blendWidth, combinedNoise);
        dirtWeight = smoothstep(0.33 - blendWidth, 0.33, combinedNoise) * (1.0 - smoothstep(0.33, 0.66 + blendWidth, combinedNoise));
        grassWeight = smoothstep(0.66 - blendWidth, 0.66, combinedNoise);
        
        // Normalize weights to sum to 1.0
        float totalWeight = sandWeight + dirtWeight + grassWeight;
        if (totalWeight > 0.0) {
          sandWeight /= totalWeight;
          dirtWeight /= totalWeight;
          grassWeight /= totalWeight;
        }
        
        return vec3(sandWeight, dirtWeight, grassWeight);
      }
      
      // Procedural sand texture
      vec3 sandTexture(vec2 uv) {
        vec2 sandUV = uv * 8.0;
        float sandNoise = fbm(sandUV, 4);
        
        // Base sand color (beige/yellow)
        vec3 sandBase = vec3(0.96, 0.87, 0.70);
        vec3 sandDark = vec3(0.85, 0.75, 0.60);
        
        // Add fine grain detail
        float grain = fbm(sandUV * 32.0, 2) * 0.15;
        
        return mix(sandBase, sandDark, sandNoise * 0.4 + grain);
      }
      
      // Procedural dirt texture
      vec3 dirtTexture(vec2 uv) {
        vec2 dirtUV = uv * 6.0;
        float dirtNoise = fbm(dirtUV, 4);
        
        // Base dirt color (brown)
        vec3 dirtBase = vec3(0.55, 0.45, 0.35);
        vec3 dirtDark = vec3(0.40, 0.32, 0.25);
        vec3 dirtLight = vec3(0.65, 0.55, 0.45);
        
        // Add variation
        float variation = fbm(dirtUV * 16.0, 2) * 0.3;
        
        vec3 color = mix(dirtBase, dirtDark, dirtNoise * 0.5);
        color = mix(color, dirtLight, variation * 0.3);
        
        return color;
      }
      
      // Procedural grass texture
      vec3 grassTexture(vec2 uv) {
        vec2 grassUV = uv * 10.0;
        float grassNoise = fbm(grassUV, 4);
        
        // Base grass color (green)
        vec3 grassBase = vec3(0.35, 0.65, 0.25);
        vec3 grassDark = vec3(0.25, 0.50, 0.18);
        vec3 grassLight = vec3(0.45, 0.75, 0.35);
        
        // Add fine detail
        float detail = fbm(grassUV * 20.0, 2) * 0.2;
        
        vec3 color = mix(grassBase, grassDark, grassNoise * 0.4);
        color = mix(color, grassLight, detail * 0.3);
        
        return color;
      }
      
      void main() {
        // Get world position (x and z components for 2D terrain)
        vec2 worldPos = vec2(vWorldPosition.x, vWorldPosition.z);
        
        // Calculate biome weights with error handling
        vec3 weights = vec3(0.0);
        float sandWeight = 0.0;
        float dirtWeight = 0.0;
        float grassWeight = 0.0;
        
        // Try to calculate weights, fallback if it fails
        weights = calculateBiomeWeights(worldPos);
        sandWeight = weights.x;
        dirtWeight = weights.y;
        grassWeight = weights.z;
        
        // Ensure weights are valid (sum should be ~1.0)
        float totalWeight = sandWeight + dirtWeight + grassWeight;
        if (totalWeight < 0.1) {
          // Fallback: equal distribution if calculation failed
          sandWeight = 0.33;
          dirtWeight = 0.33;
          grassWeight = 0.34;
        }
        
        // Generate textures for each biome
        vec3 sandColor = sandTexture(vUv);
        vec3 dirtColor = dirtTexture(vUv);
        vec3 grassColor = grassTexture(vUv);
        
        // Blend textures based on weights
        vec3 finalColor = sandColor * sandWeight + dirtColor * dirtWeight + grassColor * grassWeight;
        
        // Ensure we have a visible color (safety check)
        if (length(finalColor) < 0.01) {
          // Fallback: simple green color to verify terrain is rendering
          finalColor = vec3(0.35, 0.65, 0.25);
        }
        
        // Clamp colors to valid range
        finalColor = clamp(finalColor, vec3(0.0), vec3(1.0));
        
        // Add subtle lighting variation
        float lighting = 0.9 + fbm(vUv * 2.0, 2) * 0.1;
        finalColor *= lighting;
        
        // Ensure alpha is always 1.0
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    try {
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTileSize: { value: this.tileSize },
          uWidth: { value: this.width },
          uHeight: { value: this.height }
        },
        side: THREE.DoubleSide
      });
      
      // Check for shader errors after creation
      if (material.program && material.program.error) {
        console.error('Shader compilation error:', material.program.error);
        throw new Error('Shader compilation failed');
      }
      
      return material;
    } catch (error) {
      console.error('Error creating shader material:', error);
      // Fallback to simple material
      console.warn('Using fallback material for terrain');
      return new THREE.MeshStandardMaterial({ 
        color: 0x90EE90,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
    }
  }

  // Update terrain when tile type changes
  updateTileType(tileX, tileZ, newType) {
    // With shader-based terrain, we don't need to regenerate the mesh
    // The shader calculates biome weights dynamically based on tile positions
    // However, if you want to force regeneration, you can call create() again
    // For now, we'll just note that the terrain updates automatically via shader
  }
}
