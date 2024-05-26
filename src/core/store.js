/**
 * @typedef {Object} Track
 * @property {string} id - Unique identifier for the track.
 * @property {string} name - Name of the track.
 * @property {"audio"|"instrument"} type - Type of the track (e.g., 'audio', 'midi').
 * @property {boolean} isMuted - Whether the track is muted.
 * @property {boolean} isSolo - Whether the track is soloed.
 * @property {Clip[]} clips - Array of clips in the track.
 */

/**
 * @typedef {Object} Clip
 * @property {string} id - Unique identifier for the clip.
 * @property {"audio"|"midi"} type - Type of the clip (e.g., 'audio', 'midi').
 * @property {string} name - Name of the clip.
 * @property {string} audioUrl - URL of the audio file (for sample clips).
 * @property {number} startTime - Start time of the clip in seconds.
 * @property {number} duration - Duration of the clip in seconds.
 * @property {AudioBuffer} audioBuffer - Audio buffer for the clip (if preloaded).
 * @property {import("midi-file").MidiData} midiData - Parsed midi data
 * @property {MidiNote[]} notes - Array of midi notes.
 */

/**
 * @typedef {Object} MidiNote
 * @property {string} track - Track name
 * @property {string} label - Note label (e.g., 'C4', 'D#5').
 * @property {number} note - The MIDI note number. (0 - 127)
 * @property {number} velocity - The velocity of the note (0 - 127)
 * @property {number} start - The start time of the event in milliseconds.
 * @property {number} duration - The duration of the event in milliseconds.
 */

// noinspection JSUnusedGlobalSymbols

import { derived, get, writable } from "svelte/store";
import {
  createDeepHousePattern,
  createDrumPattern,
  createStepSequencerPattern,
  createTranceEDMPattern,
} from "../utils/drumpattern.js";
import { audioManager } from "./audio.js";
import { loadFromLocalStorage, saveToLocalStorage } from "./local.js";
import { extractNoteEvents, midiNoteToFrequency } from "./midi.js";
import { Synth } from "../instruments/synth.js";

export const PIXELS_PER_BEAT = 10;
export const ZOOM_FACTOR = 0.05;

export const demoMidiFiles = writable([
  { label: "Ayla - Ayla (Veracocha Remix)", file: "/midi/ayla.mid" },
  { label: "A-Lusion meets Scope DJ - Between Worlds", file: "/midi/between-worlds.mid" },
  { label: "Cosmic Gate - Come With Me", file: "/midi/come-with-me.mid" },
  { label: "Witness Of Wonder - Emotion In Motion (Thrillseekers Remix)", file: "/midi/emotions.mid" },
  { label: "Flutlicht - Icarus", file: "/midi/icarus.mid" },
  { label: "Abject - In Our Memories ", file: "/midi/in-our-memories.mid" },
  { label: "Dash Berlin - Man On The Run (intro)", file: "/midi/man-on-the-run.mid" },
  { label: "Dash Berlin - Man On The Run (full) ", file: "/midi/man-on-the-run-long.mid" },
  { label: "Nu NRG - Moon Loves The Sun", file: "/midi/moon-loves-the-sun.mid" },
  { label: "Nu NRG - Moon Loves The Sun (full)", file: "/midi/moon-loves-the-sun-full.mid" },
  { label: "System F - Out Of The Blue", file: "/midi/system-f-out-of-e-blue.midi" },
  { label: "William Orbit - Adagio For Strings", file: "/midi/orbit-adagio.mid" },
  { label: "B-Front & DV8 - We Will Never Break", file: "/midi/we-will-never-break-wish-outdoor.mid" },
]);

export const loopRegion = writable({ start: 0, end: 0, active: false });
export const playbackState = writable({
  playing: false,
  currentTime: 0,
  accumulatedTime: 0,
});

export const masterVolume = writable(loadFromLocalStorage("masterVolume", 1));
export const masterPan = writable(loadFromLocalStorage("masterPan", 0));

export const bpm = writable(loadFromLocalStorage("bpm", 140));
export const zoomLevel = writable(loadFromLocalStorage("zoomLevel", 50));
export const selectedClip = writable(loadFromLocalStorage("selectedClip", null));
export const selectedTrack = writable(loadFromLocalStorage("selectedTrack", 0));
export const selectedInstrument = writable(null);
export const currentView = writable(loadFromLocalStorage("currentView", "timeline"));

export const tracks = writable(loadFromLocalStorage("tracks", []));

tracks.subscribe((value) => {
  saveToLocalStorage(
    "tracks",
    value.map((track) => {
      return {
        ...track,
        clips: track.clips.map((clip) => {
          return { ...clip, audioBuffer: null };
        }),
      };
    }),
  );
});

masterVolume.subscribe((value) => saveToLocalStorage("masterVolume", value));
masterPan.subscribe((value) => saveToLocalStorage("masterPan", value));
bpm.subscribe((value) => saveToLocalStorage("bpm", value));
zoomLevel.subscribe((value) => saveToLocalStorage("zoomLevel", value));
selectedClip.subscribe((value) => saveToLocalStorage("selectedClip", value));
selectedTrack.subscribe((value) => saveToLocalStorage("selectedTrack", value));
currentView.subscribe((value) => saveToLocalStorage("currentView", value));

export const toggleView = () => {
  currentView.update((view) => (view === "timeline" ? "midi" : "timeline"));
};

export const openMidiEditorView = () => currentView.update((view) => "midi");
export const openTimelineView = () => currentView.update((view) => "timeline");
export const switchView = (newView) => currentView.update((view) => newView);

masterVolume.subscribe(($masterVolume) => {
  audioManager.mixer.gain.value = $masterVolume;
});

masterPan.subscribe(($masterPan) => {
  audioManager.panNode.pan.value = $masterPan;
});

export const pixelsPerBeat = derived([bpm, zoomLevel], ([$bpm, $zoomLevel]) => {
  return PIXELS_PER_BEAT * $zoomLevel;
});

export const subdivisionsPerBeat = 4;
export const pixelsPerBar = derived(pixelsPerBeat, ($pixelsPerBeat) => {
  return $pixelsPerBeat * subdivisionsPerBeat;
});

export const timeToPixels = derived([bpm, zoomLevel], ([$bpm, $zoomLevel]) => (timeInSeconds) => {
  return timeInSeconds * (($bpm / 60) * PIXELS_PER_BEAT * $zoomLevel);
});

export const pixelsToTime = derived([bpm, zoomLevel], ([$bpm, $zoomLevel]) => (pixels) => {
  return pixels / (($bpm / 60) * PIXELS_PER_BEAT * $zoomLevel);
});

/**
 * @type {Map<string, {source: AudioBufferSourceNode, gainNode: GainNode}>}
 */
const sources = new Map();

/**
 * todo: use typescript type / interface instead
 * @type {Map<string, {instrument: Synth}>}
 */
const instruments = new Map();

let frame;

const clearScheduledClips = () => {
  console.log("Clearing scheduled clips");

  sources.forEach(({ source }) => source.stop());
  sources.clear();
  instruments.forEach(({ instrument }) => instrument.stop());
  instruments.clear();
};

const scheduleAllClips = (currentTime) => {
  const currentTracks = get(tracks);

  currentTracks.forEach((track) => {
    track.clips.forEach((clip) => {
      if (track.isMuted === false && (track.isSolo || !currentTracks.some((t) => t.isSolo))) {
        let when =
          clip.startTime > currentTime
            ? audioManager.audioContext.currentTime + (clip.startTime - currentTime)
            : audioManager.audioContext.currentTime;
        let offset = clip.startTime < currentTime ? currentTime - clip.startTime : 0;

        console.log(clip);

        if (clip.type === "audio" && clip.audioBuffer) {
          console.log("Scheduling audio clip", clip.name, "at", when, "with offset", offset);
          const { source, gainNode } = audioManager.setupAudioSource(clip.audioBuffer);
          // Start the audio clip at 'when', playing from 'offset' in the buffer
          source.start(when, offset);
          sources.set(clip.id, { source, gainNode });
        }

        // MIDI Clips: Schedule notes that are supposed to start after the current time
        if (clip.type === "midi" && clip.midiData) {
          const instrument = audioManager.getInstrument(track.instrument);
          let notes = extractNoteEvents(clip.midiData);

          notes.forEach((midiEvent) => {
            const eventStart = clip.startTime + midiEvent.start / 1000;
            if (eventStart >= currentTime) {
              const eventTime = audioManager.audioContext.currentTime + (eventStart - currentTime);
              instrument.playNote(midiNoteToFrequency(midiEvent.note), eventTime, midiEvent.duration / 1000);
            }
          });

          instruments.set(clip.id, { instrument });
        }
      }
    });
  });
};

export const startPlayback = async () => {
  await audioManager.audioContext.resume();
  await loadAudioBuffersForAllTracks();

  playbackState.update((state) => {
    scheduleAllClips(state.accumulatedTime);
    state.playing = true;
    return state;
  });

  const startCurrentTime = audioManager.audioContext.currentTime;
  frame = requestAnimationFrame(function updateCurrentTime() {
    playbackState.update((state) => {
      state.currentTime = audioManager.audioContext.currentTime - startCurrentTime + state.accumulatedTime;
      return state;
    });
    frame = requestAnimationFrame(updateCurrentTime);
  });
};

export const pausePlayback = () => {
  clearScheduledClips();
  cancelAnimationFrame(frame);
  playbackState.update((state) => {
    state.accumulatedTime = state.currentTime;
    state.playing = false;
    return state;
  });
};

export const stopPlayback = () => {
  clearScheduledClips();
  cancelAnimationFrame(frame);
  playbackState.set({
    playing: false,
    currentTime: 0,
    accumulatedTime: 0,
  });
};

export const seekToTime = (time) => {
  clearScheduledClips();
  cancelAnimationFrame(frame);
  playbackState.update((state) => {
    state.currentTime = time;
    state.accumulatedTime = time;
    if (state.playing) {
      startPlayback(time);
    }
    return state;
  });
};

export const enableLooping = () => {
  loopRegion.update((state) => ({ ...state, active: true }));
};

export const disableLooping = () => {
  loopRegion.update((state) => ({ ...state, active: false }));
};

export const toggleLooping = () => {
  loopRegion.update((state) => ({ ...state, active: !state.active }));
};

export const setLoopRegion = (start, end) => {
  loopRegion.update((state) => ({ ...state, start, end }));
};

export const expandLoopRegion = (beats = 4) => {
  // end: (60 / get(bpm)) * beats }
  loopRegion.update((state) => ({ ...state, active: true, end: (60 / get(bpm)) * beats }));
};

export const loadDefaultTracks = async () => {
  return Promise.all([
    createTrackFromUrl("SoundHelix-Song-1.mp3", "/SoundHelix-Song-1.mp3"),
    createTrackFromUrl("SoundHelix-Song-2.mp3", "/SoundHelix-Song-2.mp3"),
    createTrackFromUrl("SoundHelix-Song-3.mp3", "/SoundHelix-Song-3.mp3"),
  ]);
};

export const createInstrumentTrack = async (trackName = "New instrument track") => {
  addTrack({
    id: crypto.randomUUID(),
    name: trackName,
    type: "instrument",
    instrument: "synth",
    isMuted: false,
    isSolo: false,
    clips: [],
  });
};

export const createTrackFromUrl = async (trackName, url) => {
  audioManager.loadAudioBuffer(url).then((audioBuffer) => {
    addTrack({
      id: crypto.randomUUID(),
      name: trackName,
      type: "audio",
      isMuted: false,
      isSolo: false,
      clips: [
        {
          id: crypto.randomUUID(),
          type: "audio",
          name: "Audio",
          audioUrl: url,
          startTime: 0,
          duration: audioBuffer.duration,
          audioBuffer: audioBuffer,
        },
      ],
    });
  });
};

export const createClipFromUrl = async (url, name = null) => {
  const audioBuffer = await audioManager.loadAudioBuffer(url);

  return {
    id: crypto.randomUUID(),
    name: name,
    audioUrl: url,
    startTime: 0,
    duration: audioBuffer.duration,
    audioBuffer: audioBuffer,
  };
};

// Functions for toggling track mute and solo states
export const toggleMute = (trackId) => {
  tracks.update((allTracks) =>
    allTracks.map((track) => {
      return track.id === trackId ? { ...track, isMuted: !track.isMuted } : track;
    }),
  );
};

export const toggleSolo = (trackId) => {
  tracks.update((allTracks) => {
    const isAnySolo = allTracks.some((track) => track.isSolo && track.id !== trackId);
    return allTracks.map((track) => ({
      ...track,
      isSolo: track.id === trackId ? !track.isSolo : isAnySolo ? track.isSolo : false,
    }));
  });
};

export const changeBpm = (newBpm) => {
  bpm.set(newBpm);
};

export const clearTracks = () => {
  tracks.set([]);
};

export const removeTrack = (trackId) => {
  tracks.update((allTracks) => allTracks.filter((track) => track.id !== trackId));
};

/**
 *
 * @param {Track} track
 */
export const addTrack = (track) => {
  tracks.update((allTracks) => [...allTracks, track]);
};

export const changeTrackName = (trackId, newName) => {
  tracks.update((allTracks) => allTracks.map((track) => (track.id === trackId ? { ...track, name: newName } : track)));
};

export const loadAudioBuffersForTrack = async (track) => {
  const clips = track.clips.map(async (clip) => {
    // If the clip already has an audio buffer, return it as is
    if (clip.audioBuffer) {
      return clip;
    }

    // Otherwise, load the audio buffer from the URL
    const audioBuffer = await audioManager.loadAudioBuffer(clip.audioUrl);
    return { ...clip, audioBuffer };
  });

  return Promise.all(clips);
};

export const loadAudioBuffersForAllTracks = async () => {
  let currentTracks = get(tracks); // Properly access the current value

  const loadedTracks = await Promise.all(
    currentTracks.map(async (track) => {
      const clipsPromises = track.clips.map(async (clip) => {
        if (clip.type === "audio" && clip.audioUrl && !clip.audioBuffer) {
          const buffer = await audioManager.loadAudioBuffer(clip.audioUrl);

          return { ...clip, audioBuffer: buffer };
        }

        // Already buffered, return as is
        return clip;
      });

      const clips = await Promise.all(clipsPromises); // Await all clip promises here

      return { ...track, clips };
    }),
  );

  tracks.set(loadedTracks); // Update the tracks store with loaded tracks
};

export const addClip = (trackId, clip) => {
  tracks.update((allTracks) =>
    allTracks.map((track) => (track.id === trackId ? { ...track, clips: [...track.clips, clip] } : track)),
  );
};

export const removeClip = (trackId, clipId) => {
  tracks.update((allTracks) =>
    allTracks.map((track) =>
      track.id === trackId ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) } : track,
    ),
  );
};

export const getSelectedClip = derived([selectedClip, tracks], ([$selectedClip, $tracks]) => {
  return $selectedClip ? $tracks.flatMap((track) => track.clips).find((clip) => clip.id === $selectedClip) : null;
});

export const moveClip = (trackId, clipId, newTrackId) => {
  tracks.update((allTracks) => {
    const clip = allTracks.find((track) => track.id === trackId).clips.find((clip) => clip.id === clipId);
    return allTracks.map((track) =>
      track.id === newTrackId
        ? { ...track, clips: [...track.clips, clip] }
        : track.id === trackId
          ? {
              ...track,
              clips: track.clips.filter((clip) => clip.id !== clipId),
            }
          : track,
    );
  });
};

export const moveClipToTime = (trackId, clipId, newStartTime) => {
  tracks.update((allTracks) =>
    allTracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            clips: track.clips.map((clip) => (clip.id === clipId ? { ...clip, startTime: newStartTime } : clip)),
          }
        : track,
    ),
  );
};

export const changeClipDuration = (trackId, clipId, newDuration) => {
  tracks.update((allTracks) =>
    allTracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            clips: track.clips.map((clip) => (clip.id === clipId ? { ...clip, duration: newDuration } : clip)),
          }
        : track,
    ),
  );
};

// nudge to the left or right by a certain number ms
export const nudge = (nudgeAmountInMs) => {
  playbackState.update((state) => {
    let newTime = state.currentTime + nudgeAmountInMs / 1000;

    if (newTime < 0) {
      newTime = 0;
    }

    return { ...state, currentTime: newTime };
  });
};

export const selectTrack = (trackId) => {
  selectedTrack.set(trackId);
};

export const selectClip = (clipId) => {
  tracks.subscribe((tracks) => {
    const track = tracks.find((track) => track.clips.find((clip) => clip.id === clipId));

    // Track was not found, might have gotten removed
    if (!track) {
      selectedTrack.set(null);
      selectedClip.set(null);
      return;
    }

    selectedTrack.set(track.id);
    selectedClip.set(clipId);
  });
};

export const zoomIn = () => {
  zoomLevel.update((level) => level + 5);
};

export const zoomOut = () => {
  zoomLevel.update((level) => level + -1);
};

export const zoomToLevel = (level) => {
  zoomLevel.set(level);
};

export const zoomByDelta = (delta) => {
  zoomLevel.update((level) => {
    let logZoomLevel = Math.log(level);
    let adjustedZoom = logZoomLevel + (delta < 0 ? 1 : -1) * ZOOM_FACTOR;
    return Math.max(0.1, Math.min(Math.exp(adjustedZoom), 100));
  });
};

/// =======================================================

export const createDummyHardstyleTracks = async () => {
  clearTracks();
  changeBpm(150);

  const kicks = await createDrumPattern({
    name: "Bass Drum",
    steps: createStepSequencerPattern(16 * 2, 4, [1, 0, 0, 0]),
    kit: "freesound",
    bpm: 150,
    variations: ["hardstyle-kick-249.wav"],
  });

  // Snare: Hardstyle snares typically hit on the 2nd and 4th beat with a stronger presence
  let snare = await createDrumPattern({
    name: "Snare",
    steps: createStepSequencerPattern(16 * 2, 4, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
    bpm: 150,
    kit: "freesound",
    variations: ["hardstyle-short-snare_A_major.wav"],
  });

  // Clap: Syncing with the snares for a pronounced layer effect
  let clap = await createDrumPattern({
    name: "Clap",
    steps: createStepSequencerPattern(16 * 2, 4, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
    bpm: 150,
    kit: "freesound",
    variations: ["hardstyle-clap-strong-2_A_major.wav"],
  });

  // Closed Hi-Hat: Keeping the rhythm tight and consistent
  let closed = await createDrumPattern({
    name: "Closed HiHat",
    steps: createStepSequencerPattern(16 * 2, 4, [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]),
    bpm: 150,
    kit: "linndrum",
    variations: ["chhs.wav"],
  });

  addTrack(kicks);
  addTrack(snare);
  addTrack(clap);
  addTrack(closed);
};

export const createDummyDrumTracks = async () => {
  clearTracks();
  changeBpm(100);

  const track = await createDrumPattern({
    name: "Bass Drum",
    steps: createStepSequencerPattern(16, 4, [1, 0, 0, 0]),
    bpm: 100,
    variations: ["BD/BD0000.WAV"],
  });

  addTrack(track);

  const track2 = await createDrumPattern({
    name: "Bass Drum",
    steps: createStepSequencerPattern(16, 4, [1, 0, 0, 0]),
    bpm: 100,
    kit: "roland-tr-909",
    variations: ["BT0A0A7.WAV"],
  });

  addTrack(track2);
};

export const createDummyTranceTracks = async () => {
  clearTracks();
  changeBpm(120);

  // Using the function to create a basic trance pattern
  const patterns = await createTranceEDMPattern({
    bpm: get(bpm),
  });

  patterns.forEach((track) => addTrack(track));
};

export const createDummyHouseTracks = async () => {
  clearTracks();
  changeBpm(115);
  // Using the function to create a basic trance pattern
  const patterns = await createDeepHousePattern({
    bpm: get(bpm),
  });

  patterns.forEach((track) => addTrack(track));
};
