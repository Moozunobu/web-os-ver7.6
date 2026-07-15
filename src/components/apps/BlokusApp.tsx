import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Play, Users, Bot, Layers, ArrowLeft, RefreshCw, Trophy, 
  Volume2, VolumeX, Sparkles, AlertCircle, RotateCw, FlipHorizontal, 
  Check, Swords, Flame, Sparkle
} from 'lucide-react';

// --- Supabase Credentials ---
const SUPABASE_URL = 'https://nsyvlftqcciyetsbhymg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lkhrFuMlNyEmUX4RTFApKw_AhD1sAkV';

// --- Types & Interfaces ---
interface Piece {
  id: number;
  name: string;
  size: number;
  blocks: [number, number][]; // coordinates relative to anchor [0,0]
}

type PlayerColor = 'blue' | 'orange' | 'yellow' | 'red' | 'green';

interface GameConfig {
  mode: 'ai' | 'online' | 'local';
  playerCount: 2 | 4;
}

// All 21 standard Blokus pieces
const PIECE_TEMPLATES: Piece[] = [
  // Size 1
  { id: 1, name: 'Monomino', size: 1, blocks: [[0, 0]] },
  
  // Size 2
  { id: 2, name: 'Domino', size: 2, blocks: [[0, 0], [0, 1]] },
  
  // Size 3
  { id: 3, name: 'Triomino I', size: 3, blocks: [[0, 0], [0, 1], [0, 2]] },
  { id: 4, name: 'Triomino L', size: 3, blocks: [[0, 0], [0, 1], [1, 0]] },
  
  // Size 4
  { id: 5, name: 'Tetramino I', size: 4, blocks: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: 6, name: 'Tetramino L', size: 4, blocks: [[0, 0], [0, 1], [0, 2], [1, 0]] },
  { id: 7, name: 'Tetramino T', size: 4, blocks: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: 8, name: 'Tetramino Square', size: 4, blocks: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: 9, name: 'Tetramino Z', size: 4, blocks: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  
  // Size 5 (Pentominoes)
  { id: 10, name: 'Pentomino I', size: 5, blocks: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { id: 11, name: 'Pentomino L', size: 5, blocks: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0]] },
  { id: 12, name: 'Pentomino Y', size: 5, blocks: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1]] },
  { id: 13, name: 'Pentomino P', size: 5, blocks: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { id: 14, name: 'Pentomino F', size: 5, blocks: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]] },
  { id: 15, name: 'Pentomino T', size: 5, blocks: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]] },
  { id: 16, name: 'Pentomino W', size: 5, blocks: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] },
  { id: 17, name: 'Pentomino U', size: 5, blocks: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
  { id: 18, name: 'Pentomino V', size: 5, blocks: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]] },
  { id: 19, name: 'Pentomino Z', size: 5, blocks: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]] },
  { id: 20, name: 'Pentomino X', size: 5, blocks: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },
  { id: 21, name: 'Pentomino N', size: 5, blocks: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]] },
];

const COLOR_METADATA: Record<PlayerColor, { name: string; hex: string; bg: string; text: string; border: string; shadow: string }> = {
  blue: { name: 'Cyan Blue', hex: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', shadow: 'shadow-cyan-500/50' },
  orange: { name: 'Sunset Orange', hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', shadow: 'shadow-orange-500/50' },
  yellow: { name: 'Gold Yellow', hex: '#eab308', bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400', shadow: 'shadow-yellow-400/50' },
  red: { name: 'Neon Red', hex: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500', shadow: 'shadow-rose-500/50' },
  green: { name: 'Emerald Green', hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', shadow: 'shadow-emerald-500/50' },
};

// Center blocks in a 5x5 grid helper
const getCenteredBlocks = (blocks: [number, number][]): [number, number][] => {
  const rCoords = blocks.map(([r]) => r);
  const cCoords = blocks.map(([, c]) => c);
  const minR = Math.min(...rCoords);
  const maxR = Math.max(...rCoords);
  const minC = Math.min(...cCoords);
  const maxC = Math.max(...cCoords);
  const h = maxR - minR + 1;
  const w = maxC - minC + 1;
  const offsetR = Math.floor((5 - h) / 2) - minR;
  const offsetC = Math.floor((5 - w) / 2) - minC;
  return blocks.map(([r, c]) => [r + offsetR, c + offsetC] as [number, number]);
};

export const BlokusApp: React.FC = () => {
  // --- General App States ---
  const [muted, setMuted] = useState(false);
  const [placementGuide, setPlacementGuide] = useState(false);
  const [gameState, setGameState] = useState<'menu' | 'setup' | 'room' | 'playing' | 'gameover'>('menu');
  const [config, setConfig] = useState<GameConfig>({ mode: 'ai', playerCount: 2 });
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('blue');
  const [playersOrder, setPlayersOrder] = useState<PlayerColor[]>(['blue', 'orange']);

  // --- Board & Grid Configurations ---
  const [boardSize, setBoardSize] = useState<number>(14); // 14 for Duo, 20 for Classic
  const [grid, setGrid] = useState<Record<string, PlayerColor>>({}); // key: "r-c", value: color
  const [playerDecks, setPlayerDecks] = useState<Record<PlayerColor, number[]>>({
    blue: PIECE_TEMPLATES.map(p => p.id),
    orange: PIECE_TEMPLATES.map(p => p.id),
    yellow: PIECE_TEMPLATES.map(p => p.id),
    red: PIECE_TEMPLATES.map(p => p.id),
    green: PIECE_TEMPLATES.map(p => p.id),
  });
  const [passedPlayers, setPassedPlayers] = useState<Record<PlayerColor, boolean>>({
    blue: false,
    orange: false,
    yellow: false,
    red: false,
    green: false,
  });

  // --- Active Selected Piece State ---
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [activeBlocks, setActiveBlocks] = useState<[number, number][]>([]);
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  
  // Hover and iPad/PC tap-preview states
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<{ r: number; c: number } | null>(null);

  // --- Online Multiplayer (Supabase) States ---
  const [roomCode, setRoomCode] = useState<string>('');
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<PlayerColor>('blue');
  const [statusText, setStatusText] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const supabaseRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // --- Synthesis Audio Engine ---
  const playSound = (type: 'clack' | 'click' | 'swish' | 'success' | 'error' | 'victory') => {
    if (muted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      if (type === 'clack') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(75, now + 0.14);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1300, now);
        osc2.frequency.exponentialRampToValueAtTime(320, now + 0.04);
        gain2.gain.setValueAtTime(0.12, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.05);
      } else if (type === 'swish') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(783.99, now + 0.07); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (type === 'victory') {
        const melody = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
        melody.forEach((freq, idx) => {
          const startTime = now + idx * 0.12;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.08, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.22);
        });
      }
    } catch (e) {
      console.warn('AudioContext synth failure:', e);
    }
  };

  // --- Piece Transformation Helpers ---
  const normalizeBlocks = (blocks: [number, number][]): [number, number][] => {
    const minR = Math.min(...blocks.map(([r]) => r));
    const minC = Math.min(...blocks.map(([, c]) => c));
    return blocks.map(([r, c]) => [r - minR, c - minC] as [number, number]);
  };

  const handleRotate = () => {
    if (activeBlocks.length === 0) return;
    playSound('swish');
    // 90 Deg clockwise: (r, c) => (c, -r)
    const rotated = activeBlocks.map(([r, c]) => [c, -r] as [number, number]);
    setActiveBlocks(normalizeBlocks(rotated));
  };

  const handleFlip = () => {
    if (activeBlocks.length === 0) return;
    playSound('swish');
    // Mirror horizontally: (r, c) => (r, -c)
    const flipped = activeBlocks.map(([r, c]) => [r, -c] as [number, number]);
    setActiveBlocks(normalizeBlocks(flipped));
  };

  // --- Rule Verification Engine ---
  const getStartingCorner = (color: PlayerColor, size: number): [number, number] => {
    if (size === 14) {
      return color === 'blue' ? [0, 0] : [13, 13];
    } else {
      switch (color) {
        case 'blue': return [0, 0];
        case 'yellow': return [0, 19];
        case 'red': return [19, 19];
        case 'green': return [19, 0];
        default: return [0, 0];
      }
    }
  };

  const isLegalPlacement = (
    blocks: [number, number][],
    targetR: number,
    targetC: number,
    color: PlayerColor,
    currentGrid: Record<string, PlayerColor>
  ): boolean => {
    const absBlocks = blocks.map(([dr, dc]) => [targetR + dr, targetC + dc] as [number, number]);

    // 1. Within bounds
    for (const [r, c] of absBlocks) {
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) return false;
    }

    // 2. No overlap with existing tiles
    for (const [r, c] of absBlocks) {
      if (currentGrid[`${r}-${c}`]) return false;
    }

    // Check if player has any tile placed
    const placedTiles = Object.keys(currentGrid).filter(k => currentGrid[k] === color);
    const hasPlacedAny = placedTiles.length > 0;

    if (!hasPlacedAny) {
      // 3. First move: Must cover the starting corner
      const corner = getStartingCorner(color, boardSize);
      const coversCorner = absBlocks.some(([r, c]) => r === corner[0] && c === corner[1]);
      if (!coversCorner) return false;
    } else {
      // 4. Corner-to-Corner Touch and No Flat-Side Touch of same color
      let hasCornerTouch = false;

      for (const [r, c] of absBlocks) {
        // Flat-sides of own color are forbidden
        const flatSides = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ];
        for (const [fr, fc] of flatSides) {
          if (fr >= 0 && fr < boardSize && fc >= 0 && fc < boardSize) {
            if (currentGrid[`${fr}-${fc}`] === color) return false;
          }
        }

        // Must touch at least one of own color diagonal corners
        const corners = [
          [r - 1, c - 1],
          [r - 1, c + 1],
          [r + 1, c - 1],
          [r + 1, c + 1],
        ];
        for (const [cr, cc] of corners) {
          if (cr >= 0 && cr < boardSize && cc >= 0 && cc < boardSize) {
            if (currentGrid[`${cr}-${cc}`] === color) {
              hasCornerTouch = true;
            }
          }
        }
      }

      if (!hasCornerTouch) return false;
    }

    return true;
  };

  // Find all valid coordinate placements for a given set of blocks/color on the grid
  const getLegalCoordsForBlocks = (blocks: [number, number][], color: PlayerColor, currentGrid: Record<string, PlayerColor>): [number, number][] => {
    const valid: [number, number][] = [];
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (isLegalPlacement(blocks, r, c, color, currentGrid)) {
          valid.push([r, c]);
        }
      }
    }
    return valid;
  };

  // --- Dynamic Highlighting of Legal Placements ---
  const activeLegalCoords = selectedPieceId ? getLegalCoordsForBlocks(activeBlocks, currentTurn, grid) : [];

  // Determine standard next turn ordering & pass cycle
  const getNextTurn = (
    currentGrid: Record<string, PlayerColor>,
    currentDecks: Record<PlayerColor, number[]>,
    currentPassed: Record<PlayerColor, boolean>,
    activeTurn: PlayerColor
  ): PlayerColor => {
    const activeOrder = playersOrder;
    const allPassed = activeOrder.every(color => currentPassed[color] || currentDecks[color].length === 0);
    
    if (allPassed) {
      return activeTurn;
    }

    const currentIdx = activeOrder.indexOf(activeTurn);
    let nextIdx = (currentIdx + 1) % activeOrder.length;
    let nextPlayer = activeOrder[nextIdx];

    let count = 0;
    while ((currentPassed[nextPlayer] || currentDecks[nextPlayer].length === 0) && count < activeOrder.length) {
      nextIdx = (nextIdx + 1) % activeOrder.length;
      nextPlayer = activeOrder[nextIdx];
      count++;
    }

    return nextPlayer;
  };

  const checkIfGameOver = (
    currentDecks: Record<PlayerColor, number[]>,
    currentPassed: Record<PlayerColor, boolean>
  ): boolean => {
    return playersOrder.every(color => currentPassed[color] || currentDecks[color].length === 0);
  };

  // --- Offline Smart Voxel AI Engine ---
  const makeAIMove = () => {
    const deck = playerDecks[currentTurn];
    if (deck.length === 0) {
      executePass(currentTurn);
      return;
    }

    // Sort pieces remaining by size descending to prioritize large shapes (Pentominoes first)
    const piecesSorted = [...deck]
      .map(id => PIECE_TEMPLATES.find(p => p.id === id)!)
      .filter(Boolean)
      .sort((a, b) => b.size - a.size);

    // Scan for any legal move
    for (const template of piecesSorted) {
      let baseBlocks = [...template.blocks];
      const orientations: [number, number][][] = [];
      let current = baseBlocks;
      
      for (let rot = 0; rot < 4; rot++) {
        orientations.push(current);
        const flipped = current.map(([r, c]) => [r, -c] as [number, number]);
        orientations.push(normalizeBlocks(flipped));
        current = normalizeBlocks(current.map(([r, c]) => [c, -r] as [number, number]));
      }

      // Check all coordinates for orientations
      for (const blocksOpt of orientations) {
        const legalCoords = getLegalCoordsForBlocks(blocksOpt, currentTurn, grid);
        if (legalCoords.length > 0) {
          // Greedy choice: pick a random legal coordinate for the largest piece
          const [chosenR, chosenC] = legalCoords[Math.floor(Math.random() * legalCoords.length)];
          
          const newGrid = { ...grid };
          blocksOpt.forEach(([dr, dc]) => {
            newGrid[`${chosenR + dr}-${chosenC + dc}`] = currentTurn;
          });

          const newDecks = {
            ...playerDecks,
            [currentTurn]: deck.filter(id => id !== template.id)
          };

          const isOver = checkIfGameOver(newDecks, passedPlayers);
          const nextTurn = isOver ? currentTurn : getNextTurn(newGrid, newDecks, passedPlayers, currentTurn);

          setGrid(newGrid);
          setPlayerDecks(newDecks);
          playSound('clack');

          if (isOver) {
            setGameState('gameover');
            playSound('victory');
          } else {
            setCurrentTurn(nextTurn);
          }
          return;
        }
      }
    }

    // If no moves found for any remaining pieces, AI passes
    executePass(currentTurn);
  };

  // Trigger AI turn after user or other player moves
  useEffect(() => {
    if (gameState === 'playing' && config.mode === 'ai' && currentTurn !== 'blue') {
      const isFinished = passedPlayers[currentTurn];
      if (isFinished) {
        const isOver = checkIfGameOver(playerDecks, passedPlayers);
        if (isOver) {
          setGameState('gameover');
          playSound('victory');
        } else {
          setCurrentTurn(getNextTurn(grid, playerDecks, passedPlayers, currentTurn));
        }
      } else {
        const timer = setTimeout(() => {
          makeAIMove();
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, [currentTurn, gameState, passedPlayers]);

  // --- Piece placement action logic ---
  const executePiecePlacement = (r: number, c: number, pieceId: number, blocks: [number, number][]) => {
    const newGrid = { ...grid };
    blocks.forEach(([dr, dc]) => {
      newGrid[`${r + dr}-${c + dc}`] = currentTurn;
    });

    const newDecks = {
      ...playerDecks,
      [currentTurn]: playerDecks[currentTurn].filter(id => id !== pieceId)
    };

    const isOver = checkIfGameOver(newDecks, passedPlayers);
    const nextTurn = isOver ? currentTurn : getNextTurn(newGrid, newDecks, passedPlayers, currentTurn);

    setGrid(newGrid);
    setPlayerDecks(newDecks);
    setSelectedPieceId(null);
    setPendingPlacement(null);
    setActiveBlocks([]);
    playSound('clack');

    if (isOver) {
      setGameState('gameover');
      playSound('victory');
    } else {
      setCurrentTurn(nextTurn);
    }

    // Sync online
    if (config.mode === 'online' && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'db_place_piece',
        payload: {
          grid: newGrid,
          playerDecks: newDecks,
          passedPlayers: passedPlayers,
          currentTurn: nextTurn,
          gameState: isOver ? 'gameover' : 'playing',
        },
      });
    }
  };

  const executePass = (player: PlayerColor) => {
    const updatedPassed = { ...passedPlayers, [player]: true };
    setPassedPlayers(updatedPassed);
    playSound('click');

    const isOver = checkIfGameOver(playerDecks, updatedPassed);
    const nextTurn = isOver ? currentTurn : getNextTurn(grid, playerDecks, updatedPassed, currentTurn);

    if (isOver) {
      setGameState('gameover');
      playSound('victory');
    } else {
      setCurrentTurn(nextTurn);
    }

    if (config.mode === 'online' && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'db_pass',
        payload: {
          passedPlayers: updatedPassed,
          currentTurn: nextTurn,
          gameState: isOver ? 'gameover' : 'playing',
        },
      });
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== 'playing' || !selectedPieceId) return;

    // Turn checking for online multiplayer
    if (config.mode === 'online' && currentTurn !== onlinePlayerColor) return;

    // Set pending placement instead of instantly placing
    setPendingPlacement({ r, c });
    playSound('click');
  };

  // --- Real-time Room System (Supabase Setup) ---
  const getSupabaseClient = () => {
    if (supabaseRef.current) return supabaseRef.current;
    try {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseRef.current = client;
      return client;
    } catch (err) {
      console.error('Supabase init error:', err);
      return null;
    }
  };

  const handleCreateRoom = () => {
    playSound('click');
    const normalizedRoom = roomCode.trim().toLowerCase();
    if (!normalizedRoom) {
      setErrorText('Please enter a room code');
      return;
    }
    setErrorText('');
    setStatusText('Creating room...');

    const client = getSupabaseClient();
    if (!client) {
      setErrorText('Check connection settings');
      return;
    }

    // Clean up any existing channel before creating/joining
    if (channelRef.current && supabaseRef.current) {
      try {
        supabaseRef.current.removeChannel(channelRef.current);
      } catch (e) {}
      channelRef.current = null;
    }

    try {
      setIsCreator(true);
      setOnlinePlayerColor('blue');

      // Use cleaner syntax as required by the spec
      const channel = client.channel(`blokus-room-${normalizedRoom}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'db_join' }, (payload: any) => {
          playSound('success');
          setStatusText('Opponent joined! Initializing Blokus Board...');
          
          channel.send({
            type: 'broadcast',
            event: 'db_init_board',
            payload: {
              playerCount: config.playerCount,
              boardSize,
              playersOrder: config.playerCount === 2 ? ['blue', 'orange'] : ['blue', 'yellow', 'red', 'green'],
            },
          });

          // Begin Game
          initializeBoardState(config.playerCount);
          setGameState('playing');
        })
        .on('broadcast', { event: 'db_place_piece' }, (payload: any) => {
          const { grid: nextGrid, playerDecks: nextDecks, passedPlayers: nextPassed, currentTurn: nextTurn, gameState: nextGameState } = payload.payload;
          setGrid(nextGrid);
          setPlayerDecks(nextDecks);
          setPassedPlayers(nextPassed);
          setCurrentTurn(nextTurn);
          setGameState(nextGameState);
          playSound('clack');
          if (nextGameState === 'gameover') {
            playSound('victory');
          }
        })
        .on('broadcast', { event: 'db_pass' }, (payload: any) => {
          const { passedPlayers: nextPassed, currentTurn: nextTurn, gameState: nextGameState } = payload.payload;
          setPassedPlayers(nextPassed);
          setCurrentTurn(nextTurn);
          setGameState(nextGameState);
          playSound('click');
          if (nextGameState === 'gameover') {
            playSound('victory');
          }
        })
        .on('broadcast', { event: 'db_leave' }, () => {
          setStatusText('Opponent disconnected');
          window.parent.postMessage({
            type: 'WETALKS_NEW_MESSAGE',
            payload: { sender: 'System', text: '対戦相手が退出しました。' }
          }, '*');
        });

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setGameState('room');
          setStatusText(`Hosted room [${normalizedRoom}]. Send this code to joiners!`);
        } else {
          setErrorText('Subscription failed. Try again.');
        }
      });
    } catch (e: any) {
      setErrorText(e.message || 'Room creation failed');
    }
  };

  const handleJoinRoom = () => {
    playSound('click');
    const normalizedRoom = roomCode.trim().toLowerCase();
    if (!normalizedRoom) {
      setErrorText('Please enter a room code');
      return;
    }
    setErrorText('');
    setStatusText('Entering room...');

    const client = getSupabaseClient();
    if (!client) {
      setErrorText('Connection error');
      return;
    }

    // Clean up any existing channel before creating/joining
    if (channelRef.current && supabaseRef.current) {
      try {
        supabaseRef.current.removeChannel(channelRef.current);
      } catch (e) {}
      channelRef.current = null;
    }

    try {
      setIsCreator(false);
      setOnlinePlayerColor(config.playerCount === 2 ? 'orange' : 'yellow');

      const channel = client.channel(`blokus-room-${normalizedRoom}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'db_init_board' }, (payload: any) => {
          playSound('success');
          const size = payload.payload.boardSize;
          const order = payload.payload.playersOrder;
          const count = payload.payload.playerCount;

          setBoardSize(size);
          setPlayersOrder(order);
          initializeBoardState(count);
          setGameState('playing');
        })
        .on('broadcast', { event: 'db_place_piece' }, (payload: any) => {
          const { grid: nextGrid, playerDecks: nextDecks, passedPlayers: nextPassed, currentTurn: nextTurn, gameState: nextGameState } = payload.payload;
          setGrid(nextGrid);
          setPlayerDecks(nextDecks);
          setPassedPlayers(nextPassed);
          setCurrentTurn(nextTurn);
          setGameState(nextGameState);
          playSound('clack');
          if (nextGameState === 'gameover') {
            playSound('victory');
          }
        })
        .on('broadcast', { event: 'db_pass' }, (payload: any) => {
          const { passedPlayers: nextPassed, currentTurn: nextTurn, gameState: nextGameState } = payload.payload;
          setPassedPlayers(nextPassed);
          setCurrentTurn(nextTurn);
          setGameState(nextGameState);
          playSound('click');
          if (nextGameState === 'gameover') {
            playSound('victory');
          }
        })
        .on('broadcast', { event: 'db_leave' }, () => {
          setStatusText('Opponent left');
          window.parent.postMessage({
            type: 'WETALKS_NEW_MESSAGE',
            payload: { sender: 'System', text: '対戦相手が退出しました。' }
          }, '*');
        });

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'db_join',
            payload: { active: true },
          });
          setStatusText('Synced! Awaiting host game initialization...');
        } else {
          setErrorText('Could not connect');
        }
      });
    } catch (e: any) {
      setErrorText(e.message || 'Join failed');
    }
  };

  // Cleanup on leave
  useEffect(() => {
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
    };
  }, []);

  // --- Reset & Initializer Helpers ---
  const initializeBoardState = (pCount: number) => {
    setGrid({});
    setPassedPlayers({
      blue: false,
      orange: false,
      yellow: false,
      red: false,
      green: false,
    });
    setPlayerDecks({
      blue: PIECE_TEMPLATES.map(p => p.id),
      orange: PIECE_TEMPLATES.map(p => p.id),
      yellow: PIECE_TEMPLATES.map(p => p.id),
      red: PIECE_TEMPLATES.map(p => p.id),
      green: PIECE_TEMPLATES.map(p => p.id),
    });
    setSelectedPieceId(null);
    setPendingPlacement(null);
    setActiveBlocks([]);
    setCurrentTurn('blue');
    
    if (pCount === 2) {
      setBoardSize(14);
      setPlayersOrder(['blue', 'orange']);
    } else {
      setBoardSize(20);
      setPlayersOrder(['blue', 'yellow', 'red', 'green']);
    }
  };

  const handleSelectSetup = () => {
    playSound('click');
    initializeBoardState(config.playerCount);
    setGameState('setup');
  };

  const handleReturnMenu = () => {
    playSound('click');
    if (channelRef.current && supabaseRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'db_leave', payload: {} });
      supabaseRef.current.removeChannel(channelRef.current);
    }
    channelRef.current = null;
    setGameState('menu');
  };

  const calculateScore = (color: PlayerColor): number => {
    return Object.values(grid).filter(v => v === color).length;
  };

  const handlePieceSelect = (pieceId: number) => {
    if (gameState !== 'playing') return;
    playSound('click');
    const piece = PIECE_TEMPLATES.find(p => p.id === pieceId);
    if (piece) {
      setSelectedPieceId(pieceId);
      setActiveBlocks(normalizeBlocks(piece.blocks));
      setPendingPlacement(null); // Reset when piece selection shifts
    }
  };

  const filteredTemplates = PIECE_TEMPLATES.filter((p) => {
    const isAvailable = playerDecks[currentTurn]?.includes(p.id);
    if (!isAvailable) return false;

    if (selectedSizeFilter === 'small') return p.size <= 3;
    if (selectedSizeFilter === 'medium') return p.size === 4;
    if (selectedSizeFilter === 'large') return p.size === 5;
    return true;
  });

  return (
    <div id="blokus-app" className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 select-none font-sans overflow-hidden">
      
      {/* Top Header Navigation bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg">
            <span className="font-extrabold text-xs tracking-tight text-white">BK</span>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">BLOKUS (ブロックス)</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Clubhouse Voxel Board</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {gameState === 'playing' && (
            <button
              onClick={() => {
                playSound('click');
                setPlacementGuide(!placementGuide);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
                placementGuide 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkle className="w-3.5 h-3.5" />
              Guide: {placementGuide ? 'ON' : 'OFF'}
            </button>
          )}

          <button
            onClick={() => setMuted(!muted)}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {gameState !== 'menu' && (
            <button
              onClick={handleReturnMenu}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-lg font-bold flex items-center gap-1 transition-all border border-zinc-750 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Screen */}
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 relative overflow-y-auto">

        {/* 1. STARTUP MAIN MENU */}
        {gameState === 'menu' && (
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-850 p-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-8 text-center animate-fade-in mx-4">
            <div>
              <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/20 rounded-full text-[10px] text-amber-400 font-extrabold tracking-widest uppercase mb-4 inline-block">
                Clubhouse Masterpiece
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight leading-none">BLOKUS</h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Connect corner-to-corner. Block your rivals. Dominate the dynamic voxel grid board.
              </p>
            </div>

            {/* Selection Grid */}
            <div className="w-full flex flex-col gap-4">
              <button
                onClick={() => {
                  setConfig({ mode: 'ai', playerCount: 2 });
                  handleSelectSetup();
                }}
                className="w-full p-4 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-white">VS Computer AI</h3>
                    <p className="text-[10px] text-zinc-400">Play offline duo with tactical neural bots</p>
                  </div>
                </div>
                <Play className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setConfig({ mode: 'online', playerCount: 2 });
                  handleSelectSetup();
                }}
                className="w-full p-4 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-white">Online Real-Time Sync</h3>
                    <p className="text-[10px] text-zinc-400">Play cross-device using Supabase broadcast</p>
                  </div>
                </div>
                <Play className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setConfig({ mode: 'local', playerCount: 4 });
                  handleSelectSetup();
                }}
                className="w-full p-4 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-500/50 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-white">4-Player Local Classic</h3>
                    <p className="text-[10px] text-zinc-400">Multiplayer party on a full 20x20 grid</p>
                  </div>
                </div>
                <Play className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* 2. GAME SETUP OVERLAY */}
        {gameState === 'setup' && (
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-850 p-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-6 mx-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playSound('click');
                  setGameState('menu');
                }}
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-black text-white">Match Configuration</h2>
            </div>

            {/* Board Size Selection */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Choose Game Format
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    playSound('click');
                    setConfig({ ...config, playerCount: 2 });
                    setBoardSize(14);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    config.playerCount === 2
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <h4 className="text-xs font-black">2-Player Duo</h4>
                  <p className="text-[10px] opacity-70 mt-1">14x14 grid, standard 2-color duel</p>
                </button>

                <button
                  disabled={config.mode === 'online'}
                  onClick={() => {
                    playSound('click');
                    setConfig({ ...config, playerCount: 4 });
                    setBoardSize(20);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    config.playerCount === 4
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  } disabled:opacity-40`}
                >
                  <h4 className="text-xs font-black">4-Player Classic</h4>
                  <p className="text-[10px] opacity-70 mt-1">20x20 grid, 4-color free-for-all</p>
                </button>
              </div>
            </div>

            {/* Action Launcher */}
            {config.mode !== 'online' ? (
              <button
                onClick={() => {
                  playSound('click');
                  initializeBoardState(config.playerCount);
                  setGameState('playing');
                }}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-[1.01] cursor-pointer"
              >
                Launch Offline Game
              </button>
            ) : (
              // Supabase multiplayer inputs
              <div className="flex flex-col gap-4 border-t border-zinc-800 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400">Match Connection Code</label>
                  <input
                    type="text"
                    placeholder="ENTER MATCH ID"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-center text-sm font-black tracking-widest placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-all uppercase"
                  />
                </div>

                {errorText && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/30 text-red-400 text-[11px] rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorText}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCreateRoom}
                    className="py-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Host Lobby
                  </button>
                  <button
                    onClick={handleJoinRoom}
                    className="py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    Join Lobby
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. MULTIPLAYER SYNC WAITING SCREEN */}
        {gameState === 'room' && (
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-850 p-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 text-center mx-4">
            <span className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-bounce text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">Lobby is Active</h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Send the Match Code to another device to sync the Duo Blokus boards in real time.
              </p>
            </div>

            <div className="px-6 py-4 bg-zinc-950 border border-zinc-850 rounded-xl font-mono text-xl font-black tracking-widest text-white uppercase shadow-inner">
              {roomCode}
            </div>

            {statusText && (
              <p className="text-xs text-indigo-400 font-bold animate-pulse">{statusText}</p>
            )}

            <button
              onClick={handleReturnMenu}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </div>
        )}

        {/* 4. ACTIVE GAME BOARD */}
        {(gameState === 'playing' || gameState === 'gameover') && (
          <div className="flex flex-col lg:flex-row h-full overflow-hidden p-3 gap-3 w-full max-w-7xl px-4 lg:px-8 py-4">
            
            {/* Left Sidebar: Scoreboard & Player Turns */}
            <div className="w-full lg:w-72 flex flex-col gap-4 flex-shrink-0 min-h-0">
              <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> SCOREBOARD
                </h3>

                <div className="flex flex-col gap-2">
                  {playersOrder.map((color) => {
                    const meta = COLOR_METADATA[color];
                    const score = calculateScore(color);
                    const isTurn = currentTurn === color;
                    const isPassed = passedPlayers[color];
                    
                    return (
                      <div
                        key={color}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isTurn
                            ? `bg-${color === 'blue' ? 'cyan' : color === 'red' ? 'rose' : color === 'green' ? 'emerald' : color}-500/10 border-${color === 'blue' ? 'cyan' : color === 'red' ? 'rose' : color === 'green' ? 'emerald' : color}-500/30 ${meta.shadow}/10`
                            : 'bg-zinc-900 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${meta.bg}`} />
                          <div>
                            <p className="text-xs font-extrabold capitalize text-white flex items-center gap-1">
                              {meta.name}
                              {config.mode === 'online' && onlinePlayerColor === color && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1 rounded font-bold">You</span>
                              )}
                              {config.mode === 'ai' && color !== 'blue' && (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1 rounded font-bold font-mono">Bot</span>
                              )}
                            </p>
                            {isPassed && <span className="text-[9px] text-zinc-500 font-bold">Passed</span>}
                          </div>
                        </div>
                        <span className={`text-sm font-black ${meta.text}`}>{score} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deck Info & Selection filter */}
              <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-4 flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    YOUR DECK
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    {playerDecks[currentTurn]?.length || 0} Pieces left
                  </span>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-4 gap-1">
                  {(['all', 'small', 'medium', 'large'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedSizeFilter(cat)}
                      className={`py-1 px-1 text-[9px] font-bold uppercase rounded-md border text-center transition-all cursor-pointer ${
                        selectedSizeFilter === cat
                          ? 'bg-zinc-800 border-zinc-700 text-white'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid Deck View - Completely visual 5x5 centered grid previews without confusing labels */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
                  <div className="grid grid-cols-3 gap-2">
                    {filteredTemplates.map((p) => {
                      const isSelected = selectedPieceId === p.id;
                      const centered = getCenteredBlocks(p.blocks);
                      
                      return (
                        <div
                          key={p.id}
                          onClick={() => handlePieceSelect(p.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center relative aspect-square ${
                            isSelected
                              ? 'bg-indigo-500/15 border-indigo-500/80 shadow-[0_4px_12px_rgba(99,102,241,0.25)] scale-[1.02]'
                              : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-850'
                          }`}
                        >
                          {/* Centered 5x5 Shape grid */}
                          <div className="grid grid-cols-5 gap-0.5 w-full h-full p-1">
                            {Array.from({ length: 25 }).map((_, idx) => {
                              const r = Math.floor(idx / 5);
                              const c = idx % 5;
                              const isFilled = centered.some(([br, bc]) => br === r && bc === c);
                              return (
                                <div
                                  key={idx}
                                  className={`aspect-square rounded-[1px] transition-all duration-100 ${
                                    isFilled 
                                      ? COLOR_METADATA[currentTurn].bg 
                                      : 'bg-zinc-900/10'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Turn / Pass Panel */}
                <button
                  disabled={passedPlayers[currentTurn] || (config.mode === 'online' && currentTurn !== onlinePlayerColor)}
                  onClick={() => executePass(currentTurn)}
                  className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-750 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                >
                  Pass Turn (パス)
                </button>
              </div>
            </div>

            {/* Middle: Blokus Felt Board Frame */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4 pb-12 min-h-0">
              
              {/* Turn Banner Info */}
              <div className="w-full max-w-[380px] flex items-center justify-between bg-zinc-900/60 border border-zinc-850 px-4 py-2.5 rounded-xl backdrop-blur-sm mx-auto">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${COLOR_METADATA[currentTurn].bg} animate-pulse`} />
                  <span className="text-xs font-bold text-white uppercase">
                    {COLOR_METADATA[currentTurn].name}'s Turn
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">
                  {config.mode === 'online' ? `Room: ${roomCode}` : 'Offline Mode'}
                </span>
              </div>

              {/* Clubhouse Velvet Voxel Table Board */}
              <div 
                className="relative w-full max-w-[340px] md:max-w-[380px] aspect-square mx-auto max-h-[340px] md:max-h-[380px] bg-[#1a2e1d] border-[12px] border-amber-950 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex items-center justify-center p-4 select-none"
                style={{ touchAction: 'none' }}
              >
                {/* Felt coordinate lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#223d26_1px,transparent_1px)] [background-size:12px_12px] opacity-40 rounded-2xl pointer-events-none" />

                <div 
                  className="w-full h-full grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: boardSize }).map((_, rIdx) => (
                    Array.from({ length: boardSize }).map((_, cIdx) => {
                      const color = grid[`${rIdx}-${cIdx}`];
                      const meta = color ? COLOR_METADATA[color] : null;
                      
                      // Check corner starting points highlight
                      const cornerBlue = getStartingCorner('blue', boardSize);
                      const cornerOpponent = getStartingCorner(config.playerCount === 2 ? 'orange' : 'red', boardSize);
                      const isCorner = (rIdx === cornerBlue[0] && cIdx === cornerBlue[1]) || (rIdx === cornerOpponent[0] && cIdx === cornerOpponent[1]);

                      // Floating piece placement preview & locking
                      let isPreview = false;
                      let isPreviewValid = false;
                      const activeAnchor = pendingPlacement || hoveredCell;
                      
                      if (selectedPieceId && activeAnchor) {
                        const dr = rIdx - activeAnchor.r;
                        const dc = cIdx - activeAnchor.c;
                        const hasBlock = activeBlocks.some(([br, bc]) => br === dr && bc === dc);
                        if (hasBlock) {
                          isPreview = true;
                          isPreviewValid = isLegalPlacement(activeBlocks, activeAnchor.r, activeAnchor.c, currentTurn, grid);
                        }
                      }

                      // Guide highlight
                      const hasGuide = placementGuide && activeLegalCoords.some(([gr, gc]) => gr === rIdx && gc === cIdx);

                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`relative aspect-square rounded-sm transition-all duration-100 flex items-center justify-center cursor-pointer ${
                            meta
                              ? `${meta.bg} shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_4px_rgba(0,0,0,0.4)] border border-black/20`
                              : isPreview
                                ? isPreviewValid
                                  ? `${COLOR_METADATA[currentTurn].bg}/45 border border-emerald-400 shadow-[inset_0_0_8px_rgba(52,211,153,0.3)] animate-pulse`
                                  : 'bg-rose-500/35 border border-rose-500/60 cursor-not-allowed'
                                : hasGuide
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30'
                                  : 'bg-[#213a25] hover:bg-[#28462c] border border-[#1b301e]'
                          }`}
                          onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                        >
                          {/* Starting corner marker */}
                          {isCorner && !color && !isPreview && (
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-yellow-400/40 animate-pulse" />
                          )}

                          {/* Guide dot */}
                          {hasGuide && !color && !isPreview && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                          )}
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>

              {/* Selected Piece Action Control & Premium Confirmation Bar */}
              {selectedPieceId && (
                <div className="w-full max-w-[480px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRotate}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Rotate
                    </button>
                    <button
                      onClick={handleFlip}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 text-orange-400" /> Flip
                    </button>
                    <button
                      onClick={() => {
                        playSound('click');
                        setSelectedPieceId(null);
                        setPendingPlacement(null);
                        setActiveBlocks([]);
                      }}
                      className="px-3 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-zinc-350 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <button
                    disabled={!pendingPlacement || !isLegalPlacement(activeBlocks, pendingPlacement.r, pendingPlacement.c, currentTurn, grid) || (config.mode === 'online' && currentTurn !== onlinePlayerColor)}
                    onClick={() => {
                      if (pendingPlacement) {
                        executePiecePlacement(pendingPlacement.r, pendingPlacement.c, selectedPieceId, activeBlocks);
                      }
                    }}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      pendingPlacement && isLegalPlacement(activeBlocks, pendingPlacement.r, pendingPlacement.c, currentTurn, grid) && (config.mode !== 'online' || currentTurn === onlinePlayerColor)
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
                        : 'bg-zinc-800 text-zinc-600 border border-zinc-850 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    配置を確定
                  </button>
                </div>
              )}
            </div>

            {/* Victory / Game Over Overlay */}
            {gameState === 'gameover' && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50">
                <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 text-center">
                  <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                  <div>
                    <h2 className="text-2xl font-black text-white">Match Concluded!</h2>
                    <p className="text-xs text-zinc-400 mt-1">Final scores counted by voxel coverage</p>
                  </div>

                  <div className="w-full bg-zinc-950 p-4 rounded-xl space-y-2.5 text-left border border-zinc-850">
                    {playersOrder.map((color) => {
                      const score = calculateScore(color);
                      return (
                        <div key={color} className="flex justify-between items-center text-sm font-bold">
                          <span className="capitalize text-zinc-300 flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${COLOR_METADATA[color].bg}`} />
                            {COLOR_METADATA[color].name}
                          </span>
                          <span className={COLOR_METADATA[color].text}>{score} pts</span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      playSound('click');
                      initializeBoardState(config.playerCount);
                      setGameState('playing');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-extrabold text-xs tracking-widest uppercase rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
