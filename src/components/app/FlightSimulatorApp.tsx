import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Plane, Compass, Wind, RotateCcw, AlertTriangle, Shield, CheckCircle, 
  MapPin, Eye, Volume2, VolumeX, Award, HelpCircle, Navigation, Info, Zap
} from 'lucide-react';

interface FlightSimulatorAppProps {
  onClose?: () => void;
}

// Type definitions
type CameraView = 'CHASE' | 'COCKPIT' | 'FREE';
type WeatherPreset = 'CALM' | 'WINDY' | 'TURBULENT';
type TimePreset = 'DAY' | 'SUNSET' | 'NIGHT';
type AircraftPreset = 'CESSNA' | 'JET' | 'GLIDER';

interface FlightLesson {
  id: string;
  title: string;
  description: string;
  targetAltitude: number;
  targetSpeed: number;
  ringCount?: number;
  completed: boolean;
}

export default function FlightSimulatorApp({ onClose }: FlightSimulatorAppProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Audio synthesizer nodes
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const windNoiseRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const stallOscRef = useRef<OscillatorNode | null>(null);
  const stallGainRef = useRef<GainNode | null>(null);

  // States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [aircraft, setAircraft] = useState<AircraftPreset>('CESSNA');
  const [weather, setWeather] = useState<WeatherPreset>('CALM');
  const [timeOfDay, setTimeOfDay] = useState<TimePreset>('DAY');
  const [cameraView, setCameraView] = useState<CameraView>('CHASE');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mouseSteering, setMouseSteering] = useState(true);
  const [activeLesson, setActiveLesson] = useState<string>('free');
  
  // Flight physics state (shown in HUD)
  const [airspeed, setAirspeed] = useState(0); // Knots
  const [altitude, setAltitude] = useState(0); // Feet
  const [heading, setHeading] = useState(0); // Degrees 0-359
  const [pitch, setPitch] = useState(0); // Degrees
  const [roll, setRoll] = useState(0); // Degrees
  const [throttle, setThrottle] = useState(30); // Percentage
  const [flaps, setFlaps] = useState(0); // Percentage (0, 10, 20, 30)
  const [climbRate, setClimbRate] = useState(0); // Feet per minute
  const [gForce, setGForce] = useState(1.0); // Gs
  const [stallWarning, setStallWarning] = useState(false);
  const [gearDown, setGearDown] = useState(true);
  const [onGround, setOnGround] = useState(true);
  const [flightStatus, setFlightStatus] = useState<'CRASHED' | 'FLYING' | 'SAFE_LANDING' | 'TAXIING'>('TAXIING');
  const [landingGrade, setLandingGrade] = useState<string>('');
  const [score, setScore] = useState(0);
  const [ringsPassed, setRingsPassed] = useState(0);
  const [showControlsInfo, setShowControlsInfo] = useState(true);

  // Lessons list
  const [lessons, setLessons] = useState<FlightLesson[]>([
    { id: 'takeoff', title: 'Takeoff Training', description: 'Advance throttle to 100%, maintain runway centerline, rotate at 60 kts and climb to 800 ft.', targetAltitude: 800, targetSpeed: 75, completed: false },
    { id: 'landing', title: 'Landing Challenge', description: 'Align with the runway glideslope (follow PAPI indicators: 2 Red, 2 White), lower flaps to 30%, maintain 60 kts, flare and land softly.', targetAltitude: 0, targetSpeed: 60, completed: false },
    { id: 'rings', title: 'Mountain Ring Cruise', description: 'Navigate through all 6 holographic rings in the mountain pass to prove your precision flying.', targetAltitude: 350, targetSpeed: 85, ringCount: 6, completed: false },
  ]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planeMeshRef = useRef<THREE.Group | null>(null);
  const propellerMeshRef = useRef<THREE.Mesh | null>(null);
  const leftAileronRef = useRef<THREE.Mesh | null>(null);
  const rightAileronRef = useRef<THREE.Mesh | null>(null);
  const elevatorRef = useRef<THREE.Mesh | null>(null);
  const rudderRef = useRef<THREE.Mesh | null>(null);
  const ringsGroupRef = useRef<THREE.Group | null>(null);
  
  // Physics parameters (mutable refs for high performance in render loop)
  const pRef = useRef({
    pos: new THREE.Vector3(0, 5, 0), // Coordinates in world space (z is along the runway, y is height, x is lateral)
    rot: new THREE.Euler(0, 0, 0, 'YXZ'), // Pitch, Yaw, Roll
    vel: new THREE.Vector3(0, 0, 0), // Local velocity vector
    speed: 0, // airspeed in m/s
    thrust: 0,
    lift: 0,
    drag: 0,
    weight: 1200, // Kg Cessna 172 empty weight
    rpm: 800,
    yawVelocity: 0,
    mouseYoke: { x: 0, y: 0 },
    windSpeed: 0,
    windDir: 0,
    turbulence: 0,
    terrainSeed: 42,
    gearStatus: true,
    flapsLevel: 0,
    targetRings: [] as { obj: THREE.Mesh; passed: boolean; index: number }[],
    papiLights: [] as THREE.Mesh[],
  });

  // Track keyboard state
  const keysRef = useRef<Record<string, boolean>>({});

  // Initialize Web Audio API
  const initAudio = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Create engine oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      
      // Filter to make engine sound muffled and realistic
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      engineOscRef.current = osc;
      engineGainRef.current = gain;

      // Create white noise for wind rush
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(400, ctx.currentTime);
      windFilter.Q.setValueAtTime(1.5, ctx.currentTime);

      const wGain = ctx.createGain();
      wGain.gain.setValueAtTime(0.01, ctx.currentTime);

      noiseNode.connect(windFilter);
      windFilter.connect(wGain);
      wGain.connect(ctx.destination);
      noiseNode.start();

      windNoiseRef.current = noiseNode as any;
      windGainRef.current = wGain;

      // Stall warning beep oscillator
      const stallOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      stallOsc.type = 'sine';
      stallOsc.frequency.setValueAtTime(800, ctx.currentTime);
      sGain.gain.setValueAtTime(0, ctx.currentTime); // start silent
      stallOsc.connect(sGain);
      sGain.connect(ctx.destination);
      stallOsc.start();

      stallOscRef.current = stallOsc;
      stallGainRef.current = sGain;

    } catch (e) {
      console.warn('Audio context creation failed', e);
    }
  };

  const playTouchdownSound = () => {
    if (!audioContextRef.current || !soundEnabled) return;
    try {
      const ctx = audioContextRef.current;
      // White noise puff for tires screech
      const bufferSize = 0.3 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch(e) {}
  };

  const playCrashSound = () => {
    if (!audioContextRef.current || !soundEnabled) return;
    try {
      const ctx = audioContextRef.current;
      // Loud rumbling crash sound
      const bufferSize = 1.5 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch(e) {}
  };

  // Adjust audio based on aircraft speed and RPM
  const updateAudioSynthesizer = (rpm: number, speedKnots: number, isStalling: boolean) => {
    if (!audioContextRef.current || !soundEnabled) return;
    const ctx = audioContextRef.current;
    
    // Engine sound pitch scales with RPM, volume scales slightly
    if (engineOscRef.current && engineGainRef.current) {
      // Cessna has 800 - 2400 RPM range
      const baseFreq = aircraft === 'JET' ? 40 + rpm * 0.08 : 30 + rpm * 0.05;
      engineOscRef.current.frequency.setTargetAtTime(baseFreq, ctx.currentTime, 0.1);
      
      const targetGain = aircraft === 'GLIDER' ? 0.0 : (0.02 + (rpm / 2400) * 0.06);
      engineGainRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1);
    }

    // Wind noise pitch and volume scales with airspeed
    if (windGainRef.current) {
      const windTargetGain = Math.min(0.08, (speedKnots / 150) * 0.04 + 0.005);
      windGainRef.current.gain.setTargetAtTime(windTargetGain, ctx.currentTime, 0.25);
    }

    // Stall sound warning
    if (stallGainRef.current) {
      if (isStalling && !pRef.current.pos.y && pRef.current.pos.y < 2) {
        stallGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      } else if (isStalling) {
        // Intermittent stall sound
        const pulse = Math.floor(ctx.currentTime * 6) % 2 === 0;
        stallGainRef.current.gain.setTargetAtTime(pulse ? 0.25 : 0, ctx.currentTime, 0.05);
      } else {
        stallGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      }
    }
  };

  // Noise generator for flight terrain heights (simple Perlin approximation)
  const getTerrainHeight = (x: number, z: number): number => {
    // Basic fractal height generation (mountains, runways are flat at x = -50 to 50, z = -300 to 800)
    if (x > -80 && x < 80 && z > -350 && z < 1000) {
      // Force flat runway and safe taxiways
      return 0.1;
    }

    // Simple multi-frequency sine generator for beautiful mountains
    const seedOffset = pRef.current.terrainSeed;
    const layer1 = Math.sin(x * 0.0015 + seedOffset) * Math.cos(z * 0.0012) * 220;
    const layer2 = Math.cos(x * 0.004 + seedOffset * 1.5) * Math.sin(z * 0.0035) * 60;
    const layer3 = Math.sin(x * 0.015) * Math.cos(z * 0.012) * 10;
    
    let height = Math.max(-5, layer1 + layer2 + layer3);
    
    // Smooth transition near the airfield
    const distToAirfield = Math.sqrt(x * x + Math.min(Math.max(z, -300), 800) === z ? 0 : Math.pow(z - 250, 2));
    if (distToAirfield < 400) {
      const blend = (distToAirfield) / 400;
      height = THREE.MathUtils.lerp(0.1, height, Math.pow(blend, 2));
    }

    return height;
  };

  // Reset/Spawn flight parameters
  const resetFlight = (forceAirport = true) => {
    setOnGround(true);
    setFlightStatus('TAXIING');
    setRingsPassed(0);
    pRef.current.pos.set(0, 0.7, 500); // start at the end of runway looking down
    pRef.current.rot.set(0, Math.PI, 0); // pointing North (Z = negative)
    pRef.current.vel.set(0, 0, 0);
    pRef.current.speed = 0;
    pRef.current.rpm = 800;
    setThrottle(20);
    setFlaps(0);
    setGearDown(true);
    setLandingGrade('');

    // If active lesson is "landing", start already in air aligned with runway
    if (activeLesson === 'landing') {
      pRef.current.pos.set(0, 160, 2200); // 160 units (approx 520 ft) high, 2.2km back
      pRef.current.rot.set(-0.06, Math.PI, 0); // slightly pitched down pointing to runway
      pRef.current.speed = 33; // 65 knots approx
      setThrottle(40);
      setFlaps(20);
      setOnGround(false);
      setFlightStatus('FLYING');
    } else if (activeLesson === 'rings') {
      pRef.current.pos.set(-150, 200, 1500); 
      pRef.current.rot.set(0, Math.PI + 0.5, 0); 
      pRef.current.speed = 38; // 75 knots
      setThrottle(65);
      setOnGround(false);
      setFlightStatus('FLYING');
    }

    // Reset target rings
    pRef.current.targetRings.forEach(r => {
      r.passed = false;
      const mat = r.obj.material as THREE.MeshBasicMaterial;
      mat.color.setHex(0xffff00);
      mat.opacity = 0.35;
    });
  };

  // Trigger flight reset when aircraft / lesson changes
  useEffect(() => {
    resetFlight();
  }, [aircraft, activeLesson]);

  // Adjust wind and weather presets
  useEffect(() => {
    if (weather === 'CALM') {
      pRef.current.windSpeed = 0;
      pRef.current.windDir = 0;
      pRef.current.turbulence = 0.0;
    } else if (weather === 'WINDY') {
      pRef.current.windSpeed = 15; // 15 knots
      pRef.current.windDir = Math.PI * 0.4; // crosswind
      pRef.current.turbulence = 0.15;
    } else if (weather === 'TURBULENT') {
      pRef.current.windSpeed = 22;
      pRef.current.windDir = Math.PI * 0.75;
      pRef.current.turbulence = 0.6;
    }
  }, [weather]);

  // Handle keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger audio init on first user interaction
      initAudio();

      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      // Handle individual toggles
      if (k === 'g') {
        setGearDown(prev => {
          pRef.current.gearStatus = !prev;
          return !prev;
        });
      }
      if (k === 'f') {
        // Flaps Down (increase flaps percentage)
        setFlaps(prev => {
          const next = Math.min(30, prev + 10);
          pRef.current.flapsLevel = next;
          return next;
        });
      }
      if (k === 'v') {
        // Flaps Up
        setFlaps(prev => {
          const next = Math.max(0, prev - 10);
          pRef.current.flapsLevel = next;
          return next;
        });
      }
      if (k === 'c') {
        // Cycle cameras
        setCameraView(prev => {
          if (prev === 'CHASE') return 'COCKPIT';
          if (prev === 'COCKPIT') return 'FREE';
          return 'CHASE';
        });
      }
      if (e.key === ' ') {
        // Spacebar to reset flight
        resetFlight();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [aircraft, activeLesson]);

  // Main Three.js Init & Render loop
  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Apply beautiful fog based on weather / visibility
    scene.fog = new THREE.FogExp2(
      timeOfDay === 'DAY' ? 0xd0e8ff : (timeOfDay === 'SUNSET' ? 0xfdba74 : 0x050515),
      0.00065
    );

    // CAMERA
    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 8000);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(200, 400, 200);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 1500;
    const d = 400;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;
    scene.add(mainLight);

    // Apply custom colors based on time preset
    if (timeOfDay === 'DAY') {
      renderer.setClearColor(0xbae6fd); // beautiful blue sky
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 0.55;
      mainLight.color.setHex(0xfef08a); // bright sun
    } else if (timeOfDay === 'SUNSET') {
      renderer.setClearColor(0x311042); // dusk purple sky
      ambientLight.color.setHex(0xffd7b5);
      ambientLight.intensity = 0.35;
      mainLight.color.setHex(0xf97316); // orange sun
      mainLight.position.set(300, 80, -300);
    } else {
      renderer.setClearColor(0x02020a); // dark space starlight
      ambientLight.color.setHex(0xa5b4fc);
      ambientLight.intensity = 0.08;
      mainLight.color.setHex(0x93c5fd); // moonlight
      mainLight.position.set(-200, 300, -100);
    }

    // PROCEDURAL TERRAIN MESH
    const terrainGeo = new THREE.PlaneGeometry(16000, 16000, 180, 180);
    terrainGeo.rotateX(-Math.PI / 2); // lie flat

    // Adjust terrain heights dynamically via noise
    const posAttribute = terrainGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      const tx = posAttribute.getX(i);
      const tz = posAttribute.getZ(i);
      posAttribute.setY(i, getTerrainHeight(tx, tz));
    }
    terrainGeo.computeVertexNormals();

    // Terrain material
    const terrainMat = new THREE.MeshStandardMaterial({
      color: timeOfDay === 'SUNSET' ? 0x654321 : (timeOfDay === 'NIGHT' ? 0x051a05 : 0x228b22),
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true,
    });
    
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // WATER LEVEL (y = -1.5)
    const waterGeo = new THREE.PlaneGeometry(16000, 16000);
    const waterMat = new THREE.MeshStandardMaterial({
      color: timeOfDay === 'SUNSET' ? 0x4a123a : (timeOfDay === 'NIGHT' ? 0x01020f : 0x0077be),
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotateX(-Math.PI / 2);
    waterMesh.position.y = -1.5;
    scene.add(waterMesh);

    // RUNWAY (flat tarmac pavement strip)
    // Detailed pavement drawn directly at airfield center
    const runwayGroup = new THREE.Group();
    scene.add(runwayGroup);

    // Main tarmac
    const tarmacGeo = new THREE.BoxGeometry(45, 0.2, 1200); // 45m wide, 1.2km long
    const tarmacMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.95,
      metalness: 0.0
    });
    const tarmac = new THREE.Mesh(tarmacGeo, tarmacMat);
    tarmac.receiveShadow = true;
    tarmac.position.set(0, 0.05, 250); // centered at Z = 250, extending from Z = -350 to Z = 850
    runwayGroup.add(tarmac);

    // Runway stripes, numbers, and centerline indicators
    const stripesGroup = new THREE.Group();
    stripesGroup.position.y = 0.18;
    runwayGroup.add(stripesGroup);

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Add centerline dashed lines
    for (let z = -300; z <= 800; z += 50) {
      const lineGeo = new THREE.PlaneGeometry(1.2, 12);
      lineGeo.rotateX(-Math.PI / 2);
      const line = new THREE.Mesh(lineGeo, stripeMat);
      line.position.set(0, 0, z);
      stripesGroup.add(line);
    }

    // Add runway threshold stripes (piano keys)
    for (let xOffset = -16; xOffset <= 16; xOffset += 4) {
      if (Math.abs(xOffset) < 1) continue;
      const keyGeo = new THREE.PlaneGeometry(1.5, 20);
      keyGeo.rotateX(-Math.PI / 2);
      
      const key1 = new THREE.Mesh(keyGeo, stripeMat);
      key1.position.set(xOffset, 0, -320);
      
      const key2 = new THREE.Mesh(keyGeo, stripeMat);
      key2.position.set(xOffset, 0, 820);
      
      stripesGroup.add(key1);
      stripesGroup.add(key2);
    }

    // PAPI (Precision Approach Path Indicators) glide slope helper lights
    // Situated beside runway at Z = 150
    const papiLights: THREE.Mesh[] = [];
    const lightBoxGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const lightBoxMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    for (let i = 0; i < 4; i++) {
      const box = new THREE.Mesh(lightBoxGeo, lightBoxMat);
      box.position.set(-30 - i * 2, 0.5, 150);
      scene.add(box);

      // Light lens
      const lensGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(0, 0, 0.65);
      box.add(lens);
      papiLights.push(lens);
    }
    pRef.current.papiLights = papiLights;

    // RUNWAY EDGE LIGHTS (Blinking red/green/white depending on end of tarmac)
    const edgeLightsGroup = new THREE.Group();
    scene.add(edgeLightsGroup);

    const lightGeo = new THREE.SphereGeometry(0.2, 8, 8);
    for (let z = -340; z <= 840; z += 40) {
      let sideColor = 0xffffff; // white edge
      if (z === -340) sideColor = 0x10b981; // green threshold
      if (z === 840) sideColor = 0xef4444; // red end

      const matLeft = new THREE.MeshBasicMaterial({ color: sideColor });
      const lightLeft = new THREE.Mesh(lightGeo, matLeft);
      lightLeft.position.set(-23, 0.3, z);
      
      const matRight = new THREE.MeshBasicMaterial({ color: sideColor });
      const lightRight = new THREE.Mesh(lightGeo, matRight);
      lightRight.position.set(23, 0.3, z);

      edgeLightsGroup.add(lightLeft);
      edgeLightsGroup.add(lightRight);
    }

    // FOREST / TREES (Procedurally scattered around hills)
    const treeCount = 550;
    const instancedTreeGroup = new THREE.Group();
    scene.add(instancedTreeGroup);

    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 5, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, flatShading: true });
    const leavesGeo = new THREE.ConeGeometry(3, 8, 5);
    const leavesMat = new THREE.MeshStandardMaterial({ 
      color: timeOfDay === 'SUNSET' ? 0x553300 : (timeOfDay === 'NIGHT' ? 0x040e04 : 0x0f5213), 
      flatShading: true 
    });

    for (let i = 0; i < treeCount; i++) {
      // Scatter randomly avoiding runway
      let tx = (Math.random() - 0.5) * 6000;
      let tz = (Math.random() - 0.5) * 6000;
      if (Math.abs(tx) < 120 && tz > -500 && tz < 1100) {
        // push away from runway
        tx += tx > 0 ? 120 : -120;
      }
      const ty = getTerrainHeight(tx, tz);
      if (ty > 0) { // tree on ground, not water
        const singleTree = new THREE.Group();
        singleTree.position.set(tx, ty + 2.5, tz);

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.castShadow = true;
        singleTree.add(trunk);

        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 4.5;
        leaves.castShadow = true;
        singleTree.add(leaves);

        const scale = 0.5 + Math.random() * 1.0;
        singleTree.scale.set(scale, scale, scale);

        instancedTreeGroup.add(singleTree);
      }
    }

    // MISSION FLOATING RINGS (Mountain Pass Winding Flightpath)
    const ringsGroup = new THREE.Group();
    scene.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    // Define coordinate locations for 6 rings
    const ringPositions = [
      new THREE.Vector3(-150, 80, 1200),
      new THREE.Vector3(-300, 120, 800),
      new THREE.Vector3(-450, 160, 300),
      new THREE.Vector3(-300, 140, -200),
      new THREE.Vector3(-100, 90, -500),
      new THREE.Vector3(120, 60, -200),
    ];

    const targetRings: { obj: THREE.Mesh; passed: boolean; index: number }[] = [];
    
    ringPositions.forEach((pos, idx) => {
      // Draw a beautiful circular ring that glows
      const ringGeo = new THREE.TorusGeometry(18, 1.8, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        transparent: true, 
        opacity: 0.35, 
        wireframe: true 
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      // Point them facing along the flightpath
      if (idx < ringPositions.length - 1) {
        ring.lookAt(ringPositions[idx + 1]);
      } else {
        ring.lookAt(new THREE.Vector3(0, 5, 500)); // point back to runway
      }
      ringsGroup.add(ring);
      targetRings.push({ obj: ring, passed: false, index: idx });

      // Add a tiny beacon particle below the ring
      const beaconGeo = new THREE.CylinderGeometry(0.1, 10, 200, 8, 1, true);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, -100, 0);
      ring.add(beacon);
    });
    pRef.current.targetRings = targetRings;

    // PROCEDURAL 3D AIRPLANE MODEL
    const airplane = new THREE.Group();
    scene.add(airplane);
    planeMeshRef.current = airplane;

    // Aluminum fuselage
    const fuselageGeo = new THREE.CylinderGeometry(1.2, 0.4, 10, 8);
    fuselageGeo.rotateX(Math.PI / 2); // lie horizontal
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: aircraft === 'JET' ? 0x94a3b8 : (aircraft === 'GLIDER' ? 0xf8fafc : 0xd1d5db),
      roughness: 0.3,
      metalness: 0.7
    });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    airplane.add(fuselage);

    // Main Wings
    const wingGeo = new THREE.BoxGeometry(aircraft === 'GLIDER' ? 32 : 16, 0.18, 1.8);
    const wingMat = new THREE.MeshStandardMaterial({
      color: aircraft === 'JET' ? 0x475569 : 0xef4444, // Red or steel
      roughness: 0.4,
      metalness: 0.5
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0.5, 0.8);
    wings.castShadow = true;
    airplane.add(wings);

    // Left and Right moving ailerons (for visual flight inputs!)
    const aileronGeo = new THREE.BoxGeometry(3.5, 0.08, 0.35);
    const leftAileron = new THREE.Mesh(aileronGeo, wingMat);
    leftAileron.position.set(-6, 0.5, -0.15);
    airplane.add(leftAileron);
    leftAileronRef.current = leftAileron;

    const rightAileron = new THREE.Mesh(aileronGeo, wingMat);
    rightAileron.position.set(6, 0.5, -0.15);
    airplane.add(rightAileron);
    rightAileronRef.current = rightAileron;

    // Tail Horizontal Stabilizer & Elevator
    const tailPlaneGeo = new THREE.BoxGeometry(4.5, 0.1, 1.0);
    const tailPlane = new THREE.Mesh(tailPlaneGeo, fuselageMat);
    tailPlane.position.set(0, 0.3, -4.2);
    airplane.add(tailPlane);

    const elevatorGeo = new THREE.BoxGeometry(4.0, 0.08, 0.3);
    const elevator = new THREE.Mesh(elevatorGeo, fuselageMat);
    elevator.position.set(0, 0.3, -4.75);
    airplane.add(elevator);
    elevatorRef.current = elevator;

    // Tail Vertical Fin & Rudder
    const tailFinGeo = new THREE.BoxGeometry(0.1, 2.2, 1.2);
    tailFinGeo.translate(0, 1.1, 0); // shift up pivot
    const tailFin = new THREE.Mesh(tailFinGeo, wingMat);
    tailFin.position.set(0, 0.3, -4.2);
    airplane.add(tailFin);

    const rudderGeo = new THREE.BoxGeometry(0.08, 2.0, 0.4);
    rudderGeo.translate(0, 1.0, 0);
    const rudder = new THREE.Mesh(rudderGeo, wingMat);
    rudder.position.set(0, 0.3, -4.9);
    airplane.add(rudder);
    rudderRef.current = rudder;

    // Cockpit Canopy Glass
    const glassGeo = new THREE.SphereGeometry(1.0, 16, 16);
    glassGeo.scale(0.85, 0.65, 1.8);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.55
    });
    const canopy = new THREE.Mesh(glassGeo, glassMat);
    canopy.position.set(0, 0.7, 1.2);
    airplane.add(canopy);

    // Propeller (Only Cessna model)
    const propellerGroup = new THREE.Group();
    propellerGroup.position.set(0, 0, 5.15);
    airplane.add(propellerGroup);

    if (aircraft === 'CESSNA') {
      const spinnerGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const spinner = new THREE.Mesh(spinnerGeo, fuselageMat);
      propellerGroup.add(spinner);

      const bladeGeo = new THREE.BoxGeometry(2.4, 0.15, 0.05);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      propellerGroup.add(blade);
      propellerMeshRef.current = blade;
    }

    // Landing Gear wheels
    const wheelGroup = new THREE.Group();
    airplane.add(wheelGroup);
    
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 8);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.95 });

    // Left main gear
    const strutLeftGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6);
    const strutLeft = new THREE.Mesh(strutLeftGeo, fuselageMat);
    strutLeft.position.set(-1.4, -1.0, 0.5);
    strutLeft.rotateZ(-0.25);
    wheelGroup.add(strutLeft);
    const wheelLeft = new THREE.Mesh(wheelGeo, wheelMat);
    wheelLeft.position.set(-1.6, -1.7, 0.5);
    wheelLeft.castShadow = true;
    wheelGroup.add(wheelLeft);

    // Right main gear
    const strutRight = new THREE.Mesh(strutLeftGeo, fuselageMat);
    strutRight.position.set(1.4, -1.0, 0.5);
    strutRight.rotateZ(0.25);
    wheelGroup.add(strutRight);
    const wheelRight = new THREE.Mesh(wheelGeo, wheelMat);
    wheelRight.position.set(1.6, -1.7, 0.5);
    wheelRight.castShadow = true;
    wheelGroup.add(wheelRight);

    // Nose wheel
    const strutNoseGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5);
    const strutNose = new THREE.Mesh(strutNoseGeo, fuselageMat);
    strutNose.position.set(0, -0.9, 4.0);
    wheelGroup.add(strutNose);
    const wheelNose = new THREE.Mesh(wheelGeo, wheelMat);
    wheelNose.position.set(0, -1.6, 4.0);
    wheelNose.castShadow = true;
    wheelGroup.add(wheelNose);

    // Apply start location
    resetFlight();

    // MOUSE INTERACTION FOR FLIGHT YOKE CONTROL
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseSteering) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1); // -1 to 1 (flip Y)
      
      // Clamp inputs
      pRef.current.mouseYoke.x = Math.max(-1, Math.min(1, x));
      pRef.current.mouseYoke.y = Math.max(-1, Math.min(1, y));
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // TIME-DEPENDENT PHYSICS SIMULATOR LOOP
    let lastTime = performance.now();
    let frameId: number;

    const animate = (currentTime: number) => {
      frameId = requestAnimationFrame(animate);
      
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000); // capped delta time at 50ms
      lastTime = currentTime;

      const p = pRef.current;
      const keys = keysRef.current;

      // Only perform simulation if plane is not crashed
      if (flightStatus !== 'CRASHED') {
        
        // 1. INPUT HANDLING & FLIGHT CONTROL COUPLING
        let pitchInput = 0;
        let rollInput = 0;
        let yawInput = 0;

        if (mouseSteering) {
          pitchInput = p.mouseYoke.y; // positive is pull back (climb)
          rollInput = p.mouseYoke.x; // positive is steer right
        } else {
          // Keyboard fallback yoke
          if (keys['w'] || keys['arrowup']) pitchInput = -0.7; // push forward (descend)
          if (keys['s'] || keys['arrowdown']) pitchInput = 0.7; // pull back (climb)
          if (keys['a'] || keys['arrowleft']) rollInput = -0.7;
          if (keys['d'] || keys['arrowright']) rollInput = 0.7;
        }

        // Rudder steering (Yaw)
        if (keys['q']) yawInput = -0.6;
        if (keys['e']) yawInput = 0.6;

        // Throttle management
        let targetThrottle = throttle;
        if (keys['i'] || keys['+']) targetThrottle = Math.min(100, throttle + 15 * dt);
        if (keys['k'] || keys['-']) targetThrottle = Math.max(0, throttle - 15 * dt);
        if (targetThrottle !== throttle) {
          setThrottle(targetThrottle);
        }

        // 2. AERODYNAMICS EQUATIONS (FLIGHT FORCES)
        // RPM response
        const maxRPM = aircraft === 'JET' ? 12000 : 2400;
        const targetRPM = 600 + (throttle / 100) * (maxRPM - 600);
        p.rpm = THREE.MathUtils.lerp(p.rpm, targetRPM, 4 * dt);

        // Forward thrust is proportional to RPM/Throttle (Jet engine has much higher power)
        const thrustCoeff = aircraft === 'JET' ? 24.0 : (aircraft === 'GLIDER' ? 0.0 : 6.5);
        p.thrust = (p.rpm / maxRPM) * throttle * thrustCoeff;

        // Airspeed determination (local forward velocity vector)
        p.speed = p.vel.length();

        // Convert coordinates to speed in knots (1 m/s = 1.94384 knots)
        const speedKnots = p.speed * 1.94384;
        setAirspeed(Math.round(speedKnots));

        // Lift & Drag aerodynamics
        // Lift increases with angle of attack (pitch angle relative to air velocity)
        // Standard wing lift formula: L = 0.5 * density * V^2 * WingArea * CL
        // CL ranges up to 1.5. If angle of attack > 15 degrees (0.26 rad), stall occurs.
        const density = 1.225 * Math.exp(-p.pos.y / 8500); // Air density declines with altitude
        const wingArea = aircraft === 'GLIDER' ? 28 : (aircraft === 'JET' ? 22 : 16);
        
        // Pitch relative to velocity (Approx Angle of Attack)
        let pitchVelAngle = p.rot.x;
        if (p.speed > 1) {
          const localForward = new THREE.Vector3(0, 0, -1).applyEuler(p.rot);
          const velNorm = p.vel.clone().normalize();
          pitchVelAngle = Math.asin(localForward.dot(new THREE.Vector3(0, 1, 0))) - Math.asin(velNorm.dot(new THREE.Vector3(0, 1, 0)));
        }

        // Stall detection
        const stallThresholdAngle = aircraft === 'JET' ? 0.35 : 0.26; // approx 15-20 deg
        const isStalling = speedKnots < (aircraft === 'JET' ? 95 : (aircraft === 'GLIDER' ? 22 : 45));
        setStallWarning(isStalling);

        let CL = 0.2 + pitchVelAngle * 4.5;
        // Flaps increase lift coefficient but also increase drag
        const flapFactor = p.flapsLevel / 30;
        CL += flapFactor * 0.45;

        if (isStalling) {
          CL *= 0.15; // massive lift collapse during stall!
        }

        p.lift = 0.5 * density * Math.pow(p.speed, 2) * wingArea * Math.max(0, CL);

        // Drag forces
        // Drag = Parasitic drag + Induced drag + Flap drag
        const dragCoeffParasitic = aircraft === 'JET' ? 0.015 : (aircraft === 'GLIDER' ? 0.012 : 0.035);
        const dragCoeffInduced = Math.pow(CL, 2) / (Math.PI * 6.5); // span efficiency
        const dragCoeffFlaps = flapFactor * 0.06;

        const totalCd = dragCoeffParasitic + dragCoeffInduced + dragCoeffFlaps;
        p.drag = 0.5 * density * Math.pow(p.speed, 2) * wingArea * totalCd;

        // Apply forces to calculate accelerations
        // Local axes
        const forwardVector = new THREE.Vector3(0, 0, -1).applyEuler(p.rot);
        const upVector = new THREE.Vector3(0, 1, 0).applyEuler(p.rot);
        const rightVector = new THREE.Vector3(1, 0, 0).applyEuler(p.rot);

        // Forces vectors
        const FThrust = forwardVector.clone().multiplyScalar(p.thrust);
        const FLift = upVector.clone().multiplyScalar(p.lift);
        const FDrag = p.vel.clone().normalize().multiplyScalar(-p.drag);
        const FGravity = new THREE.Vector3(0, -9.81 * p.weight, 0);

        // Ground contact forces
        const groundHeight = getTerrainHeight(p.pos.x, p.pos.z);
        const groundThreshold = p.gearStatus ? 0.75 : 0.2; // engine fuselage height on wheels vs belly
        
        let FGroundNormal = new THREE.Vector3(0, 0, 0);
        let FGroundFriction = new THREE.Vector3(0, 0, 0);

        if (p.pos.y <= groundHeight + groundThreshold) {
          p.pos.y = groundHeight + groundThreshold;
          setOnGround(true);

          // Impact evaluation (vertical climb rate vs safe landing)
          const verticalImpactSpeed = p.vel.y;
          
          if (verticalImpactSpeed < -8.5) { // crash speed threshold
            setFlightStatus('CRASHED');
            playCrashSound();
            lastTime = performance.now();
            return;
          } else if (verticalImpactSpeed < -1.5) {
            // Smooth touchdown!
            playTouchdownSound();
            
            // Score landing
            const vKts = Math.abs(verticalImpactSpeed * 1.94);
            let grade = 'PERFECT (A+)';
            if (vKts > 8) grade = 'ROUGH (C)';
            else if (vKts > 5) grade = 'FIRM (B)';
            else if (vKts > 3) grade = 'GOOD (A)';

            setLandingGrade(grade);
            setFlightStatus('SAFE_LANDING');
            // Complete landing lesson
            if (activeLesson === 'landing') {
              setLessons(prev => prev.map(l => l.id === 'landing' ? { ...l, completed: true } : l));
            }
          }

          // Ground friction (extremely high if brakes 'B' are held)
          const brakesActive = keys['b'];
          const frictionCoeff = brakesActive ? 0.35 : (p.gearStatus ? 0.03 : 0.6); // belly slide gets massive friction!
          
          // Wheel alignment constraint: direct momentum forward, suppress sideways skid
          const localRightVel = p.vel.dot(rightVector);
          const skidFriction = -localRightVel * 8.0; // quickly arrest side slips on tarmac
          
          FGroundFriction.add(rightVector.clone().multiplyScalar(skidFriction));

          // Normal force countering gravity
          if (p.vel.y < 0) {
            FGroundNormal.set(0, -p.vel.y * p.weight, 0);
            p.vel.y = 0;
          }

          // Rolling drag
          const forwardVel = p.vel.dot(forwardVector);
          if (forwardVel < 0) { // Z coordinate direction
            const rollingResistance = forwardVel * frictionCoeff * p.weight * 0.15;
            FGroundFriction.add(forwardVector.clone().multiplyScalar(rollingResistance));
          }
        } else {
          setOnGround(false);
          if (flightStatus === 'TAXIING') {
            setFlightStatus('FLYING');
          }
        }

        // SUM ALL FORCES
        const FTotal = FThrust.clone()
          .add(FLift)
          .add(FDrag)
          .add(FGravity)
          .add(FGroundNormal)
          .add(FGroundFriction);

        // Weather Wind and Turbulence effects (applied in flight)
        if (!onGround) {
          const windVel = new THREE.Vector3(
            Math.sin(p.windDir) * p.windSpeed * 0.514,
            0,
            Math.cos(p.windDir) * p.windSpeed * 0.514
          );
          FTotal.add(windVel.multiplyScalar(0.015 * p.weight));

          // Turbulence gusts
          if (p.turbulence > 0) {
            const turb = p.turbulence * (Math.random() - 0.5) * 4.5;
            FTotal.y += turb * p.weight * 0.25;
            p.rot.x += (Math.random() - 0.5) * p.turbulence * 0.03;
            p.rot.z += (Math.random() - 0.5) * p.turbulence * 0.035;
          }
        }

        // Acceleration = Force / Mass
        const accel = FTotal.divideScalar(p.weight);
        p.vel.addScaledVector(accel, dt);

        // Constrain velocity magnitude near zero on ground
        if (onGround && p.vel.length() < 0.1 && throttle < 5) {
          p.vel.set(0, 0, 0);
        }

        // Update Position
        p.pos.addScaledVector(p.vel, dt);

        // G-Force determination (accel perpendicular to wings)
        const verticalAccel = accel.dot(upVector);
        const calculatedG = 1.0 + (verticalAccel / 9.81);
        setGForce(parseFloat(calculatedG.toFixed(2)));

        // 3. FLIGHT ORIENTATION/YOKE STEERING MODEL
        // Control effectiveness is proportional to airspeed square (no authority if stalled/not moving!)
        const ctrlAuthority = Math.min(1.0, Math.pow(p.speed / 18, 1.8));

        // Pitch inputs: W/S or Mouse. Jet rotates much faster.
        const pitchSpeed = aircraft === 'JET' ? 1.55 : (aircraft === 'GLIDER' ? 0.45 : 0.75);
        p.rot.x += pitchInput * pitchSpeed * ctrlAuthority * dt;
        p.rot.x = Math.max(-1.1, Math.min(1.1, p.rot.x)); // limit pitch angles (around 65 deg max)

        // Roll inputs: A/D or Mouse.
        const rollSpeed = aircraft === 'JET' ? 2.6 : (aircraft === 'GLIDER' ? 0.6 : 1.15);
        p.rot.z -= rollInput * rollSpeed * ctrlAuthority * dt;
        
        // Yaw inputs (Rudder): Q/E keys
        const yawSpeed = aircraft === 'JET' ? 0.65 : 0.35;
        p.rot.y -= yawInput * yawSpeed * ctrlAuthority * dt;

        // Aerodynamic self-leveling (dihedral wing effect - roll gradually returns to neutral if hands-off yoke)
        if (Math.abs(rollInput) < 0.05 && !onGround) {
          p.rot.z = THREE.MathUtils.lerp(p.rot.z, 0, 1.1 * dt);
        }

        // Slip coordinate physics: rolling slips the vector laterally and initiates yaw rotation
        if (!onGround) {
          // Bank causes heading rotation (yaw) due to lift vector tilting
          const bankForce = Math.sin(p.rot.z);
          p.rot.y += bankForce * 0.55 * dt;

          // Align fuselage heading with flightpath trajectory slowly
          if (p.speed > 5) {
            const localVelDir = p.vel.clone().normalize();
            const headingAngle = Math.atan2(-localVelDir.x, -localVelDir.z);
            // Slowly interpolate pitch/yaw to follow speed vector
            p.rot.y = THREE.MathUtils.lerp(p.rot.y, headingAngle, 1.2 * dt);
          }
        } else {
          // While taxiing on ground, rudder input directly steers front wheel
          if (p.speed > 0.5) {
            p.rot.y -= yawInput * 1.5 * (p.speed / 5) * dt;
            // Roll is zeroed on ground
            p.rot.z = THREE.MathUtils.lerp(p.rot.z, 0, 12 * dt);
            p.rot.x = THREE.MathUtils.lerp(p.rot.x, 0, 8 * dt);
          }
        }

        // Enforce wrap-around angle bounds
        p.rot.y = (p.rot.y + Math.PI * 2) % (Math.PI * 2);

        // Update Airplane mesh position and orientation
        if (airplane) {
          airplane.position.copy(p.pos);
          airplane.rotation.copy(p.rot);

          // Animate spin of propeller
          if (propellerMeshRef.current) {
            propellerMeshRef.current.rotation.x += (p.rpm / 60) * 2 * Math.PI * dt;
          }

          // Animate moving control surfaces based on current inputs
          if (leftAileronRef.current && rightAileronRef.current) {
            leftAileronRef.current.rotation.x = rollInput * 0.45;
            rightAileronRef.current.rotation.x = -rollInput * 0.45;
          }
          if (elevatorRef.current) {
            elevatorRef.current.rotation.x = -pitchInput * 0.35;
          }
          if (rudderRef.current) {
            rudderRef.current.rotation.y = -yawInput * 0.4;
          }
        }

        // 4. MISSION OBJECTIVES / CHECKPOINTS EVALUATION
        // Takeoff evaluation
        if (activeLesson === 'takeoff' && !onGround && p.pos.y > 250) {
          setLessons(prev => prev.map(l => l.id === 'takeoff' ? { ...l, completed: true } : l));
        }

        // Valley Rings check
        if (activeLesson === 'rings') {
          p.targetRings.forEach(r => {
            if (!r.passed) {
              const dist = p.pos.distanceTo(r.obj.position);
              if (dist < 28) { // Ring trigger diameter approx 28m
                r.passed = true;
                setRingsPassed(prev => {
                  const next = prev + 1;
                  // Increase score
                  setScore(s => s + 500);
                  if (next >= 6) {
                    // Lesson Complete!
                    setLessons(l => l.map(les => les.id === 'rings' ? { ...les, completed: true } : les));
                  }
                  return next;
                });
                // Color Ring neon green to celebrate pass!
                const mat = r.obj.material as THREE.MeshBasicMaterial;
                mat.color.setHex(0x10b981);
                mat.opacity = 0.85;
              }
            }
          });
        }

        // HUD bindings updates
        setAltitude(Math.round(p.pos.y * 3.28084)); // conversion to feet
        setHeading(Math.round((p.rot.y * 180) / Math.PI) % 360);
        setPitch(Math.round((p.rot.x * 180) / Math.PI));
        setRoll(Math.round((p.rot.z * 180) / Math.PI));
        setClimbRate(Math.round(p.vel.y * 196.85)); // Conversion to feet per min
        
        // Update audio context notes
        updateAudioSynthesizer(p.rpm, speedKnots, isStalling);

        // Update PAPI lights depending on aircraft glide angle
        // Glide slope target is 3 degrees (tan is 0.052).
        // Let's compute actual angle from plane Z relative to Z=150 (runway landing touchdown)
        const distToThreshold = p.pos.z - 150;
        if (distToThreshold > 100 && distToThreshold < 2500) {
          const actualAngle = Math.atan2(p.pos.y, distToThreshold);
          const targetAngle = 3 * (Math.PI / 180); // 3 degrees in radians
          
          // Color lens accordingly:
          // Too high (angle > 3.5 deg) -> 4 White
          // Slightly high -> 3 White, 1 Red
          // Perfect (2.8 to 3.2 deg) -> 2 White, 2 Red
          // Slightly low -> 1 White, 3 Red
          // Too low -> 4 Red
          const diff = actualAngle - targetAngle;
          
          p.papiLights.forEach((lens, index) => {
            const mat = lens.material as THREE.MeshBasicMaterial;
            if (diff > 0.012) {
              mat.color.setHex(0xffffff); // 4 White
            } else if (diff > 0.004) {
              mat.color.setHex(index < 3 ? 0xffffff : 0xef4444); // 3 White, 1 Red
            } else if (diff > -0.004) {
              mat.color.setHex(index < 2 ? 0xffffff : 0xef4444); // 2 White, 2 Red (Glide slope perfect!)
            } else if (diff > -0.012) {
              mat.color.setHex(index < 1 ? 0xffffff : 0xef4444); // 1 White, 3 Red
            } else {
              mat.color.setHex(0xef4444); // 4 Red
            }
          });
        }
      }

      // CAMERA PLACEMENT & VIEW CONFIGURATION
      if (camera && airplane) {
        if (cameraView === 'CHASE') {
          // Position behind and slightly above airplane relative to heading
          const backOffset = new THREE.Vector3(0, 3.2, 16.5).applyEuler(p.rot);
          const targetCamPos = p.pos.clone().add(backOffset);
          camera.position.lerp(targetCamPos, 8 * dt);
          camera.lookAt(p.pos.clone().add(new THREE.Vector3(0, 0.4, -2).applyEuler(p.rot)));
        } else if (cameraView === 'COCKPIT') {
          // Position at pilot seat looking straight ahead out windshield
          const headOffset = new THREE.Vector3(0, 0.72, 1.2).applyEuler(p.rot);
          camera.position.copy(p.pos).add(headOffset);
          // Look down the nose
          const lookDir = new THREE.Vector3(0, 0.15, -15).applyEuler(p.rot);
          camera.lookAt(p.pos.clone().add(lookDir));
        } else {
          // Free Camera: slowly tracks airplane orbitally
          const orbitAngle = currentTime * 0.00015;
          camera.position.set(
            p.pos.x + Math.sin(orbitAngle) * 45,
            p.pos.y + 12,
            p.pos.z + Math.cos(orbitAngle) * 45
          );
          camera.lookAt(p.pos);
        }
      }

      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(animate);

    // RESIZE OBSERVER
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && mountRef.current) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {}
      }
    };
  }, [aircraft, cameraView, timeOfDay, activeLesson, weather]);

  // Turn off or on engine sounds
  const handleToggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      if (!next) {
        // Disconnect oscillators
        try {
          engineOscRef.current?.disconnect();
          windNoiseRef.current?.disconnect();
          stallOscRef.current?.disconnect();
        } catch (e) {}
        engineOscRef.current = null;
        windNoiseRef.current = null;
        stallOscRef.current = null;
        audioContextRef.current = null;
      } else {
        // Init audio context
        initAudio();
      }
      return next;
    });
  };

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
      <div className="flex flex-col h-full bg-slate-950 font-sans select-none items-center justify-center text-gray-200 p-6 relative">
        {/* Background ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center mb-4 text-sky-400 shadow-lg shadow-sky-500/5">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-1.5 flex items-center gap-1.5 justify-center">
              <span>Security Lock Enabled</span>
            </h3>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              This flight simulator requires authorization. Please enter the primary access key to unlock the aerodynamic systems.
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
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
                  className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all font-mono tracking-widest ${
                    passwordError 
                      ? 'border-red-500/60 focus:ring-red-500/40' 
                      : 'border-slate-800 focus:ring-sky-500/40 focus:border-sky-500/60'
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
                className="flex-1 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-sky-600/15 transition-all flex items-center justify-center gap-2"
              >
                Unlock Simulator
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 border border-slate-800 hover:bg-slate-800 hover:text-white text-gray-400 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans select-none overflow-hidden text-gray-200">
      
      {/* Flight Control Top Bar */}
      <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <Plane className="w-5 h-5 text-sky-400 animate-pulse" />
          <span className="font-bold tracking-tight text-sm text-sky-300">3D Aerodynamic Flight Simulator</span>
          
          {/* Preset selectors */}
          <div className="flex items-center gap-1.5 ml-4 text-xs bg-slate-950 border border-slate-800 p-0.5 rounded-md">
            <button 
              onClick={() => setAircraft('CESSNA')}
              className={`px-2 py-1 rounded transition-all ${aircraft === 'CESSNA' ? 'bg-sky-500 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Cessna 172
            </button>
            <button 
              onClick={() => setAircraft('JET')}
              className={`px-2 py-1 rounded transition-all ${aircraft === 'JET' ? 'bg-red-500 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              F-18 Jet
            </button>
            <button 
              onClick={() => setAircraft('GLIDER')}
              className={`px-2 py-1 rounded transition-all ${aircraft === 'GLIDER' ? 'bg-emerald-500 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Glider
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Preset */}
          <span className="text-[10px] text-gray-500 font-mono">TIME:</span>
          <div className="flex gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-md text-xs">
            <button onClick={() => setTimeOfDay('DAY')} className={`px-2 py-0.5 rounded ${timeOfDay === 'DAY' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-gray-400 hover:text-white'}`}>Day</button>
            <button onClick={() => setTimeOfDay('SUNSET')} className={`px-2 py-0.5 rounded ${timeOfDay === 'SUNSET' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}>Sunset</button>
            <button onClick={() => setTimeOfDay('NIGHT')} className={`px-2 py-0.5 rounded ${timeOfDay === 'NIGHT' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}>Night</button>
          </div>

          {/* Weather Preset */}
          <span className="text-[10px] text-gray-500 font-mono">WEATHER:</span>
          <div className="flex gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-md text-xs">
            <button onClick={() => setWeather('CALM')} className={`px-2 py-0.5 rounded ${weather === 'CALM' ? 'bg-sky-500 text-white' : 'text-gray-400'}`}>Calm</button>
            <button onClick={() => setWeather('WINDY')} className={`px-2 py-0.5 rounded ${weather === 'WINDY' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>Windy</button>
            <button onClick={() => setWeather('TURBULENT')} className={`px-2 py-0.5 rounded ${weather === 'TURBULENT' ? 'bg-red-500 text-white' : 'text-gray-400'}`}>Turbulent</button>
          </div>

          {/* Control style */}
          <button 
            onClick={() => setMouseSteering(!mouseSteering)}
            className={`px-2.5 py-1 rounded text-xs border ${mouseSteering ? 'border-sky-500/50 bg-sky-500/10 text-sky-400' : 'border-slate-800 text-gray-400 hover:text-white'}`}
          >
            {mouseSteering ? 'Mouse Yoke ON' : 'Keyboard steering'}
          </button>

          {/* Sound Toggle */}
          <button 
            onClick={handleToggleSound} 
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-gray-400 hover:text-white"
            title="Toggle Engine Audio Synthesis"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          {/* Close button */}
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white bg-red-600/10 hover:bg-red-600 border border-red-900/40 rounded px-2.5 py-1 text-xs font-bold"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div className="flex-1 flex relative">
        
        {/* Left Side: Aircraft Info & Keyboard help */}
        <div className="w-56 bg-slate-900/85 backdrop-blur-md border-r border-slate-800/80 p-3 z-10 flex flex-col justify-between absolute left-0 top-0 bottom-0 overflow-y-auto">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Info className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-xs uppercase tracking-wide text-gray-400">Aircraft Systems</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 mb-3 text-xs">
              <span className="font-bold text-sky-400 block mb-1">
                {aircraft === 'CESSNA' ? 'Cessna 172 Skyhawk' : aircraft === 'JET' ? 'F-18 Super Hornet' : 'ASG 29 Glider'}
              </span>
              <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                {aircraft === 'CESSNA' && 'Standard high-wing single-engine flight trainer. Stable aerodynamics, excellent response.'}
                {aircraft === 'JET' && 'Advanced multi-role high thrust tactical fighter. Hyper-sonic speeds and swift maneuver rates.'}
                {aircraft === 'GLIDER' && 'Unpowered aerodynamics platform. Relies entirely on thermal glides. Highly wind-sensitive.'}
              </p>
              <div className="space-y-1 text-[10px] font-mono text-gray-400 border-t border-slate-800/80 pt-2">
                <div className="flex justify-between"><span>Max Speed:</span><span className="text-white">{aircraft === 'JET' ? '350 Kts' : aircraft === 'GLIDER' ? '60 Kts' : '140 Kts'}</span></div>
                <div className="flex justify-between"><span>Empty Weight:</span><span className="text-white">{aircraft === 'JET' ? '10,400 Kg' : aircraft === 'GLIDER' ? '380 Kg' : '1,200 Kg'}</span></div>
                <div className="flex justify-between"><span>Yoke Authority:</span><span className="text-white">{aircraft === 'JET' ? 'High' : 'Medium'}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-xs uppercase tracking-wide text-gray-400">Mission/Lessons</span>
            </div>
            
            <div className="space-y-1.5">
              <button 
                onClick={() => { setActiveLesson('free'); setRingsPassed(0); }}
                className={`w-full text-left p-2 rounded-lg border text-xs flex justify-between items-center transition-all ${activeLesson === 'free' ? 'border-sky-500 bg-sky-500/10 text-white' : 'border-slate-800 hover:bg-slate-800/40 text-gray-400'}`}
              >
                <span>Free Flight Mode</span>
                <Navigation className="w-3.5 h-3.5" />
              </button>

              {lessons.map(les => (
                <button
                  key={les.id}
                  onClick={() => setActiveLesson(les.id)}
                  className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex flex-col gap-0.5 ${activeLesson === les.id ? 'border-sky-500 bg-sky-500/10 text-white' : 'border-slate-800 hover:bg-slate-800/40 text-gray-400'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-[11px]">{les.title}</span>
                    {les.completed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Award className="w-3.5 h-3.5 text-gray-600" />}
                  </div>
                  <span className="text-[10px] text-gray-400 leading-tight">{les.description}</span>
                  {les.id === 'rings' && (
                    <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(ringsPassed / 6) * 100}%` }}></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-2 text-[10px] space-y-1 font-mono text-gray-400 mt-3">
            <span className="font-bold text-gray-300 block mb-1">YOKE KEYBOARD BINDINGS</span>
            <div className="flex justify-between"><span>Pitch:</span><span className="text-sky-300">S (Climb) / W (Descend)</span></div>
            <div className="flex justify-between"><span>Roll:</span><span className="text-sky-300">A (Left) / D (Right)</span></div>
            <div className="flex justify-between"><span>Throttle:</span><span className="text-amber-400">I (Increase) / K (Decrease)</span></div>
            <div className="flex justify-between"><span>Rudder/Yaw:</span><span className="text-white">Q (Left) / E (Right)</span></div>
            <div className="flex justify-between"><span>Flaps:</span><span className="text-emerald-400">F (Down) / V (Up)</span></div>
            <div className="flex justify-between"><span>Brakes:</span><span className="text-red-400">B (Hold wheel brakes)</span></div>
            <div className="flex justify-between"><span>Gear:</span><span className="text-white">G (Toggle wheels)</span></div>
            <div className="flex justify-between"><span>Camera:</span><span className="text-white">C (Cycle camera views)</span></div>
            <div className="flex justify-between"><span>Reset Flight:</span><span className="text-white">SPACEBAR</span></div>
          </div>
        </div>

        {/* 3D WebGL render mount */}
        <div ref={mountRef} className="flex-1 w-full h-full relative cursor-crosshair">

          {/* Mouse Yoke steering indicator (little circle in center showing offset) */}
          {mouseSteering && flightStatus !== 'CRASHED' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-20 h-20 border border-white/10 rounded-full flex items-center justify-center relative">
                <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                {/* Drag target indicator */}
                <div 
                  className="w-4 h-4 bg-red-500 border border-white rounded-full absolute shadow-lg transition-transform duration-75"
                  style={{
                    transform: `translate(${pRef.current.mouseYoke.x * 40}px, ${-pRef.current.mouseYoke.y * 40}px)`
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* STALL WARNING ALERT OVERLAY */}
          {stallWarning && !onGround && (
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 border-2 border-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce z-10">
              <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
              <div className="text-left">
                <span className="font-bold text-sm tracking-widest text-white uppercase block">STALL WARNING</span>
                <span className="text-[10px] text-red-100 font-mono">AIRSPEED TOO LOW! DECREASE PITCH & MAX THROTTLE</span>
              </div>
            </div>
          )}

          {/* CRASH DIALOG */}
          {flightStatus === 'CRASHED' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 z-30">
              <div className="max-w-md bg-slate-900 border border-red-500/50 rounded-2xl p-6 text-center shadow-2xl">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-red-500 tracking-tight mb-2">Aircraft Crashed</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  You collided with the terrain at an excessive angle or rate of descent. Safe flight rules mandate careful glidepath alignment.
                </p>
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => resetFlight()}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-lg transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Flight
                  </button>
                  <button 
                    onClick={() => { setActiveLesson('free'); resetFlight(); }}
                    className="border border-slate-700 hover:bg-slate-800 text-gray-300 text-xs px-4 py-2.5 rounded-lg transition-all"
                  >
                    Free Flight Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESSFUL LANDING DIALOG */}
          {flightStatus === 'SAFE_LANDING' && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 z-30">
              <div className="max-w-md bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 text-center shadow-2xl">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400 tracking-tight mb-2">Successful Landing!</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Excellent glide slope control. Landing gear was deployed, airspeed was stable, and descent rate was safe.
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs mb-6 font-mono text-left">
                  <div className="flex justify-between py-1 border-b border-slate-900"><span>Landing Grade:</span><span className="text-emerald-400 font-bold">{landingGrade}</span></div>
                  <div className="flex justify-between py-1 border-b border-slate-900"><span>Altitude on Flare:</span><span className="text-white">~5 Ft</span></div>
                  <div className="flex justify-between py-1"><span>Target Mission Completion:</span><span className="text-amber-400">Yes</span></div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => { resetFlight(); }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-lg transition-all"
                  >
                    Fly Again
                  </button>
                  <button 
                    onClick={() => { setActiveLesson('rings'); }}
                    className="border border-slate-700 hover:bg-slate-800 text-gray-300 text-xs px-4 py-2.5 rounded-lg transition-all"
                  >
                    Try Mountain Rings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Controls toggle instruction overlay */}
          {showControlsInfo && (
            <div className="absolute right-4 top-4 w-72 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-[11px] z-10 leading-relaxed text-gray-300 shadow-xl">
              <div className="flex justify-between items-center mb-1.5 border-b border-slate-800 pb-1">
                <span className="font-bold text-sky-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> How to Fly
                </span>
                <button onClick={() => setShowControlsInfo(false)} className="text-gray-500 hover:text-white font-bold font-mono">×</button>
              </div>
              <p className="mb-2">
                <strong>Pitch Control (S/W or Mouse):</strong> Press <strong>S</strong> (or drag mouse down) to pull back the yoke and climb. Press <strong>W</strong> (or drag mouse up) to descend.
              </p>
              <p className="mb-2">
                <strong>Steer / Roll (A/D or Mouse):</strong> Bank left/right. The aircraft will turn beautifully into the roll.
              </p>
              <p className="mb-2">
                <strong>Throttle (I/K):</strong> Keep throttle above 55% during takeoff and climb, but reduce to 40% for landing.
              </p>
              <p className="text-gray-400 font-mono text-[9px]">
                *Tip: Use <strong>C</strong> to swap between internal Cockpit view and third-person Chase camera!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Glass Cockpit Instrument Dashboard Pane */}
      <div className="h-40 bg-slate-950 border-t border-slate-800 flex items-center justify-around px-6 py-2.5 z-20 shadow-2xl relative">
        
        {/* Gauge 1: Airspeed Tape (Primary Flight Display style) */}
        <div className="w-28 h-full bg-slate-900/95 border border-slate-800 rounded-xl p-1.5 flex flex-col justify-between items-center relative font-mono overflow-hidden">
          <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider">Speed Tape</span>
          
          <div className="flex-1 w-full relative flex items-center justify-center">
            {/* Speed scroll background */}
            <div className="absolute right-2 top-0 bottom-0 w-8 border-l border-white/5 bg-slate-950/80 rounded flex flex-col justify-around text-[10px] text-gray-500 items-end pr-1">
              <span className={airspeed > 110 ? 'text-red-400 font-bold' : ''}>120</span>
              <span className={airspeed > 90 ? 'text-yellow-400' : ''}>100</span>
              <span>80</span>
              <span>60</span>
              <span className={airspeed < 45 ? 'text-red-400 animate-pulse' : ''}>40</span>
              <span>20</span>
            </div>

            {/* Big center readout */}
            <div className="absolute left-1 border border-sky-500/20 bg-slate-900 px-2 py-1 rounded shadow-inner text-center">
              <span className="text-[20px] font-bold text-sky-300 block leading-none">{airspeed}</span>
              <span className="text-[9px] text-sky-500 font-bold">KNOTS</span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${airspeed < 45 ? 'bg-red-500' : 'bg-sky-500'}`} style={{ width: `${Math.min(100, (airspeed / 140) * 100)}%` }}></div>
          </div>
        </div>

        {/* Gauge 2: Primary Flight Display (Attitude Horizon Indicator) */}
        <div className="w-52 h-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex flex-col justify-between items-center relative overflow-hidden">
          <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider">Attitude Indicator</span>
          
          <div className="flex-1 w-full relative overflow-hidden rounded-lg bg-indigo-500">
            {/* Sky / Ground pitch translation div */}
            <div 
              className="absolute inset-0 transition-all duration-75"
              style={{
                background: 'linear-gradient(to bottom, #38bdf8 50%, #7c2d12 50%)',
                transform: `translateY(${pitch * 1.8}px) rotate(${-roll}deg)`,
                transformOrigin: 'center'
              }}
            >
              {/* Pitch grid lines */}
              <div className="absolute inset-0 flex flex-col justify-around text-[8px] text-white/50 font-mono select-none">
                <div className="w-full border-t border-white/20 flex justify-center"><span>+10°</span></div>
                <div className="w-full border-t border-white/20 flex justify-center"><span>+5°</span></div>
                <div className="w-full border-t border-white/50 flex justify-center"><span>0°</span></div>
                <div className="w-full border-t border-white/20 flex justify-center"><span>-5°</span></div>
                <div className="w-full border-t border-white/20 flex justify-center"><span>-10°</span></div>
              </div>
            </div>

            {/* Static aircraft crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-1 bg-yellow-400 rounded-full relative">
                <div className="w-3 h-3 border-2 border-yellow-400 rounded-full absolute -top-1 left-4.5 bg-slate-900"></div>
                <div className="w-1 h-3 bg-yellow-400 absolute left-0 -top-1"></div>
                <div className="w-1 h-3 bg-yellow-400 absolute right-0 -top-1"></div>
              </div>
            </div>

            {/* Roll tick indices arc */}
            <div className="absolute top-1 left-0 right-0 text-center text-[8px] font-mono text-white/40">
              {roll}° ROLL
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-mono flex gap-3 mt-1">
            <span>PITCH: <strong className="text-white">{pitch}°</strong></span>
            <span>ROLL: <strong className="text-white">{roll}°</strong></span>
          </div>
        </div>

        {/* Gauge 3: Altimeter (Altitude & Vertical Speed Indicator) */}
        <div className="w-32 h-full bg-slate-900/95 border border-slate-800 rounded-xl p-1.5 flex flex-col justify-between items-center relative font-mono overflow-hidden">
          <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider">Altimeter</span>
          
          <div className="flex-1 w-full relative flex items-center justify-center">
            {/* Scroll tape ticks */}
            <div className="absolute right-1 top-0 bottom-0 w-8 border-l border-white/5 bg-slate-950/80 rounded flex flex-col justify-around text-[10px] text-gray-500 items-end pr-1">
              <span>2000</span>
              <span>1500</span>
              <span>1000</span>
              <span>500</span>
              <span>0</span>
            </div>

            {/* Big alt readout */}
            <div className="absolute left-1 border border-sky-500/20 bg-slate-900 px-1.5 py-1 rounded shadow-inner text-center">
              <span className="text-[18px] font-bold text-sky-300 block leading-none">{altitude}</span>
              <span className="text-[8px] text-sky-500 font-bold">FEET MSL</span>
            </div>
          </div>

          <div className="w-full flex justify-between text-[8px] text-gray-400 border-t border-slate-800 pt-1 px-1">
            <span>VS: <strong className={`${climbRate < -200 ? 'text-red-400' : (climbRate > 200 ? 'text-emerald-400' : 'text-gray-300')}`}>{climbRate} fpm</strong></span>
            <span>G: <strong className="text-amber-400">{gForce}</strong></span>
          </div>
        </div>

        {/* Gauge 4: Heading compass / Compass Rose strip */}
        <div className="w-40 h-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex flex-col justify-between items-center relative font-mono">
          <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider">Compass Rose</span>
          
          <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg relative flex items-center justify-center overflow-hidden">
            {/* Sliding compass strip */}
            <div 
              className="absolute h-6 flex items-center gap-4 text-[10px] text-sky-400/80 transition-transform duration-75"
              style={{
                transform: `translateX(${(heading - 180) * -1.5}px)`
              }}
            >
              <span className="text-red-500 font-bold">N</span><span>030</span><span>060</span><span className="text-white font-bold">E</span><span>120</span><span>150</span><span className="text-white font-bold">S</span><span>210</span><span>240</span><span className="text-white font-bold">W</span><span>300</span><span>330</span>
            </div>
            
            {/* Static center heading pointer */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-xl z-10">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-yellow-400 absolute -top-0.5 -left-1"></div>
            </div>
          </div>

          <span className="text-[14px] font-bold text-white tracking-wider">
            {heading}° {heading < 23 || heading >= 337 ? 'N' : heading < 67 ? 'NE' : heading < 113 ? 'E' : heading < 158 ? 'SE' : heading < 203 ? 'S' : heading < 248 ? 'SW' : heading < 293 ? 'W' : 'NW'}
          </span>
        </div>

        {/* Gauge 5: Engine parameters and Flaps settings */}
        <div className="w-48 h-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex gap-2 font-mono">
          
          {/* Left half: RPM dial */}
          <div className="flex-1 flex flex-col justify-between text-center border-r border-slate-800 pr-1.5">
            <span className="text-[8px] text-sky-400 font-bold uppercase">Throttle / RPM</span>
            
            <div className="bg-slate-950 rounded py-1 px-1.5 border border-slate-800/60 my-1">
              <span className="text-[10px] text-gray-500 block">THROTTLE</span>
              <span className="text-xs font-bold text-white">{Math.round(throttle)}%</span>
            </div>

            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${throttle}%` }}></div>
            </div>
          </div>

          {/* Right half: flaps indicator */}
          <div className="flex-1 flex flex-col justify-between text-center pl-1">
            <span className="text-[8px] text-sky-400 font-bold uppercase">Aerofoil Flaps</span>
            
            <div className="space-y-1 my-1">
              <div className="flex justify-between text-[9px] text-gray-400"><span>Flaps:</span><span className="text-white font-bold">{flaps}°</span></div>
              <div className="flex justify-between text-[9px] text-gray-400"><span>Gear:</span><span className={gearDown ? 'text-emerald-400 font-bold' : 'text-red-400'}>{gearDown ? 'DOWN' : 'RETRACT'}</span></div>
            </div>

            <div className="grid grid-cols-4 gap-0.5 w-full bg-slate-950 p-0.5 rounded">
              <div className={`h-2.5 rounded-sm ${flaps >= 0 ? 'bg-emerald-500' : 'bg-slate-850'}`}></div>
              <div className={`h-2.5 rounded-sm ${flaps >= 10 ? 'bg-emerald-500' : 'bg-slate-850'}`}></div>
              <div className={`h-2.5 rounded-sm ${flaps >= 20 ? 'bg-emerald-500' : 'bg-slate-850'}`}></div>
              <div className={`h-2.5 rounded-sm ${flaps >= 30 ? 'bg-emerald-500' : 'bg-slate-850'}`}></div>
            </div>
          </div>
        </div>

        {/* Gauge 6: GPS mini maps navigation */}
        <div className="w-48 h-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex flex-col justify-between relative font-mono overflow-hidden">
          <div className="flex justify-between items-center text-[9px] text-sky-400 font-bold uppercase tracking-wide">
            <span>ND MAP / GPS</span>
            <span className="text-[8px] text-gray-500 font-normal">RANGE 4NM</span>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg relative overflow-hidden flex items-center justify-center">
            {/* Drawing simplified runway line on GPS map */}
            <svg viewBox="0 0 100 100" className="w-full h-full p-1 opacity-75">
              {/* Grid lines */}
              <circle cx="50" cy="50" r="22" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              
              <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" />

              {/* Runway marker (Z dimension points north on map) */}
              <rect x="47" y="20" width="6" height="40" fill="#475569" rx="1" />
              <text x="50" y="16" fontSize="5" fill="#94a3b8" textAnchor="middle">RWY 36</text>

              {/* Target mission rings beacons on GPS */}
              {activeLesson === 'rings' && (
                <g>
                  <circle cx="25" cy="30" r="2" fill="#eab308" />
                  <circle cx="15" cy="45" r="2" fill="#eab308" />
                  <circle cx="35" cy="65" r="2" fill="#eab308" />
                  <path d="M 15 45 L 25 30 L 35 65" stroke="#eab308" strokeWidth="0.5" strokeDasharray="1,1" fill="none" />
                </g>
              )}

              {/* Compass ticks on edge */}
              <text x="50" y="8" fontSize="6" fill="#ef4444" textAnchor="middle" fontWeight="bold">N</text>
              <text x="94" y="52" fontSize="5" fill="#94a3b8" textAnchor="middle">E</text>
              <text x="50" y="96" fontSize="5" fill="#94a3b8" textAnchor="middle">S</text>
              <text x="6" y="52" fontSize="5" fill="#94a3b8" textAnchor="middle">W</text>

              {/* Plane position pointer (rotates dynamically with bank) */}
              <g transform={`translate(50, 50) rotate(${heading})`}>
                <polygon points="0,-6 -4,4 -1,2 0,3 1,2 4,4" fill="#60a5fa" stroke="#ffffff" strokeWidth="0.5" />
              </g>
            </svg>
          </div>

          <div className="flex justify-between text-[8px] text-gray-500">
            <span>DME: <strong>1.2 NM</strong></span>
            <span>FREQ: <strong>108.00</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
}
