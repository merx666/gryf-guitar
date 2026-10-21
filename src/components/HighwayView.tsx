import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Flame, Sparkles, CheckCircle2, Box, Layers, SlidersHorizontal } from 'lucide-react';
import { audio } from '../audio/audioEngine';
import { sfx } from '../audio/sfxPlayer';
import { PitchDetectionResult, NoteHit } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Highway3DCanvas, ROCKSMITH_STRING_COLORS } from './Highway3DCanvas';
import { multiplayer } from '../multiplayer/colyseusClient';

interface HighwayViewProps {
  songTitle: string;
  artist: string;
  tempo?: number;
  notes?: NoteHit[];
  onExit: () => void;
  onSongComplete?: (score: number, accuracy: number, stars: number) => void;
}

export const STRING_COLORS = ROCKSMITH_STRING_COLORS;
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

// Cząsteczki iskier uderzenia (Physics Plasma Sparks)
interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Baza klasycznych riffów demonstracyjnych Rocksmith (Smoke on the Water, Back in Black, Pentatonic Solo)
const DEFAULT_ROCK_SONG_NOTES: NoteHit[] = [
  // 1. Riff Smoke on the Water (Pojedyncze nuty)
  { string: 0, fret: 0, time: 2.0, duration: 0.5 },
  { string: 0, fret: 3, time: 2.6, duration: 0.5 },
  { string: 0, fret: 5, time: 3.2, duration: 0.8 },
  { string: 0, fret: 0, time: 4.4, duration: 0.5 },
  { string: 0, fret: 3, time: 5.0, duration: 0.5 },
  { string: 0, fret: 6, time: 5.6, duration: 0.4 },
  { string: 0, fret: 5, time: 6.0, duration: 1.0 },
  { string: 0, fret: 0, time: 7.2, duration: 0.5 },
  { string: 0, fret: 3, time: 7.8, duration: 0.5 },
  { string: 0, fret: 5, time: 8.4, duration: 0.8 },
  { string: 0, fret: 3, time: 9.4, duration: 0.5 },
  { string: 0, fret: 0, time: 10.0, duration: 1.5 },

  // 2. Double-Stopy / Dwudźwięki Rocksmith (Struny D i G)
  { string: 2, fret: 0, time: 12.0, duration: 0.5 },
  { string: 3, fret: 0, time: 12.0, duration: 0.5 },
  { string: 2, fret: 3, time: 12.6, duration: 0.5 },
  { string: 3, fret: 3, time: 12.6, duration: 0.5 },
  { string: 2, fret: 5, time: 13.2, duration: 0.8 },
  { string: 3, fret: 5, time: 13.2, duration: 0.8 },

  { string: 2, fret: 0, time: 14.4, duration: 0.5 },
  { string: 3, fret: 0, time: 14.4, duration: 0.5 },
  { string: 2, fret: 3, time: 15.0, duration: 0.5 },
  { string: 3, fret: 3, time: 15.0, duration: 0.5 },
  { string: 2, fret: 6, time: 15.6, duration: 0.4 },
  { string: 3, fret: 6, time: 15.6, duration: 0.4 },
  { string: 2, fret: 5, time: 16.0, duration: 1.0 },
  { string: 3, fret: 5, time: 16.0, duration: 1.0 },

  { string: 2, fret: 0, time: 17.2, duration: 0.5 },
  { string: 3, fret: 0, time: 17.2, duration: 0.5 },
  { string: 2, fret: 3, time: 17.8, duration: 0.5 },
  { string: 3, fret: 3, time: 17.8, duration: 0.5 },
  { string: 2, fret: 5, time: 18.4, duration: 0.8 },
  { string: 3, fret: 5, time: 18.4, duration: 0.8 },
  { string: 2, fret: 3, time: 19.4, duration: 0.5 },
  { string: 3, fret: 3, time: 19.4, duration: 0.5 },
  { string: 2, fret: 0, time: 20.0, duration: 1.8 },
  { string: 3, fret: 0, time: 20.0, duration: 1.8 },

  // 3. Riff Rytmiczny Back in Black (Akordy Power Chord + Blues Lick)
  { string: 0, fret: 0, time: 22.5, duration: 0.8 },
  { string: 1, fret: 2, time: 22.5, duration: 0.8 },
  // D5
  { string: 2, fret: 0, time: 24.0, duration: 0.3 },
  { string: 3, fret: 2, time: 24.0, duration: 0.3 },
  { string: 4, fret: 3, time: 24.0, duration: 0.3 },
  { string: 2, fret: 0, time: 24.5, duration: 0.3 },
  { string: 3, fret: 2, time: 24.5, duration: 0.3 },
  { string: 4, fret: 3, time: 24.5, duration: 0.3 },
  // A5
  { string: 1, fret: 0, time: 25.5, duration: 0.3 },
  { string: 2, fret: 2, time: 25.5, duration: 0.3 },
  { string: 3, fret: 2, time: 25.5, duration: 0.3 },
  { string: 1, fret: 0, time: 26.0, duration: 0.3 },
  { string: 2, fret: 2, time: 26.0, duration: 0.3 },
  { string: 3, fret: 2, time: 26.0, duration: 0.3 },
  // Blues lick na dole gryfu
  { string: 0, fret: 3, time: 27.0, duration: 0.4 },
  { string: 0, fret: 0, time: 27.5, duration: 0.4 },
  { string: 1, fret: 2, time: 28.0, duration: 0.4 },
  { string: 1, fret: 0, time: 28.5, duration: 0.4 },
  { string: 2, fret: 2, time: 29.0, duration: 0.8 },

  // 4. Solo Pentatoniczne na progach 12-15 (Lead Guitar)
  { string: 5, fret: 12, time: 31.5, duration: 0.4 },
  { string: 5, fret: 15, time: 32.0, duration: 0.6 },
  { string: 4, fret: 12, time: 32.8, duration: 0.4 },
  { string: 4, fret: 15, time: 33.3, duration: 0.6 },
  { string: 3, fret: 12, time: 34.1, duration: 0.4 },
  { string: 3, fret: 14, time: 34.6, duration: 0.8 },
  { string: 2, fret: 12, time: 35.6, duration: 0.4 },
  { string: 2, fret: 14, time: 36.1, duration: 0.6 },
  { string: 1, fret: 12, time: 37.0, duration: 0.4 },
  { string: 1, fret: 14, time: 37.5, duration: 0.6 },
  { string: 0, fret: 12, time: 38.3, duration: 0.4 },
  { string: 0, fret: 15, time: 38.8, duration: 1.8 },
];

export const HighwayView: React.FC<HighwayViewProps> = ({
  songTitle,
  artist,
  tempo = 112,
  notes: initialNotes,
  onExit,
  onSongComplete,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stan rozgrywki
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [hitFeedback, setHitFeedback] = useState<{ text: string; color: string; id: number } | null>(null);
  const [currentSongTime, setCurrentSongTime] = useState<number>(0);
  const [detectedPitch, setDetectedPitch] = useState<PitchDetectionResult | null>(null);
  const [stars, setStars] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);

  // Silnik renderowania: 3D WebGL (Rocksmith+) lub klasyczny 2D HD (Rocksmith 2014)
  const [renderMode, setRenderMode] = useState<'3d' | '2d'>('3d');
  const [isInvertedStrings, setIsInvertedStrings] = useState<boolean>(false);

  const [sparks3D, setSparks3D] = useState<Array<{
    id: number;
    pos: [number, number, number];
    color: string;
    velocity: [number, number, number];
    life: number;
  }>>([]);

  // Animacja wibracji strun po uderzeniu
  const stringVibrations = useRef<number[]>([0, 0, 0, 0, 0, 0]);
  const sparksRef = useRef<SparkParticle[]>([]);

  // Statystyki
  const statsRef = useRef({
    totalNotes: 0,
    perfectHits: 0,
    goodHits: 0,
    misses: 0,
    maxStreak: 0,
  });

  // Załadowany utwór
  const songNotes = useRef<NoteHit[]>(
    initialNotes && initialNotes.length > 0 ? initialNotes : DEFAULT_ROCK_SONG_NOTES
  );

  const activeNotesRef = useRef<{ hit: boolean; missed: boolean; note: NoteHit }[]>(
    songNotes.current.map((n) => ({ hit: false, missed: false, note: n }))
  );

  const songDuration = useMemo(() => {
    const lastNote = songNotes.current[songNotes.current.length - 1];
    return lastNote ? lastNote.time + lastNote.duration + 3.0 : 45;
  }, []);

  useEffect(() => {
    statsRef.current.totalNotes = songNotes.current.length;
  }, []);

  // Nasłuchiwanie wejścia audio gitary
  useEffect(() => {
    const unsub = audio.onPitch((res: PitchDetectionResult) => {
      setDetectedPitch(res);
      if (res.detected && isPlaying) {
        checkPlayerHit(res);
      }
    });
    return () => unsub();
  }, [isPlaying]);

  // Weryfikacja trafienia nuty w oknie czasowym Rocksmith (PERFECT <= 35ms, GOOD <= 85ms)
  const checkPlayerHit = (pitch: PitchDetectionResult) => {
    const currTime = currentTimeRef.current;
    let bestMatchIdx = -1;
    let minTimeDiff = 999;

    for (let i = 0; i < activeNotesRef.current.length; i++) {
      const item = activeNotesRef.current[i];
      if (item.hit || item.missed) continue;

      const diff = Math.abs(item.note.time - currTime);
      if (diff <= 0.18 && diff < minTimeDiff) {
        minTimeDiff = diff;
        bestMatchIdx = i;
      }
    }

    if (bestMatchIdx !== -1) {
      const target = activeNotesRef.current[bestMatchIdx];
      target.hit = true;

      stringVibrations.current[target.note.string] = 1.0;

      if (minTimeDiff <= 0.045) {
        // Idealnie! (Rocksmith Perfect)
        registerHit('perfect', target.note.string, 100);
      } else {
        // Dobrze!
        registerHit('good', target.note.string, 60);
      }
    }
  };

  const registerHit = (quality: 'perfect' | 'good', stringIdx: number, basePoints: number) => {
    const pts = basePoints * multiplier;
    setScore((s) => s + pts);

    setStreak((str) => {
      const next = str + 1;
      if (next > statsRef.current.maxStreak) statsRef.current.maxStreak = next;

      if (next >= 30) setMultiplier(4);
      else if (next >= 20) setMultiplier(3);
      else if (next >= 10) setMultiplier(2);
      else setMultiplier(1);

      return next;
    });

    if (quality === 'perfect') {
      statsRef.current.perfectHits++;
      sfx.play('hit_perfect');
      triggerFeedback(t('highway.perfect'), '#58c46c');
      spawnHitParticles(stringIdx, '#58c46c', 22);
    } else {
      statsRef.current.goodHits++;
      sfx.play('hit_good');
      triggerFeedback(t('highway.good'), '#e2b04a');
      spawnHitParticles(stringIdx, '#e2b04a', 14);
    }

    updateAccuracyAndStars();
    multiplayer.sendHit(quality, score + pts, streak + 1, accuracy);
  };

  const spawnHitParticles = (stringIdx: number, color: string, count: number) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const bottomY = canvas.height * 0.86;
      const bottomWidth = canvas.width * 0.90;
      const bottomX1 = (canvas.width - bottomWidth) / 2;
      const x = bottomX1 + bottomWidth * (stringIdx / 5);

      for (let k = 0; k < count; k++) {
        const angle = (Math.PI * 2 * k) / count + (Math.random() - 0.5);
        const speed = Math.random() * 5 + 3;
        sparksRef.current.push({
          x,
          y: bottomY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.5,
          life: 1.0,
          maxLife: 1.0,
          color,
          size: Math.random() * 3.5 + 2,
        });
      }
    }

    // Iskry 3D dla silnika WebGL
    const STRING_SPACING = 0.82;
    const x3d = -((6 - 1) * STRING_SPACING) / 2 + stringIdx * STRING_SPACING;
    const new3D: Array<{
      id: number;
      pos: [number, number, number];
      color: string;
      velocity: [number, number, number];
      life: number;
    }> = [];
    for (let k = 0; k < count; k++) {
      new3D.push({
        id: Math.random(),
        pos: [x3d + (Math.random() - 0.5) * 0.25, 0.16, (Math.random() - 0.5) * 0.25],
        color,
        velocity: [(Math.random() - 0.5) * 0.25, Math.random() * 0.35 + 0.1, (Math.random() - 0.5) * 0.25],
        life: 1.0,
      });
    }
    setSparks3D((prev) => [...prev.slice(-35), ...new3D]);
  };

  const registerMiss = (index: number) => {
    activeNotesRef.current[index].missed = true;
    statsRef.current.misses++;
    setStreak(0);
    setMultiplier(1);
    sfx.play('hit_miss');
    triggerFeedback(t('highway.miss'), '#e0392b');
    updateAccuracyAndStars();
    multiplayer.sendHit('miss', score, 0, accuracy);
  };

  const triggerFeedback = (text: string, color: string) => {
    setHitFeedback({ text, color, id: Date.now() });
    setTimeout(() => {
      setHitFeedback(null);
    }, 600);
  };

  const updateAccuracyAndStars = () => {
    const totalJudged = statsRef.current.perfectHits + statsRef.current.goodHits + statsRef.current.misses;
    if (totalJudged > 0) {
      const acc = Math.round(
        ((statsRef.current.perfectHits * 1.0 + statsRef.current.goodHits * 0.6) / totalJudged) * 100
      );
      setAccuracy(acc);

      if (acc >= 95 && totalJudged >= statsRef.current.totalNotes * 0.8) setStars(5);
      else if (acc >= 85 && totalJudged >= statsRef.current.totalNotes * 0.6) setStars(4);
      else if (acc >= 75) setStars(3);
      else if (acc >= 60) setStars(2);
      else setStars(1);
    }
  };

  const currentTimeRef = useRef<number>(0);

  // Główna pętla gry (czas, fizyka strun, iskry, rendering)
  useEffect(() => {
    let animId: number;
    let lastTime: number | null = null;

    const render = (timestamp: number) => {
      if (lastTime === null) {
        lastTime = timestamp;
      }
      const deltaSec = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      // Wygaszanie drgań strun
      for (let s = 0; s < 6; s++) {
        stringVibrations.current[s] = Math.max(0, stringVibrations.current[s] - deltaSec * 3.5);
      }

      // Aktualizacja iskier 2D
      for (let pIdx = sparksRef.current.length - 1; pIdx >= 0; pIdx--) {
        const p = sparksRef.current[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // grawitacja
        p.life -= deltaSec * 2.2;
        if (p.life <= 0) {
          sparksRef.current.splice(pIdx, 1);
        }
      }

      // Aktualizacja iskier 3D
      setSparks3D((prev) => {
        if (!prev.length) return prev;
        const next = [];
        for (let i = 0; i < prev.length; i++) {
          const sp = prev[i];
          const newLife = sp.life - deltaSec * 2.0;
          if (newLife > 0) {
            next.push({
              ...sp,
              pos: [
                sp.pos[0] + sp.velocity[0] * deltaSec * 5,
                sp.pos[1] + sp.velocity[1] * deltaSec * 5,
                sp.pos[2] + sp.velocity[2] * deltaSec * 5,
              ] as [number, number, number],
              life: newLife,
            });
          }
        }
        return next;
      });

      if (isPlaying) {
        currentTimeRef.current += deltaSec * playbackSpeed;
        setCurrentSongTime(currentTimeRef.current);

        for (let i = 0; i < activeNotesRef.current.length; i++) {
          const item = activeNotesRef.current[i];
          if (!item.hit && !item.missed && currentTimeRef.current > item.note.time + 0.18) {
            registerMiss(i);
          }
        }

        if (currentTimeRef.current >= songDuration) {
          setIsPlaying(false);
          sfx.play('song_complete');
          if (onSongComplete) {
            onSongComplete(score, accuracy, stars);
          }
        }
      }

      // Rysowanie 2D Canvas (jeśli wybrany tryb 2D)
      if (renderMode === '2d' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawRocksmithHighway2D(ctx, canvasRef.current.width, canvasRef.current.height, currentTimeRef.current);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, playbackSpeed, score, multiplier, accuracy, stars, renderMode, songDuration, isInvertedStrings]);

  // Autentyczny Silnik 2D HD Rocksmith 2014 (Gryf z palisandru, binding, progi, markery perłowe, kryształy nutowe)
  const drawRocksmithHighway2D = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currTime: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    // 1. Tło Sceny Koncertowej (Światła sceniczne i winieta)
    const stageGrad = ctx.createRadialGradient(width / 2, 0, 50, width / 2, height / 2, width);
    stageGrad.addColorStop(0, '#1a1018');
    stageGrad.addColorStop(0.5, '#0c080d');
    stageGrad.addColorStop(1, '#050306');
    ctx.fillStyle = stageGrad;
    ctx.fillRect(0, 0, width, height);

    // Dwa reflektory sceniczne (Lewy i Prawy)
    const spotLeft = ctx.createRadialGradient(width * 0.15, 0, 10, width * 0.25, height * 0.4, width * 0.4);
    spotLeft.addColorStop(0, streak >= 20 ? 'rgba(235, 77, 75, 0.22)' : 'rgba(56, 189, 248, 0.16)');
    spotLeft.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spotLeft;
    ctx.fillRect(0, 0, width, height);

    const spotRight = ctx.createRadialGradient(width * 0.85, 0, 10, width * 0.75, height * 0.4, width * 0.4);
    spotRight.addColorStop(0, streak >= 20 ? 'rgba(245, 158, 11, 0.22)' : 'rgba(168, 85, 247, 0.16)');
    spotRight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spotRight;
    ctx.fillRect(0, 0, width, height);

    // Wymiary gryfu w perspektywie Rocksmith
    const topY = height * 0.12;
    const bottomY = height * 0.86;
    const topWidth = width * 0.34;
    const bottomWidth = width * 0.90;

    const topX1 = (width - topWidth) / 2;
    const topX2 = topX1 + topWidth;
    const bottomX1 = (width - bottomWidth) / 2;
    const bottomX2 = bottomX1 + bottomWidth;

    // 2. Podstrunnica 3D (Ciemny Palisander z usłojeniem drewna)
    const neckGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
    neckGrad.addColorStop(0, '#0f0a07');
    neckGrad.addColorStop(0.5, '#17110c');
    neckGrad.addColorStop(1, '#0a0705');

    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(topX1, topY);
    ctx.lineTo(topX2, topY);
    ctx.lineTo(bottomX2, bottomY);
    ctx.lineTo(bottomX1, bottomY);
    ctx.closePath();
    ctx.fill();

    // Słoje drewna podstrunnicy
    ctx.strokeStyle = 'rgba(242, 234, 216, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const rx = (i / 6);
      ctx.beginPath();
      ctx.moveTo(topX1 + topWidth * rx, topY);
      ctx.lineTo(bottomX1 + bottomWidth * rx, bottomY);
      ctx.stroke();
    }

    // Kremowy binding boczny (Aged Ivory Binding)
    ctx.strokeStyle = '#f2ead8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(topX1, topY);
    ctx.lineTo(bottomX1, bottomY);
    ctx.moveTo(topX2, topY);
    ctx.lineTo(bottomX2, bottomY);
    ctx.stroke();

    // 3. Progi Metalowe i Markery Perłowe (Pearloid Inlays)
    const BEATS_VISIBLE = 3.6;
    const beatInterval = 60 / tempo;
    const startBeat = Math.floor(currTime / beatInterval);

    for (let b = 0; b <= 18; b++) {
      const beatTime = (startBeat + b) * beatInterval;
      const timeAhead = beatTime - currTime;
      if (timeAhead < 0 || timeAhead > BEATS_VISIBLE) continue;

      const p = 1 - timeAhead / BEATS_VISIBLE;
      const y = topY + (bottomY - topY) * Math.pow(p, 1.4);
      const rowWidth = topWidth + (bottomWidth - topWidth) * p;
      const rowX1 = (width - rowWidth) / 2;
      const rowX2 = rowX1 + rowWidth;

      const isMeasure = (startBeat + b) % 4 === 0;

      // Drut progowy z metalicznym odbiciem (Specular + Shadow)
      ctx.beginPath();
      ctx.moveTo(rowX1, y);
      ctx.lineTo(rowX2, y);
      ctx.strokeStyle = isMeasure ? 'rgba(255, 255, 255, 0.75)' : 'rgba(200, 210, 225, 0.35)';
      ctx.lineWidth = isMeasure ? 3.0 : 1.5;
      ctx.stroke();

      // Cień pod progiem
      ctx.beginPath();
      ctx.moveTo(rowX1, y + (isMeasure ? 2 : 1));
      ctx.lineTo(rowX2, y + (isMeasure ? 2 : 1));
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Perłowa inkrustacja Rocksmith (Romb/Trapezoid) co takt
      if (isMeasure && p > 0.2) {
        const midX = (rowX1 + rowX2) / 2;
        const inlayW = 18 * p;
        const inlayH = 8 * p;
        ctx.fillStyle = 'rgba(248, 250, 252, 0.75)';
        ctx.beginPath();
        ctx.moveTo(midX, y - inlayH);
        ctx.lineTo(midX + inlayW, y);
        ctx.lineTo(midX, y + inlayH);
        ctx.lineTo(midX - inlayW, y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 4. Klamra pozycji dłoni (Rocksmith Hand Anchor - Cyan Frame)
    const anchorY1 = topY + (bottomY - topY) * 0.45;
    const anchorY2 = topY + (bottomY - topY) * 0.85;
    const anchorW1 = topWidth + (bottomWidth - topWidth) * 0.45;
    const anchorW2 = topWidth + (bottomWidth - topWidth) * 0.85;
    const ax1 = (width - anchorW1) / 2;
    const ax2 = ax1 + anchorW1;
    const bx1 = (width - anchorW2) / 2;
    const bx2 = bx1 + anchorW2;

    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.beginPath();
    ctx.moveTo(ax1, anchorY1);
    ctx.lineTo(ax2, anchorY1);
    ctx.lineTo(bx2, anchorY2);
    ctx.lineTo(bx1, anchorY2);
    ctx.closePath();
    ctx.fill();

    // Boczne laserowe ramki klamry
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ax1, anchorY1);
    ctx.lineTo(bx1, anchorY2);
    ctx.moveTo(ax2, anchorY1);
    ctx.lineTo(bx2, anchorY2);
    ctx.stroke();
    ctx.restore();

    // 5. 6 Strun Gitarowych Rocksmith ze zmienną grubością i drganiem
    for (let s = 0; s < 6; s++) {
      const stringIdx = isInvertedStrings ? 5 - s : s;
      const ratio = s / 5;
      const vib = Math.sin(Date.now() * 0.05 + s) * stringVibrations.current[stringIdx] * 5;

      const sx1 = topX1 + topWidth * ratio;
      const sx2 = bottomX1 + bottomWidth * ratio + vib;

      const color = STRING_COLORS[stringIdx];
      const gauge = (6 - s) * 0.7; // struny basowe grubsze

      // Neonowa poświata laserowa wzdłuż struny
      ctx.beginPath();
      ctx.moveTo(sx1, topY);
      ctx.lineTo(sx2, bottomY);
      ctx.strokeStyle = color + '55';
      ctx.lineWidth = gauge + 4 + stringVibrations.current[stringIdx] * 4;
      ctx.stroke();

      // Metalowy rdzeń struny
      ctx.beginPath();
      ctx.moveTo(sx1, topY);
      ctx.lineTo(sx2, bottomY);
      ctx.strokeStyle = color;
      ctx.lineWidth = gauge + 1.2;
      ctx.stroke();

      // Biały refleks na środku struny
      ctx.beginPath();
      ctx.moveTo(sx1, topY);
      ctx.lineTo(sx2, bottomY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 6. Chromowana Belka Uderzenia (Hit Bar)
    const hitGrad = ctx.createLinearGradient(bottomX1, bottomY, bottomX2, bottomY);
    hitGrad.addColorStop(0, '#ffffff');
    hitGrad.addColorStop(0.5, '#e2b04a');
    hitGrad.addColorStop(1, '#ffffff');

    ctx.save();
    ctx.shadowColor = '#e2b04a';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = hitGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bottomX1 - 10, bottomY);
    ctx.lineTo(bottomX2 + 10, bottomY);
    ctx.stroke();
    ctx.restore();

    // Celowniki strun na progu zerowym (Target Reticles z nazwami strun)
    for (let s = 0; s < 6; s++) {
      const stringIdx = isInvertedStrings ? 5 - s : s;
      const ratio = s / 5;
      const x = bottomX1 + bottomWidth * ratio;
      const color = STRING_COLORS[stringIdx];

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, bottomY, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0807';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = stringVibrations.current[stringIdx] > 0.1 ? 20 : 6;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 12px "Big Shoulders Display", "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(STRING_NAMES[stringIdx], x, bottomY);
      ctx.restore();
    }

    // 7. Kryształy Nutowe Rocksmith 2014 (3D Beveled Gems, Otwarte Obręcze, Smugi Wavy Sustain)
    for (const item of activeNotesRef.current) {
      const note = item.note;
      const timeAhead = note.time - currTime;
      if (timeAhead > BEATS_VISIBLE || timeAhead < -0.2) continue;

      const p = 1 - timeAhead / BEATS_VISIBLE;
      const y = topY + (bottomY - topY) * Math.pow(Math.max(0, p), 1.4);
      const rowWidth = topWidth + (bottomWidth - topWidth) * p;
      const rowX1 = (width - rowWidth) / 2;

      const visualStringIdx = isInvertedStrings ? 5 - note.string : note.string;
      const ratio = visualStringIdx / 5;
      const x = rowX1 + rowWidth * ratio;

      const color = STRING_COLORS[note.string];
      const isOpen = note.fret === 0;

      const gemW = (22 + 28 * p);
      const gemH = (12 + 14 * p);

      ctx.save();
      if (item.hit) {
        ctx.globalAlpha = 0.15;
      } else if (item.missed) {
        ctx.globalAlpha = 0.25;
        ctx.filter = 'grayscale(1)';
      }

      // Smuga podtrzymania dźwięku (Sustain Ribbon z falowaniem akustycznym)
      if (note.duration > 0.35) {
        const tailEndAhead = note.time + note.duration - currTime;
        const pTail = Math.max(0, 1 - tailEndAhead / BEATS_VISIBLE);
        const yTail = topY + (bottomY - topY) * Math.pow(pTail, 1.4);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x - gemW * 0.45, y);
        ctx.lineTo(x + gemW * 0.45, y);
        ctx.lineTo(x + gemW * 0.2, yTail);
        ctx.lineTo(x - gemW * 0.2, yTail);
        ctx.closePath();
        ctx.fillStyle = color + '44';
        ctx.fill();

        // Krawędzie laserowe ogona
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * p;
        ctx.stroke();
        ctx.restore();
      }

      if (isOpen) {
        // NUTA OTWARTA (Rocksmith Open String Hoop — neonowa prostokątna ramka obejmująca strunę)
        ctx.shadowColor = color;
        ctx.shadowBlur = 18 * p;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4 * p;
        ctx.fillStyle = 'rgba(10, 8, 7, 0.8)';

        ctx.beginPath();
        ctx.roundRect(x - gemW / 2, y - gemH / 2, gemW, gemH, 4);
        ctx.fill();
        ctx.stroke();

        // Wewnętrzne podświetlenie
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // NUTA PROGOWA (Rocksmith 3D Beveled Crystal Gem — ścięty kryształ ze szklistym połyskiem i numerem)
        ctx.shadowColor = color;
        ctx.shadowBlur = 16 * p;

        // Bryła główna kryształu
        const gemGrad = ctx.createLinearGradient(x - gemW / 2, y - gemH / 2, x + gemW / 2, y + gemH / 2);
        gemGrad.addColorStop(0, '#ffffff');
        gemGrad.addColorStop(0.2, color);
        gemGrad.addColorStop(1, '#090705');

        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.roundRect(x - gemW / 2, y - gemH / 2, gemW, gemH, 6 * p);
        ctx.fill();

        // Złoty/neonowy kontur kryształu
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5 * p;
        ctx.stroke();

        // Górny refleks szkła
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.roundRect(x - gemW / 2 + 2, y - gemH / 2 + 2, gemW - 4, (gemH / 2) - 2, 4 * p);
        ctx.fill();

        // Numer progu (Rocksmith Stencil)
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${Math.round(13 + 8 * p)}px "Big Shoulders Display", "Barlow Condensed", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(note.fret.toString(), x, y + 1);
      }

      ctx.restore();
    }

    // 8. Rysowanie cząsteczek iskier po trafieniu
    for (const p of sparksRef.current) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const togglePlay = async () => {
    await audio.initContext();
    if (!isPlaying) sfx.play('select');
    setIsPlaying(!isPlaying);
  };

  const restartSong = () => {
    currentTimeRef.current = 0;
    setCurrentSongTime(0);
    setScore(0);
    setStreak(0);
    setMultiplier(1);
    setHitFeedback(null);
    statsRef.current = {
      totalNotes: songNotes.current.length,
      perfectHits: 0,
      goodHits: 0,
      misses: 0,
      maxStreak: 0,
    };
    activeNotesRef.current = songNotes.current.map((n) => ({ hit: false, missed: false, note: n }));
    setIsPlaying(true);
    sfx.play('select');
  };

  const handleStringClick = (stringIndex: number) => {
    audio.playSyntheticNote(stringIndex, 0);
    const mockPitch: PitchDetectionResult = {
      detected: true,
      frequency: 200,
      midiNote: [40, 45, 50, 55, 59, 64][stringIndex] ?? 40,
      noteName: STRING_NAMES[stringIndex] ?? 'E',
      octave: 2,
      cents: 0,
      clarity: 0.95,
    };
    checkPlayerHit(mockPitch);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#060408] text-[#f2ead8] select-none overflow-hidden font-['Barlow']">
      {/* Pasek Górny (Tytuł, Mnożnik Mocy, Seria, Gwiazdki Rocksmith) */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0d090d]/95 border-b border-[#f2ead821] z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a141a] hover:bg-[#251d26] text-[#f2ead8] hover:text-white transition-all text-xs font-bold border border-[#f2ead821] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('highway.exit')}</span>
          </button>

          <div>
            <h1 className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>{songTitle}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#e0392b22] text-[#e0392b] border border-[#e0392b44] font-['Barlow_Condensed']">
                ROCKSMITH NOTEPATH
              </span>
            </h1>
            <p className="text-xs text-[#f2ead870] font-medium font-['Barlow_Condensed'] uppercase tracking-wider">
              {artist} • {tempo} BPM • {Math.floor(currentSongTime)}s / {Math.floor(songDuration)}s
            </p>
          </div>
        </div>

        {/* Wskaźniki punktacji, serii i ognistego mnożnika */}
        <div className="flex items-center gap-6">
          {/* Mnożnik Rocksmith (Płonący wskaźnik mocy) */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all ${
              multiplier >= 4
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                : multiplier >= 2
                ? 'bg-[#e0392b22] border-[#e0392b66] text-[#e0392b]'
                : 'bg-[#1a141a] border-[#f2ead821] text-[#f2ead8]'
            }`}
          >
            <Flame className={`w-5 h-5 ${multiplier >= 4 ? 'text-amber-400 fill-amber-400' : 'text-[#e0392b]'}`} />
            <div className="leading-tight">
              <span className="text-[10px] uppercase font-bold tracking-widest block text-[#f2ead870]">
                MNOŻNIK
              </span>
              <span className="font-['Big_Shoulders_Display'] text-xl font-black">x{multiplier}</span>
            </div>
          </div>

          {/* Seria (Streak) */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#f2ead870] block">
              {t('highway.streak')}
            </span>
            <span className="font-['Big_Shoulders_Display'] text-2xl font-black text-white">
              {streak} <span className="text-xs text-[#e2b04a]">NUT</span>
            </span>
          </div>

          {/* Wynik */}
          <div className="text-right min-w-[90px]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#e2b04a] block">
              {t('highway.score')}
            </span>
            <span className="font-['Big_Shoulders_Display'] text-3xl font-black tracking-wider text-white">
              {score.toLocaleString()}
            </span>
          </div>

          {/* 5 Gwiazdek Mistrzostwa */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 rounded-xl bg-[#140e14] border border-[#f2ead815]">
            {[1, 2, 3, 4, 5].map((starIdx) => (
              <span
                key={starIdx}
                className={`text-lg transition-transform ${
                  starIdx <= stars
                    ? 'text-[#e2b04a] scale-110 drop-shadow-[0_0_8px_rgba(226,176,74,0.9)]'
                    : 'text-zinc-800'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Główny obszar Autostrady Nutowej Rocksmith (Three.js WebGL lub Canvas 2D HD) */}
      <div className="relative flex-1 w-full flex items-center justify-center bg-[#060408] overflow-hidden">
        {renderMode === '3d' ? (
          <Highway3DCanvas
            currentTime={currentSongTime}
            notes={activeNotesRef.current}
            stringVibrations={stringVibrations.current}
            streak={streak}
            multiplier={multiplier}
            tempo={tempo}
            sparks={sparks3D}
          />
        ) : (
          <canvas ref={canvasRef} width={1080} height={680} className="w-full h-full max-w-6xl object-contain" />
        )}

        {/* Feedback uderzenia (Rocksmith Perfect / Good / Miss) */}
        {hitFeedback && (
          <div
            key={hitFeedback.id}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping text-4xl font-black tracking-widest font-['Big_Shoulders_Display'] uppercase drop-shadow-[0_0_24px_rgba(255,255,255,0.9)]"
            style={{ color: hitFeedback.color }}
          >
            {hitFeedback.text}
          </div>
        )}

        {/* Wskaźnik detektora dźwięku gitary w lewym górnym rogu */}
        <div className="absolute top-4 left-6 flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#0a070a]/90 border border-[#f2ead821] backdrop-blur-md shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-[10px] text-[#f2ead870] block font-['Barlow_Condensed'] uppercase tracking-wider">
              {t('header.soundDetection')}
            </span>
            <span className="font-bold text-white font-mono text-sm">
              {detectedPitch?.detected
                ? `${detectedPitch.noteName}${detectedPitch.octave} (${Math.round(detectedPitch.frequency)}Hz)`
                : t('header.micOnDesc')}
            </span>
          </div>
        </div>

        {/* Paski strun na dole ekranu do gry myszką/klawiaturą */}
        <div className="absolute bottom-4 flex items-center justify-center gap-2.5 z-10">
          {STRING_NAMES.map((name, sIdx) => {
            const actualStringIdx = isInvertedStrings ? 5 - sIdx : sIdx;
            return (
              <button
                key={name}
                onClick={() => handleStringClick(actualStringIdx)}
                className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-md hover:scale-105"
                style={{
                  backgroundColor: STRING_COLORS[actualStringIdx] + '26',
                  border: `2px solid ${STRING_COLORS[actualStringIdx]}`,
                  color: '#ffffff',
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dolny pasek kontrolny Rocksmith */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#0a070a]/95 border-t border-[#f2ead821] z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#e0392b] hover:bg-[#c8281e] text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            {isPlaying ? t('highway.pause') : t('highway.resume')}
          </button>

          <button
            onClick={restartSong}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a141a] hover:bg-[#251d26] text-[#f2ead8] text-xs font-bold transition-colors cursor-pointer border border-[#f2ead821]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('highway.restart')}
          </button>

          <div className="flex items-center bg-[#140e14] rounded-xl p-1 text-xs border border-[#f2ead815]">
            {[0.5, 0.75, 1.0].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors cursor-pointer ${
                  playbackSpeed === speed ? 'bg-[#e0392b] text-white font-bold' : 'text-[#f2ead870] hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#f2ead870]">
          {/* Przełącznik orientacji strun: Standard Rocksmith / Tabulatura */}
          <button
            onClick={() => setIsInvertedStrings(!isInvertedStrings)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#140e14] hover:bg-[#1f161f] text-[#f2ead8] border border-[#f2ead821] transition-all cursor-pointer font-bold"
            title="Przełącz kolejność strun (Standard Rocksmith vs Odwrócona jak w nutach/tabach)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>{isInvertedStrings ? '🎸 Struny: Jak Tabulatura (E dół)' : '🎸 Struny: Rocksmith (E góra)'}</span>
          </button>

          {/* Przełącznik silnika 3D / 2D */}
          <button
            onClick={() => setRenderMode((m) => (m === '3d' ? '2d' : '3d'))}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
              renderMode === '3d'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-[#140e14] text-[#f2ead870] border-[#f2ead821] hover:text-white'
            }`}
          >
            {renderMode === '3d' ? <Box className="w-3.5 h-3.5 text-amber-400" /> : <Layers className="w-3.5 h-3.5" />}
            <span>{renderMode === '3d' ? '⚡ Silnik 3D (Rocksmith+ WebGL)' : '🎯 Silnik 2D HD (Rocksmith 2014)'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t('highway.accuracy')}: <strong className="text-white">{accuracy}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
