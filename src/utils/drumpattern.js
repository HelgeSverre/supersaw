import { audioManager } from "../core/audio.js";
import { Track } from "../core/track.js";

/**
 * Create a step sequencer pattern for drum machines.
 * @param {number} stepsPerBar - Number of steps per bar (reflecting the time signature or density).
 * @param {number} bars - Number of bars over which to repeat the pattern.
 * @param {Array<number>} hitPattern - Array indicating hits (1) and no-hits (0) for each step.
 * @returns {Array<number>} - An array representing the full pattern across all bars.
 */
export const createStepSequencerPattern = (stepsPerBar, bars, hitPattern) => {
  // Ensure the hitPattern length matches stepsPerBar or is a divisor of stepsPerBar
  if (stepsPerBar % hitPattern.length !== 0) {
    throw new Error("hitPattern length must be a divisor of stepsPerBar.");
  }
  const repetitionsPerBar = stepsPerBar / hitPattern.length;
  const barPattern = Array(repetitionsPerBar).fill(hitPattern).flat();
  return Array(bars).fill(barPattern).flat();
};

export const createDrumPattern = async ({ name, kit = "roland-tr-808", steps, bpm, variations }) => {
  // Each step corresponds to a sixteenth note for 4/4 time
  const stepInterval = 60 / bpm / 4;
  const clips = [];

  steps.forEach((step, index) => {
    if (step === 0) return; // Skip if there's no hit on this step

    const startTime = index * stepInterval;
    const sampleVariant = variations[Math.floor(Math.random() * variations.length)];
    const audioUrl = `/samples/${kit}/${sampleVariant}`;

    clips.push({
      id: crypto.randomUUID(),
      type: "audio",
      name: `${name} ${sampleVariant}`,
      audioUrl: audioUrl,
      startTime: startTime,
      duration: stepInterval,
    });
  });
  const id = crypto.randomUUID();

  let track = new Track(id, `${name} Pattern`, "audio");
  track.clips = clips;

  return track;
};

export const createDrumPatternOld = async ({ name, folder, pattern, bpm, variations }) => {
  const baseUrl = `/samples/roland-tr-808/${folder}/`;
  const beatInterval = 60 / bpm; // Duration of a single beat in seconds
  const promises = pattern.map(async (beatFraction, index) => {
    if (beatFraction === 0) {
      return null; // Skip if there's no sound on this beat
    }

    // Calculate start time using the fraction of the beatInterval
    const startTime = index * beatInterval + (beatFraction - 1) * beatInterval;

    const variation = variations[Math.floor(Math.random() * variations.length)];
    const audioUrl = `${baseUrl}/${variation}.WAV`;
    const buffer = await audioManager.loadAudioBuffer(audioUrl);

    return {
      id: crypto.randomUUID(),
      type: "audio",
      name: `${name} ${variation}`,
      audioUrl: audioUrl,
      startTime: startTime,
      duration: buffer.duration,
    };
  });

  const loadedClips = await Promise.all(promises);

  const allClips = loadedClips.filter((clip) => clip !== null);
  return {
    id: crypto.randomUUID(),
    type: "audio",
    name: `${name} Pattern`,
    isMuted: false,
    isSolo: false,
    clips: allClips,
  };
};

export const createTranceEDMPattern = async ({ bpm }) => {
  return [
    await createDrumPattern({
      name: "Kick",
      steps: createStepSequencerPattern(16, 4, [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
      bpm: bpm,
      kit: "trance",
      variations: ["Supreme Kick.wav"],
    }),
    await createDrumPattern({
      name: "Clap",
      steps: createStepSequencerPattern(16, 4, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
      bpm: bpm,
      kit: "trance",
      variations: ["MaxV - Roland808 - 808Cp 05.wav"],
    }),
    await createDrumPattern({
      name: "Closed HiHat",
      steps: createStepSequencerPattern(16, 4, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      bpm: bpm,
      kit: "trance",
      variations: ["TR-808Hat_C05.wav"],
    }),
  ];
};

export const createDeepHousePattern = async ({ bpm }) => {
  return [
    // Kick: Steady four-on-the-floor
    await createDrumPattern({
      name: "Kick",
      steps: createStepSequencerPattern(16, 4, [1, 0, 0, 0]), // 16 steps per bar
      bpm,
      kit: "linndrum",
      variations: ["kick.wav"], // Using kick.wav from LinnDrum samples
    }),

    // Snare: Light snare on the 2nd and 4th beat
    await createDrumPattern({
      name: "Snare",
      steps: createStepSequencerPattern(16, 4, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
      bpm,
      kit: "linndrum",
      variations: ["sd.wav"], // Using sd.wav for a less intrusive snare sound
    }),

    // Clap: Layered with snares, but softer and more in the background
    await createDrumPattern({
      name: "Clap",
      steps: createStepSequencerPattern(16, 4, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
      bpm,
      kit: "linndrum",
      variations: ["clap.wav"], // Using clap.wav, typically reverbed
    }),

    // Closed Hi-Hat: Playing more complex rhythms for a groovy feel
    await createDrumPattern({
      name: "Closed HiHat",
      steps: createStepSequencerPattern(16, 4, [0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1]),
      bpm,
      kit: "linndrum",
      variations: ["chhs.wav"], // Using chh.wav for a consistent, tight hi-hat sound
    }),

    // Open Hi-Hat: Less frequent to give space to the groove
    await createDrumPattern({
      name: "Open HiHat",
      steps: createStepSequencerPattern(16, 4, [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]),
      bpm,
      kit: "roland-cr-80",
      variations: ["CR80_Ohh.wav"], // Using ohh.wav for a subtle open hi-hat effect
    }),

    // Percussion: Additional elements like shakers or tambourines
    await createDrumPattern({
      name: "Percussion",
      steps: createStepSequencerPattern(16, 4, [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]),
      bpm,
      kit: "linndrum",
      variations: ["tamb.wav"], // Using tamb.wav for added percussive texture
    }),
  ];
};

export const createDeepHousePatternWithRoland808 = async ({ bpm }) => {
  return [
    // Kick: Steady four-on-the-floor
    await createDrumPattern({
      name: "Kick",
      steps: createStepSequencerPattern(16, 4, [1, 0, 0, 0]), // 16 steps per bar
      bpm,
      variations: ["BD/BD0025.WAV"], // A softer kick sound typical for deep house
    }),

    // Snare: Light snare on the 2nd and 4th beat
    await createDrumPattern({
      name: "Snare",
      steps: createStepSequencerPattern(16, 4, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
      bpm,
      variations: ["SD/SD0050.WAV"], // Using a softer, less intrusive snare sound
    }),

    // Clap: Layered with snares, but softer and more in the background
    await createDrumPattern({
      name: "Clap",
      steps: createStepSequencerPattern(16, 4, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
      bpm,
      variations: ["CP/CP.WAV"], // Typically a single clap sample, reverbed
    }),

    // Closed Hi-Hat: Playing more complex rhythms for a groovy feel
    await createDrumPattern({
      name: "Closed HiHat",
      steps: createStepSequencerPattern(16, 4, [0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1]),
      bpm,
      variations: ["CH/CH.WAV"], // Consistent, tight hi-hat sound
    }),

    // Open Hi-Hat: Less frequent to give space to the groove
    await createDrumPattern({
      name: "Open HiHat",
      steps: createStepSequencerPattern(16, 4, [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]),
      bpm,
      variations: ["OH/OH50.WAV"], // Slightly open for a subtle effect
    }),

    // Percussion: Additional elements like shakers or tambourines
    await createDrumPattern({
      name: "Percussion",
      steps: createStepSequencerPattern(16, 4, [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]),
      bpm,
      variations: ["CL/CL.WAV"], // Random percussive sounds for added texture
    }),
  ];
};
