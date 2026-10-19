import React, { useState } from 'react';
import { ArrowLeft, Trophy, Award, Star, Flame, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { BADGES_LIST, PLAYER_RANKS } from '../data/badgesData';
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
    <div className="w-full flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Pasek nawigacji górnej */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Menu Główne</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>KARIERA GITAROWA</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-400 font-bold">PROFIL GRACZA</span>
        </div>
      </div>

      {/* Wizytówka gracza i poziom doświadczenia */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-xs">
              Lvl {playerRank.level}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white">{playerRank.title}</h1>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Poziom {playerRank.level} z 50
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Doświadczenie: {playerRank.xpCurrent} / {playerRank.xpNext} XP (brakuje {playerRank.xpNext - playerRank.xpCurrent} XP do kolejnego tytułu)
            </p>

            {/* Pasek postępu poziomu */}
            <div className="w-full md:w-96 h-2.5 rounded-full bg-zinc-800 mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (playerRank.xpCurrent / playerRank.xpNext) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Skrót statystyk */}
        <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <span className="text-lg font-black text-white font-mono">{playerRank.starsEarned}</span>
            <span className="text-[10px] text-zinc-400 block font-medium">Gwiazdki</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-pink-400 mb-1">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-lg font-black text-white font-mono">{unlockedCount} / {BADGES_LIST.length}</span>
            <span className="text-[10px] text-zinc-400 block font-medium">Odznaki</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-lg font-black text-white font-mono">98%</span>
            <span className="text-[10px] text-zinc-400 block font-medium">Śr. Celność</span>
          </div>
        </div>
      </div>

      {/* Filtry odznak */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Gablota Osiągnięć i Odznak
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-normal">
            {unlockedCount} zdobytych
          </span>
        </h2>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
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
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === f.id ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Siatka Odznak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                badge.unlocked
                  ? 'bg-zinc-900 border-zinc-700 hover:border-amber-500/50'
                  : 'bg-zinc-950/60 border-zinc-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      badge.unlocked
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                    }`}
                  >
                    {badge.unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      badge.tier === 'gold'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : badge.tier === 'silver'
                        ? 'bg-slate-300/20 text-slate-200'
                        : 'bg-amber-700/20 text-amber-400'
                    }`}
                  >
                    {badge.tier}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{badge.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{badge.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 capitalize">{badge.category}</span>
                {badge.unlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Zdobyto
                  </span>
                ) : (
                  <span className="text-zinc-500">Zablokowane</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
