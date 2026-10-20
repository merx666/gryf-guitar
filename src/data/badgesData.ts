import { Badge } from '../types';
import { TranslationKey } from '../i18n/translations';

export const PLAYER_RANKS_KEYS: [number, TranslationKey, string][] = [
  [1, 'rank.bedroom', 'Gitarzysta Sypialniany'],
  [3, 'rank.garage', 'Garażowy Debiutant'],
  [6, 'rank.openmic', 'Bywalec Open Mic'],
  [9, 'rank.support', 'Support Sceniczny'],
  [13, 'rank.club', 'Gwiazda Klubowa'],
  [17, 'rank.touring', 'Wyjadacz Tras'],
  [21, 'rank.session', 'Gitarzysta Sesyjny'],
  [26, 'rank.headliner', 'Headliner'],
  [32, 'rank.arena', 'Weteran Aren'],
  [40, 'rank.riffmaster', 'Mistrz Riffu'],
  [50, 'rank.legend', 'Żywa Legenda'],
];

export const PLAYER_RANKS: [number, string][] = PLAYER_RANKS_KEYS.map(([lvl, _, name]) => [lvl, name]);

export function getRankTitle(level: number, t?: (key: TranslationKey) => string): string {
  let matchedKey: TranslationKey = PLAYER_RANKS_KEYS[0][1];
  let defaultName = PLAYER_RANKS_KEYS[0][2];

  for (const [lvl, key, name] of PLAYER_RANKS_KEYS) {
    if (level >= lvl) {
      matchedKey = key;
      defaultName = name;
    }
  }

  if (t) {
    return t(matchedKey);
  }
  return defaultName;
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
