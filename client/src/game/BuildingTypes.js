export const BuildingTypes = {
  STORAGE: {
    id: 'storage',
    name: 'Storage',
    description: 'Stores items and resources',
    cost: { stick: 5, stone: 4 },
    size: { width: 1, height: 1 },
    color: 0x8B7355
  },
  WORKSHOP_LEVEL_1: {
    id: 'workshop-level-1',
    name: 'Workshop (Level 1)',
    description: 'Craft items from blueprints',
    cost: { stick: 8, stone: 4 },
    size: { width: 1, height: 1 },
    color: 0x6B6B6B
  },
  WORKSHOP_LEVEL_2: {
    id: 'workshop-level-2',
    name: 'Workshop (Level 2)',
    description: 'Advanced crafting workshop',
    cost: { stick: 4, wood: 2, stone: 4 },
    size: { width: 1, height: 1 },
    color: 0x5B5B5B
  },
  WORKSHOP_LEVEL_3: {
    id: 'workshop-level-3',
    name: 'Workshop (Level 3)',
    description: 'Master crafting workshop',
    cost: { wood: 4, stone: 2 },
    size: { width: 1, height: 1 },
    color: 0x4B4B4B
  },
  WORKSHOP: {
    id: 'workshop',
    name: 'Workshop',
    description: 'Craft items from blueprints',
    cost: { stick: 8, stone: 4 },
    size: { width: 1, height: 1 },
    color: 0x6B6B6B
  },
  CAMPFIRE: {
    id: 'campfire',
    name: 'Campfire',
    description: 'A cozy campfire for warmth',
    cost: { stick: 4, stone: 2 },
    size: { width: 1, height: 1 },
    color: 0xFF6600
  }
};

export function getBuildingType(id) {
  return Object.values(BuildingTypes).find(type => type.id === id);
}


