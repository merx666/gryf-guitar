import React, { useEffect, useState, useRef } from 'react';
import { PitchDetectionResult } from '../types';
import { STANDARD_GUITAR_STRINGS } from '../audio/pitchDetector';
import { audio } from '../audio/audioEngine';
import { sfx } from '../audio/sfxPlayer';
import { ArrowLeft, Mic, Sparkles, Activity, Volume2 } from 'lucide-react';

interface TunerModalProps {
  currentPitch: PitchDetectionResult;
  onClose: () => void;
}

// Rocksmith 6-string standard color protocol
const STRING_COLORS: Record<number, string> = {
  0: '#e0392b', // String 6 (Low E) - Red
  1: '#eab308', // String 5 (A)     - Yellow
  2: '#3b82f6', // String 4 (D)     - Blue
  3: '#f97316', // String 3 (G)     - Orange
  4: '#22c55e', // String 2 (B)     - Green
  5: '#a855f7', // String 1 (High e) - Purple
};

export const TunerModal: React.FC<TunerModalProps> = ({ currentPitch, onClose }) => {
  const [lastInTuneTime, setLastInTuneTime] = useState(0);
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null);
  const strobeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strobeAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const isInTune = currentPitch.detected && Math.abs(currentPitch.cents) <= 3;
  const isClose = currentPitch.detected && Math.abs(currentPitch.cents) <= 10;

  // Dźwięk potwierdzenia idealnego stroju
  useEffect(() => {
    if (isInTune) {
      const now = Date.now();
      if (now - lastInTuneTime > 2000) {
        setLastInTuneTime(now);
        sfx.play('inTune');
      }
    }
  }, [isInTune, lastInTuneTime]);

  // Animacja koła stroboskopowego (Strobe Tuner) i fali audio
  useEffect(() => {
    let active = true;

    const renderTuner = () => {
      if (!active) return;

      // 1. Rysowanie Koła Stroboskopowego
      const sCanvas = strobeCanvasRef.current;
      if (sCanvas) {
        const ctx = sCanvas.getContext('2d');
        if (ctx) {
          const w = sCanvas.width;
          const h = sCanvas.height;
          const cx = w / 2;
          const cy = h / 2;
          const r = Math.min(cx, cy) - 10;

          ctx.clearRect(0, 0, w, h);

          // Prędkość obrotu stroboskopu zależna od odchyłki w centach
          if (currentPitch.detected) {
            const rotSpeed = currentPitch.cents * 0.003;
            strobeAngleRef.current += rotSpeed;
          }

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(strobeAngleRef.current);

          // Zęby stroboskopowe
          const segmentCount = 24;
          for (let i = 0; i < segmentCount; i++) {
            const angle = (i * 2 * Math.PI) / segmentCount;
            ctx.beginPath();
            ctx.arc(0, 0, r, angle, angle + (Math.PI / segmentCount) * 0.7);
            ctx.arc(0, 0, r - 12, angle + (Math.PI / segmentCount) * 0.7, angle, true);
            ctx.closePath();

            if (isInTune) {
              ctx.fillStyle = '#58c46c';
            } else if (isClose) {
              ctx.fillStyle = '#e2b04a';
            } else {
              ctx.fillStyle = currentPitch.detected ? 'rgba(242, 234, 216, 0.4)' : 'rgba(242, 234, 216, 0.15)';
            }
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // 2. Rysowanie Fali Oscyloskopu Mikrofonu
      const wCanvas = waveCanvasRef.current;
      if (wCanvas) {
        const ctx = wCanvas.getContext('2d');
        if (ctx) {
          const w = wCanvas.width;
          const h = wCanvas.height;
          ctx.clearRect(0, 0, w, h);

          const timeData = audio.getTimeDomainData();
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = isInTune ? '#58c46c' : isClose ? '#e2b04a' : '#38bdf8';

          const sliceWidth = w / timeData.length;
          let x = 0;

          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * h) / 2;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(renderTuner);
    };

    renderTuner();

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentPitch, isInTune, isClose]);

  // Zagraj ton wzorcowy dla wybranej struny
  const playReferenceTone = (strIdx: number) => {
    sfx.play('tap');
    setSelectedStringIndex(strIdx);
    audio.playSyntheticNote(strIdx, 0, 2.0);
  };

  return (
    <div className="fixed inset-0 bg-[#0b0907]/95 backdrop-blur-2xl z-50 flex flex-col p-6 sm:p-10 animate-fadeIn select-none text-[#f2ead8]">
      {/* Pasek nawigacji górnej */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto pb-6 border-b border-[#f2ead8]/12">
        <button
          onClick={() => {
            sfx.play('click_subtle');
            onClose();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#110e0b] hover:bg-[#1a1612] text-[#f2ead8]/80 hover:text-white border border-[#f2ead8]/15 hover:border-[#e0392b] transition-all cursor-pointer font-['Barlow_Condensed'] uppercase tracking-wider text-sm font-bold shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-[#e0392b]" />
          <span>Powrót do menu</span>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#58c46c] animate-pulse"></span>
            <span className="text-[11px] font-['Barlow_Condensed'] uppercase tracking-[0.2em] font-bold text-[#e2b04a]">
              Silnik Audio DSP YIN / ACF2+
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8] mt-0.5">
            STROIK CHROMATYCZNY ROCKSMITH+
          </h2>
          <p className="text-xs text-[#f2ead8]/60 font-['Barlow']">
            Precyzja do 0.1 Hz • Prawdziwe koło stroboskopowe • Zakres basu i wiolinów
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#58c46c] bg-[#58c46c]/10 border border-[#58c46c]/30 px-3.5 py-1.5 rounded-sm">
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>Słucham sygnału...</span>
        </div>
      </div>

      {/* Główna sekcja stroboskopowa */}
      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col items-center justify-center space-y-8 my-auto">
        {/* Tarcza stroboskopowa z dużą nutą */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Canvas Stroboskopu */}
          <canvas
            ref={strobeCanvasRef}
            width={280}
            height={280}
            className="absolute pointer-events-none"
          />

          <div
            className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-200 shadow-2xl relative z-10 ${
              isInTune
                ? 'bg-[#58c46c]/10 border-[#58c46c] shadow-[0_0_50px_rgba(88,196,108,0.4)] scale-105'
                : isClose
                ? 'bg-[#e2b04a]/10 border-[#e2b04a] shadow-[0_0_30px_rgba(226,176,74,0.3)]'
                : 'bg-[#110e0b] border-[#f2ead8]/15 shadow-black'
            }`}
          >
            {/* Wykryta nuta */}
            <div className="text-7xl sm:text-8xl font-black font-['Big_Shoulders_Display'] tracking-tight text-[#f2ead8]">
              {currentPitch.detected ? currentPitch.noteName : '--'}
            </div>

            <div className="text-xs font-['Barlow_Condensed'] uppercase tracking-widest font-bold text-[#e2b04a] mt-0.5">
              {currentPitch.detected ? `Oktawa ${currentPitch.octave}` : 'Zagraj strunę'}
            </div>

            {currentPitch.detected && (
              <div className="text-xs font-mono text-[#f2ead8]/70 mt-1">
                {currentPitch.frequency.toFixed(1)} Hz
              </div>
            )}
          </div>

          {/* Odznaka w stroju */}
          {isInTune && (
            <div className="absolute -bottom-4 z-20 bg-[#58c46c] text-[#0b0907] px-5 py-1 rounded-full font-['Barlow_Condensed'] font-black text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-[#58c46c]/40 animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              <span>IDEALNY STRÓJ!</span>
            </div>
          )}
        </div>

        {/* Miernik centów (-50 do +50) */}
        <div className="w-full max-w-lg bg-[#110e0b] p-6 rounded-sm border border-[#f2ead8]/12 shadow-2xl">
          <div className="flex justify-between text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#f2ead8]/60 mb-2">
            <span>-50¢ (Za nisko / Naciągnij)</span>
            <span className="font-bold text-[#f2ead8] text-sm">0¢</span>
            <span>+50¢ (Za wysoko / Poluźnij)</span>
          </div>

          {/* Skala suwaka */}
          <div className="relative h-7 bg-[#080605] rounded-sm overflow-hidden border border-[#f2ead8]/15 flex items-center">
            {/* Środkowy punkt idealny */}
            <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-[#58c46c] z-10 shadow-[0_0_10px_#58c46c]"></div>

            {/* Wskaźnik odchyłki */}
            {currentPitch.detected && (
              <div
                className={`absolute h-full w-4 rounded-sm transition-all duration-75 -translate-x-1/2 ${
                  isInTune
                    ? 'bg-[#58c46c] shadow-[0_0_15px_#58c46c]'
                    : currentPitch.cents < 0
                    ? 'bg-[#e0392b] shadow-[0_0_10px_#e0392b]'
                    : 'bg-[#38bdf8] shadow-[0_0_10px_#38bdf8]'
                }`}
                style={{
                  left: `${Math.max(5, Math.min(95, 50 + currentPitch.cents))}%`,
                }}
              ></div>
            )}
          </div>

          {/* Wyświetlacz odchyłki liczbowej i oscyloskop */}
          <div className="flex items-center justify-between mt-4">
            <div className="font-mono text-sm">
              {currentPitch.detected ? (
                <span
                  className={`font-bold ${
                    isInTune ? 'text-[#58c46c]' : isClose ? 'text-[#e2b04a]' : 'text-[#f2ead8]'
                  }`}
                >
                  {currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents} centów
                </span>
              ) : (
                <span className="text-[#f2ead8]/40 text-xs font-['Barlow']">Czekam na sygnał audio...</span>
              )}
            </div>

            {/* Mini oscyloskop fali dźwiękowej */}
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
              <canvas
                ref={waveCanvasRef}
                width={120}
                height={24}
                className="bg-[#080605] rounded-sm border border-[#f2ead8]/10"
              />
            </div>
          </div>
        </div>

        {/* 6 standardowych strun gitary w kolorach Rocksmith+ */}
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-['Barlow_Condensed'] uppercase tracking-wider text-[#f2ead8]/60">
              Wybierz strunę do odsłuchu lub naciśnij, by usłyszeć ton wzorcowy
            </span>
            <span className="text-[11px] font-['Barlow_Condensed'] uppercase tracking-wider text-[#e2b04a] font-bold">
              Standard E (440 Hz)
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {STANDARD_GUITAR_STRINGS.map((str) => {
              const strColor = STRING_COLORS[str.stringIndex] || '#e0392b';
              const isDetected = currentPitch.detected && currentPitch.stringEstimated === str.stringIndex;
              const isSelected = selectedStringIndex === str.stringIndex;

              return (
                <button
                  key={str.stringIndex}
                  onClick={() => playReferenceTone(str.stringIndex)}
                  className={`p-3 rounded-sm border text-center transition-all cursor-pointer relative overflow-hidden group ${
                    isDetected
                      ? isInTune
                        ? 'bg-[#58c46c]/20 border-[#58c46c] text-[#58c46c] shadow-[0_0_20px_rgba(88,196,108,0.3)] scale-105'
                        : 'bg-[#e2b04a]/15 border-[#e2b04a] text-[#e2b04a] scale-105'
                      : isSelected
                      ? 'bg-[#1a1612] border-[#f2ead8]/40 text-white'
                      : 'bg-[#110e0b] border-[#f2ead8]/12 text-[#f2ead8]/70 hover:border-[#f2ead8]/40'
                  }`}
                >
                  {/* Górny kolorowy pasek struny Rocksmith */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: strColor }}
                  ></div>

                  <div className="text-2xl font-black font-['Big_Shoulders_Display'] uppercase mt-1">
                    {str.note}
                  </div>
                  <div className="text-[11px] font-['Barlow_Condensed'] uppercase font-bold text-[#f2ead8]/60 mt-0.5">
                    {str.name}
                  </div>
                  <div className="text-[10px] font-mono text-[#f2ead8]/40 mt-1">
                    {str.freq} Hz
                  </div>

                  <div className="mt-2 text-[9px] font-['Barlow_Condensed'] uppercase font-bold text-[#e2b04a] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5">
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>Zagraj</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
