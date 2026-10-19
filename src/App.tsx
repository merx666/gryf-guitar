import React, { useState, useEffect } from 'react';
import { ScreenName, PlayerRank, PitchDetectionResult, TourSong, NoteHit } from './types';
import { PLAYER_RANKS, getRankTitle } from './data/badgesData';
import { audio } from './audio/audioEngine';
import { sfx } from './audio/sfxPlayer';

// Komponenty
import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { TourView } from './components/TourView';
import { SongsView } from './components/SongsView';
import { GearView } from './components/GearView';
import { ProfileView } from './components/ProfileView';
import { HighwayView } from './components/HighwayView';

// Modale narzędziowe
import { TunerModal } from './components/TunerModal';
import { FretboardModal } from './components/FretboardModal';
import { LatencyCalibrationModal } from './components/LatencyCalibrationModal';
import { TabImportModal } from './components/TabImportModal';

export const App: React.FC = () => {
  // Nawigacja
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('menu');

  // Modale
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [isFretboardOpen, setIsFretboardOpen] = useState(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Audio i mikrofon
  const [isMicActive, setIsMicActive] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState<PitchDetectionResult | null>(null);

  // Wybrana piosenka do gry
  const [selectedSong, setSelectedSong] = useState<TourSong | null>(null);
  const [customSongNotes, setCustomSongNotes] = useState<NoteHit[] | null>(null);

  // Progresja gracza (zapisywana w localStorage)
  const [playerRank, setPlayerRank] = useState<PlayerRank>(() => {
    const saved = localStorage.getItem('gryf_player_rank');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      level: 1,
      title: 'Gitarzysta Sypialniany',
      xpCurrent: 120,
      xpNext: 500,
      starsTotal: 335,
      starsEarned: 12,
      badgesEarned: 3,
      badgesTotal: 122,
    };
  });

  const [earnedStars, setEarnedStars] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('gryf_earned_stars');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      't1-s1': 4,
      't1-s2': 3,
      't1-s3': 5,
    };
  });

  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('gryf_unlocked_badges');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['b_first_riff', 'b_fretboard_explorer', 'b_warmup_master'];
  });

  // Zapisywanie postępów w pamięci lokalnej
  useEffect(() => {
    localStorage.setItem('gryf_player_rank', JSON.stringify(playerRank));
  }, [playerRank]);

  useEffect(() => {
    localStorage.setItem('gryf_earned_stars', JSON.stringify(earnedStars));
  }, [earnedStars]);

  useEffect(() => {
    localStorage.setItem('gryf_unlocked_badges', JSON.stringify(unlockedBadgeIds));
  }, [unlockedBadgeIds]);

  // Nasłuchiwanie detekcji dźwięku z audio engine
  useEffect(() => {
    const unsubscribe = audio.onPitch((result) => {
      setDetectedPitch(result);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Przełączanie mikrofonu
  const toggleMic = async () => {
    if (isMicActive) {
      audio.stopMicrophone();
      setIsMicActive(false);
      sfx.play('click_subtle');
    } else {
      const success = await audio.startMicrophone();
      if (success) {
        setIsMicActive(true);
        sfx.play('hit_perfect');
      } else {
        alert('Nie udało się uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.');
      }
    }
  };

  // Uruchomienie utworu z trasy lub katalogu
  const handleSelectSong = (song: TourSong) => {
    setSelectedSong(song);
    setCustomSongNotes(null);
    setCurrentScreen('play');
  };

  // Uruchomienie własnego utworu z pliku .gp / .json
  const handleLoadCustomSong = (title: string, artist: string, notes: NoteHit[]) => {
    setSelectedSong({
      id: 'custom-' + Date.now(),
      chapter: 1,
      order: 999,
      title,
      artist,
      genre: 'Własna Tabulatura',
      year: 2026,
      about: 'Własny plik zaimportowany z Guitar Pro.',
      tempo: 120,
      tuning: 'Standard E',
      teaches: ['Własna kompozycja'],
      uses: ['Tabulatura'],
      notesCount: notes.length,
      durationMs: 180000,
      file: 'custom.json',
    });
    setCustomSongNotes(notes);
    setCurrentScreen('play');
  };

  // Zakończenie utworu i przyznanie punktów / gwiazdek
  const handleSongComplete = (score: number, accuracy: number, starsEarned: number) => {
    if (selectedSong) {
      // Aktualizacja gwiazdek dla utworu
      const prevStars = earnedStars[selectedSong.id] || 0;
      if (starsEarned > prevStars) {
        setEarnedStars((prev) => ({
          ...prev,
          [selectedSong.id]: starsEarned,
        }));
      }

      // Aktualizacja XP i poziomu gracza
      const gainedXP = Math.round(score / 5) + starsEarned * 50;
      setPlayerRank((prev) => {
        let newXp = prev.xpCurrent + gainedXP;
        let newLvl = prev.level;
        let nextThreshold = prev.xpNext;
        let newTitle = prev.title;

        if (newXp >= nextThreshold && newLvl < 50) {
          newLvl += 1;
          newXp -= nextThreshold;
          nextThreshold = Math.round(nextThreshold * 1.3);
          newTitle = getRankTitle(newLvl);
        }

        return {
          ...prev,
          level: newLvl,
          title: newTitle,
          xpCurrent: newXp,
          xpNext: nextThreshold,
          starsEarned: Object.values(earnedStars).reduce((a, b) => a + b, 0),
        };
      });
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Pasek górny (ukryty podczas pełnoekranowej gry) */}
      {currentScreen !== 'play' && (
        <Header
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            sfx.play('click_subtle');
            setCurrentScreen(screen);
          }}
          onOpenTuner={() => setIsTunerOpen(true)}
          onOpenFretboard={() => setIsFretboardOpen(true)}
          onOpenCalibration={() => setIsCalibrationOpen(true)}
          detectedPitch={detectedPitch}
          isMicActive={isMicActive}
          onToggleMic={toggleMic}
          playerRank={playerRank}
        />
      )}

      {/* Widoki Główne */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentScreen === 'menu' && (
          <MainMenu
            onNavigate={(screen) => setCurrentScreen(screen)}
            onOpenTuner={() => setIsTunerOpen(true)}
            onOpenFretboard={() => setIsFretboardOpen(true)}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
            playerRank={playerRank}
            isMicActive={isMicActive}
            onToggleMic={toggleMic}
          />
        )}

        {currentScreen === 'tour' && (
          <TourView
            onBack={() => setCurrentScreen('menu')}
            onSelectSong={handleSelectSong}
            earnedStars={earnedStars}
          />
        )}

        {currentScreen === 'songs' && (
          <SongsView
            onBack={() => setCurrentScreen('menu')}
            onSelectSong={handleSelectSong}
            onOpenImport={() => setIsImportOpen(true)}
            earnedStars={earnedStars}
          />
        )}

        {currentScreen === 'gear' && (
          <GearView onBack={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'profile' && (
          <ProfileView
            onBack={() => setCurrentScreen('menu')}
            playerRank={playerRank}
            unlockedBadgeIds={unlockedBadgeIds}
          />
        )}

        {currentScreen === 'play' && (
          <HighwayView
            songTitle={selectedSong?.title || 'Riff Treningowy'}
            artist={selectedSong?.artist || 'Ćwiczenie'}
            tempo={selectedSong?.tempo || 120}
            notes={customSongNotes || undefined}
            onExit={() => setCurrentScreen('menu')}
            onSongComplete={handleSongComplete}
          />
        )}
      </main>

      {/* Modale Narzędziowe */}
      {isTunerOpen && (
        <TunerModal
          currentPitch={
            detectedPitch || {
              detected: false,
              frequency: 0,
              midiNote: 0,
              noteName: '-',
              octave: 0,
              cents: 0,
              clarity: 0,
            }
          }
          onClose={() => setIsTunerOpen(false)}
        />
      )}

      {isFretboardOpen && (
        <FretboardModal onClose={() => setIsFretboardOpen(false)} />
      )}

      {isCalibrationOpen && (
        <LatencyCalibrationModal
          currentOffsetMs={audio.settings.latencyOffsetMs}
          onSaveOffset={(offset) => {
            audio.settings.latencyOffsetMs = offset;
          }}
          onClose={() => setIsCalibrationOpen(false)}
          currentPitch={
            detectedPitch || {
              detected: false,
              frequency: 0,
              midiNote: 0,
              noteName: '-',
              octave: 0,
              cents: 0,
              clarity: 0,
            }
          }
        />
      )}

      <TabImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onLoadCustomSong={handleLoadCustomSong}
      />
    </div>
  );
};

export default App;
