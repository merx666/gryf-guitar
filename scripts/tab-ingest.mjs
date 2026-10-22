#!/usr/bin/env node

/**
 * Gryf Tab Ingestion & Workflow Pipeline
 * Converts ASCII guitar tabs into validated NoteHit[] sequences for Gryf.
 *
 * Usage:
 *   node scripts/tab-ingest.mjs --bpm 110 --demo
 */

const STRING_MAP = {
  'e': 5,
  'B': 4,
  'b': 4,
  'G': 3,
  'g': 3,
  'D': 2,
  'd': 2,
  'A': 1,
  'a': 1,
  'E': 0,
};

export function parseAsciiTab(tabText, bpm = 120, subdivision = 4) {
  const lines = tabText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const trackStrings = {};

  for (const line of lines) {
    // Match line header like "e|", "B|", "D|" or "D:"
    const match = line.match(/^([eEbBgGdDaA])\s*[:|](.+)/);
    if (match) {
      const char = match[1];
      const stringIdx = STRING_MAP[char];
      if (stringIdx !== undefined) {
        // Strip ending bar "|"
        let track = match[2].trimEnd();
        if (track.endsWith('|')) track = track.slice(0, -1);
        trackStrings[stringIdx] = track;
      }
    }
  }

  const stringKeys = Object.keys(trackStrings).map(Number);
  if (stringKeys.length === 0) {
    throw new Error('No valid tab lines found. Expected format: "e|---0-3-5---|"');
  }

  const maxLen = Math.max(...Object.values(trackStrings).map(s => s.length));
  const stepTime = 60 / (bpm * subdivision); // seconds per column character
  const notes = [];

  for (let col = 0; col < maxLen; col++) {
    for (const sIdx of [0, 1, 2, 3, 4, 5]) {
      const lineStr = trackStrings[sIdx];
      if (!lineStr || col >= lineStr.length) continue;

      const char = lineStr[col];
      if (/\d/.test(char)) {
        // Skip second digit if this was part of a 2-digit fret
        if (col > 0 && /\d/.test(lineStr[col - 1])) {
          continue;
        }

        let fret = parseInt(char, 10);
        let digits = 1;
        if (col + 1 < lineStr.length && /\d/.test(lineStr[col + 1])) {
          fret = parseInt(char + lineStr[col + 1], 10);
          digits = 2;
        }

        const time = Number((col * stepTime).toFixed(3));
        const duration = Number((stepTime * 3).toFixed(3));

        // Technique detection
        let technique = 'pick';
        const nextChar = lineStr[col + digits];
        if (nextChar === 'h') technique = 'hammer';
        else if (nextChar === 'p') technique = 'pull';
        else if (nextChar === '/') technique = 'slide';
        else if (nextChar === 'b') technique = 'bend';
        else if (nextChar === 'v' || nextChar === '~') technique = 'harmonic';

        notes.push({
          string: sIdx,
          fret,
          time,
          duration,
          technique
        });
      }
    }
  }

  // Deduplicate and sort by timestamp
  notes.sort((a, b) => a.time - b.time || a.string - b.string);

  return notes;
}

// CLI Execution
if (process.argv[1]?.endsWith('tab-ingest.mjs')) {
  const args = process.argv.slice(2);
  const isDemo = args.includes('--demo') || args.length === 0;
  const bpmIdx = args.indexOf('--bpm');
  const bpm = bpmIdx !== -1 ? parseInt(args[bpmIdx + 1], 10) : 110;

  if (isDemo) {
    const smokeOnTheWater = `
e|---------------------------------------------------------|
B|---------------------------------------------------------|
G|---------------------------------------------------------|
D|--0---3---5----0---3---6-5----0---3---5----3---0---------|
A|--0---3---5----0---3---6-5----0---3---5----3---0---------|
E|---------------------------------------------------------|
`;
    console.log('🎸 Parsing Demo Tab (Deep Purple - Smoke on the Water intro powerchords):');
    const result = parseAsciiTab(smokeOnTheWater, bpm, 4);
    console.log(`✅ Extracted ${result.length} note hits:`);
    console.log(JSON.stringify(result.slice(0, 10), null, 2));
    console.log(`... and ${result.length - 10} more hits.`);
  }
}
