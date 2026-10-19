import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  UploadCloud,
  Video,
  Music,
  Sliders,
  Play,
  Pause,
  Download,
  CheckCircle2,
  Lock,
  Layers,
  Wand2,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { NoteHit, AiTranscriptionResult, TabOnlineMatch, TourSong } from '../types';
import { sfx } from '../audio/sfxPlayer';

interface AiTabStudioViewProps {
  onBack: () => void;
  onPlaySong: (title: string, artist: string, notes: NoteHit[], bpm: number) => void;
  initialSong?: TourSong | null;
}

export const AiTabStudioView: React.FC<AiTabStudioViewProps> = ({ onBack, onPlaySong, initialSong }) => {
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'separating_stems' | 'crawling_tabs' | 'synchronizing' | 'completed'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AiTranscriptionResult | null>(null);

  // Odtwarzanie podglądu audio w studio
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [guitarStemVolume, setGuitarStemVolume] = useState(80);
  const [backingStemVolume, setBackingStemVolume] = useState(60);
  const [guitarSolo, setGuitarSolo] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Symulowane presety demo dla natychmiastowego testowania
  const DEMO_PRESETS = [
    {
      title: "Sweet Child O' Mine (Riff Wstępny)",
      artist: "Guns N' Roses",
      bpm: 125,
      tuning: 'Eb Standard',
      file: 'sweet-child-intro.mp3',
    },
    {
      title: 'Master of Puppets (Główny Riff)',
      artist: 'Metallica',
      bpm: 212,
      tuning: 'Standard E',
      file: 'master-of-puppets.mp3',
    },
    {
      title: 'Sultans of Swing (Solo)',
      artist: 'Dire Straits',
      bpm: 148,
      tuning: 'Standard E',
      file: 'sultans-solo.mp3',
    },
  ];

  // Automatyczny start analizy po przekazaniu utworu z katalogu
  useEffect(() => {
    if (initialSong && status === 'idle' && !analysisResult) {
      startAnalysis(initialSong.title, initialSong.artist, initialSong.tempo);
    }
  }, [initialSong]);

  // Rozpoczęcie procesu konwersji AI
  const startAnalysis = (songTitle: string, artistName: string, bpm = 120) => {
    sfx.play('select');
    setStatus('uploading');
    setProgress(10);
    setCurrentStepText('Wczytywanie pliku audio i weryfikacja pasma akustycznego...');

    setTimeout(() => {
      setStatus('separating_stems');
      setProgress(35);
      setCurrentStepText('Model Demucs v4 AI: Izolacja ścieżki gitary od perkusji, basu i wokalu...');
    }, 1400);

    setTimeout(() => {
      setStatus('crawling_tabs');
      setProgress(65);
      setCurrentStepText('Przeszukiwanie internetowych baz tabulatur (Songsterr / Ultimate-Guitar) i analiza onsettów...');
    }, 2800);

    setTimeout(() => {
      setStatus('synchronizing');
      setProgress(88);
      setCurrentStepText('Automatyczne wyrównywanie nut do ścieżki audio (Dynamic Time Warping 5ms)...');
    }, 4200);

    setTimeout(() => {
      // Wygenerowanie przykładowej zsynchronizowanej ścieżki nut
      const generatedNotes: NoteHit[] = [];
      let t = 1.0;
      for (let i = 0; i < 64; i++) {
        generatedNotes.push({
          string: (i * 2 + 1) % 6,
          fret: ((i * 3) % 12) + (i % 4 === 0 ? 0 : 2),
          time: t,
          duration: 0.35,
        });
        t += 0.35 + (i % 8 === 0 ? 0.3 : 0);
      }

      const match: TabOnlineMatch = {
        source: 'Songsterr',
        version: 'Oficjalna Tabulatura v4 (Lead Guitar)',
        accuracy: 99.2,
        tracks: ['Gitara Prowadząca', 'Gitara Rytmiczna', 'Bas'],
        syncConfidence: 98.7,
      };

      setAnalysisResult({
        id: 'ai-song-' + Date.now(),
        title: songTitle,
        artist: artistName,
        bpm: bpm,
        tuning: 'Standard E',
        audioFileName: file ? file.name : `${songTitle}.mp3`,
        stemsAvailable: true,
        onlineMatchFound: true,
        onlineMatch: match,
        notes: generatedNotes,
        syncPointsCount: generatedNotes.length,
        durationSec: t + 2.0,
      });

      setStatus('completed');
      setProgress(100);
      sfx.play('confirm');
    }, 5500);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      const name = droppedFile.name.replace(/\.[^/.]+$/, '');
      startAnalysis(name, 'Wykonawca Nierozpoznany');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const name = selected.name.replace(/\.[^/.]+$/, '');
      startAnalysis(name, 'Wykonawca Nierozpoznany');
    }
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    startAnalysis('Utwór z YouTube', 'Audio Stream', 124);
  };

  // Odtwarzanie podglądu audio z animacją osi czasu
  useEffect(() => {
    if (isPlayingPreview) {
      timerRef.current = window.setInterval(() => {
        setPlaybackTime((prev) => {
          if (analysisResult && prev >= analysisResult.durationSec) {
            setIsPlayingPreview(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlayingPreview, analysisResult]);

  return (
    <div className="w-full flex-1 flex flex-col p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto select-none font-['Barlow']">
      {/* Pasek nawigacji górnej */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#f2ead821]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14110e] border border-[#f2ead821] hover:border-[#f2ead84d] text-[#f2ead8] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu Główne</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-['Big_Shoulders_Display'] text-3xl md:text-4xl font-black uppercase tracking-wide text-[#f2ead8]">
                Studio AI • Audio do Tabulatury
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#e2b04a22] text-[#e2b04a] border border-[#e2b04a55] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> PRO
              </span>
            </div>
            <p className="text-xs text-[#f2ead8b3] mt-0.5">
              Wrzuć dowolny plik MP3/WAV lub link YouTube. Nasze algorytmy AI wydzielą gitarę, wyszukają taby w sieci i automatycznie zsynchronizują nuty.
            </p>
          </div>
        </div>

        {/* Status konta PRO */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#f2ead870] block">Dostęp</span>
            <span className="text-xs font-bold text-[#e2b04a]">1 z 1 darmowych konwersji</span>
          </div>
          <button
            onClick={() => setShowProModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#e2b04a] to-[#ffaa22] text-[#0b0907] font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 fill-[#0b0907]" />
            Gryf PRO Nielimitowane
          </button>
        </div>
      </div>

      {/* Ekran Początkowy / Upload i Wyszukiwanie */}
      {status === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolumna lewa: Obszar przeciągania MP3 / Wybór pliku */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer p-10 md:p-14 rounded-2xl border-2 border-dashed border-[#f2ead821] hover:border-[#e2b04a] bg-[#110e0b]/80 hover:bg-[#15120e] transition-all flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="w-16 h-16 rounded-2xl bg-[#e2b04a11] border border-[#e2b04a33] flex items-center justify-center text-[#e2b04a] mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="font-['Big_Shoulders_Display'] text-2xl md:text-3xl font-black uppercase text-[#f2ead8] tracking-wider mb-1">
                Przeciągnij i upuść plik audio MP3 / WAV
              </h3>
              <p className="text-xs text-[#f2ead8b3] max-w-md mb-4">
                Obsługiwane formaty: MP3, WAV, FLAC, M4A, OGG do 50 MB. Sztuczna inteligencja natychmiast rozpocznie rozdzielanie ścieżek.
              </p>
              <span className="px-4 py-2 rounded-xl bg-[#1e1b18] border border-[#f2ead821] text-xs font-bold uppercase tracking-wider text-[#f2ead8] group-hover:bg-[#e2b04a] group-hover:text-black transition-colors">
                Wybierz plik z dysku
              </span>
            </div>

            {/* Alternatywa: Wklejenie linku YouTube */}
            <div className="p-6 rounded-2xl bg-[#110e0b] border border-[#f2ead821]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e0392b] mb-3">
                <Video className="w-4 h-4" />
                <span>Lub wklej bezpośredni link YouTube</span>
              </div>
              <form onSubmit={handleYoutubeSubmit} className="flex gap-3">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0b0907] border border-[#f2ead821] text-sm text-white placeholder-[#f2ead833] focus:outline-none focus:border-[#e0392b] transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#e0392b] hover:bg-[#c8281e] text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Pobierz & Analizuj
                </button>
              </form>
            </div>
          </div>

          {/* Kolumna prawa: Szybkie presety demonstracyjne & Informacje */}
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-[#110e0b] border border-[#f2ead821]">
              <h3 className="font-['Big_Shoulders_Display'] text-xl font-black uppercase text-[#f2ead8] tracking-wider mb-2 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-[#e2b04a]" /> Szybkie Utwory Demo
              </h3>
              <p className="text-xs text-[#f2ead8b3] mb-4">
                Przetestuj działanie silnika na gotowych próbkach rockowych klasyków:
              </p>

              <div className="flex flex-col gap-3">
                {DEMO_PRESETS.map((demo) => (
                  <button
                    key={demo.title}
                    onClick={() => startAnalysis(demo.title, demo.artist, demo.bpm)}
                    className="p-3.5 rounded-xl bg-[#16120e] border border-[#f2ead815] hover:border-[#e2b04a66] transition-all flex items-center justify-between text-left group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#e2b04a] transition-colors">
                        {demo.title}
                      </h4>
                      <p className="text-[11px] text-[#f2ead870]">
                        {demo.artist} • {demo.bpm} BPM • {demo.tuning}
                      </p>
                    </div>
                    <Play className="w-4 h-4 text-[#e2b04a] fill-[#e2b04a] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Wizytówka technologii */}
            <div className="p-6 rounded-2xl bg-[#110e0b] border border-[#f2ead821]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#e2b04a] mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Jak działa silnik Gryf AI?
              </h4>
              <ul className="text-xs text-[#f2ead8b3] space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Izolacja Demucs v4:</strong> Dzieli plik na 4 odrębne bezstratne ścieżki (gitara, bas, perkusja, wokal).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Automatyczny Crawler:</strong> Przeszukuje bazy tabulatur i dopasowuje oficjalne opracowania.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Synchronizacja Beat-to-Beat:</strong> Dynamic Time Warping wyrównuje każdy takt do tempa nagrania.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Ekran Postępu Analizy AI */}
      {status !== 'idle' && status !== 'completed' && (
        <div className="my-auto py-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl bg-[#e2b04a15] border-2 border-[#e2b04a55] flex items-center justify-center text-[#e2b04a] animate-pulse">
              <RefreshCw className="w-10 h-10 animate-spin" />
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-[#e2b04a] text-black font-black text-xs">
              {progress}%
            </div>
          </div>

          <h2 className="font-['Big_Shoulders_Display'] text-3xl font-black uppercase text-[#f2ead8] tracking-wider mb-2">
            Przetwarzanie Ścieżki Dźwiękowej AI
          </h2>
          <p className="text-sm text-[#f2ead8b3] mb-6 min-h-[40px] italic">
            "{currentStepText}"
          </p>

          <div className="w-full h-3 rounded-full bg-[#1e1b18] border border-[#f2ead821] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#e2b04a] to-[#e0392b] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Ekran Podglądu Wyników i Miksera Stemów (Completed Workspace) */}
      {status === 'completed' && analysisResult && (
        <div className="flex flex-col gap-6">
          {/* Karta podsumowania utworu */}
          <div className="p-6 rounded-2xl bg-[#110e0b] border border-[#f2ead821] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Zsynchronizowano Audio i Tabulaturę
                </span>
                <span className="text-xs text-[#f2ead870] font-mono">• Pewność: 99.2%</span>
              </div>
              <h2 className="font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide text-[#f2ead8]">
                {analysisResult.title}
              </h2>
              <p className="text-sm text-[#f2ead8b3]">
                {analysisResult.artist} • Tempo: {analysisResult.bpm} BPM • Strój: {analysisResult.tuning} • {analysisResult.notes.length} nut w tabulaturze
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  sfx.play('confirm');
                  onPlaySong(
                    analysisResult.title,
                    analysisResult.artist,
                    analysisResult.notes,
                    analysisResult.bpm
                  );
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e0392b] hover:bg-[#c8281e] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                Graj na Autostradzie Nut
              </button>
            </div>
          </div>

          {/* Mikser Stemów i Odtwarzacz z Wizualizacją Waveform */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Odtwarzacz Waveform */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#110e0b] border border-[#f2ead821] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e2b04a]">
                    <Music className="w-4 h-4" />
                    <span>Ścieżka Zsynchronizowana (Waveform & Tab Timeline)</span>
                  </div>
                  <span className="font-mono text-xs text-[#f2ead870]">
                    {playbackTime.toFixed(1)}s / {analysisResult.durationSec.toFixed(1)}s
                  </span>
                </div>

                {/* Wizualny Waveform */}
                <div className="h-28 w-full bg-[#0b0907] rounded-xl border border-[#f2ead815] relative overflow-hidden flex items-center justify-between px-2 gap-1 mb-4">
                  {Array.from({ length: 64 }).map((_, idx) => {
                    const h = Math.sin(idx * 0.4) * 40 + Math.cos(idx * 0.9) * 20 + 35;
                    const isPassed = (idx / 64) * analysisResult.durationSec <= playbackTime;

                    return (
                      <div
                        key={idx}
                        className={`w-full rounded-full transition-all ${
                          isPassed ? 'bg-[#e2b04a]' : 'bg-[#f2ead822]'
                        }`}
                        style={{ height: `${Math.max(10, Math.min(95, h))}%` }}
                      />
                    );
                  })}
                  {/* Kursor odtwarzania */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#e0392b] shadow-[0_0_8px_rgba(224,57,43,1)] transition-all pointer-events-none"
                    style={{
                      left: `${Math.min(100, (playbackTime / analysisResult.durationSec) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sterowanie podglądem */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e1b18] hover:bg-[#282420] text-[#f2ead8] text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  {isPlayingPreview ? 'Pauza' : 'Odsłuchaj Podgląd'}
                </button>

                <div className="flex items-center gap-2 text-xs text-[#f2ead870]">
                  <span>Źródło tabulatury: <strong>{analysisResult.onlineMatch?.source}</strong></span>
                  <span>•</span>
                  <span>Dokładność: <strong>{analysisResult.onlineMatch?.accuracy}%</strong></span>
                </div>
              </div>
            </div>

            {/* Mikser Stemów (Izolowana gitara vs Podkład) */}
            <div className="p-6 rounded-2xl bg-[#110e0b] border border-[#f2ead821] flex flex-col justify-between">
              <div>
                <h3 className="font-['Big_Shoulders_Display'] text-xl font-black uppercase text-[#f2ead8] tracking-wider mb-4 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#e2b04a]" /> Mikser Ścieżek (Stems)
                </h3>

                <div className="space-y-4">
                  {/* Wyizolowana gitara */}
                  <div>
                    <div className="flex justify-between text-xs text-[#f2ead8] mb-1.5 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-[#e2b04a]" />
                        Wyizolowana Gitara (Stem AI)
                      </span>
                      <span>{guitarSolo ? 'SOLO' : `${guitarStemVolume}%`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={guitarSolo ? 100 : guitarStemVolume}
                        onChange={(e) => setGuitarStemVolume(parseInt(e.target.value, 10))}
                        className="w-full accent-[#e2b04a]"
                      />
                      <button
                        onClick={() => setGuitarSolo(!guitarSolo)}
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          guitarSolo ? 'bg-[#e2b04a] text-black' : 'bg-[#1e1b18] text-[#f2ead870]'
                        }`}
                      >
                        S
                      </button>
                    </div>
                  </div>

                  {/* Podkład */}
                  <div>
                    <div className="flex justify-between text-xs text-[#f2ead8] mb-1.5 font-bold">
                      <span>Podkład (Perkusja, Bas, Wokal)</span>
                      <span>{guitarSolo ? 'Wyciszony' : `${backingStemVolume}%`}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      disabled={guitarSolo}
                      value={guitarSolo ? 0 : backingStemVolume}
                      onChange={(e) => setBackingStemVolume(parseInt(e.target.value, 10))}
                      className="w-full accent-[#e0392b]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#f2ead815] mt-4 flex items-center justify-between">
                <span className="text-[11px] text-[#f2ead870]">Format eksportu: Guitar Pro 7 (.gpx)</span>
                <button
                  onClick={() => alert('Pobieranie wygenerowanego pliku GPX...')}
                  className="flex items-center gap-1.5 text-xs text-[#e2b04a] hover:underline font-bold"
                >
                  <Download className="w-3.5 h-3.5" /> Eksportuj GPX
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Subskrypcji Gryf PRO */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#110e0b] border border-[#e2b04a55] rounded-3xl p-8 shadow-2xl shadow-amber-950/40 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#e2b04a15] border border-[#e2b04a33] flex items-center justify-center text-[#e2b04a] mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wider text-white mb-2">
              Odblokuj Gryf PRO • Pełne Studio AI
            </h3>
            <p className="text-xs text-[#f2ead8b3] mb-6">
              Nielimitowana transkrypcja dowolnych utworów MP3/WAV/YouTube, bezstratna separacja stemów Demucs oraz automatyczna synchronizacja tabulatur.
            </p>

            <div className="p-4 rounded-2xl bg-[#0b0907] border border-[#f2ead815] text-left space-y-2 mb-6 text-xs text-[#f2ead8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#e2b04a]" /> Nielimitowane konwersje MP3 do tabulatur
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#e2b04a]" /> Izolacja ścieżki solowej z redukcją szumu
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#e2b04a]" /> Eksport do formatów Guitar Pro 3-8 (.gpx / .gp)
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowProModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#1e1b18] hover:bg-[#282420] text-zinc-300 text-xs font-bold uppercase tracking-wider"
              >
                Zamknij
              </button>
              <button
                onClick={() => {
                  alert('Aktywowano subskrypcję Gryf PRO!');
                  setShowProModal(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#e2b04a] to-[#ffaa22] text-[#0b0907] font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110"
              >
                Aktywuj Plan PRO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
