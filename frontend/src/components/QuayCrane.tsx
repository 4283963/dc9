import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface QuayCraneProps {
  position: [number, number, number];
  index: number;
}

export function QuayCrane({ position, index }: QuayCraneProps) {
  const trolleyRef = useRef<THREE.Group>(null);
  const spreaderRef = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    phase.current += delta * 0.3;
    if (trolleyRef.current) {
      trolleyRef.current.position.x = Math.sin(phase.current) * 6;
    }
    if (spreaderRef.current) {
      spreaderRef.current.position.y = -3 - Math.abs(Math.sin(phase.current * 0.7)) * 3;
    }
  });

  return (
    <group position={position}>
      <mesh position={[-8, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 12, 3]} />
        <meshStandardMaterial color="#57606f" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[8, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 12, 3]} />
        <meshStandardMaterial color="#57606f" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 12.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 1.5, 3]} />
        <meshStandardMaterial color="#747d8c" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-13, 12.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.5, 3]} />
        <meshStandardMaterial color="#ff6348" metalness={0.6} roughness={0.3} />
      </mesh>

      <group ref={trolleyRef} position={[0, 11, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 1.2, 2.5]} />
          <meshStandardMaterial color="#2f3542" metalness={0.7} roughness={0.3} />
        </mesh>
        <group ref={spreaderRef}>
          <mesh castShadow>
            <boxGeometry args={[2, 0.3, 2]} />
            <meshStandardMaterial color="#ffa502" emissive="#ffa502" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[-0.8, -0.5, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
            <meshStandardMaterial color="#747d8c" />
          </mesh>
          <mesh position={[0.8, -0.5, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
            <meshStandardMaterial color="#747d8c" />
          </mesh>
        </group>
      </group>

      <mesh position={[8, 12.2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 12, 8]} />
        <meshStandardMaterial color="#a4b0be" />
      </mesh>

      <spotLight
        position={[10, 12, 0]}
        angle={0.4}
        penumbra={0.5}
        intensity={2}
        color="#fff5e1"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[20, 0.4, 6]} />
        <meshStandardMaterial color="#2f3542" />
      </mesh>
    </group>
  );
}
