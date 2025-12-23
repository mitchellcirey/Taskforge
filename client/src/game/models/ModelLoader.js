/**
 * Model Loader Utility
 * 
 * Loads pre-compiled models from JSON files for better performance.
 * Uses THREE.ObjectLoader to reconstruct THREE.js objects from serialized data.
 */

import * as THREE from 'three';

// Cache for loaded models to avoid reloading
const modelCache = new Map();

// Base path for models (will be set based on environment)
function getModelPath(itemId) {
  // In webpack dev server or Electron, models will be in the same directory structure
  // Models are copied to dist/public/models/compiled/ during build
  if (typeof window !== 'undefined') {
    // Browser/Electron renderer context
    return `./public/models/compiled/${itemId}.json`;
  }
  // Fallback
  return `./models/compiled/${itemId}.json`;
}

/**
 * Load a compiled model by item type ID
 * @param {string} itemId - The item type ID (e.g., 'wood', 'stone', 'axe')
 * @returns {Promise<THREE.Object3D>} The loaded THREE.js object
 */
export async function loadModel(itemId) {
  // Check cache first
  if (modelCache.has(itemId)) {
    const cached = modelCache.get(itemId);
    // Clone the cached model for reuse
    return cloneModel(cached);
  }
  
  try {
    // Load the JSON file using fetch
    const modelPath = getModelPath(itemId);
    const response = await fetch(modelPath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`);
    }
    
    const modelData = await response.json();
    
    // Use THREE.ObjectLoader to reconstruct the object
    const loader = new THREE.ObjectLoader();
    const model = loader.parse(modelData);
    
    // Cache the original model
    modelCache.set(itemId, model);
    
    // Return a clone for this use
    return cloneModel(model);
    
  } catch (error) {
    console.error(`Failed to load model for ${itemId}:`, error);
    throw new Error(`Model not found or invalid for item: ${itemId}`);
  }
}

/**
 * Clone a THREE.js object (deep clone to avoid sharing geometries/materials)
 * @param {THREE.Object3D} model - The model to clone
 * @returns {THREE.Object3D} Cloned model
 */
function cloneModel(model) {
  // Use THREE.ObjectLoader's clone mechanism via serialization
  // This ensures proper cloning of geometries and materials
  const loader = new THREE.ObjectLoader();
  const json = model.toJSON();
  return loader.parse(json);
}

/**
 * Preload all models (optional optimization)
 * @param {string[]} itemIds - Array of item type IDs to preload
 */
export async function preloadModels(itemIds) {
  const loadPromises = itemIds.map(id => loadModel(id).catch(err => {
    console.warn(`Failed to preload model for ${id}:`, err);
    return null;
  }));
  
  await Promise.all(loadPromises);
  console.log(`Preloaded ${itemIds.length} models`);
}

