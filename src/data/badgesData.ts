import { Badge, PlayerRank } from '../types';

export const PLAYER_RANKS: [number, string][] = [
  [1, 'Gitarzysta Sypialniany'],
  [3, 'Garażowy Debiutant'],
  [6, 'Bywalec Open Mic'],
  [9, 'Support Sceniczny'],
  [13, 'Gwiazda Klubowa'],
  [17, 'Wyjadacz Tras'],
  [21, 'Gitarzysta Sesyjny'],
  [26, 'Headliner'],
  [32, 'Weteran Aren'],
  [40, 'Mistrz Riffu'],
  [50, 'Żywa Legenda'],
];

export function getRankTitle(level: number): string {
  let title = PLAYER_RANKS[0][1];
  for (const [lvl, name] of PLAYER_RANKS) {
    if (level >= lvl) title = name;
  }
  return title;
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round((150 * Math.pow(level - 1, 1.5)) / 10) * 10;
}

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'plugged-in',
    name: 'Wpięty w Piec',
    desc: 'Ukończ piosenkę z włączonym wykrywaniem dźwięku z gitary.',
    category: 'dedication',
    tier: 'bronze',
    unlocked: true,
    progress: 1.0,
  },
  {
    id: 'first-gig',
    name: 'Pierwszy Koncert',
    desc: 'Zagraj swój pierwszy utwór w Trasie Koncertowej.',
    category: 'tour',
    tier: 'bronze',
    unlocked: true,
    progress: 1.0,
  },
  {
    id: 'clean-strum',
    name: 'Czysty Akord',
    desc: 'Zagraj 50 akordów z rzędu bez ani jednego fałszywego dźwięku.',
    category: 'technique',
    tier: 'silver',
    unlocked: false,
    progress: 0.64,
  },
  {
    id: 'palm-mute-master',
    name: 'Mistrz Tłumienia',
    desc: 'Ukończ utwór z techniką palm muting na poziomie minimum 90% celności.',
    category: 'technique',
    tier: 'silver',
    unlocked: false,
    progress: 0.45,
  },
  {
    id: 'century-streak',
    name: 'Setka w Płomieniach',
    desc: 'Osiągnij serię (streak) 100 trafionych nut z rzędu.',
    category: 'skill',
    tier: 'gold',
    unlocked: false,
    progress: 0.82,
  },
  {
    id: 'solo-shredder',
    name: 'Solowy Wirtuoz',
    desc: 'Zagraj trudną partię solową z podciągnięciami powyżej 12. progu.',
    category: 'skill',
    tier: 'gold',
    unlocked: false,
    progress: 0.3,
  },
  {
    id: 'guitar-god',
    name: 'Bóstwo Gryfu',
    desc: 'Osiągnij 50. poziom kariery i zdobądź wszystkie gwiazdki na trasie.',
    category: 'tour',
    tier: 'platinum',
    unlocked: false,
    progress: 0.12,
  },
  {
    id: 'ear-training',
    name: 'Absolutny Słuch',
    desc: 'Nastroj gitarę z dokładnością do 1 centa przy użyciu wbudowanego stroika.',
    category: 'explore',
    tier: 'bronze',
    unlocked: false,
    progress: 0.0,
  },
];

export const BADGES_LIST: Badge[] = INITIAL_BADGES;
