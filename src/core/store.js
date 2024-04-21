// noinspection JSUnusedGlobalSymbols

import { derived, get, writable } from "svelte/store";
import { createDrumPattern, createDubstepPattern, createTrancePattern } from "../utils/drumpattern.js";
import { loadAudioBuffer } from "./audio.js";

export const PIXELS_PER_BEAT = 10;
export const ZOOM_FACTOR = 0.05;

export const bpm = writable(120);
export const zoomLevel = writable(10);

export const playbackState = writable({ playing: false, currentTime: 0 });
export const selectedClip = writable(null);
export const selectedTrack = writable(null);

export const tracks = writable([]);

export const timeToPixels = derived([bpm, zoomLevel], ([$bpm, $zoomLevel]) => (timeInSeconds) => {
  return timeInSeconds * ($bpm / 60) * PIXELS_PER_BEAT * $zoomLevel;
});

export const pixelsToTime = derived([bpm, zoomLevel], ([$bpm, $zoomLevel]) => (pixels) => {
  return pixels / (($bpm / 60) * PIXELS_PER_BEAT * $zoomLevel);
});

let frame;

export const startPlayback = async () => {
  const tick = (timestamp) => {
    // Calculate the elapsed time since the last frame
    const elapsedTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Update the current time based on the elapsed time and the BPM
    playbackState.update((state) => {
      const newTime = state.currentTime + elapsedTime / 1000; // Convert ms to seconds
      return { ...state, currentTime: newTime };
    });

    frame = requestAnimationFrame(tick); // Schedule the next frame
  };

  let lastTimestamp = performance.now();

  await loadAudioBuffersForAllTracks();

  playbackState.update((state) => ({ ...state, playing: true }));
  frame = requestAnimationFrame(tick); // Start the playback loop
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

export const loadDefaultTracks = async () => {
  return Promise.all([
    createTrackFromUrl("SoundHelix-Song-1.mp3", "/SoundHelix-Song-1.mp3"),
    createTrackFromUrl("SoundHelix-Song-2.mp3", "/SoundHelix-Song-2.mp3"),
    createTrackFromUrl("SoundHelix-Song-3.mp3", "/SoundHelix-Song-3.mp3"),
  ]);
};

export const createTrackFromUrl = async (trackName, url) => {
  loadAudioBuffer(url).then((audioBuffer) => {
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
    const audioBuffer = await loadAudioBuffer(clip.audioUrl);
    return { ...clip, audioBuffer };
  });

  return Promise.all(clips);
};

export const loadAudioBuffersForAllTracks = async () => {
  let currentTracks = get(tracks); // Properly access the current value

  if (!Array.isArray(currentTracks)) {
    console.error("loadAudioBuffersForAllTracks: currentTracks is not an array:", currentTracks);
    currentTracks = []; // Reset to an empty array if it's not an array
  }

  const loadedTracks = await Promise.all(
    currentTracks.map(async (track) => {
      const clipsPromises = track.clips.map(async (clip) => {
        if (!clip.audioBuffer) {
          const buffer = await loadAudioBuffer(clip.audioUrl);
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

export const selectTrack = (trackId) => {
  selectedTrack.set(trackId);
};

export const selectClip = (clipId) => {
  tracks.subscribe((tracks) => {
    const track = tracks.find((track) => track.clips.find((clip) => clip.id === clipId));

    selectedTrack.set(track.id);
    selectedClip.set(clipId);
  });
};

export const createDummyDrumTracks = () => {
  addTrack(
    createDrumPattern({
      name: "Bass Drum",
      folder: "BD",
      pattern: [1, 0, 1, 0, 1, 0, 1, 0], // Basic 4/4 beat
      bpm: 120,
      clipLength: 0.5, // Half-second clips
      baseVolume: 1, // Full volume
      variations: ["0000", "0050", "0075"], // Three variations of bass drum sounds
    }),
  );
};

export const createDummyDubstepTracks = () => {
  const dubstepPattern = createDubstepPattern({
    bpm: 140,
    clipLength: 0.5,
    baseVolume: 1,
  });

  dubstepPattern.forEach((track) => addTrack(track));
};

export const createDummyTranceTracks = () => {
  // Using the function to create a basic trance pattern
  const trancePattern = createTrancePattern({
    bpm: 140,
    clipLength: 1, // Assuming 4 seconds per bar
    baseVolume: 1,
  });

  trancePattern.forEach((track) => addTrack(track));
};

export const zoomIn = () => {
  zoomLevel.update((level) => level + 1);
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
    let newZoom = Math.max(0.1, Math.min(Math.exp(adjustedZoom), 100));

    return newZoom;
  });
};
