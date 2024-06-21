import { Time, TimeOffset } from "./time";

export type AudioBuffer = {
  id: string;
  buffer: AudioBuffer;
};

export type Note = {
  startTime: TimeOffset;
  duration: TimeOffset;
  pitch: number; // MIDI note number
};

export type Clip = {
  id: string;
  startTime: TimeOffset;
  duration: TimeOffset;

  play(startTime: Time, audioContext: AudioContext): void;
  stop(): void;
};

export type Track = {
  id: string;
  clips: Clip[];

  addClip(clip: Clip): void;

  play(startTime: Time): void;

  stop(): void;
};
