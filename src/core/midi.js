import * as midiManager from "midi-file";
import { bpm, timeToPixels } from "./store.js";
import { get } from "svelte/store";

export async function createMidiClipFromUrl(url, clipName = "unnamed") {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const parsed = midiManager.parseMidi(data);

  // Create a new clip
  const clip = {
    id: crypto.randomUUID(),
    type: "midi",
    name: clipName,
    startTime: 0,
    duration: getDurationFromMidi(parsed),
    midiData: parsed,
  };

  return clip;
}

export async function createMidiClipFromFile(file) {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const parsed = midiManager.parseMidi(data);

  // Create a new clip
  const clip = {
    id: crypto.randomUUID(),
    name: file.name,
    startTime: 0,
    duration: getDurationFromMidi(parsed),
    midiData: parsed,
    type: "midi",
  };

  return clip;
}

export function ticksToMilliseconds(ticks, ticksPerBeat, bpm) {
  return (ticks / ticksPerBeat) * (60000 / bpm);
}

function getDurationFromMidi(parsed) {
  let highestTime = 0;
  let trackBpm = getBpmFromMidi(parsed) ?? 100;

  parsed.tracks.forEach((track) => {
    let wallTime = 0;

    track.forEach((event) => {
      wallTime += event.deltaTime;

      if (wallTime > highestTime) {
        highestTime = wallTime;
      }
    });
  });

  return ticksToMilliseconds(highestTime, parsed.header.ticksPerBeat, trackBpm) / 1000;
}

export function noteToOctave(note) {
  return Math.floor(note / 12) - 1;
}

function getNoteLabel(noteNumber, includeOctave = true) {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const noteName = noteNames[noteNumber % 12];

  if (includeOctave) {
    const octave = noteToOctave(noteNumber);
    return `${noteName}${octave}`;
  }

  return noteName;
}

export function getBpmFromMidi(midi) {
  for (let track of midi.tracks) {
    for (let event of track) {
      if (event.type === "setTempo") {
        return Math.floor(60000000 / event.microsecondsPerBeat);
      }
    }
  }
}

export function extractNoteEvents(midi) {
  let notes = [];

  midi.tracks.forEach((track) => {
    let wallTime = 0;
    let wallTimeInMilliseconds = 0;

    let trackName = track.find((event) => event.type === "trackName")?.text || "Unnamed";

    track.forEach((event) => {
      // Timing
      wallTime += event.deltaTime;
      wallTimeInMilliseconds = ticksToMilliseconds(wallTime, midi.header.ticksPerBeat, parseInt(get(bpm)));

      if (event.type === "noteOn") {
        notes.push({
          uuid: crypto.randomUUID(),
          track: trackName,
          note: event.noteNumber,
          label: getNoteLabel(event.noteNumber),
          velocity: event.velocity,
          start: wallTimeInMilliseconds,
          duration: 0, // will be changed later
        });
      }

      if (event.type === "noteOff") {
        let note = notes
          .filter((note) => note.start < wallTimeInMilliseconds && note.duration === 0)
          .find((note) => note.note === event.noteNumber);

        if (note) {
          note.duration = wallTimeInMilliseconds - note?.start;
        }
      }
    });
  });

  notes = notes.sort((a, b) => a.start - b.start);

  return notes;
}

export function renderMidiToSvg(midiData) {
  let highestTime = 0;
  let duration = 0;
  let notes = [];

  midiData.tracks.forEach((track) => {
    let wallTime = 0;
    let wallTimeInMilliseconds = 0;

    track.forEach((event) => {
      wallTime += event.deltaTime;
      wallTimeInMilliseconds = ticksToMilliseconds(wallTime, midiData.header.ticksPerBeat, get(bpm));

      if (event.type === "noteOn") {
        notes.push({
          note: event.noteNumber,
          velocity: event.velocity,
          start: wallTimeInMilliseconds,
          tickOffset: wallTime,
          duration: 0, // will be changed later
        });
      }

      if (event.type === "noteOff") {
        let note = notes
          .filter((note) => note.start < wallTimeInMilliseconds && note.duration === 0)
          .find((note) => note.note === event.noteNumber);

        if (note) {
          note.duration = wallTimeInMilliseconds - note?.start;
        }
      }
    });

    if (wallTimeInMilliseconds > highestTime) {
      highestTime = wallTimeInMilliseconds;
    }
  });

  duration = highestTime + notes[notes.length - 1].duration;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-full w-full" viewBox="0 0 ${duration} 100" preserveAspectRatio="none">`;

  let wip = get(timeToPixels);

  notes.forEach((note) => {
    console.log();
    svg += `<rect x="${wip(note.start / 10000)}" y="${127 - note.note}" width="${wip(note.duration / 10000)}" height="3" fill="currentColor" />`;
  });

  svg += `</svg>`;

  return svg;
}

export function isBlackKey(note) {
  const key = note % 12;
  // These represent the black keys on a piano (C#, D#, F#, G#, A#)
  return [1, 3, 6, 8, 10].includes(key);
}

export function midiNoteToFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function frequencyToMidiNote(frequency) {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

export function noteOctave(midiNoteNumber) {
  return Math.floor(midiNoteNumber / 12) - 1;
}

export function noteLabel(midiNoteNumber) {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midiNoteNumber / 12) - 1;
  return `${noteNames[midiNoteNumber % 12]}${octave}`;
}

export const frequencies = {
  "C2": 65.41,
  "C#2": 69.3,
  "D2": 73.42,
  "D#2": 77.78,
  "E2": 82.41,
  "F2": 87.31,
  "F#2": 92.5,
  "G2": 98.0,
  "G#2": 103.83,
  "A2": 110.0,
  "A#2": 116.54,
  "B2": 123.47,
  "C3": 130.81,
  "C#3": 138.59,
  "D3": 146.83,
  "D#3": 155.56,
  "E3": 164.81,
  "F3": 174.61,
  "F#3": 185.0,
  "G3": 196.0,
  "G#3": 207.65,
  "A3": 220.0,
  "A#3": 233.08,
  "B3": 246.94,
  "C4": 261.63,
  "C#4": 277.18,
  "D4": 293.66,
  "D#4": 311.13,
  "E4": 329.63,
  "F4": 349.23,
  "F#4": 369.99,
  "G4": 392.0,
  "G#4": 415.3,
  "A4": 440.0,
  "A#4": 466.16,
  "B4": 493.88,
  "C5": 523.25,
  "C#5": 554.37,
  "D5": 587.33,
  "D#5": 622.25,
  "E5": 659.25,
  "F5": 698.46,
  "F#5": 739.99,
  "G5": 783.99,
  "G#5": 830.61,
  "A5": 880.0,
  "A#5": 932.33,
  "B5": 987.77,
  "C6": 1046.5,
  "C#6": 1108.73,
  "D6": 1174.66,
  "D#6": 1244.51,
  "E6": 1318.51,
};
