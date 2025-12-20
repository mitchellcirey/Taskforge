// Pathfinding utility class (A* algorithm)
// Strict tile-based pathfinding - all logic uses tile coordinates

export class Pathfinder {
  constructor(tileGrid) {
    this.tileGrid = tileGrid;
  }

  // Find path using tile coordinates
  findPath(startTileX, startTileZ, endTileX, endTileZ) {
    const startTile = this.tileGrid.getTile(startTileX, startTileZ);
    const endTile = this.tileGrid.getTile(endTileX, endTileZ);
    
    if (!startTile || !endTile || !endTile.walkable) {
      return [];
    }

    // Use Set for O(1) lookups
    const openSet = new Set([startTile]);
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(startTile, 0);
    fScore.set(startTile, this.heuristic(startTile, endTile));

    while (openSet.size > 0) {
      // Find node with lowest fScore in openSet
      let current = null;
      let lowestFScore = Infinity;
      
      for (const node of openSet) {
        const nodeFScore = fScore.get(node) ?? Infinity;
        if (nodeFScore < lowestFScore) {
          lowestFScore = nodeFScore;
          current = node;
        }
      }

      if (!current) {
        break; // No valid path
      }

      if (current === endTile) {
        // Reconstruct path
        const path = [];
        let node = endTile;
        while (node) {
          path.unshift(node);
          node = cameFrom.get(node);
        }
        return path;
      }

      openSet.delete(current);
      closedSet.add(current);

      // Check neighbors
      const neighbors = this.getNeighbors(current.tileX, current.tileZ);
      for (const neighbor of neighbors) {
        // Skip if already evaluated or not walkable
        if (closedSet.has(neighbor) || !neighbor.walkable || neighbor.occupied) {
          continue;
        }

        const currentGScore = gScore.get(current) ?? Infinity;
        const moveCost = neighbor.moveCost ?? 1;
        const tentativeGScore = currentGScore + moveCost;
        const neighborGScore = gScore.get(neighbor) ?? Infinity;
        
        // If this path to neighbor is better, record it
        if (tentativeGScore < neighborGScore) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, endTile));
          
          // Add to openSet if not already there
          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
          }
        }
      }
    }

    return []; // No path found
  }

  // Get adjacent tiles (8-directional with proper costs)
  getNeighbors(tileX, tileZ) {
    const neighbors = [];
    const directions = [
      { x: 0, z: -1, cost: 1 },   // North
      { x: 1, z: -1, cost: Math.sqrt(2) }, // Northeast (diagonal)
      { x: 1, z: 0, cost: 1 },    // East
      { x: 1, z: 1, cost: Math.sqrt(2) }, // Southeast (diagonal)
      { x: 0, z: 1, cost: 1 },    // South
      { x: -1, z: 1, cost: Math.sqrt(2) }, // Southwest (diagonal)
      { x: -1, z: 0, cost: 1 },   // West
      { x: -1, z: -1, cost: Math.sqrt(2) } // Northwest (diagonal)
    ];

    for (const dir of directions) {
      const neighborX = tileX + dir.x;
      const neighborZ = tileZ + dir.z;
      const neighbor = this.tileGrid.getTile(neighborX, neighborZ);
      
      if (!neighbor || !neighbor.walkable || neighbor.occupied) {
        continue;
      }

      // For diagonal movement, check that both cardinal neighbors are walkable
      if (dir.cost > 1) {
        const card1X = tileX + dir.x;
        const card1Z = tileZ;
        const card2X = tileX;
        const card2Z = tileZ + dir.z;
        
        const card1 = this.tileGrid.getTile(card1X, card1Z);
        const card2 = this.tileGrid.getTile(card2X, card2Z);
        
        // Both cardinal directions must be walkable for diagonal movement
        if (!card1 || !card1.walkable || card1.occupied ||
            !card2 || !card2.walkable || card2.occupied) {
          continue; // Can't move diagonally if cardinals are blocked
        }
      }
      
      // Set move cost and add to neighbors
      neighbor.moveCost = dir.cost;
      neighbors.push(neighbor);
    }

    return neighbors;
  }

  // Heuristic function (diagonal distance for 8-directional movement)
  heuristic(a, b) {
    const dx = Math.abs(a.tileX - b.tileX);
    const dz = Math.abs(a.tileZ - b.tileZ);
    // Use diagonal distance (optimal for 8-directional movement)
    // This is the octile distance formula
    return Math.max(dx, dz) + (Math.sqrt(2) - 1) * Math.min(dx, dz);
  }
}
