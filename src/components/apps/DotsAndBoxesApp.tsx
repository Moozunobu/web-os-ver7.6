import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Users, Bot, Layers, ArrowLeft, RefreshCw, Trophy, Volume2, VolumeX, Sparkles, AlertCircle } from 'lucide-react';

// --- Supabase Credentials ---
const SUPABASE_URL = 'https://nsyvlftqcciyetsbhymg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lkhrFuMlNyEmUX4RTFApKw_AhD1sAkV';

export const DotsAndBoxesApp: React.FC = () => {
  // --- Audio Synth Engine ---
  const [muted, setMuted] = useState(false);

  const playSound = (type: 'place' | 'complete' | 'victory' | 'click' | 'join') => {
    if (muted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      if (type === 'place') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'complete') {
        const playBeep = (freq: number, start: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.15);
        };
        playBeep(880, now);
        playBeep(1320, now + 0.08);
      } else if (type === 'victory') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const start = now + idx * 0.12;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.1, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.27);
        });
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'join') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  };

  // --- Game Setup State ---
  const [gameState, setGameState] = useState<'menu' | 'setup' | 'room' | 'playing' | 'gameover'>('menu');
  const [gameMode, setGameMode] = useState<'ai' | 'online' | null>(null);
  const [gridSize, setGridSize] = useState<number>(4); // Default 4x4 boxes (5x5 dots)

  // --- Online Multiplayer State ---
  const [roomCode, setRoomCode] = useState<string>('');
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<'p1' | 'p2'>('p1');
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [statusText, setStatusText] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const supabaseRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // --- Active Game Board State ---
  const [drawnLines, setDrawnLines] = useState<Record<string, 'p1' | 'p2'>>({});
  const [boxes, setBoxes] = useState<Record<string, 'p1' | 'p2'>>({});
  const [currentTurn, setCurrentTurn] = useState<'p1' | 'p2'>('p1');
  const [scores, setScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // --- Initialize Supabase ---
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

  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
    };
  }, []);

  const totalPossibleBoxes = gridSize * gridSize;
  const isGameOver = Object.keys(boxes).length === totalPossibleBoxes;

  // --- Handle Box Completions helper ---
  const checkNewCompletedBoxes = (
    lineKey: string,
    currentDrawn: Record<string, 'p1' | 'p2'>,
    player: 'p1' | 'p2'
  ) => {
    const parts = lineKey.split('-');
    const type = parts[0]; // 'h' or 'v'
    const r = parseInt(parts[1], 10);
    const c = parseInt(parts[2], 10);

    const newlyCompleted: string[] = [];

    const isBoxClosed = (row: number, col: number) => {
      const top = `h-${row}-${col}`;
      const bottom = `h-${row + 1}-${col}`;
      const left = `v-${row}-${col}`;
      const right = `v-${row}-${col + 1}`;
      return (
        currentDrawn[top] &&
        currentDrawn[bottom] &&
        currentDrawn[left] &&
        currentDrawn[right]
      );
    };

    if (type === 'h') {
      // Check box above
      if (r > 0) {
        const boxKey = `${r - 1}-${c}`;
        if (!boxes[boxKey] && isBoxClosed(r - 1, c)) {
          newlyCompleted.push(boxKey);
        }
      }
      // Check box below
      if (r < gridSize) {
        const boxKey = `${r}-${c}`;
        if (!boxes[boxKey] && isBoxClosed(r, c)) {
          newlyCompleted.push(boxKey);
        }
      }
    } else {
      // Check box to left
      if (c > 0) {
        const boxKey = `${r}-${c - 1}`;
        if (!boxes[boxKey] && isBoxClosed(r, c - 1)) {
          newlyCompleted.push(boxKey);
        }
      }
      // Check box to right
      if (c < gridSize) {
        const boxKey = `${r}-${c}`;
        if (!boxes[boxKey] && isBoxClosed(r, c)) {
          newlyCompleted.push(boxKey);
        }
      }
    }

    return newlyCompleted;
  };

  // --- Smart Local AI Move ---
  useEffect(() => {
    if (gameMode === 'ai' && currentTurn === 'p2' && !isGameOver && gameState === 'playing') {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameMode, isGameOver, gameState]);

  const makeAIMove = (
    currentDrawnLines: Record<string, 'p1' | 'p2'> = drawnLines,
    currentBoxes: Record<string, 'p1' | 'p2'> = boxes,
    currentScores: { p1: number; p2: number } = scores
  ) => {
    // Generate all available lines
    const availableLines: string[] = [];
    for (let r = 0; r <= gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const key = `h-${r}-${c}`;
        if (!currentDrawnLines[key]) availableLines.push(key);
      }
    }
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c <= gridSize; c++) {
        const key = `v-${r}-${c}`;
        if (!currentDrawnLines[key]) availableLines.push(key);
      }
    }

    if (availableLines.length === 0) return;

    // Helper to evaluate a hypothetically drawn line on count of boxes completed or fed
    const evaluateLine = (line: string) => {
      const parts = line.split('-');
      const type = parts[0];
      const r = parseInt(parts[1], 10);
      const c = parseInt(parts[2], 10);

      const adjacentBoxCoordinates: { r: number; c: number }[] = [];
      if (type === 'h') {
        if (r > 0) adjacentBoxCoordinates.push({ r: r - 1, c });
        if (r < gridSize) adjacentBoxCoordinates.push({ r, c });
      } else {
        if (c > 0) adjacentBoxCoordinates.push({ r, c: c - 1 });
        if (c < gridSize) adjacentBoxCoordinates.push({ r, c });
      }

      let completionsCount = 0;
      let maximumAdjacentLinesCountAfterMove = 0;

      adjacentBoxCoordinates.forEach((box) => {
        const top = `h-${box.r}-${box.c}`;
        const bottom = `h-${box.r + 1}-${box.c}`;
        const left = `v-${box.r}-${box.c}`;
        const right = `v-${box.r}-${box.c + 1}`;

        let currentDrawnCount = 0;
        if (currentDrawnLines[top]) currentDrawnCount++;
        if (currentDrawnLines[bottom]) currentDrawnCount++;
        if (currentDrawnLines[left]) currentDrawnCount++;
        if (currentDrawnLines[right]) currentDrawnCount++;

        const futureCount = currentDrawnCount + 1;
        if (futureCount === 4) {
          completionsCount++;
        }
        if (futureCount > maximumAdjacentLinesCountAfterMove) {
          maximumAdjacentLinesCountAfterMove = futureCount;
        }
      });

      return { completionsCount, maximumAdjacentLinesCountAfterMove };
    };

    const captureMoves: string[] = [];
    const safeMoves: string[] = [];
    const badMoves: string[] = [];

    availableLines.forEach((line) => {
      const { completionsCount, maximumAdjacentLinesCountAfterMove } = evaluateLine(line);
      if (completionsCount > 0) {
        captureMoves.push(line);
      } else if (maximumAdjacentLinesCountAfterMove <= 2) {
        safeMoves.push(line);
      } else {
        badMoves.push(line);
      }
    });

    let selectedLine = '';
    if (captureMoves.length > 0) {
      selectedLine = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    } else if (safeMoves.length > 0) {
      selectedLine = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    } else {
      selectedLine = badMoves[Math.floor(Math.random() * badMoves.length)];
    }

    if (!selectedLine) return;

    // Apply move
    const newDrawn = { ...currentDrawnLines, [selectedLine]: 'p2' as const };
    setDrawnLines(newDrawn);

    const checkNewCompletedBoxesLocal = (
      lineKey: string,
      currentDrawn: Record<string, 'p1' | 'p2'>,
      player: 'p1' | 'p2'
    ) => {
      const parts = lineKey.split('-');
      const type = parts[0]; // 'h' or 'v'
      const r = parseInt(parts[1], 10);
      const c = parseInt(parts[2], 10);

      const newlyCompleted: string[] = [];

      const isBoxClosed = (row: number, col: number) => {
        const top = `h-${row}-${col}`;
        const bottom = `h-${row + 1}-${col}`;
        const left = `v-${row}-${col}`;
        const right = `v-${row}-${col + 1}`;
        return (
          currentDrawn[top] &&
          currentDrawn[bottom] &&
          currentDrawn[left] &&
          currentDrawn[right]
        );
      };

      if (type === 'h') {
        if (r > 0) {
          const boxKey = `${r - 1}-${c}`;
          if (!currentBoxes[boxKey] && isBoxClosed(r - 1, c)) {
            newlyCompleted.push(boxKey);
          }
        }
        if (r < gridSize) {
          const boxKey = `${r}-${c}`;
          if (!currentBoxes[boxKey] && isBoxClosed(r, c)) {
            newlyCompleted.push(boxKey);
          }
        }
      } else {
        if (c > 0) {
          const boxKey = `${r}-${c - 1}`;
          if (!currentBoxes[boxKey] && isBoxClosed(r, c - 1)) {
            newlyCompleted.push(boxKey);
          }
        }
        if (c < gridSize) {
          const boxKey = `${r}-${c}`;
          if (!currentBoxes[boxKey] && isBoxClosed(r, c)) {
            newlyCompleted.push(boxKey);
          }
        }
      }

      return newlyCompleted;
    };

    const newCompletes = checkNewCompletedBoxesLocal(selectedLine, newDrawn, 'p2');

    if (newCompletes.length > 0) {
      const updatedBoxes = { ...currentBoxes };
      newCompletes.forEach((b) => {
        updatedBoxes[b] = 'p2';
      });
      setBoxes(updatedBoxes);
      const newScoreP2 = currentScores.p2 + newCompletes.length;
      const updatedScores = { ...currentScores, p2: newScoreP2 };
      setScores(updatedScores);
      playSound('complete');

      const isFinished = Object.keys(updatedBoxes).length === totalPossibleBoxes;
      if (isFinished) {
        setGameState('gameover');
        playSound('victory');
      } else {
        // AI completed a box, gets another turn immediately!
        setTimeout(() => {
          makeAIMove(newDrawn, updatedBoxes, updatedScores);
        }, 1000);
      }
    } else {
      playSound('place');
      setCurrentTurn('p1');
    }
  };

  // --- Click or Draw Line Handler ---
  const handleLineClick = (lineKey: string) => {
    if (drawnLines[lineKey] || isGameOver || gameState !== 'playing') return;

    // AI Turn guard: prevent clicking during AI's turn
    if (gameMode === 'ai' && currentTurn === 'p2') return;

    // Online turn guard
    if (gameMode === 'online' && currentTurn !== playerId) return;

    const player = currentTurn;
    const newDrawn = { ...drawnLines, [lineKey]: player };
    setDrawnLines(newDrawn);

    const newlyCompleted = checkNewCompletedBoxes(lineKey, newDrawn, player);

    let nextTurn = currentTurn;
    let nextScores = { ...scores };
    let nextBoxes = { ...boxes };

    if (newlyCompleted.length > 0) {
      newlyCompleted.forEach((b) => {
        nextBoxes[b] = player;
      });
      if (player === 'p1') {
        nextScores.p1 += newlyCompleted.length;
      } else {
        nextScores.p2 += newlyCompleted.length;
      }
      playSound('complete');
      setBoxes(nextBoxes);
      setScores(nextScores);
    } else {
      playSound('place');
      nextTurn = currentTurn === 'p1' ? 'p2' : 'p1';
      setCurrentTurn(nextTurn);
    }

    const nextGameOver = Object.keys(nextBoxes).length === totalPossibleBoxes;
    if (nextGameOver) {
      setGameState('gameover');
      playSound('victory');
    }

    // If online, broadcast state change
    if (gameMode === 'online' && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'db_line_drawn',
        payload: {
          drawnLines: newDrawn,
          boxes: nextBoxes,
          scores: nextScores,
          currentTurn: nextTurn,
          gameState: nextGameOver ? 'gameover' : 'playing',
        },
      });
    }
  };

  // --- Online Supabase Room System Actions ---
  const handleCreateRoom = async () => {
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
      setErrorText('Could not connect to Supabase. Check settings.');
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
      setPlayerId('p1');
      setOpponentName('Waiting...');

      const channel = client.channel(`dots-room-${normalizedRoom}`, {
        config: { broadcast: { self: false } },
      });

      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'db_join' }, (payload: any) => {
          playSound('join');
          setOpponentName(payload.payload.username || 'Guest Player');
          setStatusText('Player joined! Initializing game...');
          
          channel.send({
            type: 'broadcast',
            event: 'db_init_board',
            payload: {
              gridSize,
              opponentName: 'Player 1',
            },
          });

          // Begin playing
          setDrawnLines({});
          setBoxes({});
          setScores({ p1: 0, p2: 0 });
          setCurrentTurn('p1');
          setGameState('playing');
        })
        .on('broadcast', { event: 'db_line_drawn' }, (payload: any) => {
          const { drawnLines: nextDrawn, boxes: nextBoxes, scores: nextScores, currentTurn: nextTurn, gameState: nextGameState } = payload.payload;
          setDrawnLines(nextDrawn);
          setBoxes(nextBoxes);
          setScores(nextScores);
          setCurrentTurn(nextTurn);
          if (nextGameState === 'gameover') {
            setGameState('gameover');
            playSound('victory');
          } else {
            playSound('place');
          }
        })
        .on('broadcast', { event: 'db_leave' }, () => {
          setOpponentName('Left');
          setStatusText('Opponent disconnected');
          window.parent.postMessage({
            type: 'WETALKS_NEW_MESSAGE',
            payload: { sender: 'System', text: '対戦相手が退出しました。' }
          }, '*');
        });

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setGameState('room');
          setStatusText(`Room code [${normalizedRoom}] created. Share this with your opponent!`);
        } else {
          setErrorText('Subscription failed. Retry.');
        }
      });
    } catch (e: any) {
      setErrorText(e.message || 'Error occurred');
    }
  };

  const handleJoinRoom = async () => {
    playSound('click');
    const normalizedRoom = roomCode.trim().toLowerCase();
    if (!normalizedRoom) {
      setErrorText('Please enter a room code');
      return;
    }
    setErrorText('');
    setStatusText('Joining room...');

    const client = getSupabaseClient();
    if (!client) {
      setErrorText('Could not connect to Supabase. Check settings.');
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
      setPlayerId('p2');
      setOpponentName('Player 1');

      const channel = client.channel(`dots-room-${normalizedRoom}`, {
        config: { broadcast: { self: false } },
      });

      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'db_init_board' }, (payload: any) => {
          playSound('join');
          setGridSize(payload.payload.gridSize);
          setOpponentName(payload.payload.opponentName || 'Player 1');
          setDrawnLines({});
          setBoxes({});
          setScores({ p1: 0, p2: 0 });
          setCurrentTurn('p1');
          setGameState('playing');
        })
        .on('broadcast', { event: 'db_line_drawn' }, (payload: any) => {
          const { drawnLines: nextDrawn, boxes: nextBoxes, scores: nextScores, currentTurn: nextTurn, gameState: nextGameState } = payload.payload;
          setDrawnLines(nextDrawn);
          setBoxes(nextBoxes);
          setScores(nextScores);
          setCurrentTurn(nextTurn);
          if (nextGameState === 'gameover') {
            setGameState('gameover');
            playSound('victory');
          } else {
            playSound('place');
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
          channel.send({
            type: 'broadcast',
            event: 'db_join',
            payload: {
              username: 'Player 2',
            },
          });
          setStatusText('Connected! Synchronizing board state...');
        } else {
          setErrorText('Could not connect to the real-time room.');
        }
      });
    } catch (e: any) {
      setErrorText(e.message || 'Connection failed.');
    }
  };

  const handleLeaveRoom = () => {
    playSound('click');
    if (channelRef.current && supabaseRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'db_leave',
          payload: {},
        });
        supabaseRef.current.removeChannel(channelRef.current);
      } catch (e) {}
    }
    channelRef.current = null;
    setGameState('menu');
    setGameMode(null);
    setDrawnLines({});
    setBoxes({});
    setScores({ p1: 0, p2: 0 });
  };

  const resetGame = () => {
    playSound('click');
    setDrawnLines({});
    setBoxes({});
    setScores({ p1: 0, p2: 0 });
    setCurrentTurn('p1');
    setGameState('playing');

    if (gameMode === 'online' && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'db_line_drawn',
        payload: {
          drawnLines: {},
          boxes: {},
          scores: { p1: 0, p2: 0 },
          currentTurn: 'p1',
          gameState: 'playing',
        },
      });
    }
  };

  return (
    <div id="dots-and-boxes-app" className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 select-none font-sans overflow-hidden">
      
      {/* Top Bar Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-rose-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <span className="font-bold text-sm tracking-tight text-white">DB</span>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">Dots & Boxes</h1>
            <p className="text-[10px] text-zinc-400 font-medium">アソビ大全 - Clubhouse Multi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
          {gameState !== 'menu' && (
            <button
              onClick={handleLeaveRoom}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Menu
            </button>
          )}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pt-16 bg-zinc-950 relative overflow-y-auto">

        {/* 1. STARTUP MENU MODE */}
        {gameState === 'menu' && (
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-850 p-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 transform transition-all">
            <div className="text-center">
              <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] text-cyan-400 font-black tracking-widest uppercase mb-3 inline-block">
                Choose Mode
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">ドットアンドボックス</h2>
              <p className="text-xs text-zinc-400 mt-1.5">Classic strategic wire-grid point capture</p>
            </div>

            <div className="w-full flex flex-col gap-4">
              <button
                onClick={() => {
                  playSound('click');
                  setGameMode('ai');
                  setGameState('setup');
                }}
                className="w-full p-4 bg-gradient-to-r from-zinc-850 to-zinc-900 hover:from-zinc-800 hover:to-zinc-850 border border-zinc-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Single Player vs AI</h3>
                    <p className="text-[10px] text-zinc-400">Battle the rule-based minimax intellect</p>
                  </div>
                </div>
                <Play className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setGameMode('online');
                  setGameState('setup');
                }}
                className="w-full p-4 bg-gradient-to-r from-zinc-850 to-zinc-900 hover:from-zinc-800 hover:to-zinc-850 border border-zinc-800 hover:border-rose-500/50 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Online Multiplayer</h3>
                    <p className="text-[10px] text-zinc-400">Play real-time with cross-device sync</p>
                  </div>
                </div>
                <Play className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* 2. SETUP SCREEN (Grid Size / Connection Room) */}
        {gameState === 'setup' && (
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-850 p-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playSound('click');
                  setGameState('menu');
                }}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold text-white tracking-tight">Game Customization</h2>
            </div>

            {/* Grid Size Selection */}
            {(!isCreator && gameMode === 'ai') || gameMode === 'online' ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Choose Grid Dimensions
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 4, 5].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        playSound('click');
                        setGridSize(size);
                      }}
                      className={`py-3 px-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                        gridSize === size
                          ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/5'
                          : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-black">{size} x {size}</span>
                      <span className="text-[9px] opacity-70 mt-0.5">{size + 1}x{size + 1} Dots</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* AI Launcher Button */}
            {gameMode === 'ai' && (
              <button
                onClick={() => {
                  playSound('click');
                  setDrawnLines({});
                  setBoxes({});
                  setScores({ p1: 0, p2: 0 });
                  setCurrentTurn('p1');
                  setGameState('playing');
                }}
                className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
              >
                Start Game vs AI
              </button>
            )}

            {/* Online Room Configuration */}
            {gameMode === 'online' && (
              <div className="flex flex-col gap-4 border-t border-zinc-800/80 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400">Room Synchronization Code</label>
                  <input
                    type="text"
                    placeholder="Enter Room Code (e.g., 777)"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-center text-sm font-black tracking-widest placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition-all uppercase"
                  />
                </div>

                {errorText && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/30 text-red-400 text-[11px] rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorText}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <button
                    onClick={handleCreateRoom}
                    className="py-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Host Room
                  </button>
                  <button
                    onClick={handleJoinRoom}
                    className="py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/10 cursor-pointer"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. MULTIPLAYER ROOM WAITING SCREEN */}
        {gameState === 'room' && (
          <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-850 p-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 text-center">
            <span className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center animate-bounce text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Waiting for Opponent...</h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Provide your opponent with the Room Code to sync board configurations.
              </p>
            </div>

            <div className="px-6 py-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xl font-black tracking-widest text-white uppercase shadow-inner">
              {roomCode}
            </div>

            {statusText && (
              <p className="text-xs text-cyan-400 font-medium animate-pulse">{statusText}</p>
            )}

            <button
              onClick={handleLeaveRoom}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </div>
        )}

        {/* 4. ACTIVE GAME BOARD */}
        {(gameState === 'playing' || gameState === 'gameover') && (
          <div className="flex flex-col items-center gap-6 w-full max-w-xl h-full justify-center py-8 pb-12">
            <div className="max-h-full overflow-hidden flex flex-col justify-between h-full w-full items-center gap-4">
              
              {/* Scoreboard */}
              <div className="w-full grid grid-cols-2 gap-4 bg-zinc-900/60 border border-zinc-850 p-4 rounded-2xl shadow-lg backdrop-blur-md relative overflow-hidden">
                <div 
                  className={`absolute bottom-0 h-1 transition-all duration-300 ${
                    currentTurn === 'p1' ? 'left-0 w-1/2 bg-cyan-500' : 'left-1/2 w-1/2 bg-rose-500'
                  }`} 
                />

                {/* Player 1 Score */}
                <div className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  currentTurn === 'p1' ? 'bg-cyan-500/10' : ''
                }`}>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                    {gameMode === 'online' ? (playerId === 'p1' ? 'You (P1)' : opponentName) : 'Player 1'}
                  </span>
                  <span className="text-3xl font-black text-cyan-400 mt-1">{scores.p1}</span>
                </div>

                {/* Player 2 Score */}
                <div className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  currentTurn === 'p2' ? 'bg-rose-500/10' : ''
                }`}>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                    {gameMode === 'online' ? (playerId === 'p2' ? 'You (P2)' : opponentName) : (gameMode === 'ai' ? 'CPU (AI)' : 'Player 2')}
                  </span>
                  <span className="text-3xl font-black text-rose-400 mt-1">{scores.p2}</span>
                </div>
              </div>

              {/* Clubhouse Walnut Board Frame */}
              <div className="relative w-full max-w-[220px] sm:max-w-[240px] aspect-square mx-auto max-h-[220px] sm:max-h-[240px] my-2 bg-[#1a2b1b] border-[10px] border-amber-950/95 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex items-center justify-center p-4 select-none">
                
                <div className="absolute inset-0 bg-[radial-gradient(#253c27_1px,transparent_1px)] [background-size:16px_16px] opacity-40 rounded-xl" />

                {/* Grid Interactive Wrapper */}
                <div className="w-full h-full relative" id="game-felt-grid">
                  
                  {/* 1. Render Completed Boxes Backgrounds */}
                  {Array.from({ length: gridSize }).map((_, rIdx) => (
                    Array.from({ length: gridSize }).map((_, cIdx) => {
                      const boxKey = `${rIdx}-${cIdx}`;
                      const owner = boxes[boxKey];
                      if (!owner) return null;

                      const leftPct = (cIdx / gridSize) * 100;
                      const topPct = (rIdx / gridSize) * 100;
                      const sizePct = (1 / gridSize) * 100;

                      return (
                        <div
                          key={`box-${boxKey}`}
                          className={`absolute rounded-xl flex items-center justify-center transition-all duration-300 animate-[bounce_0.4s_ease-out] ${
                            owner === 'p1'
                              ? 'bg-cyan-500/15 border border-cyan-500/25 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)] text-cyan-400'
                              : 'bg-rose-500/15 border border-rose-500/25 shadow-[inset_0_0_15px_rgba(244,63,94,0.15)] text-rose-400'
                          }`}
                          style={{
                            left: `${leftPct + 1.5}%`,
                            top: `${topPct + 1.5}%`,
                            width: `${sizePct - 3}%`,
                            height: `${sizePct - 3}%`,
                          }}
                        >
                          <span className="text-sm font-black tracking-tighter opacity-80 uppercase scale-105">
                            {owner === 'p1' ? '★' : '◆'}
                          </span>
                        </div>
                      );
                    })
                  ))}

                  {/* 2. Render Lines (Hitboxes & Visually glowing items) */}
                  {/* Horizontal Lines */}
                  {Array.from({ length: gridSize + 1 }).map((_, rIdx) => (
                    Array.from({ length: gridSize }).map((_, cIdx) => {
                      const lineKey = `h-${rIdx}-${cIdx}`;
                      const drawer = drawnLines[lineKey];
                      const isHovered = hoveredLine === lineKey;

                      const topPct = (rIdx / gridSize) * 100;
                      const leftPct = (cIdx / gridSize) * 100;
                      const widthPct = (1 / gridSize) * 100;

                      return (
                        <div
                          key={`hit-h-${lineKey}`}
                          className="absolute z-30 cursor-pointer flex items-center"
                          style={{
                            top: `calc(${topPct}% - 12px)`,
                            left: `calc(${leftPct}% + 10px)`,
                            width: `calc(${widthPct}% - 20px)`,
                            height: '24px',
                          }}
                          onMouseEnter={() => !drawer && setHoveredLine(lineKey)}
                          onMouseLeave={() => setHoveredLine(null)}
                          onClick={() => handleLineClick(lineKey)}
                        >
                          <div
                            className={`w-full h-[5px] rounded-full transition-all duration-200 ${
                              drawer
                                ? drawer === 'p1'
                                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                  : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                : isHovered
                                  ? currentTurn === 'p1'
                                    ? 'bg-cyan-500/40'
                                    : 'bg-rose-500/40'
                                  : 'bg-[#29422a] group-hover:bg-[#345335]'
                            }`}
                          />
                        </div>
                      );
                    })
                  ))}

                  {/* Vertical Lines */}
                  {Array.from({ length: gridSize }).map((_, rIdx) => (
                    Array.from({ length: gridSize + 1 }).map((_, cIdx) => {
                      const lineKey = `v-${rIdx}-${cIdx}`;
                      const drawer = drawnLines[lineKey];
                      const isHovered = hoveredLine === lineKey;

                      const topPct = (rIdx / gridSize) * 100;
                      const leftPct = (cIdx / gridSize) * 100;
                      const heightPct = (1 / gridSize) * 100;

                      return (
                        <div
                          key={`hit-v-${lineKey}`}
                          className="absolute z-30 cursor-pointer flex justify-center items-center"
                          style={{
                            left: `calc(${leftPct}% - 12px)`,
                            top: `calc(${topPct}% + 10px)`,
                            height: `calc(${heightPct}% - 20px)`,
                            width: '24px',
                          }}
                          onMouseEnter={() => !drawer && setHoveredLine(lineKey)}
                          onMouseLeave={() => setHoveredLine(null)}
                          onClick={() => handleLineClick(lineKey)}
                        >
                          <div
                            className={`w-[5px] h-full rounded-full transition-all duration-200 ${
                              drawer
                                ? drawer === 'p1'
                                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                  : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                : isHovered
                                  ? currentTurn === 'p1'
                                    ? 'bg-cyan-500/40'
                                    : 'bg-rose-500/40'
                                  : 'bg-[#29422a] group-hover:bg-[#345335]'
                            }`}
                          />
                        </div>
                      );
                    })
                  ))}

                  {/* 3. Render Dots */}
                  {Array.from({ length: gridSize + 1 }).map((_, rIdx) => (
                    Array.from({ length: gridSize + 1 }).map((_, cIdx) => {
                      const topPct = (rIdx / gridSize) * 100;
                      const leftPct = (cIdx / gridSize) * 100;

                      return (
                        <div
                          key={`dot-${rIdx}-${cIdx}`}
                          className="absolute z-45 w-[14px] h-[14px] rounded-full bg-amber-100 border-2 border-zinc-900 shadow-[0_2px_4px_rgba(0,0,0,0.5),_inset_0_1px_2px_white] transform -translate-x-1/2 -translate-y-1/2 transition-colors"
                          style={{
                            top: `${topPct}%`,
                            left: `${leftPct}%`,
                          }}
                        />
                      );
                    })
                  ))}

                </div>
              </div>

              {/* Turn status message */}
              {gameState === 'playing' && (
                <div className="text-xs text-zinc-400 font-bold flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    currentTurn === 'p1' ? 'bg-cyan-400 animate-ping' : 'bg-rose-400 animate-ping'
                  }`} />
                  <span>
                    {gameMode === 'online'
                      ? currentTurn === playerId
                        ? 'Your Turn - Draw a connection'
                        : `Opponent's turn to act...`
                      : currentTurn === 'p1'
                        ? "Player 1's Turn"
                        : gameMode === 'ai'
                          ? 'AI is calculating move...'
                          : "Player 2's Turn"}
                  </span>
                </div>
              )}

              {/* Victory overlay and play again controls */}
              {gameState === 'gameover' && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-50 p-6 rounded-2xl">
                  <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center gap-4 text-center shadow-2xl">
                    <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                    <div>
                      <h2 className="text-lg font-black text-white">
                        {scores.p1 === scores.p2
                          ? 'Match Draw!'
                          : scores.p1 > scores.p2
                            ? `${gameMode === 'online' && playerId === 'p1' ? 'You' : 'Player 1'} Won!`
                            : `${gameMode === 'online' && playerId === 'p2' ? 'You' : (gameMode === 'ai' ? 'AI' : 'Player 2')} Won!`}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Final Score: {scores.p1} to {scores.p2}
                      </p>
                    </div>
                    <button
                      onClick={resetGame}
                      className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Play Again
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
