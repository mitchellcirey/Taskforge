const WebSocket = require('ws');
const http = require('http');
const { registerWorld, getWorldSeed, listWorlds, deleteWorld } = require('./worldRegistry.js');

// HTTP server for world registry API
const httpServer = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  try {
    // GET /worlds - List all worlds
    if (req.method === 'GET' && pathname === '/worlds') {
      const worlds = await listWorlds();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(worlds));
      return;
    }
    
    // GET /worlds/:name - Get seed for specific world
    if (req.method === 'GET' && pathname.startsWith('/worlds/')) {
      const worldName = decodeURIComponent(pathname.substring('/worlds/'.length));
      const seed = await getWorldSeed(worldName);
      
      if (seed !== null) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ worldName, seed }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'World not found' }));
      }
      return;
    }
    
    // POST /worlds - Register a new world
    if (req.method === 'POST' && pathname === '/worlds') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { worldName, seed } = JSON.parse(body);
          
          if (!worldName || typeof seed !== 'number') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request: worldName and seed are required' }));
            return;
          }
          
          await registerWorld(worldName, seed);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, worldName, seed }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    
    // DELETE /worlds/:name - Delete a world
    if (req.method === 'DELETE' && pathname.startsWith('/worlds/')) {
      const worldName = decodeURIComponent(pathname.substring('/worlds/'.length));
      const deleted = await deleteWorld(worldName);
      
      if (deleted) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, worldName }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'World not found' }));
      }
      return;
    }
    
    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('Error handling HTTP request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

httpServer.listen(8081, () => {
  console.log('HTTP server running on port 8081');
});

// WebSocket server for multiplayer
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map(); // roomCode -> { clients: Set, state: Object }

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove client from rooms
    rooms.forEach((room, code) => {
      if (room.clients.has(ws)) {
        room.clients.delete(ws);
        if (room.clients.size === 0) {
          rooms.delete(code);
        } else {
          broadcastToRoom(code, { type: 'playerLeft', playerId: ws.id });
        }
      }
    });
  });
});

function handleMessage(ws, data) {
  switch (data.type) {
    case 'createRoom':
      const roomCode = generateRoomCode();
      rooms.set(roomCode, {
        clients: new Set([ws]),
        state: { players: [], buildings: [], resources: [] }
      });
      ws.id = data.playerId || Math.random().toString(36);
      ws.roomCode = roomCode;
      ws.send(JSON.stringify({ type: 'roomCreated', roomCode }));
      console.log(`Room created: ${roomCode}`);
      break;

    case 'joinRoom':
      const room = rooms.get(data.roomCode);
      if (room) {
        room.clients.add(ws);
        ws.id = data.playerId || Math.random().toString(36);
        ws.roomCode = data.roomCode;
        ws.send(JSON.stringify({ type: 'roomJoined', roomCode: data.roomCode, state: room.state }));
        broadcastToRoom(data.roomCode, { type: 'playerJoined', playerId: ws.id }, ws);
        console.log(`Player joined room: ${data.roomCode}`);
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
      }
      break;

    case 'updateState':
      if (ws.roomCode) {
        const room = rooms.get(ws.roomCode);
        if (room) {
          // Update room state
          if (data.playerPosition) {
            const playerIndex = room.state.players.findIndex(p => p.id === ws.id);
            if (playerIndex >= 0) {
              room.state.players[playerIndex].position = data.playerPosition;
            } else {
              room.state.players.push({ id: ws.id, position: data.playerPosition });
            }
          }
          // Broadcast to other clients
          broadcastToRoom(ws.roomCode, data, ws);
        }
      }
      break;

    default:
      console.log('Unknown message type:', data.type);
  }
}

function broadcastToRoom(roomCode, message, exclude = null) {
  const room = rooms.get(roomCode);
  if (room) {
    room.clients.forEach(client => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

console.log('WebSocket server running on port 8080');
console.log('World registry API available at http://localhost:8081');


