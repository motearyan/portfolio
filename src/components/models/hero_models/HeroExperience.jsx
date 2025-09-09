// import { OrbitControls } from "@react-three/drei";
// import { Canvas } from "@react-three/fiber";
// import { useMediaQuery } from "react-responsive";

// import { Room } from "./Room";
// import HeroLights from "./HeroLights";
// import Particles from "./Particles";
// import { Suspense } from "react";

// const HeroExperience = () => {
//   const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
//   const isTablet = useMediaQuery({ query: "(max-width: 1024px)" });

//   return (
//     <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
//       {/* deep blue ambient */}
//       <ambientLight intensity={0.2} color="#1a1a40" />
//       {/* Configure OrbitControls to disable panning and control zoom based on device type */}
//       <OrbitControls
//         enablePan={false} // Prevents panning of the scene
//         enableZoom={!isTablet} // Disables zoom on tablets
//         maxDistance={20} // Maximum distance for zooming out
//         minDistance={5} // Minimum distance for zooming in
//         minPolarAngle={Math.PI / 5} // Minimum angle for vertical rotation
//         maxPolarAngle={Math.PI / 2} // Maximum angle for vertical rotation
//       />

//       <Suspense fallback={null}>
//         <HeroLights />
//         <Particles count={100} />
//         <group
//           scale={isMobile ? 0.7 : 1}
//           position={[0, -3.5, 0]}
//           rotation={[0, -Math.PI / 4, 0]}
//         >
//           <Room />
//         </group>
//       </Suspense>
//     </Canvas>
//   );
// };

// export default HeroExperience;






// HoroExperience.jsx
import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMediaQuery } from "react-responsive";
import * as THREE from "three";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";

/* -------------------------
   Helper: safe random direction
   (avoids depending on Three's randomDirection)
   ------------------------- */
const randomDirectionVec = () => {
  const v = new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  );
  return v.normalize();
};

/* -------------------------
   Cyber Node (unchanged behavior)
   ------------------------- */
const CyberNode = ({ position, size, color }) => {
  const groupRef = useRef();
  const coreRef = useRef();
  const t = useRef(Math.random() * 100);

  useFrame((_, delta) => {
    t.current += delta * 0.7;
    if (groupRef.current) {
      const pulse = 1 + Math.sin(t.current * 2) * 0.05;
      groupRef.current.scale.setScalar(pulse);
      groupRef.current.rotation.y += delta * 0.1;

      if (coreRef.current) {
        coreRef.current.material.emissiveIntensity = 1.5 + Math.sin(t.current * 3) * 1.2;
      }
    }
  });

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(size, 4), [size]);

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={coreRef} geometry={geometry} scale={0.6}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry} scale={1.5}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.08} />
      </mesh>
    </group>
  );
};

/* -------------------------
   Data conduit (connections)
   replaced randomDirection usage with helper
   ------------------------- */
const DataConduit = ({ start, end, color }) => {
  const curve = useMemo(() => {
    const controlPoint = start.clone().lerp(end, 0.5).add(randomDirectionVec().multiplyScalar(start.distanceTo(end) * 0.9 * 0.2));
    return new THREE.CatmullRomCurve3([start, controlPoint, end]);
  }, [start, end]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 32, 0.01, 8, false]} />
      <meshBasicMaterial color={color} blending={THREE.AdditiveBlending} transparent opacity={0.2} />
    </mesh>
  );
};

/* -------------------------
   TwinklingStars - shader-based
   - per-star attributes: aScale, aSpeed, aPhase
   - shader computes flicker and point size
   ------------------------- */
const TwinklingStars = ({ count = 14000, radius = 200 }) => {
  const pointsRef = useRef();
  const materialRef = useRef();

  // geometry attributes
  const { positions, aScale, aSpeed, aPhase, colorArray } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const aScale = new Float32Array(count);
    const aSpeed = new Float32Array(count);
    const aPhase = new Float32Array(count);
    const colorArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // distribute more stars nearer center: cubic root trick
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // small scale variance
      aScale[i] = 0.6 + Math.random() * 1.4; // base size multiplier
      aSpeed[i] = 0.6 + Math.random() * 2.0; // twinkle speed
      aPhase[i] = Math.random() * Math.PI * 2.0; // phase offset

      // whiten-ish colors with slight tint
      const tint = Math.random() * 0.15;
      colorArray[i * 3] = 1.0 - tint * 0.1; // r
      colorArray[i * 3 + 1] = 1.0 - tint * 0.05; // g
      colorArray[i * 3 + 2] = 1.0; // b
    }

    return { positions, aScale, aSpeed, aPhase, colorArray };
  }, [count, radius]);

  // shader code
  const vertexShader = `
    attribute float aScale;
    attribute float aSpeed;
    attribute float aPhase;
    attribute vec3 colorAttr;
    varying float vAlpha;
    varying vec3 vColor;
    uniform float uTime;

    void main() {
      // flicker between 0.6 and 1.0
      float flicker = 0.65 + 0.35 * sin(uTime * aSpeed + aPhase);
      vAlpha = flicker;
      vColor = colorAttr;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      // scale point size by scale attribute and distance
      // constant 200.0 tuned for a good look; adjust if needed
      float size = aScale * flicker * (200.0 / -mvPosition.z);
      gl_PointSize = clamp(size, 1.0, 80.0);

      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    precision mediump float;
    varying float vAlpha;
    varying vec3 vColor;

    void main() {
      // make points circular and soft
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      float circle = smoothstep(0.5, 0.0, dist);
      // subtle falloff to avoid hard edges
      float alpha = circle * vAlpha;
      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  // update time uniform each frame
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScale" count={aScale.length} array={aScale} itemSize={1} />
        <bufferAttribute attach="attributes-aSpeed" count={aSpeed.length} array={aSpeed} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={aPhase.length} array={aPhase} itemSize={1} />
        <bufferAttribute attach="attributes-colorAttr" count={colorArray.length / 3} array={colorArray} itemSize={3} />
      </bufferGeometry>

      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/* -------------------------
   Cosmic Fog (nebula blending)
   ------------------------- */
const CosmicFog = () => {
  const fogColor = new THREE.Color("#050010");
  return <fog attach="fog" args={[fogColor, 30, 150]} />;
};

/* -------------------------
   Main HoroExperience component
   ------------------------- */
const HoroExperience = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const { nodes, connections } = useMemo(() => {
    const nodeCount = 20;
    const radius = 15;
    const localNodes = [];
    const localConnections = [];
    const colors = ["#00ffff", "#ff00ff", "#FFD700"];

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const pos = new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );
      // jitter a tiny bit so things don't look perfectly spherical
      pos.add(randomDirectionVec().multiplyScalar(0.6));
      localNodes.push({ position: pos, color: colors[i % colors.length] });
    }

    for (let i = 0; i < localNodes.length; i++) {
      for (let j = i + 1; j < localNodes.length; j++) {
        const dist = localNodes[i].position.distanceTo(localNodes[j].position);
        if (dist < radius * 0.9 && Math.random() > 0.6) {
          localConnections.push({
            start: localNodes[i].position,
            end: localNodes[j].position,
            color: localNodes[i].color,
          });
        }
      }
    }
    return { nodes: localNodes, connections: localConnections };
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 45], fov: 60 }} style={{ background: "black" }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[30, 30, 30]} intensity={1.5} color="#ffffff" />

      {/* Dense Twinkling Starfield */}
      <TwinklingStars count={14000} radius={200} />

      {/* Nebula / fog blending */}
      <CosmicFog />

      <OrbitControls autoRotate autoRotateSpeed={0.25} enablePan={false} />

      <Suspense fallback={null}>
        <group scale={isMobile ? 0.7 : 1}>
          {nodes.map((n, i) => (
            <CyberNode key={i} {...n} size={0.9} />
          ))}
          {connections.map((c, i) => (
            <DataConduit key={i} {...c} />
          ))}
        </group>
      </Suspense>

      <EffectComposer>
        <Bloom intensity={1.6} luminanceThreshold={0.05} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={1.2} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
};

export default HoroExperience;



