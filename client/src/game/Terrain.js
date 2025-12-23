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
        
        // Calculate distance from edges for sand placement
        float normalizedX = tileX / uWidth;
        float normalizedZ = tileZ / uHeight;
        float distFromEdgeX = min(normalizedX, 1.0 - normalizedX);
        float distFromEdgeZ = min(normalizedZ, 1.0 - normalizedZ);
        float distFromEdge = min(distFromEdgeX, distFromEdgeZ);
        
        // Sand appears on edges (outer 15% of map)
        float edgeThreshold = 0.15;
        float sandWeight = 1.0 - smoothstep(0.0, edgeThreshold, distFromEdge);
        
        // For interior areas, create cohesive dirt patches with sharp boundaries (Autonauts style)
        // Use very low frequency noise to create large, distinct blob-like regions
        // This approximates the distance-based patch centers from TileGrid
        float regionNoise = fbm(vec2(tileX, tileZ) * 0.01, 3);
        
        // Use multiple frequencies to create more varied patch sizes
        float sizeVariation1 = fbm(vec2(tileX, tileZ) * 0.04, 3);
        float sizeVariation2 = fbm(vec2(tileX, tileZ) * 0.08, 3);
        float sizeVariation = sizeVariation1 * 0.6 + sizeVariation2 * 0.4;
        
        // Create cohesive patches with sharp boundaries (Autonauts style)
        // Lower regionNoise values create dirt patches
        // Size variation affects the threshold to create different patch sizes (more variation)
        // Wider range for more size variety: 0.2 to 0.45
        float patchThreshold = 0.2 + sizeVariation * 0.25;
        
        // Very sharp boundaries - minimal blend zone for blocky appearance
        float blendWidth = 0.01; // Very small blend zone for sharp, blocky edges
        float patchFactor = 1.0 - smoothstep(patchThreshold - blendWidth, patchThreshold + blendWidth, regionNoise);
        
        // Sharpen the result - push towards 0 or 1 for distinct boundaries
        // Use step with slight threshold adjustment for very sharp edges
        patchFactor = step(0.3, patchFactor); // Sharp threshold - mostly binary but allows slight variation
        
        // Calculate dirt and grass weights
        float dirtWeight = (1.0 - sandWeight) * patchFactor;
        float grassWeight = (1.0 - sandWeight) * (1.0 - patchFactor);
        
        // Minimal smoothing only for sand edges - keep patch boundaries sharp (Autonauts style)
        vec2 offset1 = vec2(0.2, 0.2);
        vec2 offset2 = vec2(-0.2, 0.2);
        vec2 offset3 = vec2(0.2, -0.2);
        vec2 offset4 = vec2(-0.2, -0.2);
        
        float avgDistFromEdge = distFromEdge;
        
        vec2 samplePos1 = vec2(tileX, tileZ) + offset1 * 0.3;
        float sNormX1 = samplePos1.x / uWidth;
        float sNormZ1 = samplePos1.y / uHeight;
        float sDist1 = min(min(sNormX1, 1.0 - sNormX1), min(sNormZ1, 1.0 - sNormZ1));
        avgDistFromEdge += sDist1;
        
        vec2 samplePos2 = vec2(tileX, tileZ) + offset2 * 0.3;
        float sNormX2 = samplePos2.x / uWidth;
        float sNormZ2 = samplePos2.y / uHeight;
        float sDist2 = min(min(sNormX2, 1.0 - sNormX2), min(sNormZ2, 1.0 - sNormZ2));
        avgDistFromEdge += sDist2;
        
        vec2 samplePos3 = vec2(tileX, tileZ) + offset3 * 0.3;
        float sNormX3 = samplePos3.x / uWidth;
        float sNormZ3 = samplePos3.y / uHeight;
        float sDist3 = min(min(sNormX3, 1.0 - sNormX3), min(sNormZ3, 1.0 - sNormZ3));
        avgDistFromEdge += sDist3;
        
        vec2 samplePos4 = vec2(tileX, tileZ) + offset4 * 0.3;
        float sNormX4 = samplePos4.x / uWidth;
        float sNormZ4 = samplePos4.y / uHeight;
        float sDist4 = min(min(sNormX4, 1.0 - sNormX4), min(sNormZ4, 1.0 - sNormZ4));
        avgDistFromEdge += sDist4;
        
        avgDistFromEdge /= 5.0;
        
        // Only smooth edge distance for sand boundaries
        distFromEdge = mix(distFromEdge, avgDistFromEdge, 0.2);
        
        // Recalculate sand weight with smoothed edge distance
        sandWeight = 1.0 - smoothstep(0.0, edgeThreshold, distFromEdge);
        
        // Keep patch boundaries sharp - no additional smoothing for dirt/grass
        float interiorFactor = 1.0 - sandWeight;
        dirtWeight = interiorFactor * patchFactor;
        grassWeight = interiorFactor * (1.0 - patchFactor);
        
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
