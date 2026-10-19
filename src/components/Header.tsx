import React from 'react';
import { ScreenName, PlayerRank, PitchDetectionResult } from '../types';
import { Guitar, Mic, MicOff, Volume2, Sliders, Music, Award, Flame } from 'lucide-react';
import { sfx } from '../audio/sfxPlayer';

export interface HeaderProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  detectionEnabled?: boolean;
  onToggleDetection?: () => void;
  rank?: PlayerRank;
  currentPitch?: PitchDetectionResult | null;
  onOpenTuner?: () => void;
  onOpenFretboard?: () => void;
  onOpenCalibration?: () => void;
  isMicActive?: boolean;
  onToggleMic?: () => void;
  playerRank?: PlayerRank;
  detectedPitch?: PitchDetectionResult | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  detectionEnabled,
  onToggleDetection,
  rank,
  currentPitch,
  onOpenTuner,
  onOpenFretboard,
  onOpenCalibration,
  isMicActive,
  onToggleMic,
  playerRank,
  detectedPitch,
}) => {
  const isMic = isMicActive ?? detectionEnabled ?? false;
  const toggle = onToggleMic ?? onToggleDetection ?? (() => {});
  const activeRank =
    playerRank ??
    rank ?? {
      level: 1,
      title: 'Gitarzysta Sypialniany',
      xpCurrent: 0,
      xpNext: 100,
      starsTotal: 100,
      starsEarned: 0,
      badgesEarned: 0,
      badgesTotal: 122,
    };
  const pitch = detectedPitch ?? currentPitch ?? null;

  return (
    <header className="w-full bg-[#141210]/95 backdrop-blur-md border-b border-[#2d2925] px-4 py-3 flex items-center justify-between sticky top-0 z-40 select-none shadow-lg">
      {/* Logo & Nazwa */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => {
            sfx.play('select');
            onNavigate('menu');
          }}
          className="flex items-center space-x-2 text-left group focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-1"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-950/40 text-black font-extrabold text-xl group-hover:scale-105 transition-transform duration-200">
            <Guitar className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-['Righteous'] text-2xl tracking-wide bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 bg-clip-text text-transparent">
              GRYF
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              Gitara PL
            </span>
          </div>
        </button>
      </div>

      {/* Środkowe wskaźniki: Wykrywanie dźwięku & Feedback na żywo */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => {
            sfx.play(isMic ? 'toggleOff' : 'toggleOn');
            toggle();
          }}
          title={isMic ? 'Wykrywanie aktywne: mikrofon słucha gitary' : 'Włącz mikrofon'}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 cursor-pointer ${
            isMic
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          {isMic ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-0.5" />
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">Mikrofon Aktywny</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-zinc-500" />
              <span>Mikrofon Wyłączony</span>
            </>
          )}
        </button>

        {isMic && pitch?.detected && (
          <div className="flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-300 animate-pulse">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {pitch.noteName}
              {pitch.octave}
            </span>
            <span
              className={`text-[10px] ${
                Math.abs(pitch.cents) < 5 ? 'text-emerald-400 font-extrabold' : 'text-zinc-400'
              }`}
            >
              {pitch.cents > 0 ? `+${pitch.cents}` : pitch.cents}¢
            </span>
          </div>
        )}
      </div>

      {/* Prawa strona: Szybkie Narzędzia, Ranga & Profil */}
      <div className="flex items-center space-x-2">
        {/* Szybki przycisk Stroika */}
        <button
          onClick={() => {
            sfx.play('select');
            if (onOpenTuner) onOpenTuner();
            else onNavigate('tuner');
          }}
          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer bg-[#1e1b18] hover:bg-[#282420] text-zinc-300 border-[#38332d]"
          title="Otwórz precyzyjny stroik chromatyczny"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Stroik</span>
        </button>

        {/* Szybki przycisk Wirtualnego Gryfu */}
        <button
          onClick={() => {
            sfx.play('select');
            if (onOpenFretboard) onOpenFretboard();
            else onNavigate('fretboard');
          }}
          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer bg-[#1e1b18] hover:bg-[#282420] text-zinc-300 border-[#38332d]"
          title="Otwórz wirtualny gryf i eksplorator skal"
        >
          <Music className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Gryf & Skale</span>
        </button>

        {/* Szybki przycisk Kalibracji */}
        <button
          onClick={() => {
            sfx.play('select');
            if (onOpenCalibration) onOpenCalibration();
            else onNavigate('calibration');
          }}
          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer bg-[#1e1b18] hover:bg-[#282420] text-zinc-300 border-[#38332d]"
          title="Kalibracja opóźnienia i latencji"
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden lg:inline">Opóźnienie</span>
        </button>

        {/* Status Poziomu i Rangi */}
        <button
          onClick={() => {
            sfx.play('confirm');
            onNavigate('profile');
          }}
          className="flex items-center space-x-2 pl-2 pr-3 py-1 rounded-full bg-[#1b1916] hover:bg-[#25221e] border border-[#332f2a] transition-colors cursor-pointer text-left"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-xs font-black text-black">
            {activeRank.level}
          </div>
          <div className="hidden sm:block">
            <div className="text-[11px] font-bold text-zinc-200 leading-none">{activeRank.title}</div>
            <div className="text-[10px] text-amber-400 flex items-center space-x-1 leading-none mt-1">
              <span>
                ★ {activeRank.starsEarned}/{activeRank.starsTotal}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{activeRank.badgesEarned} odznak</span>
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
