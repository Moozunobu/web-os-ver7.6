import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Play, Shield, Award, HelpCircle, Send, Zap, RotateCcw, 
  Crown, Compass, MessageSquare, Flame, Sparkles, Smile, Check, Swords
} from 'lucide-react';

// Tile Colors used for camouflage
const TILE_COLORS = [
  '#f43f5e', // 0: Rose / Red
  '#10b981', // 1: Emerald / Green
  '#3b82f6', // 2: Blue
  '#f59e0b', // 3: Amber / Yellow
  '#8b5cf6', // 4: Purple
];

const TILE_TAILWIND_BGS = [
  'bg-rose-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
];

const TILE_NAMES = ['Red', 'Green', 'Blue', 'Yellow', 'Purple'];

const SKINS = [
  { id: 0, name: 'Forest Green', desc: 'Classic woodland camouflage', primaryColor: '#10b981', glowColor: 'rgba(16, 185, 129, 0.4)' },
  { id: 1, name: 'Cyber Neon', desc: 'Futuristic glowing scales', primaryColor: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.4)' },
  { id: 2, name: 'Golden Camo', desc: 'Rare shimmering gold variant', primaryColor: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)' },
  { id: 3, name: 'Obsidian Retro', desc: 'Classic 8-bit dark arcade look', primaryColor: '#1e293b', glowColor: 'rgba(30, 41, 59, 0.4)' },
];

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  colorIndex: number;
  targetColorIndex: number;
  role: 'hider' | 'seeker';
  isAlive: boolean;
  score: number;
  skinId: number;
  isBot: boolean;
  heading: number;
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
  grid: number[][];
  flies: FlyItem[];
  status: 'waiting' | 'playing' | 'ended';
  timer: number;
  seekerId: string | null;
  roundWinner: 'hiders' | 'seeker' | null;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export function ChameleonGameApp() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [name, setName] = useState<string>(() => {
    return localStorage.getItem('chameleon_username') || `Player_${Math.floor(Math.random() * 900) + 100}`;
  });
  const [roomId, setRoomId] = useState<string>('lobby1');
  const [selectedSkinId, setSelectedSkinId] = useState<number>(0);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string>('');
  
  // Game states synced with server
  const [roomState, setRoomState] = useState<GameRoom | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  // Chat state
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Local animation effects
  const [tongueEffect, setTongueEffect] = useState<{ x: number; y: number; angle: number; active: boolean } | null>(null);
  const [scorePopups, setScorePopups] = useState<{ id: string; x: number; y: number; text: string }[]>([]);
  
  const socketRef = useRef<WebSocket | null>(null);
  const movementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Keyboard movement tracking
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Connect to WebSocket
  const connectToGame = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Remove base subdirectory from host for websocket upgrade routing
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        // Join immediately
        ws.send(JSON.stringify({
          type: 'join',
          roomId: roomId.trim().toLowerCase() || 'default',
          name: name.trim(),
          skinId: selectedSkinId,
        }));
        setIsJoined(true);
        localStorage.setItem('chameleon_username', name);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'init') {
            setPlayerId(data.playerId);
            setRoomState(data.gameState);
          } else if (data.type === 'state_update') {
            setRoomState(data.gameState);
          } else if (data.type === 'lick_effect') {
            // Seeker lick animation
            const rad = (data.heading * Math.PI) / 180;
            setTongueEffect({
              x: data.x,
              y: data.y,
              angle: data.heading,
              active: true,
            });
            setTimeout(() => setTongueEffect(null), 300);
          } else if (data.type === 'chat') {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setChatMessages(prev => [
              ...prev, 
              { id: Math.random().toString(36), sender: data.sender, text: data.text, timestamp: time }
            ].slice(-40)); // keep last 40
          } else if (data.type === 'system') {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setChatMessages(prev => [
              ...prev,
              { id: Math.random().toString(36), sender: '🔔 SYSTEM', text: data.text, timestamp: time }
            ].slice(-40));
          }
        } catch (e) {
          console.error(e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setIsJoined(false);
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        setConnectionStatus('disconnected');
      };
    } catch (err) {
      console.error(err);
      setConnectionStatus('disconnected');
    }
  };

  const disconnectGame = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    setIsJoined(false);
    setRoomState(null);
  };

  // Keyboard and movement hooks
  useEffect(() => {
    if (!isJoined || !roomState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        if (document.activeElement?.tagName === 'INPUT') return; // skip inside text inputs
        
        e.preventDefault();
        keysPressedRef.current[key] = true;
        
        // Attack triggered by Space
        if (key === ' ' && roomState.seekerId === playerId) {
          handleTriggerAttack();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keysPressedRef.current[key]) {
        keysPressedRef.current[key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Movement Loop (runs at ~40Hz for fluid local responsiveness)
    movementIntervalRef.current = setInterval(() => {
      const me = roomState.players[playerId];
      if (!me || !me.isAlive) return;

      let dx = 0;
      let dy = 0;
      let angle = me.heading;

      if (keysPressedRef.current['w'] || keysPressedRef.current['arrowup']) dy -= 0.12;
      if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) dy += 0.12;
      if (keysPressedRef.current['a'] || keysPressedRef.current['arrowleft']) dx -= 0.12;
      if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) dx += 0.12;

      if (dx !== 0 || dy !== 0) {
        angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const nextX = Math.max(0.1, Math.min(11.9, me.x + dx));
        const nextY = Math.max(0.1, Math.min(11.9, me.y + dy));

        // Send local move action to server
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'move',
            x: nextX,
            y: nextY,
            heading: angle,
          }));
        }
      }
    }, 25);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    };
  }, [isJoined, roomState, playerId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat',
        text: chatInput,
      }));
      setChatInput('');
    }
  };

  const handleTriggerAttack = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'lick',
      }));
    }
  };

  const handleStartGame = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'start_game',
      }));
    }
  };

  const handleSkinChange = (skinId: number) => {
    setSelectedSkinId(skinId);
    if (isJoined && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'skin_change',
        skinId,
      }));
    }
  };

  // Touch controls helper for mobile / clickable layout
  const handleMobileMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const me = roomState?.players[playerId];
    if (!me || !me.isAlive) return;

    let dx = 0;
    let dy = 0;
    let angle = me.heading;

    if (direction === 'up') { dy -= 0.6; angle = -90; }
    if (direction === 'down') { dy += 0.6; angle = 90; }
    if (direction === 'left') { dx -= 0.6; angle = 180; }
    if (direction === 'right') { dx += 0.6; angle = 0; }

    const nextX = Math.max(0.1, Math.min(11.9, me.x + dx));
    const nextY = Math.max(0.1, Math.min(11.9, me.y + dy));

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'move',
        x: nextX,
        y: nextY,
        heading: angle,
      }));
    }
  };

  const mySelf = roomState?.players[playerId];
  const totalPlayers = roomState ? Object.keys(roomState.players).length : 0;
  const listPlayers = roomState ? (Object.values(roomState.players) as Player[]).sort((a, b) => b.score - a.score) : [];

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'mozunbu_1203') {
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 font-sans select-none items-center justify-center text-zinc-200 p-6 relative">
        {/* Background ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/5">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-1.5 flex items-center gap-1.5 justify-center">
              <span>Security Lock Enabled</span>
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              This application requires authorization. Please enter the primary access key to play the Chameleon Lizard Hide-and-Seek.
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Access Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Enter access key..."
                  className={`w-full bg-zinc-950/80 border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 transition-all font-mono tracking-widest ${
                    passwordError 
                      ? 'border-red-500/60 focus:ring-red-500/40' 
                      : 'border-zinc-800 focus:ring-emerald-500/40 focus:border-emerald-500/60'
                  }`}
                  autoFocus
                />
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-400 mt-1.5 font-medium flex items-center gap-1">
                  ❌ Incorrect access key. Please try again.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/15 transition-all flex items-center justify-center gap-2"
              >
                Unlock Chameleon Game
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden">
      
      {/* Top Banner Navigation */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-5 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">CHAMELEON LIZARD HIDE-AND-SEEK</span>
            <span className="text-[10px] text-zinc-500 font-mono">MULTIPLAYER CAMOUFLAGE SANDBOX</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {isJoined && (
            <div className="flex items-center gap-4 text-xs font-mono bg-zinc-950/60 border border-zinc-800/80 px-3.5 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>PLAYERS: <strong className="text-white">{totalPlayers}</strong></span>
              </span>
              <span className="h-3 w-px bg-zinc-800" />
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>ROOM: <strong className="text-white uppercase">{roomState?.roomId}</strong></span>
              </span>
              <span className="h-3 w-px bg-zinc-800" />
              <span className="flex items-center gap-1.5">
                {connectionStatus === 'connected' ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
                <span className="text-[10px] uppercase opacity-85">{connectionStatus}</span>
              </span>
            </div>
          )}

          {isJoined && (
            <button 
              onClick={disconnectGame}
              className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-lg px-3 py-1.5 font-bold transition-all"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Main Container Dashboard */}
      {!isJoined ? (
        // 1. GAME SETTINGS LOBBY SCREEN (Not Joined)
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 relative">
          
          {/* Decorative Background effects */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 relative z-10">
            
            {/* Left Box: Logo & Explanation */}
            <div className="flex flex-col justify-center space-y-5 p-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-3.5 py-1 text-xs w-fit">
                <Flame className="w-3.5 h-3.5" /> Fully Real-time Online Play
              </div>
              
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Stand on matching tiles. <br />
                Become <span className="text-emerald-400 underline decoration-emerald-500/30">completely invisible!</span>
              </h2>

              <p className="text-sm text-zinc-400 leading-relaxed">
                In this intense multiplayer hide-and-seek battle, chameleons automatically take the color of the floor tiles. Stand perfectly still on a tile of your color to blend in. Move, and the camouflage breaks!
              </p>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Gameplay Rules:</h4>
                <div className="grid gap-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-emerald-400 font-bold">1</span>
                    <span><strong>Chameleon Hiders:</strong> Avoid the Hunter seeker. Eat floating flies for extra points.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-red-400 font-bold">2</span>
                    <span><strong>Tile rotation:</strong> Tiles shuffle colors every few seconds. Move quickly to find your match!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-sky-400 font-bold">3</span>
                    <span><strong>The Hunter Seeker:</strong> Guess where Chameleons are camping, use "LICK" to capture!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Settings Form */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-2xl shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-emerald-400" /> Choose Your Lizard Setup
                </h3>

                <div className="space-y-4">
                  {/* Nickname Input */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Lizard Nickname
                    </label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 16))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-semibold"
                      placeholder="Enter username..."
                    />
                  </div>

                  {/* Room ID */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Join/Create Room
                    </label>
                    <input 
                      type="text" 
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-mono tracking-wider"
                      placeholder="e.g. room1"
                    />
                  </div>

                  {/* Skin Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Select Scale Skin
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {SKINS.map(skin => (
                        <button
                          key={skin.id}
                          onClick={() => handleSkinChange(skin.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${selectedSkinId === skin.id ? 'border-emerald-500 bg-emerald-500/5 text-white' : 'border-zinc-800 hover:bg-zinc-800/40 text-zinc-400'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: skin.primaryColor }} />
                            <span className="text-xs font-bold">{skin.name}</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 leading-tight block">{skin.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={connectToGame}
                disabled={!name.trim()}
                className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-zinc-950 font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Join Sandbox Match
              </button>
            </div>

          </div>
        </div>
      ) : (
        // 2. ACTIVE MULTIPLAYER PLAYING GAMEPLAY SCREEN
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Left panel: Live Grid Arena */}
          <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            
            {/* Ambient indicator depending on camouflage status */}
            {mySelf && mySelf.isAlive && (
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-semibold backdrop-blur-md bg-zinc-900/80 border-zinc-800">
                {mySelf.role === 'seeker' ? (
                  <>
                    <Swords className="w-4 h-4 text-red-500" />
                    <span>Role: <strong className="text-red-500">Hunter Seeker</strong></span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>
                      Camouflage: {mySelf.colorIndex === mySelf.targetColorIndex ? (
                        <strong className="text-emerald-400 font-bold uppercase animate-pulse">Perfect (Invisible)</strong>
                      ) : (
                        <strong className="text-amber-500">Exposed (Wrong Tile Color)</strong>
                      )}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Timer Overlay */}
            {roomState && (
              <div className="absolute top-4 right-4 z-10 px-3.5 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 bg-zinc-900/80 border-zinc-800 backdrop-blur-md">
                <Flame className={`w-4 h-4 ${roomState.timer < 20 ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
                <span>MATCH TIMER: <strong className={roomState.timer < 20 ? 'text-red-400 font-bold' : 'text-white'}>{roomState.timer}s</strong></span>
              </div>
            )}

            {/* 12x12 Grid Board */}
            <div className="relative aspect-square w-full max-w-[500px] border-4 border-zinc-900 rounded-2xl shadow-2xl bg-zinc-900 overflow-hidden select-none">
              <div className="grid grid-cols-12 grid-rows-12 h-full w-full gap-[2px]">
                {roomState?.grid.map((row, rIdx) => 
                  row.map((colIdx, cIdx) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`relative w-full h-full transition-colors duration-500 ${TILE_TAILWIND_BGS[colIdx]} border border-black/5 flex items-center justify-center`}
                    >
                      {/* Grid background coordinate dots */}
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-white/5" />
                    </div>
                  ))
                )}
              </div>

              {/* Flies floating overlay */}
              {roomState?.flies.map(fly => (
                <div
                  key={fly.id}
                  className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                  style={{
                    left: `${(fly.gridX + 0.5) * (100 / 12)}%`,
                    top: `${(fly.gridY + 0.5) * (100 / 12)}%`,
                  }}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Glowing wings effect */}
                    <div className="absolute w-6 h-6 bg-amber-400/20 rounded-full animate-ping pointer-events-none" />
                    {/* Fly Vector Illustration */}
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-amber-300 drop-shadow-md">
                      <circle cx="12" cy="12" r="3" fill="#18181b" />
                      {/* Left wing */}
                      <ellipse cx="8" cy="10" rx="3" ry="5" fill="#fef08a" opacity="0.8" transform="rotate(-30 8 10)" />
                      {/* Right wing */}
                      <ellipse cx="16" cy="10" rx="3" ry="5" fill="#fef08a" opacity="0.8" transform="rotate(30 16 10)" />
                      {/* Antennae */}
                      <path d="M10 8 L9 6 M14 8 L15 6" stroke="#000" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              ))}

              {/* Players overlay */}
              {roomState && (Object.values(roomState.players) as Player[]).map(p => {
                if (!p.isAlive) return null;

                const isMe = p.id === playerId;
                
                // Camouflage factor calculation
                // If they are hiders and stand on their matching color tile, they are 100% invisible to others, but slightly translucent to themselves
                const hasMatchingCamouflage = p.role === 'hider' && p.colorIndex === p.targetColorIndex;
                let opacity = 1.0;
                if (hasMatchingCamouflage) {
                  opacity = isMe ? 0.35 : 0.0; // Completely invisible to seeker/other hiders!
                }

                // If role is seeker, always fully visible
                if (p.role === 'seeker') {
                  opacity = 1.0;
                }

                return (
                  <div
                    key={p.id}
                    className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-out"
                    style={{
                      left: `${(p.x) * (100 / 12)}%`,
                      top: `${(p.y) * (100 / 12)}%`,
                      opacity: opacity,
                      transform: `translate(-50%, -50%) rotate(${p.heading}deg)`,
                    }}
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      
                      {/* Crown icon for Seeker */}
                      {p.role === 'seeker' && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 border border-red-500 rounded px-1 text-[8px] font-extrabold tracking-widest text-white shadow-md uppercase z-20">
                          Hunter
                        </div>
                      )}

                      {/* Matching color highlight ring just for yourself to know where you are */}
                      {isMe && (
                        <div className="absolute inset-0 border-2 border-dashed border-white rounded-full animate-spin pointer-events-none z-10" />
                      )}

                      {/* Chameleon visual illustration */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg relative">
                        {p.role === 'seeker' ? (
                          // Seeker Visual: Predator Snake style
                          <svg viewBox="0 0 24 24" className="w-6 h-6">
                            <circle cx="12" cy="12" r="10" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                            {/* Menacing yellow slit eyes */}
                            <ellipse cx="8" cy="10" rx="1.5" ry="3.5" fill="#eab308" />
                            <ellipse cx="16" cy="10" rx="1.5" ry="3.5" fill="#eab308" />
                            <circle cx="8" cy="10" r="0.8" fill="#000" />
                            <circle cx="16" cy="10" r="0.8" fill="#000" />
                            {/* Coiled tail */}
                            <path d="M12 21 C15 21 17 19 17 17 C17 15 15 14 13 14" stroke="#991b1b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                          </svg>
                        ) : (
                          // Hider Chameleon visual
                          <svg viewBox="0 0 24 24" className="w-6 h-6">
                            {/* Chameleon body colored with their chosen Skin, but if they camouflage, they blend in */}
                            <circle cx="12" cy="12" r="9.5" fill={SKINS[p.skinId]?.primaryColor || '#10b981'} stroke="#ffffff20" strokeWidth="1" />
                            {/* Large funny chameleon eye that rotates */}
                            <circle cx="9" cy="10" r="3.5" fill="#f8fafc" />
                            <circle cx="15" cy="10" r="3.5" fill="#f8fafc" />
                            <circle cx="9" cy="10" r="1.2" fill="#0f172a" />
                            <circle cx="15" cy="10" r="1.2" fill="#0f172a" />
                            {/* Curl Tail */}
                            <path d="M12 21 C15 21 16.5 19.5 16.5 18 C16.5 16.5 15 15.5 13.5 16" stroke="#00000030" strokeWidth="2" fill="none" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>

                      {/* Small text label showing username */}
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-[8px] font-bold text-white px-1.5 py-0.5 rounded border border-zinc-800 whitespace-nowrap z-20">
                        {p.name} {isMe && '(YOU)'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Licking attack visual effect line */}
              {tongueEffect && tongueEffect.active && (
                <div 
                  className="absolute pointer-events-none z-10 origin-left"
                  style={{
                    left: `${tongueEffect.x * (100 / 12)}%`,
                    top: `${tongueEffect.y * (100 / 12)}%`,
                    transform: `rotate(${tongueEffect.angle}deg)`,
                    width: '60px',
                    height: '4px',
                    background: 'linear-gradient(to right, #ec4899, #f43f5e, rgba(244, 63, 94, 0))',
                    borderRadius: '999px',
                    boxShadow: '0 0 8px #f43f5e',
                  }}
                />
              )}

            </div>

            {/* End of round results Overlay */}
            {roomState && roomState.status === 'ended' && (
              <div className="absolute inset-0 bg-zinc-950/90 z-30 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl relative">
                  
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-xl">
                    <Crown className="w-10 h-10 text-amber-400 animate-bounce" />
                  </div>

                  <h3 className="text-2xl font-extrabold text-white tracking-tight mt-6 mb-2">Round Concluded!</h3>
                  
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-wide mb-6">
                    Winner: {roomState.roundWinner === 'hiders' ? 'Chameleon Hiders! 🦎' : 'The Predator Hunter! 🐍'}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    {roomState.roundWinner === 'hiders' 
                      ? 'The Chameleons successfully blended into the floor tiles and collected enough flies before time ran out!' 
                      : 'The Hunter scanned the board, predicted the camping spots, and lick-captured all chameleons!'}
                  </p>

                  <div className="space-y-2 mb-8 text-left max-h-36 overflow-y-auto">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Match Highscores:</h4>
                    {listPlayers.slice(0, 3).map((p, idx) => (
                      <div key={p.id} className="flex justify-between text-xs bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-900">
                        <span className="font-semibold text-zinc-300">{idx + 1}. {p.name} ({p.role})</span>
                        <span className="font-mono text-emerald-400 font-bold">{p.score} pts</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleStartGame}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
                  >
                    Start New Round
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Touch controls for responsive play */}
            <div className="mt-6 flex flex-col items-center gap-1 w-full max-w-[280px] shrink-0 md:hidden">
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Touch Controls</span>
              <div className="flex justify-center w-full">
                <button onClick={() => handleMobileMove('up')} className="w-12 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center justify-center font-bold font-mono">▲</button>
              </div>
              <div className="flex justify-around w-full gap-2">
                <button onClick={() => handleMobileMove('left')} className="w-12 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center justify-center font-bold font-mono">◀</button>
                {mySelf?.role === 'seeker' ? (
                  <button onClick={handleTriggerAttack} className="flex-1 bg-red-600 hover:bg-red-500 text-white border border-red-500 text-xs font-bold rounded-lg uppercase">Lick</button>
                ) : (
                  <div className="flex-1 border border-zinc-800/40 rounded-lg bg-zinc-950/40" />
                )}
                <button onClick={() => handleMobileMove('right')} className="w-12 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center justify-center font-bold font-mono">▶</button>
              </div>
              <div className="flex justify-center w-full">
                <button onClick={() => handleMobileMove('down')} className="w-12 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center justify-center font-bold font-mono">▼</button>
              </div>
            </div>

          </div>

          {/* Right panel: Game Sidebar / Leaderboard & Chat Console */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/60 backdrop-blur-lg flex flex-col overflow-hidden shrink-0">
            
            {/* Seeker Controls Panel */}
            {mySelf && mySelf.role === 'seeker' && (
              <div className="p-4 bg-red-950/20 border-b border-red-900/30 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-1">Seeker Weapons Loaded</span>
                <p className="text-[10px] text-zinc-400 leading-normal mb-3">
                  Click the attack button below or press <strong>SPACEBAR</strong> on your keyboard to shoot your tongue and catch nearby chameleons!
                </p>
                <button
                  onClick={handleTriggerAttack}
                  className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/10"
                >
                  <Swords className="w-4 h-4" /> LICK ATTACK (SPACE)
                </button>
              </div>
            )}

            {/* Start Round Button for Lobby hosts */}
            {roomState && roomState.status === 'waiting' && (
              <div className="p-4 bg-emerald-950/15 border-b border-emerald-900/20 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Game Lobby Waiting</span>
                <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                  All players have assembled. Click the button below to initiate the round. Roles will be shuffled!
                </p>
                <button
                  onClick={handleStartGame}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  <Play className="w-4 h-4 fill-current" /> START MATCH ROUND
                </button>
              </div>
            )}

            {/* Leaderboard panel */}
            <div className="p-4 border-b border-zinc-800/80 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Match Leaderboard</span>
                <Award className="w-3.5 h-3.5 text-amber-500" />
              </div>

              <div className="space-y-1.5">
                {listPlayers.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg border ${
                      p.id === playerId ? 'bg-zinc-850 border-emerald-500/30' : 'bg-zinc-950/40 border-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-zinc-500">{idx + 1}</span>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.role === 'seeker' ? '#ef4444' : SKINS[p.skinId]?.primaryColor }} />
                      <span className="font-semibold truncate text-zinc-300">{p.name} {p.id === playerId && '⭐'}</span>
                      {!p.isAlive && <span className="text-[8px] bg-red-950 text-red-400 border border-red-900/30 rounded px-1">DEAD</span>}
                    </div>
                    <span className="font-mono font-bold text-zinc-200">{p.score}p</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Box Console */}
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/20">
              <div className="px-4 py-2.5 border-b border-zinc-800/50 flex items-center gap-1.5 shrink-0">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Lobby Chat Logs</span>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <p className="text-[10px] text-zinc-600 max-w-[180px] leading-relaxed">
                      No logs recorded. Use the textbox below to send strategies or taunt the Hunter!
                    </p>
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className="text-xs flex flex-col gap-0.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/40 leading-relaxed">
                      <div className="flex items-baseline justify-between">
                        <span className={`font-bold ${msg.sender.includes('SYSTEM') ? 'text-amber-400 font-extrabold' : 'text-emerald-400'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-[8px] text-zinc-600 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-zinc-300 break-words">{msg.text}</p>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input box */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-800 shrink-0 flex gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value.slice(0, 80))}
                  placeholder="Chat with players..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 p-2 rounded-lg transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
