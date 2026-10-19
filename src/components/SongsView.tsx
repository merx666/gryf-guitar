import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Music2, Play, Star, SlidersHorizontal, FolderUp } from 'lucide-react';
import { TourSong } from '../types';
import { TOUR_SONGS } from '../data/tourData';
import { sfx } from '../audio/sfxPlayer';

interface SongsViewProps {
  onBack: () => void;
  onSelectSong: (song: TourSong) => void;
  onOpenImport: () => void;
  earnedStars: Record<string, number>;
}

// Baza znanych rockowych klasyków rozszerzająca katalog
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
];

export const SongsView: React.FC<SongsViewProps> = ({
  onBack,
  onSelectSong,
  onOpenImport,
  earnedStars,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Wszystkie');

  const allSongs = useMemo(() => {
    return [...TOUR_SONGS, ...EXTRA_ROCK_SONGS];
  }, []);

  const genres = ['Wszystkie', 'Rock', 'Hard Rock', 'Metal', 'Grunge', 'Blues Rock', 'Polski Rock'];

  const filteredSongs = useMemo(() => {
    return allSongs.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre =
        selectedGenre === 'Wszystkie' ||
        song.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      return matchesSearch && matchesGenre;
    });
  }, [allSongs, searchQuery, selectedGenre]);

  return (
    <div className="w-full flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Pasek nawigacji górnej */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Menu Główne</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Biblioteka Utworów</h1>
            <p className="text-xs text-zinc-400">Dostępnych {allSongs.length} utworów ze zsynchronizowanymi nutami</p>
          </div>
        </div>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all font-semibold text-xs uppercase tracking-wider"
        >
          <FolderUp className="w-4 h-4" />
          Wgraj Plik Tabulatury (.gp)
        </button>
      </div>

      {/* Wyszukiwarka i Filtry Gatunków */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Szukaj po tytule lub zespole..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Pigułki gatunków */}
        <div className="flex flex-wrap items-center gap-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => {
                sfx.play('click_subtle');
                setSelectedGenre(genre);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedGenre === genre
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Utworów */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSongs.map((song) => {
          const stars = earnedStars[song.id] || 0;

          return (
            <div
              key={song.id}
              className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-850 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-amber-400 font-bold text-sm">
                  <Music2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {song.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{song.artist}</span>
                    <span>•</span>
                    <span className="text-zinc-500">{song.genre}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                    <span>{song.tempo} BPM</span>
                    <span>•</span>
                    <span>Strój: {song.tuning}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Gwiazdki */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= stars ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    sfx.play('click_subtle');
                    onSelectSong(song);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Graj
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
