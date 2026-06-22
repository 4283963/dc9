import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TrajectoryHistory } from '@/types/agv';
import { usePlaybackStore } from '@/store/usePlaybackStore';

interface TrajectoryTubeProps {
  trajectory: TrajectoryHistory;
}

const SAMPLE_EVERY = 30;

export function TrajectoryTube({ trajectory }: TrajectoryTubeProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const glowTubeRef = useRef<THREE.Mesh>(null);
  const progress = usePlaybackStore((s) => s.progress);
  const { curve, tubeGeometry, sampledPoints, cumulativeDistances, totalLen } = useMemo(() => {
    const raw = trajectory.points;
    if (raw.length < 4) {
      return {
        curve: null,
        tubeGeometry: null,
        sampledPoints: [],
        cumulativeDistances: [],
        totalLen: 0,
      };
    }
    const sampled: THREE.Vector3[] = [];
    for (let i = 0; i < raw.length; i += SAMPLE_EVERY) {
      const p = raw[i];
      sampled.push(new THREE.Vector3(p[0], 0.15, p[2]));
    }
    {
      const last = raw[raw.length - 1];
      sampled.push(new THREE.Vector3(last[0], 0.15, last[2]));
    }
    const curve = new THREE.CatmullRomCurve3(sampled, false, 'catmullrom', 0.1);

    const cum: number[] = [0];
    let cumLen = 0;
    for (let i = 1; i < sampled.length; i++) {
      cumLen += sampled[i].distanceTo(sampled[i - 1]);
      cum.push(cumLen);
    }

    const tubeGeometry = new THREE.TubeGeometry(curve, Math.max(400, sampled.length * 6), 0.18, 12, false);
    tubeGeometry.computeVertexNormals();

    const colors = new Float32Array(tubeGeometry.attributes.position.count * 3);
    const posCount = tubeGeometry.attributes.position.count;
    for (let i = 0; i < posCount; i++) {
      const t = i / posCount;
      const r = 0;
      let g: number, b: number;
      if (t < 0.5) {
        const tt = t * 2;
        g = 0.9 - tt * 0.2;
        b = 1.0;
      } else {
        const tt = (t - 0.5) * 2;
        g = 0.4 + tt * 0.3;
        b = 1.0 - tt * 0.3;
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    tubeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { curve, tubeGeometry, sampledPoints: sampled, cumulativeDistances: cum, totalLen: cumLen };
  }, [trajectory]);

  useFrame(() => {
    if (!tubeRef.current || !glowTubeRef.current) return;
    const material = tubeRef.current.material as THREE.ShaderMaterial;
    if (material && material.uniforms) {
      material.uniforms.uProgress.value = progress;
    }
    if (glowTubeRef.current) {
      const glowMat = glowTubeRef.current.material as THREE.ShaderMaterial;
      if (glowMat && glowMat.uniforms) {
        glowMat.uniforms.uProgress.value = progress;
      }
    }
    if (headRef.current && curve) {
      const pos = curve.getPointAt(progress);
      headRef.current.position.copy(pos);
      headRef.current.position.y += 0.4;
    }
  });

  if (!curve || !tubeGeometry) return null;

  const tubeMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uTraversedColor: { value: new THREE.Color('#ff6b35') },
      uRemainingColor: { value: new THREE.Color('#00e5ff') },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uProgress;
      uniform vec3 uTraversedColor;
      uniform vec3 uRemainingColor;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        float t = vUv.x;
        vec3 color;
        float edge = uProgress;
        const float blend = 0.08;
        if (t < edge - blend) {
          color = uTraversedColor;
        } else if (t < edge + blend) {
          float f = smoothstep(edge - blend, edge + blend, t);
          color = mix(uTraversedColor, uRemainingColor, f);
        } else {
          color = uRemainingColor;
        }
        float fres = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 1.5);
        color += fres * 0.3;
        float glow = 1.0;
        if (abs(t - uProgress) < 0.02) {
          glow = 3.0;
        }
        gl_FragColor = vec4(color * glow, 0.85);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uTraversedColor: { value: new THREE.Color('#ff9f43') },
      uRemainingColor: { value: new THREE.Color('#00d4ff') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uProgress;
      uniform vec3 uTraversedColor;
      uniform vec3 uRemainingColor;
      varying vec2 vUv;
      void main() {
        float t = vUv.x;
        float edge = uProgress;
        vec3 color = t < edge ? uTraversedColor : uRemainingColor;
        float glow = 0.35;
        float d = abs(t - edge);
        if (d < 0.03) {
          glow = 1.2 * (1.0 - d / 0.03);
        }
        float y = abs(vUv.y - 0.5) * 2.0;
        glow *= 1.0 - pow(y, 4.0);
        gl_FragColor = vec4(color, glow);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  return (
    <group>
      <mesh ref={glowTubeRef} geometry={tubeGeometry} material={glowMaterial} scale={[1, 1.8, 1.8]} />
      <mesh ref={tubeRef} geometry={tubeGeometry} material={tubeMaterial} />
      <mesh ref={headRef}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color="#ff6b35" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.2, 0]} scale={[1, 1.4, 1.4]}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshBasicMaterial color="#ff6b35" transparent opacity={0.15} toneMapped={false} />
      </mesh>
    </group>
  );
}
