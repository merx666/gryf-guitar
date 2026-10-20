import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Music2,
  Play,
  Star,
  FolderUp,
  Wand2,
  Flame,
  Gauge,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { TourSong } from '../types';
import { TOUR_SONGS } from '../data/tourData';
import { sfx } from '../audio/sfxPlayer';
import { useTranslation } from '../i18n/LanguageContext';

interface SongsViewProps {
  onBack: () => void;
  onSelectSong: (song: TourSong) => void;
  onOpenImport: () => void;
  onOpenAiStudio?: (song: TourSong) => void;
  earnedStars: Record<string, number>;
}

// Baza rockowych klasyków rozszerzająca katalog
const EXTRA_ROCK_SONGS: TourSong[] = [
  {
    id: 'nirvana-smells',
    chapter: 1,
    order: 101,
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    genre: 'Grunge',
    year: 1991,
    about: 'Hymn pokolenia lat 90. Prosty, potężny riff na power chordach F5, Bb5, Ab5, Db5.',
    tempo: 117,
    tuning: 'Standard E',
    teaches: ['Power Chords', 'Tłumienie dłonią'],
    uses: ['Kostkowanie naprzemienne'],
    notesCount: 184,
    durationMs: 301000,
    file: 'nirvana-smells.json',
  },
  {
    id: 'acdc-backinblack',
    chapter: 2,
    order: 102,
    title: 'Back in Black',
    artist: 'AC/DC',
    genre: 'Hard Rock',
    year: 1980,
    about: 'Jeden z najbardziej rozpoznawalnych riffów w historii rocka. E5, D5, A5 z precyzyjnymi pauzami.',
    tempo: 93,
    tuning: 'Standard E',
    teaches: ['Timing', 'Rytmika', 'Pauzy'],
    uses: ['Podciągnięcia ćwierćtonowe'],
    notesCount: 220,
    durationMs: 255000,
    file: 'acdc-backinblack.json',
  },
  {
    id: 'metallica-sandman',
    chapter: 3,
    order: 103,
    title: 'Enter Sandman',
    artist: 'Metallica',
    genre: 'Metal',
    year: 1991,
    about: 'Ciężki riff oparty na trytonie i pustej strunie E. Wzorzec metalowego groove.',
    tempo: 123,
    tuning: 'Standard E',
    teaches: ['Tryton', 'Tłumienie palm mute'],
    uses: ['Czyste legato'],
    notesCount: 310,
    durationMs: 332000,
    file: 'metallica-sandman.json',
  },
  {
    id: 'hendrix-voodoo',
    chapter: 4,
    order: 104,
    title: 'Voodoo Child (Slight Return)',
    artist: 'Jimi Hendrix',
    genre: 'Blues Rock',
    year: 1968,
    about: 'Czysta bluesowo-psychodeliczna magia, wah-wah i bendy na strunach wiolinowych.',
    tempo: 90,
    tuning: 'Eb Standard',
    teaches: ['Podciągnięcia całotonowe', 'Vibrato'],
    uses: ['Tłumienie kciukiem'],
    notesCount: 340,
    durationMs: 312000,
    file: 'hendrix-voodoo.json',
  },
  {
    id: 'maanam-cykady',
    chapter: 5,
    order: 105,
    title: 'Cykady na Cykladach',
    artist: 'Maanam',
    genre: 'Polski Rock',
    year: 1984,
    about: 'Niezapomniany polski new wave i dynamiczny motyw Marka Jackowskiego.',
    tempo: 145,
    tuning: 'Standard E',
    teaches: ['Szybki rytm', 'Akordy funkowe'],
    uses: ['Staccato'],
    notesCount: 260,
    durationMs: 198000,
    file: 'maanam-cykady.json',
  },
  {
    id: 'dzem-wehikuł',
    chapter: 6,
    order: 106,
    title: 'Wehikuł Czasu',
    artist: 'Dżem',
    genre: 'Blues Rock',
    year: 1989,
    about: 'Polski klasyk przy ognisku i na wielkich scenach. Akordy C, G, Am, F.',
    tempo: 82,
    tuning: 'Standard E',
    teaches: ['Bicie akustyczne', 'Zmiany akordów'],
    uses: ['Pełne brzmienie'],
    notesCount: 160,
    durationMs: 360000,
    file: 'dzem-wehikul.json',
  },
  {
    id: 'dire-straits-sultans',
    chapter: 7,
    order: 107,
    title: 'Sultans of Swing',
    artist: 'Dire Straits',
    genre: 'Classic Rock',
    year: 1978,
    about: 'Kunszt fingerstyle Marka Knopflera, legendarne arpeggia d-moll i dynamiczne fill-iny.',
    tempo: 148,
    tuning: 'Standard E',
    teaches: ['Fingerpicking', 'Arpeggia'],
    uses: ['Szybkie triole'],
    notesCount: 395,
    durationMs: 348000,
    file: 'dire-straits-sultans.json',
  },
  {
    id: 'guns-sweet-child',
    chapter: 8,
    order: 108,
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    genre: 'Hard Rock',
    year: 1987,
    about: 'Rozgrzewkowy cyrkularny motyw Slasha, który stał się ikoną rocka wszech czasów.',
    tempo: 125,
    tuning: 'Eb Standard',
    teaches: ['Owijanie strun', 'Płynność skoków'],
    uses: ['Kostkowanie naprzemienne'],
    notesCount: 290,
    durationMs: 356000,
    file: 'guns-sweet-child.json',
  },
];

export const SongsView: React.FC<SongsViewProps> = ({
  onBack,
  onSelectSong,
  onOpenImport,
  onOpenAiStudio,
  earnedStars,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');

  const allSongs = useMemo(() => {
    return [...TOUR_SONGS, ...EXTRA_ROCK_SONGS];
  }, []);

  const genres = ['ALL', 'Rock', 'Hard Rock', 'Metal', 'Grunge', 'Blues Rock', 'Classic Rock'];

  const filteredSongs = useMemo(() => {
    return allSongs.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.genre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre =
        selectedGenre === 'ALL' ||
        song.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      return matchesSearch && matchesGenre;
    });
  }, [allSongs, searchQuery, selectedGenre]);

  return (
    <div className="w-full flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto select-none bg-[#0b0907] text-[#f2ead8]">
      {/* Pasek nawigacji górnej w stylu sceny */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#f2ead8]/10">
        <div className="flex items-center gap-5">
          <button
            onClick={() => {
              sfx.play('click_subtle');
              onBack();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#110e0b] border border-[#f2ead8]/15 hover:border-[#e0392b] text-[#f2ead8]/80 hover:text-white transition-all cursor-pointer font-['Barlow_Condensed'] uppercase tracking-wider text-sm font-bold shadow-md hover:shadow-[0_0_15px_rgba(224,57,43,0.3)]"
          >
            <ArrowLeft className="w-4 h-4 text-[#e0392b]" />
            <span>←</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e0392b] animate-pulse"></span>
              <span className="text-[11px] font-['Barlow_Condensed'] uppercase tracking-[0.2em] font-bold text-[#e2b04a]">
                Gryf • Rocksmith+ Audio Stems
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-['Big_Shoulders_Display'] uppercase tracking-tight text-[#f2ead8] leading-none mt-1">
              {t('songs.title')}
            </h1>
            <p className="text-xs text-[#f2ead8]/60 mt-1 font-['Barlow']">
              {t('songs.subtitle')} ({allSongs.length} tracks)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sfx.play('select');
              onOpenImport();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#1a1612] text-[#e2b04a] border border-[#e2b04a]/30 hover:border-[#e2b04a] hover:bg-[#241e18] transition-all font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(226,176,74,0.3)]"
          >
            <FolderUp className="w-4 h-4" />
            {t('menu.importTab')}
          </button>
        </div>
      </div>

      {/* Wyszukiwarka i Pigułki Gatunków */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#f2ead8]/40" />
          <input
            type="text"
            placeholder={t('songs.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-[#080605] border border-[#f2ead8]/15 text-sm text-[#f2ead8] placeholder-[#f2ead8]/40 focus:outline-none focus:border-[#e2b04a] focus:ring-1 focus:ring-[#e2b04a]/50 transition-all font-['Barlow']"
          />
        </div>

        {/* Pigułki gatunków */}
        <div className="flex flex-wrap items-center gap-1.5">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => {
                sfx.play('click_subtle');
                setSelectedGenre(genre);
              }}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-['Barlow_Condensed'] uppercase tracking-wider transition-all cursor-pointer font-bold ${
                selectedGenre === genre
                  ? 'bg-[#e0392b] text-white shadow-[0_0_15px_rgba(224,57,43,0.5)]'
                  : 'bg-[#110e0b] border border-[#f2ead8]/10 text-[#f2ead8]/70 hover:text-white hover:border-[#f2ead8]/30'
              }`}
            >
              {genre === 'ALL' ? t('songs.allGenres') : genre}
            </button>
          ))}
        </div>
      </div>

      {/* Siatka Utworów */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
        {filteredSongs.map((song) => {
          const stars = earnedStars[song.id] || 0;
          const masteryPct = Math.round((stars / 5) * 100);

          return (
            <div
              key={song.id}
              className="flex flex-col justify-between p-5 rounded-sm bg-[#110e0b] border border-[#f2ead8]/12 hover:border-[#e0392b]/60 transition-all group relative overflow-hidden shadow-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            >
              {/* Subtelny gradient sceniczny w tle */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#e0392b]/5 to-transparent pointer-events-none group-hover:from-[#e0392b]/15 transition-all"></div>

              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Ikona / Winyl */}
                    <div className="w-13 h-13 rounded-sm bg-[#1a1612] border border-[#f2ead8]/15 flex items-center justify-center text-[#e2b04a] group-hover:scale-105 group-hover:border-[#e0392b] transition-all shadow-inner">
                      <Music2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8] group-hover:text-[#e0392b] transition-colors leading-tight">
                        {song.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#e2b04a] mt-0.5">
                        <span>{song.artist}</span>
                        <span className="text-[#f2ead8]/30">•</span>
                        <span className="text-[#f2ead8]/60 font-semibold">{song.genre}</span>
                        {song.year && (
                          <>
                            <span className="text-[#f2ead8]/30">•</span>
                            <span className="text-[#f2ead8]/40">{song.year}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gwiazdki Opanowania */}
                  <div className="flex items-center gap-1 bg-[#0b0907] px-2.5 py-1 rounded-sm border border-[#f2ead8]/10">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= stars ? 'text-[#e2b04a] fill-[#e2b04a]' : 'text-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Opis i Dydaktyka */}
                <p className="text-xs text-[#f2ead8]/70 mt-3 font-['Barlow'] line-clamp-2 leading-relaxed">
                  {song.about}
                </p>

                {/* Parametry techniczne utworu */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#f2ead8]/8 text-[11px] font-['Barlow_Condensed'] uppercase tracking-wider font-bold">
                  <span className="px-2 py-0.5 rounded-sm bg-[#181410] border border-[#f2ead8]/10 text-[#f2ead8]/80">
                    {song.tempo} BPM
                  </span>
                  <span className="px-2 py-0.5 rounded-sm bg-[#181410] border border-[#f2ead8]/10 text-[#58c46c]">
                    Strój: {song.tuning}
                  </span>
                  <span className="px-2 py-0.5 rounded-sm bg-[#181410] border border-[#f2ead8]/10 text-[#38bdf8]">
                    {song.notesCount} nut
                  </span>

                  {/* Pasek opanowania utworu */}
                  <div className="ml-auto flex items-center gap-2 text-[10px] text-[#f2ead8]/60">
                    <span>Opanowanie: {masteryPct}%</span>
                    <div className="w-16 h-1.5 bg-[#080605] rounded-full overflow-hidden border border-[#f2ead8]/10">
                      <div
                        className="h-full bg-gradient-to-r from-[#e2b04a] to-[#58c46c] transition-all"
                        style={{ width: `${masteryPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dolne przyciski akcji */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[#f2ead8]/8">
                {/* Otwórz w Studio AI */}
                {onOpenAiStudio && (
                  <button
                    onClick={() => {
                      sfx.play('select');
                      onOpenAiStudio(song);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-[#1c1712] border border-[#e2b04a]/30 hover:border-[#e2b04a] text-[#e2b04a] hover:bg-[#e2b04a]/10 font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    title="AI Studio & Stem Separation"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{t('songs.openInStudio')}</span>
                  </button>
                )}

                {/* Przycisk Główny - Graj na autostradzie nut */}
                <button
                  onClick={() => {
                    sfx.play('click_subtle');
                    onSelectSong(song);
                  }}
                  className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-sm bg-[#e0392b] hover:bg-[#c93226] text-white font-['Big_Shoulders_Display'] uppercase font-black text-sm tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(224,57,43,0.4)] hover:shadow-[0_0_25px_rgba(224,57,43,0.7)] active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t('songs.playNow')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
