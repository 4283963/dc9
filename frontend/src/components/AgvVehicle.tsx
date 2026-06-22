import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AgvStatus } from '@/types/agv';
import { useAgvStore } from '@/store/useAgvStore';

interface AgvVehicleProps {
  status: AgvStatus;
}

const LERP_FACTOR = 8;

export function AgvVehicle({ status }: AgvVehicleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(
    status.position.x,
    status.position.y,
    status.position.z,
  ));
  const targetRot = useRef(status.rotation.y);
  const selectedVehicleId = useAgvStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useAgvStore((state) => state.setSelectedVehicleId);
  const isSelected = selectedVehicleId === status.id;

  useEffect(() => {
    targetPos.current.set(status.position.x, status.position.y, status.position.z);
    targetRot.current = status.rotation.y;
  }, [status.position.x, status.position.y, status.position.z, status.rotation.y]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(targetPos.current, Math.min(1, delta * LERP_FACTOR));
    const currentRot = groupRef.current.rotation.y;
    let diff = targetRot.current - currentRot;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    groupRef.current.rotation.y += diff * Math.min(1, delta * LERP_FACTOR);
  });

  const bodyColor = useMemo(() => {
    if (status.status === 'ERROR') return '#ff4757';
    if (status.status === 'CHARGING') return '#ffd32a';
    if (status.status === 'IDLE') return '#747d8c';
    return '#2ed573';
  }, [status.status]);

  const batteryColor = status.battery < 20 ? '#ff4757' : status.battery < 50 ? '#ffa502' : '#2ed573';

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedVehicleId(isSelected ? null : status.id);
      }}
    >
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.6, 1.4]} />
        <meshStandardMaterial color="#2f3542" metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.5, 1.2]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.5} emissive={bodyColor} emissiveIntensity={isSelected ? 0.5 : 0.15} />
      </mesh>

      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.8, 0.1, 1]} />
        <meshStandardMaterial color="#1e90ff" emissive="#1e90ff" emissiveIntensity={0.8} />
      </mesh>

      <mesh position={[-0.8, 0.15, 0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.8, 0.15, 0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.8, 0.15, -0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.8, 0.15, -0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      <mesh position={[0, 0.9, 0.6]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={status.status === 'RUNNING' ? '#ff4757' : '#747d8c'}
          emissive={status.status === 'RUNNING' ? '#ff4757' : '#000000'}
          emissiveIntensity={status.status === 'RUNNING' ? 2 : 0}
        />
      </mesh>

      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#a4b0be" />
      </mesh>

      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={batteryColor} emissive={batteryColor} emissiveIntensity={1} />
      </mesh>

      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
