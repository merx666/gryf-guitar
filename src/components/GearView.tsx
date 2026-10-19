import React, { useState } from 'react';
import { ArrowLeft, Sliders, Volume2, ShieldCheck, Zap, Disc, Play } from 'lucide-react';
import { audio } from '../audio/audioEngine';
import { sfx } from '../audio/sfxPlayer';

interface GearViewProps {
  onBack: () => void;
}

export const GearView: React.FC<GearViewProps> = ({ onBack }) => {
  // Stan parametrów wzmacniacza
  const [ampModel, setAmpModel] = useState<string>('crunch');
  const [gain, setGain] = useState<number>(6.5);
  const [bass, setBass] = useState<number>(5.0);
  const [mid, setMid] = useState<number>(6.0);
  const [treble, setTreble] = useState<number>(7.0);
  const [presence, setPresence] = useState<number>(6.0);
  const [masterVolume, setMasterVolume] = useState<number>(8.0);

  // Bramka szumów i filtry
  const [noiseGate, setNoiseGate] = useState<number>(audio.settings.noiseGateThreshold * 1000);
  const [humFilter, setHumFilter] = useState<boolean>(audio.settings.humFilter50Hz);

  // Efekty
  const [chorusActive, setChorusActive] = useState<boolean>(false);
  const [chorusRate, setChorusRate] = useState<number>(1.2);
  const [chorusDepth, setChorusDepth] = useState<number>(0.6);

  const [delayActive, setDelayActive] = useState<boolean>(true);
  const [delayTime, setDelayTime] = useState<number>(320); // ms
  const [delayFeedback, setDelayFeedback] = useState<number>(40); // %

  const handleAmpModelChange = (model: string) => {
    sfx.play('click_subtle');
    setAmpModel(model);
    if (model === 'clean') {
      setGain(2.5);
      setBass(6.0);
      setMid(5.0);
      setTreble(7.5);
    } else if (model === 'crunch') {
      setGain(6.5);
      setBass(5.5);
      setMid(6.0);
      setTreble(7.0);
    } else if (model === 'highgain') {
      setGain(9.0);
      setBass(7.0);
      setMid(4.5);
      setTreble(8.0);
    }
  };

  const testAmpSound = async () => {
    await audio.initContext();
    sfx.play('click_subtle');
    audio.playSyntheticNote(0, 0, 1.2); // Pusta struna E niska
    setTimeout(() => audio.playSyntheticNote(1, 2, 1.2), 150); // E5 chord
    setTimeout(() => audio.playSyntheticNote(2, 2, 1.2), 300);
  };

  return (
    <div className="w-full flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto select-none">
      {/* Pasek nawigacji górnej */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Menu Główne</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Brzmienie i Wzmacniacz Lampowy</h1>
            <p className="text-xs text-zinc-400">Wirtualny tor modelowania fizycznego DSP z zerową latencją</p>
          </div>
        </div>

        <button
          onClick={testAmpSound}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Play className="w-4 h-4 fill-zinc-950" />
          Testuj Brzmienie
        </button>
      </div>

      {/* Obudowa Główy Wzmacniacza Lampowego (Amp Head Rack) */}
      <div className="w-full rounded-3xl bg-gradient-to-b from-zinc-850 via-zinc-900 to-zinc-950 border-4 border-zinc-800 shadow-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
        {/* Metalowe narożniki i kratka głośnika */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-zinc-800/80 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.8)]" />
            <h2 className="text-xl font-black tracking-widest text-zinc-100 uppercase font-mono">
              GRYF • TUBE LEAD 100W
            </h2>
          </div>

          {/* Wybór modelu kanału wzmacniacza */}
          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
            {[
              { id: 'clean', name: 'Czysty (Vintage Clean)' },
              { id: 'crunch', name: 'Brytyjski Crunch' },
              { id: 'highgain', name: 'High-Gain Lead' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleAmpModelChange(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  ampModel === m.id
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Gałki potencjometrów (Knobs Panel) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 py-4">
          {[
            { label: 'GAIN', value: gain, set: setGain, min: 0, max: 10, color: '#f59e0b' },
            { label: 'BASS', value: bass, set: setBass, min: 0, max: 10, color: '#3b82f6' },
            { label: 'MID', value: mid, set: setMid, min: 0, max: 10, color: '#10b981' },
            { label: 'TREBLE', value: treble, set: setTreble, min: 0, max: 10, color: '#a855f7' },
            { label: 'PRESENCE', value: presence, set: setPresence, min: 0, max: 10, color: '#ec4899' },
            { label: 'MASTER', value: masterVolume, set: setMasterVolume, min: 0, max: 10, color: '#ef4444' },
          ].map((knob) => (
            <div key={knob.label} className="flex flex-col items-center p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-xs font-black font-mono text-zinc-400 mb-2">{knob.label}</span>
              {/* Wskaźnik gałki */}
              <div className="relative w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center shadow-inner my-2">
                <div
                  className="w-1.5 h-6 rounded-full origin-bottom transform transition-transform"
                  style={{
                    backgroundColor: knob.color,
                    transform: `rotate(${(knob.value / 10) * 270 - 135}deg)`,
                  }}
                />
              </div>
              <input
                type="range"
                min={knob.min}
                max={knob.max}
                step={0.1}
                value={knob.value}
                onChange={(e) => knob.set(parseFloat(e.target.value))}
                className="w-24 mt-2 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white mt-1">{knob.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel Efektów Podłogowych (Pedalboard FX) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Bramka Szumów i Redukcja 50Hz */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>CZYSZCZENIE SYGNAŁU</span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Bramka Szumów i Filtr 50Hz</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Eliminuje przydźwięk sieciowy przetworników single coil oraz szum kabli bez ucinania wybrzmiewania strun.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Próg bramki:</span>
                  <span className="font-mono font-bold text-white">-{Math.round(45 - noiseGate)} dB</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={noiseGate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setNoiseGate(val);
                    audio.settings.noiseGateThreshold = val / 1000;
                  }}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs text-zinc-300 font-medium">Filtr buczenia sieci 50Hz (PL)</span>
                <button
                  onClick={() => {
                    const next = !humFilter;
                    setHumFilter(next);
                    audio.settings.humFilter50Hz = next;
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    humFilter ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {humFilter ? 'WŁ' : 'WYŁ'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Analogowy Stereo Chorus */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
                <Zap className="w-4 h-4" />
                <span>MODULACJA</span>
              </div>
              <button
                onClick={() => setChorusActive(!chorusActive)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  chorusActive ? 'bg-sky-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {chorusActive ? 'Aktywny' : 'Bypass'}
              </button>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Stereo Bucket-Brigade Chorus</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Ciepłe, przestrzenne brzmienie lat 80. w stylu legendarnego Roland JC-120.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Prędkość oscylatora (Rate):</span>
                  <span className="font-mono font-bold text-white">{chorusRate} Hz</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={5}
                  step={0.1}
                  value={chorusRate}
                  onChange={(e) => setChorusRate(parseFloat(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Głębokość (Depth):</span>
                  <span className="font-mono font-bold text-white">{Math.round(chorusDepth * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={chorusDepth}
                  onChange={(e) => setChorusDepth(parseFloat(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Taśmowy Echo Delay */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
                <Disc className="w-4 h-4" />
                <span>ECHO & DELAY</span>
              </div>
              <button
                onClick={() => setDelayActive(!delayActive)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  delayActive ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {delayActive ? 'Aktywny' : 'Bypass'}
              </button>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Vintage Tape Echo</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Taśmowe echo z nasyceniem magnetycznym i modulacją dryfu taśmy wow & flutter.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Czas powtórzenia (Time):</span>
                  <span className="font-mono font-bold text-white">{delayTime} ms</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={800}
                  step={10}
                  value={delayTime}
                  onChange={(e) => setDelayTime(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Ilość powtórzeń (Feedback):</span>
                  <span className="font-mono font-bold text-white">{delayFeedback}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={85}
                  value={delayFeedback}
                  onChange={(e) => setDelayFeedback(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
