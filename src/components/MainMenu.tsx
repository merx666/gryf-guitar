import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  Target,
  Music,
  Sliders,
  Trophy,
  Sparkles,
  Guitar,
  FolderUp,
  Volume2,
  Activity,
  Flame,
  ArrowRight,
  Layers,
  Wand2,
  Disc,
} from 'lucide-react';
import { ScreenName, PlayerRank } from '../types';
import { sfx } from '../audio/sfxPlayer';
import { useTranslation } from '../i18n/LanguageContext';
import { getRankTitle } from '../data/badgesData';

interface MainMenuProps {
  onNavigate: (screen: ScreenName) => void;
  onOpenTuner: () => void;
  onOpenFretboard: () => void;
  onOpenCalibration: () => void;
  onOpenImport: () => void;
  playerRank: PlayerRank;
  isMicActive: boolean;
  onToggleMic: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onNavigate,
  onOpenTuner,
  onOpenFretboard,
  onOpenCalibration,
  onOpenImport,
  playerRank,
  isMicActive,
  onToggleMic,
}) => {
  const { t } = useTranslation();
  // Aktywny rozwinięty plaster sceniczny (0 = Graj, 1 = Piosenki, 2 = Studio AI, 3 = Sprzęt, 4 = Profil)
  const [activeSlice, setActiveSlice] = useState<number>(0);
  const localizedRankTitle = getRankTitle(playerRank.level, t);

  const handleNav = (screen: ScreenName) => {
    sfx.play('select');
    onNavigate(screen);
  };

  const handleSliceClick = (idx: number) => {
    if (activeSlice !== idx) {
      sfx.play('tap');
      setActiveSlice(idx);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between overflow-hidden select-none font-['Barlow']">
      {/* Kontener plasterków scenicznych (Slices Accordion Layout) */}
      <div className="slices-container">
        {/* PLASTER 1: GRAJ (PLAY) */}
        <section
          onClick={() => handleSliceClick(0)}
          className={`slice ${activeSlice === 0 ? 'open' : ''}`}
          aria-label="Graj"
        >
          <img
            src={`${import.meta.env.BASE_URL}menu/stage-noir.webp`}
            alt="Scena Noir"
            className="slice-still"
            draggable={false}
          />
          <div className="slice-shade" />

          {/* Pionowa zakładka (gdy plaster jest zwinięty) */}
          <div className="slice-tab">
            <span className="slice-tab-badge">3</span>
            <span className="slice-tab-title">{t('menu.play')}</span>
            <Compass className="w-8 h-8 text-[#f2ead8] stroke-[1.8]" />
          </div>

          {/* Rozwinięta zawartość */}
          <div className="slice-body">
            <div>
              <div className="slice-header-subtitle">Tour • Highway & Modes</div>
              <h2 className="slice-header-title">{t('menu.play')}</h2>

              <div className="menu-row">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('tour');
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Trasa Koncertowa</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Dołącz do zespołu i ucz się gry od zera w 8 rozdziałach od garażu po festiwal
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.play('select');
                    onOpenFretboard();
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Lekcje i Skale</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Lekcja 1: Uderzanie w strunę · wirtualny trener słucha Twojej gitary na żywo
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('play');
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Trening & Wprawki</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Drabinki szybkości, ćwiczenia techniki kostkowania i arpeggia na autostradzie nutowej
                  </span>
                </button>
              </div>
            </div>

            {/* Fakty u dołu plastra */}
            <div className="slice-facts">
              <div className="slice-fact-item">
                <span className="slice-fact-val">Garaż u Matiego</span>
                <span className="slice-fact-lbl">Najbliższy Koncert</span>
              </div>
              <div className="slice-fact-item">
                <span className="slice-fact-val">
                  <em>★ {playerRank.starsEarned}</em> / {playerRank.starsTotal}
                </span>
                <span className="slice-fact-lbl">Zdobyte Gwiazdki</span>
              </div>
            </div>
          </div>
        </section>

        {/* PLASTER 2: PIOSENKI (SONGS) */}
        <section
          onClick={() => handleSliceClick(1)}
          className={`slice ${activeSlice === 1 ? 'open' : ''}`}
          aria-label="Piosenki"
        >
          <img
            src={`${import.meta.env.BASE_URL}menu/stage-phosphor.webp`}
            alt="Scena Fosfor"
            className="slice-still"
            draggable={false}
          />
          <div className="slice-shade" />

          <div className="slice-tab">
            <span className="slice-tab-badge">571</span>
            <span className="slice-tab-title">{t('menu.songs')}</span>
            <Music className="w-8 h-8 text-[#f2ead8] stroke-[1.8]" />
          </div>

          <div className="slice-body">
            <div>
              <div className="slice-header-subtitle">Catalog & Master Tracks</div>
              <h2 className="slice-header-title">{t('menu.songs')}</h2>

              <div className="menu-row">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('songs');
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Biblioteka Klasyków (571 utworów)</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Przeglądaj bazę rocka i metalu ze zsynchronizowanym podkładem wideo
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('songs');
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Szukaj w Bazach Internetowych</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Przeszukaj tysiące darmowych tabulatur online i dodaj je do swojej kolekcji
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.play('select');
                    onOpenImport();
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Importuj Tabulatury (.gp / .gpx)</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Wgraj własne pliki Guitar Pro 3 – 8, foldery lub archiwa .zip
                  </span>
                </button>
              </div>
            </div>

            <div className="slice-facts">
              <div className="slice-fact-item">
                <span className="slice-fact-val">571</span>
                <span className="slice-fact-lbl">Zsynchronizowanych Wideo</span>
              </div>
              <div className="slice-fact-item">
                <span className="slice-fact-val">Guitar Pro 3 – 8</span>
                <span className="slice-fact-lbl">Obsługiwany Format</span>
              </div>
            </div>
          </div>
        </section>

        {/* PLASTER 3: STUDIO AI • MP3 DO TABÓW (NOWA FUNKCJA PREMIUM ROCKSMITH+) */}
        <section
          onClick={() => handleSliceClick(2)}
          className={`slice ${activeSlice === 2 ? 'open' : ''} border-[#e2b04a44]`}
          aria-label="Studio AI"
        >
          <img
            src={`${import.meta.env.BASE_URL}menu/stage-forge.webp`}
            alt="Scena AI Studio"
            className="slice-still"
            draggable={false}
          />
          {/* Złota poświata dla modułu AI Studio */}
          <div className="slice-shade" style={{ background: 'linear-gradient(90deg, rgba(11, 9, 7, 0.94) 0%, rgba(30, 22, 10, 0.75) 50%, rgba(11, 9, 7, 0.25) 90%)' }} />

          <div className="slice-tab">
            <span className="slice-tab-badge border-[#e2b04a66] text-[#e2b04a]">PRO • AI</span>
            <span className="slice-tab-title text-[#e2b04a]">{t('menu.aiStudio')}</span>
            <Sparkles className="w-8 h-8 text-[#e2b04a] stroke-[1.8]" />
          </div>

          <div className="slice-body">
            <div>
              <div className="slice-header-subtitle text-[#e2b04a] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Demucs v4 AI Stem Separation & Neural Tabs
              </div>
              <h2 className="slice-header-title text-[#f2ead8]">{t('menu.aiStudio')}</h2>

              <div className="menu-row">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('aistudio');
                  }}
                  className="menu-action-item group border-[#e2b04a44] hover:border-[#e2b04a]"
                >
                  <span className="menu-item-title text-[#e2b04a] flex items-center justify-between">
                    <span>Przerób Utwór MP3 na Tabulaturę</span>
                    <ArrowRight className="w-4 h-4 text-[#e2b04a] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Wrzuć plik audio lub link YouTube. Model Demucs v4 AI izoluje gitarę, wykrywa progi i generuje tabulaturę.
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('aistudio');
                  }}
                  className="menu-action-item group border-[#e2b04a44] hover:border-[#e2b04a]"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Automatyczny Crawler & Auto-Sync</span>
                    <ArrowRight className="w-4 h-4 text-[#e2b04a] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    System szuka oficjalnych tabów w internecie (Songsterr/UG) i synchronizuje nuty z plikiem MP3 co do 5ms.
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('aistudio');
                  }}
                  className="menu-action-item group border-[#e2b04a44] hover:border-[#e2b04a]"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Wielościeżkowy Mikser Stemów</span>
                    <ArrowRight className="w-4 h-4 text-[#e2b04a] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Wyciszaj oryginalną gitarę i graj solo na żywo na autostradzie nutowej Rocksmith+.
                  </span>
                </button>
              </div>
            </div>

            <div className="slice-facts">
              <div className="slice-fact-item">
                <span className="slice-fact-val text-[#e2b04a]">Demucs v4 AI</span>
                <span className="slice-fact-lbl">Izolacja Ścieżek</span>
              </div>
              <div className="slice-fact-item">
                <span className="slice-fact-val">99.2%</span>
                <span className="slice-fact-lbl">Precyzja Synchronizacji</span>
              </div>
            </div>
          </div>
        </section>

        {/* PLASTER 4: SPRZĘT & WZMACNIACZ (GEAR) */}
        <section
          onClick={() => handleSliceClick(3)}
          className={`slice ${activeSlice === 3 ? 'open' : ''}`}
          aria-label="Sprzęt"
        >
          <img
            src={`${import.meta.env.BASE_URL}menu/stage-forge.webp`}
            alt="Scena Kuźnia"
            className="slice-still"
            draggable={false}
          />
          <div className="slice-shade" />

          <div className="slice-tab">
            <span className="slice-tab-badge">DSP</span>
            <span className="slice-tab-title">{t('menu.gear')}</span>
            <Sliders className="w-8 h-8 text-[#f2ead8] stroke-[1.8]" />
          </div>

          <div className="slice-body">
            <div>
              <div className="slice-header-subtitle">Neural Amp Modeler & DSP Rig</div>
              <h2 className="slice-header-title">{t('menu.gear')}</h2>

              <div className="menu-row">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.play('select');
                    onOpenTuner();
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Stroik Chromatyczny</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Nastroj gitarę z dokładnością do 1 centa przy użyciu mikrofonu lub kabla
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('gear');
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Wzmacniacz Lampowy & Efekty</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Wirtualna głowa 100W: Gain, korekcja, filtr buczenia 50Hz, Chorus i Taśmowy Delay
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.play('select');
                    onOpenCalibration();
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Kalibracja Opóźnienia i Sprzętu</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Precyzyjny test rytmiczny metronomu kompensujący opóźnienia karty dźwiękowej
                  </span>
                </button>
              </div>
            </div>

            <div className="slice-facts">
              <div className="slice-fact-item">
                <span className="slice-fact-val">Tube Lead 100W</span>
                <span className="slice-fact-lbl">Aktywny Wzmacniacz</span>
              </div>
              <div className="slice-fact-item">
                <span className="slice-fact-val">50 Hz Filtr</span>
                <span className="slice-fact-lbl">Bramka Przydźwięku</span>
              </div>
            </div>
          </div>
        </section>

        {/* PLASTER 5: TWÓJ PROFIL & KARIERA (YOU) */}
        <section
          onClick={() => handleSliceClick(4)}
          className={`slice ${activeSlice === 4 ? 'open' : ''}`}
          aria-label="Profil"
        >
          <img
            src={`${import.meta.env.BASE_URL}menu/stage-horizon.webp`}
            alt="Scena Horyzont"
            className="slice-still"
            draggable={false}
          />
          <div className="slice-shade" />

          <div className="slice-tab">
            <span className="slice-tab-badge">{t('header.level')} {playerRank.level}</span>
            <span className="slice-tab-title">{t('menu.profile')}</span>
            <Trophy className="w-8 h-8 text-[#f2ead8] stroke-[1.8]" />
          </div>

          <div className="slice-body">
            <div>
              <div className="slice-header-subtitle">Career, Stats & Badges</div>
              <h2 className="slice-header-title">{t('menu.profile')}</h2>

              <div className="menu-row">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('profile');
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Kariera i Osiągnięcia</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    50 poziomów (od Gitarzysty Sypialnianego po Legendę), 122 odznaki i historia sesji
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.play('select');
                    onOpenFretboard();
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Eksplorator Gryfu & Skal</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Wizualizacja 24 progów, skale pentatoniczne, modalne i interwały
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('play');
                  }}
                  className="menu-action-item group"
                >
                  <span className="menu-item-title flex items-center justify-between">
                    <span>Przewodnik po Autostradzie Nutowej</span>
                    <ArrowRight className="w-4 h-4 text-[#e0392b] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                  <span className="menu-item-desc">
                    Dowiedz się, jak czytać pigułki progów, oznaczenia technik i linie taktów Rocksmith+
                  </span>
                </button>
              </div>
            </div>

            <div className="slice-facts">
              <div className="slice-fact-item">
                <span className="slice-fact-val">{t('header.level')} {playerRank.level}</span>
                <span className="slice-fact-lbl">{localizedRankTitle}</span>
              </div>
              <div className="slice-fact-item">
                <span className="slice-fact-val">
                  <em>3</em> / 122
                </span>
                <span className="slice-fact-lbl">{t('profile.badges')}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Dolny pasek nawigacyjny i stopka formatów (Menu Footer z oryginalnego projektu) */}
      <footer className="w-full flex items-center justify-between px-8 py-3 bg-[#0b0907] border-t border-[#f2ead821] text-xs text-[#f2ead870] font-['Barlow_Condensed'] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-[#1e1b18] border border-[#f2ead821] text-[#f2ead8] font-mono text-[10px]">
            ←
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#1e1b18] border border-[#f2ead821] text-[#f2ead8] font-mono text-[10px]">
            →
          </span>
          <span>{t('menu.footerTagline')}</span>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[#f2ead8b3]">
          <span className="text-[#e2b04a] font-bold">Guitar Pro 3 – 8</span>
          <span>·</span>
          <span>Lead</span>
          <span>·</span>
          <span>Rhythm</span>
          <span>·</span>
          <span>Bass</span>
          <span>·</span>
          <span className="text-[#e0392b] font-bold">Demucs v4 Audio Sync</span>
        </div>

        {/* Szybkie skróty narzędziowe */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenTuner}
            className="flex items-center gap-1.5 text-[#f2ead8] hover:text-[#e2b04a] transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('header.tuner')}</span>
          </button>
          <span className="text-[#f2ead821]">·</span>
          <button
            onClick={onOpenFretboard}
            className="flex items-center gap-1.5 text-[#f2ead8] hover:text-[#e2b04a] transition-colors"
          >
            <Guitar className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('header.fretboard')}</span>
          </button>
          <span className="text-[#f2ead821]">·</span>
          <button
            onClick={onOpenCalibration}
            className="flex items-center gap-1.5 text-[#f2ead8] hover:text-[#e2b04a] transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('menu.calibration')}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
