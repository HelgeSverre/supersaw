import { bpm } from "./store.js";

export const audioContext = new (window.AudioContext ||
  window.webkitAudioContext)();

export async function loadAudioBuffer(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

export function setupTrack(buffer) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  const gainNode = audioContext.createGain();
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  return { source, gainNode };
}

export async function loadTrack(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}
