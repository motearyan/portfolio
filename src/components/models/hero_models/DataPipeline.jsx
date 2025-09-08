import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DataPipeline = () => {
  const particlesRef = useRef();

  // Particle setup
  const particleCount = 400;
  const particles = useMemo(() => {
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random() * 10; // spread across pipelines
      positions.push(t);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const positions = particlesRef.current.geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      let t = (particles[i] + state.clock.elapsedTime * 1.2) % 10;

      // Spiral movement
      positions[i * 3] = Math.sin(t) * (t / 3); // x
      positions[i * 3 + 1] = Math.cos(t * 1.5) * 0.5; // y
      positions[i * 3 + 2] = t - 5; // z axis forward motion
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      {/* Central AI Core */}
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          emissive="crimson"
          emissiveIntensity={3}
          color="black"
          roughness={0.2}
          metalness={1}
        />
      </mesh>

      {/* Branching pipelines (tubes) */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 10, 64]} />
        <meshStandardMaterial color="#222" emissive="red" emissiveIntensity={1.5} />
      </mesh>

      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 10, 64]} />
        <meshStandardMaterial color="#222" emissive="purple" emissiveIntensity={1.5} />
      </mesh>

      {/* Orbiting server nodes */}
      {[...Array(6)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((i / 6) * Math.PI * 2) * 3,
            Math.cos((i / 6) * Math.PI * 2) * 3,
            -1,
          ]}
        >
          <boxGeometry args={[0.8, 1.2, 0.8]} />
          <meshStandardMaterial
            emissive={i % 2 === 0 ? "cyan" : "magenta"}
            emissiveIntensity={2}
            color="black"
          />
        </mesh>
      ))}

      {/* Flowing particles */}
      <points ref={particlesRef}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={new Float32Array(particleCount * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="orange"
          size={0.12}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

export default DataPipeline;
