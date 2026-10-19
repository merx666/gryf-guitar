import React, { useEffect, useState } from 'react';
import { PitchDetectionResult } from '../types';
import { STANDARD_GUITAR_STRINGS } from '../audio/pitchDetector';
import { sfx } from '../audio/sfxPlayer';
import { CheckCircle2, ArrowLeft, Mic, Sparkles } from 'lucide-react';

interface TunerModalProps {
  currentPitch: PitchDetectionResult;
  onClose: () => void;
}

export const TunerModal: React.FC<TunerModalProps> = ({ currentPitch, onClose }) => {
  const [lastInTuneTime, setLastInTuneTime] = useState(0);

  // Sprawdzaj czy dźwięk jest w idealnym stroju (+/- 3 centy)
  useEffect(() => {
    if (currentPitch.detected && Math.abs(currentPitch.cents) <= 3) {
      const now = Date.now();
      if (now - lastInTuneTime > 2000) {
        setLastInTuneTime(now);
        sfx.play('inTune');
      }
    }
  }, [currentPitch, lastInTuneTime]);

  const isInTune = currentPitch.detected && Math.abs(currentPitch.cents) <= 3;
  const isClose = currentPitch.detected && Math.abs(currentPitch.cents) <= 10;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col p-4 sm:p-8 animate-fadeIn">
      {/* Pasek nawigacji powrotu */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-6 border-b border-[#2d2925]">
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
            STROIK CHROMATYCZNY
          </h2>
          <p className="text-xs text-zinc-400">Precyzyjne strojenie gitary w czasie rzeczywistym</p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>Słucham...</span>
        </div>
      </div>

      {/* Główna sekcja stroika */}
      <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col items-center justify-center space-y-8 my-auto">
        {/* Duży wskaźnik nuty */}
        <div className="relative flex flex-col items-center justify-center">
          <div
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-200 shadow-2xl ${
              isInTune
                ? 'bg-emerald-950/30 border-emerald-500 shadow-emerald-500/30 scale-105'
                : isClose
                ? 'bg-amber-950/20 border-amber-500 shadow-amber-500/20'
                : 'bg-zinc-900/40 border-zinc-700 shadow-black'
            }`}
          >
            <div className="text-6xl sm:text-7xl font-black font-['Righteous'] tracking-wider">
              {currentPitch.detected ? currentPitch.noteName : '--'}
            </div>
            <div className="text-sm font-bold text-zinc-400 mt-1">
              {currentPitch.detected ? `Oktawa ${currentPitch.octave}` : 'Zagraj strunę'}
            </div>
            {currentPitch.detected && (
              <div className="text-xs font-mono text-zinc-400 mt-2">
                {currentPitch.frequency.toFixed(1)} Hz
              </div>
            )}
          </div>

          {isInTune && (
            <div className="absolute -bottom-4 bg-emerald-500 text-black px-4 py-1 rounded-full font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-emerald-500/40 animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              <span>W STROJU!</span>
            </div>
          )}
        </div>

        {/* Miernik centów (-50 do +50) */}
        <div className="w-full max-w-md bg-[#161412] p-6 rounded-2xl border border-[#2b2723] shadow-xl">
          <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>-50¢ (Za nisko)</span>
            <span className="font-bold text-white">0¢</span>
            <span>+50¢ (Za wysoko)</span>
          </div>

          {/* Skala suwaka */}
          <div className="relative h-6 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 flex items-center">
            {/* Środkowy punkt idealny */}
            <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-emerald-500 z-10"></div>
            {/* Wskaźnik odchyłki */}
            {currentPitch.detected && (
              <div
                className={`absolute h-full w-3 rounded-full transition-all duration-75 -translate-x-1/2 ${
                  isInTune ? 'bg-emerald-400 shadow-md shadow-emerald-500' : currentPitch.cents < 0 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{
                  left: `${Math.max(5, Math.min(95, 50 + currentPitch.cents))}%`,
                }}
              ></div>
            )}
          </div>

          {/* Wyświetlacz odchyłki liczbowej */}
          <div className="text-center mt-3 font-mono text-sm">
            {currentPitch.detected ? (
              <span className={`font-bold ${isInTune ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents} centów
              </span>
            ) : (
              <span className="text-zinc-400 text-xs">Czekam na dźwięk...</span>
            )}
          </div>
        </div>

        {/* 6 standardowych strun gitary */}
        <div className="w-full max-w-lg">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-center mb-3">
            Wybór struny docelowej (E Standard)
          </div>
          <div className="grid grid-cols-6 gap-2">
            {STANDARD_GUITAR_STRINGS.map((str) => {
              const isActive = currentPitch.detected && currentPitch.stringEstimated === str.stringIndex;
              return (
                <div
                  key={str.stringIndex}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isActive
                      ? isInTune
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                        : 'bg-amber-950/40 border-amber-500 text-amber-300 scale-105'
                      : 'bg-[#181614] border-[#292521] text-zinc-400'
                  }`}
                >
                  <div className="text-lg font-black font-['Righteous']">{str.note}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{str.name}</div>
                  <div className="text-[9px] font-mono text-zinc-400">{str.freq} Hz</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
