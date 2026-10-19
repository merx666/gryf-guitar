import React from 'react';
import {
  Compass,
  BookOpen,
  Target,
  Music,
  Sliders,
  Trophy,
  Mic,
  Activity,
  Flame,
  ArrowRight,
  Sparkles,
  Guitar,
  FolderUp,
} from 'lucide-react';
import { ScreenName, PlayerRank } from '../types';
import { sfx } from '../audio/sfxPlayer';

interface MainMenuProps {
  onNavigate: (screen: ScreenName) => void;
  onOpenTuner: () => void;
  onOpenFretboard: () => void;
  onOpenCalibration: () => void;
  onOpenImport: () => void;
  playerRank: PlayerRank;
  isMicActive: boolean;
  onToggleMic: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onNavigate,
  onOpenTuner,
  onOpenFretboard,
  onOpenCalibration,
  onOpenImport,
  playerRank,
  isMicActive,
  onToggleMic,
}) => {
  const handleNav = (screen: ScreenName) => {
    sfx.play('click_subtle');
    onNavigate(screen);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Baner powitalny z poziomem gracza */}
      <div className="w-full mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Guitar className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Witaj w <span className="text-amber-400">GRYF</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PL v2.0
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Prawdziwa gitara podłączona bezpośrednio do przeglądarki z zerowym opóźnieniem.
            </p>
          </div>
        </div>

        {/* Status Poziomu i Mikrofonu */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <div className="px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-right">
            <div className="text-xs text-zinc-400 font-mono">POZIOM {playerRank.level}</div>
            <div className="text-sm font-bold text-amber-400">{playerRank.title}</div>
            <div className="w-32 h-1.5 rounded-full bg-zinc-800 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${(playerRank.xpCurrent / playerRank.xpNext) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={onToggleMic}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
              isMicActive
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                : 'bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/30'
            }`}
          >
            <Mic className={`w-4 h-4 ${isMicActive ? 'animate-pulse' : ''}`} />
            {isMicActive ? 'Mikrofon Aktywny' : 'Włącz Mikrofon'}
          </button>
        </div>
      </div>

      {/* Siatka 6 głównych modułów */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Karta 1: Trasa Koncertowa */}
        <div
          onClick={() => handleNav('tour')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-zinc-500 group-hover:text-amber-400 flex items-center gap-1">
              8 Rozdziałów <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
            Trasa Koncertowa
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Kampania kariery muzycznej od piwnicy i garażu po scenę festiwalu Pol'and'Rock pod okiem menadżerki Magdy.
          </p>
        </div>

        {/* Karta 2: Lekcje i Skale */}
        <div
          onClick={() => {
            sfx.play('click_subtle');
            onOpenFretboard();
          }}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-zinc-500 group-hover:text-sky-400 flex items-center gap-1">
              Gryf i Teoria <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">
            Lekcje i Skale
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Wizualny gryf w 24 progach, pentatoniki, skale modalne (dorycka, miksolidyjska), interwały oraz diagramy akordów.
          </p>
        </div>

        {/* Karta 3: Trening i Autostrada */}
        <div
          onClick={() => handleNav('play')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-zinc-500 group-hover:text-emerald-400 flex items-center gap-1">
              Autostrada Nut <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
            Trening i Riffy
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Dynamiczna autostrada nut 60/120 FPS. Ćwicz tempo, precyzję uderzenia kostką, arpeggia oraz legato bez presji.
          </p>
        </div>

        {/* Karta 4: Biblioteka Piosenek */}
        <div
          onClick={() => handleNav('songs')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-zinc-500 group-hover:text-purple-400 flex items-center gap-1">
              571 Piosenek <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
            Biblioteka Utworów
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Pełny katalog klasyków rocka, metalu i punku (Metallica, AC/DC, Nirvana, Hendrix) z synchronizacją wideo YouTube.
          </p>
        </div>

        {/* Karta 5: Brzmienie i Sprzęt */}
        <div
          onClick={() => handleNav('gear')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-zinc-500 group-hover:text-orange-400 flex items-center gap-1">
              Wzmacniacz DSP <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
            Brzmienie i Sprzęt
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Wirtualny wzmacniacz lampowy, filtr brumienia sieciowego 50Hz, bramka szumów, chorus, taśmowy delay oraz limiter.
          </p>
        </div>

        {/* Karta 6: Kariera i Osiągnięcia */}
        <div
          onClick={() => handleNav('profile')}
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-zinc-500 group-hover:text-pink-400 flex items-center gap-1">
              122 Odznaki <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">
            Kariera i Odznaki
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Sprawdź odblokowane osiągnięcia, procent celności trafień, historię sesji i awansuj ku tytułowi Żywej Legendy.
          </p>
        </div>
      </div>

      {/* Szybkie narzędzia w stopce */}
      <div className="w-full flex flex-wrap items-center justify-center gap-4 py-4 px-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
        <button
          onClick={onOpenTuner}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          Tuner Chromatyczny
        </button>

        <button
          onClick={onOpenFretboard}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
        >
          <Guitar className="w-4 h-4 text-sky-400" />
          Interaktywny Gryf
        </button>

        <button
          onClick={onOpenCalibration}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
        >
          <Flame className="w-4 h-4 text-amber-400" />
          Kalibracja Opóźnienia
        </button>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
        >
          <FolderUp className="w-4 h-4 text-purple-400" />
          Wgraj Plik Tabulatury (.gp / .gpx)
        </button>
      </div>
    </div>
  );
};
