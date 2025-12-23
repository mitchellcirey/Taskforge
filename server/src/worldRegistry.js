const fs = require('fs').promises;
const path = require('path');

const WORLDS_FILE = path.join(__dirname, 'worlds.json');

/**
 * Load worlds registry from file
 * @returns {Promise<Object>} Object mapping world names to seeds
 */
async function loadWorlds() {
  try {
    const data = await fs.readFile(WORLDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid - return empty object
    if (error.code === 'ENOENT') {
      return {};
    }
    console.error('Error loading worlds registry:', error);
    return {};
  }
}

/**
 * Save worlds registry to file
 * @param {Object} worlds - Object mapping world names to seeds
 * @returns {Promise<void>}
 */
async function saveWorlds(worlds) {
  try {
    await fs.writeFile(WORLDS_FILE, JSON.stringify(worlds, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving worlds registry:', error);
    throw error;
  }
}

/**
 * Register a world with a name and seed
 * @param {string} worldName - Name of the world
 * @param {number} seed - Seed number for world generation
 * @returns {Promise<void>}
 */
async function registerWorld(worldName, seed) {
  if (!worldName || typeof worldName !== 'string') {
    throw new Error('World name must be a non-empty string');
  }
  
  if (typeof seed !== 'number' || seed < 0 || seed > 2147483647) {
    throw new Error('Seed must be a number between 0 and 2147483647');
  }
  
  const worlds = await loadWorlds();
  worlds[worldName] = seed;
  await saveWorlds(worlds);
  console.log(`Registered world: ${worldName} with seed ${seed}`);
}

/**
 * Get seed for a specific world
 * @param {string} worldName - Name of the world
 * @returns {Promise<number|null>} Seed number or null if world not found
 */
async function getWorldSeed(worldName) {
  if (!worldName || typeof worldName !== 'string') {
    return null;
  }
  
  const worlds = await loadWorlds();
  return worlds[worldName] !== undefined ? worlds[worldName] : null;
}

/**
 * List all registered worlds
 * @returns {Promise<Array<{name: string, seed: number}>>} Array of world objects
 */
async function listWorlds() {
  const worlds = await loadWorlds();
  return Object.entries(worlds).map(([name, seed]) => ({ name, seed }));
}

/**
 * Delete a world from the registry
 * @param {string} worldName - Name of the world to delete
 * @returns {Promise<boolean>} True if world was deleted, false if not found
 */
async function deleteWorld(worldName) {
  if (!worldName || typeof worldName !== 'string') {
    return false;
  }
  
  const worlds = await loadWorlds();
  if (worlds[worldName] !== undefined) {
    delete worlds[worldName];
    await saveWorlds(worlds);
    console.log(`Deleted world: ${worldName}`);
    return true;
  }
  
  return false;
}

module.exports = {
  registerWorld,
  getWorldSeed,
  listWorlds,
  deleteWorld
};

