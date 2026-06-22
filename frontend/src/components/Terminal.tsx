import { useMemo } from 'react';
import * as THREE from 'three';

const TERMINAL_WIDTH = 100;
const TERMINAL_DEPTH = 70;
const YARD_BLOCKS_X = 6;
const YARD_BLOCKS_Z = 4;
const BLOCK_SPACING_X = 12;
const BLOCK_SPACING_Z = 14;

export function Terminal() {
  const containerPositions = useMemo(() => {
    const positions: Array<{ position: [number, number, number]; color: string }> = [];
    const colors = ['#ff9f43', '#ee5a24', '#f39c12', '#d35400', '#e67e22', '#c0392b'];
    const startX = -(YARD_BLOCKS_X * BLOCK_SPACING_X) / 2 + BLOCK_SPACING_X / 2;
    const startZ = -(YARD_BLOCKS_Z * BLOCK_SPACING_Z) / 2 + BLOCK_SPACING_Z / 2;

    for (let bx = 0; bx < YARD_BLOCKS_X; bx++) {
      for (let bz = 0; bz < YARD_BLOCKS_Z; bz++) {
        const baseX = startX + bx * BLOCK_SPACING_X;
        const baseZ = startZ + bz * BLOCK_SPACING_Z;
        const tiers = 3 + Math.floor(Math.random() * 3);
        const rows = 2;
        const cols = 3;
        for (let t = 0; t < tiers; t++) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (Math.random() > 0.85 && t > 1) continue;
              positions.push({
                position: [
                  baseX + (c - cols / 2 + 0.5) * 2.6,
                  1.2 + t * 2.5,
                  baseZ + (r - rows / 2 + 0.5) * 6.2,
                ],
                color: colors[Math.floor(Math.random() * colors.length)],
              });
            }
          }
        }
      }
    }
    return positions;
  }, []);

  const gridHelper = useMemo(() => {
    return new THREE.GridHelper(TERMINAL_WIDTH, 50, 0x00e5ff, 0x0a3a5c);
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[TERMINAL_WIDTH, TERMINAL_DEPTH]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} metalness={0.1} />
      </mesh>

      <primitive object={gridHelper} position={[0, 0.01, 0]} />

      {containerPositions.map((item, i) => (
        <mesh key={i} position={item.position as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 2.4, 6]} />
          <meshStandardMaterial color={item.color} roughness={0.6} metalness={0.3} />
        </mesh>
      ))}

      <mesh position={[-TERMINAL_WIDTH / 2 - 0.5, 2, 0]}>
        <boxGeometry args={[1, 4, TERMINAL_DEPTH]} />
        <meshStandardMaterial color="#2d3436" roughness={0.8} metalness={0.2} />
      </mesh>

      <mesh position={[0, 2.5, -TERMINAL_DEPTH / 2 - 1]}>
        <boxGeometry args={[TERMINAL_WIDTH, 5, 2]} />
        <meshStandardMaterial color="#2d3436" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}
