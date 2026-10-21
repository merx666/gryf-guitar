import React, { useRef, useEffect } from 'react';
import { ScreenName, PlayerRank, PitchDetectionResult, UserProfile } from '../types';
import { Sliders, Music, Award, Flame, Sparkles, Volume2, User, Crown, LogIn } from 'lucide-react';
import { sfx } from '../audio/sfxPlayer';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { getRankTitle } from '../data/badgesData';

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
  userProfile?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenProUpgrade?: () => void;
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
  userProfile,
  onOpenAuth,
  onOpenProUpgrade,
}) => {
  const { t, currentLanguageInfo } = useTranslation();
  const isMic = isMicActive ?? detectionEnabled ?? false;
  const toggle = onToggleMic ?? onToggleDetection ?? (() => {});
  const activeRank =
    playerRank ??
    rank ?? {
      level: 1,
      title: 'Gitarzysta Sypialniany',
      xpCurrent: 0,
      xpNext: 100,
      starsTotal: 201,
      starsEarned: 0,
      badgesEarned: 0,
      badgesTotal: 122,
    };
  const pitch = detectedPitch ?? currentPitch ?? null;
  const localizedRankTitle = getRankTitle(activeRank.level, t);

  // Animacja canvasu fali dźwiękowej przy logo
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2.5;

      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#ff8a1e');
      grad.addColorStop(1, '#e0392b');
      ctx.strokeStyle = grad;

      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 3) {
        const freq = isMic ? 0.15 : 0.08;
        const amp = isMic && pitch?.detected ? 12 : 5;
        const y = canvas.height / 2 + Math.sin(x * freq + frame * 0.08) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      frame++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isMic, pitch]);

  return (
    <header className="w-full bg-[#0b0907]/95 backdrop-blur-md border-b border-[#f2ead821] px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 select-none font-['Barlow']">
      {/* Lewa strona: Logo i animacja fali dźwiękowej */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => {
            sfx.play('select');
            onNavigate('menu');
          }}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
        >
          {/* Ikona logo z gradientem */}
          <div className="w-9 h-9 rounded-xl bg-[#14110e] border border-[#f2ead821] flex items-center justify-center p-1 shadow-md group-hover:border-[#e0392b] transition-colors overflow-hidden">
            <img src={`${import.meta.env.BASE_URL}logo-icon.svg`} alt="Gryf" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wider text-[#f2ead8] group-hover:text-white transition-colors">
                GRYF
              </span>
              <span className="text-[10px] font-['Barlow_Condensed'] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#e0392b22] text-[#e0392b] border border-[#e0392b44]">
                {currentLanguageInfo.code.toUpperCase()}
              </span>
            </div>
            {/* Animowana miniatura fali dźwiękowej */}
            <canvas ref={canvasRef} width={80} height={14} className="opacity-80 block" />
          </div>
        </button>

        {/* Przełącznik wykrywania dźwięku (Menu Detect Switch z oryginalnego projektu) */}
        <button
          onClick={() => {
            sfx.play(isMic ? 'toggleOff' : 'toggleOn');
            toggle();
          }}
          role="switch"
          aria-checked={isMic}
          className={`flex items-center gap-3 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
            isMic
              ? 'bg-[#15110d] border-emerald-500/50 shadow-sm shadow-emerald-950/40'
              : 'bg-[#110e0b] border-[#f2ead821] hover:border-[#f2ead84d]'
          }`}
          title={isMic ? t('header.micTooltipOn') : t('header.micTooltipOff')}
        >
          <div className="text-left">
            <span className="text-[11px] font-bold text-[#f2ead8] block leading-none font-['Barlow_Condensed'] uppercase tracking-wider">
              {t('header.soundDetection')}
            </span>
            <span className="text-[10px] text-[#f2ead870] block leading-none mt-0.5 font-['Barlow']">
              {isMic ? t('header.micOnDesc') : t('header.micOffDesc')}
            </span>
          </div>

          {/* Przełącznik suwakowy */}
          <div
            className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
              isMic ? 'bg-emerald-600 justify-end' : 'bg-[#27231e] justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </div>
        </button>

        {/* Pigułka nastrojonego dźwięku na żywo */}
        {isMic && pitch?.detected && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#e2b04a15] border border-[#e2b04a44] font-mono text-xs font-bold text-[#e2b04a] animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            <span>
              {pitch.noteName}
              {pitch.octave}
            </span>
            <span className={`text-[10px] ${Math.abs(pitch.cents) <= 4 ? 'text-emerald-400' : 'text-[#f2ead870]'}`}>
              {pitch.cents > 0 ? `+${pitch.cents}` : pitch.cents}¢
            </span>
          </div>
        )}
      </div>

      {/* Prawa strona: Studio AI PRO, Skróty, Konto i Odznaka Profilu */}
      <div className="flex items-center gap-2.5">
        {/* Przycisk Studia AI PRO */}
        <button
          onClick={() => {
            sfx.play('select');
            onNavigate('aistudio');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            currentScreen === 'aistudio'
              ? 'bg-[#e2b04a] text-black border-[#e2b04a] shadow-lg shadow-amber-950/40'
              : 'bg-[#18130d] text-[#e2b04a] border-[#e2b04a55] hover:bg-[#e2b04a22]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('header.aiStudio')}</span>
        </button>

        {/* Status Gryf PRO lub Przycisk Ulepsz */}
        {userProfile?.tier === 'pro' || userProfile?.tier === 'lifetime' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#e2b04a]/20 border border-[#e2b04a]/50 text-[#e2b04a] text-[11px] font-['Barlow_Condensed'] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(226,176,74,0.3)]">
            <Crown className="w-3.5 h-3.5 fill-[#e2b04a]" />
            <span>{userProfile.tier === 'lifetime' ? t('header.founder') : t('header.pro')}</span>
          </div>
        ) : (
          <button
            onClick={() => {
              sfx.play('select');
              if (onOpenProUpgrade) onOpenProUpgrade();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#e0392b] hover:bg-[#c93226] text-white text-[11px] font-['Barlow_Condensed'] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(224,57,43,0.4)] animate-pulse"
          >
            <Crown className="w-3 h-3 fill-white" />
            <span>{t('header.upgradePro')}</span>
          </button>
        )}

        {/* Stroik */}
        <button
          onClick={() => {
            sfx.play('select');
            if (onOpenTuner) onOpenTuner();
            else onNavigate('tuner');
          }}
          className="px-2.5 py-1.5 rounded-sm bg-[#14110e] border border-[#f2ead821] hover:border-[#f2ead84d] text-xs font-bold text-[#f2ead8] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[#e0392b]" />
          <span className="hidden md:inline">{t('header.tuner')}</span>
        </button>

        {/* Gryf */}
        <button
          onClick={() => {
            sfx.play('select');
            if (onOpenFretboard) onOpenFretboard();
            else onNavigate('fretboard');
          }}
          className="px-2.5 py-1.5 rounded-sm bg-[#14110e] border border-[#f2ead821] hover:border-[#f2ead84d] text-xs font-bold text-[#f2ead8] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Music className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">{t('header.fretboard')}</span>
        </button>

        {/* Przełącznik języka (Global i18n Selector) */}
        <LanguageSelector />

        {/* Logowanie / Avatar Użytkownika */}
        {userProfile ? (
          <div
            onClick={() => {
              sfx.play('select');
              if (onOpenAuth) onOpenAuth();
            }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-sm bg-[#181410] border border-[#f2ead821] hover:border-[#e2b04a] transition-all cursor-pointer"
            title={`Logged in as ${userProfile.name} (${userProfile.provider})`}
          >
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-5 h-5 rounded-full object-cover border border-[#e2b04a]"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#e2b04a]/20 border border-[#e2b04a] flex items-center justify-center text-[10px] font-bold text-[#e2b04a]">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#f2ead8] max-w-[90px] truncate hidden sm:inline">
              {userProfile.name}
            </span>
          </div>
        ) : (
          <button
            onClick={() => {
              sfx.play('select');
              if (onOpenAuth) onOpenAuth();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#1a1612] hover:bg-[#241e18] border border-[#f2ead8]/20 hover:border-[#f2ead8]/50 text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#f2ead8] transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-[#e2b04a]" />
            <span>{t('header.login')}</span>
          </button>
        )}

        {/* Wizytówka Rangi i Kariery */}
        <button
          onClick={() => {
            sfx.play('confirm');
            onNavigate('profile');
          }}
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-sm bg-[#14110e] border border-[#f2ead821] hover:border-[#f2ead84d] transition-colors cursor-pointer text-left"
        >
          <div className="px-2 py-0.5 rounded-sm bg-[#251e18] border border-[#f2ead821] text-center font-['Barlow_Condensed'] font-black text-xs text-[#e2b04a]">
            {t('header.level')} {activeRank.level}
          </div>
          <div className="hidden lg:block">
            <div className="text-xs font-bold text-[#f2ead8] font-['Barlow_Condensed'] uppercase tracking-wider leading-none">
              {localizedRankTitle}
            </div>
            <div className="text-[10px] text-[#f2ead870] flex items-center gap-1.5 mt-0.5 leading-none">
              <span className="text-[#e2b04a]">★ {activeRank.starsEarned}/{activeRank.starsTotal}</span>
              <span>•</span>
              <span>{activeRank.badgesEarned} {t('header.badges')}</span>
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
