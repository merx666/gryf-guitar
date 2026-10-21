import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { NoteHit } from '../types';
import { STRING_COLORS } from './HighwayView';

// Cache dla tekstur progów (0-24) — zero troika web workerów, natychmiastowe 60/120 FPS
const FRET_TEXTURE_CACHE = new Map<number, THREE.CanvasTexture>();

function getFretTexture(fret: number): THREE.CanvasTexture {
  const cached = FRET_TEXTURE_CACHE.get(fret);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b0907';
    ctx.beginPath();
    ctx.arc(64, 64, 54, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 62px Barlow, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fret === 0 ? 'O' : fret.toString(), 64, 66);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  FRET_TEXTURE_CACHE.set(fret, texture);
  return texture;
}

// Konfiguracja geometrii gryfu 3D
const HIGHWAY_LENGTH = 32;
const STRING_SPACING = 0.85;
const STRING_COUNT = 6;
const HIGHWAY_WIDTH = (STRING_COUNT - 1) * STRING_SPACING + 1.2;
const HIT_Z = 0; // Pozycja linii uderzenia
const SPEED_MULT = 14; // Prędkość przesuwania nut w jednostkach 3D na sekundę

interface Note3DItem {
  id: number;
  string: number;
  fret: number;
  time: number;
  duration: number;
  hit: boolean;
  missed: boolean;
}

interface Highway3DSceneProps {
  currentTime: number;
  notes: { hit: boolean; missed: boolean; note: NoteHit }[];
  stringVibrations: number[];
  streak: number;
  multiplier: number;
  sparks: Array<{
    id: number;
    pos: [number, number, number];
    color: string;
    velocity: [number, number, number];
    life: number;
  }>;
}

// 1. Drewniany gryf gitarowy (Palisander / Heban) z progami i inkrustacjami
const FretboardMesh: React.FC = () => {
  // Progi niklowo-srebrne wzdłuż gryfu
  const frets = useMemo(() => {
    const list = [];
    for (let i = 0; i <= 24; i++) {
      // Skalowanie odległości progów
      const z = -HIGHWAY_LENGTH * (i / 24);
      list.push(z);
    }
    return list;
  }, []);

  return (
    <group position={[0, -0.2, -HIGHWAY_LENGTH / 2]}>
      {/* Płyta podstrunnicy */}
      <mesh receiveShadow>
        <boxGeometry args={[HIGHWAY_WIDTH, 0.25, HIGHWAY_LENGTH + 4]} />
        <meshStandardMaterial
          color="#120e0a"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Binding (boczne olistwowanie kremowe) */}
      <mesh position={[-HIGHWAY_WIDTH / 2 - 0.05, 0.02, 0]}>
        <boxGeometry args={[0.08, 0.26, HIGHWAY_LENGTH + 4]} />
        <meshStandardMaterial color="#f0e6d2" roughness={0.3} />
      </mesh>
      <mesh position={[HIGHWAY_WIDTH / 2 + 0.05, 0.02, 0]}>
        <boxGeometry args={[0.08, 0.26, HIGHWAY_LENGTH + 4]} />
        <meshStandardMaterial color="#f0e6d2" roughness={0.3} />
      </mesh>

      {/* Progi metalowe */}
      {frets.map((z, idx) => (
        <group key={idx} position={[0, 0.13, z + HIGHWAY_LENGTH / 2]}>
          <mesh>
            <boxGeometry args={[HIGHWAY_WIDTH - 0.1, 0.04, 0.08]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          {/* Markery progów (3, 5, 7, 9, 12, 15, 17, 19, 21, 24) */}
          {[3, 5, 7, 9, 15, 17, 19, 21].includes(idx) && (
            <mesh position={[0, 0.01, 0.6]}>
              <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.1} />
            </mesh>
          )}
          {idx === 12 && (
            <>
              <mesh position={[-0.6, 0.01, 0.6]}>
                <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.1} />
              </mesh>
              <mesh position={[0.6, 0.01, 0.6]}>
                <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.1} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
};

// 2. 6 Strun gitarowych z neonowym podświetleniem Rocksmith i drganiem
const GuitarStrings: React.FC<{ stringVibrations: number[] }> = ({ stringVibrations }) => {
  const stringsGroup = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!stringsGroup.current) return;
    stringsGroup.current.children.forEach((child, i) => {
      const vib = stringVibrations[i] || 0;
      if (vib > 0) {
        // Drganie struny góra/dół
        child.position.y = 0.04 + Math.sin(Date.now() * 0.06 + i) * vib * 0.08;
      } else {
        child.position.y = 0.04;
      }
    });
  });

  return (
    <group ref={stringsGroup}>
      {STRING_COLORS.map((color, idx) => {
        const x = -((STRING_COUNT - 1) * STRING_SPACING) / 2 + idx * STRING_SPACING;
        const thickness = 0.025 + (5 - idx) * 0.006; // grubsze struny basowe
        return (
          <group key={idx} position={[x, 0.04, -HIGHWAY_LENGTH / 2]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[thickness, thickness, HIGHWAY_LENGTH + 4, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.65}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// 3. Linia trafienia (Hit Line / Zero Fret Nut) z laserowym glowem
const StrikeLine: React.FC<{ multiplier: number }> = ({ multiplier }) => {
  const hitGlow = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!hitGlow.current) return;
    const pulse = Math.sin(clock.getElapsedTime() * 8) * 0.2 + 0.8;
    (hitGlow.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * (0.8 + multiplier * 0.3);
  });

  return (
    <group position={[0, 0.06, HIT_Z]}>
      {/* Główna metalowa belka */}
      <mesh>
        <boxGeometry args={[HIGHWAY_WIDTH, 0.06, 0.18]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#e0392b"
          emissiveIntensity={1.2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Neonowa poświata uderzenia */}
      <mesh ref={hitGlow} position={[0, 0.03, 0]}>
        <boxGeometry args={[HIGHWAY_WIDTH * 1.05, 0.04, 0.35]} />
        <meshStandardMaterial
          color="#ff4422"
          emissive="#ff2200"
          emissiveIntensity={1.0}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

// 4. Pigułki Nutowe 3D (Note Gems) biegnące w kierunku gracza
const NoteGems3D: React.FC<{
  currentTime: number;
  notes: { hit: boolean; missed: boolean; note: NoteHit }[];
}> = ({ currentTime, notes }) => {
  // Filtrujemy nuty w oknie widoczności autostrady (np. od 3 sekundy w przyszłości do 0.5s po uderzeniu)
  const visibleNotes = useMemo(() => {
    const list: Array<{ item: { hit: boolean; missed: boolean; note: NoteHit }; z: number; x: number }> = [];
    const windowSec = HIGHWAY_LENGTH / SPEED_MULT;

    for (let i = 0; i < notes.length; i++) {
      const item = notes[i];
      if (item.hit) continue; // ukrywamy już trafione
      const timeDiff = item.note.time - currentTime;
      // Nuta pojawia się na horyzoncie gdy timeDiff <= windowSec
      if (timeDiff >= -0.2 && timeDiff <= windowSec) {
        const z = HIT_Z - timeDiff * SPEED_MULT;
        const x = -((STRING_COUNT - 1) * STRING_SPACING) / 2 + item.note.string * STRING_SPACING;
        list.push({ item, z, x });
      }
    }
    return list;
  }, [currentTime, notes]);

  return (
    <group>
      {visibleNotes.map(({ item, z, x }) => {
        const color = STRING_COLORS[item.note.string];
        const isMissed = item.missed;

        return (
          <group key={`${item.note.time}-${item.note.string}`} position={[x, 0.14, z]}>
            {/* Kryształ / pigułka nutowa 3D */}
            <mesh castShadow>
              <boxGeometry args={[STRING_SPACING * 0.85, 0.18, 0.45]} />
              <meshStandardMaterial
                color={isMissed ? '#475569' : color}
                emissive={isMissed ? '#1e293b' : color}
                emissiveIntensity={isMissed ? 0.2 : 1.4}
                metalness={0.7}
                roughness={0.15}
              />
            </mesh>

            {/* Oznaczenie numeru progu na nucie (natychmiastowy CanvasTexture) */}
            <mesh position={[0, 0.10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.34, 0.34]} />
              <meshBasicMaterial
                map={getFretTexture(item.note.fret)}
                transparent
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// 5. Cząsteczki iskier i wyładowań (Three.js GPU Spark System)
const SparksSystem3D: React.FC<{
  sparks: Array<{
    id: number;
    pos: [number, number, number];
    color: string;
    velocity: [number, number, number];
    life: number;
  }>;
}> = ({ sparks }) => {
  return (
    <group>
      {sparks.map((spark) => (
        <mesh key={spark.id} position={spark.pos}>
          <sphereGeometry args={[0.06 * spark.life, 8, 8]} />
          <meshBasicMaterial
            color={spark.color}
            transparent
            opacity={Math.min(1, spark.life * 1.5)}
          />
        </mesh>
      ))}
    </group>
  );
};

// 6. Główna Scena 3D ze śledzącą kamerą i światłami koncertowymi
const Highway3DScene: React.FC<Highway3DSceneProps> = ({
  currentTime,
  notes,
  stringVibrations,
  streak,
  multiplier,
  sparks,
}) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(({ clock }) => {
    if (!cameraRef.current) return;
    // Subtelny oddech kamery i wstrząs przy wysokiej serii (streak)
    const t = clock.getElapsedTime();
    const shake = streak >= 20 ? Math.sin(t * 30) * 0.015 : 0;
    cameraRef.current.position.x = shake;
    cameraRef.current.position.y = 2.4 + Math.sin(t * 1.5) * 0.02;
  });

  return (
    <>
      {/* Kinematyczna kamera Rocksmith nachylona nad gryfem */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 2.4, 3.8]}
        rotation={[-0.48, 0, 0]}
        fov={52}
      />

      {/* Oświetlenie sceniczne */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <spotLight
        position={[0, 8, -6]}
        angle={0.6}
        penumbra={0.8}
        intensity={2.8}
        color="#ffeedd"
        target-position={[0, 0, HIT_Z]}
      />
      {/* Boczne światła neonowe Rock Concert */}
      <pointLight position={[-4, 3, -10]} intensity={1.5} color="#3b82f6" distance={15} />
      <pointLight position={[4, 3, -10]} intensity={1.5} color="#e0392b" distance={15} />

      {/* Komponenty świata 3D */}
      <FretboardMesh />
      <GuitarStrings stringVibrations={stringVibrations} />
      <StrikeLine multiplier={multiplier} />
      <NoteGems3D currentTime={currentTime} notes={notes} />
      <SparksSystem3D sparks={sparks} />

      {/* Efekty post-processingu (Bloom + Vignette) */}
      <EffectComposer multisampling={4}>
        <Bloom
          luminanceThreshold={0.5}
          luminanceSmoothing={0.7}
          intensity={1.2 + multiplier * 0.15}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.15} darkness={0.85} />
      </EffectComposer>
    </>
  );
};

// 7. Główny komponent z Canvasem R3F gotowy do montażu w HighwayView
export const Highway3DCanvas: React.FC<Highway3DSceneProps> = (props) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        className="w-full h-full"
      >
        <color attach="background" args={['#070504']} />
        <Highway3DScene {...props} />
      </Canvas>
    </div>
  );
};
