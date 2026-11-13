import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { X, Eye, EyeOff, Layers, Sparkles, RotateCcw } from 'lucide-react';
import {
  EngineItem,
  GENERATION_SPECS,
  calculatePendingReward,
} from '../protocol/settleworksEngine';

interface EngineInspectorModal3DProps {
  engine: EngineItem | null;
  accRewardPerWeight: number;
  userUSDG: number;
  onClose: () => void;
  onCommission: (engineId: number) => void;
  onDissolve: (engineId: number) => void;
  onClaim: (engineId: number) => void;
  onBuyBazaar: (engineId: number) => void;
}

function createInspectorCRTTexture(
  engine: EngineItem,
  simulatedCommissioned: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#070E14';
  ctx.fillRect(0, 0, 512, 384);

  // Subtle scanlines
  ctx.fillStyle = 'rgba(79, 255, 176, 0.05)';
  for (let y = 0; y < 384; y += 4) {
    ctx.fillRect(0, y, 512, 1.5);
  }

  const accent = simulatedCommissioned ? '#4FFFB0' : '#38BDF8';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 348);

  ctx.fillStyle = accent;
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`SETTLE ENGINE #${engine.id}`, 36, 62);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '18px monospace';
  ctx.fillText(`CLASS: ${engine.generation.toUpperCase()} · WEIGHT: ${engine.weight.toFixed(2)}x`, 36, 96);
  ctx.fillText(
    `STATE: ${simulatedCommissioned ? 'COMMISSIONED (PERMANENT)' : 'OPEN ENGINE (1 WORKS ESCROW)'}`,
    36,
    126
  );

  // Waveform plot
  ctx.strokeStyle = simulatedCommissioned ? '#4FFFB0' : '#F59E0B';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let x = 36; x <= 470; x += 10) {
    const y =
      225 +
      Math.sin(x * 0.045 + engine.id) * 34 * (simulatedCommissioned ? 1.15 : 0.55) +
      Math.cos(x * 0.09) * 14;
    if (x === 36) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '16px monospace';
  ctx.fillText(`CHASSIS: ${engine.traits.chassis.toUpperCase()}`, 36, 315);
  ctx.fillText(`SEAL: ${simulatedCommissioned ? 'IGNITED COBALT-AMBER' : 'UNBROKEN ESCROW'}`, 36, 342);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const EngineInspectorModal3D: React.FC<EngineInspectorModal3DProps> = ({
  engine,
  accRewardPerWeight,
  userUSDG,
  onClose,
  onCommission,
  onDissolve,
  onClaim,
  onBuyBazaar,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [explodedPct, setExplodedPct] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'front' | 'seal' | 'rear'>('iso');
  const [previewCommissioned, setPreviewCommissioned] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  const explodedRef = useRef<number>(0);
  explodedRef.current = explodedPct / 100;

  const cameraPresetRef = useRef<'iso' | 'front' | 'seal' | 'rear'>('iso');
  cameraPresetRef.current = cameraPreset;

  const isEffectiveCommissioned =
    engine?.status === 'Commissioned' || previewCommissioned;
  const effectiveCommRef = useRef<boolean>(isEffectiveCommissioned);
  effectiveCommRef.current = isEffectiveCommissioned;

  useEffect(() => {
    if (engine) {
      setPreviewCommissioned(engine.status === 'Commissioned');
      setExplodedPct(0);
      setCameraPreset('iso');
    }
  }, [engine]);

  useEffect(() => {
    if (!engine) return;
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 880;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 60);
    camera.position.set(3.4, 2.6, 3.8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.85, 0);
    controls.minDistance = 2.2;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;

    // 3-Point Studio Lighting Rig
    const hemi = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 0.75);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(4, 6, 4);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-4, 4, -4);
    scene.add(rimLight);

    // Contact shadow disc
    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.1, 32),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.01;
    scene.add(shadowDisc);

    // Composite 9-Part Procedural 3D Settle Engine Model (THREE.Group)
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const chassisColorMap: Record<EngineItem['traits']['chassis'], number> = {
      'Carbon Anodized': 0x2b313b,
      'Titanium Brushed': 0xd4dae2,
      'Porcelain Ceramic': 0xedeae2,
      'Cobalt Alloy': 0x3b637d,
      'Obsidian Cast': 0x1c2026,
    };

    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: chassisColorMap[engine.traits.chassis] || 0xd4dae2,
      roughness: 0.28,
      metalness: 0.65,
      clearcoat: 0.35,
    });

    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x1e242d,
      roughness: 0.6,
      metalness: 0.3,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x0f141a,
      roughness: 0.2,
      metalness: 0.85,
    });

    const sealMat = new THREE.MeshStandardMaterial({
      color: effectiveCommRef.current ? 0x4fffb0 : 0x64748b,
      emissive: effectiveCommRef.current ? 0x059669 : 0x000000,
      emissiveIntensity: effectiveCommRef.current ? 1.2 : 0,
      roughness: 0.2,
      metalness: 0.5,
    });

    const crtTex = createInspectorCRTTexture(engine, effectiveCommRef.current);
    const screenMat = new THREE.MeshBasicMaterial({ map: crtTex });

    // Part 1: Precision Plinth Base
    const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 1.9), plinthMat);
    basePlinth.position.y = 0.11;
    basePlinth.receiveShadow = true;
    rootGroup.add(basePlinth);

    // Part 2: Escrow Lower Deck
    const lowerDeck = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.32, 1.45), chassisMat);
    lowerDeck.position.y = 0.38;
    lowerDeck.castShadow = true;
    rootGroup.add(lowerDeck);

    // Part 3: Primary Upper Telemetry Housing / Tower
    const isTall = engine.generation === 'Vault' || engine.generation === 'Prime';
    const upperHousing = new THREE.Mesh(
      new THREE.BoxGeometry(isTall ? 1.55 : 1.62, isTall ? 1.45 : 1.08, 1.15),
      chassisMat
    );
    upperHousing.position.set(0, isTall ? 1.26 : 1.08, -0.08);
    upperHousing.castShadow = true;
    rootGroup.add(upperHousing);

    // Part 4: Inset CRT Screen Frame
    const screenFrame = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.86), screenMat);
    screenFrame.position.set(0, 1.08, 0.505);
    rootGroup.add(screenFrame);

    // Part 5: Tactile Mechanical Keyboard Wedge
    const keyboardWedge = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.12, 0.48), trimMat);
    keyboardWedge.position.set(0, 0.6, 0.56);
    keyboardWedge.rotation.x = 0.14;
    rootGroup.add(keyboardWedge);

    // Part 6 & 7: Dual Rotating Magnetic Settlement Spools
    const spoolGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 24);
    spoolGeo.rotateZ(Math.PI / 2);
    const leftSpool = new THREE.Mesh(spoolGeo, trimMat);
    leftSpool.position.set(-0.84, 1.15, -0.08);
    rootGroup.add(leftSpool);

    const rightSpool = new THREE.Mesh(spoolGeo, trimMat);
    rightSpool.position.set(0.84, 1.15, -0.08);
    rootGroup.add(rightSpool);

    // Part 8: Extruded Thermal Settlement Receipt Strip on Right Flank
    const receiptGeo = new THREE.BoxGeometry(0.03, 0.72, 0.28);
    const receiptMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.75,
    });
    const receiptMesh = new THREE.Mesh(receiptGeo, receiptMat);
    receiptMesh.position.set(0.95, 0.78, 0.22);
    receiptMesh.rotation.z = -0.22;
    rootGroup.add(receiptMesh);

    // Part 9: Top Commissioning Core / Sovereign Seal
    const sealCore = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.18, 24), sealMat);
    sealCore.position.set(0, isTall ? 2.08 : 1.71, -0.08);
    rootGroup.add(sealCore);

    let userDragging = false;
    controls.addEventListener('start', () => {
      userDragging = true;
    });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 880;
      const h = container.clientHeight || 520;
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

    let lastCommState = effectiveCommRef.current;

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;
      const ex = explodedRef.current;

      // Update commissioning material state if toggled
      if (lastCommState !== effectiveCommRef.current) {
        lastCommState = effectiveCommRef.current;
        sealMat.color.setHex(lastCommState ? 0x4fffb0 : 0x64748b);
        sealMat.emissive.setHex(lastCommState ? 0x059669 : 0x000000);
        sealMat.emissiveIntensity = lastCommState ? 1.25 : 0;
        const newTex = createInspectorCRTTexture(engine!, lastCommState);
        screenMat.map?.dispose();
        screenMat.map = newTex;
        screenMat.needsUpdate = true;
      }

      // Smoothly damp Exploded View part offsets
      lowerDeck.position.y = THREE.MathUtils.damp(lowerDeck.position.y, 0.38 + ex * 0.25, 6, dt);
      upperHousing.position.y = THREE.MathUtils.damp(
        upperHousing.position.y,
        (isTall ? 1.26 : 1.08) + ex * 0.65,
        6,
        dt
      );
      screenFrame.position.y = THREE.MathUtils.damp(
        screenFrame.position.y,
        1.08 + ex * 0.65,
        6,
        dt
      );
      screenFrame.position.z = THREE.MathUtils.damp(
        screenFrame.position.z,
        0.505 + ex * 0.45,
        6,
        dt
      );
      keyboardWedge.position.z = THREE.MathUtils.damp(
        keyboardWedge.position.z,
        0.56 + ex * 0.55,
        6,
        dt
      );
      leftSpool.position.x = THREE.MathUtils.damp(leftSpool.position.x, -0.84 - ex * 0.5, 6, dt);
      rightSpool.position.x = THREE.MathUtils.damp(rightSpool.position.x, 0.84 + ex * 0.5, 6, dt);
      sealCore.position.y = THREE.MathUtils.damp(
        sealCore.position.y,
        (isTall ? 2.08 : 1.71) + ex * 1.15,
        6,
        dt
      );

      // Rotate spools & gently turn assembly
      leftSpool.rotation.x += dt * 1.4;
      rightSpool.rotation.x -= dt * 1.4;
      sealCore.rotation.y += dt * (lastCommState ? 1.8 : 0.4);

      if (!userDragging) {
        const preset = cameraPresetRef.current;
        const camTargets: Record<typeof preset, [number, number, number]> = {
          iso: [3.4, 2.6, 3.8],
          front: [0, 1.45, 3.9],
          seal: [1.6, 3.3, 2.2],
          rear: [-3.2, 2.4, -3.4],
        };
        const [tx, ty, tz] = camTargets[preset];
        camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 4, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 4, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, tz, 4, dt);
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      crtTex.dispose();
      renderer.dispose();
    };
  }, [engine]);

  if (!engine) return null;

  const genSpec = GENERATION_SPECS[engine.generation];
  const pendingUSDG = calculatePendingReward(engine, accRewardPerWeight);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-modal-title"
    >
      <div className="relative w-full max-w-[1120px] h-[86vh] min-h-[580px] bg-[#0B0E13] text-slate-100 rounded-2xl border border-white/15 shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left/Center 3D Viewport (Unobstructed Center + Collapsible Bottom Dock per threejs skill!) */}
        <div className="relative flex-1 h-[360px] lg:h-full overflow-hidden bg-[#080C11] engine-card-grid-dark">
          {/* Interactive Multi-Part 3D Exploded Assembly Schematic Layer (Always Visible & Synchronized with Exploded Slider & Camera Presets) */}
          <svg
            viewBox="0 0 600 480"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none transition-transform duration-500"
            style={{
              transform:
                cameraPreset === 'front'
                  ? 'scale(1.08)'
                  : cameraPreset === 'seal'
                  ? 'scale(1.22) translateY(36px)'
                  : cameraPreset === 'rear'
                  ? 'scaleX(-1)'
                  : 'scale(1)',
            }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="chamber-glow" cx="50%" cy="50%" r="50%">
                <stop
                  offset="0%"
                  stopColor={isEffectiveCommissioned ? 'rgba(79,255,176,0.18)' : 'rgba(56,189,248,0.14)'}
                />
                <stop offset="100%" stopColor="rgba(8,12,17,0)" />
              </radialGradient>
            </defs>

            <circle cx="300" cy="240" r="210" fill="url(#chamber-glow)" />

            {/* Exploded Guide Axis Lines */}
            <g
              stroke={isEffectiveCommissioned ? '#4FFFB0' : '#38BDF8'}
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity={0.35 + explodedPct * 0.005}
            >
              <line x1="300" y1="55" x2="300" y2="415" />
              <line x1="150" y1="210" x2="450" y2="210" />
            </g>

            {/* Layer 1: Precision Plinth Base (Y moves down on explode) */}
            <g transform={`translate(0, ${explodedPct * 0.45})`}>
              <polygon
                points="300,305 430,365 300,425 170,365"
                fill="#1E2633"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <polygon
                points="170,365 300,425 300,442 170,382"
                fill="#111722"
                stroke="#475569"
                strokeWidth="1.2"
              />
              <polygon
                points="300,425 430,365 430,382 300,442"
                fill="#0D121B"
                stroke="#475569"
                strokeWidth="1.2"
              />
              <text x="442" y="378" fill="#64748B" fontSize="10" fontFamily="monospace">
                01 · TITANIUM PLINTH
              </text>
            </g>

            {/* Layer 2: 1:1 $WORKS Escrow Chamber Deck */}
            <g transform={`translate(0, ${explodedPct * 0.12})`}>
              <polygon
                points="300,260 398,306 300,352 202,306"
                fill="#2B3444"
                stroke="#64748B"
                strokeWidth="1.4"
              />
              <polygon
                points="202,306 300,352 300,374 202,328"
                fill="#1E2532"
                stroke="#64748B"
                strokeWidth="1.2"
              />
              <polygon
                points="300,352 398,306 398,328 300,374"
                fill="#151B26"
                stroke="#64748B"
                strokeWidth="1.2"
              />
              <text x="64" y="322" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                02 · ESCROW DECK (1.00 W)
              </text>
            </g>

            {/* Layer 3: Primary Telemetry Housing & Magnetic Spools */}
            <g transform={`translate(0, ${-explodedPct * 0.32})`}>
              {/* Left Exploding Magnetic Spool */}
              <g transform={`translate(${-explodedPct * 0.55}, 0)`}>
                <ellipse
                  cx="205"
                  cy="210"
                  rx="22"
                  ry="32"
                  fill="#0F172A"
                  stroke={isEffectiveCommissioned ? '#4FFFB0' : '#38BDF8'}
                  strokeWidth="1.8"
                />
                <circle
                  cx="205"
                  cy="210"
                  r="8"
                  fill={isEffectiveCommissioned ? '#4FFFB0' : '#38BDF8'}
                />
              </g>

              {/* Main Anodized Chassis Cube */}
              <polygon
                points="300,135 386,178 300,221 214,178"
                fill="#333E50"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
              <polygon
                points="214,178 300,221 300,315 214,272"
                fill="#252E3D"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
              <polygon
                points="300,221 386,178 386,272 300,315"
                fill="#19202B"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />

              {/* Right Exploding Thermal Receipt Platen */}
              <g transform={`translate(${explodedPct * 0.55}, 0)`}>
                <path
                  d="M 356 238 Q 378 265, 372 298 L 395 288 Q 400 255, 378 228 Z"
                  fill="#F8FAFC"
                  stroke="#38BDF8"
                  strokeWidth="1.4"
                />
                <text x="408" y="255" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                  03 · LEDGER PLATEN
                </text>
              </g>
            </g>

            {/* Layer 4: Inset Phosphor CRT Screen Module (Explodes forward-left) */}
            <g transform={`translate(${-explodedPct * 0.35}, ${-explodedPct * 0.2})`}>
              <polygon
                points="224,192 292,226 292,296 224,262"
                fill="#071018"
                stroke={isEffectiveCommissioned ? '#4FFFB0' : '#38BDF8'}
                strokeWidth="2"
              />
              <polyline
                points="232,235 244,224 254,248 266,228 276,260 286,246"
                fill="none"
                stroke={isEffectiveCommissioned ? '#4FFFB0' : '#38BDF8'}
                strokeWidth="2.4"
              />
              <text x="64" y="232" fill="#38BDF8" fontSize="10" fontFamily="monospace">
                04 · CRT TELEMETRY
              </text>
            </g>

            {/* Layer 5: Top Sovereign Commissioning Seal Core (Explodes upward) */}
            <g transform={`translate(0, ${-explodedPct * 0.85})`}>
              <ellipse
                cx="300"
                cy="142"
                rx="34"
                ry="18"
                fill="#0F172A"
                stroke={isEffectiveCommissioned ? '#4FFFB0' : '#F59E0B'}
                strokeWidth="2.2"
              />
              <ellipse
                cx="300"
                cy="138"
                rx="18"
                ry="9"
                fill={isEffectiveCommissioned ? '#4FFFB0' : '#F59E0B'}
              />
              <text
                x="350"
                y="138"
                fill={isEffectiveCommissioned ? '#4FFFB0' : '#F59E0B'}
                fontSize="10"
                fontFamily="monospace"
              >
                05 · {isEffectiveCommissioned ? 'IGNITED SEAL (ACTIVE)' : 'UNBROKEN ESCROW SEAL'}
              </text>
            </g>
          </svg>

          <div
            ref={canvasMountRef}
            className="relative z-10 w-full h-full"
            data-testid="inspector-3d-canvas"
          />

          {/* Minimal Top-Left Spec Header */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-3 bg-[#11161F]/90 border border-white/10 px-3.5 py-2 rounded-lg">
            <div>
              <div
                id="inspector-modal-title"
                className="text-sm font-mono font-bold text-white flex items-center gap-2"
              >
                <span>Engine #{engine.id}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#4FFFB0]">{engine.generation}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Weight {genSpec.weight.toFixed(2)}× ·{' '}
                {engine.status === 'Commissioned'
                  ? 'Commissioned (Permanent)'
                  : 'Open Engine (1 $WORKS Escrow)'}
              </div>
            </div>
          </div>

          {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
          <div
            className="absolute bottom-4 inset-x-4 mx-auto z-20 max-w-[640px] transition-transform duration-300"
            style={{
              transform: dockCollapsed ? 'translateY(calc(100% - 28px))' : 'translateY(0)',
            }}
          >
            <div className="flex justify-center mb-1">
              <button
                type="button"
                onClick={() => setDockCollapsed((v) => !v)}
                className="px-3 py-1 text-[11px] font-mono bg-[#141A23] text-slate-300 border border-white/15 rounded-t-lg hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                {dockCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{dockCollapsed ? 'Show 3D Controls' : 'Hide 3D Controls'}</span>
              </button>
            </div>

            <div className="bg-[#121720]/95 border border-white/15 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3">
              {/* Exploded View Slider */}
              <div className="flex items-center gap-2.5 min-w-[180px]">
                <Layers className="w-4 h-4 text-[#38BDF8] shrink-0" />
                <label
                  htmlFor="exploded-slider"
                  className="text-[11px] font-mono text-slate-300 whitespace-nowrap"
                >
                  Explode {explodedPct}%
                </label>
                <input
                  id="exploded-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={explodedPct}
                  onChange={(e) => setExplodedPct(Number(e.target.value))}
                  className="sweep-slider w-24"
                />
              </div>

              {/* Camera Angle Pills */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                {(['iso', 'front', 'seal', 'rear'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCameraPreset(preset)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors uppercase whitespace-nowrap shrink-0 cursor-pointer ${
                      cameraPreset === preset
                        ? 'bg-[#38BDF8] text-[#081018] font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Preview Commissioning Seal Toggle */}
              {engine.status === 'Open' && (
                <button
                  type="button"
                  onClick={() => setPreviewCommissioned((v) => !v)}
                  className={`px-3 py-1.5 text-[11px] font-mono rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    previewCommissioned
                      ? 'bg-[#4FFFB0]/15 border-[#4FFFB0] text-[#4FFFB0]'
                      : 'border-white/15 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{previewCommissioned ? 'Previewing Commissioned' : 'Simulate Commission'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Telemetry, Traits & Action Column */}
        <div className="w-full lg:w-[370px] bg-[#12161E] border-t lg:border-t-0 lg:border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400">ON-CHAIN STATE</span>
                <h3 className="text-lg font-mono font-bold text-white mt-0.5">
                  Settle Engine #{engine.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close 3D Engine Inspector"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Economic & Escrow Telemetry */}
            <div className="mt-4 hardware-screen rounded-xl p-3.5 font-mono space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">STATUS</span>
                <span
                  className={
                    engine.status === 'Commissioned'
                      ? 'text-[#4FFFB0] font-semibold'
                      : 'text-[#F59E0B] font-semibold'
                  }
                >
                  {engine.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ESCROW BACKING</span>
                <span className="text-white tabular-nums">
                  {engine.status === 'Open' ? '1.00 $WORKS (Reversible)' : 'Burned on Commission'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">REWARD WEIGHT</span>
                <span className="text-[#38BDF8] font-semibold tabular-nums">
                  {engine.weight.toFixed(2)}× ({engine.generation})
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="text-slate-400">UNCLAIMED USDG</span>
                <span className="text-[#4FFFB0] font-bold tabular-nums">
                  +{pendingUSDG.toFixed(2)} USDG
                </span>
              </div>
            </div>

            {/* Deterministic Hardware Traits */}
            <div className="mt-4">
              <div className="text-[11px] font-mono text-slate-400 mb-2">
                FROZEN HARDWARE TRAITS (COSMETIC · 0 WEIGHT IMPACT)
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="bg-black/30 border border-white/10 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">CHASSIS</div>
                  <div className="text-slate-200 mt-0.5 truncate">{engine.traits.chassis}</div>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">PLATEN</div>
                  <div className="text-slate-200 mt-0.5 truncate">{engine.traits.platen}</div>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">DISPLAY</div>
                  <div className="text-slate-200 mt-0.5 truncate">{engine.traits.display}</div>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">SEAL</div>
                  <div className="text-slate-200 mt-0.5 truncate">{engine.traits.seal}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2.5">
            {engine.owner === 'you' ? (
              <>
                {engine.status === 'Open' ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => onCommission(engine.id)}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#4FFFB0] text-[#091310] font-mono text-xs font-bold hover:bg-[#3be89b] transition-colors cursor-pointer"
                    >
                      [ COMMISSION ENGINE · BURN 1 $WORKS ]
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDissolve(engine.id);
                        onClose();
                      }}
                      className="w-full py-2 px-4 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10 font-mono text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Dissolve to 1.00 $WORKS</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={pendingUSDG <= 0}
                    onClick={() => onClaim(engine.id)}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#4FFFB0] text-[#091310] disabled:opacity-40 font-mono text-xs font-bold hover:bg-[#3be89b] transition-colors cursor-pointer"
                  >
                    [ CLAIM +{pendingUSDG.toFixed(2)} USDG REWARD ]
                  </button>
                )}
              </>
            ) : (
              engine.listedPriceUSDG !== null && (
                <button
                  type="button"
                  disabled={userUSDG < engine.listedPriceUSDG}
                  onClick={() => {
                    onBuyBazaar(engine.id);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#4FFFB0] text-[#091310] disabled:opacity-40 font-mono text-xs font-bold hover:bg-[#3be89b] transition-colors cursor-pointer"
                >
                  [ BUY ENGINE · {engine.listedPriceUSDG.toFixed(2)} USDG ]
                </button>
              )
            )}
            <p className="text-[11px] font-mono text-slate-400 text-center">
              Pending USDG rewards stay attached to the Engine NFT on transfer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
