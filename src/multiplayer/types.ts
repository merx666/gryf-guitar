export type DuelAttackType =
  | 'AMP_OVERLOAD'   // Wzmacniacz generuje sprzężenie audio i wstrząsy ekranu
  | 'STRING_SNAP'    // Chwilowe 'zerwanie struny' – gracz musi szybko uderzyć strunę by ją naciągnąć
  | 'NOTE_BLUR'      // Rozmycie neonowych nut na 3 sekundy
  | 'TEMPO_SURGE';   // Przyspieszenie autostrady o +30% na 4 takty

export interface DuelAttack {
  id: string;
  type: DuelAttackType;
  senderSessionId: string;
  senderName: string;
  durationMs: number;
  timestamp: number;
}

export interface PlayerDuelState {
  sessionId: string;
  username: string;
  score: number;
  streak: number;
  multiplier: number;
  accuracy: number;
  lastHitQuality: 'perfect' | 'good' | 'miss' | null;
  lastHitTime: number;
  activeAttacks: DuelAttack[];
  isReady: boolean;
}

export interface DuelRoomState {
  roomId: string;
  songId: string;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  countdownSec: number;
  songTime: number;
  players: Record<string, PlayerDuelState>;
  winnerSessionId: string | null;
}
