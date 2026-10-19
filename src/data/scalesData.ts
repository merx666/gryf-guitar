export interface ScaleDefinition {
  id: string;
  name: string;
  description: string;
  intervals: number[]; // półtony od prymy (0 = root)
}

export const SCALES: ScaleDefinition[] = [
  {
    id: 'minor-pentatonic',
    name: 'Pentatonika Molowa',
    description: 'Absolutny fundament rocka i bluesa. 5 dźwięków, które zawsze brzmią dobrze w solówkach.',
    intervals: [0, 3, 5, 7, 10],
  },
  {
    id: 'blues-scale',
    name: 'Skala Bluesowa',
    description: 'Pentatonika molowa z dodaną "blue note" (tryton / kwinta zmniejszona), dająca charakterystyczny brudny pazur.',
    intervals: [0, 3, 5, 6, 7, 10],
  },
  {
    id: 'major-pentatonic',
    name: 'Pentatonika Durowa',
    description: 'Jasna, melodyjna skala używana w country, southern rocku i melodyjnych solówkach rockowych.',
    intervals: [0, 2, 4, 7, 9],
  },
  {
    id: 'natural-minor',
    name: 'Skala Molowa Naturalna (Eolska)',
    description: 'Klasyczna skala molowa o nostalgicznym, głębokim zabarwieniu (m.in. Metallica, Iron Maiden).',
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  {
    id: 'major-scale',
    name: 'Skala Durowa (Jońska)',
    description: 'Pełna 7-stopniowa skala durowa – podstawa harmonii zachodniej.',
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  {
    id: 'dorian',
    name: 'Skala Dorycka',
    description: 'Skala molowa z podwyższonym 6. stopniem – brzmienie Carlosa Santany, Pink Floyd i jazz-rocka.',
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
];

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const OPEN_STRING_NOTES = ['E', 'A', 'D', 'G', 'B', 'E']; // od struny 6 do 1

export function getNoteAtFret(stringIndex: number, fret: number): { note: string; midi: number } {
  // Struna 0: E2 (40), 1: A2 (45), 2: D3 (50), 3: G3 (55), 4: B3 (59), 5: E4 (64)
  const baseMidi = [40, 45, 50, 55, 59, 64][stringIndex];
  const midi = baseMidi + fret;
  const noteIndex = ((midi % 12) + 12) % 12;
  return { note: ROOT_NOTES[noteIndex], midi };
}
