import React, { useState } from 'react';
import { ArrowLeft, Star, Play, CheckCircle2, Lock, Music2, MessageSquare, MapPin, Award } from 'lucide-react';
import { TOUR_CHAPTERS, TOUR_SONGS } from '../data/tourData';
import { TourSong } from '../types';
import { sfx } from '../audio/sfxPlayer';

interface TourViewProps {
  onBack: () => void;
  onSelectSong: (song: TourSong) => void;
  earnedStars: Record<string, number>; // id utworu -> liczba gwiazdek
}

export const TourView: React.FC<TourViewProps> = ({
  onBack,
  onSelectSong,
  earnedStars,
}) => {
  const [selectedChapterN, setSelectedChapterN] = useState<number>(1);

  const currentChapter = TOUR_CHAPTERS.find((c) => c.n === selectedChapterN) || TOUR_CHAPTERS[0];
  const chapterSongs = TOUR_SONGS.filter((s) => s.chapter === selectedChapterN);

  const calculateTotalStars = () => {
    return Object.values(earnedStars).reduce((acc, val) => acc + val, 0);
  };

  const totalPlayerStars = calculateTotalStars();

  const handleSongPlay = (song: TourSong) => {
    sfx.play('click_subtle');
    onSelectSong(song);
  };

  return (
    <div className="w-full flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Pasek nawigacji powrotnej */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Menu Główne</span>
        </button>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-bold text-amber-300">
            {totalPlayerStars} Zdobytych Gwiazdek
          </span>
        </div>
      </div>

      {/* Wybór 8 Rozdziałów na Osi Czasu (Timeline Chapters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-8">
        {TOUR_CHAPTERS.map((chap) => {
          const isUnlocked = totalPlayerStars >= chap.passMark;
          const isSelected = chap.n === selectedChapterN;

          return (
            <button
              key={chap.n}
              disabled={!isUnlocked}
              onClick={() => {
                sfx.play('click_subtle');
                setSelectedChapterN(chap.n);
              }}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : isUnlocked
                  ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-600 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold">R{chap.n}</span>
                {!isUnlocked && <Lock className="w-3.5 h-3.5 text-zinc-600" />}
              </div>
              <div className="text-xs font-bold truncate">{chap.stage}</div>
              <div className="text-[10px] text-zinc-500 truncate mt-0.5">{chap.place}</div>
            </button>
          );
        })}
      </div>

      {/* Prezentacja wybranego rozdziału i dialog menadżerki Magdy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Kolumna lewa: Miejsce i Fabuła */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>ROZDZIAŁ {currentChapter.n}: {currentChapter.stage.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">{currentChapter.venue}</h2>
            <p className="text-xs text-zinc-400 mb-6">{currentChapter.place}</p>

            {/* Wiadomość od Magdy */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Magda (Menedżerka Zespołu):
              </div>
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                "{currentChapter.story}"
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Wymagane gwiazdki do wejścia:</span>
            <strong className="text-white font-mono">{currentChapter.passMark} ★</strong>
          </div>
        </div>

        {/* Kolumna prawa: Lista Piosenek w Rozdziale */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Utwory Koncertowe ({chapterSongs.length})
          </h3>

          <div className="flex flex-col gap-3">
            {chapterSongs.map((song) => {
              const stars = earnedStars[song.id] || 0;

              return (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-850"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-mono font-bold text-sm">
                      #{song.order}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{song.title}</h4>
                        <span className="text-xs text-zinc-400">• {song.artist}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span>Tempo: {song.tempo} BPM</span>
                        <span>Strój: {song.tuning}</span>
                        <span>Nuty: {song.notesCount}</span>
                        <span className="text-amber-500/80 font-medium">Uczy: {song.teaches.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gwiazdki i Przycisk Zagrania */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= stars ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleSongPlay(song)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Graj
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
