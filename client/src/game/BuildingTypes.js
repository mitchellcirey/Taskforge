export const BuildingTypes = {
  STORAGE: {
    id: 'storage',
    name: 'Storage',
    description: 'Stores items and resources',
    cost: { wood: 10, stone: 5 },
    size: { width: 1, height: 1 },
    color: 0x8B7355
  },
  WORKSHOP: {
    id: 'workshop',
    name: 'Workshop',
    description: 'Craft items from blueprints',
    cost: { wood: 15, stone: 10 },
    size: { width: 1, height: 1 },
    color: 0x6B6B6B
  }
};

export function getBuildingType(id) {
  return Object.values(BuildingTypes).find(type => type.id === id);
}


