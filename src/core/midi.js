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

  parsed.tracks.forEach((track) => {
    let wallTime = 0;

    track.forEach((event) => {
      wallTime += event.deltaTime;

      if (wallTime > highestTime) {
        highestTime = wallTime;
      }
    });
  });

  return ticksToMilliseconds(highestTime, parsed.header.ticksPerBeat, get(bpm)) / 1000;
}

function getNoteLabel(noteNumber) {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(noteNumber / 12) - 1;
  return `${noteNames[noteNumber % 12]}${octave}`;
}

export function getBpmFromMidi(midi) {
  midi.tracks.forEach((track) => {
    track.forEach((event) => {
      if (event.type === "setTempo") {
        let newBpm = 60000000 / event.microsecondsPerBeat;
        return Math.floor(newBpm);
      }
    });
  });
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
      wallTimeInMilliseconds = ticksToMilliseconds(wallTime, midi.header.ticksPerBeat, get(bpm));

      if (event.type === "noteOn") {
        notes.push({
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

        note.duration = wallTimeInMilliseconds - note?.start;
      }
    });
  });

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

export function midiNoteToFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function noteLabel(midiNoteNumber) {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midiNoteNumber / 12) - 1;
  return `${noteNames[midiNoteNumber % 12]}${octave}`;
}
