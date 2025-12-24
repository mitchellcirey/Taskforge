import { Blueprint } from './Blueprint.js';

export class BlueprintManager {
  constructor() {
    this.blueprints = new Map();
    this.initializeBlueprints();
  }

  initializeBlueprints() {
    // Starting blueprints (unlocked by default)
    this.addBlueprint(new Blueprint(
      'axe',
      'Axe',
      'Tool for chopping trees',
      { stick: 2, stone: 2 },
      { type: 'axe', count: 1 },
      true
    ));

    this.addBlueprint(new Blueprint(
      'pickaxe',
      'Pickaxe',
      'Tool for mining stone',
      { stick: 2, stone: 3 },
      { type: 'pickaxe', count: 1 },
      false
    ));

    this.addBlueprint(new Blueprint(
      'shovel',
      'Shovel',
      'Tool for digging',
      { stick: 2, stone: 1, iron: 1 },
      { type: 'shovel', count: 1 },
      false
    ));

    this.addBlueprint(new Blueprint(
      'hammer',
      'Hammer',
      'Tool for construction',
      { stick: 1, iron: 2 },
      { type: 'hammer', count: 1 },
      false
    ));

    // More blueprints can be added here
  }

  addBlueprint(blueprint) {
    this.blueprints.set(blueprint.id, blueprint);
  }

  getBlueprint(id) {
    return this.blueprints.get(id);
  }

  getAllBlueprints() {
    return Array.from(this.blueprints.values());
  }

  unlockBlueprint(id) {
    const blueprint = this.blueprints.get(id);
    if (blueprint) {
      blueprint.unlocked = true;
    }
  }

  isUnlocked(id) {
    const blueprint = this.blueprints.get(id);
    return blueprint ? blueprint.unlocked : false;
  }
}


