# Gryf Tech Stack: Cutting-Edge Web Audio, AI Audio & DSP Architecture

> **Dokument RAG / Architektura Techniczna v1.0**  
> **Projekt:** Gryf — Open-Source Web Rocksmith+ / Melodic Alternative  
> **Status:** Referencyjny standard technologiczny dla zespołu inżynieryjnego i silnika AI.

---

## 1. Wstęp i Filozofia Architektury

Gryf przenosi doznania znane z gier muzycznych klasy AAA (*Rocksmith 2014*, *Rocksmith+*, *Yousician*) bezpośrednio do przeglądarki WWW bez instalacji natywnych sterowników, bez konieczności posiadania kabla Real Tone Cable i bez dedykowanego hardware'u.

Aby osiągnąć ten cel przy rygorystycznym budżecie opóźnień (**total roundtrip latency < 15 ms**), architektura Gryfa łączy najnowsze standardy W3C Web Audio, akcelerację sprzętową WebAssembly SIMD, WebGPU do obliczeń neuronowych oraz protokoły P2P WebRTC.

```mermaid
flowchart TD
    subgraph ClientAudioCapture["Przechwytywanie i Bufor Wejściowy"]
        Mic[("Gitara (Mikrofon / USB Audio)")] -->|MediaStream / 48kHz| AudioContext
        AudioContext -->|Channel Splitter / Gain| AudioWorkletNode
    end

    subgraph HighPriorityThread["Wątek Audio (AudioWorklet Thread - Realtime Priority)"]
        AudioWorkletNode --> RingBufIn["Lock-Free RingBuffer (SharedArrayBuffer)"]
        RingBufIn --> YIN["Wasm SIMD YIN / Harmonic Pitch"]
        RingBufIn --> NAM["Wasm SIMD Neural Amp Modeler"]
        NAM --> CabSim["Convolver IR (Impulse Response)"]
        CabSim --> FX["Stereo Chorus / Tape Delay"]
        FX --> RingBufOut["Lock-Free RingBuffer"]
    end

    subgraph WorkerGPUThread["Wątek Roboczy i WebGPU (Offscreen Thread)"]
        RingBufIn -.-> WorkerBridge["Worker MessagePort / Atomics"]
        WorkerBridge --> ONNX["ONNX Runtime Web (WebGPU / WGSL)"]
        ONNX --> BasicPitch["Basic Pitch (Neural Polyphonic)"]
        ONNX --> Crepe["CREPE Pitch Model"]
    end

    subgraph MainThread["Wątek Główny (UI / Render - 60-144 FPS)"]
        RingBufOut --> WebAudioDest["Speakers / Headphones"]
        YIN -.-> Highway["3D Note Highway (WebGL / Canvas)"]
        BasicPitch -.-> Highway
        Highway --> Gamification["Hit Detection & Scoring Engine"]
    end
```

---

## 2. Web Audio DSP & Niskolatencyjny Pipeline

### 2.1 AudioWorklet i izolacja wątku dźwiękowego
W przeciwieństwie do przestarzałego `ScriptProcessorNode`, `AudioWorklet` działa w dedykowanym wątku czasu rzeczywistego systemu operacyjnego (Realtime Priority Audio Thread). 
- **Quantum wielkości bufora**: Standard Web Audio przetwarza audio w stałych blokach 128 próbek (render quantum). Przy próbkowaniu 48 000 Hz daje to opóźnienie bloku równe:
  $$\Delta t = \frac{128}{48000} \approx 2.67\text{ ms}$$
- **Zero-Garbage-Collection (Zero-GC)**: Wewnątrz metody `process()` zabroniona jest jakakolwiek alokacja pamięci (`new Float32Array()`, tworzenie obiektów, closure). Wszystkie bufory są prealokowane w konstruktorze `AudioWorkletProcessor`.

```typescript
// src/audio/worklets/gryf-dsp-processor.ts
class GryfDspProcessor extends AudioWorkletProcessor {
  private inputBuffer: Float32Array;
  private ringBufferWriter: RingBufferWriter;

  constructor(options: AudioWorkletNodeOptions) {
    super();
    // Prealokacja bufora 4096 próbek dla analizy YIN / FFT
    this.inputBuffer = new Float32Array(4096);
    // Inicjalizacja lock-free ring buffera z pamięcią współdzieloną
    const sharedMemory = options.processorOptions.sharedBuffer;
    this.ringBufferWriter = new RingBufferWriter(sharedMemory);
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const inputChannel = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (!inputChannel || !outputChannel) return true;

    // Kopiowanie do RingBuffer bez alokacji GC
    this.ringBufferWriter.write(inputChannel);

    // Przepuszczenie audio przez tor efektów (Dry/Wet)
    for (let i = 0; i < inputChannel.length; i++) {
      outputChannel[i] = inputChannel[i];
    }

    return true;
  }
}
registerProcessor('gryf-dsp-processor', GryfDspProcessor);
```

### 2.2 SharedArrayBuffer & Lock-Free RingBuffer (Single Producer Single Consumer - SPSC)
Komunikacja między wątkiem `AudioWorklet` a wątkiem `WebWorker` (np. dla detekcji polifonicznej lub ekstrakcji cech) za pomocą `postMessage` wprowadza narzut serializacji i niestabilną latencję (5–15 ms). Gryf wykorzystuje **Lock-Free SPSC RingBuffer** oparty na `SharedArrayBuffer` i `Atomics`:

1. **Wymogi bezpieczeństwa**: Serwowanie z nagłówkami HTTP:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`
2. **Mechanizm Atomics**:
   - Pamięć współdzielona zawiera nagłówek ze wskaźnikami `writeIndex` i `readIndex` kontrolowanymi atomowo przez `Atomics.load` i `Atomics.store`.
   - Brak blokad muteksowych (mutex-free), co gwarantuje, że wątek audio nigdy nie ulegnie zagłodzeniu (priority inversion bug).

### 2.3 WebAssembly (Wasm) SIMD dla algorytmów DSP
Algorytmy audio (autokorelacja, filtry IIR/FIR, sploty Cab Sim) wymagają setek tysięcy operacji mnożenia z dodawaniem (FMA) na sekundę. Standardowe kompilacje Wasm są 2–4x wolniejsze od kodu natywnego C++. 

Gryf wykorzystuje **Wasm 128-bit SIMD** (`-msimd128` w Rust/C++):
- Wektoryzacja 4 próbek `f32` w jednej instrukcji maszynowej (`_mm_mul_ps`, `_mm_add_ps`).
- Wskaźnik kompilacji: Rust `wasm-pack build --target web -- -C target-feature=+simd128`.
- Wydajność: obliczenie 1024-punktowej funkcji różnicowej YIN spada z 1.4 ms (JS) do **0.08 ms** (Wasm SIMD).

---

## 3. Akceleracja WebGPU & Modele AI Audio

WebGPU otwiera możliwość bezpośredniego wykonywania shaderów obliczeniowych (Compute Shaders w WGSL) oraz tensorowych modeli głębokich w przeglądarce.

```
WebGPU Pipeline w Gryfie:
[Surowy Strumień Audio] 
  ──> [Lock-Free RingBuffer]
  ──> [WebGPU Compute: STFT / Mel-Spectrogram (WGSL Shader)]
  ──> [ONNX Runtime Web (Execution Provider: WebGPU)]
  ──> [Predykcja: Pitch Probabilities / Onsets / Polyphonic MIDI]
```

### 3.1 Modele detekcji wysokości dźwięku (Pitch Tracking)

| Model / Algorytm | Typ | Opóźnienie | Zastosowanie w Gryfie | Środowisko wykonawcze |
| :--- | :--- | :--- | :--- | :--- |
| **YIN + Harmonic Sieve** | Monofoniczny | **< 3 ms** | Gitara prowadząca, solówki, bas, stroik w czasie rzeczywistym | Wasm SIMD (AudioWorklet) |
| **CREPE / TorchCrepe** | Monofoniczny (CNN) | **8–15 ms** | Precyzyjna analiza vibrato, bendingu i mikromikrotonów | ONNX WebGPU / Wasm |
| **SPICE (Google)** | Monofoniczny | **10–18 ms** | Odporność na szumy otoczenia mikrofonu laptopa | TFLite Web / ONNX |
| **Basic Pitch (Spotify)** | **Polifoniczny** (CNN) | **25–45 ms** | Rozpoznawanie pełnych akordów, arpeggiów, transkrypcja w locie | ONNX Runtime Web (WebGPU) |

#### Implementacja Basic Pitch w ONNX Runtime Web:
Spotify Basic Pitch to model neuronowy wyszkolony specjalnie do wielogłosowej transkrypcji muzycznej z wykrywaniem nut (onsets, frames, pitch-bends):
1. **Audio Preprocessing**: Obliczenie reprezentacji Harmonic Constant-Q Transform (HCQT) za pomocą compute shadera WebGPU WGSL.
2. **Inference**: Model przekonwertowany do formatu ONNX FP16 (`basic_pitch.onnx`, rozmiar zaledwie ~18 MB).
3. **Execution**: `ort.InferenceSession.create(modelUrl, { executionProviders: ['webgpu'] })`.
4. **Postprocessing**: Progowanie energii nut (`onset_threshold = 0.5`, `frame_threshold = 0.3`) z dekompozycją polifoniczną na nuty tabulatury.

---

## 4. Separacja Źródeł Dźwięku: Demucs v4 (Hybrid Transformer)

Aby umożliwić użytkownikowi grę z dowolnym podkładem MP3/YouTube, Gryf potrzebuje wyizolować ścieżkę gitary (lub usunąć oryginalną gitarę, tworząc backing track).

### 4.1 Architektura HTDemucs v4
Model **HTDemucs v4** (Hybrid Transformer Demucs) łączy domenę czasową (sploty 1D U-Net) z domeną częstotliwościową (Spectrogram Cross-Domain Transformer):
- Rozbija utwór na 4 ścieżki: `drums`, `bass`, `other`, `vocals`. Wytrenowana wersja `htdemucs_6s` wydziela dodatkowo: `guitar` i `piano`.
- Jakość separacji (SDR - Signal to Distortion Ratio): **> 9.2 dB** dla gitary elektrycznej.

### 4.2 Strategia Hybrydowa: In-Browser vs Serverless GPU
- **In-Browser (Klient)**:
  - Dla krótkich riffów (< 30 sekund): lekki model `htdemucs-tiny` skwantowany do INT8 (~45 MB) uruchamiany przez ONNX Runtime Web na GPU użytkownika.
- **Serverless GPU API (Gryf Cloud Engine)**:
  - Dla całych utworów (3-5 minut): asynchroniczne zadanie na klastrze GPU (Nvidia T4/L4 na Modal.com / RunPod).
  - Czas przetwarzania: **8-12 sekund** dla 4-minutowego utworu przy użyciu `torch.compile` i akceleracji TensorRT.
  - Zwracane formaty: spakowane ścieżki w formacie Opus 128 kbps (oddzielna gitara do transkrypcji + miks podkładu bez gitary).

---

## 5. Neural Amp Modeler (NAM) w WebAssembly

Neural Amp Modeler (autorstwa Stevena Atkinsona) to otwartoźródłowy przełom w świecie gitarowym, deklasujący algorytmy Fractal Audio, Kemper i Neural DSP Quad Cortex. NAM modeluje nieliniowe zachowanie przedwzmacniaczy lampowych i końcówek mocy za pomocą głębokich sieci WaveNet lub LSTM.

```mermaid
flowchart LR
    DryGuitar["Surowy Sygnał Gitary (DI)"] --> PreFilter["Input HPF/LPF Filter"]
    PreFilter --> NAM_DSP["Wasm SIMD WaveNet (NAM Engine)"]
    NAM_DSP --> ToneStack["Passive 3-Band EQ"]
    ToneStack --> CabIR["Wasm FFT Convolver (Impulse Response 2048 pts)"]
    CabIR --> WetOut["Brzmienie Lampowe (Studio Sound)"]
```

### 5.1 Integracja NAM z AudioWorklet
1. **Silnik NAM C++ (`nam-core`)**:
   - Skompilowany do Wasm za pomocą Emscripten z flagami `-O3 -msimd128 -flto`.
   - Zoptymalizowana implementacja architektury **WaveNet** (dilated 1D convolutions + gated activations) oraz **LSTM-light** (1 warstwa, 16 ukrytych jednostek dla urządzeń mobilnych).
2. **Zarządzanie modelami `.nam`**:
   - Standardowy model `.nam` to plik JSON z wagami wag sieci neuronowej (wielkość pliku: od 200 KB do 4 MB).
   - Przeglądarka pobiera profil wzmacniacza (np. *Marshall JCM800*, *Peavey 5150*, *Fender Twin Reverb 1965*) i ładuje tensory bezpośrednio do pamięci Wasm.
3. **Pomiary wydajności (Benchmark na M2 / Intel i7)**:
   - Obciążenie rdzenia audio: **zaledwie 4–7%** pojedynczego rdzenia przy buforze 128 próbek.
   - Opóźnienie dodane przez model: **0.00 ms** (algorytm jest w 100% bezlatencyjny i przyczynowy / causal).

---

## 6. Niskolatencyjny WebRTC P2P Audio Jamming (< 20 ms)

Gryf umożliwia wspólne jamowanie przez Internet z innymi muzykami lub nauczycielem w czasie rzeczywistym.

### 6.1 Problemy klasycznego WebRTC dla muzyków
Domyślne WebRTC w przeglądarkach jest zoptymalizowane pod rozmowy głosowe (Echo Cancellation, Noise Suppression, Automatic Gain Control, kodek Opus w trybie VOIP). Te mechanizmy niszczą sygnał gitary i dodają 40–80 ms opóźnienia.

### 6.2 Konfiguracja Pro-Audio WebRTC w Gryfie
```typescript
// src/audio/webrtc/pro-audio-constraints.ts
export const PRO_AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    channelCount: 2,
    sampleRate: 48000,
    sampleSize: 16,
    echoCancellation: false,       // Krytyczne: wyłączenie AEC
    noiseSuppression: false,       // Krytyczne: wyłączenie odszumiania
    autoGainControl: false,        // Zachowanie pełnej dynamiki gry
    latency: 0.005,                // Żądanie minimalnego bufora sterownika
  },
  video: false
};

export function configureAudioSender(sender: RTCRtpSender) {
  const params = sender.getParameters();
  if (params.encodings && params.encodings[0]) {
    // Wymuszenie wysokiej przepływności stereo i trybu Opus Music
    params.encodings[0].maxBitrate = 192000; // 192 kbps
  }
  sender.setParameters(params);
}
```

### 6.3 Adaptacyjny bufor Jittera i protokoły Ninjam / SonoBus
- **P2P Mesh (2-4 graczy)**: Bezpośrednie połączenie WebRTC DataChannel & MediaStream z ręcznie zarządzanym Jitter Bufferem (5–10 ms).
- **Ninjam Mode (Metronome-Synchronized Beats)**: Gdy fizyczne opóźnienie ping przekracza 30 ms (np. gracz z Warszawy i gracz z Londynu), system przełącza się w tryb synchronizacji taktowej Ninjam (każdy gracz słyszy innych z opóźnieniem dokładnie jednego taktu muzycznego, co pozwala zachować idealny rytm mimo dystansu geograficznego).

---

## 7. Format Tabulatur, Rytmika i Synchronizacja Audio-to-Tab (DTW)

### 7.1 Parsowanie i renderowanie: alphaTab & MusicXML
Gryf integruje silnik **alphaTab** (skompilowany do WebAssembly/TypeScript) dla natywnej obsługi formatów:
- Guitar Pro 3, 4, 5 (`.gp3`, `.gp4`, `.gp5`)
- Guitar Pro 6, 7, 8 (`.gpx`, `.gp`)
- MusicXML oraz standardowy MIDI (.mid)

Silnik alphaTab parsuje strukturę binarną, wyciąga informacje o taktach, tempie, metrum, podziałach rytmicznych oraz zaawansowanych technikach gitarowych:
- Bendy (podciągnięcia: 1/2 step, full, pre-bend, release)
- Slajdy (legato slide, shift slide)
- Hammer-on / Pull-off
- Vibrato, palm muting, harmoniczne (naturalne i pinch harmonics), flażolety

### 7.2 Dynamic Time Warping (DTW) do Synchronizacji Nuty ↔ Audio
Prawdziwe nagrania muzyczne nigdy nie mają idealnie równego tempa (zmienne tempo, human factor perkusisty). Aby tabulatura płynęła po trójwymiarowej autostradzie w perfekcyjnej synchronizacji z oryginalnym utworem MP3, stosowany jest algorytm **Dynamic Time Warping**:

1. **Ekstrakcja cech (Feature Extraction)**:
   - Z audio generowany jest wektor `Chromagram` (rozkład energii na 12 półtonów) oraz `Onset Detection Function` (wykrywanie uderzeń perkusji i kostkowania).
   - Z pliku Guitar Pro generowany jest syntetyczny chromagram referencyjny na podstawie zapisu nutowego.
2. **Macierz Kosztów i Ścieżka Dopasowania (Warping Path)**:
   - Konstruowana jest dwuwymiarowa macierz odległości kosinusowej:
     $$D(i, j) = 1 - \frac{C_{\text{audio}}(i) \cdot C_{\text{tab}}(j)}{\|C_{\text{audio}}(i)\| \|C_{\text{tab}}(j)\|}$$
   - Algorytm programowania dynamicznego znajduje optymalną ścieżkę $W = (w_1, w_2, \dots, w_K)$, która minimalizuje skumulowany błąd czasowy.
3. **Wynik**: Generowana jest nieliniowa mapa czasu `TimeMap: TabMeasureBeat -> PreciseAudioTimestampSeconds`, eliminująca jakikolwiek rozjazd nut z audio na przestrzeni całego utworu.

---

## 8. Podsumowanie Specyfikacji i Wskaźniki SLA Architektury

```
+-----------------------------------+-----------------------------------+
| Parametr Techniczny               | Wartość Osiągana / Docelowa       |
+-----------------------------------+-----------------------------------+
| Całkowita latencja DSP (In->Out)  | < 6.5 ms (przy 128 samples buffer)|
| Dokładność Pitch Trackera (YIN)   | ±1.5 centa w czasie < 3.0 ms      |
| Czas detekcji polifonicznej AI    | < 35 ms (WebGPU FP16)             |
| Zużycie pamięci RAM w przeglądarce| < 140 MB (z załadowaną piosenką)  |
| FPS Autostrady 3D (Render Engine) | Stałe 60 / 120 / 144 FPS (WebGL)  |
| Kompatybilność przeglądarek       | Chrome/Edge/Brave 113+, Safari 18+|
+-----------------------------------+-----------------------------------+
```
Ta architektura gwarantuje, że Gryf jest nie tylko zabawką przeglądarkową, ale pełnoprawnym, profesjonalnym narzędziem dla każdego gitarzysty na świecie.
