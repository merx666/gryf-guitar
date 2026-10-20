import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { audio } from '../audio/audioEngine';
import { sfx } from '../audio/sfxPlayer';
import { PitchDetectionResult, NoteHit } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface HighwayViewProps {
  songTitle: string;
  artist: string;
  tempo?: number;
  notes?: NoteHit[];
  onExit: () => void;
  onSongComplete?: (score: number, accuracy: number, stars: number) => void;
}

// Kolory 6 strun gitary (Standard Rocksmith+ / Gryf)
export const STRING_COLORS = [
  '#e0392b', // 0: E niska (czerwona)
  '#eab308', // 1: A (żółta)
  '#3b82f6', // 2: D (niebieska)
  '#f97316', // 3: G (pomarańczowa)
  '#22c55e', // 4: B (zielona)
  '#a855f7', // 5: e wysoka (fioletowa)
];

export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

// Cząsteczki iskier uderzenia
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

export const HighwayView: React.FC<HighwayViewProps> = ({
  songTitle,
  artist,
  tempo = 120,
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

  // Domyślny rockowy motyw
  const songNotes = useRef<NoteHit[]>(
    initialNotes && initialNotes.length > 0
      ? initialNotes
      : [
          { string: 0, fret: 0, time: 2.0, duration: 0.6 },
          { string: 0, fret: 3, time: 2.6, duration: 0.6 },
          { string: 0, fret: 5, time: 3.2, duration: 0.9 },
          { string: 0, fret: 0, time: 4.4, duration: 0.6 },
          { string: 0, fret: 3, time: 5.0, duration: 0.6 },
          { string: 0, fret: 6, time: 5.6, duration: 0.4 },
          { string: 0, fret: 5, time: 6.0, duration: 1.0 },
          { string: 0, fret: 0, time: 7.2, duration: 0.6 },
          { string: 0, fret: 3, time: 7.8, duration: 0.6 },
          { string: 0, fret: 5, time: 8.4, duration: 0.9 },
          { string: 0, fret: 3, time: 9.4, duration: 0.6 },
          { string: 0, fret: 0, time: 10.0, duration: 1.8 },
          { string: 1, fret: 5, time: 12.0, duration: 0.6 },
          { string: 1, fret: 7, time: 12.6, duration: 0.6 },
          { string: 2, fret: 5, time: 13.2, duration: 0.6 },
          { string: 2, fret: 7, time: 13.8, duration: 1.2 },
          { string: 1, fret: 5, time: 15.0, duration: 0.6 },
          { string: 2, fret: 5, time: 15.6, duration: 0.6 },
          { string: 2, fret: 7, time: 16.2, duration: 0.8 },
          { string: 3, fret: 7, time: 17.2, duration: 1.4 },
        ]
  );

  const activeNotesRef = useRef<{ hit: boolean; missed: boolean; note: NoteHit }[]>(
    songNotes.current.map((n) => ({ hit: false, missed: false, note: n }))
  );

  const songDuration =
    songNotes.current.length > 0
      ? songNotes.current[songNotes.current.length - 1].time + 3.0
      : 30;

  // Nasłuchiwanie mikrofonu gitary
  useEffect(() => {
    statsRef.current.totalNotes = songNotes.current.length;
    const unsubscribe = audio.onPitch((res) => {
      setDetectedPitch(res);
      if (res.detected && isPlaying) {
        checkHitWithPitch(res);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [isPlaying]);

  const checkHitWithPitch = (pitch: PitchDetectionResult) => {
    const HIT_WINDOW_SEC = 0.12;
    const currentTime = currentTimeRef.current;

    for (let i = 0; i < activeNotesRef.current.length; i++) {
      const item = activeNotesRef.current[i];
      if (item.hit || item.missed) continue;

      const diff = Math.abs(item.note.time - currentTime);
      if (diff <= HIT_WINDOW_SEC) {
        const expectedMidi = [40, 45, 50, 55, 59, 64][item.note.string] + item.note.fret;
        const isMidiMatch = pitch.midiNote === expectedMidi;
        const isPitchClassMatch = pitch.midiNote % 12 === expectedMidi % 12;

        if (isMidiMatch || isPitchClassMatch) {
          registerHit(i, diff);
          break;
        }
      }
    }
  };

  const registerHit = (index: number, timeDiff: number) => {
    const item = activeNotesRef.current[index];
    item.hit = true;

    // Pobudzenie wibracji struny
    stringVibrations.current[item.note.string] = 1.0;

    const isPerfect = timeDiff <= 0.045;
    const basePoints = isPerfect ? 100 : 60;
    const pointsGained = basePoints * multiplier;

    if (isPerfect) {
      statsRef.current.perfectHits++;
      sfx.play('hit_perfect');
      triggerFeedback(t('highway.perfect'), '#58c46c');
      spawnSparks(item.note.string, '#58c46c', 24);
    } else {
      statsRef.current.goodHits++;
      sfx.play('hit_good');
      triggerFeedback(t('highway.good'), '#e2b04a');
      spawnSparks(item.note.string, '#e2b04a', 14);
    }

    setScore((prev) => prev + pointsGained);
    setStreak((prev) => {
      const next = prev + 1;
      if (next > statsRef.current.maxStreak) {
        statsRef.current.maxStreak = next;
      }
      if (next >= 30) setMultiplier(4);
      else if (next >= 20) setMultiplier(3);
      else if (next >= 10) setMultiplier(2);
      else setMultiplier(1);
      return next;
    });

    updateAccuracyAndStars();
  };

  const spawnSparks = (stringIdx: number, color: string, count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bottomY = canvas.height * 0.88;
    const bottomWidth = canvas.width * 0.88;
    const bottomX1 = (canvas.width - bottomWidth) / 2;
    const x = bottomX1 + bottomWidth * (stringIdx / 5);

    for (let k = 0; k < count; k++) {
      const angle = (Math.PI * 2 * k) / count + (Math.random() - 0.5);
      const speed = Math.random() * 4 + 2;
      sparksRef.current.push({
        x,
        y: bottomY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1.0,
        maxLife: 1.0,
        color,
        size: Math.random() * 3 + 2,
      });
    }
  };

  const registerMiss = (index: number) => {
    const item = activeNotesRef.current[index];
    item.missed = true;
    statsRef.current.misses++;
    setStreak(0);
    setMultiplier(1);
    sfx.play('hit_miss');
    triggerFeedback(t('highway.miss'), '#e0392b');
    updateAccuracyAndStars();
  };

  const triggerFeedback = (text: string, color: string) => {
    setHitFeedback({ text, color, id: Date.now() });
  };

  const updateAccuracyAndStars = () => {
    const totalJudged = statsRef.current.perfectHits + statsRef.current.goodHits + statsRef.current.misses;
    if (totalJudged > 0) {
      const acc = Math.round(
        ((statsRef.current.perfectHits + statsRef.current.goodHits * 0.7) / totalJudged) * 100
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
  const lastTimestampRef = useRef<number | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Główna pętla renderowania Canvas 2D
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const deltaSec = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      // Wygaszanie wibracji strun
      for (let s = 0; s < 6; s++) {
        stringVibrations.current[s] = Math.max(0, stringVibrations.current[s] - deltaSec * 3);
      }

      // Aktualizacja cząsteczek iskier
      for (let pIdx = sparksRef.current.length - 1; pIdx >= 0; pIdx--) {
        const p = sparksRef.current[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // grawitacja
        p.life -= deltaSec * 2.2;
        if (p.life <= 0) {
          sparksRef.current.splice(pIdx, 1);
        }
      }

      if (isPlaying) {
        currentTimeRef.current += deltaSec * playbackSpeed;
        setCurrentSongTime(currentTimeRef.current);

        for (let i = 0; i < activeNotesRef.current.length; i++) {
          const item = activeNotesRef.current[i];
          if (!item.hit && !item.missed && currentTimeRef.current > item.note.time + 0.16) {
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

      drawRocksmithHighway(ctx, canvas.width, canvas.height, currentTimeRef.current);
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isPlaying, playbackSpeed, score, multiplier, accuracy, stars]);

  // Rysowanie Autostrady Rocksmith+ (Drewniany gryf, metalowe progi, inkrustacje, laserowe nuty)
  const drawRocksmithHighway = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currTime: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    const topY = height * 0.14;
    const bottomY = height * 0.88;
    const topWidth = width * 0.38;
    const bottomWidth = width * 0.88;

    const topX1 = (width - topWidth) / 2;
    const topX2 = topX1 + topWidth;
    const bottomX1 = (width - bottomWidth) / 2;
    const bottomX2 = bottomX1 + bottomWidth;

    // 1. Drewniany gryf (Tekstura Hebanu / Palisandru)
    const fretboardGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
    fretboardGrad.addColorStop(0, '#0d0b09');
    fretboardGrad.addColorStop(0.5, '#16120e');
    fretboardGrad.addColorStop(1, '#090705');

    ctx.fillStyle = fretboardGrad;
    ctx.beginPath();
    ctx.moveTo(topX1, topY);
    ctx.lineTo(topX2, topY);
    ctx.lineTo(bottomX2, bottomY);
    ctx.lineTo(bottomX1, bottomY);
    ctx.closePath();
    ctx.fill();

    // Krawędzie gryfu (Binding)
    ctx.strokeStyle = '#f2ead833';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Metalowe progi i inkrustacje z macicy perłowej
    const BEATS_VISIBLE = 4.0;
    const beatInterval = 60 / tempo;
    const startBeat = Math.floor(currTime / beatInterval);

    for (let b = 0; b <= 18; b++) {
      const beatTime = (startBeat + b) * beatInterval;
      const timeAhead = beatTime - currTime;
      if (timeAhead < 0 || timeAhead > BEATS_VISIBLE) continue;

      const p = 1 - timeAhead / BEATS_VISIBLE;
      const y = topY + (bottomY - topY) * Math.pow(p, 1.35);
      const rowWidth = topWidth + (bottomWidth - topWidth) * p;
      const rowX1 = (width - rowWidth) / 2;
      const rowX2 = rowX1 + rowWidth;

      const isBar = (startBeat + b) % 4 === 0;

      // Metalowy próg
      ctx.beginPath();
      ctx.moveTo(rowX1, y);
      ctx.lineTo(rowX2, y);
      ctx.strokeStyle = isBar ? 'rgba(242, 234, 216, 0.45)' : 'rgba(242, 234, 216, 0.12)';
      ctx.lineWidth = isBar ? 2.5 : 1;
      ctx.stroke();

      // Perłowa inkrustacja na środku gryfu co 4 takty
      if (isBar && p > 0.25) {
        ctx.beginPath();
        ctx.arc((rowX1 + rowX2) / 2, y, 4 * p, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(242, 234, 216, 0.35)';
        ctx.fill();
      }
    }

    // 3. Struny z emisją laserową i wibracją
    for (let s = 0; s < 6; s++) {
      const ratio = s / 5;
      const vib = Math.sin(Date.now() * 0.05) * stringVibrations.current[s] * 4;

      const sx1 = topX1 + topWidth * ratio;
      const sx2 = bottomX1 + bottomWidth * ratio + vib;

      // Laserowa poświata struny
      ctx.beginPath();
      ctx.moveTo(sx1, topY);
      ctx.lineTo(sx2, bottomY);
      ctx.strokeStyle = STRING_COLORS[s] + '44';
      ctx.lineWidth = 6 - s * 0.5 + stringVibrations.current[s] * 4;
      ctx.stroke();

      // Rdzeń struny
      ctx.beginPath();
      ctx.moveTo(sx1, topY);
      ctx.lineTo(sx2, bottomY);
      ctx.strokeStyle = STRING_COLORS[s];
      ctx.lineWidth = 2.4 - s * 0.2;
      ctx.stroke();
    }

    // 4. Linia uderzenia (Hit Bar) na dole
    const hitGrad = ctx.createLinearGradient(bottomX1, bottomY, bottomX2, bottomY);
    hitGrad.addColorStop(0, '#e0392b');
    hitGrad.addColorStop(0.5, '#e2b04a');
    hitGrad.addColorStop(1, '#a855f7');

    ctx.save();
    ctx.shadowColor = '#e2b04a';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = hitGrad;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bottomX1 - 10, bottomY);
    ctx.lineTo(bottomX2 + 10, bottomY);
    ctx.stroke();
    ctx.restore();

    // Celowniki strun (Target Reticles)
    for (let s = 0; s < 6; s++) {
      const ratio = s / 5;
      const x = bottomX1 + bottomWidth * ratio;

      ctx.beginPath();
      ctx.arc(x, bottomY, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0907';
      ctx.fill();
      ctx.strokeStyle = STRING_COLORS[s];
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#f2ead8';
      ctx.font = 'bold 11px Barlow, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(STRING_NAMES[s], x, bottomY);
    }

    // 5. Spadające Nuty & Smugi Sustain (Rocksmith+ Gems & Trails)
    for (const item of activeNotesRef.current) {
      const note = item.note;
      const timeAhead = note.time - currTime;

      if (timeAhead > BEATS_VISIBLE || timeAhead < -0.2) continue;

      const p = 1 - timeAhead / BEATS_VISIBLE;
      const y = topY + (bottomY - topY) * Math.pow(Math.max(0, p), 1.35);
      const rowWidth = topWidth + (bottomWidth - topWidth) * p;
      const rowX1 = (width - rowWidth) / 2;
      const ratio = note.string / 5;
      const x = rowX1 + rowWidth * ratio;

      const noteRadius = 9 + 11 * p;
      const color = STRING_COLORS[note.string];

      ctx.save();
      if (item.hit) {
        ctx.globalAlpha = 0.2;
      } else if (item.missed) {
        ctx.globalAlpha = 0.25;
        ctx.filter = 'grayscale(1)';
      }

      // Smuga podtrzymania dźwięku (Sustain Tail)
      if (note.duration > 0.4) {
        const tailEndAhead = note.time + note.duration - currTime;
        const pTail = Math.max(0, 1 - tailEndAhead / BEATS_VISIBLE);
        const yTail = topY + (bottomY - topY) * Math.pow(pTail, 1.35);

        ctx.beginPath();
        ctx.moveTo(x - noteRadius * 0.5, y);
        ctx.lineTo(x + noteRadius * 0.5, y);
        ctx.lineTo(x + noteRadius * 0.2, yTail);
        ctx.lineTo(x - noteRadius * 0.2, yTail);
        ctx.closePath();
        ctx.fillStyle = color + '55';
        ctx.fill();
      }

      // Poświata neonowa
      ctx.shadowColor = color;
      ctx.shadowBlur = 14 * p;

      // Bryła kapsuły nuty
      ctx.beginPath();
      ctx.arc(x, y, noteRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Wewnętrzny rdzeń
      ctx.beginPath();
      ctx.arc(x, y, noteRadius * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0907';
      ctx.fill();

      // Numer progu
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(11 + 6 * p)}px Barlow, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.fret === 0 ? '0' : note.fret.toString(), x, y);

      ctx.restore();
    }

    // 6. Rysowanie cząsteczek iskier po trafieniu
    for (const p of sparksRef.current) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
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
      midiNote: [40, 45, 50, 55, 59, 64][stringIndex],
      noteName: STRING_NAMES[stringIndex],
      octave: 3,
      cents: 0,
      clarity: 0.99,
      stringEstimated: stringIndex,
    };
    checkHitWithPitch(mockPitch);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0907] select-none overflow-hidden font-['Barlow'] text-[#f2ead8]">
      {/* Pasek statusu gry */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#0e0b09]/95 border-b border-[#f2ead821] backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a1612] hover:bg-[#25201a] text-[#f2ead8] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('highway.exit')}</span>
          </button>
          <div>
            <h2 className="font-['Big_Shoulders_Display'] text-xl font-black uppercase text-white flex items-center gap-2 leading-none">
              {songTitle}
              <span className="text-xs px-2 py-0.5 rounded bg-[#1e1b18] text-[#f2ead870] font-['Barlow_Condensed'] font-normal">
                {artist}
              </span>
            </h2>
            <p className="text-[11px] text-[#f2ead870] mt-0.5">
              Tempo: {tempo} BPM • {Math.floor(currentSongTime)}s / {Math.floor(songDuration)}s
            </p>
          </div>
        </div>

        {/* Punkty, Seria, Mnożnik */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-[#f2ead870] font-['Barlow_Condensed'] uppercase tracking-widest block leading-none">
              {t('highway.score')}
            </span>
            <span className="text-2xl font-black text-[#e2b04a] font-mono tracking-wider leading-none">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#1a1612] border border-[#f2ead821]">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <div>
              <span className="text-[9px] text-[#f2ead870] block leading-none uppercase font-bold">{t('highway.streak')}</span>
              <span className="text-sm font-bold text-white leading-none">{streak}</span>
            </div>
            <div className="ml-1.5 px-2 py-0.5 rounded bg-[#e0392b] text-white font-black text-xs font-mono">
              x{multiplier}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((starIdx) => (
              <span
                key={starIdx}
                className={`text-lg transition-transform ${
                  starIdx <= stars ? 'text-[#e2b04a] scale-110 drop-shadow-[0_0_8px_rgba(226,176,74,0.8)]' : 'text-zinc-800'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Główny obszar 3D Canvas Highway */}
      <div className="relative flex-1 w-full flex items-center justify-center bg-radial from-[#15110d] via-[#0b0907] to-black overflow-hidden">
        <canvas ref={canvasRef} width={960} height={620} className="w-full h-full max-w-5xl object-contain" />

        {/* Feedback uderzenia */}
        {hitFeedback && (
          <div
            key={hitFeedback.id}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping text-3xl font-black tracking-widest font-['Big_Shoulders_Display'] uppercase drop-shadow-[0_0_16px_rgba(255,255,255,0.8)]"
            style={{ color: hitFeedback.color }}
          >
            {hitFeedback.text}
          </div>
        )}

        {/* Wskaźnik detektora dźwięku gitary */}
        <div className="absolute top-4 left-6 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0e0b09]/90 border border-[#f2ead821] backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="text-xs">
            <span className="text-[10px] text-[#f2ead870] block font-['Barlow_Condensed'] uppercase tracking-wider">
              {t('header.soundDetection')}
            </span>
            <span className="font-bold text-white font-mono">
              {detectedPitch?.detected
                ? `${detectedPitch.noteName}${detectedPitch.octave} (${Math.round(detectedPitch.frequency)}Hz)`
                : t('header.micOnDesc')}
            </span>
          </div>
        </div>

        {/* Paski strun na dole ekranu */}
        <div className="absolute bottom-4 flex items-center justify-center gap-3">
          {STRING_NAMES.map((name, sIdx) => (
            <button
              key={name}
              onClick={() => handleStringClick(sIdx)}
              className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              style={{
                backgroundColor: STRING_COLORS[sIdx] + '22',
                border: `2px solid ${STRING_COLORS[sIdx]}`,
                color: '#ffffff',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Dolny pasek kontrolny */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#0e0b09]/95 border-t border-[#f2ead821] z-20">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1612] hover:bg-[#25201a] text-[#f2ead8] text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('highway.restart')}
          </button>

          <div className="flex items-center bg-[#1a1612] rounded-xl p-1 text-xs">
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

        <div className="flex items-center gap-4 text-xs text-[#f2ead870]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t('highway.accuracy')}: <strong className="text-white">{accuracy}%</strong></span>
          </div>
          <div className="h-4 w-[1px] bg-[#f2ead821]" />
          <span>Rocksmith+ 3D • 60/120 FPS</span>
        </div>
      </div>
    </div>
  );
};
