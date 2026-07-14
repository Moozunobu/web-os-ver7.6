import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Scissors, 
  Download, 
  Plus, 
  Trash2, 
  Type, 
  Sparkles, 
  Sliders, 
  Eye, 
  Volume2, 
  VolumeX, 
  FileVideo, 
  ChevronRight, 
  Maximize2, 
  ZoomIn,
  Move,
  Type as FontIcon
} from 'lucide-react';

// Clip and asset definitions
export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'procedural';
  url: string;
  duration: number; // in seconds
  proceduralType?: 'sunset' | 'matrix' | 'waves' | 'orb-green' | 'stickman-green';
}

export interface VideoClip {
  id: string;
  assetId: string;
  name: string;
  type: 'video' | 'procedural' | 'image';
  timelineStart: number; // in seconds
  duration: number; // in seconds
  trimStart: number; // in seconds
  volume: number; // 0 to 1
  filter: 'none' | 'sepia' | 'grayscale' | 'contrast' | 'invert' | 'blur';
  chromaKey: boolean;
  chromaKeyColor: { r: number; g: number; b: number };
  chromaKeySimilarity: number; // 0 - 100
  proceduralType?: 'sunset' | 'matrix' | 'waves' | 'orb-green' | 'stickman-green';
  fileElement?: HTMLVideoElement | HTMLImageElement | null;
}

export interface AudioClip {
  id: string;
  assetId: string;
  name: string;
  timelineStart: number;
  duration: number;
  trimStart: number;
  volume: number;
  fileElement?: HTMLAudioElement | null;
}

export interface SubtitleClip {
  id: string;
  text: string;
  timelineStart: number;
  duration: number;
  fontSize: number;
  color: string;
  style: 'normal' | 'bold' | 'italic';
  positionY: number; // % from top
}

export const VideoEditorApp: React.FC = () => {
  // --- DEFAULT MEDIA ASSETS & TEMPLATES ---
  const initialAssets: MediaAsset[] = [
    {
      id: 'template-sunset',
      name: '🌅 Neon Sunset (Synthwave)',
      type: 'procedural',
      url: '',
      duration: 30,
      proceduralType: 'sunset',
    },
    {
      id: 'template-matrix',
      name: '💻 Cosmic Matrix Rain',
      type: 'procedural',
      url: '',
      duration: 30,
      proceduralType: 'matrix',
    },
    {
      id: 'template-waves',
      name: '🌊 Abstract Digital Waves',
      type: 'procedural',
      url: '',
      duration: 30,
      proceduralType: 'waves',
    },
    {
      id: 'template-orb',
      name: '🟢 Bouncing Orb (Chroma Green)',
      type: 'procedural',
      url: '',
      duration: 20,
      proceduralType: 'orb-green',
    },
    {
      id: 'template-stickman',
      name: '🏃 Running Figure (Chroma Green)',
      type: 'procedural',
      url: '',
      duration: 20,
      proceduralType: 'stickman-green',
    },
  ];

  // --- STATE ---
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
  
  // Timeline clips
  const [videoClips, setVideoClips] = useState<VideoClip[]>([
    {
      id: 'v-clip-1',
      assetId: 'template-sunset',
      name: '🌅 Neon Sunset',
      type: 'procedural',
      timelineStart: 0,
      duration: 15,
      trimStart: 0,
      volume: 1,
      filter: 'none',
      chromaKey: false,
      chromaKeyColor: { r: 0, g: 255, b: 0 },
      chromaKeySimilarity: 45,
      proceduralType: 'sunset',
    },
    {
      id: 'v-clip-2',
      assetId: 'template-orb',
      name: '🟢 Bouncing Orb (Chroma)',
      type: 'procedural',
      timelineStart: 3,
      duration: 10,
      trimStart: 0,
      volume: 1,
      filter: 'none',
      chromaKey: true,
      chromaKeyColor: { r: 0, g: 255, b: 0 },
      chromaKeySimilarity: 50,
      proceduralType: 'orb-green',
    }
  ]);

  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleClip[]>([
    {
      id: 'sub-1',
      text: 'Welcome to nooncut Video Editor!',
      timelineStart: 1,
      duration: 4,
      fontSize: 24,
      color: '#ffffff',
      style: 'bold',
      positionY: 82,
    },
    {
      id: 'sub-2',
      text: 'Chroma Key blends procedural or uploaded clips.',
      timelineStart: 6,
      duration: 5,
      fontSize: 22,
      color: '#a78bfa',
      style: 'bold',
      positionY: 82,
    }
  ]);

  // Editor states
  const [timelineDuration, setTimelineDuration] = useState<number>(30);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timelineZoom, setTimelineZoom] = useState<number>(15); // px per second
  const [selectedClip, setSelectedClip] = useState<{ id: string; type: 'video' | 'audio' | 'subtitle' } | null>(null);
  
  // Preset filters
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // File preview
  const [previewingAsset, setPreviewingAsset] = useState<MediaAsset | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportError, setExportError] = useState<string>('');

  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const playheadRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Drag states for timeline clips
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragInfo = useRef<{
    clipId: string;
    clipType: 'video' | 'audio' | 'subtitle';
    action: 'move' | 'trim-left' | 'trim-right';
    startPageX: number;
    initialTimelineStart: number;
    initialDuration: number;
    initialTrimStart: number;
  } | null>(null);

  // Sync playheadRef with state
  useEffect(() => {
    playheadRef.current = currentTime;
    // Update HTML audio/video elements current time based on playhead position
    syncElementsTime();
  }, [currentTime]);

  const syncElementsTime = () => {
    const time = playheadRef.current;
    
    // Sync actual uploaded HTML videos
    videoClips.forEach(clip => {
      if (clip.fileElement && clip.fileElement instanceof HTMLVideoElement) {
        const relativeTime = time - clip.timelineStart;
        if (relativeTime >= 0 && relativeTime < clip.duration) {
          const videoTime = relativeTime + clip.trimStart;
          if (Math.abs(clip.fileElement.currentTime - videoTime) > 0.15) {
            clip.fileElement.currentTime = videoTime;
          }
          if (isPlaying && clip.fileElement.paused) {
            clip.fileElement.play().catch(() => {});
          } else if (!isPlaying && !clip.fileElement.paused) {
            clip.fileElement.pause();
          }
        } else {
          if (!clip.fileElement.paused) {
            clip.fileElement.pause();
          }
        }
      }
    });

    // Sync audio clips
    audioClips.forEach(clip => {
      if (clip.fileElement) {
        const relativeTime = time - clip.timelineStart;
        if (relativeTime >= 0 && relativeTime < clip.duration) {
          const audioTime = relativeTime + clip.trimStart;
          if (Math.abs(clip.fileElement.currentTime - audioTime) > 0.15) {
            clip.fileElement.currentTime = audioTime;
          }
          clip.fileElement.volume = clip.volume * masterVolume;
          if (isPlaying && clip.fileElement.paused) {
            clip.fileElement.play().catch(() => {});
          } else if (!isPlaying && !clip.fileElement.paused) {
            clip.fileElement.pause();
          }
        } else {
          if (!clip.fileElement.paused) {
            clip.fileElement.pause();
          }
        }
      }
    });
  };

  // Keep rendering loop running if playing
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now() - (playheadRef.current * 1000);
      const loop = () => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        let newTime = elapsed;
        
        if (newTime >= timelineDuration) {
          if (isLooping) {
            newTime = 0;
            startTimeRef.current = performance.now();
          } else {
            newTime = timelineDuration;
            setIsPlaying(false);
          }
        }
        
        setCurrentTime(newTime);
        renderTimelineFrame(newTime);
        
        if (isPlaying) {
          animationFrameId.current = requestAnimationFrame(loop);
        }
      };
      animationFrameId.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      renderTimelineFrame(playheadRef.current);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, isLooping, timelineDuration, videoClips, audioClips, subtitles, masterVolume]);

  // Initial draw
  useEffect(() => {
    renderTimelineFrame(0);
  }, []);

  // Set up AudioContext lazy loader
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // --- PROCEDURAL GENERATORS (Saves offline use!) ---
  const drawProceduralAsset = (
    ctx: CanvasRenderingContext2D,
    type: string,
    time: number,
    width: number,
    height: number
  ) => {
    if (type === 'sunset') {
      // 1. Sky Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0d0221'); // Deep navy
      grad.addColorStop(0.4, '#240046'); // Dark purple
      grad.addColorStop(0.7, '#7209b7'); // Magenta
      grad.addColorStop(1.0, '#f72585'); // Bright pink
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Neon Sun
      const sunY = height * 0.6;
      const sunR = Math.min(width, height) * 0.25;
      const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      sunGrad.addColorStop(0, '#ffbe0b');
      sunGrad.addColorStop(1, '#ff007f');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width / 2, sunY, sunR, Math.PI, 0); // Upper half circle
      ctx.fill();

      // Sun reflection slices
      ctx.fillStyle = '#0d0221';
      for (let i = 0; i < 15; i++) {
        const sliceY = sunY + (i * 4);
        if (sliceY < sunY + sunR) {
          ctx.fillRect(width / 2 - sunR, sliceY, sunR * 2, 2);
        }
      }

      // 3. Cyber Grid Lines (perspective grid)
      ctx.strokeStyle = '#3a86c8';
      ctx.lineWidth = 1.5;
      const gridStartY = height * 0.6;
      const gridHeight = height - gridStartY;

      // Vertical perspective lines radiating from horizon center
      const horizonX = width / 2;
      const lineCount = 18;
      for (let i = 0; i <= lineCount; i++) {
        const ratio = i / lineCount;
        const bottomX = width * (ratio * 2 - 0.5);
        ctx.beginPath();
        ctx.moveTo(horizonX, gridStartY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal lines scrolling downwards
      const scrollSpeed = 60; // px per second
      const baseDistance = (time * scrollSpeed) % 40;
      for (let i = 0; i < 15; i++) {
        const offset = i * i * 1.5 + baseDistance;
        const lineY = gridStartY + offset;
        if (lineY < height) {
          ctx.strokeStyle = `rgba(58, 134, 198, ${Math.min(1, (lineY - gridStartY) / gridHeight)})`;
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(width, lineY);
          ctx.stroke();
        }
      }

      // Synthwave mountain outline
      ctx.fillStyle = '#10002b';
      ctx.beginPath();
      ctx.moveTo(0, gridStartY);
      ctx.lineTo(width * 0.2, gridStartY - 35);
      ctx.lineTo(width * 0.35, gridStartY);
      ctx.lineTo(width * 0.6, gridStartY - 50);
      ctx.lineTo(width * 0.75, gridStartY - 15);
      ctx.lineTo(width, gridStartY);
      ctx.closePath();
      ctx.fill();

      // Glowing mountain edge
      ctx.strokeStyle = '#f72585';
      ctx.lineWidth = 2;
      ctx.stroke();

    } else if (type === 'matrix') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      ctx.font = 'bold 13px monospace';
      const cols = Math.floor(width / 16);
      for (let col = 0; col < cols; col++) {
        const speed = 1.5 + (col % 5) * 0.5;
        const dropY = (time * speed * 80 + (col * 31)) % (height + 100) - 50;
        
        const len = 8 + (col % 6);
        for (let row = 0; row < len; row++) {
          const charY = dropY - (row * 16);
          if (charY > 0 && charY < height) {
            const alpha = 1 - (row / len);
            ctx.fillStyle = row === 0 ? '#ffffff' : `rgba(0, 255, 70, ${alpha})`;
            // Procedural pseudo-random character
            const char = String.fromCharCode(33 + Math.floor((time * 2 + col + row) % 93));
            ctx.fillText(char, col * 16 + 2, charY);
          }
        }
      }

      // HUD elements overlay
      ctx.strokeStyle = 'rgba(0, 255, 70, 0.2)';
      ctx.strokeRect(20, 20, width - 40, height - 40);
      ctx.fillStyle = 'rgba(0, 255, 70, 0.4)';
      ctx.fillText(`SYS_PLAYBACK: ACTIVE`, 35, 40);
      ctx.fillText(`FREQ: ${Math.sin(time) * 12 + 120} Hz`, 35, 55);

    } else if (type === 'waves') {
      // Plasma waves
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#000814');
      grad.addColorStop(1, '#001d3d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const waveCount = 4;
      for (let w = 0; w < waveCount; w++) {
        const offset = w * 40;
        const freq = 0.005 + w * 0.002;
        const amp = 30 + w * 12;
        const speed = 2 + w * 0.8;

        ctx.fillStyle = w % 2 === 0 ? 'rgba(91, 93, 248, 0.12)' : 'rgba(167, 139, 250, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        for (let x = 0; x <= width; x += 10) {
          const y = height * 0.5 + Math.sin(x * freq + time * speed + offset) * amp + Math.cos(x * 0.01 - time) * 10;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }

      // Add floating energy particles
      ctx.fillStyle = '#00f5d4';
      for (let i = 0; i < 20; i++) {
        const px = (i * 53 + time * 12) % width;
        const py = (i * 97 + Math.sin(time + i) * 30) % height;
        const r = 2 + (i % 3);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (type === 'orb-green') {
      // Pure Green Screen background (Chroma Green #00ff00)
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, width, height);

      // Shadow
      const cx = width / 2 + Math.sin(time * 2.2) * (width * 0.35);
      const cy = height / 2 + Math.cos(time * 1.5) * (height * 0.25);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 30, 40 + Math.sin(time * 4) * 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floating Magenta / Hot Pink Neon Orb
      const orbGrad = ctx.createRadialGradient(cx - 10, cy - 10, 2, cx, cy, 32);
      orbGrad.addColorStop(0, '#f472b6'); // Highlight pink
      orbGrad.addColorStop(0.7, '#db2777'); // Magenta
      orbGrad.addColorStop(1, '#831843'); // Shadow burgundy
      
      ctx.fillStyle = orbGrad;
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset shadows
      ctx.shadowBlur = 0;

      // Draw shiny gloss arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 8, 16, Math.PI * 1.1, Math.PI * 1.6);
      ctx.stroke();

    } else if (type === 'stickman-green') {
      // Pure Chroma Green background
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, width, height);

      // Running Stickman animation
      const runnerX = (time * 100) % (width + 100) - 50;
      const runnerY = height * 0.65;
      
      const cycle = time * 8; // Speed of walking
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Head
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(runnerX, runnerY - 60, 10, 0, Math.PI * 2);
      ctx.fill();

      // Spine
      ctx.beginPath();
      ctx.moveTo(runnerX, runnerY - 50);
      ctx.lineTo(runnerX, runnerY - 20);
      ctx.stroke();

      // Left Leg
      ctx.beginPath();
      ctx.moveTo(runnerX, runnerY - 20);
      const leftKneeX = runnerX + Math.sin(cycle) * 15;
      const leftKneeY = runnerY - 5 + Math.cos(cycle) * 5;
      const leftFootX = runnerX + Math.sin(cycle) * 20 + Math.cos(cycle) * 10;
      ctx.lineTo(leftKneeX, leftKneeY);
      ctx.lineTo(leftFootX, runnerY + 10);
      ctx.stroke();

      // Right Leg
      ctx.beginPath();
      ctx.moveTo(runnerX, runnerY - 20);
      const rightKneeX = runnerX - Math.sin(cycle) * 15;
      const rightKneeY = runnerY - 5 - Math.cos(cycle) * 5;
      const rightFootX = runnerX - Math.sin(cycle) * 20 - Math.cos(cycle) * 10;
      ctx.lineTo(rightKneeX, rightKneeY);
      ctx.lineTo(rightFootX, runnerY + 10);
      ctx.stroke();

      // Left Arm
      ctx.beginPath();
      ctx.moveTo(runnerX, runnerY - 45);
      const leftElbowX = runnerX - Math.sin(cycle) * 15;
      const leftElbowY = runnerY - 35;
      const leftHandX = runnerX - Math.sin(cycle) * 20 + 5;
      ctx.lineTo(leftElbowX, leftElbowY);
      ctx.lineTo(leftHandX, runnerY - 25);
      ctx.stroke();

      // Right Arm
      ctx.beginPath();
      ctx.moveTo(runnerX, runnerY - 45);
      const rightElbowX = runnerX + Math.sin(cycle) * 15;
      const rightElbowY = runnerY - 35;
      const rightHandX = runnerX + Math.sin(cycle) * 20 + 5;
      ctx.lineTo(rightElbowX, rightElbowY);
      ctx.lineTo(rightHandX, runnerY - 25);
      ctx.stroke();

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(runnerX, runnerY + 14, 25, 4, 0, 0, Math.PI*2);
      ctx.fill();
    }
  };

  // --- CORE CANVAS RENDERING PIPELINE ---
  const renderTimelineFrame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0a0c'; // Cinema backing
    ctx.fillRect(0, 0, width, height);

    // Get active video/procedural clips at this time
    // Filter and sort clips: we want to draw background underlays first, then greenscreen clips on top
    const activeClips = videoClips
      .filter(clip => time >= clip.timelineStart && time < clip.timelineStart + clip.duration)
      .sort((a, b) => {
        // Place chroma-keyed clips on top of non-chroma clips
        if (a.chromaKey && !b.chromaKey) return 1;
        if (!a.chromaKey && b.chromaKey) return -1;
        return a.timelineStart - b.timelineStart; // standard overlay
      });

    // Ensure offscreen canvas exists for chroma keying
    let offscreenCanvas = offscreenCanvasRef.current;
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvasRef.current = offscreenCanvas;
    }
    if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
    }
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // Draw active video clips
    activeClips.forEach(clip => {
      const relativeTime = time - clip.timelineStart;
      const sourceTime = relativeTime + clip.trimStart;

      if (clip.chromaKey && offscreenCtx) {
        // --- CHROMA KEY WORKFLOW ---
        // 1. Draw clip onto offscreen canvas
        offscreenCtx.fillStyle = '#000000';
        offscreenCtx.fillRect(0, 0, width, height);

        if (clip.type === 'procedural' && clip.proceduralType) {
          drawProceduralAsset(offscreenCtx, clip.proceduralType, sourceTime, width, height);
        } else if (clip.fileElement) {
          // If uploaded video or image
          try {
            offscreenCtx.drawImage(clip.fileElement, 0, 0, width, height);
          } catch (e) {
            // Draw placeholder on error
            offscreenCtx.fillStyle = '#1e293b';
            offscreenCtx.fillRect(0, 0, width, height);
          }
        }

        // 2. Scan and edit RGBA buffer (Chroma Synthesis)
        const imgData = offscreenCtx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const len = data.length;

        const targetColor = clip.chromaKeyColor || { r: 0, g: 255, b: 0 };
        const threshold = clip.chromaKeySimilarity; // scale 0-100

        for (let i = 0; i < len; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Compute distance to green screen target color
          // We can use a fast color distance formula
          const dr = r - targetColor.r;
          const dg = g - targetColor.g;
          const db = b - targetColor.b;
          
          // Euclidean distance in RGB space
          const dist = Math.sqrt(dr*dr + dg*dg + db*db);
          
          // If distance is within similarity threshold, discard pixel (fully transparent alpha)
          if (dist < (threshold * 3.5)) {
            data[i + 3] = 0;
          }
        }

        // Put transparent pixels back to offscreen canvas
        offscreenCtx.putImageData(imgData, 0, 0);

        // Apply visual CSS filters onto rendering context
        ctx.save();
        applyFilterStyle(ctx, clip.filter);
        // Draw keyed offscreen frame on main composite canvas
        ctx.drawImage(offscreenCanvas, 0, 0, width, height);
        ctx.restore();

      } else {
        // --- NORMAL BLENDING WORKFLOW ---
        ctx.save();
        applyFilterStyle(ctx, clip.filter);
        
        if (clip.type === 'procedural' && clip.proceduralType) {
          drawProceduralAsset(ctx, clip.proceduralType, sourceTime, width, height);
        } else if (clip.fileElement) {
          try {
            ctx.drawImage(clip.fileElement, 0, 0, width, height);
          } catch (e) {
            ctx.fillStyle = '#27272a';
            ctx.fillRect(0, 0, width, height);
          }
        }
        
        ctx.restore();
      }
    });

    // If no active video tracks, show dark preview backing text
    if (activeClips.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NO ACTIVE CLIPS', width / 2, height / 2);
    }

    // --- DRAW SUBTITLES OVERLAY ---
    subtitles
      .filter(sub => time >= sub.timelineStart && time < sub.timelineStart + sub.duration)
      .forEach(sub => {
        ctx.save();
        
        // Font customization
        const fontStyle = sub.style === 'bold' ? 'bold ' : sub.style === 'italic' ? 'italic ' : '';
        ctx.font = `${fontStyle}${sub.fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw background drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw bounding text fill
        ctx.fillStyle = sub.color || '#ffffff';
        const targetY = (sub.positionY / 100) * height;
        ctx.fillText(sub.text, width / 2, targetY);

        ctx.restore();
      });

    // Live Watermark in editor
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('nooncut STUDIO', 15, 24);
  };

  const applyFilterStyle = (
    ctx: CanvasRenderingContext2D,
    filterName: string
  ) => {
    switch (filterName) {
      case 'sepia':
        ctx.filter = 'sepia(100%)';
        break;
      case 'grayscale':
        ctx.filter = 'grayscale(100%)';
        break;
      case 'contrast':
        ctx.filter = 'contrast(160%)';
        break;
      case 'invert':
        ctx.filter = 'invert(100%)';
        break;
      case 'blur':
        ctx.filter = 'blur(4px)';
        break;
      default:
        ctx.filter = 'none';
    }
  };

  // --- TIME UTILITIES ---
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  // --- ACTION HANDLERS ---
  
  // SPLICING & SPLITTING LOGIC (User request: Split Clip)
  const handleSplitClip = () => {
    if (!selectedClip) return;
    const playhead = playheadRef.current;

    if (selectedClip.type === 'video') {
      const activeClip = videoClips.find(c => c.id === selectedClip.id);
      if (!activeClip) return;

      // Ensure playhead splits inside clip boundaries
      if (playhead > activeClip.timelineStart && playhead < activeClip.timelineStart + activeClip.duration) {
        const firstPartDuration = playhead - activeClip.timelineStart;
        const secondPartDuration = activeClip.timelineStart + activeClip.duration - playhead;

        const clip1: VideoClip = {
          ...activeClip,
          id: `v-clip-split-${Date.now()}-1`,
          duration: firstPartDuration,
        };

        const clip2: VideoClip = {
          ...activeClip,
          id: `v-clip-split-${Date.now()}-2`,
          timelineStart: playhead,
          duration: secondPartDuration,
          trimStart: activeClip.trimStart + firstPartDuration,
        };

        setVideoClips(prev => {
          const removed = prev.filter(c => c.id !== activeClip.id);
          return [...removed, clip1, clip2];
        });

        setSelectedClip({ id: clip2.id, type: 'video' });
      }
    } else if (selectedClip.type === 'audio') {
      const activeClip = audioClips.find(c => c.id === selectedClip.id);
      if (!activeClip) return;

      if (playhead > activeClip.timelineStart && playhead < activeClip.timelineStart + activeClip.duration) {
        const firstPartDuration = playhead - activeClip.timelineStart;
        const secondPartDuration = activeClip.timelineStart + activeClip.duration - playhead;

        const clip1: AudioClip = {
          ...activeClip,
          id: `a-clip-split-${Date.now()}-1`,
          duration: firstPartDuration,
        };

        const clip2: AudioClip = {
          ...activeClip,
          id: `a-clip-split-${Date.now()}-2`,
          timelineStart: playhead,
          duration: secondPartDuration,
          trimStart: activeClip.trimStart + firstPartDuration,
        };

        setAudioClips(prev => {
          const removed = prev.filter(c => c.id !== activeClip.id);
          return [...removed, clip1, clip2];
        });

        setSelectedClip({ id: clip2.id, type: 'audio' });
      }
    } else if (selectedClip.type === 'subtitle') {
      const activeClip = subtitles.find(c => c.id === selectedClip.id);
      if (!activeClip) return;

      if (playhead > activeClip.timelineStart && playhead < activeClip.timelineStart + activeClip.duration) {
        const firstPartDuration = playhead - activeClip.timelineStart;
        const secondPartDuration = activeClip.timelineStart + activeClip.duration - playhead;

        const clip1: SubtitleClip = {
          ...activeClip,
          id: `sub-clip-split-${Date.now()}-1`,
          duration: firstPartDuration,
        };

        const clip2: SubtitleClip = {
          ...activeClip,
          id: `sub-clip-split-${Date.now()}-2`,
          timelineStart: playhead,
          duration: secondPartDuration,
        };

        setSubtitles(prev => {
          const removed = prev.filter(c => c.id !== activeClip.id);
          return [...removed, clip1, clip2];
        });

        setSelectedClip({ id: clip2.id, type: 'subtitle' });
      }
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedClip) return;
    if (selectedClip.type === 'video') {
      setVideoClips(prev => prev.filter(c => c.id !== selectedClip.id));
    } else if (selectedClip.type === 'audio') {
      setAudioClips(prev => prev.filter(c => c.id !== selectedClip.id));
    } else if (selectedClip.type === 'subtitle') {
      setSubtitles(prev => prev.filter(c => c.id !== selectedClip.id));
    }
    setSelectedClip(null);
  };

  // --- LOCAL FILE UPLOAD HANDLING ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach(file => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');

      if (isVideo) {
        // Create an offscreen video element to query duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.onloadedmetadata = () => {
          const newAsset: MediaAsset = {
            id: `asset-user-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            name: `🎬 ${file.name}`,
            type: 'video',
            url: url,
            duration: video.duration || 10,
          };
          setAssets(prev => [...prev, newAsset]);
        };
      } else if (isAudio) {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = url;
        audio.onloadedmetadata = () => {
          const newAsset: MediaAsset = {
            id: `asset-user-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            name: `🎵 ${file.name}`,
            type: 'audio',
            url: url,
            duration: audio.duration || 10,
          };
          setAssets(prev => [...prev, newAsset]);
        };
      } else if (isImage) {
        const newAsset: MediaAsset = {
          id: `asset-user-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: `🖼️ ${file.name}`,
          type: 'image',
          url: url,
          duration: 5, // Default image clip duration
        };
        setAssets(prev => [...prev, newAsset]);
      }
    });
  };

  // --- PROJECT BIN INTERACTIONS ---
  const addAssetToTimeline = (asset: MediaAsset) => {
    const start = playheadRef.current;
    
    if (asset.type === 'video' || asset.type === 'procedural' || asset.type === 'image') {
      let fileElem: HTMLVideoElement | HTMLImageElement | null = null;
      if (asset.type === 'video') {
        const v = document.createElement('video');
        v.src = asset.url;
        v.preload = 'auto';
        v.playsInline = true;
        v.muted = true;
        v.loop = true;
        fileElem = v;
      } else if (asset.type === 'image') {
        const img = document.createElement('img');
        img.src = asset.url;
        fileElem = img;
      }

      const newClip: VideoClip = {
        id: `v-clip-${Date.now()}`,
        assetId: asset.id,
        name: asset.name,
        type: asset.type === 'image' ? 'image' : (asset.type === 'procedural' ? 'procedural' : 'video'),
        timelineStart: start,
        duration: Math.min(asset.duration, 10), // Limit initial span
        trimStart: 0,
        volume: 1,
        filter: 'none',
        chromaKey: asset.proceduralType === 'orb-green' || asset.proceduralType === 'stickman-green',
        chromaKeyColor: { r: 0, g: 255, b: 0 },
        chromaKeySimilarity: 45,
        proceduralType: asset.proceduralType,
        fileElement: fileElem,
      };

      setVideoClips(prev => [...prev, newClip]);
      setSelectedClip({ id: newClip.id, type: 'video' });
      
      // Auto-increase total timeline duration if clips exceed it
      if (start + newClip.duration > timelineDuration) {
        setTimelineDuration(Math.ceil(start + newClip.duration + 5));
      }
    } else if (asset.type === 'audio') {
      const a = document.createElement('audio');
      a.src = asset.url;
      a.preload = 'auto';
      
      const newClip: AudioClip = {
        id: `a-clip-${Date.now()}`,
        assetId: asset.id,
        name: asset.name,
        timelineStart: start,
        duration: Math.min(asset.duration, 15),
        trimStart: 0,
        volume: 0.8,
        fileElement: a,
      };

      setAudioClips(prev => [...prev, newClip]);
      setSelectedClip({ id: newClip.id, type: 'audio' });

      if (start + newClip.duration > timelineDuration) {
        setTimelineDuration(Math.ceil(start + newClip.duration + 5));
      }
    }
  };

  const handleAddSubtitle = () => {
    const start = playheadRef.current;
    const newSub: SubtitleClip = {
      id: `sub-${Date.now()}`,
      text: 'New Styled Subtitle Text',
      timelineStart: start,
      duration: 3,
      fontSize: 22,
      color: '#ffffff',
      style: 'normal',
      positionY: 80,
    };
    setSubtitles(prev => [...prev, newSub]);
    setSelectedClip({ id: newSub.id, type: 'subtitle' });
  };

  // --- TIMELINE INTERACTION / GESTURES ---
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const computedTime = Math.max(0, Math.min(timelineDuration, clickX / timelineZoom));
    setCurrentTime(computedTime);
  };

  // Handle Dragging / Resizing timeline clips
  const startTimelineDrag = (
    e: React.MouseEvent,
    clipId: string,
    clipType: 'video' | 'audio' | 'subtitle',
    action: 'move' | 'trim-left' | 'trim-right'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    let clip: any;
    if (clipType === 'video') clip = videoClips.find(c => c.id === clipId);
    else if (clipType === 'audio') clip = audioClips.find(c => c.id === clipId);
    else if (clipType === 'subtitle') clip = subtitles.find(c => c.id === clipId);

    if (!clip) return;

    setSelectedClip({ id: clipId, type: clipType });
    setIsDragging(true);

    dragInfo.current = {
      clipId,
      clipType,
      action,
      startPageX: e.pageX,
      initialTimelineStart: clip.timelineStart,
      initialDuration: clip.duration,
      initialTrimStart: clip.trimStart || 0,
    };

    window.addEventListener('mousemove', handleTimelineDragMove);
    window.addEventListener('mouseup', handleTimelineDragEnd);
  };

  const handleTimelineDragMove = (e: MouseEvent) => {
    if (!dragInfo.current) return;
    const info = dragInfo.current;
    const deltaX = e.pageX - info.startPageX;
    const deltaTime = deltaX / timelineZoom;

    if (info.action === 'move') {
      let nextStart = Math.max(0, info.initialTimelineStart + deltaTime);
      nextStart = Math.round(nextStart * 10) / 10; // snap 0.1s

      if (info.clipType === 'video') {
        setVideoClips(prev => prev.map(c => c.id === info.clipId ? { ...c, timelineStart: nextStart } : c));
      } else if (info.clipType === 'audio') {
        setAudioClips(prev => prev.map(c => c.id === info.clipId ? { ...c, timelineStart: nextStart } : c));
      } else if (info.clipType === 'subtitle') {
        setSubtitles(prev => prev.map(c => c.id === info.clipId ? { ...c, timelineStart: nextStart } : c));
      }
    } else if (info.action === 'trim-left') {
      let deltaStart = deltaTime;
      // Cap left trim to protect clip limits
      if (deltaStart < -info.initialTimelineStart) deltaStart = -info.initialTimelineStart;
      if (deltaStart > info.initialDuration - 0.5) deltaStart = info.initialDuration - 0.5;

      const nextStart = info.initialTimelineStart + deltaStart;
      const nextDuration = info.initialDuration - deltaStart;
      const nextTrimStart = info.initialTrimStart + deltaStart;

      if (info.clipType === 'video') {
        setVideoClips(prev => prev.map(c => c.id === info.clipId ? {
          ...c,
          timelineStart: nextStart,
          duration: nextDuration,
          trimStart: Math.max(0, nextTrimStart)
        } : c));
      } else if (info.clipType === 'audio') {
        setAudioClips(prev => prev.map(c => c.id === info.clipId ? {
          ...c,
          timelineStart: nextStart,
          duration: nextDuration,
          trimStart: Math.max(0, nextTrimStart)
        } : c));
      } else if (info.clipType === 'subtitle') {
        setSubtitles(prev => prev.map(c => c.id === info.clipId ? {
          ...c,
          timelineStart: nextStart,
          duration: nextDuration
        } : c));
      }
    } else if (info.action === 'trim-right') {
      let nextDuration = Math.max(0.5, info.initialDuration + deltaTime);
      nextDuration = Math.round(nextDuration * 10) / 10;

      if (info.clipType === 'video') {
        setVideoClips(prev => prev.map(c => c.id === info.clipId ? { ...c, duration: nextDuration } : c));
      } else if (info.clipType === 'audio') {
        setAudioClips(prev => prev.map(c => c.id === info.clipId ? { ...c, duration: nextDuration } : c));
      } else if (info.clipType === 'subtitle') {
        setSubtitles(prev => prev.map(c => c.id === info.clipId ? { ...c, duration: nextDuration } : c));
      }
    }
  };

  const handleTimelineDragEnd = () => {
    setIsDragging(false);
    dragInfo.current = null;
    window.removeEventListener('mousemove', handleTimelineDragMove);
    window.removeEventListener('mouseup', handleTimelineDragEnd);
  };

  // --- HIGH PERFORMANCE WEB EXPORTER ---
  const handleExportTimeline = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportError('');

    // Pause player while compiling
    setIsPlaying(false);

    try {
      const chunks: BlobPart[] = [];
      
      // Determine stream capture capabilities
      let stream: MediaStream;
      try {
        stream = canvas.captureStream(30); // Capture canvas at 30 fps
      } catch (e) {
        throw new Error('Canvas captureStream is not supported or failed on this device.');
      }

      // Mix Audio elements into dynamic media recorder stream
      const audioCtx = getAudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      
      // Keep track of audio element connections
      const sourceNodes: any[] = [];
      audioClips.forEach(clip => {
        if (clip.fileElement) {
          try {
            const node = audioCtx.createMediaElementSource(clip.fileElement);
            node.connect(dest);
            node.connect(audioCtx.destination);
            sourceNodes.push(node);
          } catch (err) {
            // Already connected or failed
          }
        }
      });

      // Combine visual & sound streams if audio track is active
      const combinedTracks = [...stream.getVideoTracks()];
      if (audioClips.length > 0) {
        combinedTracks.push(...dest.stream.getAudioTracks());
      }
      
      const compositeStream = new MediaStream(combinedTracks);

      // Determine correct mime type for iPad and PC
      let options = { mimeType: 'video/mp4;codecs=h264' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm' };
        }
      }

      const recorder = new MediaRecorder(compositeStream, options);
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fileExt = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        
        // Trigger client-side direct download
        const a = document.createElement('a');
        a.href = url;
        a.download = `nooncut_composite_${Date.now()}.${fileExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setIsExporting(false);
      };

      // 1. Reset timeline to 0
      let exportPlayhead = 0;
      const exportStep = 1 / 30; // 30 FPS sequential capture steps
      
      // Start recording
      recorder.start();

      // Sequential tick renderer loop
      const runExportTick = () => {
        if (exportPlayhead >= timelineDuration) {
          recorder.stop();
          return;
        }

        // Advance export ticker
        exportPlayhead += exportStep;
        setExportProgress(Math.min(100, Math.round((exportPlayhead / timelineDuration) * 100)));
        
        // Synchronously draw composite frame for canvas
        renderTimelineFrame(exportPlayhead);
        
        // Schedule next capture frame
        setTimeout(runExportTick, 33); // 33ms spacing simulates 30 FPS compilation
      };

      runExportTick();

    } catch (e: any) {
      setIsExporting(false);
      setExportError(e.message || 'MediaRecorder failed to initialize on your browser.');
    }
  };

  // Fetching the currently selected item definition
  const getSelectedClipDetails = () => {
    if (!selectedClip) return null;
    if (selectedClip.type === 'video') return videoClips.find(c => c.id === selectedClip.id);
    if (selectedClip.type === 'audio') return audioClips.find(c => c.id === selectedClip.id);
    if (selectedClip.type === 'subtitle') return subtitles.find(c => c.id === selectedClip.id);
    return null;
  };

  const selectedClipData = getSelectedClipDetails();

  if (!isUnlocked) {
    return (
      <div id="videoeditor-lock-screen" className="flex flex-col items-center justify-center h-full w-full bg-zinc-950 text-zinc-100 p-6 font-sans select-none">
        <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur-md" />

          {/* Icon Shield lock */}
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mb-6 shadow-inner">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-2 text-center">
            noon os Security
          </h2>
          <p className="text-xs text-zinc-400 text-center mb-6">
            Admin Authentication Required
          </p>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (passcodeInput === 'mozunbu1203') {
                setIsUnlocked(true);
                setPasscodeError('');
              } else {
                setPasscodeError('Invalid passcode. Access Denied.');
                setPasscodeInput('');
              }
            }}
            className="w-full flex flex-col gap-4"
          >
            <div className="relative">
              <input
                type="password"
                placeholder="Enter Admin Passcode"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-white text-sm tracking-widest placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            {passcodeError && (
              <p className="text-red-400 text-[11px] text-center font-medium bg-red-950/40 border border-red-900/30 py-1.5 px-3 rounded-lg">
                {passcodeError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Verify & Unlock Studio
            </button>
          </form>

          <p className="text-[10px] text-zinc-600 mt-8 font-mono">
            SECURE PORT PORTAL // AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="nooncut-app-root" className="flex flex-col h-full bg-zinc-950 text-zinc-200 select-none font-sans overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              nooncut <span className="text-[10px] bg-zinc-800 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-medium">STUDIO v1.2</span>
            </h1>
            <p className="text-[10px] text-zinc-500">DaVinci Canvas Engine & Premiere Dark Skin</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            id="btn-split-clip"
            disabled={!selectedClip}
            onClick={handleSplitClip}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              selectedClip 
                ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200 cursor-pointer' 
                : 'border-zinc-800/50 text-zinc-600 cursor-not-allowed'
            }`}
            title="Split selected clip at current playhead position"
          >
            <Scissors className="w-3.5 h-3.5" />
            Split Clip
          </button>

          <button 
            id="btn-add-subtitle"
            onClick={handleAddSubtitle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-xs font-medium text-zinc-200 transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            Add Subtitle
          </button>

          <button 
            id="btn-export-timeline"
            onClick={handleExportTimeline}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-md text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Media
          </button>
        </div>
      </div>

      {/* MAIN SECTION: LEFT BIN + MONITOR + INSPECTOR */}
      <div className="flex flex-1 min-h-0">
        
        {/* LEFT PANEL: Media Pool & Procedural Clips */}
        <div className="w-64 flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0">
          <div className="p-3 border-b border-zinc-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FileVideo className="w-3.5 h-3.5 text-indigo-400" />
              Project Assets & templates
            </h2>
          </div>

          {/* Quick upload */}
          <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/50">
            <label className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-zinc-800 hover:border-indigo-500 hover:bg-zinc-800/30 transition-all cursor-pointer text-center">
              <Plus className="w-5 h-5 text-zinc-400 mb-1" />
              <span className="text-[10px] font-semibold text-zinc-300">Import Local Media</span>
              <span className="text-[9px] text-zinc-500 mt-0.5">MP4, MP3, PNG, JPG</span>
              <input 
                type="file" 
                multiple 
                accept="video/*,audio/*,image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Assets list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 select-none">
            {assets.map((asset) => (
              <div 
                key={asset.id} 
                className="group relative p-2 bg-zinc-950/70 hover:bg-zinc-800 border border-zinc-800 rounded-md flex flex-col gap-1 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate text-zinc-100 max-w-[170px]">{asset.name}</span>
                  <span className="text-[9px] font-mono text-zinc-500 shrink-0">{asset.duration}s</span>
                </div>
                
                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-zinc-800/50">
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                    {asset.type}
                  </span>
                  <button
                    onClick={() => addAssetToTimeline(asset)}
                    className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded opacity-80 hover:opacity-100 transition-all cursor-pointer"
                    title="Add asset to timeline playhead"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PLAYER PANEL */}
        <div className="flex-1 flex flex-col bg-zinc-950 p-4 min-w-0 items-center justify-center border-r border-zinc-800">
          <div className="w-full max-w-2xl flex flex-col gap-3">
            
            {/* Monitor Header */}
            <div className="flex items-center justify-between px-2 text-xs text-zinc-400">
              <span className="font-mono text-indigo-400 font-bold flex items-center gap-1">
                ● PROGRAM MONITOR (16:9)
              </span>
              <span className="font-mono bg-zinc-900/90 border border-zinc-800 px-2 py-0.5 rounded text-white font-medium">
                {formatTimecode(currentTime)} / {formatTimecode(timelineDuration)}
              </span>
            </div>

            {/* Renderer viewport canvas */}
            <div className="relative w-full aspect-video bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center">
              <canvas 
                ref={canvasRef} 
                width={640} 
                height={360} 
                className="w-full h-full object-contain"
              />
              
              {/* Export overlay overlay */}
              {isExporting && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-sm z-50">
                  <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                    {/* Glowing radial circular frame */}
                    <div className="absolute inset-0 border-4 border-indigo-600/30 rounded-full animate-pulse" />
                    <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-lg font-mono font-bold text-indigo-400">{exportProgress}%</span>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-1">Exporting Video Composite...</h3>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">Encoding Canvas frame states into direct {MediaRecorder.isTypeSupported('video/mp4;codecs=h264') ? '.mp4' : '.webm'} video file at 1x speed.</p>
                </div>
              )}
            </div>

            {/* Media playback controller */}
            <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentTime(0)}
                  className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Rewind to Start"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
                <button 
                  onClick={() => setCurrentTime(prev => Math.max(0, prev - (1/30)))}
                  className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white font-mono text-xs font-bold"
                  title="Prev Frame"
                >
                  -1F
                </button>
                
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button 
                  onClick={() => setCurrentTime(prev => Math.min(timelineDuration, prev + (1/30)))}
                  className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white font-mono text-xs font-bold"
                  title="Next Frame"
                >
                  +1F
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs">
                {/* Loop trigger */}
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`px-2 py-1 rounded transition-colors font-mono font-bold ${
                    isLooping ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  LOOP
                </button>

                {/* Master Audio Monitor slider */}
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <input 
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-18 accent-indigo-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-mono text-[10px] w-8 text-zinc-400">{Math.round(masterVolume*100)}%</span>
                </div>
              </div>
            </div>

            {exportError && (
              <div className="p-3 rounded bg-red-950/40 border border-red-900/60 text-red-400 text-xs text-center font-medium">
                ⚠️ {exportError}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT PANEL: SELECTED ITEM INSPECTOR */}
        <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 select-none overflow-y-auto">
          <div className="p-3 border-b border-zinc-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Clip Inspector
            </h2>
          </div>

          {selectedClipData ? (
            <div className="p-4 space-y-5 text-xs">
              
              {/* Meta */}
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Clip Name</label>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded font-semibold text-zinc-200 truncate">
                  {selectedClipData.name || (selectedClipData as any).text || 'Custom Layer'}
                </div>
              </div>

              {/* Timing Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Timeline Start</label>
                  <input 
                    type="number"
                    step={0.1}
                    min={0}
                    max={timelineDuration}
                    value={selectedClipData.timelineStart}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      if (selectedClip.type === 'video') {
                        setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, timelineStart: val } : c));
                      } else if (selectedClip.type === 'audio') {
                        setAudioClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, timelineStart: val } : c));
                      } else if (selectedClip.type === 'subtitle') {
                        setSubtitles(prev => prev.map(c => c.id === selectedClip.id ? { ...c, timelineStart: val } : c));
                      }
                    }}
                    className="w-full p-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Span Duration</label>
                  <input 
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={selectedClipData.duration}
                    onChange={(e) => {
                      const val = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                      if (selectedClip.type === 'video') {
                        setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, duration: val } : c));
                      } else if (selectedClip.type === 'audio') {
                        setAudioClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, duration: val } : c));
                      } else if (selectedClip.type === 'subtitle') {
                        setSubtitles(prev => prev.map(c => c.id === selectedClip.id ? { ...c, duration: val } : c));
                      }
                    }}
                    className="w-full p-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 font-mono"
                  />
                </div>
              </div>

              {/* VIDEO SPECIFIC: Filters & Green Screen keyer */}
              {selectedClip.type === 'video' && (
                <div className="space-y-4 pt-3 border-t border-zinc-800/60">
                  
                  {/* CSS Video Filters */}
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">Aesthetic Color Filters</label>
                    <select
                      value={(selectedClipData as VideoClip).filter || 'none'}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, filter: val } : c));
                      }}
                      className="w-full p-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 text-xs"
                    >
                      <option value="none">Normal / original</option>
                      <option value="sepia">🍂 Vintage Sepia</option>
                      <option value="grayscale">📷 Greyscale (Noir)</option>
                      <option value="contrast">⚡ High Contrast</option>
                      <option value="invert">🌈 Inverted Negative</option>
                      <option value="blur">🌫️ Soft Blur</option>
                    </select>
                  </div>

                  {/* Chroma Key / Synthesis Section */}
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-zinc-300 uppercase tracking-wider">Chroma Key Blending</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(selectedClipData as VideoClip).chromaKey}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, chromaKey: val } : c));
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                      </label>
                    </div>

                    {(selectedClipData as VideoClip).chromaKey && (
                      <div className="space-y-3 pt-2.5 border-t border-zinc-800/50">
                        {/* Selected target key color */}
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-1">Keying target Color</label>
                          <div className="flex gap-2">
                            {[
                              { label: 'Green', rgb: { r: 0, g: 255, b: 0 }, hex: '#00ff00' },
                              { label: 'Blue', rgb: { r: 0, g: 0, b: 255 }, hex: '#0000ff' },
                              { label: 'Red', rgb: { r: 255, g: 0, b: 0 }, hex: '#ff0000' },
                            ].map((col) => {
                              const isSelected = (selectedClipData as VideoClip).chromaKeyColor.r === col.rgb.r &&
                                (selectedClipData as VideoClip).chromaKeyColor.g === col.rgb.g &&
                                (selectedClipData as VideoClip).chromaKeyColor.b === col.rgb.b;
                              return (
                                <button
                                  key={col.label}
                                  onClick={() => {
                                    setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, chromaKeyColor: col.rgb } : c));
                                  }}
                                  className={`flex-1 py-1 rounded border text-[10px] font-bold text-center transition-all ${
                                    isSelected 
                                      ? 'border-indigo-500 bg-indigo-600/30 text-white' 
                                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400'
                                  }`}
                                >
                                  <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: col.hex }} />
                                  {col.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Similarity threshold range */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-zinc-400">Similarity Limit</span>
                            <span className="font-mono text-[10px] text-indigo-400">{(selectedClipData as VideoClip).chromaKeySimilarity}%</span>
                          </div>
                          <input 
                            type="range"
                            min={10}
                            max={90}
                            value={(selectedClipData as VideoClip).chromaKeySimilarity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setVideoClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, chromaKeySimilarity: val } : c));
                            }}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTITLE SPECIFIC: Text inputs, font size, alignment */}
              {selectedClip.type === 'subtitle' && (
                <div className="space-y-4 pt-3 border-t border-zinc-800/60">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Overlay text String</label>
                    <textarea
                      rows={3}
                      value={(selectedClipData as SubtitleClip).text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubtitles(prev => prev.map(c => c.id === selectedClip.id ? { ...c, text: val } : c));
                      }}
                      className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 text-xs font-sans resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Font size</label>
                      <input 
                        type="number"
                        min={10}
                        max={80}
                        value={(selectedClipData as SubtitleClip).fontSize}
                        onChange={(e) => {
                          const val = Math.max(10, parseInt(e.target.value) || 10);
                          setSubtitles(prev => prev.map(c => c.id === selectedClip.id ? { ...c, fontSize: val } : c));
                        }}
                        className="w-full p-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Text Color</label>
                      <div className="flex gap-1">
                        <input 
                          type="color"
                          value={(selectedClipData as SubtitleClip).color}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubtitles(prev => prev.map(c => c.id === selectedClip.id ? { ...c, color: val } : c));
                          }}
                          className="w-8 h-8 p-0 bg-transparent border-0 cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={(selectedClipData as SubtitleClip).color}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubtitles(prev => prev.map(c => c.id === selectedClip.id ? { ...c, color: val } : c));
                          }}
                          className="flex-1 w-full p-1.5 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Weight Style</label>
                    <div className="flex gap-1">
                      {[
                        { label: 'Normal', value: 'normal' },
                        { label: 'Bold', value: 'bold' },
                        { label: 'Italic', value: 'italic' }
                      ].map((st) => (
                        <button
                          key={st.value}
                          onClick={() => {
                            setSubtitles(prev => prev.map(c => c.id === selectedClip.id ? { ...c, style: st.value as any } : c));
                          }}
                          className={`flex-1 py-1 rounded border text-[10px] font-medium text-center ${
                            (selectedClipData as SubtitleClip).style === st.value
                              ? 'border-indigo-500 bg-indigo-600/20 text-white'
                              : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Vertical alignment</span>
                      <span className="font-mono text-[10px] text-indigo-400">{(selectedClipData as SubtitleClip).positionY}% from top</span>
                    </div>
                    <input 
                      type="range"
                      min={10}
                      max={90}
                      value={(selectedClipData as SubtitleClip).positionY}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSubtitles(prev => prev.map(c => c.id === selectedClip.id ? { ...c, positionY: val } : c));
                      }}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* AUDIO SPECIFIC: volume mixing */}
              {selectedClip.type === 'audio' && (
                <div className="space-y-4 pt-3 border-t border-zinc-800/60">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Clip Volume Mixer</span>
                      <span className="font-mono text-[10px] text-indigo-400">{Math.round((selectedClipData as AudioClip).volume * 100)}%</span>
                    </div>
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={(selectedClipData as AudioClip).volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setAudioClips(prev => prev.map(c => c.id === selectedClip.id ? { ...c, volume: val } : c));
                      }}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Delete Block Action */}
              <button
                onClick={handleDeleteSelected}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-950 hover:bg-red-900 border border-red-900/50 text-red-200 text-xs font-semibold rounded-md transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected Clip
              </button>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
              <Move className="w-8 h-8 text-zinc-600 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold">No selection active</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[180px]">Select any track bar clip block below to inspect and customize filters, green screen chroma, subtitles, and timing adjustments.</p>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM PANEL: TIMELINE MULTI-TRACK SYSTEM */}
      <div className="h-64 bg-zinc-900 border-t border-zinc-800 flex flex-col shrink-0 select-none overflow-hidden">
        
        {/* Timeline Utility bar / Ticks Header */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950 border-b border-zinc-800 shrink-0 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="font-bold tracking-widest text-[10px] text-zinc-500 uppercase">Multi-Track Editing Deck</span>
            
            {/* Timeline Duration */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 uppercase">Max Length</span>
              <input 
                type="number"
                min={5}
                max={300}
                value={timelineDuration}
                onChange={(e) => setTimelineDuration(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-12 text-center p-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 text-xs font-mono"
              />
              <span className="text-zinc-500 font-mono">s</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ZoomIn className="w-3.5 h-3.5 text-zinc-500" />
            <input 
              type="range"
              min={5}
              max={40}
              value={timelineZoom}
              onChange={(e) => setTimelineZoom(parseInt(e.target.value))}
              className="w-24 accent-zinc-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Scale Zoom</span>
          </div>
        </div>

        {/* Timeline Tracks Wrapper */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative min-h-0">
          
          <div className="flex w-full min-h-full">
            {/* Track Labeling sidebar */}
            <div className="w-24 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-stretch text-[10px] font-bold text-zinc-500 uppercase shrink-0">
              <div className="h-7 border-b border-zinc-800 bg-zinc-950 flex items-center px-2">RULER</div>
              <div className="h-12 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col justify-center px-2.5">
                <span className="text-zinc-300">V1 VIDEO</span>
                <span className="text-[8px] text-zinc-600 font-normal">Frames + CG</span>
              </div>
              <div className="h-12 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col justify-center px-2.5">
                <span className="text-zinc-300">A1 AUDIO</span>
                <span className="text-[8px] text-zinc-600 font-normal">Background</span>
              </div>
              <div className="h-12 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col justify-center px-2.5">
                <span className="text-indigo-400">T1 TEXT</span>
                <span className="text-[8px] text-zinc-600 font-normal">Subtitles</span>
              </div>
            </div>

            {/* Tracks Right Scrolling content area */}
            <div className="flex-1 relative overflow-x-auto overflow-y-hidden select-none bg-zinc-950/20" style={{ cursor: isDragging ? 'ew-resize' : 'default' }}>
              
              {/* Playhead scrub bar overlay line */}
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-30 transition-all duration-75"
                style={{ 
                  left: `${currentTime * timelineZoom}px`,
                }}
              >
                {/* Playhead visual cursor diamond */}
                <div className="absolute top-0 -left-1.5 w-3.5 h-3.5 bg-red-500 rotate-45 border-b border-r border-red-600 rounded-sm shadow-md" />
              </div>

              {/* TIMELINE RULER TICKS ROW */}
              <div 
                className="h-7 border-b border-zinc-800 bg-zinc-950 relative shrink-0 cursor-pointer"
                onClick={handleRulerClick}
                style={{ width: `${timelineDuration * timelineZoom + 40}px` }}
              >
                {Array.from({ length: Math.ceil(timelineDuration) + 1 }).map((_, sec) => (
                  <div 
                    key={sec} 
                    className="absolute bottom-0 border-l border-zinc-800 h-2.5" 
                    style={{ left: `${sec * timelineZoom}px` }}
                  >
                    <span className="absolute bottom-3 -left-2 text-[8px] font-mono font-medium text-zinc-500">{sec}s</span>
                  </div>
                ))}
              </div>

              {/* VIDEO TRACK ROW */}
              <div 
                className="h-12 border-b border-zinc-800/50 bg-zinc-900/25 relative flex items-center"
                style={{ width: `${timelineDuration * timelineZoom + 40}px` }}
              >
                {videoClips.map((clip) => {
                  const clipLeft = clip.timelineStart * timelineZoom;
                  const clipWidth = clip.duration * timelineZoom;
                  const isSelected = selectedClip?.id === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ id: clip.id, type: 'video' });
                      }}
                      className={`absolute h-8 rounded border select-none flex items-center px-2 group cursor-grab active:cursor-grabbing transition-shadow ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-600/50 text-white shadow-lg shadow-indigo-600/20' 
                          : 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                      }`}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                      }}
                    >
                      {/* Left Trim Handle bracket */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'video', 'trim-left')}
                        className="absolute left-0 top-0 bottom-0 w-2 bg-zinc-400/20 hover:bg-indigo-500 rounded-l cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <div className="w-[1px] h-3 bg-zinc-300" />
                      </div>

                      {/* Moving main dragging handle trigger */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'video', 'move')}
                        className="flex-1 h-full flex items-center min-w-0"
                      >
                        <span className="text-[10px] font-semibold truncate select-none pointer-events-none">
                          {clip.name}
                        </span>
                      </div>

                      {/* Right Trim Handle bracket */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'video', 'trim-right')}
                        className="absolute right-0 top-0 bottom-0 w-2 bg-zinc-400/20 hover:bg-indigo-500 rounded-r cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <div className="w-[1px] h-3 bg-zinc-300" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AUDIO TRACK ROW */}
              <div 
                className="h-12 border-b border-zinc-800/50 bg-zinc-900/25 relative flex items-center"
                style={{ width: `${timelineDuration * timelineZoom + 40}px` }}
              >
                {audioClips.map((clip) => {
                  const clipLeft = clip.timelineStart * timelineZoom;
                  const clipWidth = clip.duration * timelineZoom;
                  const isSelected = selectedClip?.id === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ id: clip.id, type: 'audio' });
                      }}
                      className={`absolute h-8 rounded border select-none flex items-center px-2 group cursor-grab active:cursor-grabbing transition-shadow ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-600/50 text-white shadow-lg' 
                          : 'border-zinc-800 bg-zinc-850 text-emerald-400'
                      }`}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                      }}
                    >
                      {/* Left handle */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'audio', 'trim-left')}
                        className="absolute left-0 top-0 bottom-0 w-2 bg-zinc-400/10 hover:bg-emerald-500 rounded-l cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <div className="w-[1px] h-3 bg-zinc-300" />
                      </div>

                      {/* Drag move */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'audio', 'move')}
                        className="flex-1 h-full flex items-center min-w-0"
                      >
                        <span className="text-[10px] font-semibold truncate select-none pointer-events-none">
                          🎵 {clip.name}
                        </span>
                      </div>

                      {/* Right handle */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'audio', 'trim-right')}
                        className="absolute right-0 top-0 bottom-0 w-2 bg-zinc-400/10 hover:bg-emerald-500 rounded-r cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <div className="w-[1px] h-3 bg-zinc-300" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SUBTITLE / TEXT TRACK ROW */}
              <div 
                className="h-12 border-b border-zinc-800/50 bg-zinc-900/25 relative flex items-center"
                style={{ width: `${timelineDuration * timelineZoom + 40}px` }}
              >
                {subtitles.map((clip) => {
                  const clipLeft = clip.timelineStart * timelineZoom;
                  const clipWidth = clip.duration * timelineZoom;
                  const isSelected = selectedClip?.id === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ id: clip.id, type: 'subtitle' });
                      }}
                      className={`absolute h-8 rounded border select-none flex items-center px-2 group cursor-grab active:cursor-grabbing transition-shadow ${
                        isSelected 
                          ? 'border-violet-400 bg-violet-600/50 text-white shadow-lg' 
                          : 'border-zinc-800 bg-zinc-850 text-violet-300'
                      }`}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                      }}
                    >
                      {/* Left handle */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'subtitle', 'trim-left')}
                        className="absolute left-0 top-0 bottom-0 w-2 bg-zinc-400/10 hover:bg-violet-400 rounded-l cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <div className="w-[1px] h-3 bg-zinc-300" />
                      </div>

                      {/* Drag move */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'subtitle', 'move')}
                        className="flex-1 h-full flex items-center min-w-0"
                      >
                        <span className="text-[10px] font-semibold truncate select-none pointer-events-none">
                          💬 "{clip.text}"
                        </span>
                      </div>

                      {/* Right handle */}
                      <div 
                        onMouseDown={(e) => startTimelineDrag(e, clip.id, 'subtitle', 'trim-right')}
                        className="absolute right-0 top-0 bottom-0 w-2 bg-zinc-400/10 hover:bg-violet-400 rounded-r cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <div className="w-[1px] h-3 bg-zinc-300" />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
