import React, { useState } from 'react';
import { SCALES, ROOT_NOTES, getNoteAtFret } from '../data/scalesData';
import { audio } from '../audio/audioEngine';
import { sfx } from '../audio/sfxPlayer';
import { ArrowLeft, Volume2, Sparkles, BookOpen } from 'lucide-react';

interface FretboardModalProps {
  onClose: () => void;
}

export const FretboardModal: React.FC<FretboardModalProps> = ({ onClose }) => {
  const [selectedRoot, setSelectedRoot] = useState('A');
  const [selectedScaleId, setSelectedScaleId] = useState('minor-pentatonic');
  const [fretCount] = useState(15);

  const currentScale = SCALES.find((s) => s.id === selectedScaleId) || SCALES[0];

  // Oblicz wszystkie nuty w wybranej skali
  const rootMidiBase = ROOT_NOTES.indexOf(selectedRoot);
  const scaleMidiNotes = new Set(
    currentScale.intervals.map((interval) => (rootMidiBase + interval) % 12)
  );

  const handlePlayNote = (stringIndex: number, fret: number) => {
    sfx.play('tap');
    audio.playSyntheticNote(stringIndex, fret, 1.2);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col p-4 sm:p-8 animate-fadeIn overflow-y-auto">
      {/* Pasek nawigacji */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto pb-4 border-b border-[#2d2925]">
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
            WIRTUALNY GRYF & SKALE
          </h2>
          <p className="text-xs text-zinc-400">Eksploruj pozycje skal i ogrywaj dźwięki na gryfie</p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Kliknij dźwięk, aby go usłyszeć</span>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto flex flex-col space-y-6 my-auto py-6">
        {/* Panel sterowania: Wybór prymy i skali */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#141210] p-4 rounded-2xl border border-[#26231f]">
          {/* Wybór dźwięku podstawowego (Prymy) */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Dźwięk podstawowy (Pryma / Root):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ROOT_NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => {
                    sfx.play('select');
                    setSelectedRoot(note);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    selectedRoot === note
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 scale-105'
                      : 'bg-[#1e1b18] hover:bg-[#2a2622] text-zinc-300 border border-[#332f2a]'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Wybór rodzaju skali */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Typ skali gitarowej:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {SCALES.map((scale) => (
                <button
                  key={scale.id}
                  onClick={() => {
                    sfx.play('select');
                    setSelectedScaleId(scale.id);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer truncate ${
                    selectedScaleId === scale.id
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#1e1b18] hover:bg-[#2a2622] text-zinc-300 border border-[#332f2a]'
                  }`}
                >
                  {scale.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opis skali */}
        <div className="bg-[#181613] px-4 py-3 rounded-xl border border-[#2b2722] flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-amber-400">{selectedRoot} {currentScale.name}: </span>
            <span className="text-zinc-300">{currentScale.description}</span>
          </div>
          <div className="flex items-center space-x-3 ml-4 shrink-0 font-mono text-[11px]">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-zinc-300">Pryma (Root)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block"></span>
              <span className="text-zinc-300">Dźwięk skali</span>
            </div>
          </div>
        </div>

        {/* Gryf gitarowy (Fretboard) */}
        <div className="w-full bg-[#1e1712] rounded-2xl border-4 border-[#33271d] shadow-2xl overflow-x-auto p-4 select-none">
          <div className="min-w-[860px]">
            {/* Numery progów */}
            <div className="grid grid-cols-[60px_repeat(15,1fr)] text-center text-xs font-mono text-zinc-400 pb-2">
              <div className="text-[10px] text-zinc-400">Pusta</div>
              {Array.from({ length: fretCount }).map((_, idx) => (
                <div key={idx} className="font-bold">
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* 6 strun (od e4 do E2) */}
            <div className="space-y-3 relative py-2">
              {[5, 4, 3, 2, 1, 0].map((stringIdx) => {
                const stringNames = ['6 (E)', '5 (A)', '4 (D)', '3 (G)', '2 (B)', '1 (e)'];
                const stringGauges = ['h-1.5', 'h-1.5', 'h-1', 'h-1', 'h-0.5', 'h-0.5'];

                return (
                  <div key={stringIdx} className="relative flex items-center grid grid-cols-[60px_repeat(15,1fr)]">
                    {/* Metalowa struna przechodząca przez całą długość */}
                    <div
                      className={`absolute left-[60px] right-0 bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-sm ${stringGauges[stringIdx]} pointer-events-none z-0`}
                    ></div>

                    {/* Próg zerowy (Otwarta struna) */}
                    <div className="flex items-center justify-center z-10 pr-2">
                      {(() => {
                        const { note } = getNoteAtFret(stringIdx, 0);
                        const noteIndex = ROOT_NOTES.indexOf(note);
                        const inScale = scaleMidiNotes.has(noteIndex);
                        const isRoot = note === selectedRoot;

                        return (
                          <button
                            onClick={() => handlePlayNote(stringIdx, 0)}
                            className={`w-9 h-7 rounded-md font-bold text-xs flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                              isRoot
                                ? 'bg-amber-500 text-black font-black ring-2 ring-amber-300 shadow-md shadow-amber-500/30'
                                : inScale
                                ? 'bg-cyan-500 text-black font-black shadow-md shadow-cyan-500/20'
                                : 'bg-[#151311] text-zinc-400 border border-[#2a2622] hover:bg-zinc-800'
                            }`}
                          >
                            {note}
                          </button>
                        );
                      })()}
                    </div>

                    {/* Progi od 1 do 15 */}
                    {Array.from({ length: fretCount }).map((_, fIdx) => {
                      const fret = fIdx + 1;
                      const { note } = getNoteAtFret(stringIdx, fret);
                      const noteIndex = ROOT_NOTES.indexOf(note);
                      const inScale = scaleMidiNotes.has(noteIndex);
                      const isRoot = note === selectedRoot;

                      return (
                        <div
                          key={fret}
                          className="h-9 flex items-center justify-center border-r-2 border-[#544335] relative z-10"
                        >
                          {inScale && (
                            <button
                              onClick={() => handlePlayNote(stringIdx, fret)}
                              className={`w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center transition-all hover:scale-125 cursor-pointer shadow-lg ${
                                isRoot
                                  ? 'bg-amber-400 text-black ring-2 ring-amber-200 shadow-amber-400/50 scale-105'
                                  : 'bg-cyan-400 text-black shadow-cyan-400/40'
                              }`}
                            >
                              {note}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Znaczniki progów (Markery kropkowe: 3, 5, 7, 9, 12-podwójna, 15) */}
            <div className="grid grid-cols-[60px_repeat(15,1fr)] text-center pt-3">
              <div></div>
              {Array.from({ length: fretCount }).map((_, idx) => {
                const fret = idx + 1;
                const isSingleDot = [3, 5, 7, 9, 15].includes(fret);
                const isDoubleDot = fret === 12;

                return (
                  <div key={idx} className="flex justify-center items-center">
                    {isSingleDot && <span className="w-2.5 h-2.5 rounded-full bg-[#7a6453]"></span>}
                    {isDoubleDot && (
                      <span className="flex space-x-1">
                        <span className="w-2 h-2 rounded-full bg-[#7a6453]"></span>
                        <span className="w-2 h-2 rounded-full bg-[#7a6453]"></span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
