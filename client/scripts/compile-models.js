/**
 * Model Compilation Script
 * 
 * This script extracts model-building code from ItemType classes and compiles
 * them into serialized JSON files that can be loaded at runtime for better performance.
 */

import * as THREE from 'three';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import item types
import { Wood, Stone, Stick, Axe, Pickaxe } from '../src/game/items/index.js';

// Output directory for compiled models
const OUTPUT_DIR = path.join(__dirname, '../src/game/models/compiled');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Serialize a THREE.js object to a safe JSON format
 * This extracts geometry and material data in a format that can be reconstructed
 */
function serializeModel(object) {
  // THREE.Object3D has a toJSON method that serializes the object
  const json = object.toJSON();
  
  // The JSON format from toJSON() is compatible with ObjectLoader.parse()
  // It already includes metadata, geometries, materials, and object structure
  return json;
}

/**
 * Compile models for all item types
 */
async function compileModels() {
  console.log('Compiling models...\n');
  
  const itemTypes = [
    { name: 'wood', instance: new Wood() },
    { name: 'stone', instance: new Stone() },
    { name: 'stick', instance: new Stick() },
    { name: 'axe', instance: new Axe() },
    { name: 'pickaxe', instance: new Pickaxe() }
  ];
  
  for (const { name, instance } of itemTypes) {
    try {
      console.log(`Compiling ${name}...`);
      
      // Generate the world model using the build method
      const model = instance._buildWorldModel();
      
      // Serialize to JSON
      const serialized = serializeModel(model);
      
      // Write to file
      const outputPath = path.join(OUTPUT_DIR, `${name}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(serialized, null, 2));
      
      console.log(`  ✓ Compiled ${name} -> ${outputPath}`);
      
      // Clean up - dispose geometries and materials to free memory
      model.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
    } catch (error) {
      console.error(`  ✗ Error compiling ${name}:`, error.message);
      throw error;
    }
  }
  
  console.log('\n✓ Model compilation complete!');
}

// Run compilation
compileModels().catch((error) => {
  console.error('Compilation failed:', error);
  process.exit(1);
});

