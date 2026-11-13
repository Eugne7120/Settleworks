import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import {
  ProtocolState,
  quoteCanonicalSwap,
} from '../protocol/settleworksEngine';

export type NavTab = 'hall' | 'swap' | 'desk' | 'bazaar' | 'rarity' | 'blueprint';

interface SanctuaryHero3DProps {
  protocol: ProtocolState;
  isDark: boolean;
  onNavigate: (tab: NavTab) => void;
  onExecuteSwap: (direction: 'BUY_WORKS' | 'SELL_WORKS', amount: number) => void;
  onMaterializeQuick: () => void;
}

export const SanctuaryHero3D: React.FC<SanctuaryHero3DProps> = ({
  protocol,
  isDark,
  onNavigate,
  onExecuteSwap,
  onMaterializeQuick,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneSvgRef = useRef<SVGSVGElement | null>(null);
  const leftSpoolRef = useRef<SVGGElement | null>(null);
  const rightSpoolRef = useRef<SVGGElement | null>(null);
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  const [swapInputUSDG, setSwapInputUSDG] = useState<string>('250');
  const [swapMode, setSwapMode] = useState<'BUY_WORKS' | 'SELL_WORKS'>('BUY_WORKS');
  const [tradeFeedback, setTradeFeedback] = useState<string | null>(null);
  const [cameraFocus, setCameraFocus] = useState<'center' | 'bazaar' | 'desk'>('center');
  const cameraTargetRef = useRef<{ x: number; y: number; z: number; lookX: number }>({
    x: 0,
    y: 2.35,
    z: 8.6,
    lookX: 0,
  });

  const numericInput = parseFloat(swapInputUSDG) || 0;
  const quote = quoteCanonicalSwap(protocol, swapMode, numericInput);

  const handleFocusMonument = (focus: 'center' | 'bazaar' | 'desk', targetTab?: NavTab) => {
    setCameraFocus(focus);
    const coords =
      focus === 'bazaar'
        ? { x: -2.4, y: 2.3, z: 7.5, lookX: -2.9 }
        : focus === 'desk'
        ? { x: 2.4, y: 2.3, z: 7.5, lookX: 2.8 }
        : { x: 0, y: 2.35, z: 8.6, lookX: 0 };

    if (sceneSvgRef.current) {
      const panX = focus === 'bazaar' ? 42 : focus === 'desk' ? -42 : 0;
      const scale = focus === 'center' ? 1 : 1.035;
      gsap.to(sceneSvgRef.current, {
        x: panX,
        scale,
        duration: 0.65,
        ease: 'power3.out',
      });
    }

    gsap.to(cameraTargetRef.current, {
      ...coords,
      duration: 0.65,
      ease: 'power3.out',
      onComplete: () => {
        if (targetTab) {
          onNavigate(targetTab);
        }
      },
    });
  };

  const handleTradeSubmit = (mode: 'BUY_WORKS' | 'SELL_WORKS') => {
    setSwapMode(mode);
    const amt = parseFloat(swapInputUSDG);
    if (!Number.isFinite(amt) || amt <= 0) {
      setTradeFeedback('Enter a valid amount above 0');
      return;
    }
    if (mode === 'BUY_WORKS' && amt > protocol.userUSDG) {
      setTradeFeedback('Insufficient USDG balance');
      return;
    }
    if (mode === 'SELL_WORKS' && amt > protocol.userWORKS) {
      setTradeFeedback('Insufficient $WORKS balance');
      return;
    }
    onExecuteSwap(mode, amt);
    const q = quoteCanonicalSwap(protocol, mode, amt);
    setTradeFeedback(
      mode === 'BUY_WORKS'
        ? `Executed: +${q.outputAmount.toFixed(3)} $WORKS (Fee: ${q.feeUSDG.toFixed(2)} USDG)`
        : `Executed: +${q.outputAmount.toFixed(2)} USDG (Fee: ${q.feeUSDG.toFixed(2)} USDG)`
    );
    window.setTimeout(() => setTradeFeedback(null), 4000);
  };

  useEffect(() => {
    // Animate magnetic spools continuously with GSAP
    let reelTweenL: gsap.core.Tween | null = null;
    let reelTweenR: gsap.core.Tween | null = null;
    if (leftSpoolRef.current && rightSpoolRef.current) {
      reelTweenL = gsap.to(leftSpoolRef.current, {
        rotation: 360,
        transformOrigin: '50% 50%',
        duration: 8,
        repeat: -1,
        ease: 'none',
      });
      reelTweenR = gsap.to(rightSpoolRef.current, {
        rotation: -360,
        transformOrigin: '50% 50%',
        duration: 8,
        repeat: -1,
        ease: 'none',
      });
    }

    const container = canvasMountRef.current;
    if (!container) {
      return () => {
        reelTweenL?.kill();
        reelTweenR?.kill();
      };
    }

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 1440;
    const height = container.clientHeight || 740;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 2.35, 8.6);
    camera.lookAt(0, 2.05, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      return () => {
        reelTweenL?.kill();
        reelTweenR?.kill();
      };
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x475569, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    keyLight.position.set(-6, 10, 8);
    scene.add(keyLight);

    // Floating 3D Precision Telemetry Particles & Ring Gyroscope above Central Altar
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x4fffb0,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const gyroGroup = new THREE.Group();
    gyroGroup.position.set(0, 4.15, 0.2);
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 12, 36), ringMat);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 12, 32), ringMat);
    innerRing.rotation.x = Math.PI / 3;
    gyroGroup.add(outerRing, innerRing);
    scene.add(gyroGroup);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 740;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let prevTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;

      outerRing.rotation.y += dt * 1.1;
      innerRing.rotation.z -= dt * 1.5;

      const target = cameraTargetRef.current;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, 4.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, 4.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, 4.5, dt);
      camera.lookAt(target.lookX, 2.05, 0);

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      reelTweenL?.kill();
      reelTweenR?.kill();
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  const spotPrice = (protocol.curveReserveUSDG / protocol.curveReserveWORKS).toFixed(2);

  return (
    <section
      className="relative w-full min-h-[710px] lg:h-[760px] overflow-hidden select-none border-b border-black/10 dark:border-white/10"
      data-testid="sanctuary-hero-3d"
    >
      {/* Architectural 3D Monument Sanctuary Scene Layer (5 Precision Machines on Carrara Marble Pedestals matching Screenshot 6!) */}
      <svg
        ref={sceneSvgRef}
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          {/* Sky Atmosphere Gradient */}
          <linearGradient id="sanctuary-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#080C14' : '#B8C7D4'} />
            <stop offset="52%" stopColor={isDark ? '#101722' : '#D5DDE0'} />
            <stop offset="82%" stopColor={isDark ? '#151B24' : '#E7E4DC'} />
            <stop offset="100%" stopColor={isDark ? '#0E1218' : '#DCD8CE'} />
          </linearGradient>

          {/* Sunlit Ivory Casing Gradient */}
          <linearGradient id="ivory-front" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#2C323D' : '#EFECE4'} />
            <stop offset="100%" stopColor={isDark ? '#1F242D' : '#D5D0C5'} />
          </linearGradient>

          <linearGradient id="ivory-side" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#1A1E26' : '#B7B2A6'} />
            <stop offset="100%" stopColor={isDark ? '#12151B' : '#969185'} />
          </linearGradient>

          {/* Carrara Veined Marble Surface Pattern */}
          <pattern id="carrara-marble" width="220" height="220" patternUnits="userSpaceOnUse">
            <rect width="220" height="220" fill={isDark ? '#252A34' : '#EBE8E1'} />
            <path
              d="M 10,0 Q 55,60 35,120 T 95,220 M 120,0 Q 150,80 110,150 T 175,220 M 60,40 L 130,95 M 140,120 L 205,175"
              fill="none"
              stroke={isDark ? 'rgba(148,163,184,0.22)' : 'rgba(51,65,85,0.28)'}
              strokeWidth="2.4"
            />
            <path
              d="M 25,20 Q 80,50 70,110 M 155,10 Q 125,75 180,140"
              fill="none"
              stroke={isDark ? 'rgba(148,163,184,0.12)' : 'rgba(71,85,105,0.16)'}
              strokeWidth="1.2"
            />
          </pattern>

          <filter id="soft-shadow" x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#000000" floodOpacity="0.24" />
          </filter>
        </defs>

        {/* Sky Backdrop */}
        <rect width="1440" height="760" fill="url(#sanctuary-sky)" />

        {/* Sculpted Volumetric Clouds (Left & Right Upper Sky matching Screenshot 6) */}
        <g opacity={isDark ? 0.16 : 0.88} filter="url(#soft-shadow)">
          {/* Left Cloud Cluster */}
          <g transform="translate(210, 95)">
            <ellipse cx="110" cy="52" rx="95" ry="34" fill="#F8FAFC" />
            <circle cx="65" cy="36" r="38" fill="#FFFFFF" />
            <circle cx="118" cy="28" r="46" fill="#FFFFFF" />
            <circle cx="165" cy="42" r="34" fill="#F1F5F9" />
          </g>
          {/* Right Cloud Cluster */}
          <g transform="translate(980, 78)">
            <ellipse cx="135" cy="60" rx="115" ry="38" fill="#F8FAFC" />
            <circle cx="85" cy="42" r="44" fill="#FFFFFF" />
            <circle cx="142" cy="30" r="54" fill="#FFFFFF" />
            <circle cx="198" cy="46" r="40" fill="#F1F5F9" />
          </g>
        </g>

        {/* Ground Courtyard Stone Horizon */}
        <rect
          x="0"
          y="595"
          width="1440"
          height="165"
          fill={isDark ? '#11151C' : '#DDD9CE'}
        />
        <line
          x1="0"
          y1="595"
          x2="1440"
          y2="595"
          stroke={isDark ? '#262F3D' : '#C2BDB0'}
          strokeWidth="2"
        />

        {/* ============================================================
            MONUMENT 1 (FAR LEFT): REEL-TO-REEL BAZAAR TOWER & MARBLE PEDESTAL
           ============================================================ */}
        <g filter="url(#soft-shadow)">
          {/* Marble Pedestal 1 */}
          <rect x="44" y="485" width="194" height="150" rx="3" fill="url(#carrara-marble)" stroke="#94A3B8" strokeWidth="1" />
          <polygon points="238,485 262,470 262,620 238,635" fill="url(#ivory-side)" />

          {/* Tall Reel-to-Reel Machine Body */}
          <rect x="48" y="185" width="186" height="300" rx="6" fill="url(#ivory-front)" stroke="#94A3B8" strokeWidth="1.2" />
          {/* 3D Right Side Depth Wall */}
          <polygon points="234,185 262,172 262,470 234,485" fill="url(#ivory-side)" />
          {/* Side Ventilation Louvers */}
          {[205, 220, 235, 250, 265, 280, 295].map((ly) => (
            <line key={ly} x1="240" y1={ly} x2="256" y2={ly - 7} stroke="#475569" strokeWidth="2.5" />
          ))}

          {/* Curling Settlement Receipt Tape emerging from Right Side of Machine 1 (matching Screenshot 6!) */}
          <path
            d="M 248 405 Q 278 425, 268 475 T 288 538 L 270 544 Q 250 485, 258 440 T 242 412 Z"
            fill="#F8FAFC"
            stroke="#64748B"
            strokeWidth="1.2"
          />
          <line x1="256" y1="435" x2="266" y2="432" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="258" y1="455" x2="268" y2="452" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="262" y1="478" x2="272" y2="475" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Dual Rotating Magnetic Spools at Top of Tower 1 */}
          <g ref={leftSpoolRef} transform="translate(100, 238)">
            <circle cx="0" cy="0" r="36" fill="#42352D" stroke="#1E293B" strokeWidth="2" />
            <circle cx="0" cy="0" r="12" fill="#E2E8F0" />
            <line x1="-26" y1="0" x2="26" y2="0" stroke="#CBD5E1" strokeWidth="3" />
            <line x1="0" y1="-26" x2="0" y2="26" stroke="#CBD5E1" strokeWidth="3" />
          </g>
          <g ref={rightSpoolRef} transform="translate(182, 238)">
            <circle cx="0" cy="0" r="36" fill="#42352D" stroke="#1E293B" strokeWidth="2" />
            <circle cx="0" cy="0" r="12" fill="#E2E8F0" />
            <line x1="-26" y1="0" x2="26" y2="0" stroke="#CBD5E1" strokeWidth="3" />
            <line x1="0" y1="-26" x2="0" y2="26" stroke="#CBD5E1" strokeWidth="3" />
          </g>

          {/* Indicator Lights Row */}
          <circle cx="114" cy="292" r="4" fill="#EF4444" />
          <circle cx="132" cy="292" r="4" fill="#F59E0B" />
          <circle cx="150" cy="292" r="4" fill="#10B981" />
          <circle cx="168" cy="292" r="4" fill="#38BDF8" />

          {/* Lower Ventilation Grill Bars on Tower 1 */}
          {[442, 452, 462, 472].map((gy) => (
            <line key={gy} x1="68" y1={gy} x2="214" y2={gy} stroke="#475569" strokeWidth="3" />
          ))}
        </g>

        {/* ============================================================
            MONUMENT 2 (INNER LEFT): COMPACT GREY SCOPE TERMINAL & MARBLE PEDESTAL
           ============================================================ */}
        <g filter="url(#soft-shadow)">
          {/* Tall Marble Pedestal 2 */}
          <rect x="284" y="425" width="184" height="195" rx="3" fill="url(#carrara-marble)" stroke="#94A3B8" strokeWidth="1" />
          {/* Base Platen Unit */}
          <rect x="292" y="382" width="168" height="43" rx="3" fill="#687078" stroke="#334155" strokeWidth="1" />
          {/* CRT Monitor Housing */}
          <rect x="298" y="242" width="156" height="140" rx="10" fill="url(#ivory-front)" stroke="#64748B" strokeWidth="1.5" />
        </g>

        {/* ============================================================
            MONUMENT 3 (CENTER HERO): MONUMENTAL CANONICAL MAINFRAME, STAND, KEYBOARD & STEPPED MARBLE ALTAR
           ============================================================ */}
        <g filter="url(#soft-shadow)">
          {/* Lower Stepped Marble Altar */}
          <rect x="445" y="575" width="550" height="72" rx="3" fill="url(#carrara-marble)" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Upper Stepped Marble Altar */}
          <rect x="495" y="518" width="450" height="62" rx="3" fill="url(#carrara-marble)" stroke="#94A3B8" strokeWidth="1.2" />

          {/* Mainframe Monitor Stand Neck */}
          <polygon points="655,455 785,455 805,518 635,518" fill="url(#ivory-side)" stroke="#64748B" strokeWidth="1" />

          {/* Giant Outer Sculpted Ivory Monitor Bezel (Frames the Central Interactive Console!) */}
          <rect
            x="456"
            y="108"
            width="528"
            height="358"
            rx="26"
            fill="url(#ivory-front)"
            stroke="#94A3B8"
            strokeWidth="2"
          />
          {/* Inner Bevel Rim */}
          <rect
            x="472"
            y="122"
            width="496"
            height="330"
            rx="18"
            fill="#151C23"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Top Mint-Cyan Commissioning Cap Strip (matching Screenshot 6!) */}
          <rect x="570" y="100" width="300" height="10" rx="4" fill="#6EE7B7" stroke="#059669" strokeWidth="1" />

          {/* 3D Mechanical Keyboard resting on the Upper Marble Altar */}
          <polygon
            points="610,502 830,502 848,526 592,526"
            fill="url(#ivory-front)"
            stroke="#64748B"
            strokeWidth="1.2"
          />
          {/* Sculpted Keycap Matrix on Keyboard */}
          <polygon points="622,506 818,506 830,520 610,520" fill="#334155" />
          <line x1="618" y1="511" x2="822" y2="511" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="8 4" />
          <line x1="614" y1="516" x2="826" y2="516" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="8 4" />
        </g>

        {/* ============================================================
            MONUMENT 4 (INNER RIGHT): CLASSICAL PEDIMENT TEMPLE VAULT & MARBLE PEDESTAL
           ============================================================ */}
        <g filter="url(#soft-shadow)">
          {/* Marble Pedestal 4 */}
          <rect x="972" y="425" width="190" height="195" rx="3" fill="url(#carrara-marble)" stroke="#94A3B8" strokeWidth="1" />

          {/* Temple Base & Fluted Columns */}
          <rect x="962" y="402" width="210" height="24" rx="2" fill="url(#ivory-front)" stroke="#94A3B8" strokeWidth="1" />
          <rect x="974" y="242" width="186" height="160" fill="url(#ivory-front)" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Left & Right Fluted Pilasters */}
          <rect x="978" y="246" width="18" height="152" fill="url(#ivory-side)" />
          <rect x="1138" y="246" width="18" height="152" fill="url(#ivory-side)" />

          {/* Classical Triangular Pediment Roof (matching Screenshot 6!) */}
          <polygon
            points="954,242 1067,168 1180,242"
            fill="url(#ivory-front)"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          <polygon
            points="976,236 1067,180 1158,236"
            fill="url(#ivory-side)"
          />
        </g>

        {/* ============================================================
            MONUMENT 5 (FAR RIGHT): PORTABLE FIELD TERMINAL LAPTOP & LOW MARBLE BLOCK
           ============================================================ */}
        <g filter="url(#soft-shadow)">
          {/* Low Marble Pedestal 5 */}
          <rect x="1194" y="510" width="198" height="120" rx="3" fill="url(#carrara-marble)" stroke="#94A3B8" strokeWidth="1" />

          {/* Dark Charcoal Portable Field Terminal Screen Housing */}
          <rect
            x="1208"
            y="302"
            width="170"
            height="168"
            rx="8"
            fill="#4B525A"
            stroke="#1E293B"
            strokeWidth="1.5"
          />
          {/* Angled Keyboard Wedge */}
          <polygon
            points="1208,470 1378,470 1396,512 1190,512"
            fill="#5A626A"
            stroke="#1E293B"
            strokeWidth="1.5"
          />
          <polygon points="1212,476 1374,476 1384,502 1202,502" fill="#1E242B" />
          <line x1="1210" y1="484" x2="1376" y2="484" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="1206" y1="493" x2="1380" y2="493" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 4" />
        </g>

        {/* Botanical Grass / Moss Accents at Marble Pedestal Bases (matching Screenshot 6!) */}
        <g stroke={isDark ? '#2E4C38' : '#4A644E'} strokeWidth="2" fill="none">
          <path d="M 32,625 L 24,598 M 36,625 L 36,594 M 40,625 L 48,602" />
          <path d="M 272,620 L 265,595 M 276,620 L 278,590 M 280,620 L 288,598" />
          <path d="M 438,642 L 428,612 M 442,642 L 442,608 M 446,642 L 455,616" />
          <path d="M 1002,642 L 994,615 M 1006,642 L 1008,610 M 1010,642 L 1018,618" />
          <path d="M 1395,625 L 1388,600 M 1399,625 L 1402,594 M 1403,625 L 1412,604" />
        </g>
      </svg>

      {/* Dedicated Isolated Three.js WebGL Overlay Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Semantic Interactive CRT Overlays aligned inside the 5 3D Monuments */}
      <div className="relative z-10 max-w-[1440px] mx-auto h-full px-4 sm:px-8 pt-4 pb-16 flex flex-col justify-between">
        {/* Top Context Strip & Camera Preset Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-800 dark:text-slate-200 bg-white/85 dark:bg-[#11151C]/90 px-3 py-1.5 rounded-md border border-black/10 dark:border-white/10 shadow-sm">
            <span className="font-semibold text-[#0284C7] dark:text-[#38BDF8]">CHAIN 4663</span>
            <span aria-hidden="true">·</span>
            <span>ROBINHOOD CHAIN MAINNET</span>
            <span aria-hidden="true">·</span>
            <span>4,663 SETTLE ENGINES</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/85 dark:bg-[#11151C]/90 p-1 rounded-lg border border-black/10 dark:border-white/10 shadow-sm">
            <button
              type="button"
              onClick={() => handleFocusMonument('bazaar')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                cameraFocus === 'bazaar'
                  ? 'bg-[#0B1014] text-[#4FFFB0]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Focus: Bazaar Plinth
            </button>
            <button
              type="button"
              onClick={() => handleFocusMonument('center')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                cameraFocus === 'center'
                  ? 'bg-[#0B1014] text-[#4FFFB0]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Center Sanctuary
            </button>
            <button
              type="button"
              onClick={() => handleFocusMonument('desk')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                cameraFocus === 'desk'
                  ? 'bg-[#0B1014] text-[#4FFFB0]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              Focus: Desk Plinth
            </button>
          </div>
        </div>

        {/* 5-Monument Interactive Screen Grid aligned directly over the 5 3D Monitor Bezels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center my-auto">
          {/* Left Flank: Monument 1 (Bazaar Reel Tower) & Monument 2 (Scope Terminal) */}
          <div className="hidden lg:grid lg:col-span-3 grid-cols-2 gap-5 items-center pt-10">
            {/* Plinth 1 Screen: Settle Bazaar Floor */}
            <button
              type="button"
              onClick={() => handleFocusMonument('bazaar', 'bazaar')}
              className="group text-left hardware-screen rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[124px] border border-[#4FFFB0]/35 shadow-xl transition-transform hover:scale-[1.02] cursor-pointer mt-8"
            >
              <span className="text-[10px] font-mono tracking-widest text-slate-400">
                BAZAAR
              </span>
              <span className="text-xl font-mono font-bold text-[#4FFFB0] mt-1 tabular-nums">
                139.00
              </span>
              <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                floor · USDG
              </span>
              <span className="mt-1.5 text-[10px] font-mono text-[#38BDF8] group-hover:underline">
                Enter Bazaar →
              </span>
            </button>

            {/* Plinth 2 Screen: Invariants & Rarity Quick Terminal */}
            <div className="hardware-screen rounded-xl p-3 flex flex-col gap-2 justify-center min-h-[118px] border border-[#38BDF8]/35 shadow-xl -mt-12">
              <button
                type="button"
                onClick={() => onNavigate('blueprint')}
                className="w-full py-1.5 px-2 text-[11px] font-mono text-[#4FFFB0] border border-[#4FFFB0]/35 rounded hover:bg-[#4FFFB0]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                INVARIANTS
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rarity')}
                className="w-full py-1.5 px-2 text-[11px] font-mono text-[#38BDF8] border border-[#38BDF8]/35 rounded hover:bg-[#38BDF8]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                TRACKS
              </button>
            </div>
          </div>

          {/* Center Monument: Primary Canonical Settlement Terminal (Aligned inside the 3D Mainframe Bezel!) */}
          <div className="lg:col-span-6 mx-auto w-full max-w-[468px] -mt-14">
            <div className="hardware-screen rounded-2xl p-4 sm:p-5 text-slate-100 border border-[#4FFFB0]/30 shadow-2xl">
              {/* Screen Top Telemetry Header */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-white/10 pb-2">
                <span>OPEN TRADING · 1% FEE</span>
                <span>
                  PRICE{' '}
                  <strong className="text-[#4FFFB0] tabular-nums">{spotPrice} USDG</strong>{' '}
                  <span className="text-emerald-400">+2.4%</span>
                </span>
              </div>

              {/* Primary North-Star Metric: Paid to Commissioned Engines */}
              <div className="text-center py-2.5">
                <div className="text-[10px] font-mono tracking-widest text-slate-400">
                  PAID TO HOLDERS
                </div>
                <div className="mt-0.5 flex items-baseline justify-center gap-2">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-[#4FFFB0] tracking-tight tabular-nums">
                    {protocol.totalRewardInUSDG.toLocaleString('en-US', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </span>
                  <span className="text-sm font-mono text-[#4FFFB0]/80">USDG</span>
                </div>
              </div>

              {/* 4-Column Protocol Stats inside the Mainframe CRT */}
              <div className="grid grid-cols-4 gap-2 py-2 border-y border-white/10 text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-400">VOLUME</div>
                  <div className="text-xs sm:text-sm font-semibold text-white mt-0.5 tabular-nums">
                    ${(protocol.volume30dUSDG / 1000).toFixed(1)}k
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">ESCROW OPEN</div>
                  <div className="text-xs sm:text-sm font-semibold text-white mt-0.5 tabular-nums">
                    {protocol.openCount} W
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">BURNED</div>
                  <div className="text-xs sm:text-sm font-semibold text-[#F59E0B] mt-0.5 tabular-nums">
                    {protocol.commissionedCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">COMMISSIONED</div>
                  <div className="text-xs sm:text-sm font-semibold text-[#4FFFB0] mt-0.5 tabular-nums">
                    {protocol.commissionedCount}
                  </div>
                </div>
              </div>

              {/* Inline Canonical Swap Execution Box (matching Screenshot 6!) */}
              <div className="mt-3 bg-[#070B0E]/90 border border-white/15 rounded-lg p-2.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    <label
                      htmlFor="hero-swap-input"
                      className="block text-[10px] font-mono text-slate-400"
                    >
                      {swapMode === 'BUY_WORKS' ? 'YOU PAY · USDG' : 'YOU SELL · $WORKS'}
                    </label>
                    <input
                      id="hero-swap-input"
                      type="number"
                      min="0"
                      step="any"
                      value={swapInputUSDG}
                      onChange={(e) => setSwapInputUSDG(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 focus:border-[#4FFFB0] text-base font-mono text-white py-0.5 focus:outline-none tabular-nums"
                    />
                  </div>

                  <div className="hidden sm:block text-slate-500 font-mono">→</div>

                  <div className="flex-1">
                    <div className="text-[10px] font-mono text-slate-400">
                      {swapMode === 'BUY_WORKS' ? 'YOU GET · $WORKS' : 'YOU GET · USDG'}
                    </div>
                    <div className="text-base font-mono font-semibold text-[#4FFFB0] py-0.5 tabular-nums">
                      {quote.outputAmount.toFixed(3)}{' '}
                      <span className="text-xs">{swapMode === 'BUY_WORKS' ? 'W' : 'USDG'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTradeSubmit('BUY_WORKS')}
                      className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded bg-[#4FFFB0] text-[#091310] hover:bg-[#3be89b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (swapMode !== 'SELL_WORKS') {
                          setSwapMode('SELL_WORKS');
                          setSwapInputUSDG('1');
                        } else {
                          handleTradeSubmit('SELL_WORKS');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-white/25 text-slate-200 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sell
                    </button>
                  </div>
                </div>

                {tradeFeedback && (
                  <div
                    role="status"
                    className="mt-2 text-[11px] font-mono text-[#38BDF8] border-t border-white/10 pt-1.5"
                  >
                    {tradeFeedback}
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Every whole $WORKS materializes an Open Engine</span>
                <button
                  type="button"
                  onClick={onMaterializeQuick}
                  className="text-[#4FFFB0] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  [ Materialize 1 W → ]
                </button>
              </div>
            </div>
          </div>

          {/* Right Flank: Monument 4 (Desk Pediment Vault) & Monument 5 (Field Laptop) */}
          <div className="hidden lg:grid lg:col-span-3 grid-cols-2 gap-5 items-center pt-10">
            {/* Plinth 4 Screen: Desk Vault */}
            <button
              type="button"
              onClick={() => handleFocusMonument('desk', 'desk')}
              className="group text-left hardware-screen rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[120px] border border-[#4FFFB0]/35 shadow-xl transition-transform hover:scale-[1.02] cursor-pointer -mt-10"
            >
              <span className="text-[10px] font-mono tracking-widest text-slate-400">
                DESK
              </span>
              <span className="text-lg font-mono font-bold text-[#4FFFB0] mt-1 tabular-nums">
                {protocol.commissionedCount} active
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                {protocol.engines.filter((e) => e.owner === 'you' && e.status !== 'Reserve').length} owned by you
              </span>
              <span className="mt-1.5 text-[10px] font-mono text-[#4FFFB0] group-hover:underline">
                Open Desk →
              </span>
            </button>

            {/* Plinth 5 Screen: Field Terminal (Blueprint / Rarity / Bazaar) */}
            <div className="hardware-screen rounded-xl p-2.5 flex flex-col gap-1.5 justify-center min-h-[124px] border border-[#4FFFB0]/35 shadow-xl mt-16">
              <button
                type="button"
                onClick={() => onNavigate('blueprint')}
                className="w-full py-1 px-2 text-[10px] font-mono text-[#4FFFB0] border border-[#4FFFB0]/30 rounded hover:bg-[#4FFFB0]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                BLUEPRINT
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rarity')}
                className="w-full py-1 px-2 text-[10px] font-mono text-[#4FFFB0] border border-[#4FFFB0]/30 rounded hover:bg-[#4FFFB0]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                RARITY
              </button>
              <button
                type="button"
                onClick={() => onNavigate('bazaar')}
                className="w-full py-1 px-2 text-[10px] font-mono text-[#4FFFB0] border border-[#4FFFB0]/30 rounded hover:bg-[#4FFFB0]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                BAZAAR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Settlement Activity Bar (matching Screenshot 6 bottom bar) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[940px]">
        <div className="bg-[#11151B]/95 text-slate-200 border border-white/15 rounded-xl px-4 py-2 flex items-center justify-between gap-4 shadow-xl font-mono text-xs">
          <div className="flex items-center gap-2 shrink-0 text-[#4FFFB0] font-semibold">
            <span>CHAIN 4663 FEED</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-6 whitespace-nowrap overflow-x-auto no-scrollbar text-slate-300">
              {protocol.activities.slice(0, 3).map((act) => (
                <span key={act.id} className="inline-flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">{act.actor}</span>
                  <span className="text-white">{act.amountText}</span>
                  <span className="text-slate-500">· {act.timestamp}</span>
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('swap')}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Canonical Swap
          </button>
        </div>
      </div>
    </section>
  );
};
