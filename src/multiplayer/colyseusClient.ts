import { Client, Room } from 'colyseus.js';
import { DuelRoomState, PlayerDuelState, DuelAttackType, DuelAttack } from './types';

class MultiplayerManager {
  private client: Client | null = null;
  private currentRoom: Room<any> | null = null;
  private isConnected: boolean = false;
  private isMockMode: boolean = false;

  // Stan lokalny pokoju (dla trybu mock/demo lub odzwierciedlenia serwera)
  private mockState: DuelRoomState | null = null;
  private stateListeners: Array<(state: DuelRoomState) => void> = [];
  private attackListeners: Array<(attack: DuelAttack) => void> = [];

  constructor() {
    // Domyślny adres serwera Colyseus (lokalnie lub zmienna środowiskowa)
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    const serverUrl = env?.VITE_COLYSEUS_URL || 'ws://localhost:2567';
    try {
      this.client = new Client(serverUrl);
    } catch (e) {
      console.warn('[Multiplayer] Błąd inicjalizacji klienta Colyseus, przełączam w tryb symulacji:', e);
      this.isMockMode = true;
    }
  }

  /**
   * Dołączenie do pojedynku gitarowego 1v1 (lub stworzenie nowego pokoju)
   */
  async joinDuelRoom(songId: string, username: string): Promise<DuelRoomState> {
    try {
      if (!this.isMockMode && this.client) {
        // Próba połączenia z prawdziwym serwerem Colyseus
        this.currentRoom = await this.client.joinOrCreate('guitar_duel', { songId, username });
        this.isConnected = true;

        this.currentRoom.onStateChange((state: any) => {
          this.notifyStateListeners(state);
        });

        this.currentRoom.onMessage('attack_received', (attack: DuelAttack) => {
          this.notifyAttackListeners(attack);
        });

        return this.currentRoom.state as DuelRoomState;
      }
    } catch (err) {
      console.warn('[Multiplayer] Brak aktywnego backendu Colyseus. Aktywacja trybu symulacji (Ghost/Bot Duel):', err);
      this.isMockMode = true;
    }

    // Tryb symulacji (Pojedynek z wirtualnym rywalem "Slash_AI" lub duchem)
    const localId = 'player_local_' + Math.floor(Math.random() * 1000);
    const opponentId = 'rival_mati_666';

    this.mockState = {
      roomId: 'mock_room_stage_1',
      songId,
      status: 'playing',
      countdownSec: 0,
      songTime: 0,
      players: {
        [localId]: {
          sessionId: localId,
          username: username || 'Ty (Gitarzysta)',
          score: 0,
          streak: 0,
          multiplier: 1,
          accuracy: 100,
          lastHitQuality: null,
          lastHitTime: 0,
          activeAttacks: [],
          isReady: true,
        },
        [opponentId]: {
          sessionId: opponentId,
          username: 'Mati (Rhythm Slayer)',
          score: 120,
          streak: 4,
          multiplier: 1,
          accuracy: 94,
          lastHitQuality: 'perfect',
          lastHitTime: Date.now(),
          activeAttacks: [],
          isReady: true,
        },
      },
      winnerSessionId: null,
    };

    this.startMockOpponentSimulation(opponentId);
    return this.mockState;
  }

  /**
   * Symulacja gry rywala w trybie offline/mock
   */
  private startMockOpponentSimulation(opponentId: string) {
    const interval = setInterval(() => {
      if (!this.mockState || this.mockState.status !== 'playing') {
        clearInterval(interval);
        return;
      }
      const opp = this.mockState.players[opponentId];
      if (!opp) return;

      const hitRoll = Math.random();
      if (hitRoll > 0.12) {
        // Trafienie rywala
        const isPerfect = hitRoll > 0.45;
        opp.score += (isPerfect ? 100 : 60) * opp.multiplier;
        opp.streak += 1;
        opp.multiplier = opp.streak >= 30 ? 4 : opp.streak >= 20 ? 3 : opp.streak >= 10 ? 2 : 1;
        opp.lastHitQuality = isPerfect ? 'perfect' : 'good';
      } else {
        // Pudło rywala
        opp.streak = 0;
        opp.multiplier = 1;
        opp.lastHitQuality = 'miss';
      }
      opp.lastHitTime = Date.now();

      this.notifyStateListeners({ ...this.mockState });
    }, 800);
  }

  /**
   * Wysłanie trafienia nuty do pokoju
   */
  sendHit(quality: 'perfect' | 'good' | 'miss', score: number, streak: number, accuracy: number) {
    if (this.currentRoom && this.isConnected) {
      this.currentRoom.send('hit', { quality, score, streak, accuracy });
    } else if (this.mockState) {
      const localPlayer = Object.values(this.mockState.players).find((p) => p.sessionId.startsWith('player_local'));
      if (localPlayer) {
        localPlayer.score = score;
        localPlayer.streak = streak;
        localPlayer.accuracy = accuracy;
        localPlayer.lastHitQuality = quality;
        localPlayer.lastHitTime = Date.now();
        this.notifyStateListeners({ ...this.mockState });
      }
    }
  }

  /**
   * Wysłanie ataku w pojedynku (np. zerwanie struny rywala po serii x4)
   */
  sendAttack(attackType: DuelAttackType) {
    if (this.currentRoom && this.isConnected) {
      this.currentRoom.send('attack', { attackType });
    } else if (this.mockState) {
      // Mock ataku na rywala
      const attack: DuelAttack = {
        id: 'atk_' + Date.now(),
        type: attackType,
        senderSessionId: 'player_local',
        senderName: 'Gracz',
        durationMs: 3500,
        timestamp: Date.now(),
      };
      this.notifyAttackListeners(attack);
    }
  }

  onStateChange(cb: (state: DuelRoomState) => void) {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== cb);
    };
  }

  onAttackReceived(cb: (attack: DuelAttack) => void) {
    this.attackListeners.push(cb);
    return () => {
      this.attackListeners = this.attackListeners.filter((l) => l !== cb);
    };
  }

  private notifyStateListeners(state: DuelRoomState) {
    this.stateListeners.forEach((cb) => cb(state));
  }

  private notifyAttackListeners(attack: DuelAttack) {
    this.attackListeners.forEach((cb) => cb(attack));
  }

  leaveRoom() {
    if (this.currentRoom) {
      this.currentRoom.leave();
      this.currentRoom = null;
    }
    this.mockState = null;
    this.isConnected = false;
  }
}

export const multiplayer = new MultiplayerManager();
