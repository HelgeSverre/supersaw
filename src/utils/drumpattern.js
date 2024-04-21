// Utility function to create drum pattern clips
export const createDrumPattern = ({
  name,
  folder,
  pattern, // Now including fractions to denote sub-beats
  bpm,
  clipLength,
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

// Basic trance pattern: Steady kicks, off-beat bass, and rhythmic hi-hats
// For simplicity: Kicks on every beat, claps or snares on the 2nd and 4th beats, and hi-hats on off-beats
export const createTrancePattern = ({ bpm, clipLength, baseVolume, bars = 1 }) => {
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
    clipLength,
    baseVolume,
    variations: ["1000"], // Standard kick
  });

  const bassTrack = createDrumPattern({
    name: "Trance - Bass",
    folder: "BD", // Assuming you have a suitable bass drum or use a bassline sample
    pattern: bassPattern,
    bpm,
    clipLength,
    baseVolume,
    variations: ["0025", "0050"], // Use different samples if available for variation
  });

  const hiHatTrack = createDrumPattern({
    name: "Trance - HiHat",
    folder: "CH",
    pattern: hiHatPattern,
    bpm,
    clipLength: 0.25,
    baseVolume,
    variations: [""], // Assuming only one type of hi-hat sample
  });

  const snareTrack = createDrumPattern({
    name: "Trance - Snare",
    folder: "SD",
    pattern: snarePattern,
    bpm,
    clipLength,
    baseVolume,
    variations: ["2510"], // Standard snare
  });

  // Combine all patterns into a single track array
  return [kickTrack, bassTrack, hiHatTrack, snareTrack];
};
