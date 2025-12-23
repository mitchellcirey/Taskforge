/**
 * Registry for all achievements in the game.
 * Provides a centralized way to manage achievement definitions and their relationships.
 */
export class AchievementRegistry {
  constructor() {
    this.achievements = new Map();
    this.initializeDefaultAchievements();
  }

  /**
   * Initialize default achievements
   */
  initializeDefaultAchievements() {
    // Level 1 Achievements
    
    // Sticks N Stones: Collect 4 sticks AND 4 stones
    this.register({
      id: 'sticks_n_stones',
      name: 'Sticks N Stones',
      description: 'Collect 4 sticks and 4 stones',
      level: 1,
      requirement: {
        items: [
          { itemType: 'stick', count: 4 },
          { itemType: 'stone', count: 4 }
        ]
      },
      unlocked: false, // For future tracking
      prerequisites: [] // No prerequisites
    });

    // Tool Tech: Craft an Axe using a Workshop
    this.register({
      id: 'tool_tech',
      name: 'Tool Tech',
      description: 'Craft an Axe using a Workshop',
      level: 1,
      requirement: {
        craft: {
          itemType: 'axe',
          buildingType: 'workshop'
        }
      },
      unlocked: false, // For future tracking
      prerequisites: [] // No prerequisites
    });

    // Level 2 and Level 3 achievements will be added later
  }

  /**
   * Register an achievement
   * @param {Object} achievement - The achievement object
   */
  register(achievement) {
    if (!achievement.id) {
      throw new Error('Achievement must have an id');
    }
    if (!achievement.name) {
      throw new Error('Achievement must have a name');
    }
    if (achievement.level === undefined || achievement.level === null) {
      throw new Error('Achievement must have a level (1, 2, or 3)');
    }
    if (![1, 2, 3].includes(achievement.level)) {
      throw new Error('Achievement level must be 1, 2, or 3');
    }
    this.achievements.set(achievement.id, achievement);
  }

  /**
   * Get an achievement by its ID
   * @param {string} id - The achievement ID
   * @returns {Object|null} The achievement, or null if not found
   */
  get(id) {
    return this.achievements.get(id) || null;
  }

  /**
   * Check if an achievement exists
   * @param {string} id - The achievement ID
   * @returns {boolean} True if the achievement exists
   */
  has(id) {
    return this.achievements.has(id);
  }

  /**
   * Get all registered achievements
   * @returns {Array} Array of all achievements
   */
  getAll() {
    return Array.from(this.achievements.values());
  }

  /**
   * Get achievements by level
   * @param {number} level - The achievement level (1, 2, or 3)
   * @returns {Array} Array of achievements for the specified level
   */
  getByLevel(level) {
    return this.getAll().filter(achievement => achievement.level === level);
  }

  /**
   * Get achievements in dependency order (prerequisites first)
   * @param {number|null} level - Optional level filter. If provided, only returns achievements for that level
   * @returns {Array} Array of achievements sorted by dependencies
   */
  getAllInOrder(level = null) {
    const all = level !== null ? this.getByLevel(level) : this.getAll();
    const ordered = [];
    const added = new Set();

    // Helper function to add achievement and its prerequisites
    const addWithPrerequisites = (achievement) => {
      if (added.has(achievement.id)) {
        return;
      }

      // Add prerequisites first (only if they're in the same level or no level filter)
      if (achievement.prerequisites && achievement.prerequisites.length > 0) {
        achievement.prerequisites.forEach(prereqId => {
          const prereq = this.get(prereqId);
          if (prereq) {
            // Only add prerequisite if it's in the same level (or no level filter)
            if (level === null || prereq.level === level) {
              addWithPrerequisites(prereq);
            }
          }
        });
      }

      // Add this achievement
      ordered.push(achievement);
      added.add(achievement.id);
    };

    // Add all achievements
    all.forEach(achievement => {
      addWithPrerequisites(achievement);
    });

    return ordered;
  }
}

// Create a singleton instance
const achievementRegistry = new AchievementRegistry();

/**
 * Get the global achievement registry instance
 * @returns {AchievementRegistry} The global registry
 */
export function getAchievementRegistry() {
  return achievementRegistry;
}

/**
 * Convenience function to get an achievement by ID
 * @param {string} id - The achievement ID
 * @returns {Object|null} The achievement, or null if not found
 */
export function getAchievement(id) {
  return achievementRegistry.get(id);
}

