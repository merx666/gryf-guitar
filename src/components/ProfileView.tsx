import React, { useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  Award,
  Star,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Shield,
  Crown,
} from 'lucide-react';
import { BADGES_LIST } from '../data/badgesData';
import { PlayerRank, Badge } from '../types';
import { sfx } from '../audio/sfxPlayer';

interface ProfileViewProps {
  onBack: () => void;
  playerRank: PlayerRank;
  unlockedBadgeIds: string[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onBack,
  playerRank,
  unlockedBadgeIds,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const badgesWithStatus: Badge[] = BADGES_LIST.map((b: Badge) => ({
    ...b,
    unlocked: unlockedBadgeIds.includes(b.id),
  }));

  const filteredBadges = badgesWithStatus.filter((b) => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  const unlockedCount = badgesWithStatus.filter((b) => b.unlocked).length;

  return (
    <div className="w-full flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto select-none bg-[#0b0907] text-[#f2ead8]">
      {/* Pasek nawigacji górnej */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#f2ead8]/12">
        <button
          onClick={() => {
            sfx.play('click_subtle');
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#110e0b] hover:bg-[#1a1612] text-[#f2ead8]/80 hover:text-white border border-[#f2ead8]/15 hover:border-[#e0392b] transition-all cursor-pointer font-['Barlow_Condensed'] uppercase tracking-wider text-sm font-bold shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-[#e0392b]" />
          <span>Menu Główne</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#e2b04a]/15 border border-[#e2b04a]/30 text-[#e2b04a] font-['Barlow_Condensed'] uppercase font-bold text-xs tracking-wider">
            <Crown className="w-3.5 h-3.5 text-[#e2b04a]" />
            <span>Konto Aktywne: Gryf PRO</span>
          </div>
        </div>
      </div>

      {/* Backstage VIP Pass / Karta Kariery Gitarzysty */}
      <div className="p-8 rounded-sm bg-[#110e0b] border-2 border-[#f2ead8]/15 shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        {/* Żar sceniczny w rogu */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#e0392b]/10 via-[#e2b04a]/5 to-transparent pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          <div className="relative">
            {/* Herb / Puchar z neonowym obrysem */}
            <div className="w-24 h-24 rounded-sm bg-[#1a1612] border-2 border-[#e2b04a] flex items-center justify-center text-[#e2b04a] shadow-[0_0_30px_rgba(226,176,74,0.3)]">
              <Trophy className="w-12 h-12" />
            </div>
            <div className="absolute -bottom-2.5 -right-2 px-2.5 py-0.5 rounded-sm bg-[#e0392b] text-white font-['Big_Shoulders_Display'] uppercase font-black text-xs shadow-md">
              LVL {playerRank.level}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8]">
                {playerRank.title}
              </h1>
              <span className="px-3 py-0.5 rounded-sm text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold bg-[#e2b04a]/20 text-[#e2b04a] border border-[#e2b04a]/40">
                Poziom {playerRank.level} z 50
              </span>
            </div>
            <p className="text-xs text-[#f2ead8]/60 mt-1.5 font-['Barlow']">
              Doświadczenie sceniczne: <span className="text-[#f2ead8] font-bold">{playerRank.xpCurrent}</span> / {playerRank.xpNext} XP 
              (brakuje {playerRank.xpNext - playerRank.xpCurrent} XP do kolejnego tytułu mistrzowskiego)
            </p>

            {/* Pasek postępu poziomu */}
            <div className="w-full sm:w-96 h-3 rounded-full bg-[#080605] mt-3.5 overflow-hidden border border-[#f2ead8]/12 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#e0392b] via-[#e2b04a] to-[#58c46c] rounded-full transition-all duration-500 shadow-[0_0_10px_#e2b04a]"
                style={{ width: `${Math.min(100, (playerRank.xpCurrent / playerRank.xpNext) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Skrót kluczowych statystyk scenicznych */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto relative z-10">
          <div className="p-4 rounded-sm bg-[#080605] border border-[#f2ead8]/12 text-center min-w-[100px]">
            <div className="flex items-center justify-center gap-1 text-[#e2b04a] mb-1">
              <Star className="w-4 h-4 fill-[#e2b04a]" />
            </div>
            <span className="text-2xl font-black font-['Big_Shoulders_Display'] text-[#f2ead8]">
              {playerRank.starsEarned}
            </span>
            <span className="text-[10px] font-['Barlow_Condensed'] uppercase tracking-wider text-[#f2ead8]/60 block font-bold">
              Gwiazdki
            </span>
          </div>

          <div className="p-4 rounded-sm bg-[#080605] border border-[#f2ead8]/12 text-center min-w-[100px]">
            <div className="flex items-center justify-center gap-1 text-[#e0392b] mb-1">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-2xl font-black font-['Big_Shoulders_Display'] text-[#f2ead8]">
              {unlockedCount} / {BADGES_LIST.length}
            </span>
            <span className="text-[10px] font-['Barlow_Condensed'] uppercase tracking-wider text-[#f2ead8]/60 block font-bold">
              Odznaki
            </span>
          </div>

          <div className="p-4 rounded-sm bg-[#080605] border border-[#f2ead8]/12 text-center min-w-[100px]">
            <div className="flex items-center justify-center gap-1 text-[#58c46c] mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-2xl font-black font-['Big_Shoulders_Display'] text-[#58c46c]">
              98.4%
            </span>
            <span className="text-[10px] font-['Barlow_Condensed'] uppercase tracking-wider text-[#f2ead8]/60 block font-bold">
              Śr. Celność
            </span>
          </div>
        </div>
      </div>

      {/* Filtry odznak */}
      <div className="flex items-center justify-between mb-6 pb-2">
        <h2 className="text-xl font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8] flex items-center gap-3">
          <span>GABLOTA OSIĄGNIĘĆ & ODZNAK</span>
          <span className="text-xs px-2.5 py-0.5 rounded-sm bg-[#110e0b] border border-[#f2ead8]/15 text-[#e2b04a] font-['Barlow_Condensed'] font-bold">
            {unlockedCount} ZDOBYTYCH
          </span>
        </h2>

        <div className="flex items-center gap-1.5 p-1 rounded-sm bg-[#110e0b] border border-[#f2ead8]/12 text-xs">
          {[
            { id: 'all', label: 'Wszystkie' },
            { id: 'unlocked', label: 'Zdobyte' },
            { id: 'locked', label: 'Do zdobycia' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                sfx.play('click_subtle');
                setFilter(f.id as any);
              }}
              className={`px-3.5 py-1.5 rounded-sm font-['Barlow_Condensed'] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                filter === f.id
                  ? 'bg-[#e2b04a] text-[#0b0907] shadow-md'
                  : 'text-[#f2ead8]/60 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Siatka Odznak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
        {filteredBadges.map((badge) => {
          return (
            <div
              key={badge.id}
              className={`p-5 rounded-sm border transition-all flex flex-col justify-between shadow-lg ${
                badge.unlocked
                  ? 'bg-[#110e0b] border-[#f2ead8]/15 hover:border-[#e2b04a]'
                  : 'bg-[#080605] border-[#f2ead8]/8 opacity-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-sm flex items-center justify-center ${
                      badge.unlocked
                        ? 'bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/40 shadow-[0_0_12px_rgba(226,176,74,0.3)]'
                        : 'bg-[#14100c] text-zinc-700 border border-[#f2ead8]/10'
                    }`}
                  >
                    {badge.unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>

                  <span
                    className={`text-[10px] font-['Barlow_Condensed'] uppercase tracking-wider px-2 py-0.5 rounded-sm font-bold ${
                      badge.tier === 'gold'
                        ? 'bg-[#e2b04a]/20 text-[#e2b04a] border border-[#e2b04a]/30'
                        : badge.tier === 'silver'
                        ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                        : 'bg-amber-800/20 text-amber-500 border border-amber-800/30'
                    }`}
                  >
                    {badge.tier}
                  </span>
                </div>

                <h3 className="text-base font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8] mb-1">
                  {badge.name}
                </h3>
                <p className="text-xs text-[#f2ead8]/60 leading-relaxed font-['Barlow']">{badge.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f2ead8]/8 flex items-center justify-between text-[11px] font-['Barlow_Condensed'] uppercase tracking-wider font-bold">
                <span className="text-[#f2ead8]/40">{badge.category}</span>
                {badge.unlocked ? (
                  <span className="text-[#58c46c] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Zdobyto
                  </span>
                ) : (
                  <span className="text-[#f2ead8]/30">Zablokowane</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
