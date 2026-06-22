import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Terminal } from './Terminal';
import { QuayCrane } from './QuayCrane';
import { AgvVehicle } from './AgvVehicle';
import { useAgvStore } from '@/store/useAgvStore';

const CRANE_POSITIONS: Array<[number, number, number]> = [
  [-40, 0, -25],
  [-40, 0, -8],
  [-40, 0, 8],
  [-40, 0, 25],
];

function CameraController() {
  const { camera } = useThree();
  const selectedVehicleId = useAgvStore((state) => state.selectedVehicleId);
  const vehicles = useAgvStore((state) => state.vehicles);
  const targetLookAt = useRef(new THREE.Vector3(0, 5, 20));
  const initialCamPos = useRef(new THREE.Vector3(0, 60, 60));
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (selectedVehicleId) {
      const vehicle = vehicles.get(selectedVehicleId);
      if (vehicle) {
        targetLookAt.current.lerp(
          new THREE.Vector3(vehicle.position.x, vehicle.position.y, vehicle.position.z),
          delta * 2,
        );
        const desiredCamPos = new THREE.Vector3(
          vehicle.position.x + 8,
          vehicle.position.y + 8,
          vehicle.position.z + 8,
        );
        camera.position.lerp(desiredCamPos, delta * 2);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(targetLookAt.current, delta * 2);
        }
      }
    } else {
      targetLookAt.current.lerp(new THREE.Vector3(0, 0, 0), delta * 0.5);
      camera.position.lerp(initialCamPos.current, delta * 0.5);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, delta * 0.5);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={10}
      maxDistance={120}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2.1}
      enableDamping
      dampingFactor={0.05}
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
      <ambientLight intensity={0.2} color="#1a365d" />
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
      <fog attach="fog" args={['#0a1628', 60, 140]} />
      <color attach="background" args={['#0a1628']} />
      <Lighting />
      <Stars radius={200} depth={80} count={3000} factor={3} fade speed={0.3} />
      <Terminal />
      {CRANE_POSITIONS.map((pos, i) => (
        <QuayCrane key={i} position={pos} index={i} />
      ))}
      <AgvVehiclesLayer />
      <CameraController />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          intensity={1.2}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
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
