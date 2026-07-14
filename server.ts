import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// WeTalks Shared Database Types & Helpers
interface WeTalksUser {
  username: string;
  password_numeric: string;
  avatar_base64: string;
}

interface WeTalksRoom {
  id: string;
  name: string;
  type: string;
}

interface WeTalksMessage {
  id: string;
  room_id: string;
  sender: string;
  text: string;
  created_at: string;
}

interface WeTalksDB {
  users: WeTalksUser[];
  rooms: WeTalksRoom[];
  messages: WeTalksMessage[];
}

const DB_FILE = path.join(process.cwd(), 'wetalks_db.json');

function readWeTalksDB(): WeTalksDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading wetalks db:', e);
  }
  return { users: [], rooms: [], messages: [] };
}

function writeWeTalksDB(db: WeTalksDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing wetalks db:', e);
  }
}

// WeTalks API Routes
app.get('/api/wetalks/users', (req, res) => {
  const db = readWeTalksDB();
  res.json(db.users);
});

app.post('/api/wetalks/users', (req, res) => {
  const { username, password_numeric, avatar_base64 } = req.body;
  if (!username || !password_numeric) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const db = readWeTalksDB();
  const lowerUser = username.toLowerCase().trim();
  if (db.users.some(u => u.username.toLowerCase().trim() === lowerUser)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const newUser = {
    username,
    password_numeric,
    avatar_base64: avatar_base64 || ''
  };
  db.users.push(newUser);
  writeWeTalksDB(db);
  res.json({ success: true, user: newUser });
});

app.post('/api/wetalks/users/avatar', (req, res) => {
  const { username, avatar_base64 } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }
  const db = readWeTalksDB();
  const idx = db.users.findIndex(u => u.username.toLowerCase().trim() === username.toLowerCase().trim());
  if (idx !== -1) {
    db.users[idx].avatar_base64 = avatar_base64 || '';
    writeWeTalksDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'User not found' });
});

app.get('/api/wetalks/rooms', (req, res) => {
  const db = readWeTalksDB();
  res.json(db.rooms);
});

app.post('/api/wetalks/rooms', (req, res) => {
  const { id, name, type } = req.body;
  if (!id || !name || !type) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const db = readWeTalksDB();
  if (db.rooms.some(r => r.id === id)) {
    return res.json({ success: true, room: db.rooms.find(r => r.id === id) });
  }
  const newRoom = { id, name, type };
  db.rooms.push(newRoom);
  writeWeTalksDB(db);
  res.json({ success: true, room: newRoom });
});

app.delete('/api/wetalks/rooms/:id', (req, res) => {
  const { id } = req.params;
  const db = readWeTalksDB();
  db.rooms = db.rooms.filter(r => r.id !== id);
  db.messages = db.messages.filter(m => m.room_id !== id);
  writeWeTalksDB(db);
  res.json({ success: true });
});

app.get('/api/wetalks/messages/:roomId', (req, res) => {
  const { roomId } = req.params;
  const db = readWeTalksDB();
  const msgs = db.messages.filter(m => m.room_id === roomId);
  res.json(msgs);
});

app.post('/api/wetalks/messages', (req, res) => {
  const { room_id, sender, text } = req.body;
  if (!room_id || !sender || !text) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const db = readWeTalksDB();
  const newMsg = {
    id: 'm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    room_id,
    sender,
    text,
    created_at: new Date().toISOString()
  };
  db.messages.push(newMsg);
  writeWeTalksDB(db);
  res.json({ success: true, message: newMsg });
});

interface TetrisClient {
  id: string;
  name: string;
  ws: WebSocket;
}

interface TetrisRoom {
  id: string;
  player1: TetrisClient;
  player2: TetrisClient;
}

const tetrisQueue: TetrisClient[] = [];
const tetrisRooms: { [id: string]: TetrisRoom } = {};

const server = http.createServer(app);
const PORT = 3000;

// Game State Types
interface Player {
  id: string;
  name: string;
  x: number; // grid float coordinates
  y: number;
  colorIndex: number; // index in tile colors (determines character current skin color)
  targetColorIndex: number; // the color of the tile they stand on
  role: 'hider' | 'seeker';
  isAlive: boolean;
  score: number;
  skinId: number; // 0: standard chameleon, 1: cyber, 2: retro, 3: golden
  isBot: boolean;
  heading: number; // movement angle in degrees
}

interface FlyItem {
  id: string;
  gridX: number;
  gridY: number;
  points: number;
}

interface GameRoom {
  roomId: string;
  players: { [id: string]: Player };
  grid: number[][]; // 12x12 grid of color indexes (0-4)
  flies: FlyItem[];
  status: 'waiting' | 'playing' | 'ended';
  timer: number;
  seekerId: string | null;
  roundWinner: 'hiders' | 'seeker' | null;
}

const rooms: { [id: string]: GameRoom } = {};
const GRID_SIZE = 12;
const TILE_COLORS_COUNT = 5;

// Helper to initialize grid
function createRandomGrid(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      // Pick a random color index
      row.push(Math.floor(Math.random() * TILE_COLORS_COUNT));
    }
    grid.push(row);
  }
  return grid;
}

// Get or create room
function getRoom(roomId: string): GameRoom {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      roomId,
      players: {},
      grid: createRandomGrid(),
      flies: [],
      status: 'waiting',
      timer: 90,
      seekerId: null,
      roundWinner: null,
    };
    spawnFlies(rooms[roomId], 4);
  }
  return rooms[roomId];
}

function spawnFlies(room: GameRoom, count: number) {
  for (let i = 0; i < count; i++) {
    const gridX = Math.floor(Math.random() * GRID_SIZE);
    const gridY = Math.floor(Math.random() * GRID_SIZE);
    const flyId = Math.random().toString(36).substring(2, 9);
    room.flies.push({
      id: flyId,
      gridX,
      gridY,
      points: 10,
    });
  }
}

// Change some tiles periodically to force movement
function rotateGridColors(room: GameRoom) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (Math.random() < 0.15) { // 15% chance to change a tile color
        room.grid[r][c] = (room.grid[r][c] + Math.floor(Math.random() * (TILE_COLORS_COUNT - 1)) + 1) % TILE_COLORS_COUNT;
      }
    }
  }
}

// Bot simulation on the server to keep games active
function simulateBots(room: GameRoom) {
  const playerIds = Object.keys(room.players);
  // Ensure we have at least 3 bot hiders if there's only 1 real player
  const activeBots = playerIds.filter(id => room.players[id].isBot);
  const realPlayers = playerIds.filter(id => !room.players[id].isBot);

  if (realPlayers.length > 0 && activeBots.length < 3) {
    // Add a bot hider
    const botId = `bot_${Math.random().toString(36).substring(2, 6)}`;
    room.players[botId] = {
      id: botId,
      name: `ChameleBot ${Math.floor(Math.random() * 90) + 10}`,
      x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 + 0.5,
      y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 + 0.5,
      colorIndex: 0,
      targetColorIndex: 0,
      role: 'hider',
      isAlive: true,
      score: 0,
      skinId: Math.floor(Math.random() * 4),
      isBot: true,
      heading: 0,
    };
  }

  // Update bot behaviors if playing
  if (room.status === 'playing') {
    Object.values(room.players).forEach(p => {
      if (!p.isBot || !p.isAlive) return;

      if (p.role === 'hider') {
        // Hider bots wander around slowly, trying to collect flies or stand still to camouflage
        if (Math.random() < 0.08) {
          // Wander behavior
          const dx = (Math.random() - 0.5) * 0.4;
          const dy = (Math.random() - 0.5) * 0.4;
          p.x = Math.max(0.1, Math.min(GRID_SIZE - 0.1, p.x + dx));
          p.y = Math.max(0.1, Math.min(GRID_SIZE - 0.1, p.y + dy));
          p.heading = Math.atan2(dy, dx) * (180 / Math.PI);
        }

        // Get standing tile color
        const gx = Math.floor(p.x);
        const gy = Math.floor(p.y);
        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
          p.targetColorIndex = room.grid[gy][gx];
        }
      } else if (p.role === 'seeker') {
        // Seeker bots search for hiders.
        // They periodically attack/lick coordinates close to known players or random cells
        if (Math.random() < 0.03) {
          const hiders = Object.values(room.players).filter(pl => pl.role === 'hider' && pl.isAlive);
          if (hiders.length > 0) {
            // Target a random hider with some noise, or target a random tile
            const target = hiders[Math.floor(Math.random() * hiders.length)];
            const err = 1.0;
            const targetX = target.x + (Math.random() - 0.5) * err;
            const targetY = target.y + (Math.random() - 0.5) * err;
            
            // Move seeker towards them
            const angle = Math.atan2(targetY - p.y, targetX - p.x);
            p.x = Math.max(0.1, Math.min(GRID_SIZE - 0.1, p.x + Math.cos(angle) * 0.3));
            p.y = Math.max(0.1, Math.min(GRID_SIZE - 0.1, p.y + Math.sin(angle) * 0.3));
            p.heading = angle * (180 / Math.PI);

            // Trigger lick attack
            if (Math.random() < 0.25) {
              const lickRange = 1.5;
              hiders.forEach(hid => {
                const dist = Math.hypot(hid.x - p.x, hid.y - p.y);
                if (dist <= lickRange) {
                  hid.isAlive = false;
                  p.score += 50;
                }
              });
            }
          }
        }
      }
    });
  }
}

// Game Rooms Ticker (runs once per second)
setInterval(() => {
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    
    // Auto simulate bots
    simulateBots(room);

    if (room.status === 'playing') {
      room.timer--;

      // Rotates tile colors
      if (room.timer % 6 === 0) {
        rotateGridColors(room);
      }

      // Check for fly consumption by active hiders
      room.flies.forEach((fly, index) => {
        Object.values(room.players).forEach(p => {
          if (p.isAlive && p.role === 'hider') {
            const dist = Math.hypot(p.x - (fly.gridX + 0.5), p.y - (fly.gridY + 0.5));
            if (dist < 0.6) {
              // Fly collected!
              p.score += fly.points;
              // Remove and spawn new one
              room.flies.splice(index, 1);
              spawnFlies(room, 1);
            }
          }
        });
      });

      // Seeker catching hiders check (for real hiders vs seekers too)
      const seeker = Object.values(room.players).find(p => p.role === 'seeker');
      if (seeker) {
        Object.values(room.players).forEach(hider => {
          if (hider.role === 'hider' && hider.isAlive) {
            // If they are on the same cell and seeker is very close
            const dist = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);
            if (dist < 0.5) {
              hider.isAlive = false;
              seeker.score += 50;
            }
          }
        });
      }

      // Check win/lose conditions
      const aliveHiders = Object.values(room.players).filter(p => p.role === 'hider' && p.isAlive);
      if (aliveHiders.length === 0) {
        // Seeker wins!
        room.status = 'ended';
        room.roundWinner = 'seeker';
      } else if (room.timer <= 0) {
        // Hiders win!
        room.status = 'ended';
        room.roundWinner = 'hiders';
      }
    }
  });
}, 1000);

// Set up WebSocket Server
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws: WebSocket) => {
  let playerRoomId = 'default';
  let playerId = Math.random().toString(36).substring(2, 9);

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      const room = getRoom(playerRoomId);

      switch (data.type) {
        case 'join': {
          playerRoomId = data.roomId || 'default';
          const currentRoom = getRoom(playerRoomId);
          
          // Determine role: if no seeker, assign seeker
          const hasSeeker = Object.values(currentRoom.players).some(p => p.role === 'seeker');
          const role = hasSeeker ? 'hider' : 'seeker';

          currentRoom.players[playerId] = {
            id: playerId,
            name: data.name || `Chameleon_${playerId}`,
            x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 + 0.5,
            y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 + 0.5,
            colorIndex: 0,
            targetColorIndex: 0,
            role: role,
            isAlive: true,
            score: 0,
            skinId: data.skinId || 0,
            isBot: false,
            heading: 0,
          };
          
          if (role === 'seeker') {
            currentRoom.seekerId = playerId;
          }

          // Reply with init data
          ws.send(JSON.stringify({
            type: 'init',
            playerId,
            roomId: playerRoomId,
            gameState: currentRoom,
          }));
          break;
        }

        case 'move': {
          const player = room.players[playerId];
          if (player && player.isAlive) {
            player.x = Math.max(0.1, Math.min(GRID_SIZE - 0.1, data.x));
            player.y = Math.max(0.1, Math.min(GRID_SIZE - 0.1, data.y));
            player.heading = data.heading || 0;

            // Get target tile color
            const gx = Math.floor(player.x);
            const gy = Math.floor(player.y);
            if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
              player.targetColorIndex = room.grid[gy][gx];
            }
          }
          break;
        }

        case 'lick': {
          // Seeker attacks
          const player = room.players[playerId];
          if (player && player.role === 'seeker') {
            const lickRange = 1.8;
            Object.values(room.players).forEach(hid => {
              if (hid.role === 'hider' && hid.isAlive) {
                const dist = Math.hypot(hid.x - player.x, hid.y - player.y);
                if (dist <= lickRange) {
                  hid.isAlive = false;
                  player.score += 50;
                }
              }
            });
            
            // Broadcast lick event to others
            broadcastToRoom(playerRoomId, {
              type: 'lick_effect',
              seekerId: playerId,
              x: player.x,
              y: player.y,
              heading: player.heading,
            });
          }
          break;
        }

        case 'skin_change': {
          const player = room.players[playerId];
          if (player) {
            player.skinId = data.skinId;
          }
          break;
        }

        case 'start_game': {
          if (room.status !== 'playing') {
            room.status = 'playing';
            room.timer = 90;
            room.flies = [];
            room.roundWinner = null;
            spawnFlies(room, 4);

            // Reassign 1 seeker, make rest hiders, revive all
            const playerIds = Object.keys(room.players);
            if (playerIds.length > 0) {
              const seekerIndex = Math.floor(Math.random() * playerIds.length);
              playerIds.forEach((id, idx) => {
                room.players[id].role = idx === seekerIndex ? 'seeker' : 'hider';
                room.players[id].isAlive = true;
                room.players[id].x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 + 0.5;
                room.players[id].y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 + 0.5;
              });
              room.seekerId = playerIds[seekerIndex];
            }

            broadcastToRoom(playerRoomId, {
              type: 'system',
              text: 'The hunt has started! Chameleon hiders, camouflage into the tiles!',
            });
          }
          break;
        }

        case 'chat': {
          broadcastToRoom(playerRoomId, {
            type: 'chat',
            sender: room.players[playerId]?.name || 'Chameleon',
            text: data.text,
          });
          break;
        }

        case 'tetris_join': {
          const clientName = data.name || 'Anonymous Player';
          const newClient: TetrisClient = {
            id: playerId,
            name: clientName,
            ws
          };
          
          const existingIdx = tetrisQueue.findIndex(c => c.id === playerId);
          if (existingIdx !== -1) {
            tetrisQueue[existingIdx] = newClient;
          } else if (tetrisQueue.length > 0) {
            const opp = tetrisQueue.shift()!;
            if (opp.id === playerId) {
              tetrisQueue.push(newClient);
              ws.send(JSON.stringify({ type: 'tetris_waiting' }));
            } else {
              const rId = 't_room_' + Math.random().toString(36).substr(2, 6);
              const room: TetrisRoom = {
                id: rId,
                player1: opp,
                player2: newClient
              };
              tetrisRooms[rId] = room;
              
              opp.ws.send(JSON.stringify({
                type: 'tetris_matched',
                roomId: rId,
                opponentName: newClient.name
              }));
              ws.send(JSON.stringify({
                type: 'tetris_matched',
                roomId: rId,
                opponentName: opp.name
              }));
            }
          } else {
            tetrisQueue.push(newClient);
            ws.send(JSON.stringify({ type: 'tetris_waiting' }));
          }
          break;
        }

        case 'tetris_sync_grid': {
          const rId = data.roomId;
          const room = tetrisRooms[rId];
          if (room) {
            const isP1 = room.player1.id === playerId;
            const opp = isP1 ? room.player2 : room.player1;
            opp.ws.send(JSON.stringify({
              type: 'tetris_sync_grid',
              grid: data.grid,
              score: data.score
            }));
          }
          break;
        }

        case 'tetris_send_garbage': {
          const rId = data.roomId;
          const room = tetrisRooms[rId];
          if (room) {
            const isP1 = room.player1.id === playerId;
            const opp = isP1 ? room.player2 : room.player1;
            opp.ws.send(JSON.stringify({
              type: 'tetris_opponent_garbage',
              lines: data.lines
            }));
          }
          break;
        }

        case 'tetris_gameover': {
          const rId = data.roomId;
          const room = tetrisRooms[rId];
          if (room) {
            const isP1 = room.player1.id === playerId;
            const opp = isP1 ? room.player2 : room.player1;
            opp.ws.send(JSON.stringify({
              type: 'tetris_opponent_gameover'
            }));
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    // Clean up Tetris matchmaking queue
    const queueIdx = tetrisQueue.findIndex(c => c.id === playerId);
    if (queueIdx !== -1) {
      tetrisQueue.splice(queueIdx, 1);
    }
    
    // Clean up Tetris active rooms and notify opponents
    Object.keys(tetrisRooms).forEach(rId => {
      const room = tetrisRooms[rId];
      if (room.player1.id === playerId || room.player2.id === playerId) {
        const opp = room.player1.id === playerId ? room.player2 : room.player1;
        try {
          opp.ws.send(JSON.stringify({ type: 'tetris_opponent_disconnected' }));
        } catch (e) {
          // Socket might already be closed
        }
        delete tetrisRooms[rId];
      }
    });

    Object.keys(rooms).forEach(rId => {
      const room = rooms[rId];
      if (room.players[playerId]) {
        delete room.players[playerId];
        
        // If seeker left, find another
        if (room.seekerId === playerId) {
          const remainingIds = Object.keys(room.players);
          if (remainingIds.length > 0) {
            const nextSeeker = remainingIds[0];
            room.players[nextSeeker].role = 'seeker';
            room.seekerId = nextSeeker;
          } else {
            room.seekerId = null;
          }
        }
      }
    });
  });
});

function broadcastToRoom(roomId: string, message: any) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Tick-rate broadcasts state updates to room at 25Hz (every 40ms)
setInterval(() => {
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    broadcastToRoom(roomId, {
      type: 'state_update',
      gameState: room,
    });
  });
}, 40);


// Admin Broadcast Shared Database Types & Helpers
interface AdminBroadcast {
  id: string;
  sender: string;
  title: string;
  text: string;
  timestamp: string;
}

const BROADCASTS_FILE = path.join(process.cwd(), 'broadcasts_db.json');

function readBroadcasts(): AdminBroadcast[] {
  try {
    if (fs.existsSync(BROADCASTS_FILE)) {
      const data = fs.readFileSync(BROADCASTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading broadcasts db:', e);
  }
  return [];
}

function writeBroadcasts(broadcasts: AdminBroadcast[]) {
  try {
    fs.writeFileSync(BROADCASTS_FILE, JSON.stringify(broadcasts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing broadcasts db:', e);
  }
}

// Admin Broadcast API Routes
app.get('/api/admin/broadcasts', (req, res) => {
  const broadcasts = readBroadcasts();
  res.json(broadcasts);
});

app.post('/api/admin/broadcasts', (req, res) => {
  const { sender, title, text } = req.body;
  if (!title || !text) {
    return res.status(400).json({ error: 'Title and text are required' });
  }
  const broadcasts = readBroadcasts();
  const newBroadcast: AdminBroadcast = {
    id: 'bc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    sender: sender || '管理者 (Admin)',
    title,
    text,
    timestamp: new Date().toISOString()
  };
  broadcasts.push(newBroadcast);
  writeBroadcasts(broadcasts);
  res.json({ success: true, broadcast: newBroadcast });
});

// Serve API Routes First
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', playersCount: wss.clients.size });
});

// Configure Vite middleware or static serving
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
