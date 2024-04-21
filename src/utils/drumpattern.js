// Utility function to create drum pattern clips
export const createDrumPattern = ({
  name,
  folder,
  pattern, // Now including fractions to denote sub-beats
  bpm,
  baseVolume,
  variations,
}) => {
  const baseUrl = `/samples/roland-tr-808/${folder}/`;
  const beatInterval = 60 / bpm; // Time for one full beat
  const clips = [];

  pattern.forEach((beatFraction, index) => {
    if (beatFraction === 0) {
      return; // Skip if no beat is supposed to play
    }

    // Calculate start time using the fraction of the beatInterval
    const startTime = index * beatInterval * beatFraction; // Adjust start time based on sub-beat fraction

    // Randomly select one variation
    const variation = variations[Math.floor(Math.random() * variations.length)];

    const clip = {
      id: crypto.randomUUID(),
      name: `${name} ${variation}`,
      audioUrl: `${baseUrl}${folder}${variation}.WAV`,
      startTime: startTime,
      duration: beatFraction * beatInterval,
      volume: baseVolume,
    };
    clips.push(clip);
  });

  return {
    id: crypto.randomUUID(),
    name: `${name} Pattern`,
    isMuted: false,
    isSolo: false,
    clips: clips,
  };
};

function repeat(pattern, times) {
  return Array(times).fill(pattern).flat();
}

export const createTranceEDMPattern = ({ bpm, clipLength, baseVolume }) => {
  return [
    createDrumPattern({
      name: "Kick",
      folder: "BD",
      pattern: repeat([1, 1, 1, 1], 4), // Steady four-on-the-floor kicks
      bpm,
      clipLength,
      baseVolume,
      variations: ["1000"], // Using only the most suitable kick sample
    }),
    createDrumPattern({
      name: "Snare",
      folder: "SD",
      pattern: repeat([0, 1, 0, 1], 4), // Snares on the 2nd and 4th beats
      bpm,
      clipLength,
      baseVolume,
      variations: ["0010", "0050", "0075"], // Multiple snare variants for texture
    }),
    createDrumPattern({
      name: "Clap",
      folder: "CP",
      pattern: repeat([0, 1, 0, 1], 4), // Claps layered with snares
      bpm,
      clipLength,
      baseVolume,
      variations: [""], // Single classic clap sample
    }),
    createDrumPattern({
      name: "Closed HiHat",
      folder: "CH",
      pattern: repeat([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 4), // Rapid hi-hats on eighth notes
      bpm,
      clipLength: 0.25,
      baseVolume,
      variations: [""], // Consistent closed hi-hat sample
    }),
    createDrumPattern({
      name: "Trance Open HiHat",
      folder: "OH",
      pattern: repeat([0, 0, 1, 0], 4), // Open hi-hat every second beat
      bpm,
      clipLength,
      baseVolume,
      variations: ["10", "25", "50"], // Different open hi-hat tones
    }),
    createDrumPattern({
      name: "Trance Ride",
      folder: "CY",
      pattern: repeat([0, 1, 0, 1], 4), // Ride cymbals for additional texture
      bpm,
      clipLength,
      baseVolume,
      variations: ["1000"], // Various ride cymbals for a richer sound
    }),
  ];
};

// Basic trance pattern: Steady kicks, off-beat bass, and rhythmic hi-hats
// For simplicity: Kicks on every beat, claps or snares on the 2nd and 4th beats, and hi-hats on off-beats
export const createTrancePattern = ({ bpm, baseVolume, bars = 1 }) => {
  // Kick on every beat (4 beats per bar)
  const kickPattern = [1, 1, 1, 1];

  // Claps or Snares on the 2nd and 4th beats of each bar
  const snarePattern = [0, 1, 0, 1];

  const hiHatPattern = [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];

  // Bass pattern can follow the off-beat, similar to hi-hats but usually at a different octave or sound
  const bassPattern = repeat([0, 1, 0, 1], bars); // Off-beat bass hits

  const kickTrack = createDrumPattern({
    name: "Trance - Kick",
    folder: "BD",
    pattern: kickPattern,
    bpm,
    baseVolume,
    variations: ["1000"], // Standard kick
  });

  const bassTrack = createDrumPattern({
    name: "Trance - Bass",
    folder: "BD", // Assuming you have a suitable bass drum or use a bassline sample
    pattern: bassPattern,
    bpm,
    baseVolume,
    variations: ["0025", "0050"], // Use different samples if available for variation
  });

  const hiHatTrack = createDrumPattern({
    name: "Trance - HiHat",
    folder: "CH",
    pattern: hiHatPattern,
    bpm,
    baseVolume,
    variations: [""],
  });

  const snareTrack = createDrumPattern({
    name: "Trance - Snare",
    folder: "SD",
    pattern: snarePattern,
    bpm,
    baseVolume,
    variations: ["2510"], // Standard snare
  });

  // Combine all patterns into a single track array
  return [kickTrack, bassTrack, hiHatTrack, snareTrack];
};

export const createHousePattern = ({ bpm, baseVolume }) => {
  const kickPattern = [1, 1, 1, 1]; // Steady kicks on every beat
  const hiHatPattern = [0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5]; // Hi-hats on off-beats (8th notes)
  const snarePattern = [0, 0, 1, 0]; // Snares on the 2nd and 4th beats

  return [
    createDrumPattern({
      name: "House Kick",
      folder: "BD",
      pattern: kickPattern,
      bpm,
      baseVolume,
      variations: ["0010"],
    }),
    createDrumPattern({
      name: "House Snare",
      folder: "SD",
      pattern: snarePattern,
      bpm,
      baseVolume,
      variations: ["0050"],
    }),
    createDrumPattern({
      name: "House HiHat",
      folder: "CH",
      pattern: hiHatPattern,
      bpm,
      baseVolume,
      variations: [""],
    }),
  ];
};

export const createDubstepPattern = ({ bpm, baseVolume }) => {
  const kickPattern = [1, 0, 0, 0.5, 0, 1, 0, 0]; // Complex kick pattern
  const snarePattern = [0, 0, 1, 0, 0, 0, 1, 0]; // Snares on odd placements
  const hiHatPattern = [0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0]; // More frequent hi-hats

  return [
    createDrumPattern({
      name: "Dubstep Kick",
      folder: "BD",
      pattern: kickPattern,
      bpm,
      baseVolume,
      variations: ["0010", "0050"],
    }),
    createDrumPattern({
      name: "Dubstep Snare",
      folder: "SD",
      pattern: snarePattern,
      bpm,
      baseVolume,
      variations: ["0025", "0050"],
    }),
    createDrumPattern({
      name: "Dubstep HiHat",
      folder: "HH",
      pattern: hiHatPattern,
      bpm,
      baseVolume,
      variations: [""],
    }),
  ];
};
