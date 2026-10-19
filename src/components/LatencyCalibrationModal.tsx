import React, { useState, useEffect, useRef } from 'react';
import { sfx } from '../audio/sfxPlayer';
import { PitchDetectionResult } from '../types';
import { ArrowLeft, Clock, CheckCircle2, RotateCcw, Volume2 } from 'lucide-react';

interface LatencyCalibrationModalProps {
  currentOffsetMs: number;
  onSaveOffset: (offsetMs: number) => void;
  onClose: () => void;
  currentPitch: PitchDetectionResult;
}

export const LatencyCalibrationModal: React.FC<LatencyCalibrationModalProps> = ({
  currentOffsetMs,
  onSaveOffset,
  onClose,
  currentPitch,
}) => {
  const [offset, setOffset] = useState(currentOffsetMs);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [beat, setBeat] = useState(0);
  const [samples, setSamples] = useState<number[]>([]);
  const beatTimerRef = useRef<number | null>(null);
  const beatStartTimeRef = useRef<number>(0);

  // Pętla metronomu do kalibracji
  useEffect(() => {
    if (!isCalibrating) {
      if (beatTimerRef.current) clearInterval(beatTimerRef.current);
      return;
    }

    const bpm = 90;
    const intervalMs = (60 / bpm) * 1000;

    beatTimerRef.current = window.setInterval(() => {
      setBeat((prev) => {
        const next = (prev % 4) + 1;
        beatStartTimeRef.current = performance.now();
        sfx.play('tap', next === 1 ? 1 : 0);
        return next;
      });
    }, intervalMs);

    return () => {
      if (beatTimerRef.current) clearInterval(beatTimerRef.current);
    };
  }, [isCalibrating]);

  // Nasłuchiwanie uderzenia w strunę podczas kalibracji
  useEffect(() => {
    if (!isCalibrating || !currentPitch.detected) return;

    const hitTime = performance.now();
    const diff = hitTime - beatStartTimeRef.current;

    // Przypisz do najbliższego uderzenia metronomu
    const bpm = 90;
    const intervalMs = (60 / bpm) * 1000;
    let delta = diff;
    if (delta > intervalMs / 2) {
      delta -= intervalMs;
    }

    if (Math.abs(delta) < 200) {
      setSamples((prev) => {
        const updated = [...prev, Math.round(delta)];
        if (updated.length >= 8) {
          // Oblicz średnią z 8 uderzeń
          const sum = updated.reduce((a, b) => a + b, 0);
          const avg = Math.round(sum / updated.length);
          setOffset(avg);
          setIsCalibrating(false);
          sfx.play('confirm');
          return [];
        }
        return updated;
      });
    }
  }, [currentPitch, isCalibrating]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col p-4 sm:p-8 animate-fadeIn">
      {/* Pasek nawigacji */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-[#2d2925]">
        <button
          onClick={() => {
            sfx.play('back');
            onClose();
          }}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#1e1b18] hover:bg-[#282420] text-zinc-300 border border-[#38332d] transition-colors cursor-pointer text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Powrót do menu</span>
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold font-['Righteous'] text-amber-400">
            KALIBRACJA OPÓŹNIENIA (LATENCJI)
          </h2>
          <p className="text-xs text-zinc-400">Dostosuj bufor audio i wyeliminuj przesunięcie dźwięku</p>
        </div>

        <button
          onClick={() => {
            onSaveOffset(offset);
            sfx.play('confirm');
            onClose();
          }}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Zapisz</span>
        </button>
      </div>

      <div className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center space-y-8 my-auto py-8">
        {/* Sekcja automatycznej kalibracji */}
        <div className="w-full bg-[#161411] p-6 rounded-2xl border border-[#2b2722] text-center space-y-6">
          <div className="flex items-center justify-center space-y-2 flex-col">
            <Clock className="w-10 h-10 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Automatyczny Asystent Synchronizacji</h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Uruchom metronom i uderzaj dowolną strunę dokładnie w rytm uderzenia (kliknięcia). Po 8 uderzeniach aplikacja obliczy Twoją dokładną latencję sprzętową.
            </p>
          </div>

          {/* Animowany pierścień uderzenia */}
          {isCalibrating && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-28 h-28 rounded-full border-4 flex items-center justify-center text-3xl font-black font-mono transition-all duration-100 ${
                  beat === 1
                    ? 'border-amber-400 bg-amber-500/20 scale-110 shadow-lg shadow-amber-500/40 text-amber-300'
                    : 'border-zinc-700 bg-zinc-900/40 text-zinc-400'
                }`}
              >
                {beat}
              </div>
              <div className="text-xs text-amber-400 font-bold">
                Uderzaj w strunę! Zebrano próbek: {samples.length} / 8
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => {
                sfx.play('select');
                setSamples([]);
                setIsCalibrating(!isCalibrating);
              }}
              className={`px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${
                isCalibrating
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
              }`}
            >
              {isCalibrating ? 'Zatrzymaj asystenta' : 'Rozpocznij kalibrację na żywo'}
            </button>
          </div>
        </div>

        {/* Sekcja ręcznej regulacji suwakiem */}
        <div className="w-full bg-[#161411] p-6 rounded-2xl border border-[#2b2722] space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-bold text-white">Ręczna korekta opóźnienia:</div>
              <div className="text-xs text-zinc-400">Dodatnie wartości opóźniają nuty, ujemne przyspieszają</div>
            </div>
            <div className="text-xl font-mono font-bold text-amber-400">{offset} ms</div>
          </div>

          <input
            type="range"
            min="-150"
            max="150"
            step="5"
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
          />

          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>-150 ms (Dla szybkiego audio / słuchawek po kablu)</span>
            <button
              onClick={() => setOffset(0)}
              className="text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resetuj do 0 ms</span>
            </button>
            <span>+150 ms (Dla słuchawek Bluetooth)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
