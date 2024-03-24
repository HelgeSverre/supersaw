// Utility function to create drum pattern clips
export const createDrumPattern = ({
  name, // e.g., "Bass Drum"
  folder, // e.g., "BD"
  pattern, // e.g., [1, 0, 1, 0] for "BD" beats on first and third beats
  bpm, // Beats per minute
  clipLength, // Length of each clip in seconds
  baseVolume, // Volume of the clips
  variations, // Array of variations e.g., ['0000', '0010', '0050']
}) => {
  // Base URL for the audio samples
  const baseUrl = `/samples/roland-tr-808/${folder}/`;
  // Calculate interval between beats (in seconds)
  const beatInterval = 60 / bpm;
  // Initialize the clips array
  const clips = [];

  // Generate clips based on the pattern
  pattern.forEach((beat, index) => {
    if (beat === 1) {
      // For each variation create a clip
      variations.forEach((variation, varIndex) => {
        const clip = {
          id: `${folder}-${index}-${varIndex}`,
          name: `${name} ${variation}`,
          audioUrl: `${baseUrl}${folder}${variation}.WAV`,
          startTime: index * beatInterval,
          duration: clipLength,
          volume: baseVolume,
        };
        clips.push(clip);
      });
    }
  });

  return {
    id: Date.now(), // Ensuring unique ID, you may want to use a better method
    name: `${name} Pattern`,
    clips: clips,
  };
};

// Basic dubstep pattern: Kicks on 1st and just after 2nd beat, snare on 3rd beat
// Example for a single measure: [1, 0, 0, 0.5, 0, 1, 0, 0] (Here, 0.5 represents a kick halfway between beats)
export const createDubstepPattern = ({ bpm, clipLength, baseVolume }) => {
  const kickPattern = [1, 0, 0, 0.5, 0, 1, 0, 0];
  const snarePattern = [0, 0, 1, 0, 0, 0, 1, 0];
  const hiHatPattern = [0, 1, 0, 1, 1, 0, 1, 1]; // Hi-hats can be more frequent for a top rhythm layer

  const kickTrack = createDrumPattern({
    name: "Kick",
    folder: "BD",
    pattern: kickPattern,
    bpm,
    clipLength,
    baseVolume,
    variations: ["0010", "0050"],
  });

  const snareTrack = createDrumPattern({
    name: "Snare",
    folder: "SD",
    pattern: snarePattern,
    bpm,
    clipLength,
    baseVolume,
    variations: ["0025", "0050"],
  });

  const hiHatTrack = createDrumPattern({
    name: "HiHat",
    folder: "CH",
    pattern: hiHatPattern,
    bpm,
    clipLength: clipLength / 2, // Hi-hats often play at double speed in dubstep
    baseVolume,
    variations: [""], // Assuming only one type of hi-hat sample
  });

  // Combine all patterns into a single track array
  return [kickTrack, snareTrack, hiHatTrack];
};

// Basic trance pattern: Steady kicks, off-beat bass, and rhythmic hi-hats
// For simplicity: Kicks on every beat, claps or snares on the 2nd and 4th beats, and hi-hats on off-beats
export const createTrancePattern = ({ bpm, clipLength, baseVolume }) => {
  const kickPattern = [1, 1, 1, 1]; // Four-on-the-floor kicks
  const bassPattern = [0, 1, 0, 1]; // Off-beat bass hits
  const hiHatPattern = [0, 1, 0, 1]; // Hi-hats on off-beats
  const snarePattern = [0, 1, 0, 1]; // Snares or claps on the 2nd and 4th

  const kickTrack = createDrumPattern({
    name: "Kick",
    folder: "BD",
    pattern: kickPattern,
    bpm,
    clipLength,
    baseVolume,
    variations: ["1000"], // Standard kick
  });

  const bassTrack = createDrumPattern({
    name: "Bass",
    folder: "BD", // Assuming you have a suitable bass drum or use a bassline sample
    pattern: bassPattern,
    bpm,
    clipLength,
    baseVolume,
    variations: ["0025", "0050"], // Use different samples if available for variation
  });

  const hiHatTrack = createDrumPattern({
    name: "HiHat",
    folder: "CH",
    pattern: hiHatPattern,
    bpm,
    clipLength,
    baseVolume,
    variations: [""], // Assuming only one type of hi-hat sample
  });

  const snareTrack = createDrumPattern({
    name: "Snare",
    folder: "SD",
    pattern: snarePattern,
    bpm,
    clipLength,
    baseVolume,
    variations: ["1000"], // Standard snare
  });

  // Combine all patterns into a single track array
  return [kickTrack, bassTrack, hiHatTrack, snareTrack];
};
