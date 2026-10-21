# 🎸 Ocena Technologiczna i Architektura Rozwoju Gryf Guitar

Raport i studium wdrożeniowe dla bibliotek i narzędzi ekosystemu GameDev & WebGL w projekcie Gryf.

---

## 📊 1. Macierz Oceny i Kwalifikacji Repozytoriów

| Repozytorium | Typ / Zastosowanie | Ocena / Tier | Rola w projekcie Gryf | Status wdrożenia |
|---|---|---|---|---|
| **pmndrs/drei** | Three.js / React 19 helpers & components | **S-Tier (10/10)** | **Autostrada Nutowa 3D**: podstrunnica 3D, progi, struny z wibracją, teksty 3D, kamera kinematyczna | **Zainstalowano & Wdrożono prototyp w `Highway3DCanvas.tsx`** |
| **pmndrs/react-postprocessing** | Shadery Bloom, Vignette, Glitch, ToneMapping | **S-Tier (10/10)** | **Klimat Sceniczny Rocksmith**: Selective Bloom na neonowych strunach, rozmycie krawędzi (vignette), wstrząsy | **Zainstalowano & Wdrożono w `Highway3DCanvas.tsx`** |
| **colyseus/colyseus** | Authoritative Multiplayer State Engine (Node/TS) | **S-Tier (10/10)** | **Tryb Pojedynku 1v1 (Guitar Battle) & Jam**: synchronizacja trafień na żywo, sabotaże/ataki, co-op | **Zainstalowano `colyseus.js` & Utworzono architekturę w `src/multiplayer/`** |
| **Alchemist0823/three.quarks** | GPU Particle System Engine dla Three.js | **S-Tier (9.5/10)** | **Efekty Uderzeń & Płomienie**: wybuchy iskier przy "Idealnie!", płonący gryf przy Streak x4, deszcz konfetti | **Zainstalowano w projekcie**, integracja z emiterami cząsteczek |
| **gamedev-skills/awesome-gamedev-agent-skills** | Zbiór promptów i workflow AI dla GameDevu | **A-Tier (8.5/10)** | **Wzorce i Prompty Developerskie**: formuły rzutowania perspektywicznego, kompensacja latencji audio, reguły gry | **Zaadaptowano** wzorce do projektu i instrukcji agentów |
| **Mugen87/yuka** | Game AI: FSM, Steering Behaviors, Goal-Driven | **B-Tier (6.5/10)** | **AI Tłumu & Muzyków (Trasa Koncertowa)**: pogo pod sceną, reakcje basisty i perkusisty na błędy gracza | W kolejce do rozbudowy modułu koncertowego (`TourView`) |
| **pmndrs/react-three-rapier** | Silnik fizyki WASM (Rapier) dla Three.js | **C-Tier (3.0/10)** | **ZBĘDNY DLA AUTOSTRADY NUT**: Nuty na gryfie podlegają czystej trajektorii czasowej $z = (t_{nuty} - t) \cdot v$. Użycie fizyki do detekcji nut wprowadza jitter i opóźnienia niszczące okno 35ms. | **Odrzucone** z głównego silnika rytmicznego |
| **CoderGamester/mcp-unity** | Serwer MCP do edytora Unity Engine | **D-Tier (1.0/10)** | **NIEKOMPATYBILNY**: Gryf to 100% Web Application (React 19 + TypeScript + Web Audio API). Nie korzystamy z Unity Editora. | **Odrzucone** (brak punktu styku z web stackiem) |

---

## 🚀 2. Szczegółowa Analiza Każdego Narzędzia

### 1. `pmndrs/drei` & `@react-three/fiber`
- **Dlaczego to przełom?**
  Dotychczasowy silnik autostrady w Gryfie (`HighwayView.tsx`) opierał się na płaskim Canvasie 2D z matematyczną symulacją perspektywy (`ctx.lineTo()`). Było to rozwiązanie zwinne, ale ograniczone graficznie.
- **Co zyskujemy?**
  Prawdziwy silnik WebGL renderujący podstrunnicę 3D z metalicznymi progami, markerami z masy perłowej, strunami o zmiennej grubości podlegającymi fizycznemu wychyleniu w osi Y podczas drgania oraz kamerą o zmiennej perspektywie reagującą na tempo gry.

### 2. `pmndrs/react-postprocessing`
- **Dlaczego to przełom?**
  Gry muzyczne (Rocksmith, Guitar Hero) swój ikoniczny wygląd zawdzięczają jarzącym się neonowym strunom i pigułkom nutowym. W Canvas 2D funkcja `shadowBlur` drastycznie obniżała liczbę klatek na sekundę. W WebGL shadery Blooma działają bezpośrednio na GPU, gwarantując 120 FPS nawet przy dziesiątkach świecących obiektów.

### 3. `colyseus/colyseus`
- **Dlaczego to przełom?**
  Przekształca Gryfa z aplikacji jednoosobowej w globalną platformę społecznościową:
  - **Pojedynek 1v1 (Guitar Battle)**: Dwóch graczy podłączonych z gitarami gra ten sam utwór.
  - **Mechanika Sabotażu / Ataków**: Wykonanie trudnej frazy w oknie Perfect ładuje pasek ataku, pozwalając wysłać rywalowi przeszkadzajkę (np. `AMP_OVERLOAD` z przesterowanym dźwiękiem i trzęsieniem ekranu, czy `STRING_SNAP`).
  - **Tryb Kooperacji (Band Co-op)**: Wspólne granie – jeden gracz prowadzi partię solową (Lead), drugi partię rytmiczną/basową (Rhythm/Bass).

### 4. `Alchemist0823/three.quarks`
- **Dlaczego to przełom?**
  Obecny system cząsteczek to prosta pętla generująca kółka 2D. `three.quarks` to odpowiednik silnika Shuriken z Unity w Three.js – pozwala na tworzenie zaawansowanych emiterów iskier, smug płomieni ciągnących się za gryfem przy mnożniku x4 i wyładowań elektrycznych na uderzonej strunie.

---

## 🛠️ 3. Zrealizowane Wdrożenie w Kodzie

W ramach natychmiastowych prac wdrożono:
1. **Instalacja zależności S-Tier**:
   `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`, `colyseus.js`, `three.quarks`.
2. **Optymalizacja Chunków Produkcyjnych w `vite.config.ts`**:
   Wydzielono osobne bundler-chunki (`three-vendor`, `postprocessing-vendor`, `colyseus-vendor`), dzięki czemu główny kod aplikacji zajmuje zaledwie **236 kB**.
3. **Komponent `Highway3DCanvas.tsx`**:
   - Prawdziwa podstrunnica 3D (palisander/heban + progi niklowo-srebrne + perłowe markery).
   - 6 neonowych strun 3D z fizyczną animacją drgań `stringVibrations`.
   - Dynamiczne pigułki nutowe 3D z oznaczeniami progów renderowanymi przez SDF Text.
   - Kinematyczna kamera z oddechem i wstrząsami przy wysokim Streak.
   - Płynny selective bloom i winieta sceniczna.
4. **Dwusilnikowy Przełącznik w `HighwayView.tsx`**:
   Użytkownik może w każdej chwili przełączyć się między:
   - `⚡ Silnik 3D (Three.js WebGL)` – pełna immersja koncertowa.
   - `🎯 Tryb 2D (Lekki Canvas)` – dla słabszych laptopów i oszczędzania baterii.
5. **Architektura Multiplayer w `src/multiplayer/`**:
   - `types.ts`: definicje stanu pojedynku `PlayerDuelState`, `DuelRoomState` i ataków `DuelAttackType`.
   - `colyseusClient.ts`: klient Colyseus z automatycznym fallbackiem do symulacji rywala (Ghost/Bot Duel) w trybie offline/lokalnym oraz pełnym API do wysyłania trafień `sendHit` i ataków `sendAttack`.
