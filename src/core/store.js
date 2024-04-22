// noinspection JSUnusedGlobalSymbols

import { derived, get, writable } from "svelte/store";
import {
  createDeepHousePattern,
  createDrumPattern,
  createStepSequencerPattern,
  createTranceEDMPattern,
} from "../utils/drumpattern.js";
import { audioManager } from "./audio.js";

export const PIXELS_PER_BEAT = 10;
export const ZOOM_FACTOR = 0.05;

export const bpm = writable(140);
export const zoomLevel = writable(50);

export const loopRegion = writable({ start: 0, end: 0, active: false });
export const playbackState = writable({ playing: false, currentTime: 0 });
export const selectedClip = writable(null);
export const selectedTrack = writable(0);

export const tracks = writable([]);

// master volume 0 - 100% (0 - 1)
export const masterVolume = writable(1);

// master pan (-1 - 1)
export const masterPan = writable(0);

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

export const activeClips = derived([playbackState, tracks], ([$playbackState, $tracks]) => {
  const active = [];
  if ($playbackState.playing) {
    const currentTime = $playbackState.currentTime;
    $tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (!track.isMuted && (track.isSolo || !$tracks.some((t) => t.isSolo))) {
          const clipEnd = clip.startTime + clip.duration + 1;
          if (clip.startTime <= currentTime && currentTime <= clipEnd) {
            active.push({ ...clip, trackId: track.id });
          }
        }
      });
    });
  }
  return active;
});

/**
 *
 * @type {Map<string, {source: AudioBufferSourceNode, gainNode: GainNode}>}
 */
let sources = new Map();

activeClips.subscribe(($activeClips) => {
  const currentAudioTime = audioManager.audioContext.currentTime;

  // Stop and delete sources that are no longer active
  for (let [id, { source }] of sources) {
    if (!$activeClips.find((clip) => clip.id === id)) {
      source.stop(currentAudioTime);
      sources.delete(id);
    }
  }

  // Add new sources for clips that are active and not already playing
  for (let clip of $activeClips) {
    if (!sources.has(clip.id)) {
      const track = get(tracks).find((t) => t.id === clip.trackId);
      if (track && clip.audioBuffer) {
        const { source, gainNode } = audioManager.setupAudioSource(clip.audioBuffer);

        const offset = get(playbackState).currentTime - clip.startTime;

        source.start(0, offset);
        source.onended = () => sources.delete(clip.id); // Remove source when it ends

        sources.set(clip.id, { source, gainNode });
      }
    }
  }
});

playbackState.subscribe(($playbackState) => {
  if (!$playbackState.playing) {
    for (let { source } of sources.values()) {
      source.stop();
    }
    sources.clear();
  }
});

let frame;

export const startPlayback = async () => {
  await loadAudioBuffersForAllTracks();

  let startAudioTime = audioManager.audioContext.currentTime;
  let offset = get(playbackState).currentTime;

  // If we are not at the beginning, resume from the current time
  if (offset !== 0) {
    startAudioTime -= offset;
  }

  playbackState.set({ playing: true, currentTime: offset });

  frame = requestAnimationFrame(function tick() {
    let newTime = audioManager.audioContext.currentTime - startAudioTime;

    playbackState.update((state) => ({
      ...state,
      currentTime: newTime,
    }));

    frame = requestAnimationFrame(tick);
  });
};

export const stopPlayback = () => {
  playbackState.update((state) => ({
    ...state,
    playing: false,
    currentTime: 0,
  }));
  cancelAnimationFrame(frame);
};

export const pausePlayback = () => {
  playbackState.update((state) => ({ ...state, playing: false }));
  cancelAnimationFrame(frame);
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

export const createTrackFromUrl = async (trackName, url) => {
  audioManager.loadAudioBuffer(url).then((audioBuffer) => {
    addTrack({
      id: crypto.randomUUID(),
      name: trackName,
      isMuted: false,
      isSolo: false,
      clips: [
        {
          id: crypto.randomUUID(),
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
        if (!clip.audioBuffer) {
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

export const seekToTime = (time) => {
  playbackState.update((state) => ({ ...state, currentTime: time }));
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
  changeBpm(140);

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
