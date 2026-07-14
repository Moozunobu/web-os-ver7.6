import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface BootScreenProps {
  onComplete: () => void;
  isReboot?: boolean;
}

export const playStartupChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Master volume node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.2);
    masterGain.connect(ctx.destination);

    // Warm background synth pad (Major chord: Ab, Eb, C)
    const padNotes = [103.83, 155.56, 261.63, 311.13]; // Ab2, Eb3, C4, Eb4
    padNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.8);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 4.2);
    });

    // Chime notes: Eb4 (311.13 Hz), Ab4 (415.30 Hz), Bb4 (466.16 Hz), Eb5 (622.25 Hz)
    const chimes = [311.13, 415.30, 466.16, 622.25];
    const delays = [0.6, 0.9, 1.2, 1.5];

    chimes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delays[idx]);
      
      // Add a triangle wave with low volume for rich chime harmonic
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime + delays[idx]);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delays[idx]);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delays[idx] + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delays[idx] + 1.6);
      
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);
      
      osc.start(ctx.currentTime + delays[idx]);
      osc2.start(ctx.currentTime + delays[idx]);
      
      osc.stop(ctx.currentTime + delays[idx] + 1.8);
      osc2.stop(ctx.currentTime + delays[idx] + 1.8);
    });
  } catch (e) {
    console.error('Web Audio startup chime failed:', e);
  }
};

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete, isReboot = false }) => {
  const [phase, setPhase] = useState<'orbs' | 'merged' | 'logo' | 'complete'>('orbs');

  useEffect(() => {
    onComplete();
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(15px)' }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 bg-[#010103] z-[999999] flex flex-col items-center justify-center overflow-hidden select-none"
      id="webos-boot-screen"
    >
      {/* Background Star Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,transparent_60%)] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Startup Container */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-lg h-[400px]">
        
        {/* Phase 1: Swirling Orbs (Windows 7 style) */}
        {phase === 'orbs' && (
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Red Orb */}
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_25px_10px_rgba(244,63,94,0.6)] blur-[1px]"
              animate={{
                x: [60, 80, 40, -40, -80, -40, 20, 0],
                y: [-60, 0, 60, 80, 0, -60, -20, 0],
                scale: [1.2, 1, 0.8, 1.1, 1.3, 1, 0.9, 1.2],
              }}
              transition={{
                duration: 1.8,
                ease: 'easeInOut',
              }}
            />
            {/* Green Orb */}
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_25px_10px_rgba(52,211,153,0.6)] blur-[1px]"
              animate={{
                x: [-60, -80, -40, 40, 80, 40, -20, 0],
                y: [60, 0, -60, -80, 0, 60, 20, 0],
                scale: [1, 1.3, 1.1, 0.9, 1.2, 1, 0.8, 1.2],
              }}
              transition={{
                duration: 1.8,
                ease: 'easeInOut',
              }}
            />
            {/* Blue Orb */}
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_25px_10px_rgba(56,189,248,0.6)] blur-[1px]"
              animate={{
                x: [-60, 0, 60, 30, -30, -50, 15, 0],
                y: [-60, -80, -20, 60, 40, -30, -10, 0],
                scale: [0.8, 1.1, 1.4, 1.2, 0.9, 1.3, 1, 1.2],
              }}
              transition={{
                duration: 1.8,
                ease: 'easeInOut',
              }}
            />
            {/* Yellow Orb */}
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_25px_10px_rgba(251,191,36,0.6)] blur-[1px]"
              animate={{
                x: [60, 0, -60, -30, 30, 50, -15, 0],
                y: [60, 80, 20, -60, -40, 30, 10, 0],
                scale: [1.4, 0.9, 1.1, 1.3, 1, 1.2, 0.8, 1.2],
              }}
              transition={{
                duration: 1.8,
                ease: 'easeInOut',
              }}
            />

            {/* Orbit ring trail */}
            <svg className="absolute w-40 h-40 opacity-10" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 8" className="animate-spin" style={{ animationDuration: '8s' }} />
            </svg>
          </div>
        )}

        {/* Phase 2: Merge Flash & Transition */}
        {phase === 'merged' && (
          <motion.div 
            className="absolute w-24 h-24 rounded-full bg-white blur-[12px]"
            initial={{ scale: 0.1, opacity: 1 }}
            animate={{ scale: [1, 5, 0], opacity: [1, 0.8, 0] }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        )}

        {/* Phase 3: Display interlocking ribbon infinity logo */}
        {(phase === 'logo' || phase === 'merged') && (
          <motion.div
            className="flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          >
            {/* Interlocking Ribbon Infinity SVG Logo */}
            <div className="relative w-64 h-48 flex items-center justify-center">
              {/* Soft logo backdrop glow */}
              <div className="absolute w-64 h-32 rounded-full bg-blue-500/15 blur-[45px] animate-pulse" style={{ animationDuration: '3s' }} />

              <svg 
                className="w-56 h-36 drop-shadow-[0_0_20px_rgba(59,130,246,0.35)]" 
                viewBox="0 0 400 300"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Left Lobe Gradient: Purple to Magenta to Blue */}
                  <linearGradient id="leftLobeGrad" x1="50" y1="120" x2="200" y2="150" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a855f7" /> {/* Purple */}
                    <stop offset="50%" stopColor="#ec4899" /> {/* Magenta */}
                    <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
                  </linearGradient>

                  {/* Right Lobe Gradient: Cyan to Emerald to Gold to Red */}
                  <linearGradient id="rightLobeGrad" x1="200" y1="150" x2="350" y2="170" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
                    <stop offset="40%" stopColor="#10b981" /> {/* Emerald */}
                    <stop offset="75%" stopColor="#f59e0b" /> {/* Gold */}
                    <stop offset="100%" stopColor="#ef4444" /> {/* Red */}
                  </linearGradient>

                  {/* Radial glow filter */}
                  <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Left Ribbon Loop */}
                <motion.path 
                  d="M200 150 C160 100 110 90 80 120 C40 160 50 210 90 230 C130 250 170 190 200 150" 
                  stroke="url(#leftLobeGrad)" 
                  strokeWidth="28" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.6, ease: 'easeInOut' }}
                />

                {/* Left Ribbon Gloss Highlight */}
                <motion.path 
                  d="M200 150 C160 100 110 90 80 120 C40 160 50 210 90 230 C130 250 170 190 200 150" 
                  stroke="white" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.05 }}
                />

                {/* Right Ribbon Loop */}
                <motion.path 
                  d="M200 150 C240 190 290 200 320 170 C360 130 350 80 310 60 C270 40 230 100 200 150" 
                  stroke="url(#rightLobeGrad)" 
                  strokeWidth="28" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.1 }}
                />

                {/* Right Ribbon Gloss Highlight */}
                <motion.path 
                  d="M200 150 C240 190 290 200 320 170 C360 130 350 80 310 60 C270 40 230 100 200 150" 
                  stroke="white" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.15 }}
                />

                {/* White Letter "N" in Left Lobe Center */}
                <g filter="url(#glow)">
                  <circle cx="102" cy="152" r="18" fill="white" fillOpacity="0.15" />
                  <text 
                    x="102" 
                    y="159" 
                    fill="white" 
                    fontSize="20" 
                    fontWeight="bold" 
                    fontFamily="sans-serif" 
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    N
                  </text>
                </g>

                {/* White Power Button Icon in Right Lobe Center */}
                <g filter="url(#glow)">
                  <circle cx="298" cy="148" r="18" fill="white" fillOpacity="0.15" />
                  {/* Power Button Circle */}
                  <path 
                    d="M298 139 A 9 9 0 1 1 298 157 A 9 9 0 0 1 298 139 Z" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeDasharray="40" 
                    strokeDashoffset="10"
                    strokeLinecap="round"
                  />
                  {/* Power Button Line */}
                  <path 
                    d="M298 137 V146" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </div>

            {/* "noob web os" Display Branding Text */}
            <motion.div
              className="text-center mt-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.98, y: 0 }}
              transition={{ duration: 1.4, delay: 0.4 }}
            >
              <h1 className="text-2xl sm:text-3xl font-light tracking-[0.25em] text-white/95 font-sans">
                noob <span className="font-semibold text-white">web os</span>
              </h1>
              <p className="text-[10px] sm:text-xs tracking-[0.45em] uppercase text-zinc-500 font-mono mt-2.5 pl-1.5">
                {isReboot ? 'System Restarting' : 'Powered by AI Studio'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Loading bar at the bottom */}
      <div className="absolute bottom-12 flex flex-col items-center gap-3">
        <div className="h-[3px] w-48 bg-zinc-900 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-[0_0_8px_#3b82f6]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4.8, ease: 'easeInOut' }}
          />
        </div>
        <span className="text-[9px] tracking-[0.3em] uppercase text-zinc-500 font-sans animate-pulse">
          Starting system...
        </span>
      </div>
    </motion.div>
  );
};
