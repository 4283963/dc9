import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Terminal } from './Terminal';
import { QuayCrane } from './QuayCrane';
import { AgvVehicle } from './AgvVehicle';
import { TrajectoryTube } from './TrajectoryTube';
import { useAgvStore } from '@/store/useAgvStore';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { AgvStatus } from '@/types/agv';

const CRANE_POSITIONS: Array<[number, number, number]> = [
  [-40, 0, -25],
  [-40, 0, -8],
  [-40, 0, 8],
  [-40, 0, 25],
];

function PlaybackEngine() {
  const { mode, trajectory, playbackAgvId, progress, isPlaying, playbackSpeed,
          setProgress } = usePlaybackStore();
  const setVehicle = useAgvStore((s) => s.setVehicle);
  const setSelectedVehicleId = useAgvStore((s) => s.setSelectedVehicleId);
  const { curve, cumulativeLens, totalArcLen, flatPts, rotArr } = useMemo(() => {
    if (!trajectory) {
      return {
        curve: null as THREE.CatmullRomCurve3 | null,
        cumulativeLens: [] as number[],
        totalArcLen: 0,
        flatPts: [] as THREE.Vector3[],
        rotArr: [] as number[],
      };
    }
    const raw = trajectory.points;
    const flatPts: THREE.Vector3[] = [];
    const rotArr: number[] = [];
    for (let i = 0; i < raw.length; i++) {
      const p = raw[i];
      flatPts.push(new THREE.Vector3(p[0], p[1], p[2]));
      rotArr.push(p[3] ?? 0);
    }
    const curve = new THREE.CatmullRomCurve3(flatPts, false, 'catmullrom', 0.05);
    const cum: number[] = [0];
    let tot = 0;
    for (let i = 1; i < flatPts.length; i++) {
      tot += flatPts[i].distanceTo(flatPts[i - 1]);
      cum.push(tot);
    }
    return { curve, cumulativeLens: cum, totalArcLen: tot, flatPts, rotArr };
  }, [trajectory]);

  const tmpV = useRef(new THREE.Vector3());
  const prevProgress = useRef(progress);

  useEffect(() => {
    if (mode === 'playback' && playbackAgvId) {
      setSelectedVehicleId(playbackAgvId);
    }
  }, [mode, playbackAgvId, setSelectedVehicleId]);

  useFrame((state, delta) => {
    if (mode !== 'playback' || !trajectory || !playbackAgvId || !curve) return;

    let curProgress = progress;
    if (isPlaying) {
      const totalMs = trajectory.endTime - trajectory.startTime;
      const advanceSec = delta * playbackSpeed * 60;
      const advanceRatio = totalMs > 0 ? advanceSec * 1000 / totalMs : 0;
      curProgress = Math.min(1, curProgress + advanceRatio);
      if (curProgress >= 1) {
        curProgress = 1;
        usePlaybackStore.getState().setPlaying(false);
      }
      if (Math.abs(curProgress - prevProgress.current) > 1e-6) {
        setProgress(curProgress);
        prevProgress.current = curProgress;
      }
    }

    curve.getPointAt(curProgress, tmpV.current);
    const N = flatPts.length;
    const idx0 = Math.min(N - 1, Math.floor(curProgress * (N - 1)));
    const idx1 = Math.min(N - 1, idx0 + 1);
    const subRatio = curProgress * (N - 1) - idx0;
    const rot0 = rotArr[idx0] ?? 0;
    const rot1 = rotArr[idx1] ?? rot0;
    let rotDiff = rot1 - rot0;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    const curRot = rot0 + rotDiff * subRatio;

    const batteryArr = trajectory.batterySeries;
    const bIdx = Math.min(batteryArr.length - 1, Math.floor(curProgress * (batteryArr.length - 1)));
    const curBattery = (batteryArr[bIdx]?.[0]) ?? 80;

    const speedArrLen = Math.max(1, N - 1);
    const sIdx = Math.min(speedArrLen - 1, Math.floor(curProgress * (speedArrLen - 1)));
    const dx = (flatPts[sIdx + 1]?.x ?? flatPts[sIdx].x) - flatPts[sIdx].x;
    const dz = (flatPts[sIdx + 1]?.z ?? flatPts[sIdx].z) - flatPts[sIdx].z;
    const curSpeed = isPlaying ? Math.sqrt(dx * dx + dz * dz) * 25 * playbackSpeed : 0;

    const sim: AgvStatus = {
      id: playbackAgvId,
      timestamp: Date.now(),
      position: {
        x: Math.round(tmpV.current.x * 1000) / 1000,
        y: 0.3,
        z: Math.round(tmpV.current.z * 1000) / 1000,
      },
      rotation: { x: 0, y: curRot, z: 0 },
      speed: Math.round(curSpeed * 100) / 100,
      battery: Math.round(curBattery * 10) / 10,
      status: isPlaying ? 'RUNNING' : 'IDLE',
      hasContainer: curProgress > 0.3 && curProgress < 0.8,
      containerColor: ['#ff9f43', '#ee5a24', '#2980b9', '#27ae60'][(playbackAgvId.length + sIdx) % 4],
      containerId: 'CTN-' + (10000 + sIdx),
    };
    setVehicle(playbackAgvId, sim);
  });

  if (mode !== 'playback' || !trajectory) return null;
  return <TrajectoryTube trajectory={trajectory} />;
}

function CameraController() {
  const { camera } = useThree();
  const selectedVehicleId = useAgvStore((state) => state.selectedVehicleId);
  const vehicles = useAgvStore((state) => state.vehicles);
  const mode = usePlaybackStore((s) => s.mode);
  const playbackAgvId = usePlaybackStore((s) => s.playbackAgvId);
  const targetLookAt = useRef(new THREE.Vector3(0, 5, 20));
  const initialCamPos = useRef(new THREE.Vector3(0, 60, 60));
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    const focusId = selectedVehicleId || (mode === 'playback' ? playbackAgvId : null);
    if (focusId) {
      const vehicle = vehicles.get(focusId);
      if (vehicle) {
        targetLookAt.current.lerp(
          new THREE.Vector3(vehicle.position.x, vehicle.position.y, vehicle.position.z),
          delta * 3,
        );
        const desiredCamPos = new THREE.Vector3(
          vehicle.position.x + 12,
          vehicle.position.y + 12,
          vehicle.position.z + 12,
        );
        camera.position.lerp(desiredCamPos, delta * 2);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(targetLookAt.current, delta * 3);
        }
        return;
      }
    }
    targetLookAt.current.lerp(new THREE.Vector3(0, 0, 0), delta * 0.5);
    camera.position.lerp(initialCamPos.current, delta * 0.5);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, delta * 0.5);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={5}
      maxDistance={150}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2.05}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

function Lighting() {
  return (
    <>
      <hemisphereLight args={['#4a90a4', '#0a1628', 0.6]} />
      <directionalLight
        position={[30, 50, 30]}
        intensity={0.8}
        color="#e8f4f8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <ambientLight intensity={0.25} color="#1a365d" />
    </>
  );
}

function AgvVehiclesLayer() {
  const vehicles = useAgvStore((state) => state.vehicles);
  const vehicleList = useMemo(() => Array.from(vehicles.values()), [vehicles]);
  return (
    <group>
      {vehicleList.map((vehicle) => (
        <AgvVehicle key={vehicle.id} status={vehicle} />
      ))}
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <fog attach="fog" args={['#0a1628', 70, 150]} />
      <color attach="background" args={['#0a1628']} />
      <Lighting />
      <Stars radius={220} depth={90} count={3500} factor={3} fade speed={0.25} />
      <Terminal />
      {CRANE_POSITIONS.map((pos, i) => (
        <QuayCrane key={i} position={pos} index={i} />
      ))}
      <PlaybackEngine />
      <AgvVehiclesLayer />
      <CameraController />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.35}
          luminanceSmoothing={0.9}
          intensity={1.5}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.1} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export function Scene3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 60, 60], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <SceneContent />
    </Canvas>
  );
}
