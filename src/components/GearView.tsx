import React, { useState } from 'react';
import {
  ArrowLeft,
  Sliders,
  Volume2,
  ShieldCheck,
  Zap,
  Disc,
  Play,
  Flame,
  Power,
  Sparkles,
} from 'lucide-react';
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
    <div className="w-full flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto select-none bg-[#0b0907] text-[#f2ead8]">
      {/* Pasek nawigacji górnej */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#f2ead8]/12">
        <div className="flex items-center gap-5">
          <button
            onClick={() => {
              sfx.play('click_subtle');
              onBack();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#110e0b] hover:bg-[#1a1612] text-[#f2ead8]/80 hover:text-white border border-[#f2ead8]/15 hover:border-[#e0392b] transition-all cursor-pointer font-['Barlow_Condensed'] uppercase tracking-wider text-sm font-bold shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#e0392b]" />
            <span>Menu Główne</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e2b04a] animate-pulse"></span>
              <span className="text-[11px] font-['Barlow_Condensed'] uppercase tracking-[0.2em] font-bold text-[#e2b04a]">
                Cyfrowy Tor DSP & Lampy 12AX7 / EL34
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-['Big_Shoulders_Display'] uppercase tracking-tight text-[#f2ead8] leading-none mt-1">
              BRZMIENIE & WZMACNIACZ LAMPOWY
            </h1>
            <p className="text-xs text-[#f2ead8]/60 mt-1 font-['Barlow']">
              Fizyczne modelowanie obwodów lampowych, redukcja zakłóceń 50Hz i studyjny pedalboard
            </p>
          </div>
        </div>

        <button
          onClick={testAmpSound}
          className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-[#e0392b] hover:bg-[#c93226] text-white font-['Big_Shoulders_Display'] uppercase font-black text-sm tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(224,57,43,0.4)] hover:shadow-[0_0_25px_rgba(224,57,43,0.7)] active:scale-95"
        >
          <Play className="w-4 h-4 fill-white" />
          TESTUJ BRZMIENIE (E5 RIFF)
        </button>
      </div>

      {/* Obudowa Głowy Wzmacniacza Lampowego (Tolex Chassis & Brushed Faceplate) */}
      <div className="w-full rounded-sm bg-[#110e0b] border-2 border-[#f2ead8]/15 shadow-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
        {/* Żar lamp elektronowych w tle przy wysokim gainie */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#e2b04a]/5 via-transparent to-transparent pointer-events-none transition-opacity duration-500"
          style={{ opacity: gain / 10 }}
        ></div>

        {/* Panel czołowy ze złotym napisem i kontrolką zasilania */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-[#f2ead8]/12 gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-5 h-5 rounded-full bg-[#e0392b] animate-pulse shadow-[0_0_15px_#e0392b]" />
              <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-30"></div>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-widest font-['Big_Shoulders_Display'] uppercase text-[#f2ead8]">
                GRYF • CUSTOM ALL-TUBE 100W HEAD
              </h2>
              <div className="text-[10px] font-['Barlow_Condensed'] uppercase tracking-[0.2em] text-[#e2b04a] font-bold">
                Analog Circuit Emulation • Zero-Latency Buffer
              </div>
            </div>
          </div>

          {/* Wybór modelu kanału wzmacniacza */}
          <div className="flex items-center gap-2 bg-[#080605] p-1.5 rounded-sm border border-[#f2ead8]/15">
            {[
              { id: 'clean', name: 'Czysty (Vintage Clean)' },
              { id: 'crunch', name: 'Brytyjski Crunch' },
              { id: 'highgain', name: 'High-Gain Overdrive' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleAmpModelChange(m.id)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  ampModel === m.id
                    ? 'bg-[#e2b04a] text-[#0b0907] shadow-[0_0_12px_rgba(226,176,74,0.4)]'
                    : 'text-[#f2ead8]/60 hover:text-white'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Gałki potencjometrów (Vintage Knobs Panel) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 py-4 relative z-10">
          {[
            { label: 'GAIN', value: gain, set: setGain, min: 0, max: 10, color: '#e0392b' },
            { label: 'BASS', value: bass, set: setBass, min: 0, max: 10, color: '#3b82f6' },
            { label: 'MID', value: mid, set: setMid, min: 0, max: 10, color: '#58c46c' },
            { label: 'TREBLE', value: treble, set: setTreble, min: 0, max: 10, color: '#eab308' },
            { label: 'PRESENCE', value: presence, set: setPresence, min: 0, max: 10, color: '#a855f7' },
            { label: 'MASTER', value: masterVolume, set: setMasterVolume, min: 0, max: 10, color: '#e2b04a' },
          ].map((knob) => (
            <div
              key={knob.label}
              className="flex flex-col items-center p-4 rounded-sm bg-[#080605] border border-[#f2ead8]/12 shadow-inner group"
            >
              <span className="text-xs font-bold font-['Barlow_Condensed'] uppercase tracking-wider text-[#e2b04a] mb-2">
                {knob.label}
              </span>
              {/* Metalowa gałka z wycięciem wskaźnikowym */}
              <div className="relative w-16 h-16 rounded-full bg-[#1c1712] border-2 border-[#f2ead8]/30 flex items-center justify-center shadow-lg my-2 group-hover:border-[#e2b04a] transition-colors">
                <div
                  className="w-1.5 h-6 rounded-full origin-bottom transform transition-transform"
                  style={{
                    backgroundColor: knob.color,
                    boxShadow: `0 0 8px ${knob.color}`,
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
                className="w-24 mt-3 accent-[#e2b04a] cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-[#f2ead8] mt-1.5">
                {knob.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel Efektów Podłogowych (Pedalboard FX) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Bramka Szumów i Redukcja 50Hz */}
        <div className="p-6 rounded-sm bg-[#110e0b] border border-[#f2ead8]/12 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#58c46c] mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>CZYSZCZENIE SYGNAŁU (DSP GATE)</span>
            </div>
            <h3 className="text-lg font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8] mb-1">
              Bramka Szumów & Filtr 50Hz
            </h3>
            <p className="text-xs text-[#f2ead8]/60 mb-5 font-['Barlow'] leading-relaxed">
              Eliminuje przydźwięk sieciowy przetworników single-coil oraz szum kabli bez ucinania naturalnego sustainu nut.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-['Barlow_Condensed'] uppercase font-bold text-[#f2ead8]/80 mb-1.5">
                  <span>Próg bramki (Noise Gate):</span>
                  <span className="font-mono text-[#58c46c]">-{Math.round(45 - noiseGate)} dB</span>
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
                  className="w-full accent-[#58c46c] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-sm bg-[#080605] border border-[#f2ead8]/12">
                <span className="text-xs font-['Barlow'] text-[#f2ead8]">Filtr buczenia sieci 50Hz (PL/UE)</span>
                <button
                  onClick={() => {
                    sfx.play('click_subtle');
                    const next = !humFilter;
                    setHumFilter(next);
                    audio.settings.humFilter50Hz = next;
                  }}
                  className={`px-3 py-1 rounded-sm text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    humFilter ? 'bg-[#58c46c] text-[#0b0907]' : 'bg-[#1a1612] text-[#f2ead8]/40'
                  }`}
                >
                  {humFilter ? 'WŁĄCZONY' : 'WYŁĄCZONY'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Analogowy Stereo Chorus */}
        <div className="p-6 rounded-sm bg-[#110e0b] border border-[#f2ead8]/12 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#38bdf8]">
                <Zap className="w-4 h-4" />
                <span>MODULACJA PRZESTRZENNA</span>
              </div>
              <button
                onClick={() => {
                  sfx.play('select');
                  setChorusActive(!chorusActive);
                }}
                className={`px-3 py-1 rounded-sm text-[11px] font-['Barlow_Condensed'] uppercase tracking-wider font-bold cursor-pointer transition-all ${
                  chorusActive
                    ? 'bg-[#38bdf8] text-[#0b0907] shadow-[0_0_10px_#38bdf8]'
                    : 'bg-[#181410] text-[#f2ead8]/40 border border-[#f2ead8]/10'
                }`}
              >
                {chorusActive ? 'AKTYWNY' : 'BYPASS'}
              </button>
            </div>
            <h3 className="text-lg font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8] mb-1">
              Analog BBD Stereo Chorus
            </h3>
            <p className="text-xs text-[#f2ead8]/60 mb-5 font-['Barlow'] leading-relaxed">
              Ciepłe, przestrzenne brzmienie lat 80. oparte na linii opóźniającej Bucket-Brigade.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-['Barlow_Condensed'] uppercase font-bold text-[#f2ead8]/80 mb-1.5">
                  <span>Prędkość (Rate):</span>
                  <span className="font-mono text-[#38bdf8]">{chorusRate} Hz</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={5}
                  step={0.1}
                  value={chorusRate}
                  onChange={(e) => setChorusRate(parseFloat(e.target.value))}
                  className="w-full accent-[#38bdf8] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-['Barlow_Condensed'] uppercase font-bold text-[#f2ead8]/80 mb-1.5">
                  <span>Głębokość (Depth):</span>
                  <span className="font-mono text-[#38bdf8]">{Math.round(chorusDepth * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={chorusDepth}
                  onChange={(e) => setChorusDepth(parseFloat(e.target.value))}
                  className="w-full accent-[#38bdf8] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Taśmowy Echo Delay */}
        <div className="p-6 rounded-sm bg-[#110e0b] border border-[#f2ead8]/12 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#a855f7]">
                <Disc className="w-4 h-4" />
                <span>ECHO TAŚMOWE & DELAY</span>
              </div>
              <button
                onClick={() => {
                  sfx.play('select');
                  setDelayActive(!delayActive);
                }}
                className={`px-3 py-1 rounded-sm text-[11px] font-['Barlow_Condensed'] uppercase tracking-wider font-bold cursor-pointer transition-all ${
                  delayActive
                    ? 'bg-[#a855f7] text-white shadow-[0_0_10px_#a855f7]'
                    : 'bg-[#181410] text-[#f2ead8]/40 border border-[#f2ead8]/10'
                }`}
              >
                {delayActive ? 'AKTYWNY' : 'BYPASS'}
              </button>
            </div>
            <h3 className="text-lg font-black font-['Big_Shoulders_Display'] uppercase tracking-wide text-[#f2ead8] mb-1">
              Vintage Space Tape Echo
            </h3>
            <p className="text-xs text-[#f2ead8]/60 mb-5 font-['Barlow'] leading-relaxed">
              Czyste odbicia echa z nasyceniem taśmy magnetycznej i analogowym rozproszeniem powtórzeń.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-['Barlow_Condensed'] uppercase font-bold text-[#f2ead8]/80 mb-1.5">
                  <span>Czas powtórzenia (Time):</span>
                  <span className="font-mono text-[#a855f7]">{delayTime} ms</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={800}
                  step={10}
                  value={delayTime}
                  onChange={(e) => setDelayTime(parseInt(e.target.value, 10))}
                  className="w-full accent-[#a855f7] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-['Barlow_Condensed'] uppercase font-bold text-[#f2ead8]/80 mb-1.5">
                  <span>Ilość powtórzeń (Feedback):</span>
                  <span className="font-mono text-[#a855f7]">{delayFeedback}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={85}
                  value={delayFeedback}
                  onChange={(e) => setDelayFeedback(parseInt(e.target.value, 10))}
                  className="w-full accent-[#a855f7] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
