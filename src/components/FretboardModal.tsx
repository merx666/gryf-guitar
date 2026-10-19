import React, { useState } from 'react';
import { SCALES, ROOT_NOTES, getNoteAtFret } from '../data/scalesData';
import { audio } from '../audio/audioEngine';
import { sfx } from '../audio/sfxPlayer';
import { ArrowLeft, Volume2, Sparkles, BookOpen, Layers } from 'lucide-react';

interface FretboardModalProps {
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
    <div className="fixed inset-0 bg-[#0b0907]/95 backdrop-blur-2xl z-50 flex flex-col p-6 sm:p-10 animate-fadeIn overflow-y-auto select-none text-[#f2ead8]">
      {/* Pasek nawigacji górnej */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto pb-4 border-b border-[#f2ead8]/12">
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
            <span className="w-2 h-2 rounded-full bg-[#e2b04a] animate-pulse"></span>
            <span className="text-[11px] font-['Barlow_Condensed'] uppercase tracking-[0.2em] font-bold text-[#e2b04a]">
              Teoria Muzyki & Wizualizacja Gryfu
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8] mt-0.5">
            WIRTUALNY GRYF & ATLAS SKAL
          </h2>
          <p className="text-xs text-[#f2ead8]/60 font-['Barlow']">
            Eksploruj pozycje pentatoniki, skal modalnych i ogrywaj dźwięki w czasie rzeczywistym
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#e2b04a] bg-[#1a1612] border border-[#e2b04a]/30 px-3 py-1.5 rounded-sm">
          <BookOpen className="w-3.5 h-3.5 text-[#e2b04a]" />
          <span>Kliknij dźwięk, by usłyszeć</span>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto flex flex-col space-y-6 my-auto py-6">
        {/* Panel sterowania: Wybór prymy i skali */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#110e0b] p-5 rounded-sm border border-[#f2ead8]/12 shadow-2xl">
          {/* Wybór dźwięku podstawowego (Prymy) */}
          <div>
            <label className="text-xs font-bold font-['Barlow_Condensed'] uppercase tracking-wider text-[#e2b04a] block mb-2">
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
                  className={`px-3 py-1.5 rounded-sm text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-black transition-all cursor-pointer ${
                    selectedRoot === note
                      ? 'bg-[#e2b04a] text-[#0b0907] shadow-[0_0_15px_rgba(226,176,74,0.4)] scale-105'
                      : 'bg-[#181410] hover:bg-[#241e18] text-[#f2ead8]/80 border border-[#f2ead8]/15 hover:border-[#f2ead8]/40'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Wybór rodzaju skali */}
          <div>
            <label className="text-xs font-bold font-['Barlow_Condensed'] uppercase tracking-wider text-[#e2b04a] block mb-2">
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
                  className={`px-3 py-2 rounded-sm text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-left transition-all cursor-pointer truncate ${
                    selectedScaleId === scale.id
                      ? 'bg-[#e0392b] text-white shadow-[0_0_15px_rgba(224,57,43,0.4)]'
                      : 'bg-[#181410] hover:bg-[#241e18] text-[#f2ead8]/80 border border-[#f2ead8]/15 hover:border-[#f2ead8]/40'
                  }`}
                >
                  {scale.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opis skali */}
        <div className="bg-[#14100c] px-5 py-3 rounded-sm border border-[#f2ead8]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-black font-['Big_Shoulders_Display'] uppercase text-base text-[#e2b04a]">
              {selectedRoot} {currentScale.name}:{' '}
            </span>
            <span className="text-[#f2ead8]/80 font-['Barlow']">{currentScale.description}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#e2b04a] inline-block shadow-[0_0_8px_#e2b04a]"></span>
              <span className="text-[#f2ead8]">Pryma (Root)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#38bdf8] inline-block shadow-[0_0_8px_#38bdf8]"></span>
              <span className="text-[#f2ead8]">Dźwięk skali</span>
            </div>
          </div>
        </div>

        {/* Gryf gitarowy (Hebanowy Fretboard z teksturą i inlays) */}
        <div className="w-full bg-[#120e0a] rounded-sm border-2 border-[#f2ead8]/15 shadow-2xl overflow-x-auto p-5 select-none relative">
          <div className="min-w-[920px]">
            {/* Numery progów */}
            <div className="grid grid-cols-[60px_repeat(15,1fr)] text-center text-xs font-mono text-[#f2ead8]/60 pb-3 border-b border-[#f2ead8]/10">
              <div className="text-[11px] font-['Barlow_Condensed'] uppercase tracking-wider text-[#e2b04a] font-bold">
                Pusta
              </div>
              {Array.from({ length: fretCount }).map((_, idx) => (
                <div key={idx} className="font-bold">
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* 6 strun (od e4 do E2) */}
            <div className="space-y-4 relative py-3">
              {[5, 4, 3, 2, 1, 0].map((stringIdx) => {
                const strColor = STRING_COLORS[stringIdx] || '#e0392b';
                const stringGauges = ['h-[3px]', 'h-[2.5px]', 'h-[2px]', 'h-[1.5px]', 'h-[1px]', 'h-[1px]'];

                return (
                  <div key={stringIdx} className="relative flex items-center grid grid-cols-[60px_repeat(15,1fr)]">
                    {/* Metalowa struna z kolorowym glow Rocksmith */}
                    <div
                      className={`absolute left-[60px] right-0 ${stringGauges[stringIdx]} pointer-events-none z-0`}
                      style={{
                        backgroundColor: strColor,
                        boxShadow: `0 0 6px ${strColor}80`,
                        opacity: 0.85,
                      }}
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
                            className={`w-9 h-7 rounded-sm font-['Big_Shoulders_Display'] font-black text-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                              isRoot
                                ? 'bg-[#e2b04a] text-[#0b0907] ring-2 ring-[#e2b04a] shadow-[0_0_12px_rgba(226,176,74,0.6)]'
                                : inScale
                                ? 'bg-[#38bdf8] text-[#0b0907] shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                                : 'bg-[#181410] text-[#f2ead8]/50 border border-[#f2ead8]/12 hover:bg-zinc-800'
                            }`}
                          >
                            {note}
                          </button>
                        );
                      })()}
                    </div>

                    {/* Progi od 1 do 15 z metalowymi progami */}
                    {Array.from({ length: fretCount }).map((_, fIdx) => {
                      const fret = fIdx + 1;
                      const { note } = getNoteAtFret(stringIdx, fret);
                      const noteIndex = ROOT_NOTES.indexOf(note);
                      const inScale = scaleMidiNotes.has(noteIndex);
                      const isRoot = note === selectedRoot;

                      return (
                        <div
                          key={fret}
                          className="h-9 flex items-center justify-center border-r-2 border-[#4a3f33] relative z-10"
                        >
                          {inScale && (
                            <button
                              onClick={() => handlePlayNote(stringIdx, fret)}
                              className={`w-7 h-7 rounded-full text-xs font-['Big_Shoulders_Display'] font-black flex items-center justify-center transition-all hover:scale-125 cursor-pointer shadow-lg ${
                                isRoot
                                  ? 'bg-[#e2b04a] text-[#0b0907] ring-2 ring-white shadow-[0_0_15px_#e2b04a] scale-105'
                                  : 'bg-[#38bdf8] text-[#0b0907] shadow-[0_0_10px_#38bdf8]'
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

            {/* Znaczniki progów (Markery diamentowe/perłowe: 3, 5, 7, 9, 12-podwójna, 15) */}
            <div className="grid grid-cols-[60px_repeat(15,1fr)] text-center pt-3 border-t border-[#f2ead8]/10">
              <div></div>
              {Array.from({ length: fretCount }).map((_, idx) => {
                const fret = idx + 1;
                const isSingleDot = [3, 5, 7, 9, 15].includes(fret);
                const isDoubleDot = fret === 12;

                return (
                  <div key={idx} className="flex justify-center items-center">
                    {isSingleDot && (
                      <span className="w-2.5 h-2.5 rotate-45 bg-[#f2ead8]/40 border border-[#f2ead8]/60 inline-block shadow-sm"></span>
                    )}
                    {isDoubleDot && (
                      <span className="flex space-x-1.5">
                        <span className="w-2 h-2 rotate-45 bg-[#e2b04a] border border-white inline-block shadow-[0_0_6px_#e2b04a]"></span>
                        <span className="w-2 h-2 rotate-45 bg-[#e2b04a] border border-white inline-block shadow-[0_0_6px_#e2b04a]"></span>
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
