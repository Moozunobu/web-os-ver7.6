import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Cpu, Users, User, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';

export interface Opponent {
  id: string;
  name: string;
  grid: number[][];
  score: number;
  isGameOver: boolean;
  lastActive: number;
}

// --- Supabase Credentials ---
const SUPABASE_URL = 'https://nsyvlftqcciyetsbhymg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lkhrFuMlNyEmUX4RTFApKw_AhD1sAkV';

// Tetromino definitions (1-indexed for color mapping)
const SHAPES = [
  [], // Empty
  [[1, 1, 1, 1]], // I (Cyan)
  [
    [2, 0, 0],
    [2, 2, 2]
  ], // J (Blue)
  [
    [0, 0, 3],
    [3, 3, 3]
  ], // L (Orange)
  [
    [4, 4],
    [4, 4]
  ], // O (Yellow)
  [
    [0, 5, 5],
    [5, 5, 0]
  ], // S (Green)
  [
    [0, 6, 0],
    [6, 6, 6]
  ], // T (Purple)
  [
    [7, 7, 0],
    [0, 7, 7]
  ]  // Z (Red)
];

const COLORS = [
  'bg-transparent border-transparent', // 0
  'bg-cyan-500 border-cyan-400 shadow-cyan-500/50', // 1: I
  'bg-blue-600 border-blue-500 shadow-blue-600/50', // 2: J
  'bg-orange-500 border-orange-400 shadow-orange-500/50', // 3: L
  'bg-yellow-500 border-yellow-400 shadow-yellow-500/50', // 4: O
  'bg-green-500 border-green-400 shadow-green-500/50', // 5: S
  'bg-purple-600 border-purple-500 shadow-purple-600/50', // 6: T
  'bg-red-600 border-red-500 shadow-red-600/50', // 7: Z
  'bg-zinc-600 border-zinc-500 shadow-zinc-600/40 pattern-garbage' // 8: Garbage block
];

interface ActivePiece {
  shape: number[][];
  x: number;
  y: number;
  id: number;
}

export function TetrisApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<'single' | 'ai' | 'online'>('single');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Player state
  const [grid, setGrid] = useState<number[][]>(() => Array.from({ length: 20 }, () => Array(10).fill(0)));
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [holdPiece, setHoldPiece] = useState<number | null>(null);
  const [nextPieces, setNextPieces] = useState<number[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasHeld, setHasHeld] = useState(false);
  const [activeMessage, setActiveMessage] = useState<{ id: number; text: string; subtext?: string; color: string } | null>(null);

  // Opponent state (for VS AI and Online modes)
  const [opponentGrid, setOpponentGrid] = useState<number[][]>(() => Array.from({ length: 20 }, () => Array(10).fill(0)));
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [opponentIsGameOver, setOpponentIsGameOver] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'connected' | 'ended'>('idle');

  // Active piece reference/state
  const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);

  // Websocket client reference
  const wsRef = useRef<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  // --- Online Multiplayer State (Supabase) ---
  const [onlineRoomCode, setOnlineRoomCode] = useState<string>('');
  const [onlineIsCreator, setOnlineIsCreator] = useState<boolean>(false);
  const [onlinePlayerId, setOnlinePlayerId] = useState<'p1' | 'p2'>('p1');
  const [onlineStatusText, setOnlineStatusText] = useState<string>('');
  const [onlineErrorText, setOnlineErrorText] = useState<string>('');
  const [onlineSetupState, setOnlineSetupState] = useState<'menu' | 'setup' | 'room' | 'playing'>('menu');
  const supabaseRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // --- Up to 5 Players Multiplayer State ---
  const myPlayerId = useRef<string>('p_' + Math.random().toString(36).substr(2, 6));
  const myUsername = localStorage.getItem('wetalks_logged_in_user') || 'Player_' + Math.random().toString(36).substr(2, 4);
  const [opponents, setOpponents] = useState<Record<string, Opponent>>({});

  const getSupabaseClient = () => {
    if (supabaseRef.current) return supabaseRef.current;
    try {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseRef.current = client;
      return client;
    } catch (err) {
      console.error('Supabase init failed:', err);
      return null;
    }
  };

  // References for game loop
  const gridRef = useRef<number[][]>(grid);
  const activePieceRef = useRef<ActivePiece | null>(null);
  const holdPieceRef = useRef<number | null>(null);
  const hasHeldRef = useRef<boolean>(false);
  const isGameOverRef = useRef<boolean>(false);
  const nextPiecesRef = useRef<number[]>([]);
  const garbageQueueRef = useRef<number>(0); // Lines of garbage waiting to be injected

  // Lock delay references
  const lockDelayTimeoutRef = useRef<any>(null);
  const firstTouchTimeRef = useRef<number | null>(null);
  const lastActionTimeRef = useRef<number | null>(null);
  const lastActionWasRotateRef = useRef<boolean>(false);

  // Sync references
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { activePieceRef.current = activePiece; }, [activePiece]);
  useEffect(() => { holdPieceRef.current = holdPiece; }, [holdPiece]);
  useEffect(() => { hasHeldRef.current = hasHeld; }, [hasHeld]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { nextPiecesRef.current = nextPieces; }, [nextPieces]);

  // Clean up lock delay timeout on unmount
  useEffect(() => {
    return () => {
      if (lockDelayTimeoutRef.current) {
        clearTimeout(lockDelayTimeoutRef.current);
      }
      if (channelRef.current && supabaseRef.current) {
        try {
          supabaseRef.current.removeChannel(channelRef.current);
        } catch (e) {}
      }
    };
  }, []);

  // Auto-clear T-spin / Special notification messages
  useEffect(() => {
    if (activeMessage) {
      const timer = setTimeout(() => {
        setActiveMessage(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeMessage]);

  // Audio synthesizer for classic retro sound effects
  const playSound = useCallback((type: 'move' | 'rotate' | 'clear' | 'hold' | 'gameover' | 'level' | 'garbage') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'move') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'rotate') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
      } else if (type === 'clear') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.16);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'hold') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'level') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'garbage') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // Audio context disabled
    }
  }, [soundEnabled]);

  // Check collision helper
  const checkCollision = useCallback((board: number[][], shape: number[][], px: number, py: number): boolean => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardX = px + c;
          const boardY = py + r;
          if (boardX < 0 || boardX >= 10 || boardY >= 20) {
            return true;
          }
          if (boardY >= 0 && board[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Generate random piece ID queue
  const generateNewQueue = useCallback(() => {
    const ids = [1, 2, 3, 4, 5, 6, 7];
    // Shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }, []);

  // Spawn new piece
  const spawnPiece = useCallback((currentNextQueue: number[]) => {
    let queue = [...currentNextQueue];
    if (queue.length < 5) {
      queue = [...queue, ...generateNewQueue()];
    }
    const nextId = queue.shift()!;
    const nextShape = SHAPES[nextId];
    
    // Calculate initial centered X coordinate
    const startX = Math.floor((10 - nextShape[0].length) / 2);
    const startY = 0;

    const newPiece: ActivePiece = {
      shape: nextShape,
      x: startX,
      y: startY,
      id: nextId
    };

    if (checkCollision(gridRef.current, nextShape, startX, startY)) {
      setIsGameOver(true);
      playSound('gameover');
      if (gameMode === 'online' && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'tetris_gameover',
          payload: { playerId: myPlayerId.current }
        });
      }
    } else {
      // Reset lock delay refs for the new piece
      if (lockDelayTimeoutRef.current) {
        clearTimeout(lockDelayTimeoutRef.current);
        lockDelayTimeoutRef.current = null;
      }
      firstTouchTimeRef.current = null;
      lastActionTimeRef.current = null;
      lastActionWasRotateRef.current = false;

      setActivePiece(newPiece);
      activePieceRef.current = newPiece;
      setNextPieces(queue);
      setHasHeld(false);
    }
  }, [generateNewQueue, checkCollision, playSound, gameMode, roomId]);

  // Inject pending garbage lines
  const injectGarbageLines = useCallback(() => {
    const linesToInject = garbageQueueRef.current;
    if (linesToInject <= 0) return;
    
    setGrid((prevGrid) => {
      let nextGrid = prevGrid.map((row) => [...row]);
      // Remove top rows to accommodate the new garbage lines
      nextGrid.splice(0, linesToInject);

      // Create garbage lines
      const holeCol = Math.floor(Math.random() * 10);
      for (let i = 0; i < linesToInject; i++) {
        const garbageRow = Array(10).fill(8); // 8 is garbage block
        garbageRow[holeCol] = 0; // Empty slot for the hole
        nextGrid.push(garbageRow);
      }

      garbageQueueRef.current = 0;
      playSound('garbage');
      return nextGrid;
    });
  }, [playSound]);

  // Rotate piece matrix counter-clockwise
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const r = matrix.length;
    const c = matrix[0].length;
    const rotated = Array.from({ length: c }, () => Array(r).fill(0));
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        rotated[j][r - 1 - i] = matrix[i][j];
      }
    }
    return rotated;
  };

  const rotateMatrixCCW = (matrix: number[][]): number[][] => {
    const r = matrix.length;
    const c = matrix[0].length;
    const rotated = Array.from({ length: c }, () => Array(r).fill(0));
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        rotated[c - 1 - j][i] = matrix[i][j];
      }
    }
    return rotated;
  };

  // Helper to find the center of a T-piece shape
  const findTCenter = (shape: number[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 6) {
          let count = 0;
          if (r > 0 && shape[r - 1][c] === 6) count++;
          if (r < shape.length - 1 && shape[r + 1][c] === 6) count++;
          if (c > 0 && shape[r][c - 1] === 6) count++;
          if (c < shape[r].length - 1 && shape[r][c + 1] === 6) count++;
          if (count === 3) {
            return { r, c };
          }
        }
      }
    }
    return null;
  };

  // Helper to check if a corner cell around T-piece is occupied (by wall, floor, or grid block)
  const isCornerOccupied = (board: number[][], x: number, y: number): boolean => {
    if (x < 0 || x >= 10 || y >= 20) {
      return true; // Wall or floor is occupied
    }
    if (y < 0) {
      return false; // Ceiling / above playfield is empty
    }
    return board[y][x] !== 0;
  };

  // Lock active piece onto grid, check for line clears, and update stats
  const lockPiece = useCallback((piece: ActivePiece) => {
    setGrid((prevGrid) => {
      const nextGrid = prevGrid.map((row) => [...row]);
      
      // Place piece
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c] !== 0) {
            const boardY = piece.y + r;
            const boardX = piece.x + c;
            if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
              nextGrid[boardY][boardX] = piece.id;
            }
          }
        }
      }

      // T-spin detection
      let isTSpin = false;
      if (piece.id === 6 && lastActionWasRotateRef.current) {
        const center = findTCenter(piece.shape);
        if (center) {
          const cy = piece.y + center.r;
          const cx = piece.x + center.c;

          let occupiedCorners = 0;
          if (isCornerOccupied(nextGrid, cx - 1, cy - 1)) occupiedCorners++;
          if (isCornerOccupied(nextGrid, cx + 1, cy - 1)) occupiedCorners++;
          if (isCornerOccupied(nextGrid, cx - 1, cy + 1)) occupiedCorners++;
          if (isCornerOccupied(nextGrid, cx + 1, cy + 1)) occupiedCorners++;

          if (occupiedCorners >= 3) {
            isTSpin = true;
          }
        }
      }

      // Detect fully cleared rows
      let linesCleared = 0;
      const filteredGrid = nextGrid.filter((row) => {
        const isFull = row.every((cell) => cell !== 0);
        if (isFull) linesCleared++;
        return !isFull;
      });

      // Refill top with empty rows
      while (filteredGrid.length < 20) {
        filteredGrid.unshift(Array(10).fill(0));
      }

      // Score and special message determination
      let gain = 0;
      let messageText = '';
      let messageColor = '';

      if (isTSpin) {
        if (linesCleared === 0) {
          gain = 400 * level;
          messageText = 'T-SPIN!';
          messageColor = 'text-purple-400 bg-purple-950/60 border border-purple-500/40 shadow-lg shadow-purple-500/20';
        } else if (linesCleared === 1) {
          gain = 800 * level;
          messageText = 'T-SPIN SINGLE!';
          messageColor = 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 shadow-lg shadow-cyan-500/20';
        } else if (linesCleared === 2) {
          gain = 1200 * level;
          messageText = 'T-SPIN DOUBLE!';
          messageColor = 'text-amber-400 bg-amber-950/60 border border-amber-500/40 shadow-lg shadow-amber-500/20';
        } else if (linesCleared >= 3) {
          gain = 1600 * level;
          messageText = 'T-SPIN TRIPLE!';
          messageColor = 'text-red-400 bg-red-950/60 border border-red-500/40 shadow-lg shadow-red-500/20';
        }
      } else {
        if (linesCleared === 4) {
          gain = 800 * level;
          messageText = 'TETRIS!';
          messageColor = 'text-pink-400 bg-pink-950/60 border border-pink-500/40 shadow-lg shadow-pink-500/20';
        } else if (linesCleared > 0) {
          const blocksInRow = 10;
          const totalBlocksCleared = linesCleared * blocksInRow;
          const scorePerBlock = 10; // 10 points per block, so 100 points per row
          gain = totalBlocksCleared * scorePerBlock * level;
        }
      }

      if (gain > 0) {
        setScore((prev) => prev + gain);
      }

      if (linesCleared > 0) {
        playSound('clear');
        setLines((prev) => {
          const nextLines = prev + linesCleared;
          const targetLevel = Math.floor(nextLines / 10) + 1;
          if (targetLevel > level) {
            setLevel(targetLevel);
            playSound('level');
          }
          return nextLines;
        });
      }

      if (messageText !== '') {
        setActiveMessage({
          id: Date.now(),
          text: messageText,
          subtext: `+${gain} PTS`,
          color: messageColor,
        });
      }

      // Garbage transmission rules based on standard competitive Tetris:
      let garbageToSend = 0;
      if (isTSpin) {
        if (linesCleared === 1) garbageToSend = 2;
        else if (linesCleared === 2) garbageToSend = 4;
        else if (linesCleared >= 3) garbageToSend = 6;
      } else {
        if (linesCleared === 2) garbageToSend = 1;
        else if (linesCleared === 3) garbageToSend = 2;
        else if (linesCleared === 4) garbageToSend = 4;
      }

      if (garbageToSend > 0) {
        if (gameMode === 'ai') {
          triggerAIGarbage(garbageToSend);
        } else if (gameMode === 'online' && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'tetris_send_garbage',
            payload: { lines: garbageToSend }
          });
        }
      }

      // Sync updated state to online opponent
      if (gameMode === 'online' && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'tetris_sync_grid',
          payload: {
            playerId: myPlayerId.current,
            username: myUsername,
            grid: filteredGrid,
            score: score + gain,
            isGameOver: isGameOverRef.current
          }
        });
      }

      return filteredGrid;
    });

    // Handle any incoming garbage lines and spawn next piece
    setTimeout(() => {
      injectGarbageLines();
      spawnPiece(nextPiecesRef.current);
    }, 0);
  }, [level, playSound, spawnPiece, gameMode, roomId, injectGarbageLines, score]);

  // Update lock delay timeout and evaluation
  const updateLockDelay = useCallback((piece: ActivePiece) => {
    const isTouchingGround = checkCollision(gridRef.current, piece.shape, piece.x, piece.y + 1);
    
    // Clear any existing timeout
    if (lockDelayTimeoutRef.current) {
      clearTimeout(lockDelayTimeoutRef.current);
      lockDelayTimeoutRef.current = null;
    }

    if (!isTouchingGround) {
      // Not touching ground, reset times
      firstTouchTimeRef.current = null;
      lastActionTimeRef.current = null;
      return;
    }

    // Touching ground!
    const now = Date.now();
    if (firstTouchTimeRef.current === null) {
      firstTouchTimeRef.current = now;
    }
    if (lastActionTimeRef.current === null) {
      lastActionTimeRef.current = now;
    }

    const elapsedFromFirstTouch = now - firstTouchTimeRef.current;
    
    // Calculate how much time remains until the 1.5s limit
    const timeUntilMaxCeiling = Math.max(0, 1500 - elapsedFromFirstTouch);
    
    // Calculate how much time remains until the 0.5s (500ms) action limit
    const elapsedFromLastAction = now - lastActionTimeRef.current;
    const timeUntilActionTimeout = Math.max(0, 500 - elapsedFromLastAction);

    // Target remaining delay is the minimum of both
    const remainingDelay = Math.min(timeUntilMaxCeiling, timeUntilActionTimeout);

    if (remainingDelay <= 0) {
      // Lock immediately
      lockPiece(piece);
      firstTouchTimeRef.current = null;
      lastActionTimeRef.current = null;
    } else {
      // Schedule lock
      lockDelayTimeoutRef.current = setTimeout(() => {
        // Double check if it's still the same piece and still touching
        const current = activePieceRef.current;
        if (current && current.id === piece.id) {
          const stillTouching = checkCollision(gridRef.current, current.shape, current.x, current.y + 1);
          if (stillTouching) {
            lockPiece(current);
            firstTouchTimeRef.current = null;
            lastActionTimeRef.current = null;
          }
        }
      }, remainingDelay);
    }
  }, [checkCollision, lockPiece]);

  // Handle active piece state updates smoothly
  const updateActivePieceState = useCallback((nextPiece: ActivePiece, isAction: boolean) => {
    const current = activePieceRef.current;
    const hasChanged = !current ||
      nextPiece.x !== current.x ||
      nextPiece.y !== current.y ||
      nextPiece.shape !== current.shape;

    setActivePiece(nextPiece);
    activePieceRef.current = nextPiece; // Synchronous ref update

    if (hasChanged && isAction) {
      lastActionTimeRef.current = Date.now();
    }

    updateLockDelay(nextPiece);
  }, [updateLockDelay]);

  const handleRotate = useCallback((direction: 'cw' | 'ccw' = 'cw') => {
    if (!activePieceRef.current || isGameOverRef.current) return;
    const current = activePieceRef.current;
    const rotated = direction === 'cw' ? rotateMatrix(current.shape) : rotateMatrixCCW(current.shape);
    
    // Advanced wall and floor kicks: attempt horizontal shifts, then vertical shifts (e.g. kicking up by 1 or 2 rows if on floor)
    const kickPossibilities = [
      { dx: 0, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, // kick up 1 (floor kick)
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },  // kick down and left (crucial for sliding under overhangs/T-spin)
      { dx: 1, dy: 1 },   // kick down and right (crucial for sliding under overhangs/T-spin)
      { dx: 0, dy: 1 },   // kick down 1 (sliding into pocket)
      { dx: -2, dy: 0 },
      { dx: 2, dy: 0 },
      { dx: -2, dy: -1 },
      { dx: 2, dy: -1 },
      { dx: 0, dy: -2 }, // kick up 2
      { dx: -1, dy: -2 },
      { dx: 1, dy: -2 },
    ];
    for (const kick of kickPossibilities) {
      if (!checkCollision(gridRef.current, rotated, current.x + kick.dx, current.y + kick.dy)) {
        updateActivePieceState({ ...current, shape: rotated, x: current.x + kick.dx, y: current.y + kick.dy }, true);
        lastActionWasRotateRef.current = true;
        playSound('rotate');
        return;
      }
    }
  }, [checkCollision, playSound, updateActivePieceState]);

  const handleMoveX = useCallback((dir: number) => {
    if (!activePieceRef.current || isGameOverRef.current) return;
    const current = activePieceRef.current;
    if (!checkCollision(gridRef.current, current.shape, current.x + dir, current.y)) {
      updateActivePieceState({ ...current, x: current.x + dir }, true);
      lastActionWasRotateRef.current = false;
      playSound('move');
    }
  }, [checkCollision, playSound, updateActivePieceState]);

  const handleSoftDrop = useCallback(() => {
    if (!activePieceRef.current || isGameOverRef.current) return;
    const current = activePieceRef.current;
    if (!checkCollision(gridRef.current, current.shape, current.x, current.y + 1)) {
      updateActivePieceState({ ...current, y: current.y + 1 }, false);
      // Soft drop is a vertical move, do not reset lastActionWasRotateRef so T-spins can be registered on lock
    } else {
      updateActivePieceState(current, false);
    }
  }, [checkCollision, updateActivePieceState]);

  // Hard drop instantly slides the active piece down to the bottom
  const handleHardDrop = useCallback(() => {
    if (!activePieceRef.current || isGameOverRef.current) return;
    const current = activePieceRef.current;
    let dropY = current.y;
    while (!checkCollision(gridRef.current, current.shape, current.x, dropY + 1)) {
      dropY++;
    }
    
    // Clear lock delay references on hard drop
    if (lockDelayTimeoutRef.current) {
      clearTimeout(lockDelayTimeoutRef.current);
      lockDelayTimeoutRef.current = null;
    }
    firstTouchTimeRef.current = null;
    lastActionTimeRef.current = null;
    // Hard drop is a vertical move, do not reset lastActionWasRotateRef so T-spins can be registered on lock

    const finalPiece = { ...current, y: dropY };
    setActivePiece(finalPiece);
    activePieceRef.current = finalPiece; // Synchronous ref update
    playSound('move');
    lockPiece(finalPiece);
  }, [checkCollision, lockPiece, playSound]);

  // Hold active piece (swap or store)
  const handleHold = useCallback(() => {
    if (!activePieceRef.current || isGameOverRef.current || hasHeldRef.current) return;
    playSound('hold');

    // Clear lock delay references
    if (lockDelayTimeoutRef.current) {
      clearTimeout(lockDelayTimeoutRef.current);
      lockDelayTimeoutRef.current = null;
    }
    firstTouchTimeRef.current = null;
    lastActionTimeRef.current = null;
    lastActionWasRotateRef.current = false;

    const currentId = activePieceRef.current.id;
    const currentHold = holdPieceRef.current;

    setHoldPiece(currentId);
    setHasHeld(true);

    if (currentHold === null) {
      // Spawn new piece since there is no piece stored
      spawnPiece(nextPiecesRef.current);
    } else {
      // Recall piece from hold
      const retrievedShape = SHAPES[currentHold];
      const startX = Math.floor((10 - retrievedShape[0].length) / 2);
      const retrievedPiece = {
        shape: retrievedShape,
        x: startX,
        y: 0,
        id: currentHold
      };
      setActivePiece(retrievedPiece);
      activePieceRef.current = retrievedPiece; // Synchronous ref update
      updateLockDelay(retrievedPiece);
    }
  }, [spawnPiece, playSound, updateLockDelay]);

  // Calculate the projection / ghost landing point
  const getGhostY = (): number => {
    if (!activePiece) return 0;
    let ghostY = activePiece.y;
    while (!checkCollision(grid, activePiece.shape, activePiece.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  };

  // Keyboard controls handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isGameOver) return;
      
      let handled = false;

      // Robust check for Spacebar (Standard space, code, full-width Japanese IME space, or old Spacebar)
      if (e.code === 'Space' || e.key === ' ' || e.key === '　' || e.key === 'Spacebar') {
        e.preventDefault();
        
        // Blur any active element (like buttons) so pressing Space doesn't trigger button click
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        handleHardDrop();
        handled = true;
      } else {
        const keyMap: Record<string, () => void> = {
          ArrowLeft: () => handleMoveX(-1),
          ArrowRight: () => handleMoveX(1),
          ArrowUp: () => handleRotate('cw'),
          ArrowDown: () => handleSoftDrop(),
          c: () => handleHold(),
          C: () => handleHold(),
          z: () => handleRotate('ccw'),
          Z: () => handleRotate('ccw'),
        };

        const codeMap: Record<string, () => void> = {
          ArrowLeft: () => handleMoveX(-1),
          ArrowRight: () => handleMoveX(1),
          ArrowUp: () => handleRotate('cw'),
          ArrowDown: () => handleSoftDrop(),
          KeyC: () => handleHold(),
          KeyZ: () => handleRotate('ccw'),
        };

        if (keyMap[e.key]) {
          e.preventDefault();
          keyMap[e.key]();
          handled = true;
        } else if (codeMap[e.code]) {
          e.preventDefault();
          codeMap[e.code]();
          handled = true;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver, handleMoveX, handleRotate, handleSoftDrop, handleHardDrop, handleHold]);

  // Automatic falling tick based on current level speed
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    // Speeds up as the level advances
    const intervalMs = Math.max(50, 1000 - (level - 1) * 90);
    const tick = setInterval(() => {
      handleSoftDrop();
    }, intervalMs);

    return () => clearInterval(tick);
  }, [isPlaying, isGameOver, level, handleSoftDrop]);


  // ==========================================
  // LOCAL AI SIMULATED OPPONENT LOGIC
  // ==========================================
  const aiTickRef = useRef<NodeJS.Timeout | null>(null);
  const aiGridRef = useRef<number[][]>(() => Array.from({ length: 20 }, () => Array(10).fill(0)));
  const aiScoreRef = useRef(0);
  const aiActiveRef = useRef<{ id: number; shape: number[][]; x: number; y: number } | null>(null);

  // Evaluates placement fitness scoring
  const evaluateAIPosition = (board: number[][], shape: number[][], targetX: number): { score: number; dropY: number } => {
    let dropY = 0;
    // Check if valid start
    if (checkCollision(board, shape, targetX, 0)) {
      return { score: -999999, dropY: 0 };
    }

    // Find dropped Y position
    while (!checkCollision(board, shape, targetX, dropY + 1)) {
      dropY++;
    }

    // Clone grid
    const tempGrid = board.map(r => [...r]);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardY = dropY + r;
          const boardX = targetX + c;
          if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
            tempGrid[boardY][boardX] = 1;
          }
        }
      }
    }

    // Heuristics calculations
    const heights = Array(10).fill(0);
    for (let c = 0; c < 10; c++) {
      for (let r = 0; r < 20; r++) {
        if (tempGrid[r][c] !== 0) {
          heights[c] = 20 - r;
          break;
        }
      }
    }

    const aggregateHeight = heights.reduce((sum, h) => sum + h, 0);
    
    // Count holes
    let holes = 0;
    for (let c = 0; c < 10; c++) {
      let blockFound = false;
      for (let r = 0; r < 20; r++) {
        if (tempGrid[r][c] !== 0) blockFound = true;
        else if (blockFound && tempGrid[r][c] === 0) holes++;
      }
    }

    // Count line clears
    let linesCleared = 0;
    for (let r = 0; r < 20; r++) {
      if (tempGrid[r].every(cell => cell !== 0)) linesCleared++;
    }

    // Bumpiness
    let bumpiness = 0;
    for (let c = 0; c < 9; c++) {
      bumpiness += Math.abs(heights[c] - heights[c + 1]);
    }

    // AI weight coefficient score
    const heuristicScore = -0.51 * aggregateHeight + 0.76 * linesCleared - 0.36 * holes - 0.18 * bumpiness;
    return { score: heuristicScore, dropY };
  };

  // Triggers sending garbage rows to AI
  const triggerAIGarbage = (linesCount: number) => {
    let nextAIGrid = aiGridRef.current.map(r => [...r]);
    nextAIGrid.splice(0, linesCount);
    
    const holeCol = Math.floor(Math.random() * 10);
    for (let i = 0; i < linesCount; i++) {
      const garbageRow = Array(10).fill(8);
      garbageRow[holeCol] = 0;
      nextAIGrid.push(garbageRow);
    }
    aiGridRef.current = nextAIGrid;
    setOpponentGrid(nextAIGrid);
  };

  // Triggers garbage injection to local Player
  const sendGarbageToPlayer = (linesCount: number) => {
    garbageQueueRef.current += linesCount;
  };

  // AI Game Cycle Ticker
  const runAIGameLoop = useCallback(() => {
    if (!isPlaying || isGameOver || gameMode !== 'ai') return;

    // If AI has no active piece, spawn one
    if (!aiActiveRef.current) {
      const nextId = Math.floor(Math.random() * 7) + 1;
      const nextShape = SHAPES[nextId];
      const startX = Math.floor((10 - nextShape[0].length) / 2);
      
      if (checkCollision(aiGridRef.current, nextShape, startX, 0)) {
        setOpponentIsGameOver(true);
        return;
      }

      aiActiveRef.current = { id: nextId, shape: nextShape, x: startX, y: 0 };
    }

    const currentPiece = aiActiveRef.current!;
    
    // Evaluate optimal rotation and column offset
    let bestScore = -Infinity;
    let optimalX = currentPiece.x;
    let optimalShape = currentPiece.shape;

    // Test 4 rotations
    let rotatedShape = currentPiece.shape;
    for (let rot = 0; rot < 4; rot++) {
      for (let x = -2; x < 10; x++) {
        // Must fit boundaries
        if (x >= 0 && x + rotatedShape[0].length <= 10) {
          const evalResult = evaluateAIPosition(aiGridRef.current, rotatedShape, x);
          if (evalResult.score > bestScore) {
            bestScore = evalResult.score;
            optimalX = x;
            optimalShape = rotatedShape;
          }
        }
      }
      rotatedShape = rotateMatrix(rotatedShape);
    }

    // Step AI block towards optimal target
    let activeX = currentPiece.x;
    if (activeX < optimalX) activeX++;
    else if (activeX > optimalX) activeX--;

    // Update active state
    aiActiveRef.current = {
      ...currentPiece,
      x: activeX,
      shape: optimalShape,
    };

    // If target horizontal position is reached, drop instantly
    if (activeX === optimalX) {
      let finalY = 0;
      while (!checkCollision(aiGridRef.current, optimalShape, optimalX, finalY + 1)) {
        finalY++;
      }

      // Lock block to AI grid
      const nextAIGrid = aiGridRef.current.map(r => [...r]);
      for (let r = 0; r < optimalShape.length; r++) {
        for (let c = 0; c < optimalShape[r].length; c++) {
          if (optimalShape[r][c] !== 0) {
            const by = finalY + r;
            const bx = optimalX + c;
            if (by >= 0 && by < 20 && bx >= 0 && bx < 10) {
              nextAIGrid[by][bx] = currentPiece.id;
            }
          }
        }
      }

      // Handle line clears on AI
      let cleared = 0;
      const filteredGrid = nextAIGrid.filter(row => {
        const full = row.every(cell => cell !== 0);
        if (full) cleared++;
        return !full;
      });

      while (filteredGrid.length < 20) {
        filteredGrid.unshift(Array(10).fill(0));
      }

      aiGridRef.current = filteredGrid;
      setOpponentGrid(filteredGrid);
      
      if (cleared > 0) {
        const blocksInRow = 10;
        const totalBlocksCleared = cleared * blocksInRow;
        const scorePerBlock = 10; // 10 points per block, same as player
        aiScoreRef.current += totalBlocksCleared * scorePerBlock * level;
        setOpponentScore(aiScoreRef.current);
        // Send garbage to the player
        sendGarbageToPlayer(cleared);
      }

      aiActiveRef.current = null; // Spawns new piece in next tick
    }

    // Dynamic AI speed
    aiTickRef.current = setTimeout(runAIGameLoop, 450);
  }, [isPlaying, isGameOver, gameMode, level, checkCollision]);

  useEffect(() => {
    if (gameMode === 'ai' && isPlaying && !isGameOver) {
      setOpponentName('AI Core Beta');
      aiGridRef.current = Array.from({ length: 20 }, () => Array(10).fill(0));
      aiScoreRef.current = 0;
      aiActiveRef.current = null;
      setOpponentGrid(aiGridRef.current);
      setOpponentScore(0);
      setOpponentIsGameOver(false);
      
      aiTickRef.current = setTimeout(runAIGameLoop, 450);
    }
    return () => {
      if (aiTickRef.current) {
        clearTimeout(aiTickRef.current);
      }
    };
  }, [gameMode, isPlaying, isGameOver, runAIGameLoop]);


  // ==========================================
  // REAL-TIME SUPABASE MULTIPLAYER ROOMS
  // ==========================================

  // --- Create/Join Online Room Helper ---
  const connectToRoom = async (code: string, isCreator: boolean) => {
    playSound('move');
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode) {
      setOnlineErrorText('部屋コードを入力してください。');
      return;
    }
    setOnlineErrorText('');
    setOnlineStatusText('接続中...');

    const client = getSupabaseClient();
    if (!client) {
      setOnlineErrorText('Supabaseへの接続に失敗しました。');
      return;
    }

    // Clean up any existing channel
    if (channelRef.current && supabaseRef.current) {
      try {
        supabaseRef.current.removeChannel(channelRef.current);
      } catch (e) {}
      channelRef.current = null;
    }

    try {
      setOnlineIsCreator(isCreator);
      setOpponents({}); // Clear previous opponents

      const channel = client.channel(`tetris-room-${cleanCode}`, {
        config: { broadcast: { self: false } },
      });

      channelRef.current = channel;

      const sessionUser = localStorage.getItem('wetalks_logged_in_user') || 'Player_' + Math.random().toString(36).substr(2, 4);

      channel
        .on('broadcast', { event: 'tetris_join' }, (payload: any) => {
          playSound('level');
          const newPlayerId = payload.payload.playerId;
          const newPlayerName = payload.payload.username;

          setOpponents(prev => {
            if (Object.keys(prev).length >= 4 && !prev[newPlayerId]) {
              return prev; // limit to 4 opponents (5 players total)
            }
            const next = { ...prev };
            next[newPlayerId] = {
              id: newPlayerId,
              name: newPlayerName,
              grid: Array.from({ length: 20 }, () => Array(10).fill(0)),
              score: 0,
              isGameOver: false,
              lastActive: Date.now()
            };
            return next;
          });

          // Reply with our own presence
          channel.send({
            type: 'broadcast',
            event: 'tetris_presence_reply',
            payload: {
              playerId: myPlayerId.current,
              username: sessionUser,
            },
          });
        })
        .on('broadcast', { event: 'tetris_presence_reply' }, (payload: any) => {
          const remotePlayerId = payload.payload.playerId;
          const remotePlayerName = payload.payload.username;

          setOpponents(prev => {
            if (Object.keys(prev).length >= 4 && !prev[remotePlayerId]) {
              return prev;
            }
            const next = { ...prev };
            next[remotePlayerId] = {
              id: remotePlayerId,
              name: remotePlayerName,
              grid: payload.payload.grid || prev[remotePlayerId]?.grid || Array.from({ length: 20 }, () => Array(10).fill(0)),
              score: payload.payload.score || prev[remotePlayerId]?.score || 0,
              isGameOver: payload.payload.isGameOver || prev[remotePlayerId]?.isGameOver || false,
              lastActive: Date.now()
            };
            return next;
          });
        })
        .on('broadcast', { event: 'tetris_start_match' }, () => {
          playSound('level');
          setMatchStatus('connected');
          setOnlineSetupState('playing');
          setIsPlaying(true);
          resetPlayerGame();
        })
        .on('broadcast', { event: 'tetris_sync_grid' }, (payload: any) => {
          const remoteId = payload.payload.playerId;
          setOpponents(prev => {
            const next = { ...prev };
            if (next[remoteId]) {
              next[remoteId] = {
                ...next[remoteId],
                grid: payload.payload.grid,
                score: payload.payload.score,
                isGameOver: payload.payload.isGameOver ?? next[remoteId].isGameOver,
                lastActive: Date.now()
              };
            } else if (Object.keys(prev).length < 4) {
              next[remoteId] = {
                id: remoteId,
                name: payload.payload.username || 'Opponent',
                grid: payload.payload.grid,
                score: payload.payload.score,
                isGameOver: payload.payload.isGameOver || false,
                lastActive: Date.now()
              };
            }
            return next;
          });
        })
        .on('broadcast', { event: 'tetris_send_garbage' }, (payload: any) => {
          // Add garbage to our grid if we are playing and not gameover
          if (!isGameOverRef.current) {
            garbageQueueRef.current += payload.payload.lines;
            playSound('garbage');
          }
        })
        .on('broadcast', { event: 'tetris_gameover' }, (payload: any) => {
          const remoteId = payload.payload.playerId;
          setOpponents(prev => {
            const next = { ...prev };
            if (next[remoteId]) {
              next[remoteId] = {
                ...next[remoteId],
                isGameOver: true
              };
            }
            return next;
          });
        })
        .on('broadcast', { event: 'tetris_leave' }, (payload: any) => {
          const remoteId = payload.payload.playerId;
          setOpponents(prev => {
            const next = { ...prev };
            delete next[remoteId];
            return next;
          });
        });

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast our join event
          channel.send({
            type: 'broadcast',
            event: 'tetris_join',
            payload: {
              playerId: myPlayerId.current,
              username: sessionUser,
            },
          });
          setOnlineSetupState('room');
          setOnlineStatusText(`部屋 [${cleanCode.toUpperCase()}] に接続しました。メンバーを待っています...`);
        } else {
          setOnlineErrorText('接続に失敗しました。');
        }
      });
    } catch (e: any) {
      setOnlineErrorText(e.message || 'エラーが発生しました。');
    }
  };

  // --- Create Online Room ---
  const handleCreateOnlineRoom = async () => {
    await connectToRoom(onlineRoomCode, true);
  };

  // --- Join Online Room ---
  const handleJoinOnlineRoom = async () => {
    await connectToRoom(onlineRoomCode, false);
  };

  const handleStartMultiplayerMatch = () => {
    playSound('level');
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'tetris_start_match',
        payload: {}
      });
    }
    setMatchStatus('connected');
    setOnlineSetupState('playing');
    setIsPlaying(true);
    resetPlayerGame();
  };

  // --- Leave Online Room ---
  const handleLeaveOnlineRoom = () => {
    playSound('move');
    if (channelRef.current && supabaseRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'tetris_leave',
          payload: { playerId: myPlayerId.current },
        });
        supabaseRef.current.removeChannel(channelRef.current);
      } catch (e) {}
    }
    channelRef.current = null;
    setOnlineSetupState('menu');
    setGameMode('single');
    setIsPlaying(false);
    setIsGameOver(false);
    setMatchStatus('idle');
    setOpponents({});
  };

  // Helper to clear and restart player states
  const resetPlayerGame = () => {
    const cleanGrid = Array.from({ length: 20 }, () => Array(10).fill(0));
    setGrid(cleanGrid);
    gridRef.current = cleanGrid; // Synchronously update ref to prevent stale collision on restart!

    setScore(0);
    setLines(0);
    setLevel(1);
    setHoldPiece(null);
    setHasHeld(false);
    
    setIsGameOver(false);
    isGameOverRef.current = false; // Synchronously update ref to avoid stale gameover checks!
    
    garbageQueueRef.current = 0;

    // Reset lock delay references on fresh game start
    if (lockDelayTimeoutRef.current) {
      clearTimeout(lockDelayTimeoutRef.current);
      lockDelayTimeoutRef.current = null;
    }
    firstTouchTimeRef.current = null;
    lastActionTimeRef.current = null;
    lastActionWasRotateRef.current = false;

    const initialQueue = generateNewQueue();
    setNextPieces(initialQueue);
    spawnPiece(initialQueue);
  };

  const handleStartGame = (mode: 'single' | 'ai' | 'online') => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setGameMode(mode);
    if (mode === 'online') {
      if (onlineSetupState === 'playing') {
        // Already in online room, reset game and sync clean board
        resetPlayerGame();
        setOpponentIsGameOver(false);
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'tetris_sync_grid',
            payload: {
              grid: Array.from({ length: 20 }, () => Array(10).fill(0)),
              score: 0
            }
          });
        }
      } else {
        setOnlineSetupState('setup');
      }
    } else {
      setOnlineSetupState('menu');
      setMatchStatus('idle');
      setIsPlaying(true);
      resetPlayerGame();
    }
  };

  const handleQuitGame = () => {
    setIsPlaying(false);
    setIsGameOver(false);
    handleLeaveOnlineRoom();
  };

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-gray-100 flex flex-col justify-between overflow-y-auto font-sans p-4 relative" id="tetris-web-container">
      {/* BACKGROUND DECORATIVE GRID */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:24px_24px]" />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-purple-600 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 text-lg select-none">
            🔲
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              NEO TETRIS <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase font-mono">VS Engine</span>
            </h1>
            <p className="text-[10px] text-zinc-400">Next-gen cyber competitive puzzle block game</p>
          </div>
        </div>

        {/* AUDIO / MUTING CONTROLS */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-lg border transition ${soundEnabled ? 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800/40'}`}
          title="Sound FX Mute toggle"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* LOBBY MENU DISPLAY */}
      {!isPlaying && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 z-10 w-full">
          {onlineSetupState === 'setup' ? (
            /* ONLINE ROOM CONFIGURATION SCREEN */
            <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playSound('move');
                    setOnlineSetupState('menu');
                    setGameMode('single');
                  }}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-white tracking-tight">オンライン対人戦設定 (Online Room)</h2>
              </div>

              <div className="flex flex-col gap-4 border-t border-zinc-850 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400">部屋同期用コード (Room Code)</label>
                  <input
                    type="text"
                    placeholder="部屋コードを入力 (例: 777)"
                    value={onlineRoomCode}
                    onChange={(e) => setOnlineRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-center text-sm font-black tracking-widest placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition-all uppercase"
                  />
                </div>

                {onlineErrorText && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/30 text-red-400 text-[11px] rounded-lg">
                    <span>{onlineErrorText}</span>
                  </div>
                )}

                {onlineStatusText && (
                  <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-[11px] rounded-lg text-center font-mono">
                    {onlineStatusText}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <button
                    onClick={handleCreateOnlineRoom}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
                  >
                    部屋を作る
                  </button>
                  <button
                    onClick={handleJoinOnlineRoom}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
                  >
                    部屋に入る
                  </button>
                </div>
              </div>
            </div>
          ) : onlineSetupState === 'room' ? (
            /* WAITING ROOM SCREEN */
            <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xl">📡</div>
              </div>
              <div className="space-y-2 w-full">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                  対戦待機中 ({Object.keys(opponents).length + 1}/5人)
                </h3>
                <p className="text-zinc-400 text-xs font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-850 inline-block">
                  部屋コード: <span className="text-pink-400 font-bold">{onlineRoomCode.toUpperCase()}</span>
                </p>
                {onlineStatusText && (
                  <p className="text-zinc-500 text-[10px] italic mt-1">{onlineStatusText}</p>
                )}
              </div>

              {/* Connected players list */}
              <div className="w-full bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 text-left space-y-2.5">
                <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-1">参加メンバー (Players)</div>
                <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>• {myUsername} (あなた)</span>
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded uppercase font-mono">Host / You</span>
                </div>
                {(Object.values(opponents) as Opponent[]).map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between text-xs text-zinc-300">
                    <span>• {opp.name}</span>
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-mono">Ready</span>
                  </div>
                ))}
                {Object.keys(opponents).length === 0 && (
                  <p className="text-[10px] text-zinc-500 italic text-center py-2">他のプレイヤーが部屋コードを入力して入るのを待っています...</p>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full pt-2">
                <button
                  onClick={handleStartMultiplayerMatch}
                  className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
                >
                  ゲームスタート
                </button>
                <button
                  onClick={handleLeaveOnlineRoom}
                  className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition active:scale-[0.98] cursor-pointer"
                >
                  待機をキャンセル
                </button>
              </div>
            </div>
          ) : (
            /* CHOOSE YOUR FIGHT LOBBY MENU */
            <>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">
                  CHOOSE YOUR FIGHT
                </h2>
                <p className="text-zinc-400 text-xs">Battle against high-tier machine agents or test offline speed endurance</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                {/* SINGLE PLAYER CARD */}
                <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:scale-[1.01] transition duration-300 flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <div className="bg-cyan-500/10 text-cyan-400 w-10 h-10 rounded-xl flex items-center justify-center border border-cyan-500/20 mb-2">
                      <User size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-white">一人プレイ (Single Player)</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Train speed limits, clear garbage, level-up blocks, and score high multipliers without interference.
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartGame('single')}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Play size={14} /> Play Solo
                  </button>
                </div>

                {/* VS AI MODE CARD */}
                <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:scale-[1.01] transition duration-300 flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <div className="bg-purple-500/10 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center border border-purple-500/20 mb-2">
                      <Cpu size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-white">AI勝負 (VS AI agent)</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Compete with our heuristic intelligence matrix. Clearing rows transfers solid garbage rows directly to the AI opponent!
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartGame('ai')}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Play size={14} /> VS Machine AI
                  </button>
                </div>

                {/* ONLINE MATCH CARD */}
                <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:scale-[1.01] transition duration-300 flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <div className="bg-pink-500/10 text-pink-400 w-10 h-10 rounded-xl flex items-center justify-center border border-pink-500/20 mb-2">
                      <Users size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-white">オンライン対人戦 (Multiplayer)</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Join real-time custom rooms with codes! Share room codes with friends to play together on separate devices.
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartGame('online')}
                    className="w-full bg-pink-600 hover:bg-pink-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Play size={14} /> Online Rooms
                  </button>
                </div>
              </div>

              {/* GAME CONTROLS SCHEME */}
              <div className="bg-zinc-900/45 border border-zinc-800/60 rounded-xl p-4 max-w-lg w-full flex flex-col space-y-3.5">
                <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-cyan-400" /> Game Controls Scheme (操作方法)
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800 text-zinc-200 px-2 py-1 rounded border border-zinc-700 font-mono text-[10px]">← →</span>
                    <span className="text-zinc-400">左右移動</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800 text-zinc-200 px-2 py-1 rounded border border-zinc-700 font-mono text-[10px]">↑</span>
                    <span className="text-zinc-400">右回転 (時計回り)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800 text-cyan-400 px-2.5 py-1 rounded border border-cyan-500/20 font-mono text-[10px]">Z</span>
                    <span className="text-zinc-400">左回転 (反時計回り)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800 text-zinc-200 px-2 py-1 rounded border border-zinc-700 font-mono text-[10px]">↓</span>
                    <span className="text-zinc-400">落下加速 (ソフトドロップ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded border border-zinc-700 font-mono text-[10px]">Space</span>
                    <span className="text-zinc-400">一瞬で落とす (ハードドロップ)</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 border-t border-zinc-800/50 pt-2">
                    <span className="bg-zinc-800 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 font-mono text-[10px]">C</span>
                    <span className="text-zinc-400">ホールド / 取り出し (Hold)</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ACTIVE PUZZLE VIEWPORT */}
      {isPlaying && (gameMode !== 'online' || matchStatus === 'connected') && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch p-2 select-none">
          {/* LEFT SECTION: STATS & HOLD */}
          <div className="col-span-1 md:col-span-3 flex flex-col justify-between space-y-3">
            {/* HOLD BLOCK DISPLAY */}
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center relative">
              <span className="absolute top-2 left-3 text-[9px] font-bold tracking-widest text-zinc-400">HOLD</span>
              <div className="w-20 h-20 flex items-center justify-center mt-3 bg-black/40 rounded-xl border border-zinc-800/50">
                {holdPiece !== null ? (
                  <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SHAPES[holdPiece][0].length}, minmax(0, 1fr))` }}>
                    {SHAPES[holdPiece].map((row, rIdx) =>
                      row.map((val, cIdx) => (
                        <div
                          key={`hold-${rIdx}-${cIdx}`}
                          className={`w-4 h-4 rounded-sm border ${val !== 0 ? COLORS[holdPiece] : 'bg-transparent border-transparent'}`}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-600 uppercase font-mono">Empty [C]</span>
                )}
              </div>
            </div>

            {/* SCORE DISPLAY BOARD */}
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 flex flex-col space-y-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold tracking-widest text-zinc-400">SCORE</span>
                <p className="text-2xl font-black text-white font-mono leading-none tracking-tight">{score}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/40">
                <div>
                  <span className="text-[8px] font-bold tracking-widest text-zinc-400">LEVEL</span>
                  <p className="text-sm font-black text-cyan-400 font-mono leading-none">{level}</p>
                </div>
                <div>
                  <span className="text-[8px] font-bold tracking-widest text-zinc-400">LINES</span>
                  <p className="text-sm font-black text-purple-400 font-mono leading-none">{lines}</p>
                </div>
              </div>
            </div>

            {/* GAME INFORMATION TIPS / CONTROLS BUTTONS */}
            <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-4 flex flex-col space-y-2.5">
              <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Interactive Tips</span>
              <p className="text-[10px] text-zinc-400 leading-normal">
                Clearing <span className="text-cyan-400 font-bold">2 or more rows</span> instantly transmits blocks directly to the bottom of the opponent's screen!
              </p>
              <button
                onClick={handleQuitGame}
                className="w-full bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 text-red-400 font-bold py-2 rounded-xl text-[10px] transition"
              >
                Exit Match
              </button>
            </div>
          </div>

          {/* MAIN PLAYER PUZZLE GRID SCREEN */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[280px] bg-zinc-950/90 border-2 border-zinc-800 rounded-2xl p-2 shadow-2xl relative">
              <div className="absolute top-2 left-4 text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest z-10 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> PLAYER BOARD
              </div>

              {/* GAME GRID CANVAS */}
              <div className="grid grid-cols-10 gap-[1px] bg-zinc-900/60 rounded-xl overflow-hidden mt-6 aspect-[10/20] border border-zinc-800/60 p-1 relative">
                {Array.from({ length: 20 }).map((_, r) =>
                  Array.from({ length: 10 }).map((_, c) => {
                    // Check active piece occupancy
                    let cellVal = grid[r][c];
                    let isActiveCell = false;
                    let isGhostCell = false;

                    // Compute landing projection row
                    const ghostY = getGhostY();

                    if (activePiece && !isGameOver) {
                      const { shape, x, y, id } = activePiece;
                      const pr = r - y;
                      const pc = c - x;
                      if (pr >= 0 && pr < shape.length && pc >= 0 && pc < shape[pr].length && shape[pr][pc] !== 0) {
                        cellVal = id;
                        isActiveCell = true;
                      }

                      // Compute landing ghost outline projection
                      const gpr = r - ghostY;
                      if (!isActiveCell && gpr >= 0 && gpr < shape.length && pc >= 0 && pc < shape[gpr].length && shape[gpr][pc] !== 0) {
                        cellVal = id;
                        isGhostCell = true;
                      }
                    }

                    return (
                      <div
                        key={`cell-${r}-${c}`}
                        className={`aspect-square w-full rounded-sm border-[0.5px] transition-all duration-75 relative ${
                          isActiveCell
                            ? COLORS[cellVal]
                            : isGhostCell
                            ? 'bg-transparent border-dashed border-cyan-400/50 shadow-inner'
                            : cellVal !== 0
                            ? COLORS[cellVal]
                            : 'bg-[#121217] border-zinc-900/60 hover:bg-[#16161f]'
                        }`}
                      >
                        {/* GARBAGE HOLE REPRESENTATION */}
                        {cellVal === 8 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-30 text-[8px]">
                            💀
                          </div>
                        )}
                        {isGhostCell && (
                          <div className="absolute inset-0 bg-cyan-400/10 rounded-sm" />
                        )}
                      </div>
                    );
                  })
                )}

                {/* SPECIAL MOVE NOTIFICATION (T-SPIN / TETRIS) */}
                <AnimatePresence>
                  {activeMessage && (
                    <motion.div
                      key={activeMessage.id}
                      initial={{ opacity: 0, scale: 0.5, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.1, y: -20 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 180 }}
                      className={`absolute left-3 right-3 top-[40%] flex flex-col items-center justify-center p-3 rounded-xl text-center backdrop-blur-md shadow-2xl z-20 ${activeMessage.color}`}
                    >
                      <span className="text-xs font-black tracking-widest uppercase">{activeMessage.text}</span>
                      {activeMessage.subtext && (
                        <span className="text-[9px] font-extrabold text-white mt-0.5 font-mono">{activeMessage.subtext}</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* GAME OVER CARD OVERLAY */}
                {isGameOver && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center space-y-4 rounded-xl z-20">
                    <div className="text-center">
                      <p className="text-xs text-red-500 font-extrabold uppercase tracking-widest">GAME OVER</p>
                      <h3 className="text-xl font-black text-white leading-none">DEFEAT</h3>
                    </div>
                    <button
                      onClick={() => handleStartGame(gameMode)}
                      className="px-4 py-1.5 bg-zinc-800 hover:bg-cyan-600 border border-zinc-700 text-white rounded-lg text-xs flex items-center gap-1 transition active:scale-[0.98]"
                    >
                      <RotateCcw size={12} /> Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: OPPONENT PUZZLE GRID (AI OR ONLINE) */}
          <div className="col-span-1 md:col-span-4 flex flex-col items-center justify-between">
            {gameMode === 'ai' ? (
              <div className="w-full max-w-[210px] bg-zinc-950/95 border border-zinc-800/80 rounded-2xl p-2 shadow-2xl relative">
                <div className="absolute top-2 left-4 text-[8px] font-extrabold text-pink-400 uppercase tracking-widest z-10 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" /> {opponentName}
                </div>

                {/* OPPONENT GRID CANVAS */}
                <div className="grid grid-cols-10 gap-[0.5px] bg-zinc-900/50 rounded-xl overflow-hidden mt-6 aspect-[10/20] border border-zinc-800/60 p-1 relative">
                  {opponentGrid.map((row, r) =>
                    row.map((cellVal, c) => (
                      <div
                        key={`opp-cell-${r}-${c}`}
                        className={`aspect-square w-full rounded-[1px] border-[0.2px] ${
                          cellVal !== 0
                            ? COLORS[cellVal] + ' scale-[0.95]'
                            : 'bg-[#101014] border-zinc-950/40'
                        }`}
                      />
                    ))
                  )}

                  {/* OPPONENT GAME OVER SCREEN */}
                  {opponentIsGameOver && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-1 rounded-xl z-20">
                      <p className="text-[10px] text-green-400 font-extrabold uppercase tracking-widest animate-bounce">VICTORY!</p>
                      <h3 className="text-sm font-black text-white">OPPONENT RETIRED</h3>
                    </div>
                  )}
                </div>

                {/* OPPONENT MINIFIED STATS */}
                <div className="mt-2 text-center">
                  <span className="text-[8px] text-zinc-500 font-bold">OPPONENT SCORE</span>
                  <p className="text-sm font-extrabold text-zinc-300 font-mono leading-none mt-0.5">{opponentScore}</p>
                </div>
              </div>
            ) : gameMode === 'online' ? (
              <div className="w-full flex flex-col items-center gap-3">
                <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">対戦相手の状況 (Opponents)</div>
                {Object.keys(opponents).length === 0 ? (
                  <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500 text-xs italic">
                    他のプレイヤーがまだ接続していません。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    {(Object.values(opponents) as Opponent[]).map((opp) => (
                      <div key={opp.id} className="bg-zinc-950/90 border border-zinc-800/80 rounded-xl p-2 flex flex-col items-center relative">
                        <div className="text-[10px] font-extrabold text-pink-400 truncate w-full text-center mb-1.5 flex items-center justify-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${opp.isGameOver ? 'bg-zinc-600' : 'bg-pink-500 animate-pulse'}`} />
                          {opp.name}
                        </div>
                        
                        {/* OPPONENT GRID */}
                        <div className="grid grid-cols-10 gap-[0.5px] bg-zinc-900/50 rounded-lg overflow-hidden aspect-[10/20] w-full max-w-[85px] border border-zinc-800/60 p-0.5 relative">
                          {opp.grid.map((row, r) =>
                            row.map((cellVal, c) => (
                              <div
                                key={`opp-grid-cell-${opp.id}-${r}-${c}`}
                                className={`aspect-square w-full rounded-[0.5px] ${
                                  cellVal !== 0
                                    ? COLORS[cellVal] + ' scale-[0.95]'
                                    : 'bg-[#101014] border-[0.1px] border-zinc-950/40'
                                }`}
                              />
                            ))
                          )}
                          {opp.isGameOver && (
                            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center rounded-lg z-20">
                              <p className="text-[9px] text-red-500 font-black tracking-widest uppercase">KO</p>
                            </div>
                          )}
                        </div>
                        <div className="text-[8px] text-zinc-400 font-bold mt-1 font-mono">
                          PTS: {opp.score}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* NEXT PIECE QUEUE DISPLAY FOR SOLO PLAY */
              <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 w-full flex flex-col items-center justify-center relative space-y-4">
                <span className="absolute top-2 left-3 text-[9px] font-bold tracking-widest text-zinc-400">NEXT BLOCKS</span>
                
                <div className="space-y-4 mt-6">
                  {nextPieces.slice(0, 3).map((pieceId, idx) => (
                    <div
                      key={`next-${idx}`}
                      className="w-16 h-12 flex items-center justify-center bg-black/25 rounded-lg border border-zinc-800/50 relative"
                    >
                      <div className="grid gap-0.5 scale-[0.8]" style={{ gridTemplateColumns: `repeat(${SHAPES[pieceId][0].length}, minmax(0, 1fr))` }}>
                        {SHAPES[pieceId].map((row, rIdx) =>
                          row.map((val, cIdx) => (
                            <div
                              key={`next-block-${idx}-${rIdx}-${cIdx}`}
                              className={`w-3.5 h-3.5 rounded-sm border ${val !== 0 ? COLORS[pieceId] : 'bg-transparent border-transparent'}`}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QUEUE SIDEBAR (WHEN OPPONENT GRID IS PRESENT) */}
            {gameMode !== 'single' && (
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3 w-full flex flex-col items-center space-y-2">
                <span className="text-[8px] font-bold tracking-widest text-zinc-500 uppercase">Next Pieces</span>
                <div className="flex gap-2.5">
                  {nextPieces.slice(0, 3).map((pieceId, idx) => (
                    <div
                      key={`next-vs-${idx}`}
                      className="w-11 h-9 flex items-center justify-center bg-black/35 rounded-lg border border-zinc-800/60"
                    >
                      <div className="grid gap-0.5 scale-[0.65]" style={{ gridTemplateColumns: `repeat(${SHAPES[pieceId][0].length}, minmax(0, 1fr))` }}>
                        {SHAPES[pieceId].map((row, rIdx) =>
                          row.map((val, cIdx) => (
                            <div
                              key={`next-vs-block-${idx}-${rIdx}-${cIdx}`}
                              className={`w-3 h-3 rounded-sm border ${val !== 0 ? COLORS[pieceId] : 'bg-transparent border-transparent'}`}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
