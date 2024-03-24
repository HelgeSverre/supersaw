// noinspection JSUnusedGlobalSymbols

import { derived, writable } from "svelte/store";
import {
  createDrumPattern,
  createDubstepPattern,
  createTrancePattern,
} from "../utils/drumpattern.js";

export const PIXELS_PER_BEAT = 10;
export const ZOOM_FACTOR = 0.05;

export const bpm = writable(120);
export const zoomLevel = writable(10);

export const playbackState = writable({ playing: false, currentTime: 0 });
export const selectedClip = writable(null);
export const selectedTrack = writable(null);

export const timeToPixels = derived(
  [bpm, zoomLevel],
  ([$bpm, $zoomLevel]) =>
    (timeInSeconds) => {
      return timeInSeconds * ($bpm / 60) * PIXELS_PER_BEAT * $zoomLevel;
    },
);

export const pixelsToTime = derived(
  [bpm, zoomLevel],
  ([$bpm, $zoomLevel]) =>
    (pixels) => {
      return pixels / (($bpm / 60) * PIXELS_PER_BEAT * $zoomLevel);
    },
);

export const tracks = writable([
  {
    id: 1,
    name: "SoundHelix-Song-1.mp3",
    clips: [
      {
        id: 100,
        name: "SoundHelix-Song-1.mp3",
        audioUrl: "/SoundHelix-Song-1.mp3",
        startTime: 0,
        duration: 373,
      },
    ],
  },
  // {
  //   id: 2,
  //   name: "SoundHelix-Song-2.mp3",
  //   clips: [
  //     {
  //       id: 200,
  //       name: "SoundHelix-Song-2.mp3",
  //       audioUrl: "/SoundHelix-Song-2.mp3",
  //       startTime: 20,
  //       duration: 426,
  //     },
  //   ],
  // },
  {
    id: 3,
    name: "808 Kicks",
    clips: [
      {
        id: 1000,
        name: "BD1000.WAV",
        audioUrl: "/samples/roland-tr-808/BD/BD1000.WAV",
        startTime: 0,
        duration: 2,
      },
      {
        id: 1000,
        name: "BD1000.WAV",
        audioUrl: "/samples/roland-tr-808/BD/BD1000.WAV",
        startTime: 2,
        duration: 2,
      },
      {
        id: 2000,
        name: "BD1000.WAV",
        audioUrl: "/samples/roland-tr-808/BD/BD1000.WAV",
        startTime: 4,
        duration: 2,
      },
      {
        id: 3000,
        name: "BD1000.WAV",
        audioUrl: "/samples/roland-tr-808/BD/BD1000.WAV",
        startTime: 12,
        duration: 2,
      },
      {
        id: 4000,
        name: "BD1000.WAV",
        audioUrl: "/samples/roland-tr-808/BD/BD1000.WAV",
        startTime: 16,
        duration: 2,
      },
    ],
  },
  {
    id: 4,
    name: "Hihat",
    clips: Array.from({ length: 16 }, (_, i) => i).map((i) => {
      return {
        id: 1000,
        name: "hihat",
        audioUrl: "/samples/roland-tr-808/MA/MA.WAV",
        startTime: i * 0.5,
        duration: 1,
      };
    }),
  },

  {
    id: 5,
    name: "Snare",
    clips: Array.from({ length: 16 }, (_, i) => i).map((i) => {
      return {
        id: 1000,
        name: "snare",
        audioUrl: "/samples/roland-tr-808/SD/SD5010.WAV",
        startTime: i * 4,
        duration: 1,
      };
    }),
  },
]);

// Functions for toggling track mute and solo states
export const toggleMute = (trackId) => {
  tracks.update((allTracks) =>
    allTracks.map((track) =>
      track.id === trackId ? { ...track, isMuted: !track.isMuted } : track,
    ),
  );
};

export const toggleSolo = (trackId) => {
  tracks.update((allTracks) => {
    const isAnySolo = allTracks.some(
      (track) => track.isSolo && track.id !== trackId,
    );
    return allTracks.map((track) => ({
      ...track,
      isSolo:
        track.id === trackId ? !track.isSolo : isAnySolo ? track.isSolo : false,
    }));
  });
};

export const changeBpm = (newBpm) => {
  bpm.set(newBpm);
};

export const removeTrack = (trackId) => {
  tracks.update((allTracks) =>
    allTracks.filter((track) => track.id !== trackId),
  );
};

export const addTrack = (track) => {
  tracks.update((allTracks) => [...allTracks, track]);
};

export const addClip = (trackId, clip) => {
  tracks.update((allTracks) =>
    allTracks.map((track) =>
      track.id === trackId
        ? { ...track, clips: [...track.clips, clip] }
        : track,
    ),
  );
};

export const removeClip = (trackId, clipId) => {
  tracks.update((allTracks) =>
    allTracks.map((track) =>
      track.id === trackId
        ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) }
        : track,
    ),
  );
};

export const moveClip = (trackId, clipId, newTrackId) => {
  tracks.update((allTracks) => {
    const clip = allTracks
      .find((track) => track.id === trackId)
      .clips.find((clip) => clip.id === clipId);
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
            clips: track.clips.map((clip) =>
              clip.id === clipId ? { ...clip, startTime: newStartTime } : clip,
            ),
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
            clips: track.clips.map((clip) =>
              clip.id === clipId ? { ...clip, duration: newDuration } : clip,
            ),
          }
        : track,
    ),
  );
};

export const seekToTime = (time) => {
  playbackState.update((state) => ({ ...state, currentTime: time }));
};

export const startPlayback = () => {
  playbackState.update((state) => ({ ...state, playing: true }));
};

export const stopPlayback = () => {
  playbackState.update((state) => ({
    ...state,
    playing: false,
    currentTime: 0,
  }));
};

export const pausePlayback = () => {
  playbackState.update((state) => ({ ...state, playing: false }));
};

export const selectTrack = (trackId) => {
  selectedTrack.set(trackId);
};

export const selectClip = (clipId) => {
  const track = tracks.find((track) =>
    track.clips.find((clip) => clip.id === clipId),
  );

  selectedTrack.set(track.id);
  selectedClip.set(clipId);
};

export const createDummyTracks = () => {
  const bassDrumPattern = createDrumPattern({
    name: "Bass Drum",
    folder: "BD",
    pattern: [1, 0, 1, 0, 1, 0, 1, 0], // Basic 4/4 beat
    bpm: 120,
    clipLength: 0.5, // Half-second clips
    baseVolume: 1, // Full volume
    variations: ["0000", "0050", "0075"], // Three variations of bass drum sounds
  });

  // Using the function to create a basic dubstep pattern
  const dubstepPattern = createDubstepPattern({
    bpm: 140,
    clipLength: 0.5,
    baseVolume: 1,
  });

  // Using the function to create a basic trance pattern
  const trancePattern = createTrancePattern({
    bpm: 140,
    clipLength: 4, // Assuming 4 seconds per bar
    baseVolume: 1,
  });

  // addTrack(bassDrumPattern);
  // dubstepPattern.forEach((track) => addTrack(track));
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
