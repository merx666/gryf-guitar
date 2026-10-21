import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { NoteHit } from '../types';

// Standardowe kolory strun Rocksmith (Czerwony, Żółty, Niebieski, Pomarańczowy, Zielony, Fioletowy)
export const ROCKSMITH_STRING_COLORS = [
  '#e0392b', // 0: E niska (Czerwona)
  '#f59e0b', // 1: A (Żółta)
  '#3b82f6', // 2: D (Niebieska)
  '#f97316', // 3: G (Pomarańczowa)
  '#10b981', // 4: B (Zielona)
  '#a855f7', // 5: e wysoka (Fioletowa)
];

export const STRING_GAUGES = [0.042, 0.034, 0.026, 0.019, 0.014, 0.010];

// Konfiguracja wymiarów autostrady Rocksmith 3D
const HIGHWAY_LENGTH = 36;
const STRING_SPACING = 0.82;
const STRING_COUNT = 6;
const HIGHWAY_WIDTH = (STRING_COUNT - 1) * STRING_SPACING + 1.2;
const HIT_Z = 0; // Linia uderzenia na zerowym progu
const SPEED_MULT = 14; // Prędkość przemieszczania nut w głąb sceny

// Cache tekstur progów (0-24) dla zerowego narzutu wydajnościowego
const FRET_TEXTURE_CACHE = new Map<string, THREE.CanvasTexture>();

function getFretTexture(fret: number, color: string): THREE.CanvasTexture {
  const key = `${fret}-${color}`;
  const cached = FRET_TEXTURE_CACHE.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Tło pigułki
    ctx.fillStyle = '#0a0807';
    ctx.beginPath();
    ctx.roundRect(8, 8, 112, 112, 24);
    ctx.fill();

    // Neonowa obwódka
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.stroke();

    // Liczba progu (Rocksmith stencil style)
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px "Big Shoulders Display", "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(fret === 0 ? 'O' : fret.toString(), 64, 68);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  FRET_TEXTURE_CACHE.set(key, texture);
  return texture;
}

interface Highway3DSceneProps {
  currentTime: number;
  notes: { hit: boolean; missed: boolean; note: NoteHit }[];
  stringVibrations: number[];
  streak: number;
  multiplier: number;
  tempo?: number;
  sparks: Array<{
    id: number;
    pos: [number, number, number];
    color: string;
    velocity: [number, number, number];
    life: number;
  }>;
}

// 1. Scena Koncertowa Rocksmith (Ściana wzmacniaczy, reflektory, dym sceniczny, refleksy na podłodze)
const ConcertStageEnvironment: React.FC<{ streak: number }> = ({ streak }) => {
  const spotLeft = useRef<THREE.SpotLight>(null);
  const spotRight = useRef<THREE.SpotLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spotLeft.current) {
      spotLeft.current.position.x = -8 + Math.sin(t * 0.8) * 2;
      spotLeft.current.intensity = 3.5 + Math.sin(t * 4) * 0.5;
    }
    if (spotRight.current) {
      spotRight.current.position.x = 8 + Math.cos(t * 0.8) * 2;
      spotRight.current.intensity = 3.5 + Math.cos(t * 4) * 0.5;
    }
  });

  return (
    <group>
      {/* Refleksyjna podłoga sceny (mokry lakier sceniczny) */}
      <mesh position={[0, -0.4, -HIGHWAY_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HIGHWAY_WIDTH * 4, HIGHWAY_LENGTH * 1.5]} />
        <meshStandardMaterial
          color="#060408"
          roughness={0.25}
          metalness={0.75}
        />
      </mesh>

      {/* Tło sceniczne z kolumnami głośnikowymi 4x12 w cieniu */}
      {[-8, -5, 5, 8].map((x, i) => (
        <group key={i} position={[x, 1.8, -HIGHWAY_LENGTH - 4]}>
          {/* Kolumna głośnikowa */}
          <mesh>
            <boxGeometry args={[2.4, 4.2, 1.6]} />
            <meshStandardMaterial color="#0f0c0d" roughness={0.9} />
          </mesh>
          {/* Maskownica głośników */}
          <mesh position={[0, 0, 0.82]}>
            <planeGeometry args={[2.2, 4.0]} />
            <meshStandardMaterial color="#1a1518" roughness={0.95} />
          </mesh>
          {/* Czerwona lampka standby na wzmacniaczu */}
          <mesh position={[0.7, 2.0, 0.85]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#ff2200" />
          </mesh>
        </group>
      ))}

      {/* Światła koncertowe */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 12, 6]} intensity={1.5} color="#fff8f0" />

      {/* Dwa ruchome spoty sceniczne (Crimson & Cyan) */}
      <spotLight
        ref={spotLeft}
        position={[-8, 10, -12]}
        target-position={[0, 0, HIT_Z]}
        angle={0.5}
        penumbra={0.8}
        color={streak >= 20 ? '#ff3b30' : '#38bdf8'}
        intensity={3.5}
      />
      <spotLight
        ref={spotRight}
        position={[8, 10, -12]}
        target-position={[0, 0, HIT_Z]}
        angle={0.5}
        penumbra={0.8}
        color={streak >= 20 ? '#ffaa00' : '#a855f7'}
        intensity={3.5}
      />
    </group>
  );
};

// 2. Podstrunnica 3D (Heban / Palisander, binding, niklowane progi, markery perłowe, klamra pozycji dłoni)
const RocksmithFretboard: React.FC<{ activeFretRange: [number, number] }> = ({ activeFretRange }) => {
  // Progi 1-24 z logarytmicznym / perspektywicznym podziałem
  const frets = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const z = -HIGHWAY_LENGTH * (i / 24);
      list.push(z);
    }
    return list;
  }, []);

  return (
    <group position={[0, -0.15, -HIGHWAY_LENGTH / 2]}>
      {/* Drewniana płyta podstrunnicy (Ciemny palisander indyjski z połyskiem) */}
      <mesh receiveShadow>
        <boxGeometry args={[HIGHWAY_WIDTH, 0.22, HIGHWAY_LENGTH + 4]} />
        <meshStandardMaterial
          color="#120c09"
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>

      {/* Kremowy binding z kropkami bocznymi (Krem vintage) */}
      <mesh position={[-HIGHWAY_WIDTH / 2 - 0.04, 0.02, 0]}>
        <boxGeometry args={[0.08, 0.24, HIGHWAY_LENGTH + 4]} />
        <meshStandardMaterial color="#f2ead8" roughness={0.4} />
      </mesh>
      <mesh position={[HIGHWAY_WIDTH / 2 + 0.04, 0.02, 0]}>
        <boxGeometry args={[0.08, 0.24, HIGHWAY_LENGTH + 4]} />
        <meshStandardMaterial color="#f2ead8" roughness={0.4} />
      </mesh>

      {/* Metalowe progi nikiel-srebro (24 progi) */}
      {frets.map((z, idx) => {
        const isMajorFret = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(idx);
        return (
          <group key={idx} position={[0, 0.12, z + HIGHWAY_LENGTH / 2]}>
            {/* Drut progowy z metalicznym odbłyskiem */}
            <mesh>
              <boxGeometry args={[HIGHWAY_WIDTH - 0.05, 0.05, 0.09]} />
              <meshStandardMaterial
                color="#e5e7eb"
                metalness={0.95}
                roughness={0.15}
              />
            </mesh>

            {/* Perłowe inkrustacje (Pearloid inlays - pojedyncze i podwójne na 12/24 progu) */}
            {[3, 5, 7, 9, 15, 17, 19, 21].includes(idx) && (
              <mesh position={[0, 0.005, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.4, 0.4]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.3} />
              </mesh>
            )}

            {(idx === 12 || idx === 24) && (
              <>
                <mesh position={[-0.8, 0.005, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.35, 0.35]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.3} />
                </mesh>
                <mesh position={[0.8, 0.005, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.35, 0.35]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.3} />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {/* Klamra pozycji dłoni (Rocksmith Hand Anchor - świecący lazurowy boks wskazujący 4 aktywne progi) */}
      <group position={[0, 0.14, HIGHWAY_LENGTH / 2 - ((activeFretRange[0] + 1.5) / 24) * HIGHWAY_LENGTH]}>
        <mesh>
          <boxGeometry args={[HIGHWAY_WIDTH * 1.02, 0.02, (4 / 24) * HIGHWAY_LENGTH]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} />
        </mesh>
        {/* Neonowe ramki boczne klamry */}
        <mesh position={[-HIGHWAY_WIDTH / 2 - 0.02, 0.06, 0]}>
          <boxGeometry args={[0.06, 0.12, (4 / 24) * HIGHWAY_LENGTH]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[HIGHWAY_WIDTH / 2 + 0.02, 0.06, 0]}>
          <boxGeometry args={[0.06, 0.12, (4 / 24) * HIGHWAY_LENGTH]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>
    </group>
  );
};

// 3. Struny Rocksmith z harmonicznym drganiem i zmienną grubością
const RocksmithStrings: React.FC<{ stringVibrations: number[] }> = ({ stringVibrations }) => {
  const stringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!stringsRef.current) return;
    const t = clock.getElapsedTime();

    stringsRef.current.children.forEach((stringGroup, i) => {
      const vib = stringVibrations[i] || 0;
      if (vib > 0) {
        // Realistyczna fala stojąca na uderzonej strunie
        stringGroup.position.y = 0.06 + Math.sin(t * 35 + i * 2) * vib * 0.09;
      } else {
        stringGroup.position.y = 0.06;
      }
    });
  });

  return (
    <group ref={stringsRef}>
      {ROCKSMITH_STRING_COLORS.map((color, idx) => {
        const x = -((STRING_COUNT - 1) * STRING_SPACING) / 2 + idx * STRING_SPACING;
        const radius = STRING_GAUGES[idx];

        return (
          <group key={idx} position={[x, 0.06, -HIGHWAY_LENGTH / 2]}>
            {/* Główna struna metalowa */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[radius, radius, HIGHWAY_LENGTH + 4, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.8}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>

            {/* Neonowa poświata laserowa wzdłuż struny (prowadnica Rocksmith) */}
            <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.18, HIGHWAY_LENGTH + 4]} />
              <meshBasicMaterial color={color} transparent opacity={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// 4. Siatka Taktowa (Beat & Measure Lines poruszające się w rytmie BPM)
const BeatGridLines: React.FC<{ currentTime: number; tempo?: number }> = ({
  currentTime,
  tempo = 120,
}) => {
  const beatInterval = 60 / tempo;
  const startBeat = Math.floor(currentTime / beatInterval);

  const lines = useMemo(() => {
    const list: Array<{ z: number; isMeasure: boolean }> = [];
    for (let b = 0; b <= 18; b++) {
      const beatTime = (startBeat + b) * beatInterval;
      const timeAhead = beatTime - currentTime;
      if (timeAhead >= -0.2 && timeAhead <= HIGHWAY_LENGTH / SPEED_MULT) {
        const z = HIT_Z - timeAhead * SPEED_MULT;
        const isMeasure = (startBeat + b) % 4 === 0;
        list.push({ z, isMeasure });
      }
    }
    return list;
  }, [currentTime, startBeat, beatInterval]);

  return (
    <group>
      {lines.map((item, idx) => (
        <mesh key={idx} position={[0, 0.04, item.z]}>
          <boxGeometry args={[HIGHWAY_WIDTH * 0.98, 0.02, item.isMeasure ? 0.09 : 0.03]} />
          <meshBasicMaterial
            color={item.isMeasure ? '#f2ead8' : '#64748b'}
            transparent
            opacity={item.isMeasure ? 0.65 : 0.25}
          />
        </mesh>
      ))}
    </group>
  );
};

// 5. Autentyczne Kryształy Nutowe Rocksmith 2014 & Rocksmith+ (Pigułki 3D, Otwarte Obręcze, Smugi Sustain)
const RocksmithNoteGems: React.FC<{
  currentTime: number;
  notes: { hit: boolean; missed: boolean; note: NoteHit }[];
}> = ({ currentTime, notes }) => {
  const windowSec = HIGHWAY_LENGTH / SPEED_MULT;

  const visibleItems = useMemo(() => {
    const list: Array<{
      item: { hit: boolean; missed: boolean; note: NoteHit };
      z: number;
      x: number;
      color: string;
      tailZ: number;
      hasTail: boolean;
    }> = [];

    for (let i = 0; i < notes.length; i++) {
      const item = notes[i];
      if (item.hit) continue;

      const timeDiff = item.note.time - currentTime;
      if (timeDiff >= -0.2 && timeDiff <= windowSec) {
        const z = HIT_Z - timeDiff * SPEED_MULT;
        const x = -((STRING_COUNT - 1) * STRING_SPACING) / 2 + item.note.string * STRING_SPACING;
        const color = ROCKSMITH_STRING_COLORS[item.note.string] || '#ffffff';

        // Ogon podtrzymania (Sustain Tail)
        const hasTail = item.note.duration > 0.35;
        const tailLength = Math.min(item.note.duration * SPEED_MULT, HIGHWAY_LENGTH);
        const tailZ = z - tailLength / 2;

        list.push({ item, z, x, color, tailZ, hasTail });
      }
    }
    return list;
  }, [currentTime, notes, windowSec]);

  return (
    <group>
      {visibleItems.map(({ item, z, x, color, tailZ, hasTail }) => {
        const isMissed = item.missed;
        const isOpenString = item.note.fret === 0;

        return (
          <group key={`${item.note.time}-${item.note.string}`}>
            {/* A. Smuga podtrzymania dźwięku (Sustain Ribbon z neonową krawędzią) */}
            {hasTail && (
              <group position={[x, 0.12, tailZ]}>
                <mesh>
                  <boxGeometry args={[STRING_SPACING * 0.45, 0.03, item.note.duration * SPEED_MULT]} />
                  <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={isMissed ? 0.1 : 0.4}
                  />
                </mesh>
                {/* Boczne krawędzie laserowe smugi */}
                <mesh position={[-STRING_SPACING * 0.22, 0.01, 0]}>
                  <boxGeometry args={[0.04, 0.04, item.note.duration * SPEED_MULT]} />
                  <meshBasicMaterial color={color} />
                </mesh>
                <mesh position={[STRING_SPACING * 0.22, 0.01, 0]}>
                  <boxGeometry args={[0.04, 0.04, item.note.duration * SPEED_MULT]} />
                  <meshBasicMaterial color={color} />
                </mesh>
              </group>
            )}

            {/* B. NUTA OTWARTA (Rocksmith Open String Hoop — świecąca prostokątna obręcz obejmująca strunę) */}
            {isOpenString ? (
              <group position={[x, 0.14, z]}>
                {/* Górna belka obręczy */}
                <mesh position={[0, 0.16, 0]}>
                  <boxGeometry args={[STRING_SPACING * 0.9, 0.06, 0.35]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.8}
                  />
                </mesh>
                {/* Dolna belka obręczy */}
                <mesh position={[0, -0.06, 0]}>
                  <boxGeometry args={[STRING_SPACING * 0.9, 0.06, 0.35]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.8}
                  />
                </mesh>
                {/* Lewa belka */}
                <mesh position={[-STRING_SPACING * 0.42, 0.05, 0]}>
                  <boxGeometry args={[0.06, 0.28, 0.35]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.8}
                  />
                </mesh>
                {/* Prawa belka */}
                <mesh position={[STRING_SPACING * 0.42, 0.05, 0]}>
                  <boxGeometry args={[0.06, 0.28, 0.35]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.8}
                  />
                </mesh>
              </group>
            ) : (
              /* C. NUTA PROGOWA (Rocksmith 3D Beveled Gem — ścięty kryształ 3D z numerem progu) */
              <group position={[x, 0.14, z]}>
                {/* Bryła kryształu 3D */}
                <mesh castShadow>
                  <boxGeometry args={[STRING_SPACING * 0.88, 0.22, 0.52]} />
                  <meshStandardMaterial
                    color={isMissed ? '#334155' : color}
                    emissive={isMissed ? '#0f172a' : color}
                    emissiveIntensity={isMissed ? 0.2 : 1.5}
                    metalness={0.8}
                    roughness={0.15}
                  />
                </mesh>

                {/* Świecący wierzch kryształu z numerem progu (wytłoczenie) */}
                <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.38, 0.38]} />
                  <meshBasicMaterial
                    map={getFretTexture(item.note.fret, color)}
                    transparent
                    depthWrite={false}
                  />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

// 6. Linia Uderzenia (Zero Fret Hit Zone z celownikami laserowymi)
const RocksmithStrikeBar: React.FC<{ multiplier: number }> = ({ multiplier }) => {
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!pulseRef.current) return;
    const p = Math.sin(clock.getElapsedTime() * 10) * 0.3 + 0.7;
    (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = p * 0.75;
  });

  return (
    <group position={[0, 0.08, HIT_Z]}>
      {/* Chromowana belka uderzenia */}
      <mesh>
        <boxGeometry args={[HIGHWAY_WIDTH * 1.05, 0.08, 0.25]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.95}
          roughness={0.1}
        />
      </mesh>

      {/* Laserowa poświata uderzenia */}
      <mesh ref={pulseRef} position={[0, 0.04, 0]}>
        <boxGeometry args={[HIGHWAY_WIDTH * 1.08, 0.05, 0.4]} />
        <meshBasicMaterial
          color="#e0392b"
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Celowniki strun na linii uderzenia (Target Reticles) */}
      {ROCKSMITH_STRING_COLORS.map((col, idx) => {
        const x = -((STRING_COUNT - 1) * STRING_SPACING) / 2 + idx * STRING_SPACING;
        return (
          <mesh key={idx} position={[x, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.18, 0.26, 16]} />
            <meshBasicMaterial color={col} />
          </mesh>
        );
      })}
    </group>
  );
};

// 7. Cząsteczki Iskier Rocksmith (High-Voltage Plasma Sparks)
const RocksmithSparks: React.FC<{
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
      {sparks.map((sp) => (
        <mesh key={sp.id} position={sp.pos}>
          <sphereGeometry args={[0.07 * Math.max(0.1, sp.life), 8, 8]} />
          <meshBasicMaterial
            color={sp.color}
            transparent
            opacity={Math.min(1, sp.life * 1.8)}
          />
        </mesh>
      ))}
    </group>
  );
};

// 8. Główna Scena 3D z Kinematyczną Kamerą Rocksmith
const Highway3DScene: React.FC<Highway3DSceneProps> = ({
  currentTime,
  notes,
  stringVibrations,
  streak,
  multiplier,
  tempo,
  sparks,
}) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // Wyznaczamy zakres aktywnej pozycji dłoni (np. progi 3-6 lub 5-8)
  const activeFretRange = useMemo<[number, number]>(() => {
    let minFret = 1;
    for (const item of notes) {
      if (item.hit) continue;
      const dt = item.note.time - currentTime;
      if (dt >= 0 && dt <= 2.5 && item.note.fret > 0) {
        minFret = item.note.fret;
        break;
      }
    }
    const start = Math.max(1, Math.min(20, minFret));
    return [start, start + 3];
  }, [currentTime, notes]);

  useFrame(({ clock }) => {
    if (!cameraRef.current) return;
    const t = clock.getElapsedTime();
    // Rocksmith camera breathing & riff shake
    const shake = streak >= 15 ? Math.sin(t * 32) * 0.015 : 0;
    cameraRef.current.position.x = shake;
    cameraRef.current.position.y = 3.2 + Math.sin(t * 1.4) * 0.02;
  });

  return (
    <>
      {/* Kinematyczna kamera Rocksmith nachylona nad gryfem */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 3.2, 4.4]}
        rotation={[-0.44, 0, 0]}
        fov={54}
      />

      <ConcertStageEnvironment streak={streak} />
      <RocksmithFretboard activeFretRange={activeFretRange} />
      <RocksmithStrings stringVibrations={stringVibrations} />
      <BeatGridLines currentTime={currentTime} tempo={tempo} />
      <RocksmithNoteGems currentTime={currentTime} notes={notes} />
      <RocksmithStrikeBar multiplier={multiplier} />
      <RocksmithSparks sparks={sparks} />

      {/* Efekty Sceniczne Bloom & Vignette */}
      <EffectComposer multisampling={4}>
        <Bloom
          luminanceThreshold={0.45}
          luminanceSmoothing={0.7}
          intensity={1.4 + multiplier * 0.15}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.8} />
      </EffectComposer>
    </>
  );
};

export const Highway3DCanvas: React.FC<Highway3DSceneProps> = (props) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        className="w-full h-full"
      >
        <color attach="background" args={['#060408']} />
        <Highway3DScene {...props} />
      </Canvas>
    </div>
  );
};
