import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AgvStatus } from '@/types/agv';
import { useAgvStore } from '@/store/useAgvStore';

interface AgvVehicleProps {
  status: AgvStatus;
}

const LERP_FACTOR = 8;
const CONTAINER_HEIGHT = 2.4;
const CONTAINER_WIDTH = 6;
const CONTAINER_DEPTH = 2.4;
const ROOF_Y = 1.2;
const CONTAINER_CENTER_Y = ROOF_Y + CONTAINER_HEIGHT / 2 + 0.01;

export function AgvVehicle({ status }: AgvVehicleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const containerRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(
    status.position.x,
    status.position.y,
    status.position.z,
  ));
  const targetRot = useRef(status.rotation.y);
  const targetContainerY = useRef(status.hasContainer ? CONTAINER_CENTER_Y : CONTAINER_CENTER_Y + 4);
  const selectedVehicleId = useAgvStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useAgvStore((state) => state.setSelectedVehicleId);
  const isSelected = selectedVehicleId === status.id;

  useEffect(() => {
    targetPos.current.set(status.position.x, status.position.y, status.position.z);
    targetRot.current = status.rotation.y;
  }, [status.position.x, status.position.y, status.position.z, status.rotation.y]);

  useEffect(() => {
    targetContainerY.current = status.hasContainer ? CONTAINER_CENTER_Y : CONTAINER_CENTER_Y + 4;
  }, [status.hasContainer]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(targetPos.current, Math.min(1, delta * LERP_FACTOR));
    const currentRot = groupRef.current.rotation.y;
    let diff = targetRot.current - currentRot;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    groupRef.current.rotation.y += diff * Math.min(1, delta * LERP_FACTOR);

    if (containerRef.current) {
      containerRef.current.position.y += (targetContainerY.current - containerRef.current.position.y) * Math.min(1, delta * 5);
    }
  });

  const bodyColor = useMemo(() => {
    if (status.status === 'ERROR') return '#ff4757';
    if (status.status === 'CHARGING') return '#ffd32a';
    if (status.status === 'IDLE') return '#747d8c';
    return '#2ed573';
  }, [status.status]);

  const batteryColor = status.battery < 20 ? '#ff4757' : status.battery < 50 ? '#ffa502' : '#2ed573';

  const containerVisible = status.hasContainer;

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

      <mesh position={[0.9, 1.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#a4b0be" />
      </mesh>

      <mesh position={[0.9, 2.0, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={batteryColor} emissive={batteryColor} emissiveIntensity={1} />
      </mesh>

      <group ref={containerRef} position={[0, CONTAINER_CENTER_Y + 4, 0]}>
        <mesh castShadow receiveShadow visible={containerVisible}>
          <boxGeometry args={[CONTAINER_WIDTH, CONTAINER_HEIGHT, CONTAINER_DEPTH]} />
          <meshStandardMaterial
            color={status.containerColor || '#ff9f43'}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        <mesh position={[0, 0, CONTAINER_DEPTH / 2 + 0.001]} visible={containerVisible}>
          <boxGeometry args={[CONTAINER_WIDTH * 0.95, CONTAINER_HEIGHT * 0.9, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
        </mesh>

        <mesh position={[-CONTAINER_WIDTH / 2 - 0.001, 0, 0]} visible={containerVisible}>
          <boxGeometry args={[0.02, CONTAINER_HEIGHT * 0.9, CONTAINER_DEPTH * 0.95]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[CONTAINER_WIDTH / 2 + 0.001, 0, 0]} visible={containerVisible}>
          <boxGeometry args={[0.02, CONTAINER_HEIGHT * 0.9, CONTAINER_DEPTH * 0.95]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
        </mesh>

        <mesh position={[0, CONTAINER_HEIGHT / 2 + 0.001, 0]} visible={containerVisible}>
          <boxGeometry args={[CONTAINER_WIDTH * 0.95, 0.02, CONTAINER_DEPTH * 0.95]} />
          <meshStandardMaterial color="#2f3542" metalness={0.6} roughness={0.4} />
        </mesh>

        <mesh position={[0, -CONTAINER_HEIGHT / 2 - 0.001, 0]} visible={containerVisible} receiveShadow>
          <boxGeometry args={[CONTAINER_WIDTH * 0.95, 0.02, CONTAINER_DEPTH * 0.95]} />
          <meshStandardMaterial color="#2f3542" metalness={0.6} roughness={0.4} />
        </mesh>

        {Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={i}
            position={[-CONTAINER_WIDTH / 2 + 0.5 + i * 1.0, 0, CONTAINER_DEPTH / 2 + 0.01]}
            visible={containerVisible}
          >
            <boxGeometry args={[0.08, CONTAINER_HEIGHT * 0.92, 0.06]} />
            <meshStandardMaterial color="#57606f" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
