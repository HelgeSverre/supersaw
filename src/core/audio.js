export const audioContext = new AudioContext();

const mixer = audioContext.createGain();

mixer.connect(audioContext.destination);
export async function loadAudioBuffer(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

export const getDurationFromUrl = async (url) => {
  const buffer = await loadAudioBuffer(url);
  return buffer.duration;
};

export function setupTrack(buffer) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  const gainNode = audioContext.createGain();
  source.connect(gainNode);

  // Connect the gain node to the mixer instead of the destination
  gainNode.connect(mixer);

  return { source, gainNode };
}

export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, "0");

  return `${hours}:${minutes}:${sec}.${ms}`;
}
