import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, ArrowLeft, Award, Sparkles, CheckCircle2, Sliders, Flame } from 'lucide-react';
import { audio } from '../audio/audioEngine';
import { sfx } from '../audio/sfxPlayer';
import { PitchDetectionResult, NoteHit } from '../types';

interface HighwayViewProps {
  songTitle: string;
  artist: string;
  tempo?: number;
  notes?: NoteHit[];
  onExit: () => void;
  onSongComplete?: (score: number, accuracy: number, stars: number) => void;
}

// Kolory 6 strun gitary (standard Rocksmith/gryf-guitar)
export const STRING_COLORS = [
  '#ef4444', // 0: E niska (czerwona)
  '#eab308', // 1: A (żółta)
  '#3b82f6', // 2: D (niebieska)
  '#f97316', // 3: G (pomarańczowa)
  '#22c55e', // 4: B (zielona)
  '#a855f7', // 5: e wysoka (fioletowa)
];

export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export const HighwayView: React.FC<HighwayViewProps> = ({
  songTitle,
  artist,
  tempo = 120,
  notes: initialNotes,
  onExit,
  onSongComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stan gry
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [hitFeedback, setHitFeedback] = useState<{ text: string; color: string; id: number } | null>(null);
  const [currentSongTime, setCurrentSongTime] = useState<number>(0);
  const [detectedPitch, setDetectedPitch] = useState<PitchDetectionResult | null>(null);
  const [stars, setStars] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);

  // Statystyki do podsumowania
  const statsRef = useRef({
    totalNotes: 0,
    perfectHits: 0,
    goodHits: 0,
    misses: 0,
    maxStreak: 0,
  });

  // Generator przykładowej ścieżki nut jeśli nie podano w propsach
  const songNotes = useRef<NoteHit[]>(
    initialNotes && initialNotes.length > 0
      ? initialNotes
      : [
          // Klasyczny rockowy motyw ćwiczeniowy (riff na strunach E, A, D)
          { string: 0, fret: 0, time: 2.0, duration: 0.5 },
          { string: 0, fret: 3, time: 2.6, duration: 0.5 },
          { string: 0, fret: 5, time: 3.2, duration: 0.8 },
          { string: 0, fret: 0, time: 4.4, duration: 0.5 },
          { string: 0, fret: 3, time: 5.0, duration: 0.5 },
          { string: 0, fret: 6, time: 5.6, duration: 0.4 },
          { string: 0, fret: 5, time: 6.0, duration: 0.9 },
          { string: 0, fret: 0, time: 7.2, duration: 0.5 },
          { string: 0, fret: 3, time: 7.8, duration: 0.5 },
          { string: 0, fret: 5, time: 8.4, duration: 0.8 },
          { string: 0, fret: 3, time: 9.4, duration: 0.5 },
          { string: 0, fret: 0, time: 10.0, duration: 1.5 },

          // Przejście na wyższe struny (riff A & D)
          { string: 1, fret: 5, time: 12.0, duration: 0.5 },
          { string: 1, fret: 7, time: 12.6, duration: 0.5 },
          { string: 2, fret: 5, time: 13.2, duration: 0.6 },
          { string: 2, fret: 7, time: 13.8, duration: 1.0 },

          { string: 1, fret: 5, time: 15.0, duration: 0.5 },
          { string: 2, fret: 5, time: 15.6, duration: 0.5 },
          { string: 2, fret: 7, time: 16.2, duration: 0.8 },
          { string: 3, fret: 7, time: 17.2, duration: 1.2 },
        ]
  );

  const activeNotesRef = useRef<{ hit: boolean; missed: boolean; note: NoteHit }[]>(
    songNotes.current.map((n) => ({ hit: false, missed: false, note: n }))
  );

  const songDuration = songNotes.current.length > 0
    ? songNotes.current[songNotes.current.length - 1].time + 3.0
    : 30;

  // Odczyt dźwięku z mikrofonu
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

  // Ocena trafienia dźwiękiem
  const checkHitWithPitch = (pitch: PitchDetectionResult) => {
    const HIT_WINDOW_SEC = 0.12; // 120ms okno tolerancji
    const currentTime = currentTimeRef.current;

    for (let i = 0; i < activeNotesRef.current.length; i++) {
      const item = activeNotesRef.current[i];
      if (item.hit || item.missed) continue;

      const diff = Math.abs(item.note.time - currentTime);
      if (diff <= HIT_WINDOW_SEC) {
        // Oblicz oczekiwaną nutę MIDI dla struny i progu
        const expectedMidi = [40, 45, 50, 55, 59, 64][item.note.string] + item.note.fret;

        // Tolerancja: dokładna nuta MIDI lub ta sama klasa wysokości (oktawy)
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

    // Idealnie vs Dobrze
    const isPerfect = timeDiff <= 0.045; // 45ms
    const basePoints = isPerfect ? 100 : 60;
    const pointsGained = basePoints * multiplier;

    if (isPerfect) {
      statsRef.current.perfectHits++;
      sfx.play('hit_perfect');
      triggerFeedback('IDEALNIE!', '#22c55e');
    } else {
      statsRef.current.goodHits++;
      sfx.play('hit_good');
      triggerFeedback('DOBRZE!', '#3b82f6');
    }

    setScore((prev) => prev + pointsGained);
    setStreak((prev) => {
      const next = prev + 1;
      if (next > statsRef.current.maxStreak) {
        statsRef.current.maxStreak = next;
      }
      // Aktualizacja mnożnika
      if (next >= 30) setMultiplier(4);
      else if (next >= 20) setMultiplier(3);
      else if (next >= 10) setMultiplier(2);
      else setMultiplier(1);
      return next;
    });

    updateAccuracyAndStars();
  };

  const registerMiss = (index: number) => {
    const item = activeNotesRef.current[index];
    item.missed = true;
    statsRef.current.misses++;
    setStreak(0);
    setMultiplier(1);
    sfx.play('hit_miss');
    triggerFeedback('PUDŁO', '#ef4444');
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

  // Referencje do pętli renderowania
  const currentTimeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Główna pętla gry (60/120 FPS Canvas Note Highway)
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

      if (isPlaying) {
        currentTimeRef.current += deltaSec * playbackSpeed;
        setCurrentSongTime(currentTimeRef.current);

        // Sprawdzanie przegapionych nut
        for (let i = 0; i < activeNotesRef.current.length; i++) {
          const item = activeNotesRef.current[i];
          if (!item.hit && !item.missed && currentTimeRef.current > item.note.time + 0.15) {
            registerMiss(i);
          }
        }

        // Koniec utworu
        if (currentTimeRef.current >= songDuration) {
          setIsPlaying(false);
          sfx.play('song_complete');
          if (onSongComplete) {
            onSongComplete(score, accuracy, stars);
          }
        }
      }

      // Rysowanie Autostrady Nut (3D Perspective Note Highway)
      drawHighway(ctx, canvas.width, canvas.height, currentTimeRef.current);

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isPlaying, playbackSpeed, score, multiplier, accuracy, stars]);

  // Rysowanie perspektywicznej autostrady nut (trapez 3D)
  const drawHighway = (ctx: CanvasRenderingContext2D, width: number, height: number, currTime: number) => {
    ctx.clearRect(0, 0, width, height);

    // Parametry rzutu perspektywicznego
    const topY = height * 0.12;
    const bottomY = height * 0.88;
    const topWidth = width * 0.42;
    const bottomWidth = width * 0.86;

    const topX1 = (width - topWidth) / 2;
    const topX2 = topX1 + topWidth;
    const bottomX1 = (width - bottomWidth) / 2;
    const bottomX2 = bottomX1 + bottomWidth;

    // 1. Tło autostrady (ciemny asfalt sceniczny)
    const bgGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
    bgGrad.addColorStop(0, '#0a0d14');
    bgGrad.addColorStop(0.5, '#0d131f');
    bgGrad.addColorStop(1, '#05070b');

    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.moveTo(topX1, topY);
    ctx.lineTo(topX2, topY);
    ctx.lineTo(bottomX2, bottomY);
    ctx.lineTo(bottomX1, bottomY);
    ctx.closePath();
    ctx.fill();

    // Obramowanie neonowe autostrady
    ctx.strokeStyle = '#38bdf840';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Linie progów (rytm i takt)
    const BEATS_VISIBLE = 4; // sekundy w przód
    const beatInterval = 60 / tempo; // co ćwierćnutę
    const startBeat = Math.floor(currTime / beatInterval);

    for (let b = 0; b <= 16; b++) {
      const beatTime = (startBeat + b) * beatInterval;
      const timeAhead = beatTime - currTime;
      if (timeAhead < 0 || timeAhead > BEATS_VISIBLE) continue;

      // Krzywa perspektywy (z-distance)
      const p = 1 - timeAhead / BEATS_VISIBLE; // 0 (góra) do 1 (dół)
      const y = topY + (bottomY - topY) * Math.pow(p, 1.4);
      const rowWidth = topWidth + (bottomWidth - topWidth) * p;
      const rowX1 = (width - rowWidth) / 2;
      const rowX2 = rowX1 + rowWidth;

      ctx.beginPath();
      ctx.moveTo(rowX1, y);
      ctx.lineTo(rowX2, y);
      ctx.strokeStyle = (startBeat + b) % 4 === 0 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = (startBeat + b) % 4 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // 3. Struny (6 linii w perspektywie)
    for (let s = 0; s < 6; s++) {
      const ratio = s / 5;
      const sx1 = topX1 + topWidth * ratio;
      const sx2 = bottomX1 + bottomWidth * ratio;

      // Glow struny
      ctx.beginPath();
      ctx.moveTo(sx1, topY);
      ctx.lineTo(sx2, bottomY);
      ctx.strokeStyle = STRING_COLORS[s] + '44';
      ctx.lineWidth = 6 - s * 0.4;
      ctx.stroke();

      // Rdzeń struny
      ctx.beginPath();
      ctx.moveTo(sx1, topY);
      ctx.lineTo(sx2, bottomY);
      ctx.strokeStyle = STRING_COLORS[s];
      ctx.lineWidth = 2.5 - s * 0.2;
      ctx.stroke();
    }

    // 4. Linia uderzenia (Hit Bar) na dole
    const hitBarGrad = ctx.createLinearGradient(bottomX1, bottomY, bottomX2, bottomY);
    hitBarGrad.addColorStop(0, '#f59e0b');
    hitBarGrad.addColorStop(0.5, '#38bdf8');
    hitBarGrad.addColorStop(1, '#ec4899');

    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = hitBarGrad;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(bottomX1 - 10, bottomY);
    ctx.lineTo(bottomX2 + 10, bottomY);
    ctx.stroke();
    ctx.restore();

    // Target rings na linii uderzenia dla każdej struny
    for (let s = 0; s < 6; s++) {
      const ratio = s / 5;
      const x = bottomX1 + bottomWidth * ratio;
      ctx.beginPath();
      ctx.arc(x, bottomY, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = STRING_COLORS[s];
      ctx.lineWidth = 3;
      ctx.stroke();

      // Nazwa struny
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(STRING_NAMES[s], x, bottomY);
    }

    // 5. Spadające Nuty (Falling Note Capsules)
    for (const item of activeNotesRef.current) {
      const note = item.note;
      const timeAhead = note.time - currTime;

      // Wyświetlamy nuty, które zbliżają się w oknie [BEATS_VISIBLE w przód, -0.2 za linią]
      if (timeAhead > BEATS_VISIBLE || timeAhead < -0.2) continue;

      const p = 1 - timeAhead / BEATS_VISIBLE; // 0 na górze, 1 na linii trafienia
      const y = topY + (bottomY - topY) * Math.pow(Math.max(0, p), 1.4);
      const rowWidth = topWidth + (bottomWidth - topWidth) * p;
      const rowX1 = (width - rowWidth) / 2;
      const ratio = note.string / 5;
      const x = rowX1 + rowWidth * ratio;

      const noteRadius = 10 + 10 * p;
      const color = STRING_COLORS[note.string];

      ctx.save();
      if (item.hit) {
        // Cząstki lub przezroczystość po trafieniu
        ctx.globalAlpha = 0.2;
      } else if (item.missed) {
        ctx.globalAlpha = 0.3;
        ctx.filter = 'grayscale(1)';
      }

      // Poświata
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 * p;

      // Pigułka / kapsuła nuty
      ctx.beginPath();
      ctx.arc(x, y, noteRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Wewnętrzny rdzeń
      ctx.beginPath();
      ctx.arc(x, y, noteRadius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Numer progu (np. 0, 3, 5, 7)
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(11 + 6 * p)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.fret === 0 ? '0' : note.fret.toString(), x, y);

      ctx.restore();
    }
  };

  // Uruchomienie / wstrzymanie
  const togglePlay = async () => {
    await audio.initContext();
    if (!isPlaying) {
      sfx.play('click_subtle');
    }
    setIsPlaying(!isPlaying);
  };

  // Reset od początku
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
    sfx.play('click_subtle');
  };

  // Obsługa kliknięcia struny myszką (dla testów bez gitary)
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
    <div className="relative w-full h-full flex flex-col bg-zinc-950 select-none overflow-hidden text-zinc-100">
      {/* Pasek nawigacji górnej */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Wyjdź</span>
          </button>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {songTitle}
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">
                {artist}
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Tempo: {tempo} BPM • Czas: {Math.floor(currentSongTime)}s / {Math.floor(songDuration)}s
            </p>
          </div>
        </div>

        {/* Punkty, Seria, Mnożnik */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-zinc-400 font-mono block">WYNIK</span>
            <span className="text-xl font-black text-amber-400 font-mono tracking-wider">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <div>
              <span className="text-xs text-zinc-400 block leading-none">SERIA</span>
              <span className="text-sm font-bold text-white leading-none">{streak}</span>
            </div>
            <div className="ml-2 px-2 py-0.5 rounded bg-orange-600/40 text-orange-300 font-black text-xs">
              x{multiplier}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((starIdx) => (
              <span
                key={starIdx}
                className={`text-lg transition-transform ${
                  starIdx <= stars ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-zinc-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Główny obszar Canvasu Note Highway */}
      <div className="relative flex-1 w-full flex items-center justify-center bg-radial from-zinc-900 to-black overflow-hidden">
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          className="w-full h-full max-w-5xl object-contain"
        />

        {/* Komunikat o trafieniu (Feedback Overlay) */}
        {hitFeedback && (
          <div
            key={hitFeedback.id}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping text-3xl font-black tracking-widest drop-shadow-[0_0_16px_rgba(255,255,255,0.8)]"
            style={{ color: hitFeedback.color }}
          >
            {hitFeedback.text}
          </div>
        )}

        {/* Wskaźnik detektora dźwięku z gitary */}
        <div className="absolute top-4 left-6 flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-900/85 border border-zinc-800 backdrop-blur-md shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="text-xs">
            <span className="text-zinc-400 block font-mono">DŹWIĘK GITARY</span>
            <span className="font-bold text-white font-mono">
              {detectedPitch?.detected ? `${detectedPitch.noteName}${detectedPitch.octave} (${Math.round(detectedPitch.frequency)}Hz)` : 'Słucham...'}
            </span>
          </div>
        </div>

        {/* Szybkie przyciski dotykowe strun (na dole ekranu dla urządzeń dotykowych / myszy) */}
        <div className="absolute bottom-4 flex items-center justify-center gap-3">
          {STRING_NAMES.map((name, sIdx) => (
            <button
              key={name}
              onClick={() => handleStringClick(sIdx)}
              className="px-4 py-2 rounded-xl font-black text-sm uppercase transition-all shadow-md active:scale-95"
              style={{
                backgroundColor: STRING_COLORS[sIdx] + '22',
                border: `2px solid ${STRING_COLORS[sIdx]}`,
                color: '#ffffff',
              }}
            >
              Struna {name}
            </button>
          ))}
        </div>
      </div>

      {/* Dolny pasek kontrolny */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/90 border-t border-zinc-800 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pauza' : 'Graj'}
          </button>

          <button
            onClick={restartSong}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Od nowa
          </button>

          {/* Wybór tempa */}
          <div className="flex items-center bg-zinc-800 rounded-xl p-1 text-xs">
            {[0.5, 0.75, 1.0].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-colors ${
                  playbackSpeed === speed ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Dokładność: <strong className="text-white">{accuracy}%</strong></span>
          </div>
          <div className="h-4 w-[1px] bg-zinc-700" />
          <span>Sterowanie: <strong>Graj na gitarze</strong> lub klikaj struny u dołu</span>
        </div>
      </div>
    </div>
  );
};
